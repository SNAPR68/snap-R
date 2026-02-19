# SnapR

## What This Is

SnapR is an AI-powered photo enhancement and marketing automation platform for real estate professionals. It transforms ordinary property photos into luxury showcases, then auto-generates marketing assets (descriptions, captions, MLS packages, property sites, scheduled social posts). The full loop: Upload → Prepare → Market → Distribute → Measure → Loop.

## Core Value

One upload, everything automated — agents upload photos and get enhanced images, descriptions, captions, property websites, and scheduled social posts without touching another tool.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ AI photo enhancement pipeline (15 tools: sky, twilight, staging, declutter, HDR, etc.) — v1.0
- ✓ Marketing automation (5-step: description → captions → MLS → property site → scheduled posts) — v1.0
- ✓ Social publishing to Facebook, Instagram, LinkedIn (cron every 15 min) — v1.0
- ✓ Analytics sync (engagement metrics every 6 hours) — v1.0
- ✓ Virtual staging (10 styles, 3 quality tiers) — v1.0
- ✓ Virtual renovation (interior + exterior) — v1.0
- ✓ AI voiceover generator (6 voices, $2/each) — v1.0
- ✓ Photo culling (AI quality scoring, duplicate detection) — v1.0
- ✓ CMA reports — v1.0
- ✓ Property gallery / virtual tours — v1.0
- ✓ Command Center dashboard — v1.0
- ✓ Billing: 4 tiers (Free/Starter/Pro/Agency) with Stripe — v1.0
- ✓ Listing intelligence analysis — v1.0

### Active

<!-- Current scope. Building toward these. -->

- [ ] Remotion-based video rendering (replace broken browser FFmpeg)
- [ ] Industry-standard property video templates
- [ ] Video auto-generation in marketing pipeline (Step 6)
- [ ] Video publishing to social platforms
- [ ] Voiceover + video integration
- [ ] Multi-format video export (9:16, 1:1, 16:9)
- [ ] Agent branding in videos

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- TikTok publishing — Deferred to Milestone v1.2 (Complete the Loop)
- Email marketing blasts — Deferred to v1.2
- Auto-post rules engine — Deferred to v1.2
- Property site editor/publish — Deferred to v1.2
- Smart scheduling / A/B testing — Deferred to v1.3 (Intelligence Layer)
- Team/brokerage accounts — Deferred to v1.4 (Scale)
- White-label / API access — Deferred to v1.4
- Template marketplace — Deferred to v1.4

## Context

**Existing codebase:** Next.js 14 App Router + Supabase + Cloudflare Workers + Vercel. Branch: `feature/brand-polish`.

**Video creator current state:** `VideoCreator.tsx` exists with full UI (aspect ratios, voiceover, music, transitions) but uses browser-side FFmpeg which is heavy and unreliable. No `/api/video/generate` backend. `publish-video` API route exists for Facebook + Instagram Reels but LinkedIn returns 501.

**Marketing pipeline:** 5-step always-complete pipeline in `marketing-handler.ts`. Video would become Step 6 with same semantics — independent, one failing doesn't block others.

**Voiceover:** Already working ($2/each, 6 voices). Can be layered onto video.

**Remotion skill installed:** `.claude/skills/remotion-best-practices` provides composition patterns.

**Industry context:** AutoReel charges $50-100/video, only does video. SnapR can offer video as part of the full pipeline at $5-15/video or included in Pro/Agency.

## Constraints

- **Tech stack**: Must fit existing Next.js + Cloudflare Worker + Supabase + R2/Cloudinary architecture
- **Rendering infra**: Decision deferred to research phase — options: Remotion Lambda, Vercel API, Cloudflare Worker
- **Marketing pipeline**: Video step must follow always-complete semantics (independent of other steps)
- **Billing**: Free/Starter users get marketing skipped; video follows same gate
- **Build strictness**: `tsc --noEmit` must pass, ESLint enforced, no `any` types
- **Code conventions**: Per CLAUDE.md — strict TS, Zod validation, AbortSignal timeouts, accessibility

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remotion over FFmpeg | Browser FFmpeg is unreliable, heavy; Remotion is React-native, server-renderable, supports all formats | — Pending |
| Auto-trigger in pipeline | Consistent with existing UX — user uploads, everything happens automatically | — Pending |
| Templates based on industry standards | Global real estate standards drive template selection, not arbitrary choices | — Pending |

## Current Milestone: v1.1 Video Engine

**Goal:** Add server-rendered property video generation to the marketing pipeline, replacing the broken browser-FFmpeg approach with Remotion, including industry-standard templates, multi-format export, agent branding, and auto-publishing.

**Target features:**
- Remotion-based video composition and rendering infrastructure
- Industry-standard property video templates (researched from global RE standards)
- Video as Step 6 in marketing pipeline (auto-trigger on preparation complete)
- Multi-format export (9:16 Reels, 1:1 Feed, 16:9 Landscape)
- Agent branding (logo, colors, contact info in videos)
- Voiceover integration with video
- Video publishing to Facebook, Instagram, LinkedIn

---
*Last updated: 2026-02-19 after milestone v1.1 initialization*
