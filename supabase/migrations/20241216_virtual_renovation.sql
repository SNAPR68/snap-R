-- =====================================================
-- VIRTUAL RENOVATION SYSTEM
-- Transform rooms with AI-powered renovations
-- =====================================================

-- Main renovation jobs table
CREATE TABLE IF NOT EXISTS renovations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  
  -- Original image
  original_url TEXT NOT NULL,
  
  -- Renovation settings
  room_type TEXT NOT NULL, -- kitchen, bathroom, bedroom, living-room, exterior
  renovation_type TEXT NOT NULL, -- full-remodel, cabinets, counters, flooring, paint, fixtures
  style TEXT NOT NULL, -- modern, traditional, farmhouse, contemporary, scandinavian, luxury
  
  -- Specific options (JSON for flexibility)
  options JSONB DEFAULT '{}',
  -- Examples:
  -- { "cabinet_color": "white", "counter_material": "quartz", "backsplash": "subway-tile" }
  -- { "floor_type": "hardwood", "floor_color": "natural-oak" }
  -- { "paint_color": "#E8DCC4", "paint_finish": "eggshell" }
  
  -- Results
  result_url TEXT,
  result_urls JSONB DEFAULT '[]', -- Multiple variations
  
  -- Processing
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  processing_time_ms INTEGER,
  
  -- AI details
  model_used TEXT,
  prompt_used TEXT,
  
  -- Cost tracking
  credits_used INTEGER DEFAULT 3,
  api_cost DECIMAL(10, 4),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Renovation presets (saved user preferences)
CREATE TABLE IF NOT EXISTS renovation_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  renovation_type TEXT NOT NULL,
  style TEXT NOT NULL,
  options JSONB DEFAULT '{}',
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_renovations_user ON renovations(user_id);
CREATE INDEX IF NOT EXISTS idx_renovations_listing ON renovations(listing_id);
CREATE INDEX IF NOT EXISTS idx_renovations_status ON renovations(status);
CREATE INDEX IF NOT EXISTS idx_renovations_created ON renovations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_renovation_presets_user ON renovation_presets(user_id);

-- RLS Policies
ALTER TABLE renovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own renovations" ON renovations;
CREATE POLICY "Users can view own renovations"
  ON renovations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create renovations" ON renovations;
CREATE POLICY "Users can create renovations"
  ON renovations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own renovations" ON renovations;
CREATE POLICY "Users can update own renovations"
  ON renovations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own renovations" ON renovations;
CREATE POLICY "Users can delete own renovations"
  ON renovations FOR DELETE
  USING (auth.uid() = user_id);

-- Presets policies
DROP POLICY IF EXISTS "Users can manage own presets" ON renovation_presets;
CREATE POLICY "Users can manage own presets"
  ON renovation_presets FOR ALL
  USING (auth.uid() = user_id);
