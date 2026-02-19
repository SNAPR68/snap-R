# SnapR — State

## Current Position

Phase: 6 (not started)
Plan: None yet
Status: Phase 5 complete — Video generation as marketing Step 6, billing gates, fire-and-forget rendering
Last activity: 2026-02-19 — Marketing pipeline integration with internal API, Results Panel video card

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** One upload, everything automated — agents upload photos and get enhanced images, descriptions, captions, property websites, scheduled social posts, and auto-generated videos without touching another tool.
**Current focus:** Video Engine — Remotion-based video generation in marketing pipeline

## Accumulated Context

- SnapR has a working 6-step marketing pipeline (description → captions → MLS → property site → scheduled posts → video)
- Video generation added as Step 6 with fire-and-forget semantics (triggers Lambda, doesn't wait for completion)
- Internal API `/api/internal/video-generate` bridges Cloudflare Worker → Next.js → Remotion Lambda
- Billing gates: Free/Starter skip video, Pro/Agency get auto-generation
- Marketing Results Panel shows video player, download button, rendering spinner, or upgrade prompt
- Marketing Banner has 6 progress dots (was 5)
- VideoCreator.tsx migrated from browser-FFmpeg to Lambda API calls (Phase 2)
- 3 production templates: PropertyShowcase (fade), JustListed (slide), OpenHouse (wipe)
- Shared composition components: PhotoSlide, AddressOverlay, IntroCard, ClosingCard, FeatureCallout, EventBadge
- AudioLayer component: music (looped, fade in/out), voiceover, ducking (30% when VO present), silent fallback
- 6 placeholder music tracks in public/music/ (silent MP3s — replace with real royalty-free tracks)
- Voiceover upload to Supabase Storage with signed URL (1hr expiry for Lambda)
- All composition schemas extended with optional `audio` prop
- Template selector UI with 3 cards + conditional open house date input
- Each template registered in 3 aspect ratios (9:16, 1:1, 16:9) = 9 compositions + TestVideo
- Photo ordering module uses existing photoAudit room classification (zero AI cost)
- publish-video API route exists for Facebook/Instagram, LinkedIn returns 501
- Agent branding infrastructure (brand_profiles DB, settings UI, logo uploader) exists on main
- Brand data NOT yet integrated into video compositions (Phase 6)
- Video publishing NOT yet wired into cron publisher (Phase 6)
- Branch: feature/brand-polish
- 7-phase roadmap: Foundation → Composition → Templates → Audio → Pipeline → Branding → Polish
- Phases 1-5 complete, Phases 6-7 remaining
- Worker needs NEXT_PUBLIC_BASE_URL and CRON_SECRET env vars for video trigger
- `canGenerateVideo` billing helper added to lib/content/limits.ts

## Blockers

None

## Pending Todos

- Replace placeholder music tracks with real royalty-free tracks
- Set NEXT_PUBLIC_BASE_URL and CRON_SECRET as Worker secrets (wrangler secret put)
- Apply marketing_jobs_video migration to live Supabase DB
