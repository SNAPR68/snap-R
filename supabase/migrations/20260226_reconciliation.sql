-- =====================================================
-- Reconciliation Migration (2026-02-26)
-- Closes gaps between schema.sql baseline and code expectations:
--   1. photos.user_id    — upload route inserts user_id
--   2. projects table    — camera page creates/queries projects
--   3. listings.project_id — camera page links listings to projects
-- =====================================================

-- 1. Add user_id to photos (upload route inserts this for direct RLS lookups)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);

-- Also backfill user_id from parent listing (for existing rows)
UPDATE photos p
SET user_id = l.user_id
FROM listings l
WHERE p.listing_id = l.id
  AND p.user_id IS NULL;

-- 2. Create projects table (camera page organises quick-capture listings into projects)
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 3. Add project_id to listings (camera page links each snap-listing to a project)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_listings_project_id ON listings(project_id);
