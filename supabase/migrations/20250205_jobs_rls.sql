-- =====================================================
-- JOBS TABLE ROW LEVEL SECURITY
-- Ensures users can only access their own jobs
-- =====================================================

-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create jobs for themselves
CREATE POLICY "Users can create own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass (for workers/background jobs)
-- Note: Service role key automatically bypasses RLS
-- This is implicit in Supabase - no policy needed
