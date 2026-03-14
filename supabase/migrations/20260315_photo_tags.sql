-- Photo tags: AI-generated per-photo tags from GPT-4o Vision
CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_type TEXT,
  features TEXT[] DEFAULT '{}',
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  style TEXT,
  atmosphere TEXT,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  reso_features JSONB DEFAULT '{}',
  is_user_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(photo_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photo_tags_listing ON photo_tags(listing_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_user ON photo_tags(user_id);

-- RLS
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photo tags"
  ON photo_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photo tags"
  ON photo_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photo tags"
  ON photo_tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to photo_tags"
  ON photo_tags FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
