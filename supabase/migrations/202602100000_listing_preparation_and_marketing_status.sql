-- Migration: Split listings.status into preparation_status and marketing_status
-- =============================================================================
-- The legacy 'status' column held two unrelated concepts. This migration adds
-- dedicated columns and backfills from existing data. The status column is
-- deprecated; new code should use preparation_status and marketing_status.
-- =============================================================================

-- 1. Add new columns
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS preparation_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS marketing_status text DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_cost_cents integer DEFAULT 0;

-- 2. Backfill from legacy status (preparation values vs marketing values)
UPDATE listings
SET
  preparation_status = CASE
    WHEN status IN ('pending', 'preparing', 'prepared', 'needs_review', 'failed') THEN status
    ELSE 'pending'
  END,
  marketing_status = CASE
    WHEN status IN ('pending', 'preparing', 'prepared', 'needs_review', 'failed') THEN 'Active'
    WHEN status IS NOT NULL AND status != '' THEN status
    ELSE 'Active'
  END
WHERE status IS NOT NULL;

-- 3. Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_preparation_status
  ON listings(user_id, preparation_status);

CREATE INDEX IF NOT EXISTS idx_listings_marketing_status
  ON listings(user_id, marketing_status);

-- 4. Add comment for deprecation
COMMENT ON COLUMN listings.status IS 'DEPRECATED: Use preparation_status and marketing_status instead';
