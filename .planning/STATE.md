# SnapR — State

## Current Position

Phase: 4 (not started)
Plan: None yet
Status: Phase 3 complete — JustListed + OpenHouse templates, template selector UI
Last activity: 2026-02-19 — Lifecycle templates with shared components, API integration, UI selector

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** One upload, everything automated — agents upload photos and get enhanced images, descriptions, captions, property websites, and scheduled social posts without touching another tool.
**Current focus:** Video Engine — Remotion-based video generation in marketing pipeline

## Accumulated Context

- SnapR has a working 5-step marketing pipeline (description → captions → MLS → property site → scheduled posts)
- VideoCreator.tsx migrated from browser-FFmpeg to Lambda API calls (Phase 2)
- 3 production templates: PropertyShowcase (fade), JustListed (slide), OpenHouse (wipe)
- Shared composition components: PhotoSlide, AddressOverlay, IntroCard, ClosingCard, FeatureCallout, EventBadge
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
- Phases 1-3 complete, Phases 4-7 remaining
- Lambda site needs redeploy with AWS credentials (local deploy failed — use CI or env vars)

## Blockers

None

## Pending Todos

None
