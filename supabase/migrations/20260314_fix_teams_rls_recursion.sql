-- Fix teams RLS infinite recursion
-- Root cause: team_members SELECT policy referenced team_members itself, causing infinite recursion
-- Solution: Create a SECURITY DEFINER function that bypasses RLS to check membership

-- 1. Create helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
$$;

-- 2. Drop existing recursive policies on team_members
DROP POLICY IF EXISTS "Team members can view their team" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view fellow members" ON public.team_members;

-- 3. Recreate with non-recursive policy using the helper function
CREATE POLICY "Team members can view fellow members"
  ON public.team_members
  FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));

-- 4. Also fix teams table policies if they reference team_members
DROP POLICY IF EXISTS "Team members can view their team" ON public.teams;

CREATE POLICY "Team members can view their team"
  ON public.teams
  FOR SELECT
  USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );
