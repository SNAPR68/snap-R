-- Enable RLS on share_links and approval_events
-- These tables were created in 20241215_client_approvals.sql without RLS

-- ============ SHARE_LINKS ============
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Listing owners can manage their own share links
CREATE POLICY "Owner can manage share links" ON share_links
  FOR ALL USING (
    listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid())
  );

-- Anyone can read active share links (for client-facing share pages)
CREATE POLICY "Public read active links" ON share_links
  FOR SELECT USING (is_active = true);

-- Service role bypass for crons and admin
CREATE POLICY "Service role bypass share_links" ON share_links
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============ APPROVAL_EVENTS ============
ALTER TABLE approval_events ENABLE ROW LEVEL SECURITY;

-- Listing owners can view approval events on their share links
CREATE POLICY "Owner can view approval events" ON approval_events
  FOR SELECT USING (
    share_link_id IN (
      SELECT sl.id FROM share_links sl
      JOIN listings l ON sl.listing_id = l.id
      WHERE l.user_id = auth.uid()
    )
  );

-- Anyone can create approval events (clients clicking approve/reject)
CREATE POLICY "Public insert approval events" ON approval_events
  FOR INSERT WITH CHECK (true);

-- Service role bypass
CREATE POLICY "Service role bypass approval_events" ON approval_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
