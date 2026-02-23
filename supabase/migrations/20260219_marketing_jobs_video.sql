-- Add video step columns to marketing_jobs for Step 6 (video generation)
-- Follows same pattern as existing step columns (description_status/result, etc.)

ALTER TABLE marketing_jobs
  ADD COLUMN IF NOT EXISTS video_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS video_result JSONB;

-- Add check constraint for valid status values
ALTER TABLE marketing_jobs
  ADD CONSTRAINT marketing_jobs_video_status_check
  CHECK (video_status IN ('pending', 'processing', 'completed', 'skipped', 'failed'));
