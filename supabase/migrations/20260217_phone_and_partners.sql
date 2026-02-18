-- Phase 5: WhatsApp Notifications + Partner Program
-- Adds phone/notification columns to profiles, creates partner_applications table

-- Part 1: Profile columns for WhatsApp + referral tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_paused_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Part 2: Partner applications table
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  website TEXT,
  partner_type TEXT NOT NULL,
  audience_size TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  referral_code TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns that may be missing if table was created before this migration
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS audience_size TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_apps_email ON partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_apps_referral ON partner_applications(referral_code);

-- RLS (use DO block to avoid error if policies already exist)
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role full access to partner applications"
    ON partner_applications FOR ALL
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can submit partner applications"
    ON partner_applications FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
