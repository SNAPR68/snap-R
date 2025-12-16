-- Smart Photo Culling Tables
-- Stores AI analysis for photo selection and quality scoring

-- Photo cull sessions (batch analysis)
CREATE TABLE IF NOT EXISTS cull_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Session info
  name TEXT,
  total_photos INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER DEFAULT 25, -- How many to select
  
  -- Results
  selected_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, analyzing, completed, failed
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Individual photo scores in a cull session
CREATE TABLE IF NOT EXISTS cull_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES cull_sessions(id) ON DELETE CASCADE,
  
  -- Photo reference
  photo_url TEXT NOT NULL,
  original_index INTEGER NOT NULL, -- Position in original upload order
  
  -- Quality scores (0-100)
  quality_score INTEGER NOT NULL DEFAULT 50,
  blur_score INTEGER DEFAULT 50,
  exposure_score INTEGER DEFAULT 50,
  composition_score INTEGER DEFAULT 50,
  
  -- Classification
  room_type TEXT,
  is_exterior BOOLEAN DEFAULT false,
  
  -- Duplicate detection
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES cull_photos(id),
  similarity_score DECIMAL(5, 2), -- 0-100 similarity to duplicate_of
  
  -- Selection
  is_selected BOOLEAN DEFAULT false,
  selection_reason TEXT,
  recommended_order INTEGER, -- Suggested MLS order (1 = hero, etc.)
  
  -- AI feedback
  ai_feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cull_sessions_user ON cull_sessions(user_id);
CREATE INDEX idx_cull_sessions_listing ON cull_sessions(listing_id);
CREATE INDEX idx_cull_photos_session ON cull_photos(session_id);
CREATE INDEX idx_cull_photos_selected ON cull_photos(session_id, is_selected);
CREATE INDEX idx_cull_photos_duplicate ON cull_photos(duplicate_of);

-- RLS Policies
ALTER TABLE cull_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cull_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cull sessions"
  ON cull_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create cull sessions"
  ON cull_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cull sessions"
  ON cull_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cull sessions"
  ON cull_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Cull photos policies (via session ownership)
CREATE POLICY "Users can view own cull photos"
  ON cull_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cull_sessions cs 
      WHERE cs.id = cull_photos.session_id 
      AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own cull photos"
  ON cull_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cull_sessions cs 
      WHERE cs.id = cull_photos.session_id 
      AND cs.user_id = auth.uid()
    )
  );
