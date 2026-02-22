-- ============================================
-- Property Leads Table
-- ============================================
-- Persists lead capture form submissions from property sites.
-- Captures UTM attribution from social post links.
-- Used by: /api/leads (POST from property site, GET/PATCH from dashboard)
-- Dashboard: /dashboard/leads

CREATE TABLE IF NOT EXISTS property_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  property_site_id UUID REFERENCES property_sites(id) ON DELETE SET NULL,

  -- Lead contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,

  -- Attribution (from UTM params on the property site URL)
  utm_source TEXT,      -- instagram, facebook, linkedin, tiktok
  utm_medium TEXT,      -- social
  utm_campaign TEXT,    -- just_listed, open_house, price_drop, sold
  utm_content TEXT,     -- listing ID

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'archived')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE property_leads ENABLE ROW LEVEL SECURITY;

-- Agents can read/update/delete their own leads
DO $$ BEGIN
  CREATE POLICY "Users manage own leads" ON property_leads
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role bypass for API routes and crons
DO $$ BEGIN
  CREATE POLICY "Service role full access leads" ON property_leads
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public visitors can submit leads (INSERT only, no auth required)
DO $$ BEGIN
  CREATE POLICY "Public can submit leads" ON property_leads
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_leads_user ON property_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_property_leads_listing ON property_leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_leads_status ON property_leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_property_leads_email ON property_leads(email);
