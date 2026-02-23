# SnapR — State

## Current Position

Phase: 7 (COMPLETE — Milestone v1.1 finished)
Plan: Executed directly (no formal plan files)
Status: Phase 7 complete — PriceDrop + Sold templates, marketing handler auto-selection
Last activity: 2026-02-19 — PriceDrop/Sold compositions, template auto-selection, VideoCreator UI

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
- 5 production templates: PropertyShowcase (fade), JustListed (slide), OpenHouse (wipe), PriceDrop (slide, urgency), Sold (fade, celebration)
- Shared composition components: PhotoSlide, AddressOverlay, IntroCard, ClosingCard, FeatureCallout, EventBadge, BrandWatermark, BrandFooter
- AudioLayer component: music (looped, fade in/out), voiceover, ducking (30% when VO present), silent fallback
- 6 placeholder music tracks in public/music/ (silent MP3s — replace with real royalty-free tracks)
- Voiceover upload to Supabase Storage with signed URL (1hr expiry for Lambda)
- All composition schemas extended with optional `audio` and `brand` props
- Brand data (logo, colors, contact, tagline) fetched from `brand_profiles` table and injected into compositions
- BrandWatermark: agent logo in top-right corner during slideshow (fade-in, 85% opacity)
- BrandFooter: tagline + business name + phone/website + brokerage logo on closing card
- ClosingCard price color uses agent's primary_color (defaults to gold #D4AF37)
- Internal video-generate API fetches brand_profiles and passes brand prop to Lambda render
- Template selector UI with 5 cards + conditional inputs (open house date, original price, days on market)
- Each template registered in 3 aspect ratios (9:16, 1:1, 16:9) = 15 compositions + TestVideo
- Photo ordering module uses existing photoAudit room classification (zero AI cost)
- Cron publisher now handles video posts (video_url column on scheduled_posts)
- Facebook video: /videos endpoint with file_url
- Instagram video: Reels container → poll status → publish (3-step)
- LinkedIn video: Not yet implemented (returns error)
- All catch blocks in cron publisher fixed: `catch (error: any)` → `catch (error: unknown)`
- publish-video API route exists for manual Facebook/Instagram publishing
- Agent branding infrastructure (brand_profiles DB, settings UI, logo uploader) exists on main
- Branch: feature/brand-polish
- 7-phase roadmap: Foundation → Composition → Templates → Audio → Pipeline → Branding → Polish
- All 7 phases complete — v1.1 Video Engine milestone finished
- PriceDrop: red urgency styling, percentage drop badge, previous price strikethrough
- Sold: purple celebration styling, "Sold in X Days" social proof badge
- MarketingJobMessage extended with videoTemplate hint + template-specific params
- Worker NEXT_PUBLIC_BASE_URL and CRON_SECRET secrets set
- `canGenerateVideo` billing helper added to lib/content/limits.ts

## Blockers

None

## Pending Todos

- ~~Replace placeholder music tracks with real royalty-free tracks~~ DONE
- ~~Apply scheduled_posts_video_url migration to live Supabase DB~~ DONE
- All 7 video migrations applied to live Supabase DB
- Remotion Lambda site deployed with 16 compositions
- Cloudflare Worker deployed with template auto-selection
- Consider upgrading to production royalty-free tracks from Pixabay/Uppbeat (current tracks are ffmpeg-synthesized)
