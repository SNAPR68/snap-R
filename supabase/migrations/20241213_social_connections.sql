-- Social Connections table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'linkedin', 'tiktok'
  platform_id TEXT NOT NULL,
  name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  page_id TEXT, -- For Instagram (linked Facebook page)
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_id)
);

-- Enable RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connections
CREATE POLICY "Users can view own social connections" ON social_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social connections" ON social_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social connections" ON social_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social connections" ON social_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_social_connections_user ON social_connections(user_id);
CREATE INDEX idx_social_connections_platform ON social_connections(user_id, platform);
