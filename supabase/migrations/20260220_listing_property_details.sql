-- Add property detail columns to listings table
-- These columns power property sites, video overlays, MLS exports, and AI description context

ALTER TABLE listings ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bathrooms NUMERIC;  -- allows 2.5
ALTER TABLE listings ADD COLUMN IF NOT EXISTS square_feet INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS property_type TEXT;  -- 'single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial'
ALTER TABLE listings ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lot_size TEXT;       -- e.g. '0.25 acres', '10,890 sqft'
ALTER TABLE listings ADD COLUMN IF NOT EXISTS parking TEXT;        -- e.g. '2-car garage', 'street parking'
ALTER TABLE listings ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;  -- array of feature strings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS mls_number TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hoa_fees NUMERIC;    -- monthly HOA amount
ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Index for property type filtering
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON listings(property_type);

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);

-- Index for MLS number lookups
CREATE INDEX IF NOT EXISTS idx_listings_mls_number ON listings(mls_number);
