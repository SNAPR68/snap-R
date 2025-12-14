-- Content Library (save generated posts for reuse)
CREATE TABLE IF NOT EXISTS content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  platform TEXT,
  post_type TEXT,
  template_id TEXT,
  image_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  property_data JSONB,
  is_favorite BOOLEAN DEFAULT false,
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content" ON content_library FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_content_library_user ON content_library(user_id);
CREATE INDEX idx_content_library_category ON content_library(user_id, category);
CREATE INDEX idx_content_library_favorite ON content_library(user_id, is_favorite) WHERE is_favorite = true;
