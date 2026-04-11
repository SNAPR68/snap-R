-- RevenueCat Integration
-- Adds revenuecat_app_user_id column for cross-referencing RC subscribers.
-- In practice this equals profiles.id, but stored explicitly for RC webhook lookups
-- and future aliasing scenarios where RC might merge subscribers.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenuecat_app_user_id TEXT;

-- Index for RC webhook lookups by app_user_id
CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat_id ON profiles(revenuecat_app_user_id);

-- Backfill: set revenuecat_app_user_id = id for all existing users
UPDATE profiles SET revenuecat_app_user_id = id::text WHERE revenuecat_app_user_id IS NULL;
