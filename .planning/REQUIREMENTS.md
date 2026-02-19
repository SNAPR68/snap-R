# Requirements: SnapR v1.1 Video Engine

**Defined:** 2026-02-19
**Core Value:** One upload, everything automated — now including professional property videos with zero user effort.

## v1.1 Requirements

Requirements for the Video Engine milestone. Each maps to roadmap phases.

### Rendering Infrastructure (REND)

- [x] **REND-01**: Remotion Lambda deployed to AWS with S3 output bucket and IAM roles configured (Partially — composition ready, Lambda deployment in Plan 01-02)
- [ ] **REND-02**: `/api/video/generate` API route accepts listing ID, template, aspect ratio, and options — triggers Lambda render
- [ ] **REND-03**: `/api/video/status` API route returns render progress (queued/rendering/completed/failed) with video URL on completion
- [ ] **REND-04**: Rendered videos copy from S3 to R2/Cloudinary for permanent CDN delivery
- [x] **REND-05**: `video_render_jobs` database table tracks render ID, status, input props, output URL, render time, cost
- [ ] **REND-06**: Render errors handled gracefully — failed renders don't crash pipeline, user sees actionable error message

### Video Compositions (COMP)

- [ ] **COMP-01**: PropertyShowcase template renders photo slideshow with text overlays (address, price, bed/bath/sqft) and fade transitions
- [ ] **COMP-02**: JustListed template renders intro card ("JUST LISTED"), photo slideshow, feature callouts, and agent branding end card
- [ ] **COMP-03**: OpenHouse template renders date/time urgency, fast-paced slideshow with event details
- [ ] **COMP-04**: PriceDrop template renders old price → new price animation with urgency styling
- [ ] **COMP-05**: Sold template renders celebration styling with social proof ("Sold in X days")
- [ ] **COMP-06**: All templates render correctly in 9:16 (Reels), 1:1 (Feed), and 16:9 (Landscape) using percentage-based sizing
- [ ] **COMP-07**: All templates use Remotion's `<Img>` component for frame-accurate photo loading with fallback for failed images
- [ ] **COMP-08**: Transitions supported: fade (default), slide, zoom/Ken Burns — selectable per video

### Audio (AUDIO)

- [ ] **AUDIO-01**: Background music plays during video from royalty-free library (minimum 5 tracks)
- [ ] **AUDIO-02**: Music volume ducks to 25-30% when voiceover is active, 60% otherwise
- [ ] **AUDIO-03**: Existing voiceover service integrated — voiceover MP3 URL passed to composition via `<Audio>` component
- [ ] **AUDIO-04**: Audio fades in at video start and out at video end (1-2 second ramp)
- [ ] **AUDIO-05**: Videos render with silent audio track when no music/voiceover selected (platform compatibility)

### Agent Branding (BRAND)

- [ ] **BRAND-01**: Agent can configure branding (logo, brand colors, contact info) in settings — persists as default for all videos
- [ ] **BRAND-02**: End card displays agent name, phone, logo, and brand colors
- [ ] **BRAND-03**: Brand colors applied to text overlays, intro cards, and end cards across all templates
- [ ] **BRAND-04**: Branding can be overridden per-video in VideoCreator UI

### Marketing Pipeline (PIPE)

- [ ] **PIPE-01**: Video generation triggers automatically as Step 6 in `marketing-handler.ts` when listing preparation completes
- [ ] **PIPE-02**: Template auto-selected based on listing status (new → Just Listed, open house scheduled → Open House, price drop → Price Drop, sold → Sold, default → Showcase)
- [ ] **PIPE-03**: `marketing_jobs` table extended with `video_status` and `video_result` columns following existing per-step pattern
- [ ] **PIPE-04**: Video step follows always-complete semantics — video failure does not block other marketing steps
- [ ] **PIPE-05**: Generated video auto-scheduled to `scheduled_posts` for connected social platforms
- [ ] **PIPE-06**: Free/Starter tier users get video step skipped (consistent with existing marketing billing gate)

### Video Publishing (PUB)

- [ ] **PUB-01**: Video publishes to Instagram Reels via existing `publishToInstagram()` with video content type
- [ ] **PUB-02**: Video publishes to Facebook via existing `publishToFacebook()` with video content type
- [ ] **PUB-03**: LinkedIn video publishing implemented (replace current 501 stub)
- [ ] **PUB-04**: Published video posts tracked in `published_posts` with analytics columns (existing pattern)
- [ ] **PUB-05**: Cron publisher (`publish-scheduled`) handles video posts with same billing gates as photo posts

### UI (UI)

- [ ] **UI-01**: VideoCreator.tsx refactored to call `/api/video/generate` instead of browser-side FFmpeg.wasm
- [ ] **UI-02**: Render progress shown in UI (polling `/api/video/status`) with progress bar or status indicator
- [ ] **UI-03**: Template selector dropdown with preview thumbnails for each template
- [ ] **UI-04**: Aspect ratio selector (9:16, 1:1, 16:9) with visual preview of output dimensions
- [ ] **UI-05**: Music track selector with audio preview
- [ ] **UI-06**: Voiceover toggle (use existing voiceover or skip)
- [ ] **UI-07**: Generated video playable in-app before publishing
- [ ] **UI-08**: Marketing Results Panel shows video artifact alongside existing 5 marketing results

### Billing (BILL)

- [ ] **BILL-01**: `getPlanLimits()` extended with video generation limits per tier (Free: 0, Starter: 0, Pro: 10/month, Agency: unlimited)
- [ ] **BILL-02**: Video render cost tracked in `marketing_jobs.cost_breakdown` (estimated $0.10-0.30 per render)
- [ ] **BILL-03**: Usage visible in Command Center dashboard (videos generated this month / limit)

## v1.2 Requirements (Deferred)

Acknowledged but deferred to future milestones. Not in current roadmap.

### Advanced Templates
- **TMPL-01**: Neighborhood/Lifestyle template for luxury market
- **TMPL-02**: Custom template builder (user creates own layouts)
- **TMPL-03**: Seasonal templates (Holiday, Spring Market, etc.)

### Advanced Features
- **ADV-01**: TikTok video publishing
- **ADV-02**: YouTube video publishing with SEO optimization
- **ADV-03**: A/B testing (multiple video variants per listing)
- **ADV-04**: Smart scheduling based on engagement analytics
- **ADV-05**: Video analytics dashboard (views, engagement per video)

### Scale
- **SCALE-01**: Multi-region Lambda deployment for global latency reduction
- **SCALE-02**: Render queue management with priority tiers
- **SCALE-03**: Template marketplace (user-submitted templates)

## Out of Scope

Explicitly excluded from v1.1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| TikTok publishing | Deferred to v1.2 — requires separate API integration, different content requirements |
| YouTube publishing | Deferred to v1.2 — requires YouTube Data API v3, SEO optimization is separate feature |
| Custom template builder | High complexity, v1.1 ships with 5 curated templates — user customization is v1.2+ |
| Video editor (trim, reorder) | SnapR is automation-first, not an editing tool — undermines "zero effort" value prop |
| Real-time preview during render | Remotion Lambda renders server-side — no live preview possible, show progress instead |
| Live streaming | Entirely different technology stack — not related to pre-rendered marketing videos |
| User-uploaded music | Music licensing liability — only royalty-free curated library |
| Mobile video recording | SnapR enhances existing photos, not a camera app |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REND-01 | Phase 1 | Pending |
| REND-02 | Phase 1 | Pending |
| REND-03 | Phase 1 | Pending |
| REND-04 | Phase 5 | Pending |
| REND-05 | Phase 1 | Pending |
| REND-06 | Phase 1 | Pending |
| COMP-01 | Phase 2 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 7 | Pending |
| COMP-05 | Phase 7 | Pending |
| COMP-06 | Phase 2 | Pending |
| COMP-07 | Phase 2 | Pending |
| COMP-08 | Phase 3 | Pending |
| AUDIO-01 | Phase 4 | Pending |
| AUDIO-02 | Phase 4 | Pending |
| AUDIO-03 | Phase 4 | Pending |
| AUDIO-04 | Phase 4 | Pending |
| AUDIO-05 | Phase 4 | Pending |
| BRAND-01 | Phase 6 | Pending |
| BRAND-02 | Phase 6 | Pending |
| BRAND-03 | Phase 6 | Pending |
| BRAND-04 | Phase 6 | Pending |
| PIPE-01 | Phase 5 | Pending |
| PIPE-02 | Phase 5 | Pending |
| PIPE-03 | Phase 5 | Pending |
| PIPE-04 | Phase 5 | Pending |
| PIPE-05 | Phase 5 | Pending |
| PIPE-06 | Phase 5 | Pending |
| PUB-01 | Phase 6 | Pending |
| PUB-02 | Phase 6 | Pending |
| PUB-03 | Phase 6 | Pending |
| PUB-04 | Phase 6 | Pending |
| PUB-05 | Phase 6 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 4 | Pending |
| UI-06 | Phase 4 | Pending |
| UI-07 | Phase 2 | Pending |
| UI-08 | Phase 5 | Pending |
| BILL-01 | Phase 5 | Pending |
| BILL-02 | Phase 5 | Pending |
| BILL-03 | Phase 5 | Pending |

**Coverage:**
- v1.1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after research synthesis*
