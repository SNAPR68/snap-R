-- Add display_order column for photo ordering
ALTER TABLE photos ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add client approval columns
ALTER TABLE photos ADD COLUMN IF NOT EXISTS client_approved BOOLEAN DEFAULT NULL;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS client_feedback TEXT DEFAULT NULL;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_photos_display_order ON photos(listing_id, display_order);

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_photos_approval ON photos(listing_id, client_approved);
