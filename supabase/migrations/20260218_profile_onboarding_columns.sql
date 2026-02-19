-- Add missing profile columns for onboarding flow and plan management
-- These columns are used by: onboarding page, dashboard layout, auth callback

-- Onboarding and role data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Plan and billing data (from pricing page + Stripe)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selected_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS listings_limit INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS listings_per_month TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS price_per_listing NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
