-- Lead activity timeline and notes
-- Tracks every interaction with a lead (view, email sent, call, note, status change, etc.)

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES property_leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note', 'call', 'email', 'text', 'showing', 'status_change',
    'drip_email_sent', 'property_site_viewed', 'form_submitted', 'auto'
  )),
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_activities_lead_id_idx ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS lead_activities_user_id_idx ON lead_activities(user_id);
CREATE INDEX IF NOT EXISTS lead_activities_created_at_idx ON lead_activities(created_at DESC);

ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lead activities"
  ON lead_activities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role bypass lead activities"
  ON lead_activities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add score + notes columns to property_leads
ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Auto-update last_activity_at when activity is inserted
CREATE OR REPLACE FUNCTION update_lead_last_activity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE property_leads
  SET last_activity_at = NEW.created_at
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_activity_timestamp ON lead_activities;
CREATE TRIGGER lead_activity_timestamp
  AFTER INSERT ON lead_activities
  FOR EACH ROW EXECUTE FUNCTION update_lead_last_activity();
