-- ============================================
-- Showings Intelligence
-- Tracks property showings, buyer interest, and lead attribution
-- ============================================

CREATE TABLE IF NOT EXISTS showings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  -- Showing details
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  location TEXT,                          -- address or 'virtual'

  -- Contact (buyer / buyer's agent)
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  contact_type TEXT DEFAULT 'buyer'
    CHECK (contact_type IN ('buyer', 'agent', 'investor', 'other')),
  agent_name TEXT,                        -- buyer's agent name if contact_type = 'agent'
  brokerage TEXT,

  -- Status / outcome
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  outcome TEXT
    CHECK (outcome IN ('interested', 'very_interested', 'not_interested', 'offer_submitted', 'unknown')),
  feedback TEXT,                          -- notes from buyer / agent
  interest_level INTEGER                  -- 1–5 rating
    CHECK (interest_level BETWEEN 1 AND 5),

  -- Attribution: which marketing asset brought them
  source TEXT
    CHECK (source IN ('mls', 'property_site', 'social_media', 'email', 'referral', 'open_house', 'direct', 'other')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Internal notes
  agent_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- RLS
-- ----------------------------------------
ALTER TABLE showings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own showings" ON showings
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access showings" ON showings
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- Indexes
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_showings_user ON showings(user_id);
CREATE INDEX IF NOT EXISTS idx_showings_listing ON showings(listing_id);
CREATE INDEX IF NOT EXISTS idx_showings_scheduled ON showings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_showings_status ON showings(status);
