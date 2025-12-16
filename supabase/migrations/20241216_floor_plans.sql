-- =====================================================
-- FLOOR PLAN SYSTEM
-- Professional floor plans for real estate listings
-- =====================================================

-- Main floor plans table
CREATE TABLE IF NOT EXISTS floor_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Plan details
  name TEXT NOT NULL DEFAULT 'Floor Plan',
  plan_type TEXT NOT NULL DEFAULT '2d-basic', -- 2d-basic, 2d-branded, 3d-isometric, interactive
  
  -- Dimensions
  total_sqft INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  floors INTEGER DEFAULT 1,
  
  -- Room data (for interactive plans)
  rooms JSONB DEFAULT '[]',
  -- Example: [{"name": "Living Room", "sqft": 350, "x": 0, "y": 0, "width": 20, "height": 15}]
  
  -- Files
  image_url TEXT, -- Main floor plan image
  pdf_url TEXT,
  svg_url TEXT,
  thumbnail_url TEXT,
  
  -- Source photos (for AI generation)
  source_photos JSONB DEFAULT '[]',
  
  -- Branding
  include_branding BOOLEAN DEFAULT false,
  brand_logo_url TEXT,
  brand_colors JSONB DEFAULT '{}',
  
  -- Styling
  style TEXT DEFAULT 'modern', -- modern, classic, minimal, detailed
  color_scheme TEXT DEFAULT 'color', -- color, grayscale, blueprint
  show_dimensions BOOLEAN DEFAULT true,
  show_furniture BOOLEAN DEFAULT false,
  show_room_names BOOLEAN DEFAULT true,
  show_sqft BOOLEAN DEFAULT true,
  
  -- Processing
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  processing_method TEXT, -- ai, manual, upload
  error_message TEXT,
  
  -- Cost tracking
  credits_used INTEGER DEFAULT 5,
  price_paid DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Floor plan orders (for manual/professional plans)
CREATE TABLE IF NOT EXISTS floor_plan_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Order details
  plan_type TEXT NOT NULL,
  rush_order BOOLEAN DEFAULT false,
  special_instructions TEXT,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  rush_fee DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, paid, in-progress, review, completed, cancelled
  estimated_delivery TIMESTAMPTZ,
  
  -- Payment
  stripe_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_floor_plans_user ON floor_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_listing ON floor_plans(listing_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_status ON floor_plans(status);
CREATE INDEX IF NOT EXISTS idx_floor_plan_orders_user ON floor_plan_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_floor_plan_orders_status ON floor_plan_orders(status);

-- RLS Policies
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plan_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own floor plans" ON floor_plans;
CREATE POLICY "Users can view own floor plans"
  ON floor_plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create floor plans" ON floor_plans;
CREATE POLICY "Users can create floor plans"
  ON floor_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own floor plans" ON floor_plans;
CREATE POLICY "Users can update own floor plans"
  ON floor_plans FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own floor plans" ON floor_plans;
CREATE POLICY "Users can delete own floor plans"
  ON floor_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON floor_plan_orders;
CREATE POLICY "Users can view own orders"
  ON floor_plan_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON floor_plan_orders;
CREATE POLICY "Users can create orders"
  ON floor_plan_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON floor_plan_orders;
CREATE POLICY "Users can update own orders"
  ON floor_plan_orders FOR UPDATE
  USING (auth.uid() = user_id);
