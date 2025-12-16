-- =============================================
-- TEAMS & MULTI-USER ACCOUNTS
-- Safe migration: Only ADDS, never DROPS
-- =============================================

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'team',
  credits INTEGER DEFAULT 500,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team invites table
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add team_id to listings (nullable, won't affect existing rows)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'team_id') THEN
    ALTER TABLE listings ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add current_team_id to profiles (nullable, won't affect existing rows)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_team_id') THEN
    ALTER TABLE profiles ADD COLUMN current_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- =============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams they belong to"
  ON teams FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners can update their teams"
  ON teams FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their teams"
  ON teams FOR DELETE
  USING (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Team members can view their team members"
  ON team_members FOR SELECT
  USING (
    team_id IN (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid())
  );

CREATE POLICY "Admins can add team members"
  ON team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update team members"
  ON team_members FOR UPDATE
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins or self can remove team members"
  ON team_members FOR DELETE
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()
  );

-- Team invites policies
CREATE POLICY "Team admins can view invites"
  ON team_invites FOR SELECT
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins can create invites"
  ON team_invites FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins can delete invites"
  ON team_invites FOR DELETE
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
    )
  );

-- =============================================
-- ADDITIONAL POLICIES FOR TEAM ACCESS TO LISTINGS
-- These ADD to existing policies, don't replace them
-- =============================================

CREATE POLICY "Team members can view team listings"
  ON listings FOR SELECT
  USING (
    team_id IN (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid())
  );

CREATE POLICY "Team editors can update team listings"
  ON listings FOR UPDATE
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Team editors can create team listings"
  ON listings FOR INSERT
  WITH CHECK (
    team_id IS NULL OR
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Team admins can delete team listings"
  ON listings FOR DELETE
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
    )
  );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_listings_team_id ON listings(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
