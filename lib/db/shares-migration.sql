-- Create shares table for client approval links
CREATE TABLE IF NOT EXISTS shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(20) UNIQUE NOT NULL,
  allow_download BOOLEAN DEFAULT true,
  show_comparison BOOLEAN DEFAULT true,
  password VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create shares for own listings" ON shares
  FOR INSERT WITH CHECK (
    listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own shares" ON shares
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can view share by token" ON shares
  FOR SELECT USING (true);
