-- =============================================================
-- Auto-Campaigns: Create campaign tables + extend templates
-- =============================================================
-- These tables power the auto-campaign engine that triggers
-- marketing content when listing status changes (price drop,
-- open house, just listed, sold, etc.)
--
-- Application code already exists in:
--   lib/campaigns/engine.ts
--   lib/campaigns/status-hook.ts
--   lib/campaigns/content-generator.ts
--   app/api/campaigns/route.ts
--   app/dashboard/campaigns/
-- =============================================================

-- 1. CAMPAIGNS — main campaign records
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  template_id UUID REFERENCES campaign_templates(id) ON DELETE SET NULL,
  trigger_status TEXT NOT NULL,        -- just_listed, price_drop, open_house, etc.
  previous_status TEXT,                -- status before the change
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed, cancelled
  total_items INTEGER DEFAULT 0,       -- count of queue items
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CAMPAIGN_QUEUE — individual items to generate & publish
CREATE TABLE IF NOT EXISTS campaign_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,           -- social_post, email, video, property_site_update
  platform TEXT,                        -- instagram, facebook, linkedin, tiktok
  scheduled_for TIMESTAMPTZ NOT NULL,
  content_data JSONB DEFAULT '{}',      -- generated caption, hashtags, CTA, etc.
  preview_image_url TEXT,               -- preview thumbnail
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, published, skipped, failed
  requires_approval BOOLEAN DEFAULT true,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CAMPAIGN_TRIGGERS — per-user automation preferences
CREATE TABLE IF NOT EXISTS campaign_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_status TEXT NOT NULL,          -- just_listed, price_drop, open_house, etc.
  is_active BOOLEAN DEFAULT true,
  auto_approve BOOLEAN DEFAULT false,
  generate_social BOOLEAN DEFAULT true,
  generate_email BOOLEAN DEFAULT true,
  generate_video BOOLEAN DEFAULT false,
  update_property_site BOOLEAN DEFAULT true,
  platforms TEXT[] DEFAULT ARRAY['instagram', 'facebook', 'linkedin'],
  template_id UUID REFERENCES campaign_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trigger_status)
);

-- 4. CAMPAIGN_HISTORY — audit trail
CREATE TABLE IF NOT EXISTS campaign_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                  -- triggered, paused, resumed, cancelled
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ALTER campaign_templates — add columns the engine expects
ALTER TABLE campaign_templates
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_schedule JSONB,
  ADD COLUMN IF NOT EXISTS email_subject_template TEXT,
  ADD COLUMN IF NOT EXISTS email_template TEXT;

-- Mark existing active templates as defaults
UPDATE campaign_templates SET is_default = true WHERE is_active = true;

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_listing ON campaigns(listing_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_queue_user ON campaign_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_queue_campaign ON campaign_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_queue_status_sched ON campaign_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_campaign_queue_listing ON campaign_queue(listing_id);
CREATE INDEX IF NOT EXISTS idx_campaign_triggers_user ON campaign_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_history_campaign ON campaign_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_history_user ON campaign_history(user_id);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_history ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users manage own campaigns"
  ON campaigns FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own campaign queue"
  ON campaign_queue FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own campaign triggers"
  ON campaign_triggers FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own campaign history"
  ON campaign_history FOR ALL USING (auth.uid() = user_id);

-- Service role bypass (for crons, workers, and engine.ts using service key)
CREATE POLICY "Service role full access campaigns"
  ON campaigns FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access campaign_queue"
  ON campaign_queue FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access campaign_triggers"
  ON campaign_triggers FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access campaign_history"
  ON campaign_history FOR ALL TO service_role USING (true);
