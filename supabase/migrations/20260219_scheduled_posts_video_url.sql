-- Add video_url column to scheduled_posts for video publishing
-- Allows scheduled posts to carry a video URL (from marketing pipeline Step 6)
-- alongside the existing image_urls array

ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Comment: When video_url is present, the cron publisher uses video-specific
-- publishing logic (FB /videos, IG Reels container flow) instead of image publishing.
