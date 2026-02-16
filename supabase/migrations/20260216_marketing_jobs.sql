-- Phase 2: Marketing Automation Layer
-- Creates marketing_jobs table for tracking automated marketing pipeline

CREATE TABLE IF NOT EXISTS marketing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),

  -- Per-step status tracking
  description_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (description_status IN ('pending', 'processing', 'completed', 'skipped', 'failed')),
  captions_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (captions_status IN ('pending', 'processing', 'completed', 'skipped', 'failed')),
  mls_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (mls_status IN ('pending', 'processing', 'completed', 'skipped', 'failed')),
  property_site_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (property_site_status IN ('pending', 'processing', 'completed', 'skipped', 'failed')),

  -- Artifacts (JSONB)
  description_result JSONB,
  captions_result JSONB,
  mls_result JSONB,
  property_site_result JSONB,

  -- Cost tracking
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  cost_breakdown JSONB,

  -- Metadata
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_marketing_jobs_listing ON marketing_jobs(listing_id);
CREATE INDEX idx_marketing_jobs_user ON marketing_jobs(user_id);
CREATE INDEX idx_marketing_jobs_status ON marketing_jobs(status);

-- RLS
ALTER TABLE marketing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marketing jobs"
  ON marketing_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to marketing jobs"
  ON marketing_jobs FOR ALL
  USING (auth.role() = 'service_role');
