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
- **Distribute**: Cron publisher posts to Facebook/Instagram/LinkedIn every 15 min
- **Measure**: Analytics sync cron fetches engagement metrics every 6 hours
- **Loop**: Status changes (price drop, open house) can re-trigger marketing

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS), Cloudflare Workers, Vercel Serverless Functions
- **Storage**: Supabase Storage (raw images), Cloudflare R2 (processed images), Cloudinary (CDN)
- **AI Services**: OpenAI (GPT-4o for descriptions, GPT-4o-mini for captions), Replicate, Runware, AutoEnhance
- **Payments**: Stripe (subscription tiers)
- **Email**: Resend
- **Monitoring**: Sentry, OpenTelemetry

## Project Structure

```
/app                    - Next.js App Router pages and API routes
/app/api/cron/          - Vercel Cron jobs (daily-digest, publish-scheduled, sync-analytics)
/app/api/marketing/     - Marketing status API
/app/api/listing/       - Listing status/preparation API
/app/dashboard/         - Dashboard pages (listings, studio, content-studio, analytics)
/app/p/[slug]/          - Public property site pages (SSR)
/apps/processor/        - Cloudflare Worker for async photo processing + marketing
/apps/processor/src/    - Worker source (handler.ts, marketing-handler.ts, types.ts)
/lib                    - Shared libraries
/lib/ai/                - AI enhancement pipeline (listing-engine, decision-engine, providers)
/lib/supabase/          - Database clients (client.ts, server.ts, admin.ts)
/lib/content/           - Content/billing utilities (limits.ts)
/lib/social/            - Social publishing service (publish-service.ts)
/components             - React components
/supabase/migrations/   - Database migrations (32 files)
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

`feature/phase1-hardening-clean`

## Code Conventions

- **TypeScript**: Strict mode, explicit types, path aliases (@/lib, @/components)
- **React**: Server Components by default, `'use client'` directive for client components
- **Naming**: PascalCase for components, kebab-case for utilities
- **Styling**: Tailwind CSS, dark theme (bg-[#0A0A0A] / bg-[#0F0F0F] / bg-[#1A1A1A]), gold accent (#D4A017)
- **Imports**: Named imports preferred, path aliases required
- **Error handling**: Always-complete semantics in pipelines (one step failing doesn't block others)

## Database

Supabase PostgreSQL with RLS. Key tables:

### Core
- `profiles` - User profiles, subscription_tier, credits, onboarding status
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
- `social_connections` - OAuth connections to Facebook/Instagram/LinkedIn (access_token, pages, instagram_account, linkedin_urn)
- `property_sites` - Public property site configurations (slug, theme, brand)

### Other
- `content_library`, `post_drafts`, `auto_post_rules` - Content studio
- `client_approvals` - Client approval workflows
- `preparation_logs` - Preparation history

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

| Tier | Content Posts | AI Captions | Can Publish | Content Studio | Marketing Auto |
|------|-------------|-------------|-------------|----------------|----------------|
| free | 0 | 0 | No | No | Skipped |
| starter | 5 | 10 | No | Yes | Skipped |
| pro | 30 | 50 | Yes | Yes | Full |
| agency | Unlimited | Unlimited | Yes | Yes | Full |

```typescript
import { getPlanLimits } from '@/lib/content/limits'
const limits = getPlanLimits(tier) // returns { canPublish, canAccessContentStudio, ... }
```

**Billing gates enforced at:**
1. `marketing-handler.ts` — free-tier users get `status: 'skipped'` immediately, zero AI credits burned
2. `publish-scheduled/route.ts` — `getPlanLimits(tier).canPublish` check before each post

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
| 5. Scheduled Posts | Auto-schedule posts for connected platforms | None (DB) | 0c |

**Auto-trigger:** Marketing fires automatically when `listings.preparation_status` transitions to `'prepared'` (via webhook/trigger in the preparation flow).

**Status writes:** Handler updates `listings.marketing_status` (`processing` → `completed`/`failed`/`skipped`).

## Social Publishing

`lib/social/publish-service.ts` exports:
- `publishToFacebook(pageAccessToken, pageId, content)` → `PublishResult`
- `publishToInstagram(accessToken, igAccountId, content)` → `PublishResult`
- `publishToLinkedIn(accessToken, personUrn, content)` → `PublishResult`

`PublishResult` = `{ success, postId?, postUrl?, error? }`

## Vercel Crons

Defined in `vercel.json`:

| Cron | Schedule | File |
|------|----------|------|
| Publish Scheduled Posts | Every 15 min | `app/api/cron/publish-scheduled/route.ts` |
| Sync Analytics | Every 6 hours | `app/api/cron/sync-analytics/route.ts` |
| Daily Digest | (existing) | `app/api/cron/daily-digest/route.ts` |

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

## Applied Migrations (Feb 2026)

These migrations have been applied to the live Supabase database:

1. `20260216_marketing_jobs.sql` — marketing_jobs table with per-step status, JSONB artifacts, cost tracking, RLS
2. `20260216_marketing_jobs_scheduled_posts.sql` — scheduled_posts_status/result columns on marketing_jobs
3. `20260216_published_posts.sql` — published_posts table with analytics columns, RLS, service role bypass
4. `20260216_photos_tools_applied.sql` — tools_applied text[] column on photos table

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

## Important Notes

1. **Node Version**: 20 (see .nvmrc)
2. **No test framework** currently configured
3. **Image Pipeline**: Raw → Supabase Storage → Worker → R2 → CDN (Cloudinary)
4. **Deploy**: Next.js to Vercel, Worker to Cloudflare via wrangler
5. **Supabase project**: `asoiwonhqoesbvcilqwd.supabase.co` (South Asia / Mumbai region)
6. **Always run `npx tsc --noEmit` before considering any change complete**
7. **Marketing pipeline uses always-complete semantics** — each step is independent; one failing doesn't block others
8. **Free-tier users are gated** at both marketing handler (skipped) and cron publisher (canPublish: false)
