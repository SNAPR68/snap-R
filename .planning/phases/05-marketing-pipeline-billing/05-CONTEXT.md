# Phase 5 Context: Marketing Pipeline + Billing

## Phase Goal
Wire video generation into the marketing pipeline as Step 6, enforce billing gates, track costs, and display results in the Marketing Results Panel.

## Key Decisions

### Architecture: Fire-and-Forget
- Video rendering takes 30-90s (much longer than other marketing steps)
- Marketing handler triggers the render and records `renderId` immediately
- Sets `video_status: 'rendering'` — doesn't block other steps
- Video status endpoint already handles render completion detection
- Marketing results panel shows "Rendering..." until complete, then shows video player
- This preserves always-complete semantics: video failure ≠ marketing failure

### Template Auto-Selection
- Default: `property-showcase` (most versatile, works for any listing)
- No listing status detection needed in Phase 5 (Phase 7 adds PriceDrop/Sold auto-routing)
- Aspect ratio: `9:16` by default (most popular for social: Reels, Stories, TikTok)

### Billing Gate
- Free/Starter: `video_status: 'skipped'` with upgrade prompt
- Pro/Agency: Full video generation
- Consistent with existing marketing billing (free = entire pipeline skipped, starter = partial)
- Video cost: ~$1.50 per render (Lambda + S3) tracked in cost_breakdown

### Video in Scheduled Posts
- `scheduled_posts.video_url` column already exists in the DB
- Step 5 currently schedules image posts; upgrade to include video URL when available
- BUT: video may not be ready when Step 5 runs (fire-and-forget)
- Solution: Schedule a separate video post entry after render completes (not in marketing handler)
- This is deferred to Phase 6 (publishing integration)

### Storage / CDN
- Remotion Lambda outputs to S3 with public URL
- S3 URL is already accessible — no R2/Cloudinary cascade needed for MVP
- Phase 6 can add CDN optimization if needed
- For now: `video_url` from `video_render_jobs` is the delivery URL

## Existing Infrastructure
- `marketing_jobs` table: 5 step status/result column pairs + cost tracking
- `video_render_jobs` table: tracks render lifecycle with `video_url`, `cost_cents`
- Marketing handler: Cloudflare Worker with sequential steps + always-complete
- Marketing status API: Returns all step data to frontend
- Marketing Results Panel: 5 collapsible sections
- Marketing Banner: Progress dots for 5 steps
- `scheduled_posts.video_url` column exists

## What This Phase Does NOT Include
- Video publishing to social platforms (Phase 6)
- Agent branding in videos (Phase 6)
- PriceDrop/Sold template auto-selection (Phase 7)
- R2/Cloudinary CDN cascade (deferred — S3 URL is fine for now)
