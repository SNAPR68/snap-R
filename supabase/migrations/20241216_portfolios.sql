-- Before/After Portfolio Tables
-- Allows photographers to create public portfolios of their enhancement work

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  slug TEXT UNIQUE NOT NULL, -- Public URL slug
  title TEXT NOT NULL DEFAULT 'My Portfolio',
  tagline TEXT, -- Short description
  description TEXT, -- Full bio/description
  
  -- Branding
  logo_url TEXT,
  cover_image_url TEXT,
  theme TEXT DEFAULT 'dark', -- dark, light, gold
  accent_color TEXT DEFAULT '#D4A017', -- Gold default
  
  -- Contact info (optional, shown on portfolio)
  contact_email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Social links
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  
  -- Settings
  is_public BOOLEAN DEFAULT true,
  show_contact_form BOOLEAN DEFAULT true,
  show_booking_link BOOLEAN DEFAULT false,
  booking_url TEXT,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio showcase items (before/after transformations)
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  -- Images
  before_url TEXT NOT NULL,
  after_url TEXT NOT NULL,
  
  -- Metadata
  title TEXT, -- e.g., "Kitchen Twilight Conversion"
  description TEXT, -- What was done
  enhancement_type TEXT, -- sky-replacement, twilight, staging, etc.
  room_type TEXT, -- exterior, kitchen, living-room, etc.
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  -- Testimonial (optional)
  client_name TEXT,
  client_testimonial TEXT,
  
  -- Tags for filtering
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio contact form submissions
CREATE TABLE IF NOT EXISTS portfolio_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  
  -- Context
  referrer TEXT, -- How they found the portfolio
  
  -- Status
  status TEXT DEFAULT 'new', -- new, read, replied, archived
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_portfolios_slug ON portfolios(slug);
CREATE INDEX idx_portfolios_public ON portfolios(is_public) WHERE is_public = true;
CREATE INDEX idx_portfolio_items_portfolio ON portfolio_items(portfolio_id);
CREATE INDEX idx_portfolio_items_featured ON portfolio_items(portfolio_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_portfolio_inquiries_portfolio ON portfolio_inquiries(portfolio_id);

-- RLS Policies
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_inquiries ENABLE ROW LEVEL SECURITY;

-- Portfolios: owners can do anything, public can view public portfolios
CREATE POLICY "Users can manage own portfolios"
  ON portfolios FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view public portfolios"
  ON portfolios FOR SELECT
  USING (is_public = true);

-- Portfolio items: via portfolio ownership
CREATE POLICY "Users can manage own portfolio items"
  ON portfolio_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_items.portfolio_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view public portfolio items"
  ON portfolio_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_items.portfolio_id 
      AND p.is_public = true
    )
  );

-- Inquiries: anyone can submit, owners can view their own
CREATE POLICY "Anyone can submit inquiries"
  ON portfolio_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own portfolio inquiries"
  ON portfolio_inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_inquiries.portfolio_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own portfolio inquiries"
  ON portfolio_inquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_inquiries.portfolio_id 
      AND p.user_id = auth.uid()
    )
  );

-- Updated_at trigger for portfolios
CREATE TRIGGER trigger_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_descriptions_updated_at();
