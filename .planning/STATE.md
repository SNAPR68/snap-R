# SnapR — State

## Current Position

Phase: 3 (not started)
Plan: None yet
Status: Phase 2 complete — PropertyShowcase composition, multi-format, photo ordering, VideoCreator migration
Last activity: 2026-02-19 — VideoCreator migrated from FFmpeg to Lambda API rendering

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** One upload, everything automated — agents upload photos and get enhanced images, descriptions, captions, property websites, and scheduled social posts without touching another tool.
**Current focus:** Video Engine — Remotion-based video generation in marketing pipeline

## Accumulated Context

- SnapR has a working 5-step marketing pipeline (description → captions → MLS → property site → scheduled posts)
- VideoCreator.tsx migrated from browser-FFmpeg to Lambda API calls (Phase 2 complete)
- PropertyShowcase composition renders in 3 aspect ratios (9:16, 1:1, 16:9) with TransitionSeries crossfades, Ken Burns, address overlay, closing card
- Photo ordering module uses existing photoAudit room classification for walkthrough sequence (zero AI cost)
- publish-video API route exists for Facebook/Instagram, LinkedIn returns 501
- Voiceover generator works at $2/each with 6 voices
- GSD, ClaudeKit, and Remotion skill installed in project
- Branch: feature/brand-polish
- Existing marketing pipeline uses always-complete semantics
- Free/Starter users get marketing skipped entirely
- Research completed: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md
- Remotion Lambda (AWS) confirmed as only viable rendering option
- 44 requirements defined across 8 categories (REND, COMP, AUDIO, BRAND, PIPE, PUB, UI, BILL)
- 7-phase roadmap: Foundation → Composition → Templates → Audio → Pipeline → Branding → Polish
- Phase 1 completed: Remotion packages, test composition, video_render_jobs migration, API routes
- Phase 2 completed: PropertyShowcase composition, ClosingCard, multi-format registration, photo ordering, generate route mapping, VideoCreator UI migration
- Lambda site deployed with PropertyShowcase compositions at all 3 aspect ratios
- Key architectural decisions: terminal state caching, composition ID mapping (template+aspectRatio), percentage-based sizing for multi-format

## Blockers

None

## Pending Todos

None
