-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Ensures users can only access their own data
-- =====================================================

-- PROFILES TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- LISTINGS TABLE
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own listings"
  ON listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- PHOTOS TABLE
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photos"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = photos.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create photos for own listings"
  ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = photos.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = photos.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = photos.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

-- ENHANCEMENTS TABLE
ALTER TABLE enhancements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enhancements"
  ON enhancements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM photos 
      JOIN listings ON listings.id = photos.listing_id
      WHERE photos.id = enhancements.photo_id 
      AND listings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create enhancements for own photos"
  ON enhancements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photos 
      JOIN listings ON listings.id = photos.listing_id
      WHERE photos.id = enhancements.photo_id 
      AND listings.user_id = auth.uid()
    )
  );

-- HUMAN EDIT ORDERS TABLE
ALTER TABLE human_edit_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own human edit orders"
  ON human_edit_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own human edit orders"
  ON human_edit_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- API COSTS TABLE (Admin only)
ALTER TABLE api_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access api_costs"
  ON api_costs FOR ALL
  USING (false); -- Only accessible via service role key

-- SYSTEM LOGS TABLE (Admin only)
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access system_logs"
  ON system_logs FOR ALL
  USING (false); -- Only accessible via service role key

-- CONTACT SUBMISSIONS TABLE (Admin only)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only service role can view contact submissions"
  ON contact_submissions FOR SELECT
  USING (false);
