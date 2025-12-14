-- Published Posts tracking
CREATE TABLE IF NOT EXISTS published_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  post_type TEXT,
  template_id TEXT,
  image_url TEXT,
  caption TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  -- Analytics (updated periodically)
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE published_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own published posts" ON published_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own published posts" ON published_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own published posts" ON published_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_published_posts_user ON published_posts(user_id);
CREATE INDEX idx_published_posts_platform ON published_posts(user_id, platform);
