-- Short-form video: add hook_text column to video_render_jobs for AI-generated hooks
ALTER TABLE video_render_jobs
  ADD COLUMN IF NOT EXISTS hook_text TEXT,
  ADD COLUMN IF NOT EXISTS short_form_template TEXT CHECK (
    short_form_template IS NULL OR
    short_form_template IN ('teaser', 'reminder', 'alert', 'celebration', 'highlight')
  );
