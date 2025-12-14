-- LISTING INTELLIGENCE AI - DATABASE MIGRATION

-- Table 1: Listing Analyses
CREATE TABLE IF NOT EXISTS listing_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  hero_image_index INTEGER,
  hero_image_url TEXT,
  total_photos INTEGER,
  analysis_summary TEXT,
  competitive_benchmark TEXT,
  estimated_dom_current INTEGER,
  estimated_dom_optimized INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Photo Scores
CREATE TABLE IF NOT EXISTS photo_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES listing_analyses(id) ON DELETE CASCADE,
  photo_index INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  lighting_score INTEGER CHECK (lighting_score >= 0 AND lighting_score <= 100),
  composition_score INTEGER CHECK (composition_score >= 0 AND composition_score <= 100),
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  appeal_score INTEGER CHECK (appeal_score >= 0 AND appeal_score <= 100),
  room_type TEXT,
  is_exterior BOOLEAN DEFAULT FALSE,
  is_hero_candidate BOOLEAN DEFAULT FALSE,
  hero_potential INTEGER CHECK (hero_potential >= 1 AND hero_potential <= 10),
  recommendations JSONB DEFAULT '[]',
  enhancement_potential INTEGER,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Enhancement Recommendations
CREATE TABLE IF NOT EXISTS enhancement_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES listing_analyses(id) ON DELETE CASCADE,
  photo_score_id UUID REFERENCES photo_scores(id) ON DELETE CASCADE,
  photo_index INTEGER NOT NULL,
  photo_url TEXT,
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  impact_estimate INTEGER,
  impact_description TEXT,
  reason TEXT,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  result_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listing_analyses_user_id ON listing_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_analyses_status ON listing_analyses(status);
CREATE INDEX IF NOT EXISTS idx_photo_scores_analysis_id ON photo_scores(analysis_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_recommendations_analysis_id ON enhancement_recommendations(analysis_id);

-- RLS
ALTER TABLE listing_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses" ON listing_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON listing_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON listing_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON listing_analyses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own photo scores" ON photo_scores FOR SELECT USING (EXISTS (SELECT 1 FROM listing_analyses WHERE listing_analyses.id = photo_scores.analysis_id AND listing_analyses.user_id = auth.uid()));
CREATE POLICY "Users can insert own photo scores" ON photo_scores FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM listing_analyses WHERE listing_analyses.id = photo_scores.analysis_id AND listing_analyses.user_id = auth.uid()));

CREATE POLICY "Users can view own recommendations" ON enhancement_recommendations FOR SELECT USING (EXISTS (SELECT 1 FROM listing_analyses WHERE listing_analyses.id = enhancement_recommendations.analysis_id AND listing_analyses.user_id = auth.uid()));
CREATE POLICY "Users can insert own recommendations" ON enhancement_recommendations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM listing_analyses WHERE listing_analyses.id = enhancement_recommendations.analysis_id AND listing_analyses.user_id = auth.uid()));
CREATE POLICY "Users can update own recommendations" ON enhancement_recommendations FOR UPDATE USING (EXISTS (SELECT 1 FROM listing_analyses WHERE listing_analyses.id = enhancement_recommendations.analysis_id AND listing_analyses.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_listing_analyses_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_listing_analyses_updated_at ON listing_analyses;
CREATE TRIGGER trigger_listing_analyses_updated_at BEFORE UPDATE ON listing_analyses FOR EACH ROW EXECUTE FUNCTION update_listing_analyses_updated_at();
