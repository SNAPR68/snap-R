# SnapR — State

## Current Position

Phase: 1 (not started)
Plan: —
Status: Roadmap defined, ready for Phase 1 planning
Last activity: 2026-02-19 — Research complete, requirements defined, roadmap created

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** One upload, everything automated — agents upload photos and get enhanced images, descriptions, captions, property websites, and scheduled social posts without touching another tool.
**Current focus:** Video Engine — Remotion-based video generation in marketing pipeline

## Accumulated Context

- SnapR has a working 5-step marketing pipeline (description → captions → MLS → property site → scheduled posts)
- VideoCreator.tsx exists with full UI but broken browser-FFmpeg backend
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

## Blockers

None

## Pending Todos

None
