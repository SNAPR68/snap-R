-- Social media connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'linkedin'
  platform_user_id TEXT,
  platform_username TEXT,
  platform_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  page_id TEXT, -- For Facebook pages
  page_name TEXT,
  page_access_token TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, platform)
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'linkedin', 'twitter'
  content TEXT NOT NULL,
  image_urls TEXT[], -- Array of image URLs
  video_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'published', 'failed', 'cancelled'
  published_at TIMESTAMP WITH TIME ZONE,
  platform_post_id TEXT, -- ID returned by platform after publishing
  error_message TEXT,
  post_type TEXT, -- 'just_listed', 'open_house', 'price_drop', 'sold', 'custom'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign templates table
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_status TEXT, -- 'new', 'coming_soon', 'open_house', 'price_drop', 'under_contract', 'sold'
  platforms TEXT[], -- ['facebook', 'instagram', 'linkedin']
  caption_template TEXT,
  hashtags TEXT[],
  post_delay_hours INTEGER DEFAULT 0, -- Hours after trigger to post
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto campaign settings per listing
CREATE TABLE IF NOT EXISTS listing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_post_enabled BOOLEAN DEFAULT false,
  platforms TEXT[] DEFAULT ARRAY['facebook', 'instagram'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_listing_campaigns_listing ON listing_campaigns(listing_id);

-- Enable RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own social connections" ON social_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own scheduled posts" ON scheduled_posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view campaign templates" ON campaign_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own listing campaigns" ON listing_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- Insert default campaign templates
INSERT INTO campaign_templates (name, trigger_status, platforms, caption_template, hashtags, post_delay_hours) VALUES
('Just Listed', 'new', ARRAY['facebook', 'instagram', 'linkedin'], '🏡 Just Listed! {{address}} - {{bedrooms}} bed, {{bathrooms}} bath | {{price}} | {{description}}', ARRAY['#JustListed', '#NewListing', '#RealEstate', '#HomeForSale', '#DreamHome'], 0),
('Coming Soon', 'coming_soon', ARRAY['facebook', 'instagram'], '🔜 Coming Soon! Get ready for this amazing property at {{address}}. Stay tuned for more details!', ARRAY['#ComingSoon', '#RealEstate', '#NewListing', '#StayTuned'], 0),
('Open House', 'open_house', ARRAY['facebook', 'instagram', 'linkedin'], '🏠 Open House Alert! Join us at {{address}} | {{open_house_date}} | {{price}}', ARRAY['#OpenHouse', '#RealEstate', '#HomeForSale', '#HouseHunting'], 0),
('Price Reduced', 'price_drop', ARRAY['facebook', 'instagram'], '💰 Price Reduced! {{address}} now offered at {{price}}. Don''t miss this opportunity!', ARRAY['#PriceReduced', '#PriceDrop', '#RealEstate', '#GreatDeal'], 0),
('Under Contract', 'under_contract', ARRAY['facebook', 'instagram'], '🎉 Under Contract! Congratulations to all parties on {{address}}!', ARRAY['#UnderContract', '#RealEstate', '#Sold', '#Congratulations'], 0),
('Just Sold', 'sold', ARRAY['facebook', 'instagram', 'linkedin'], '🎊 SOLD! Another happy homeowner at {{address}}. Thinking of buying or selling? Let''s talk!', ARRAY['#JustSold', '#Sold', '#RealEstate', '#ClosingDay', '#HappyHomeowners'], 0)
ON CONFLICT DO NOTHING;
