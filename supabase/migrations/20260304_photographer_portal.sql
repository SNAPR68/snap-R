-- ============================================
-- Photographer White-Label Portal
-- ============================================
-- Enables photographers to:
--   1. Set up a branded delivery portal (organizations table — was referenced
--      in code but never migrated; this is the canonical creation)
--   2. Manage a client roster across multiple listings
--   3. Generate delivery links per client/listing with tracking
--
-- Used by:
--   /api/photographer/* (API routes)
--   /app/dashboard/photographer (photographer dashboard)
--   /app/deliver/[token] (branded client delivery page, no SnapR branding)
--   /app/api/organization/* (existing org management)
--   /app/org/[slug]/* (existing white-label login pages)
-- ============================================

-- ----------------------------------------
-- 1. ORGANIZATIONS — white-label portal config
--    (referenced in existing code since v1.0 but never migrated)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,               -- becomes /org/[slug] subdomain
  platform_name TEXT,                       -- replaces "SnapR" in UI

  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#D4A017',
  secondary_color TEXT DEFAULT '#1A1A1A',
  accent_color TEXT DEFAULT '#B8860B',

  -- White-label settings
  hide_powered_by BOOLEAN DEFAULT false,
  custom_login_message TEXT,
  custom_support_email TEXT,

  -- Subscription state
  white_label_active BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 2. ORGANIZATION MEMBERS
--    Agents/team members under a photographer org
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

-- ----------------------------------------
-- 3. PHOTOGRAPHER CLIENTS
--    CRM: agents the photographer regularly shoots for
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS photographer_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Client details (agent or homeowner)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  brokerage TEXT,
  notes TEXT,

  -- Stats (denormalized for speed)
  total_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(photographer_id, email)            -- one client record per email per photographer
);

-- ----------------------------------------
-- 4. DELIVERY LINKS
--    Photographer creates one per listing per client.
--    Client visits /deliver/[token] to download their photos.
--    No SnapR branding on that page — shows photographer's brand.
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS delivery_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  client_id UUID REFERENCES photographer_clients(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  token TEXT NOT NULL UNIQUE,               -- 16-char URL-safe random token
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,

  -- Access control
  allow_download BOOLEAN DEFAULT true,
  password_hash TEXT,                       -- bcrypt hash if password-protected
  expires_at TIMESTAMPTZ,                   -- null = never expires

  -- State
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked')),
  viewed_at TIMESTAMPTZ,                    -- first view
  downloaded_at TIMESTAMPTZ,               -- first download
  download_count INTEGER DEFAULT 0,

  -- Message from photographer to client
  message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 5. DELIVERY EVENTS — download audit log
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS delivery_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_link_id UUID NOT NULL REFERENCES delivery_links(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('viewed', 'downloaded', 'downloaded_single', 'password_attempt')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 6. PROFILES — add account_type column
-- ----------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'agent'
    CHECK (account_type IN ('agent', 'photographer', 'broker'));

-- ----------------------------------------
-- RLS — ORGANIZATIONS
-- ----------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org owner full access" ON organizations
    FOR ALL USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public: read active orgs by slug (for branded login pages)
DO $$ BEGIN
  CREATE POLICY "Public read active orgs" ON organizations
    FOR SELECT USING (white_label_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access orgs" ON organizations
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------
-- RLS — ORGANIZATION MEMBERS
-- ----------------------------------------
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org owner manages members" ON organization_members
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id AND o.owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Members can read own membership" ON organization_members
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access members" ON organization_members
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------
-- RLS — PHOTOGRAPHER CLIENTS
-- ----------------------------------------
ALTER TABLE photographer_clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Photographers manage own clients" ON photographer_clients
    FOR ALL USING (photographer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access photographer_clients" ON photographer_clients
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------
-- RLS — DELIVERY LINKS
-- ----------------------------------------
ALTER TABLE delivery_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Photographers manage own delivery links" ON delivery_links
    FOR ALL USING (photographer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public: anyone with the token can view the link record
-- (actual photo access is gated in the API by token lookup)
DO $$ BEGIN
  CREATE POLICY "Public read delivery links by token" ON delivery_links
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access delivery_links" ON delivery_links
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------
-- RLS — DELIVERY EVENTS
-- ----------------------------------------
ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Photographers read own delivery events" ON delivery_events
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM delivery_links dl
        WHERE dl.id = delivery_link_id AND dl.photographer_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access delivery_events" ON delivery_events
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------
-- Indexes
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_photographer_clients_photographer ON photographer_clients(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photographer_clients_email ON photographer_clients(photographer_id, email);
CREATE INDEX IF NOT EXISTS idx_delivery_links_photographer ON delivery_links(photographer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_links_listing ON delivery_links(listing_id);
CREATE INDEX IF NOT EXISTS idx_delivery_links_token ON delivery_links(token);
CREATE INDEX IF NOT EXISTS idx_delivery_links_client ON delivery_links(client_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_link ON delivery_events(delivery_link_id);
