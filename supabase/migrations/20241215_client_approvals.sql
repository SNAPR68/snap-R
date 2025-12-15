-- Add approval columns to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE photos ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create share_links table if not exists
CREATE TABLE IF NOT EXISTS share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  client_name TEXT,
  client_email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create approval_events table for tracking
CREATE TABLE IF NOT EXISTS approval_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'approved', 'rejected', 'pending'
  client_name TEXT,
  client_email TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_photos_approval ON photos(approval_status);
