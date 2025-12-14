-- Property Sites (mini landing pages)
CREATE TABLE IF NOT EXISTS property_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  template TEXT DEFAULT 'modern',
  custom_colors JSONB,
  agent_info JSONB,
  is_published BOOLEAN DEFAULT true,
  views INT DEFAULT 0,
  leads INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE property_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sites" ON property_sites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sites" ON property_sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sites" ON property_sites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sites" ON property_sites FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view published sites" ON property_sites FOR SELECT USING (is_published = true);

CREATE INDEX idx_property_sites_user ON property_sites(user_id);
CREATE INDEX idx_property_sites_slug ON property_sites(slug);
