-- =====================================================
-- 360° VIRTUAL TOURS SYSTEM
-- Interactive property walkthroughs
-- =====================================================

-- Main virtual tours table
CREATE TABLE IF NOT EXISTS virtual_tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Tour details
  name TEXT NOT NULL DEFAULT 'Virtual Tour',
  description TEXT,
  slug TEXT UNIQUE, -- For public URL: /tour/[slug]
  
  -- Settings
  tour_type TEXT DEFAULT 'standard', -- standard, premium, basic
  auto_rotate BOOLEAN DEFAULT true,
  show_compass BOOLEAN DEFAULT true,
  show_floor_plan BOOLEAN DEFAULT false,
  background_music_url TEXT,
  
  -- Branding
  logo_url TEXT,
  brand_color TEXT DEFAULT '#D4AF37',
  show_branding BOOLEAN DEFAULT true,
  
  -- Cover/Thumbnail
  cover_image_url TEXT,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  avg_time_spent INTEGER DEFAULT 0, -- seconds
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, published, archived
  is_public BOOLEAN DEFAULT false,
  
  -- Pricing
  credits_used INTEGER DEFAULT 5,
  price_paid DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Tour scenes (individual 360° views/rooms)
CREATE TABLE IF NOT EXISTS tour_scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES virtual_tours(id) ON DELETE CASCADE,
  
  -- Scene details
  name TEXT NOT NULL, -- "Living Room", "Kitchen", etc.
  description TEXT,
  
  -- Image
  image_url TEXT NOT NULL, -- 360° panorama or regular photo
  thumbnail_url TEXT,
  is_360 BOOLEAN DEFAULT true, -- true for 360° panoramas, false for flat images
  
  -- Initial view position
  initial_yaw DECIMAL(10, 4) DEFAULT 0, -- horizontal angle (0-360)
  initial_pitch DECIMAL(10, 4) DEFAULT 0, -- vertical angle (-90 to 90)
  initial_zoom DECIMAL(10, 4) DEFAULT 100, -- zoom level (50-120)
  
  -- Navigation
  sort_order INTEGER DEFAULT 0,
  is_start_scene BOOLEAN DEFAULT false, -- First scene when tour loads
  
  -- Floor assignment (for multi-floor properties)
  floor_number INTEGER DEFAULT 1,
  floor_name TEXT DEFAULT 'Main Floor',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotspots (clickable points within scenes)
CREATE TABLE IF NOT EXISTS tour_hotspots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id UUID NOT NULL REFERENCES tour_scenes(id) ON DELETE CASCADE,
  
  -- Position in 360° space
  yaw DECIMAL(10, 4) NOT NULL, -- horizontal position
  pitch DECIMAL(10, 4) NOT NULL, -- vertical position
  
  -- Hotspot type
  hotspot_type TEXT NOT NULL, -- 'navigation', 'info', 'image', 'video', 'link'
  
  -- For navigation hotspots
  target_scene_id UUID REFERENCES tour_scenes(id) ON DELETE SET NULL,
  
  -- For info/content hotspots
  title TEXT,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  
  -- Styling
  icon TEXT DEFAULT 'arrow', -- arrow, info, image, video, link
  color TEXT DEFAULT '#D4AF37',
  size TEXT DEFAULT 'medium', -- small, medium, large
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour analytics
CREATE TABLE IF NOT EXISTS tour_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES virtual_tours(id) ON DELETE CASCADE,
  
  -- Session info
  session_id TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  
  -- Engagement
  scenes_viewed JSONB DEFAULT '[]', -- Array of scene IDs viewed
  total_time_seconds INTEGER DEFAULT 0,
  hotspots_clicked INTEGER DEFAULT 0,
  
  -- Device
  device_type TEXT, -- mobile, desktop, tablet, vr
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_virtual_tours_user ON virtual_tours(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_tours_listing ON virtual_tours(listing_id);
CREATE INDEX IF NOT EXISTS idx_virtual_tours_slug ON virtual_tours(slug);
CREATE INDEX IF NOT EXISTS idx_virtual_tours_status ON virtual_tours(status);
CREATE INDEX IF NOT EXISTS idx_tour_scenes_tour ON tour_scenes(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_hotspots_scene ON tour_hotspots(scene_id);
CREATE INDEX IF NOT EXISTS idx_tour_analytics_tour ON tour_analytics(tour_id);

-- RLS Policies
ALTER TABLE virtual_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_analytics ENABLE ROW LEVEL SECURITY;

-- Virtual tours policies
CREATE POLICY "Users can view own tours" ON virtual_tours 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view published tours" ON virtual_tours 
  FOR SELECT USING (is_public = true AND status = 'published');

CREATE POLICY "Users can create tours" ON virtual_tours 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tours" ON virtual_tours 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tours" ON virtual_tours 
  FOR DELETE USING (auth.uid() = user_id);

-- Scenes policies (inherit from tour ownership)
CREATE POLICY "Users can manage own tour scenes" ON tour_scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM virtual_tours 
      WHERE virtual_tours.id = tour_scenes.tour_id 
      AND virtual_tours.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view published tour scenes" ON tour_scenes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM virtual_tours 
      WHERE virtual_tours.id = tour_scenes.tour_id 
      AND virtual_tours.is_public = true 
      AND virtual_tours.status = 'published'
    )
  );

-- Hotspots policies
CREATE POLICY "Users can manage own hotspots" ON tour_hotspots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tour_scenes 
      JOIN virtual_tours ON virtual_tours.id = tour_scenes.tour_id
      WHERE tour_scenes.id = tour_hotspots.scene_id 
      AND virtual_tours.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view published tour hotspots" ON tour_hotspots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tour_scenes 
      JOIN virtual_tours ON virtual_tours.id = tour_scenes.tour_id
      WHERE tour_scenes.id = tour_hotspots.scene_id 
      AND virtual_tours.is_public = true 
      AND virtual_tours.status = 'published'
    )
  );

-- Analytics - anyone can write (for tracking), only owner can read
CREATE POLICY "Anyone can log tour analytics" ON tour_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own tour analytics" ON tour_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM virtual_tours 
      WHERE virtual_tours.id = tour_analytics.tour_id 
      AND virtual_tours.user_id = auth.uid()
    )
  );

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_tour_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := lower(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating slug
DROP TRIGGER IF EXISTS set_tour_slug ON virtual_tours;
CREATE TRIGGER set_tour_slug
  BEFORE INSERT ON virtual_tours
  FOR EACH ROW
  EXECUTE FUNCTION generate_tour_slug();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_tour_views(tour_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE virtual_tours 
  SET view_count = view_count + 1 
  WHERE slug = tour_slug;
END;
$$ LANGUAGE plpgsql;
