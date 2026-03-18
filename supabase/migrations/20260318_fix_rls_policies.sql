-- =====================================================
-- Fix RLS Policies: Scope service role policies (2026-03-18)
-- =====================================================
-- published_posts and notifications had "service role" policies
-- that applied to ALL roles (missing TO service_role), allowing
-- any authenticated user to access/modify all rows.
-- =====================================================

-- Fix published_posts: drop overly permissive policy and recreate with proper scoping
DROP POLICY IF EXISTS "Service role full access" ON published_posts;
CREATE POLICY "Service role full access" ON published_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix notifications: drop overly permissive INSERT policy and recreate with proper scoping
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);
