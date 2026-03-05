-- Add virtual tour URL column to listings table for external Matterport/3D tour embeds
ALTER TABLE listings ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_listings_virtual_tour ON listings(virtual_tour_url) WHERE virtual_tour_url IS NOT NULL;
