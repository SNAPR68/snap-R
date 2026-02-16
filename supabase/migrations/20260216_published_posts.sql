-- Published Posts tracking (for analytics dashboard)
-- Mirrors 20241213_post_analytics.sql — safe to re-apply with IF NOT EXISTS
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
  -- Analytics (updated by sync-analytics cron)
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

-- RLS policies (IF NOT EXISTS not supported for policies, use DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'published_posts' AND policyname = 'Users can view own published posts') THEN
    CREATE POLICY "Users can view own published posts" ON published_posts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'published_posts' AND policyname = 'Users can insert own published posts') THEN
    CREATE POLICY "Users can insert own published posts" ON published_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'published_posts' AND policyname = 'Users can update own published posts') THEN
    CREATE POLICY "Users can update own published posts" ON published_posts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role bypass for cron publisher (operates across users)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'published_posts' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON published_posts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_published_posts_user ON published_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_published_posts_platform ON published_posts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_published_posts_sync ON published_posts(last_synced_at) WHERE platform_post_id IS NOT NULL;
