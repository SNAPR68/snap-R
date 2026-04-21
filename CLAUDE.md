# CLAUDE.md - SnapR Codebase Guide

## Detailed References

Point at these when more depth is needed — this file is the index, those are the specifics:

- @AGENTS.md — agent runbook + internal agent architecture notes
- @EXECUTION_CHANGELOG.md — every structural change committed to this repo (pre-commit hook enforces updates)
- @AI_MODELS_REFERENCE.md — which AI model is used where and why
- @ARCHITECTURE_RULES.md — non-negotiable architecture constraints
- @PRODUCTION_READINESS_2.0.md — production readiness checklist + status
- @SNAPR_COMPREHENSIVE_AUDIT.md — full codebase audit snapshot
- @docs/SNAPR-TECHNICAL-INFRASTRUCTURE.md — infra diagrams + service map
- @docs/FEATURE-JOURNEY.md — end-to-end user journey per feature
- @docs/PHASE1_HARDENING_AUDIT.md — security/quality hardening history
- @docs/ROLLBACK.md — rollback procedures per deploy target
- @docs/SOCIAL_PLATFORM_APPROVAL_GUIDE.md — Facebook/IG/LinkedIn/TikTok app review steps
- @apps/processor/CLAUDE.md — Cloudflare Worker (photo + marketing pipeline) subdoc
- @remotion/CLAUDE.md — Remotion Lambda video pipeline subdoc
- @app/api/CLAUDE.md — Next.js API route conventions + auth patterns
- @lib/CLAUDE.md — shared library conventions (Supabase clients, validation, rate limits)

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
- **Payments**: Stripe (subscription tiers), RevenueCat (built but dormant — see Important Notes)
- **Email**: Resend
- **Monitoring**: Sentry, OpenTelemetry, PagerDuty (alerting)
- **Testing**: Vitest, React Testing Library, Playwright (E2E), k6 (load), Stryker (mutation), axe-core (WCAG)
- **CI/CD**: GitHub Actions (tsc + eslint + vitest), Lighthouse CI, OWASP ZAP security scan
- **i18n**: next-intl (English + Spanish skeleton)

## Project Structure

```
/app                    - Next.js App Router pages and API routes
/app/api/cron/          - Vercel Cron jobs (daily-digest, publish-scheduled, sync-analytics, cleanup, verify-domains)
/app/api/marketing/     - Marketing status API
/app/api/listing/       - Listing status/preparation API
/app/dashboard/         - Dashboard pages (39 feature areas, 69 page.tsx files)
/app/dashboard/leads/   - Lead CRM with list view + Kanban pipeline (drag-and-drop)
/app/dashboard/leads/sequences/ - Drip sequence management UI (create/edit/enable/delete + step editor)
/app/dashboard/leads/email-lists/ - Bulk email contact list + compose/send UI
/app/dashboard/open-houses/ - Open house event CRUD + attendee tracking
/app/dashboard/photographer/bookings/ - Photographer booking pipeline management
/app/dashboard/broker/  - Broker team dashboard (agent roster, stats)
/app/dashboard/brand/   - Brand kit management
/app/dashboard/campaigns/ - Campaign management + calendar
/app/dashboard/cma/     - Comparative market analysis
/app/dashboard/floor-plans/ - Floor plan management
/app/dashboard/virtual-tours/ - Virtual tour builder (scenes, hotspots)
/app/dashboard/renovation/ - Renovation visualization
/app/dashboard/staging/ - Virtual staging management
/app/dashboard/portfolio/ - Photographer portfolio
/app/dashboard/team/    - Team management
/app/dashboard/organization/ - Organization settings
/app/dashboard/notify/  - Notification preferences
/app/dashboard/voiceover/ - Voiceover management
/app/dashboard/print/   - Print materials
/app/dashboard/mls/     - MLS integration settings
/app/dashboard/billing/ - Billing & subscription
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
/lib/revenuecat/        - RevenueCat client, webhook handler, sync (built, dormant — Stripe is primary)
/lib/listing-health.ts  - Listing health score calculator (0-100, A-F grade, 4 dimensions)
/lib/mls/               - MLS provider adapters (SimplyRETS)
/lib/notify/            - SMS/WhatsApp via Twilio
/lib/validation/        - Zod schemas for API input validation (schemas.ts)
/lib/api-keys.ts        - API key generation, validation (SHA-256 + timing-safe)
/lib/api-v1/            - V1 API middleware (withApiAuth() HOF)
/lib/services/          - Service layer (listings-service.ts for v1 + internal reuse)
/lib/env.ts             - Environment variable startup validation
/lib/monitoring/        - Sentry cron heartbeat, PagerDuty alerting, DB monitoring
/public/widget/         - snapr-embed.js widget loader script
/remotion/              - Remotion video compositions and config
/remotion/compositions/ - Video templates (PropertyShowcase, JustListed, OpenHouse, PriceDrop, Sold)
/remotion/components/   - Shared video components (AudioLayer, ClosingCard, etc.)
/components             - React components
/__tests__/             - Test suites (42 files, 545 tests)
/__tests__/components/  - Component tests (21 files, React Testing Library)
/__tests__/components/ui/ - UI primitive tests (button, input, badge, card, tabs, textarea)
/load-tests/            - k6 load test scripts (7 scenarios)
/e2e/                   - Playwright E2E tests + WCAG audit
/security/              - OWASP ZAP config + security scan workflows
/i18n/                  - next-intl config (routing, request)
/messages/              - i18n translation files (en.json, es.json)
/scripts/               - Seed scripts, capture scripts, voiceover generation
/supabase/migrations/   - Database migrations (38+ files)
/database               - Supabase schema reference
```

## Commands

```bash
npm run dev             # Start Next.js dev server
npm run build           # Build Next.js app
npm run lint            # Run ESLint
npx tsc --noEmit        # TypeScript compile check (use before every commit)
npx vitest run          # Run all tests (42 files, 545 tests)
npx vitest run --coverage # Tests with coverage report
npx playwright test     # E2E tests + WCAG audit
npm run test:mutate     # Stryker mutation testing
npm run deploy          # Deploy Cloudflare Worker (wrangler deploy)
npm run preview         # Local Worker testing (wrangler dev)
vercel --prod --yes     # Deploy to production (after merge to main)
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


## Detailed references (subdocs)

@docs/claude-code/design-system.md
@docs/claude-code/database.md
@docs/claude-code/features.md
@docs/claude-code/studio.md
@docs/claude-code/api.md
@docs/claude-code/environment.md

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
- **Accessibility**: Modals use `role="dialog"` + `aria-modal="true"` + `aria-label` + ESC key dismiss; forms use `aria-label` on inputs; pages use semantic HTML (`<nav>`, `<section>`, `<footer>`); WCAG 2.1 AA audited via axe-core
- **Modal pattern**: All custom modals (`fixed inset-0 z-50`) must include `useEffect` with `keydown` listener for `Escape` key. The shadcn Dialog handles this via Radix natively.

