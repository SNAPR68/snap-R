# SnapR — State

## Current Position

Phase: 5 (not started)
Plan: None yet
Status: Phase 4 complete — AudioLayer component, music library, voiceover upload, UI wiring
Last activity: 2026-02-19 — Audio integration with ducking, fade in/out, end-to-end pipeline

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** One upload, everything automated — agents upload photos and get enhanced images, descriptions, captions, property websites, and scheduled social posts without touching another tool.
**Current focus:** Video Engine — Remotion-based video generation in marketing pipeline

## Accumulated Context

- SnapR has a working 5-step marketing pipeline (description → captions → MLS → property site → scheduled posts)
- VideoCreator.tsx migrated from browser-FFmpeg to Lambda API calls (Phase 2)
- 3 production templates: PropertyShowcase (fade), JustListed (slide), OpenHouse (wipe)
- Shared composition components: PhotoSlide, AddressOverlay, IntroCard, ClosingCard, FeatureCallout, EventBadge
- AudioLayer component: music (looped, fade in/out), voiceover, ducking (30% when VO present), silent fallback
- 6 placeholder music tracks in public/music/ (silent MP3s — replace with real royalty-free tracks)
- Voiceover upload to Supabase Storage with signed URL (1hr expiry for Lambda)
- All composition schemas extended with optional `audio` prop (musicTrack, musicVolume, voiceoverUrl, voiceoverVolume)
- Generate API converts UI volumes (0-100) to composition volumes (0-1)
- Template selector UI with 3 cards + conditional open house date input
- Each template registered in 3 aspect ratios (9:16, 1:1, 16:9) = 9 compositions + TestVideo
- Photo ordering module uses existing photoAudit room classification (zero AI cost)
- publish-video API route exists for Facebook/Instagram, LinkedIn returns 501
- Voiceover generator works at $2/each with 6 voices
- GSD, ClaudeKit, and Remotion skill installed in project
- Branch: feature/brand-polish
- Existing marketing pipeline uses always-complete semantics
- Free/Starter users get marketing skipped entirely
- 7-phase roadmap: Foundation → Composition → Templates → Audio → Pipeline → Branding → Polish
- Phases 1-4 complete, Phases 5-7 remaining
- Lambda site needs redeploy with updated compositions (source .env.local first)

## Blockers

None

## Pending Todos

None
