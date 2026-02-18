-- Brand Profiles table for marketing content and property sites
-- Used by: /api/brand, onboarding step 4, brand-form component

CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  logo_url TEXT,
  brokerage_logo_url TEXT,
  primary_color TEXT DEFAULT '#D4AF37',
  secondary_color TEXT DEFAULT '#1A1A1A',
  phone TEXT,
  email TEXT,
  website TEXT,
  brokerage_name TEXT,
  license_number TEXT,
  tagline TEXT,
  social_handles JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Row Level Security
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own brand profile
CREATE POLICY "Users can view own brand profile"
  ON brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand profile"
  ON brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand profile"
  ON brand_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role full access (for admin, crons)
CREATE POLICY "Service role full access to brand profiles"
  ON brand_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
