-- Create video_render_jobs table for tracking Remotion Lambda render jobs
CREATE TABLE video_render_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  listing_id uuid REFERENCES listings NOT NULL,
  render_id text NOT NULL UNIQUE,
  bucket_name text,
  status text NOT NULL DEFAULT 'queued',
  video_url text,
  input_props jsonb NOT NULL,
  render_time_ms integer,
  cost_cents integer,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('queued', 'rendering', 'completed', 'failed'))
);

-- Create indexes for query performance
CREATE INDEX idx_video_render_jobs_user_id ON video_render_jobs(user_id);
CREATE INDEX idx_video_render_jobs_listing_id ON video_render_jobs(listing_id);
CREATE INDEX idx_video_render_jobs_render_id ON video_render_jobs(render_id);
CREATE INDEX idx_video_render_jobs_status ON video_render_jobs(status);
CREATE INDEX idx_video_render_jobs_created_at ON video_render_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE video_render_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own render jobs
CREATE POLICY "Users can view their own render jobs"
  ON video_render_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role has full access (for admin client and worker inserts/updates)
CREATE POLICY "Service role has full access"
  ON video_render_jobs
  FOR ALL
  USING (auth.role() = 'service_role');
