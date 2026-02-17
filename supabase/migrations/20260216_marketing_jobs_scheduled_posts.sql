-- Add Step 5 (scheduled posts) tracking to marketing_jobs
ALTER TABLE marketing_jobs
  ADD COLUMN IF NOT EXISTS scheduled_posts_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (scheduled_posts_status IN ('pending', 'processing', 'completed', 'skipped', 'failed'));

ALTER TABLE marketing_jobs
  ADD COLUMN IF NOT EXISTS scheduled_posts_result JSONB;
