-- =====================================================
-- Social Connections Column Reconciliation (2026-02-26)
-- =====================================================
-- The original 20241213_social_connections.sql created the table with
-- a minimal schema (expires_at, platform_id). The later
-- 20241216_social_connections.sql attempted to CREATE TABLE IF NOT EXISTS
-- with the full schema — but Postgres skipped it since the table existed.
-- This migration adds all missing columns idempotently.
-- =====================================================

-- Core identity columns
ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS platform_user_id TEXT,
  ADD COLUMN IF NOT EXISTS platform_username TEXT;

-- Rename platform_id → platform_user_id if needed (platform_id may still exist)
-- Safe: we add platform_user_id above, then backfill from platform_id if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_connections' AND column_name = 'platform_id'
  ) THEN
    UPDATE social_connections
    SET platform_user_id = platform_id
    WHERE platform_user_id IS NULL AND platform_id IS NOT NULL;
  END IF;
END $$;

-- OAuth token columns
ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Backfill token_expires_at from expires_at if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_connections' AND column_name = 'expires_at'
  ) THEN
    UPDATE social_connections
    SET token_expires_at = expires_at
    WHERE token_expires_at IS NULL AND expires_at IS NOT NULL;
  END IF;
END $$;

-- Platform-specific data columns
ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pages JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS instagram_account JSONB,
  ADD COLUMN IF NOT EXISTS linkedin_urn TEXT,
  ADD COLUMN IF NOT EXISTS default_page_id TEXT;

-- Status / audit columns
ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_social_connections_active ON social_connections(user_id, is_active) WHERE is_active = true;

-- Drop the old UNIQUE constraint (user, platform, platform_id) and replace with (user, platform)
-- so each user has one connection per platform (not per account)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'social_connections'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%platform_id%'
  ) THEN
    ALTER TABLE social_connections DROP CONSTRAINT IF EXISTS social_connections_user_id_platform_platform_id_key;
  END IF;
END $$;

-- Add the correct unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'social_connections'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'social_connections_user_id_platform_key'
  ) THEN
    ALTER TABLE social_connections ADD CONSTRAINT social_connections_user_id_platform_key UNIQUE (user_id, platform);
  END IF;
END $$;

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_social_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS social_connection_updated ON social_connections;
CREATE TRIGGER social_connection_updated
  BEFORE UPDATE ON social_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_social_connection_timestamp();
