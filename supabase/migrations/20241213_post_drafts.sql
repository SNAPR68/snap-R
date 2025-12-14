-- Post Drafts table
CREATE TABLE IF NOT EXISTS post_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  name TEXT,
  platform TEXT NOT NULL,
  post_type TEXT NOT NULL,
  template_id TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT,
  property_data JSONB,
  brand_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts" ON post_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own drafts" ON post_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON post_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON post_drafts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_post_drafts_user ON post_drafts(user_id);
