-- ============================================
-- CMA Reports Table
-- ============================================
-- Persists Comparative Market Analysis reports generated via /api/cma.
-- The CMA API already attempts to insert into this table (silently fails
-- if it doesn't exist). This migration creates the backing table.
-- Used by: /api/cma (POST to save, GET to fetch history)

CREATE TABLE IF NOT EXISTS cma_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  -- CMA data (JSONB)
  comparables JSONB NOT NULL,          -- Array of comparable sale objects
  pricing JSONB NOT NULL,              -- {recommended, rangeLow, rangeHigh}
  agent_info JSONB,                    -- {name, phone, email, brokerage}

  -- Generated content
  narrative TEXT,                       -- AI-generated market analysis narrative
  title TEXT,                           -- Human-friendly report name (optional)

  -- Status
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'draft')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cma_reports_user ON cma_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_cma_reports_listing ON cma_reports(listing_id);

-- RLS
ALTER TABLE cma_reports ENABLE ROW LEVEL SECURITY;

-- Users can manage their own CMA reports
DO $$ BEGIN
  CREATE POLICY "Users manage own CMA reports" ON cma_reports
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role bypass for API routes
DO $$ BEGIN
  CREATE POLICY "Service role full access CMA reports" ON cma_reports
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
