-- =====================================================
-- SOCIAL CONNECTIONS TABLE
-- Store OAuth tokens for Facebook, Instagram, LinkedIn
-- =====================================================

-- Main social connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Platform info
  platform TEXT NOT NULL, -- facebook, instagram, linkedin, tiktok, twitter
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  
  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Platform-specific data
  profile_data JSONB DEFAULT '{}',
  pages JSONB DEFAULT '[]', -- Facebook pages
  instagram_account JSONB, -- Connected Instagram business account
  linkedin_urn TEXT, -- LinkedIn person URN
  
  -- Selected defaults
  default_page_id TEXT, -- Default Facebook page to post to
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one connection per platform per user
  UNIQUE(user_id, platform)
);

-- Social posts log (track what was published)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES social_connections(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Post details
  platform TEXT NOT NULL,
  post_id TEXT, -- Platform's post ID
  post_url TEXT,
  
  -- Content
  content_text TEXT,
  image_urls JSONB DEFAULT '[]',
  video_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, published, failed, scheduled
  error_message TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'scheduled';

-- RLS Policies
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Social connections policies
CREATE POLICY "Users can view own connections" ON social_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create connections" ON social_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON social_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON social_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Social posts policies
CREATE POLICY "Users can view own posts" ON social_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create posts" ON social_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON social_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
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
