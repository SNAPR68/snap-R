-- Auto-post rules
CREATE TABLE IF NOT EXISTS auto_post_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'listing_created', 'status_changed', 'price_changed'
  trigger_value TEXT, -- e.g., 'active', 'pending', 'sold'
  platforms TEXT[] NOT NULL, -- ['instagram', 'facebook']
  post_type TEXT NOT NULL, -- 'just-listed', 'under-contract', etc.
  template_id TEXT,
  include_caption BOOLEAN DEFAULT true,
  include_hashtags BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auto_post_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rules" ON auto_post_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON auto_post_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON auto_post_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON auto_post_rules FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_auto_post_rules_user ON auto_post_rules(user_id);
CREATE INDEX idx_auto_post_rules_active ON auto_post_rules(user_id, is_active) WHERE is_active = true;
