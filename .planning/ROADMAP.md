# Roadmap: SnapR

## Milestones

- ✅ **v1.0 Foundation** — Pre-GSD development (shipped)
- 🚧 **v1.1 Video Engine** — Phases 1-7 (in progress)

## Phases

<details>
<summary>✅ v1.0 Foundation — SHIPPED (Pre-GSD)</summary>

No GSD phases — v1.0 was developed before GSD adoption. Shipped:
- AI photo enhancement pipeline (15 tools)
- Marketing automation (5-step pipeline)
- Social publishing (Facebook, Instagram, LinkedIn)
- Analytics sync, Virtual staging, Voiceover, Photo culling, CMA
- Command Center dashboard, Billing (4 tiers)

</details>

### 🚧 v1.1 Video Engine (In Progress)

**Milestone Goal:** Add server-rendered property video generation to the marketing pipeline, replacing the broken browser-FFmpeg approach with Remotion Lambda, including industry-standard templates, multi-format export, agent branding, and auto-publishing.

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Remotion Foundation** — Deploy Lambda rendering infrastructure and prove end-to-end video generation (COMPLETED 2026-02-19)
- [x] **Phase 2: Basic Composition + Multi-Format** — PropertyShowcase template with photo slideshow, text overlays, and 3 aspect ratios (COMPLETED 2026-02-19)
- [ ] **Phase 3: Lifecycle Templates** — Just Listed, Open House templates with intro cards, branding, and template selection logic
- [ ] **Phase 4: Audio Integration** — Background music, voiceover mixing, volume ducking, audio fade in/out
- [ ] **Phase 5: Marketing Pipeline + Billing** — Auto-trigger video as Step 6, billing gates, cost tracking, storage/CDN delivery
- [ ] **Phase 6: Agent Branding + Publishing** — Branding configuration, end cards, video publishing to social platforms
- [ ] **Phase 7: Additional Templates + Polish** — Price Drop, Sold templates, UI refinements

## Phase Details

### Phase 1: Remotion Foundation
**Goal**: Deploy Remotion Lambda to AWS and prove a single video can render end-to-end from Next.js API route → Lambda → S3 → downloadable MP4.
**Depends on**: Nothing (first phase)
**Requirements**: REND-01, REND-02, REND-03, REND-05, REND-06
**Success Criteria** (what must be TRUE):
  1. `POST /api/video/generate` triggers a Lambda render and returns a render ID
  2. `GET /api/video/status?renderId=X` returns progress and final video URL on completion
  3. A 30-second test video (static images, no audio) renders successfully in under 90 seconds
  4. Render failures return structured error response (not 500 crash)
  5. `video_render_jobs` table tracks render lifecycle (queued → rendering → completed/failed)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Remotion packages, test composition, database migration, Zod schemas (COMPLETED 2026-02-19)
- [x] 01-02-PLAN.md — API routes (generate + status), error handling, Vercel config (COMPLETED 2026-02-19)

### Phase 2: Basic Composition + Multi-Format
**Goal**: Build the PropertyShowcase template with photo slideshow, text overlays, and transitions — rendering correctly in all 3 aspect ratios. Migrate VideoCreator UI from FFmpeg to API calls.
**Depends on**: Phase 1
**Requirements**: COMP-01, COMP-06, COMP-07, UI-01, UI-02, UI-04, UI-07
**Success Criteria** (what must be TRUE):
  1. PropertyShowcase template renders listing photos as slideshow with fade transitions
  2. Text overlays show address, price, bed/bath/sqft with percentage-based sizing
  3. Video renders correctly in 9:16, 1:1, and 16:9 without layout breaks
  4. VideoCreator.tsx calls `/api/video/generate` instead of browser FFmpeg
  5. UI shows render progress (polling status endpoint) and plays completed video
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — PropertyShowcase composition + multi-format registration (TransitionSeries, Ken Burns, ClosingCard, 3 aspect ratios) (COMPLETED 2026-02-19)
- [x] 02-02-PLAN.md — Photo ordering module (walkthrough sort using existing photoAudit data) (COMPLETED 2026-02-19)
- [x] 02-03-PLAN.md — VideoCreator UI migration (remove FFmpeg, API calls, progress polling, video player) (COMPLETED 2026-02-19)

### Phase 3: Lifecycle Templates
**Goal**: Build JustListed and OpenHouse templates with intro cards, feature callouts, and template selection logic. Add slide and zoom transitions.
**Depends on**: Phase 2
**Requirements**: COMP-02, COMP-03, COMP-08, UI-03
**Success Criteria** (what must be TRUE):
  1. JustListed template renders "JUST LISTED" intro card, photo slideshow, and end card
  2. OpenHouse template renders date/time urgency with event details
  3. Template selector in UI shows available templates with preview thumbnails
  4. Slide and zoom/Ken Burns transitions available alongside fade
  5. All new templates render correctly in all 3 aspect ratios
**Plans**: TBD

Plans:
- [ ] 03-01: JustListed template (intro card, feature callouts, end card)
- [ ] 03-02: OpenHouse template (date/time urgency, event details)
- [ ] 03-03: Template selection logic and UI selector

### Phase 4: Audio Integration
**Goal**: Add background music library and voiceover integration with proper volume ducking, so videos sound professional.
**Depends on**: Phase 2
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. Videos play background music from selectable royalty-free tracks (minimum 5)
  2. Music volume ducks when voiceover is active (audibly quieter during speech)
  3. Existing voiceover service output plays in sync with video
  4. Audio fades in at start and out at end (no abrupt cuts)
  5. Videos without music/voiceover still have silent audio track (platform compatibility)
  6. Music selector and voiceover toggle visible in VideoCreator UI
**Plans**: TBD

Plans:
- [ ] 04-01: Background music library (royalty-free tracks, audio component)
- [ ] 04-02: Voiceover integration and volume ducking
- [ ] 04-03: Music/voiceover UI controls

### Phase 5: Marketing Pipeline + Billing
**Goal**: Wire video generation into the marketing pipeline as Step 6, enforce billing gates, track costs, and set up storage/CDN delivery.
**Depends on**: Phase 2
**Requirements**: REND-04, PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, UI-08, BILL-01, BILL-02, BILL-03
**Success Criteria** (what must be TRUE):
  1. When listing preparation completes, video auto-generates as Step 6 in marketing pipeline
  2. Template auto-selected based on listing status (no user input needed)
  3. Video step failure does not block other marketing steps (always-complete semantics)
  4. Rendered videos stored in R2/Cloudinary with CDN delivery URL
  5. Free/Starter users see video step skipped (consistent with existing gates)
  6. Marketing Results Panel shows video alongside existing 5 results
  7. Video render cost tracked in billing breakdown
  8. Generated video auto-scheduled for social publishing
**Plans**: TBD

Plans:
- [ ] 05-01: Marketing handler Step 6 (auto-trigger, template selection, always-complete semantics)
- [ ] 05-02: Storage cascade (S3 → R2 → Cloudinary CDN), billing gates, cost tracking
- [ ] 05-03: Marketing Results Panel video card, auto-scheduling to published posts

### Phase 6: Agent Branding + Publishing
**Goal**: Add agent branding configuration (logo, colors, contact) with end card, and enable video publishing to Facebook, Instagram, and LinkedIn.
**Depends on**: Phase 5
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04, PUB-01, PUB-02, PUB-03, PUB-04, PUB-05
**Success Criteria** (what must be TRUE):
  1. Agent can configure branding (logo, colors, contact) in settings page
  2. End card shows agent name, phone, logo with brand colors in all templates
  3. Brand colors applied to intro cards and text overlays
  4. Video publishes to Instagram Reels with correct format
  5. Video publishes to Facebook Feed/Reels
  6. Video publishes to LinkedIn (501 stub replaced with working implementation)
  7. Cron publisher handles video scheduled posts with billing gates
**Plans**: TBD

Plans:
- [ ] 06-01: Agent branding configuration (settings page, DB storage, composition integration)
- [ ] 06-02: End card template with branding
- [ ] 06-03: Video publishing (Instagram Reels, Facebook, LinkedIn implementation)

### Phase 7: Additional Templates + Polish
**Goal**: Complete lifecycle template coverage with Price Drop and Sold templates. Polish UI and video quality.
**Depends on**: Phase 3
**Requirements**: COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. PriceDrop template renders old price → new price animation with urgency styling
  2. Sold template renders celebration styling with "Sold in X days" social proof
  3. Both templates render correctly in all 3 aspect ratios
  4. Template auto-selection correctly routes price drops and sold listings
**Plans**: TBD

Plans:
- [ ] 07-01: PriceDrop template (price animation, urgency styling)
- [ ] 07-02: Sold template (celebration, social proof)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7
Note: Phase 4 depends on Phase 2 (not Phase 3), so Phases 3 and 4 could run in parallel.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Remotion Foundation | v1.1 | Complete    | 2026-02-19 | - |
| 2. Basic Composition + Multi-Format | v1.1 | 3/3 | 2026-02-19 | - |
| 3. Lifecycle Templates | v1.1 | 0/3 | Not started | - |
| 4. Audio Integration | v1.1 | 0/3 | Not started | - |
| 5. Marketing Pipeline + Billing | v1.1 | 0/3 | Not started | - |
| 6. Agent Branding + Publishing | v1.1 | 0/3 | Not started | - |
| 7. Additional Templates + Polish | v1.1 | 0/2 | Not started | - |
