# CLAUDE.md - SnapR Codebase Guide

## Project Overview

SnapR is an AI-powered photo enhancement and marketing automation platform for real estate professionals. It transforms ordinary property photos into luxury showcases, then auto-generates marketing assets (descriptions, captions, MLS packages, property sites, scheduled social posts).

## Blueprint: Automation OS

The full automation loop:

```
Upload → Prepare → Market → Distribute → Measure → Loop
```

- **Upload**: Photos go to Supabase Storage
- **Prepare**: AI enhancement pipeline (sky replacement, staging, twilight, etc.) via Cloudflare Worker
- **Market**: 5-step marketing pipeline auto-triggers after preparation (description → captions → MLS → property site → scheduled posts)
- **Distribute**: Cron publisher posts to Facebook/Instagram/LinkedIn/TikTok every 15 min
- **Measure**: Analytics sync cron fetches engagement metrics every 6 hours
- **Loop**: Status changes (price drop, open house) can re-trigger marketing

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS), Cloudflare Workers, Vercel Serverless Functions
- **Storage**: Supabase Storage (raw images), Cloudflare R2 (processed images), Cloudinary (CDN)
- **AI Services**: OpenAI (GPT-4o for descriptions/voiceover scripts, GPT-4o-mini for captions), Replicate, Runware, AutoEnhance
- **Video**: Remotion 4.0.424 (React-based video), AWS Lambda (rendering), ElevenLabs + OpenAI TTS (voiceover)
- **Payments**: Stripe (subscription tiers)
- **Email**: Resend
- **Monitoring**: Sentry, OpenTelemetry

## Project Structure

```
/app                    - Next.js App Router pages and API routes
/app/api/cron/          - Vercel Cron jobs (daily-digest, publish-scheduled, sync-analytics, cleanup, verify-domains)
/app/api/marketing/     - Marketing status API
/app/api/listing/       - Listing status/preparation API
/app/dashboard/         - Dashboard pages (listings, studio, content-studio, analytics, leads, open-houses, broker)
/app/dashboard/leads/   - Lead CRM with list view + Kanban pipeline (drag-and-drop)
/app/dashboard/leads/sequences/ - Drip sequence management UI (create/edit/enable/delete + step editor)
/app/dashboard/leads/email-lists/ - Bulk email contact list + compose/send UI
/app/dashboard/open-houses/ - Open house event CRUD + attendee tracking
/app/dashboard/photographer/bookings/ - Photographer booking pipeline management
/app/dashboard/broker/  - Broker team dashboard (agent roster, stats)
/app/api/webhooks/      - Outgoing webhooks CRUD API
/app/api/v1/            - Public REST API v1 (10 endpoints, API key auth)
/app/api/api-keys/      - API key CRUD (dashboard session auth)
/app/api/domains/       - Custom domain management
/app/api/embed/         - Embed widget data endpoints
/app/embed/             - Public embeddable widget pages (before-after, gallery, property)
/app/developers/        - Developer portal + interactive API reference
/app/dashboard/settings/api-keys/  - API key management UI
/app/dashboard/settings/domains/   - Custom domain management UI
/app/dashboard/settings/widgets/   - Widget embed code generator
/app/p/[slug]/          - Public property site pages (SSR)
/app/open-house/[slug]/ - Public open house check-in form
/app/book/[slug]/       - Public photographer booking form
/apps/processor/        - Cloudflare Worker for async photo processing + marketing
/apps/processor/src/    - Worker source (handler.ts, marketing-handler.ts, types.ts)
/lib                    - Shared libraries
/lib/ai/                - AI enhancement pipeline (listing-engine, decision-engine, providers)
/lib/supabase/          - Database clients (client.ts, server.ts, admin.ts)
/lib/content/           - Content/billing utilities (limits.ts)
/lib/social/            - Social publishing service (publish-service.ts, oauth-config.ts, utm.ts)
/lib/video/             - Video utilities (photo-ordering.ts, voiceover-service.ts)
/lib/webhooks/          - Outgoing webhook dispatch (HMAC-SHA256 signed delivery)
/lib/mls/               - MLS provider adapters (SimplyRETS)
/lib/notify/            - SMS/WhatsApp via Twilio
/lib/validation/        - Zod schemas for API input validation (schemas.ts)
/lib/api-keys.ts        - API key generation, validation (SHA-256 + timing-safe)
/lib/api-v1/            - V1 API middleware (withApiAuth() HOF)
/lib/services/          - Service layer (listings-service.ts for v1 + internal reuse)
/lib/env.ts             - Environment variable startup validation
/lib/monitoring/        - Sentry cron heartbeat tracking
/public/widget/         - snapr-embed.js widget loader script
/remotion/              - Remotion video compositions and config
/remotion/compositions/ - Video templates (PropertyShowcase, JustListed, OpenHouse, PriceDrop, Sold)
/remotion/components/   - Shared video components (AudioLayer, ClosingCard, etc.)
/components             - React components
/supabase/migrations/   - Database migrations (38+ files)
/database               - Supabase schema reference
```

## Commands

```bash
npm run dev             # Start Next.js dev server
npm run build           # Build Next.js app
npm run lint            # Run ESLint
npx tsc --noEmit        # TypeScript compile check (use before every commit)
npm run deploy          # Deploy Cloudflare Worker (wrangler deploy)
npm run preview         # Local Worker testing (wrangler dev)
```

## Current Branch

`main`

## Deployment & Git Workflow

**Production site** (snap-r.com) runs from `main` only. Feature branches get Vercel preview URLs, not the production domain.

**`main` is branch-protected** — direct push is blocked. Always:
```bash
git checkout -b feature/my-change
# ...make changes, commit...
git push origin feature/my-change
gh pr create --base main
# merge via GitHub
```

**Pre-commit hook**: A hook blocks commits on structural changes unless `EXECUTION_CHANGELOG.md` is updated and staged. If you see `ERROR: Structural change detected but EXECUTION_CHANGELOG.md not updated`, add an entry to `EXECUTION_CHANGELOG.md` and `git add` it before committing.

**Manual Vercel deploy** (if needed after merging):
```bash
vercel --prod --yes
```

## Luxury Glassmorphism Design System

All luxury CSS classes are defined in `app/globals.css` after `@tailwind utilities`, after the `.glass-card-gold` block (~line 93).

| Class | Use case |
|-------|----------|
| `.glass-luxury` | Dark surface cards, panels, modals |
| `.glass-gold-luxury` | Gold-accented banners and CTAs |
| `.glossy-top` | Adds 1px white highlight sheen (pair with above) |
| `.glow-card` | Rotating conic-gradient gold border (CSS Houdini `@property --angle`) |
| `.shimmer-text` | Animated gold gradient text |
| `.stat-glow` | Gold text-shadow on metric values |
| `.bento-grid` | 2-col bento layout; `.bento-span-2` / `.bento-row-2` for spanning |

**Preview sandbox limitation**: Headless preview browser cannot apply custom CSS from Next.js HMR. Verify glass classes via build output:
```bash
npx next build && grep -o "\.glass-luxury[^}]*}" .next/static/css/*.css
```

## Code Conventions

- **TypeScript**: Strict mode, explicit types, path aliases (@/lib, @/components)
- **React**: Server Components by default, `'use client'` directive for client components
- **Naming**: PascalCase for components, kebab-case for utilities
- **Styling**: Tailwind CSS, dark theme (bg-[#0A0A0A] / bg-[#0F0F0F] / bg-[#1A1A1A]), gold accent (#D4A017)
- **Imports**: Named imports preferred, path aliases required
- **Error handling**: Always-complete semantics in pipelines (one step failing doesn't block others)
- **Type safety**: No `any` types — use `unknown` for catch blocks, define interfaces for complex objects, use `Record<string, unknown>` instead of `Record<string, any>`
- **Catch blocks**: `catch (error: unknown)` with `error instanceof Error` guard; empty catch uses `catch {` (no variable binding)
- **Null coercion**: Supabase returns `null` for missing fields; coerce to `undefined` at data boundaries with `?? undefined` when passing to React component props
- **Input validation**: All API routes validate inputs with Zod schemas (`lib/validation/schemas.ts`) before processing
- **Network calls**: All external API fetches use `AbortSignal.timeout(15000)` to prevent hanging requests
- **Accessibility**: Modals use `role="dialog"` + `aria-modal="true"` + `aria-label`; forms use `aria-label` on inputs; pages use semantic HTML (`<nav>`, `<section>`, `<footer>`)

## Database

Supabase PostgreSQL with RLS. Key tables:

### Core
- `profiles` - User profiles, subscription_tier, onboarding status, phone, notification_preferences
- `listings` - Property listings with `preparation_status`, `marketing_status`, `hero_photo_id`, `preparation_metadata`
- `photos` - Listing photos with processing status, raw_url, processed_url, variant, confidence
- `jobs` - Processing job tracking (queued/processing/completed/failed)

### Marketing & Content (Phase 2)
- `marketing_jobs` - Marketing pipeline tracking with per-step status columns:
  - `description_status/result`, `captions_status/result`, `mls_status/result`
  - `property_site_status/result`, `scheduled_posts_status/result`
  - `total_cost_cents`, `cost_breakdown` (JSON)
- `scheduled_posts` - Posts queued for auto-publishing (content, platform, scheduled_for, status)
- `published_posts` - Published posts with analytics columns (likes, comments, shares, impressions, reach, engagement_rate, last_synced_at)
- `social_connections` - OAuth connections to Facebook/Instagram/LinkedIn/TikTok (access_token, pages, instagram_account, linkedin_urn, platform_user_id for TikTok open_id)
- `property_sites` - Public property site configurations (slug, theme, brand)

### Video
- `video_render_jobs` - Lambda render tracking (render_id, bucket_name, status, input_props, output_url)

### v1.5 Features
- `open_house_events` - Open house events with capacity, check-in slug, status (upcoming/active/completed/cancelled)
- `open_house_attendees` - Guest check-in records with interest_rating and comments
- `photographer_packages` - Photographer service packages (name, price, description)
- `booking_requests` - Photographer booking pipeline (pending→confirmed→shot→editing→delivered)
- `photographer_availability` - Photographer schedule availability
- `outgoing_webhooks` - User-configured webhook endpoints (url, events[], secret, is_active)
- `webhook_deliveries` - Delivery log (event, payload, status_code, success)

### Enterprise Platform
- `api_keys` - API key storage (key_prefix, key_hash SHA-256, scopes, rate_limit_per_minute, is_active)
- `api_usage` - Per-call API usage tracking (endpoint, method, status_code, response_time_ms)
- `custom_domains` - Custom domain mapping (domain, target_type, verification_status, verification_token, brand_config)

### Other
- `content_library`, `post_drafts`, `auto_post_rules` - Content studio
- `client_approvals` - Client approval workflows
- `preparation_logs` - Preparation history
- `lead_activities` - Lead CRM activity timeline (call/email/text/showing/note)
- `drip_sequences`, `drip_enrollments` - Lead drip automation

## Supabase Clients

```typescript
// Browser client (public, client components)
import { createClient } from '@/lib/supabase/client'

// Server client (with auth, server components + API routes)
import { createClient } from '@/lib/supabase/server'

// Admin client (service role, bypasses RLS — for crons and workers)
import { adminSupabase } from '@/lib/supabase/admin'
```

## Billing / Plan Limits

Defined in `lib/content/limits.ts`:

| Tier | Content Posts | AI Captions | Can Publish | Content Studio | Marketing Auto | API | Custom Domain | Embed |
|------|-------------|-------------|-------------|----------------|----------------|-----|---------------|-------|
| free | 0 | 0 | No | No | Skipped | No | No | No |
| starter | 5 | 10 | No | Yes | Skipped | No | No | No |
| pro | 30 | 50 | Yes | Yes | Full | No | No | No |
| agency | Unlimited | Unlimited | Yes | Yes | Full | No | No | Yes |
| enterprise | Unlimited | Unlimited | Yes | Yes | Full | Yes | Yes | Yes |

```typescript
import { getPlanLimits } from '@/lib/content/limits'
const limits = getPlanLimits(tier) // returns { canPublish, canAccessContentStudio, ... }
```

**Billing gates enforced at:**
1. `marketing-handler.ts` — free-tier users get `status: 'skipped'` immediately, zero AI cost incurred
2. `publish-scheduled/route.ts` — `getPlanLimits(tier).canPublish` check before each post
3. `lib/api-v1/middleware.ts` — `canAccessApi` check blocks non-enterprise users from v1 API
4. `app/api/domains/route.ts` — `canCustomDomain` check blocks non-enterprise users

## Cloudflare Worker (apps/processor)

The async processing worker handles both photo enhancement and marketing automation.

**Constraints:**
- No direct Node.js APIs — use Env object for secrets
- Dynamic imports for V2 modules
- R2 bucket: `snapr-images`
- KV namespace: `CHECKPOINTS`

**Key files:**
- `handler.ts` — Photo enhancement handler (Phase 1)
- `marketing-handler.ts` — Marketing pipeline handler (Phase 2)
- `lib/supabase-client.ts` — Supabase client with `db: { schema: 'public' }` config

**Worker URL (dev):** `https://snapr-processor-dev.rajesh-fba.workers.dev`

**Deploy:** `cd apps/processor && npx wrangler deploy`

## Marketing Pipeline (Phase 2)

`apps/processor/src/marketing-handler.ts` — 5-step pipeline with always-complete semantics:

| Step | What | AI Model | Cost |
|------|------|----------|------|
| 1. Description | MLS-quality property description | GPT-4o | ~15c |
| 2. Captions | Platform-specific social captions + hashtags | GPT-4o-mini | ~3c/platform |
| 3. MLS Package | Photo manifest + property metadata | None (metadata) | 0c |
| 4. Property Site | Insert draft into `property_sites` table | None (DB) | 0c |
| 5. Scheduled Posts | Auto-schedule posts with UTM-tagged property site links | None (DB) | 0c |

**Auto-trigger:** Marketing fires automatically when `listings.preparation_status` transitions to `'prepared'` (via webhook/trigger in the preparation flow).

**Status writes:** Handler updates `listings.marketing_status` (`processing` → `completed`/`failed`/`skipped`).

## Social Publishing

`lib/social/publish-service.ts` exports:
- `publishToFacebook(pageAccessToken, pageId, content)` → `PublishResult`
- `publishToInstagram(accessToken, igAccountId, content)` → `PublishResult`
- `publishToLinkedIn(accessToken, personUrn, content)` → `PublishResult`
  - Uses LinkedIn Community Management API v2 (`/rest/posts`)
  - Headers: `LinkedIn-Version: 202401`, `X-Restli-Protocol-Version: 2.0.0`
  - Image upload: 3-step flow (initializeUpload → download → PUT binary)
  - Post URN returned in `x-restli-id` response header
- `publishVideoToTikTok(accessToken, videoUrl, caption)` → `PublishResult`
  - Uses TikTok Content Posting API v2 (`PULL_FROM_URL` method)
  - TikTok fetches video from our S3/CDN URL
  - Unaudited apps default to `privacy_level: 'SELF_ONLY'` (private posts)
- `publishPhotoToTikTok(accessToken, imageUrls, caption)` → `PublishResult`
  - Uses TikTok Photo Posting API (creates photo carousel)

`PublishResult` = `{ success, postId?, postUrl?, error? }`

**UTM Tracking** (`lib/social/utm.ts`):
- `appendUtmParams(url, { platform, postType, listingId })` → URL with UTM query params
- Marketing handler Step 5 auto-appends UTM-tagged property site link to every scheduled post caption
- Params: `utm_source` (platform), `utm_medium` (social), `utm_campaign` (post type), `utm_content` (listing ID)

**OAuth scopes** (`lib/social/oauth-config.ts`):
- LinkedIn: `openid`, `profile`, `email`, `w_member_social`
- TikTok: `user.info.basic`, `video.publish`, `video.upload` (v2 API, uses `client_key` not `client_id`)
- Twitter: Uses PKCE (S256) with code verifier embedded in state
- Facebook: Long-lived token exchange via `fb_exchange_token` grant

**TikTok OAuth specifics:**
- Auth URL: `https://www.tiktok.com/v2/auth/authorize/`
- Token URL: `https://open.tiktokapis.com/v2/oauth/token/` (JSON body, not form-urlencoded)
- Token exchange returns `open_id` (stored as `platform_user_id` in `social_connections`)
- Access tokens last ~24 hours; refresh tokens ~365 days
- Refresh uses JSON body with `client_key` param

## Video Generation (Remotion Lambda)

Property showcase videos rendered via Remotion on AWS Lambda.

### Architecture
```
VideoCreator UI → /api/video/generate → renderMediaOnLambda() → AWS Lambda → S3 → public MP4 URL
                → /api/video/status (polls every 3s via getRenderProgress)
```

### Lambda Function
- **Name**: `remotion-render-4-0-424-mem3008mb-disk2048mb-900sec`
- **Config**: 3GB RAM, 2GB disk, 900s (15 min) timeout
- **Region**: `us-east-1`
- **S3 Bucket**: `remotionlambda-useast1-64vfat1kzg`
- **Serve URL**: Deployed via `npx remotion lambda sites create --site-name=snapr-video remotion/index.ts`
- **Single-lambda rendering**: `framesPerLambda: 20000` forces all frames onto one Lambda (AWS account has low concurrency limit)

### Remotion Commands
```bash
# Deploy Lambda site (after composition changes)
export $(grep -E '^REMOTION_AWS' .env.local | xargs) && npx remotion lambda sites create --site-name=snapr-video remotion/index.ts

# Deploy Lambda function (after timeout/memory changes)
export $(grep -E '^REMOTION_AWS' .env.local | xargs) && npx remotion lambda functions deploy --memory=3008 --disk=2048 --timeout=900

# List functions
export $(grep -E '^REMOTION_AWS' .env.local | xargs) && npx remotion lambda functions ls

# Test local render
npx remotion render PropertyShowcase-9x16

# Render explainer video locally (~50s, ~35MB)
npx remotion render ExplainerVideo --output=/tmp/snapr-explainer-video.mp4 --codec=h264

# Render single explainer frame for testing
npx remotion still ExplainerVideo --frame=950 --output=/tmp/test-frame.png

# Regenerate explainer voiceover (requires OPENAI_API_KEY in .env.local)
node scripts/generate-voiceover.mjs

# Test Lambda render from CLI
export $(grep -E '^REMOTION_AWS' .env.local | xargs) && npx remotion lambda render <serve-url> PropertyShowcase-9x16 --frames-per-lambda=20000
```

### Video Compositions (5 templates × 3 aspect ratios + 1 explainer)
- **PropertyShowcase** — Ken Burns zoom/pan with closing card
- **JustListed** — Urgency pacing with event date badge
- **OpenHouse** — Urgency pacing with open house date
- **PriceDrop** — Price reduced badge with urgency
- **Sold** — Celebration styling with social proof
- **ExplainerVideo** — Homepage product walkthrough (16:9, 50s, 10 scenes of real UI screenshots + shimmer voiceover)

Each property template has 3 variants: `9x16` (vertical), `16x9` (landscape), `1x1` (square)

### Explainer Video
- `remotion/compositions/ExplainerVideo.tsx` — 10-scene product walkthrough (50s, 16:9, 1920x1080 @ 30fps)
- **Screenshot versions**: `public/explainer-frames-v3/` (v3 full-page captures) + fallback from `public/explainer-frames/` (v1 viewport captures for authenticated pages where v3 auth failed)
- **Capture scripts**: `scripts/capture-explainer-v3.mjs` (full-page, auth broken), `scripts/capture-explainer-v2.mjs` (viewport, v1 working)
- **Voiceover**: OpenAI TTS HD `shimmer` voice, generated via `scripts/generate-voiceover.mjs`, saved to `public/explainer-voiceover.mp3`
- `components/explainer-video-player.tsx` — Homepage video player, loads from Cloudinary CDN with poster auto-generation
- **Cloudinary**: `snapr-explainer-video.mp4` (version `v1772556197`, overwrite on re-upload)
- **Scene flow**: Homepage Hero → Before/After Gallery → One Platform → How It Works → Pricing → Signup → Dashboard → AI Studio → Content Studio → Analytics → CTA
- **Scroll modes**: `smooth` (tall page scroll), `pauseAtTop` (hold 1.5s then scroll), `none` (Ken Burns gentle zoom)
- **Known issue**: `capture-explainer-v3.mjs` Puppeteer auth fails — dashboard/studio/content-studio/analytics screenshots are sourced from v1 captures

### Key Files
- `remotion/compositions/PropertyShowcase.tsx` — Main composition with Zod schema
- `remotion/components/AudioLayer.tsx` — Music + voiceover mixing (music ducks to 30% under voiceover)
- `remotion/components/ClosingCard.tsx` — End card with property details
- `lib/video/photo-ordering.ts` — Smart photo ordering using `decisionAudit` from preparation pipeline
- `lib/video/voiceover-service.ts` — GPT-4o script generation + ElevenLabs/OpenAI TTS
- `app/api/video/generate/route.ts` — Trigger Lambda render
- `app/api/video/status/route.ts` — Poll render progress
- `app/api/video/voiceover/route.ts` — 3-action voiceover flow (generate-script → generate-audio → upload-audio)
- `app/dashboard/content-studio/video/VideoCreator.tsx` — Video creator UI

### Database Table
- `video_render_jobs` — Tracks render jobs (render_id, bucket_name, status, input_props)

### Voiceover Pipeline
1. **Script generation** (GPT-4o): Personalized to listing (address, price, beds, baths, sqft, description)
2. **4 script styles**: Professional, Luxury, Friendly, FirstTimeBuyer — each has a different system prompt tone
3. **6 voice options**: 3 male + 3 female across professional/luxury/friendly (ElevenLabs voice IDs)
4. **TTS**: ElevenLabs primary (`eleven_monolingual_v1`), OpenAI TTS HD fallback (`tts-1-hd`)
5. **Duration**: Calculated from photo count × 3s, converted to word count at 130 words/min

### Critical Data Structure Note
`preparation_metadata.photoAudit` is a **Record<string, object>** (NOT an array). Photo type classification lives in `preparation_metadata.decisionAudit[photoId].photoType`. The `photo-ordering.ts` utility reads from `decisionAudit`, not `photoAudit`.

## Vercel Crons

Defined in `vercel.json`:

| Cron | Schedule | File |
|------|----------|------|
| Publish Scheduled Posts | Every 15 min | `app/api/cron/publish-scheduled/route.ts` |
| Sync Analytics | Every 6 hours | `app/api/cron/sync-analytics/route.ts` |
| Daily Digest | (existing) | `app/api/cron/daily-digest/route.ts` |
| Verify Domains | Every 6 hours | `app/api/cron/verify-domains/route.ts` |
| Data Cleanup | Weekly (Sun 3am) | `app/api/cron/cleanup/route.ts` |

All crons use `CRON_SECRET` Bearer auth. Max duration: 300s, memory: 1024MB.

## Studio UI Architecture

`components/studio-client.tsx` — Main editing interface (~800 lines, monolithic client component):

**Layout:** Header → MarketingBanner → 3-column flex (AI Tools sidebar | Canvas | Downloads/Marketing panel)

**Key state:**
- `listingStatus` — preparation status + confidence
- `marketingListingStatus` / `marketingJobData` — marketing pipeline status (polled every 5s)
- `showMarketingPanel` — swaps right sidebar from Downloads to Marketing Results
- `pendingEnhancement` — before/after slider for AI edits
- `completedPhotos` — enhanced photos ready for download

**Marketing UI components:**
- `components/marketing-banner.tsx` — Context-aware banner below header (processing/completed/failed states)
- `components/marketing-results-panel.tsx` — Right sidebar swap showing all 5 marketing artifacts with copy buttons

## Enhancement Tools (15 in studio, 23 total)

Exterior: sky-replacement, virtual-twilight, lawn-repair, pool-enhance
Interior: declutter, virtual-staging, fire-fireplace, tv-screen, lights-on, window-masking
Enhance: hdr, auto-enhance, perspective-correction, lens-correction, color-balance

Each tool has presets (e.g., sky-replacement: Clear Blue, Sunset, Dramatic Clouds, Twilight Sky).

## API Routes (Key ones)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/enhance` | POST | Single photo AI enhancement |
| `/api/upload` | POST | Photo upload (50MB max) |
| `/api/listing/prepare` | POST | Trigger AI preparation pipeline |
| `/api/listing/status` | GET/PATCH | Listing status + marketing job status |
| `/api/marketing/status` | GET | Full marketing job details + artifacts |
| `/api/campaigns` | POST | Trigger marketing status change |
| `/api/share` | POST | Generate share gallery link |
| `/api/download-all` | POST | ZIP download of enhanced photos |
| `/api/analytics/posts` | GET | Published posts analytics |
| `/api/video/generate` | POST | Trigger Remotion Lambda video render |
| `/api/video/status` | GET | Poll video render progress |
| `/api/video/voiceover` | POST | Generate script / audio / upload (3 actions) |
| `/api/internal/video-generate` | POST | Marketing pipeline internal video trigger |
| `/api/webhooks/outgoing` | GET/POST/PATCH/DELETE | Outgoing webhook CRUD |
| `/api/mls/import` | POST | MLS data import (SimplyRETS) |
| `/api/photographer/booking` | POST | Photographer booking submission |
| `/api/open-house/checkin` | POST | Public open house guest check-in |
| `/api/open-house/feedback` | POST | Public showing/open house feedback |
| `/api/leads/activity` | GET/POST/PATCH | Lead activity timeline + auto-scoring (score caps at 100) |
| `/api/leads/sequences` | GET/POST/PATCH/DELETE | Drip sequence CRUD (system sequences protected) |
| `/api/leads/bulk-email` | GET/POST | Bulk email to selected leads via Resend; logs activities |
| `/api/analytics/listings` | GET | Per-listing analytics aggregation (engagement, leads, AI spend) |
| `/api/webhooks/deliveries` | GET | Webhook delivery log (last 50, filterable by webhookId) |
| `/api/download-approved` | GET | Download client-approved photos |
| `/api/marketing/reso-export` | POST | RESO Data Dictionary 2.0 JSON export |
| `/api/v1/listings` | GET, POST | List/create listings (API key auth) |
| `/api/v1/listings/[id]` | GET, PATCH, DELETE | Listing CRUD (API key auth) |
| `/api/v1/listings/[id]/photos` | GET | List listing photos (API key auth) |
| `/api/v1/listings/[id]/prepare` | POST | Trigger preparation (API key auth) |
| `/api/v1/listings/[id]/status` | GET | Preparation + marketing status (API key auth) |
| `/api/v1/photos/[id]/enhance` | POST | Enhance photo (API key auth) |
| `/api/v1/video/generate` | POST | Generate video (API key auth) |
| `/api/v1/video/[renderId]` | GET | Video render status (API key auth) |
| `/api/v1/leads` | GET, POST | Lead management (API key auth) |
| `/api/v1/webhooks` | GET, POST, PATCH, DELETE | Webhook CRUD (API key auth) |
| `/api/v1/openapi.json` | GET | OpenAPI 3.0 specification |
| `/api/api-keys` | GET, POST, DELETE | API key management (session auth) |
| `/api/domains` | GET, POST, PATCH, DELETE | Custom domain management |
| `/api/embed/analytics` | POST | Widget impression/click tracking |
| `/api/cron/cleanup` | POST | Weekly data retention cleanup |
| `/api/cron/verify-domains` | POST | DNS TXT domain verification |

## Outgoing Webhooks

`lib/webhooks/dispatch.ts` exports `dispatchWebhookEvent(userId, event, payload)`:
- Fetches active webhooks matching the event type
- POSTs JSON payload with `X-Webhook-Signature` (HMAC-SHA256 of body using webhook secret)
- 10s timeout, logs all deliveries to `webhook_deliveries`, never throws (always-complete)

Supported events: `listing.created`, `listing.updated`, `listing.prepared`, `lead.created`, `lead.updated`, `post.published`, `post.scheduled`, `photo.enhanced`

**Wired into**: leads API (lead.created/lead.updated), listing status API (listing.prepared), publish cron (post.published/post.scheduled).

## Public API v1

REST API with API key authentication for enterprise integrations.

**Auth:** Bearer token with `sk_live_` prefix → SHA-256 hash lookup in `api_keys` table → timing-safe comparison.

**Middleware:** `lib/api-v1/middleware.ts` exports `withApiAuth(handler)` — validates key, checks enterprise tier, rate limits per key, logs usage.

**Response envelope:** `{ data }` for single items, `{ data, meta: { page, per_page, total } }` for lists, `{ error: { message, code } }` for errors.

**Rate limit:** Configurable per key (default 60 req/min). Uses existing `checkRateLimitAsync()`.

**Gate:** Enterprise tier only (`canAccessApi: true` in plan limits).

**OpenAPI spec:** `/api/v1/openapi.json` — full OpenAPI 3.0 spec (1037 lines). Interactive reference at `/developers/api-reference`.

## Custom Domains

DNS TXT verification flow for custom domain mapping.

**Flow:** Add domain → get verification token → add TXT record `_snapr-verify.{domain}` → cron verifies every 6 hours → domain maps to property site/portfolio.

**Gate:** Enterprise tier only (`canCustomDomain: true`).

**Files:** `app/api/domains/route.ts` (CRUD), `app/api/cron/verify-domains/route.ts` (DNS verification).

## Embeddable Widgets

Cross-site embeddable property widgets via iframe.

**Widget types:** before-after slider, photo gallery, property card.

**Loader:** `public/widget/snapr-embed.js` — auto-creates iframe, handles resize via postMessage.

**Usage:**
```html
<script src="https://snap-r.com/widget/snapr-embed.js"></script>
<div data-snapr-widget="before-after" data-listing-id="xxx"></div>
```

**Gate:** Agency tier+ (`canEmbed: true`).

## Environment Validation

`lib/env.ts` validates required env vars on startup (called from `instrumentation.ts`). Fast-fails in production if critical vars are missing. Warns for recommended vars.

## Applied Migrations

These migrations have been applied to the live Supabase database:

1. `20260216_marketing_jobs.sql` — marketing_jobs table with per-step status, JSONB artifacts, cost tracking, RLS
2. `20260216_marketing_jobs_scheduled_posts.sql` — scheduled_posts_status/result columns on marketing_jobs
3. `20260216_published_posts.sql` — published_posts table with analytics columns, RLS, service role bypass
4. `20260216_photos_tools_applied.sql` — tools_applied text[] column on photos table
5. `20260217_phone_and_partners.sql` — profiles.phone/referred_by/notification_preferences columns, partner_applications table with referral_code, RLS
6. `20260305_lead_activity.sql` — lead_activities table + score/notes/last_activity_at on property_leads
7. `20260305_showings.sql` — showings table with RLS
8. `20260305_listing_virtual_tour.sql` — virtual_tour_url column on listings
9. `20260305_photographer_bookings.sql` — photographer_packages, booking_requests, photographer_availability
10. `20260305_open_house.sql` — open_house_events + open_house_attendees
11. `20260305_outgoing_webhooks.sql` — outgoing_webhooks + webhook_deliveries ✓ (applied Session 4)
12. `20260316_api_keys.sql` — api_keys + api_usage tables with RLS, SHA-256 key hashing ✓
13. `20260316_custom_domains.sql` — custom_domains table with DNS TXT verification, RLS ✓

## Environment Variables

**Public (NEXT_PUBLIC_):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Private (Vercel):**
- `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, `RUNWARE_API_KEY`
- `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `CLOUDFLARE_API_TOKEN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `CRON_SECRET` (for Vercel Cron auth)
- `REMOTION_AWS_REGION`, `REMOTION_AWS_ACCESS_KEY_ID`, `REMOTION_AWS_SECRET_ACCESS_KEY`
- `REMOTION_LAMBDA_FUNCTION_NAME`, `REMOTION_LAMBDA_SERVE_URL`, `REMOTION_S3_BUCKET_NAME`
- `ELEVENLABS_API_KEY` (voiceover TTS)
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` (TikTok OAuth)
- `STRIPE_ENTERPRISE_PRICE_ID`, `STRIPE_ENTERPRISE_ANNUAL_PRICE_ID` (enterprise checkout)

**Worker (Cloudflare):**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `OPENAI_API_KEY`, `R2_BUCKET` (binding)
- `PROCESS_QUEUE`, `MARKETING_QUEUE` (Queue bindings)

## API Rate Limits

```
/api/enhance:  10 req/min
/api/analyze:  20 req/min
/api/upload:   30 req/min
/api/contact:  3 req/min
/api/auth:     5 req/min
Default:       100 req/min
```

## Security

- **OAuth CSRF validation**: State parameter verified against `user.id` in callback (`app/api/social/oauth/[platform]/route.ts`)
- **Twitter PKCE**: S256 code challenge with `crypto.createHash('sha256')` (`lib/social/oauth-config.ts`)
- **Facebook token refresh**: Short-lived tokens exchanged for long-lived tokens via `fb_exchange_token`
- **TikTok token refresh**: 24-hour access tokens auto-refreshed via cron publisher; refresh tokens last ~365 days
- **Centralized auth middleware**: `middleware.ts` protects `/dashboard/*`, `/admin/*`, `/checkout/*`, `/onboarding/*` — redirects unauthenticated users with `?redirect=` param
- **Zod validation**: All API inputs parsed through Zod schemas before processing (`lib/validation/schemas.ts`)

## Hardening Patterns

These patterns were established during quality hardening and must be followed:

### Error Handling
```typescript
// Correct
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}

// Correct — empty catch (no variable needed)
catch {
  // silently ignore
}

// Wrong — never use these
catch (error: any) { ... }
catch (e) { ... }  // unused variable lint error
```

### Null to Undefined Coercion
```typescript
// At Supabase data boundaries, coerce null to undefined for React props
const photo: StudioPhoto = {
  signedRawUrl: signedUrl ?? undefined,      // Supabase returns null
  signedProcessedUrl: processedUrl ?? undefined,
};
```

### Typed State (no `any` in useState)
```typescript
// Correct
const [listing, setListing] = useState<StudioListing | null>(null);
const [photos, setPhotos] = useState<StudioPhoto[]>([]);

// Wrong
const [listing, setListing] = useState<any>(null);
```

## Next.js Config (`next.config.mjs`)

Key settings:
- `typescript.ignoreBuildErrors: false` — builds fail on TS errors
- `eslint.ignoreDuringBuilds: false` — builds fail on ESLint violations
- `serverExternalPackages: ['@remotion/lambda', '@remotion/lambda-client', '@remotion/serverless']` — prevents Next.js webpack from re-bundling Remotion's pre-built AWS SDK bundle (causes runtime errors if re-bundled)

## Important Notes

1. **Node Version**: 20 (see .nvmrc)
2. **No test framework** currently configured
3. **Image Pipeline**: Raw → Supabase Storage → Worker → R2 → CDN (Cloudinary)
4. **Deploy**: Next.js to Vercel, Worker to Cloudflare via wrangler
5. **Supabase project**: `asoiwonhqoesbvcilqwd.supabase.co` (South Asia / Mumbai region)
6. **Always run `npx tsc --noEmit` before considering any change complete**
7. **Marketing pipeline uses always-complete semantics** — each step is independent; one failing doesn't block others
8. **Free-tier users are gated** at both marketing handler (skipped) and cron publisher (canPublish: false)
9. **Build strictness enforced**: `next.config.mjs` sets `typescript.ignoreBuildErrors: false` and `eslint.ignoreDuringBuilds: false` — builds fail on any TS error or ESLint violation
10. **ESLint enforces no-any**: `.eslintrc.json` has `@typescript-eslint/no-explicit-any: "warn"` — any `any` usage shows warnings in IDE and CI
11. **Zod version**: Pinned to `3.22.3` (Remotion 4.0.424 requires this exact version; Zod v4 breaks Remotion internals)
12. **Remotion Lambda requires `serverExternalPackages`** in `next.config.mjs` — the `@remotion/lambda-client` is a 76K-line pre-built bundle containing the AWS SDK; re-bundling by webpack breaks `.map()` calls
13. **AWS Lambda concurrency limit is low** — always use `framesPerLambda: 20000` to force single-lambda rendering; splitting across multiple concurrent lambdas causes `TooManyRequestsException`
14. **`preparation_metadata` data structures**: `photoAudit` is a `Record<string, object>` (NOT an array); `decisionAudit` is a `Record<string, { photoType, ... }>` — always use `Object.entries()` to iterate, never `.map()` directly
15. **Remotion Lambda env vars** must be set on both Vercel and `.env.local` — function name includes memory/timeout in the name (e.g., `remotion-render-4-0-424-mem3008mb-disk2048mb-900sec`)
16. **When deploying new Lambda functions**, update `REMOTION_LAMBDA_FUNCTION_NAME` in both `.env.local` and Vercel environment variables
17. **TikTok unaudited app limitation**: Posts default to `SELF_ONLY` (private). Must apply for TikTok app audit to enable public posting. Video must be H.264 MP4, max 4GB, 1080x1920 recommended (Remotion output matches)
18. **TikTok API uses `client_key`** not `client_id` — all TikTok OAuth/token calls use JSON body format, not form-urlencoded like other platforms
19. **UTM tracking is automatic**: Marketing handler Step 5 appends UTM-tagged property site URL to every scheduled post caption. The UTM utility (`lib/social/utm.ts`) is also available for standalone use
20. **Explainer video Cloudinary version**: After re-rendering, update the version number in `components/explainer-video-player.tsx` (both `EXPLAINER_VIDEO_URL` and `EXPLAINER_POSTER_URL`) to match the new Cloudinary upload version, then redeploy
21. **Explainer screenshot auth is broken**: `scripts/capture-explainer-v3.mjs` cannot authenticate via Puppeteer — all authenticated pages (dashboard, studio, content-studio, analytics) fall back to v1 captures from `public/explainer-frames/`. Fix the Puppeteer login flow before re-capturing
22. **Explainer video render**: Use `npx remotion render ExplainerVideo` for local render (~35 MB MP4), then upload to Cloudinary with `public_id=snapr-explainer-video` and `overwrite=true`
23. **Lead Kanban uses HTML5 drag-and-drop** — no external library. Columns: New, Contacted, Qualified, Touring, Offer, Closed, Lost. Pipeline view toggled via List/Pipeline buttons in `/dashboard/leads`
24. **Outgoing webhooks use HMAC-SHA256** — signature in `X-Webhook-Signature` header. Dispatch utility at `lib/webhooks/dispatch.ts` uses always-complete semantics (never throws). Wired into leads API, listing status API, and publish cron.
25. **Supabase Management API** for migrations when `db push` fails: `POST https://api.supabase.com/v1/projects/{ref}/database/query`. Access token from macOS Keychain: `security find-generic-password -s "Supabase CLI" -w` (decode `go-keyring-base64:` prefix + base64)
26. **Lead auto-scoring**: `POST /api/leads/activity` auto-increments `property_leads.score` on each activity. SCORE_DELTAS: call=+10, showing=+20, form_submitted=+15, property_site_viewed=+8, email/text=+5, drip_email_sent=+2. Score capped at 100.
27. **Bulk email**: `POST /api/leads/bulk-email` sends via Resend to selected lead IDs. Supports `{{name}}` and `{{first_name}}` template vars. Logs each send as a `lead_activities` row (activity_type='email', metadata.bulk=true).
28. **Webhook delivery log**: `GET /api/webhooks/deliveries` returns last 50 deliveries from `webhook_deliveries` table. Filterable by `?webhookId=`. UI is in `/dashboard/settings/webhooks` — click any row to expand response body.
29. **API v1 uses `withApiAuth()` HOF** — all v1 routes wrap handler with `withApiAuth()` from `lib/api-v1/middleware.ts`. Enterprise tier required.
30. **API key format**: `sk_live_` prefix + 32 random bytes (base62). Only the SHA-256 hash is stored; full key shown once on creation.
31. **Custom domain verification**: DNS TXT record `_snapr-verify.{domain}` checked every 6 hours by cron. Token stored in `custom_domains.verification_token`.
32. **Widget embed CSP**: `next.config.mjs` splits headers — `/embed/*` routes allow framing (`X-Frame-Options: ALLOWALL`), all other routes deny.
33. **Data retention cron**: Weekly cleanup of webhook_deliveries (>30 days), api_usage (>90 days), completed jobs (>60 days).
34. **Enterprise Stripe pricing**: $299/mo or $249/mo annual, 14-day free trial. Checkout via `/api/stripe/checkout`.
35. **OpenAPI spec**: Full 3.0 spec at `/api/v1/openapi.json` (1037 lines). Interactive docs at `/developers/api-reference`.
36. **Env validation**: `lib/env.ts` called from `instrumentation.ts` — fast-fails on missing critical vars in production.
