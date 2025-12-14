-- Scheduled Posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'linkedin', 'tiktok'
  post_type TEXT NOT NULL, -- 'just-listed', 'open-house', etc.
  template_id TEXT NOT NULL,
  image_url TEXT, -- Stored rendered image
  caption TEXT,
  hashtags TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed', 'cancelled'
  published_at TIMESTAMPTZ,
  published_post_id TEXT, -- ID from platform after publishing
  error_message TEXT,
  property_data JSONB, -- Store property details at time of creation
  brand_data JSONB, -- Store brand details at time of creation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled posts" ON scheduled_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled posts" ON scheduled_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts" ON scheduled_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts" ON scheduled_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status, scheduled_at);
CREATE INDEX idx_scheduled_posts_scheduled ON scheduled_posts(scheduled_at) WHERE status = 'scheduled';
