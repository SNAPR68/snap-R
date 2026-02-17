-- Add tools_applied column to photos table
-- Stores array of tool IDs applied during preparation (e.g., ['sky-replacement', 'auto-enhance'])
ALTER TABLE photos ADD COLUMN IF NOT EXISTS tools_applied text[] DEFAULT NULL;
