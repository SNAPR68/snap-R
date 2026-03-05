-- ============================================
-- Open House Events & Check-in System
-- Supports multi-attendee public check-in for open house events
-- ============================================

-- Open House Events (distinct from private showings)
CREATE TABLE IF NOT EXISTS open_house_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,

  -- Public access
  event_slug TEXT NOT NULL UNIQUE,
  is_published BOOLEAN DEFAULT true,
  max_attendees INTEGER,

  -- Stats (denormalized)
  checkin_count INTEGER DEFAULT 0,

  status TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendees who checked in
CREATE TABLE IF NOT EXISTS open_house_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES open_house_events(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  contact_type TEXT DEFAULT 'buyer'
    CHECK (contact_type IN ('buyer', 'agent', 'investor', 'neighbor', 'other')),
  brokerage TEXT,

  checked_in_at TIMESTAMPTZ DEFAULT NOW(),

  -- Feedback (filled after tour)
  interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 5),
  feedback TEXT,
  wants_follow_up BOOLEAN DEFAULT false,

  -- Attribution
  source TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- RLS: open_house_events
-- ----------------------------------------
ALTER TABLE open_house_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own open house events" ON open_house_events
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view published open house events" ON open_house_events
    FOR SELECT TO anon USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access open house events" ON open_house_events
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- RLS: open_house_attendees
-- ----------------------------------------
ALTER TABLE open_house_attendees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users view attendees of own events" ON open_house_attendees
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM open_house_events
        WHERE open_house_events.id = open_house_attendees.event_id
          AND open_house_events.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can check in to open houses" ON open_house_attendees
    FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access open house attendees" ON open_house_attendees
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- Indexes
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_open_house_events_slug ON open_house_events(event_slug);
CREATE INDEX IF NOT EXISTS idx_open_house_events_user ON open_house_events(user_id);
CREATE INDEX IF NOT EXISTS idx_open_house_events_listing ON open_house_events(listing_id);
CREATE INDEX IF NOT EXISTS idx_open_house_attendees_event ON open_house_attendees(event_id);
