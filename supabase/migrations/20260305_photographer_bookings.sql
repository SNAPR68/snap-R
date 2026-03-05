-- ============================================
-- Photographer Booking System
-- ============================================
-- Enables agents to book shoots through photographer's branded URL
-- Booking creates a draft listing pre-populated with property details

-- Photographer packages (pricing tiers)
CREATE TABLE IF NOT EXISTS photographer_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,

  -- What's included
  includes_photos BOOLEAN DEFAULT true,
  max_photos INTEGER DEFAULT 25,
  includes_video BOOLEAN DEFAULT false,
  includes_drone BOOLEAN DEFAULT false,
  includes_floor_plan BOOLEAN DEFAULT false,
  includes_virtual_staging BOOLEAN DEFAULT false,
  includes_twilight BOOLEAN DEFAULT false,

  -- Settings
  estimated_duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking requests from agents
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES photographer_packages(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,

  -- Agent/client info
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  client_brokerage TEXT,

  -- Property details
  property_address TEXT NOT NULL,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_type TEXT,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  square_feet INTEGER,

  -- Scheduling
  preferred_date DATE,
  preferred_time TEXT,
  confirmed_date DATE,
  confirmed_time TIME,

  -- Booking details
  special_instructions TEXT,
  access_info TEXT,
  add_ons TEXT[],

  -- Pricing
  quoted_price_cents INTEGER,

  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'shot', 'editing', 'delivered', 'cancelled', 'invoiced')),

  -- Payment
  payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'invoiced', 'paid', 'refunded')),
  stripe_payment_intent_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photographer availability
CREATE TABLE IF NOT EXISTS photographer_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  weekly_schedule JSONB DEFAULT '{
    "monday": {"start": "09:00", "end": "17:00", "available": true},
    "tuesday": {"start": "09:00", "end": "17:00", "available": true},
    "wednesday": {"start": "09:00", "end": "17:00", "available": true},
    "thursday": {"start": "09:00", "end": "17:00", "available": true},
    "friday": {"start": "09:00", "end": "17:00", "available": true},
    "saturday": {"start": "10:00", "end": "14:00", "available": true},
    "sunday": {"start": null, "end": null, "available": false}
  }'::jsonb,

  max_shoots_per_day INTEGER DEFAULT 4,
  blocked_dates DATE[] DEFAULT '{}',
  buffer_minutes INTEGER DEFAULT 30,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(photographer_id)
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE photographer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_availability ENABLE ROW LEVEL SECURITY;

-- Packages
DO $$ BEGIN
  CREATE POLICY "Photographers manage own packages" ON photographer_packages
    FOR ALL USING (photographer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public reads active packages" ON photographer_packages
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access packages" ON photographer_packages
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Booking requests
DO $$ BEGIN
  CREATE POLICY "Photographers manage own bookings" ON booking_requests
    FOR ALL USING (photographer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access bookings" ON booking_requests
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Availability
DO $$ BEGIN
  CREATE POLICY "Photographers manage own availability" ON photographer_availability
    FOR ALL USING (photographer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public reads availability" ON photographer_availability
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access availability" ON photographer_availability
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_photographer_packages_photographer ON photographer_packages(photographer_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_photographer ON booking_requests(photographer_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_date ON booking_requests(preferred_date);
CREATE INDEX IF NOT EXISTS idx_photographer_availability_photographer ON photographer_availability(photographer_id);
