-- MLS Auto-Sync Configuration
-- Adds mls_sync_config JSONB column to profiles for per-user MLS sync settings
-- Adds mls_synced_at timestamp to listings to track last MLS sync

-- Profile-level MLS sync configuration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mls_sync_config JSONB DEFAULT NULL;

-- Listing-level sync tracking
ALTER TABLE listings ADD COLUMN IF NOT EXISTS mls_synced_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS previous_price NUMERIC DEFAULT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_status TEXT DEFAULT NULL;

-- Index for cron job to find sync-enabled users
CREATE INDEX IF NOT EXISTS idx_profiles_mls_sync_enabled
  ON profiles USING gin (mls_sync_config);

-- Comment on column for documentation
COMMENT ON COLUMN profiles.mls_sync_config IS 'JSON: { mls_provider, mls_username, mls_password, mls_search_city, mls_search_state, mls_search_postal_code, mls_sync_enabled }';
COMMENT ON COLUMN listings.mls_synced_at IS 'Last time this listing was synced from MLS';
COMMENT ON COLUMN listings.previous_price IS 'Previous price before MLS sync update (for price drop detection)';
