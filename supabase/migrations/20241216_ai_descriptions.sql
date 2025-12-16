-- AI Listing Description Generator
-- Stores AI-generated MLS descriptions for listings

CREATE TABLE IF NOT EXISTS ai_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Generation settings
  tone TEXT NOT NULL DEFAULT 'professional', -- professional, luxury, casual, first_time_buyer
  length TEXT NOT NULL DEFAULT 'medium', -- short (150 chars), medium (500 chars), full (2000 chars)
  
  -- Generated content
  content TEXT NOT NULL,
  headline TEXT, -- Short catchy headline
  
  -- AI Analysis data
  photo_analysis JSONB, -- What AI detected in photos
  detected_features JSONB, -- bedrooms, bathrooms, pool, etc.
  seo_keywords TEXT[],
  
  -- Metadata
  character_count INTEGER,
  word_count INTEGER,
  model_used TEXT DEFAULT 'gpt-4o',
  generation_cost DECIMAL(10, 4),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_descriptions_listing ON ai_descriptions(listing_id);
CREATE INDEX idx_ai_descriptions_user ON ai_descriptions(user_id);
CREATE INDEX idx_ai_descriptions_created ON ai_descriptions(created_at DESC);

-- RLS Policies
ALTER TABLE ai_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own descriptions"
  ON ai_descriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own descriptions"
  ON ai_descriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own descriptions"
  ON ai_descriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own descriptions"
  ON ai_descriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_descriptions_updated_at
  BEFORE UPDATE ON ai_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_descriptions_updated_at();
