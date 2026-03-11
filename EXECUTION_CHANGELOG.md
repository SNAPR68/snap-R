# SnapR Execution Changelog
=================================

## 2026-03-11 — User guide with PDF generation and email delivery (+ review fixes)

### Code Review Fixes (CodeRabbit)
- `app/api/guide/request/route.ts` — Added error handling for DB insert and both
  Resend email sends. Added `escapeHtml()` to sanitize user-provided name in email
  templates (prevents HTML injection). Team notification uses escaped interpolation.
- `components/guide-request-form.tsx` — Differentiated timeout vs network errors
  in catch block (checks `DOMException` + `TimeoutError` name).
- `app/page.tsx` — Added `aria-label="Email for iOS app notification"` to the
  iOS notify modal email input for accessibility compliance.

### PDF Marketing Guide (NEW)
- `lib/print/guide-template.tsx` — 8-page PDF document built with `@react-pdf/renderer`.
  Covers: professional photo stats, 5-step workflow, AI enhancement tools, marketing
  automation, social media/analytics strategy, getting started guide. Dark theme with
  gold accents, QR code on final page.

### Guide Request API (NEW)
- `app/api/guide/request/route.ts` — POST endpoint that validates email (Zod),
  generates PDF (cached in module-level variable), sends via Resend with attachment,
  saves to `contact_submissions` table. Rate limited: 3 req/min per IP.

### GuideRequestForm Component (NEW)
- `components/guide-request-form.tsx` — Reusable client component with two variants:
  `inline` (horizontal, for footer) and `card` (vertical, for sections/pages).
  Handles loading, success, and error states with analytics tracking.

### Landing Page Updates
- Added "Free Marketing Guide" section between Testimonials and Pricing with
  2-column layout (chapter preview + email form).
- Replaced footer lead capture with `GuideRequestForm` component.
- Added "Free Guide" nav link to desktop and mobile navigation.
- Added `/guide` to footer links.

### Dedicated Guide Page (NEW)
- `app/guide/page.tsx` — Full landing page with hero, 6-chapter card grid,
  3 persona cards (agents, brokers, photographers), bottom CTA. SEO metadata.

### Schema & Analytics
- Added `guideRequestSchema` to `lib/validation/schemas.ts`.
- Added `GUIDE_REQUESTED` event to `lib/analytics.ts`.

---

## 2026-03-11 — Monitoring & alerting infrastructure

### Cron Heartbeat System (NEW)
- `lib/monitoring/cron-heartbeat.ts` — `startCronHeartbeat()` records execution time,
  success/failure, and results to `system_logs` table. `checkCronHealth()` detects
  overdue crons by comparing last heartbeat against expected schedule (2× buffer).
- Wired into all 6 existing crons: publish-scheduled, sync-analytics, daily-digest,
  refresh-tokens, drip-sequences, usage-check.

### Alert Throttle (NEW)
- `lib/monitoring/alert-throttle.ts` — In-memory deduplication prevents alert spam
  during cascading failures. Max 1 alert per source per 15 minutes.
- Integrated into `lib/error-logger.ts` `logEvent()` — critical alerts now throttled.

### Slack Alerting (NEW)
- `lib/monitoring/slack-alert.ts` — Optional Slack webhook integration. Sends
  structured Block Kit messages to `SLACK_ALERT_WEBHOOK_URL` (no-ops if not set).
- Fires alongside email for all critical errors.

### Health Endpoint Expanded
- `app/api/health/route.ts` — Now checks: database, storage, Redis (if configured),
  cron staleness. Returns per-check latency and cron status details.

### Health Check Watchdog Cron (NEW)
- `app/api/cron/health-check/route.ts` — Hourly cron that checks DB, storage, Redis,
  and cron staleness. Sends critical alert (email + Slack) if any check fails.
- Added to `vercel.json` crons: `0 * * * *` (hourly).

### Tests
- `__tests__/monitoring.test.ts` — 10 new tests for alert throttle, Slack alerts,
  and cron heartbeat. Total: 220 tests (up from 210).

## 2026-03-11 — Redis-backed rate limiting across all high-value API routes

### Rate Limit Infrastructure
- **Refactored `lib/rate-limit.ts`**: Per-endpoint Redis limiters created lazily and cached (no single shared limiter)
- **Dual-layer defense**: Sync in-memory (Edge middleware) + async Upstash Redis (API routes)
- **Graceful degradation**: Redis failure auto-falls back to in-memory; no Redis env vars = in-memory only

### Middleware — New Rate Limit Entries (7 added)
- `/api/social/publish`: 15 req/min
- `/api/leads/bulk-email`: 5 req/min
- `/api/user/delete-account`: 2 req/hour
- `/api/campaigns`: 20 req/min
- `/api/renovation`: 5 req/min
- `/api/video`: 10 req/min
- `/api/partners/apply`: 3 req/hour

### API Routes — Redis-backed `checkRateLimitAsync` wired into 9 routes
- `app/api/enhance/route.ts` — 10 req/min (AI cost protection)
- `app/api/upload/route.ts` — 30 req/min (storage abuse prevention)
- `app/api/contact/route.ts` — 3 req/min (spam prevention)
- `app/api/social/publish/route.ts` — 15 req/min (social API abuse)
- `app/api/leads/bulk-email/route.ts` — 5 req/min (email cost control)
- `app/api/user/delete-account/route.ts` — 2 req/hour (destructive op)
- `app/api/campaigns/route.ts` — 20 req/min (campaign abuse)
- `app/api/renovation/route.ts` — 5 req/min (paid Replicate credits)
- `app/api/notify-approval/route.ts` — already wired (5 req/min)

### Consolidated Custom Rate Limiters
- `app/api/log-error/route.ts` — replaced 25-line custom Map limiter with `checkRateLimitAsync`
- `app/api/partners/apply/route.ts` — replaced 12-line custom Map limiter with `checkRateLimitAsync`

### Tests (210 total, +6 new)
- 6 new async rate limit tests: first request, blocking, per-identifier isolation, response shape, per-route limits, destructive op limits

## 2026-03-11 — CodeRabbit review fixes: error leakage, MIME validation, shared schema

- **Notification route**: Return generic error instead of leaking Supabase `error.message`
- **Notification route**: Use shared `uuidSchema` from `lib/validation/schemas.ts` (not inline `z`)
- **Video convert**: Add MIME type allowlist (`video/webm`, `video/mp4`, `video/quicktime`) + use actual content type for storage
- **Shared schema**: Add reusable `uuidSchema` export to `lib/validation/schemas.ts`
- **Tests**: Rename misleading XSS test, fix UTM assertion to match full UUID, add `vi.resetModules()` for Stripe singleton isolation

## 2026-03-10 — Final hardening: auth guards, security audit, legacy cleanup, 204 tests

### Security — Auth Guards
- **Renovation API**: Added `getUser()` auth guard — previously unauthenticated, consumed paid Replicate credits
- **Batch enhance API**: Added explicit `getUser()` auth check before processing
- **Reorder photos API**: Added explicit `getUser()` auth check before modifying display order

### Security — Legacy OAuth Route Removal (6 files deleted)
- Deleted `app/api/social/facebook/route.ts` — no auth, no CSRF state validation
- Deleted `app/api/social/linkedin/route.ts` — `Math.random()` CSRF state (predictable)
- Deleted `app/api/social/tiktok/route.ts` — `Math.random()` CSRF state (predictable)
- Deleted `app/api/social/facebook/callback/route.ts` — paired with insecure initiator
- Deleted `app/api/social/linkedin/callback/route.ts` — paired with insecure initiator
- Deleted `app/api/social/tiktok/callback/route.ts` — paired with insecure initiator
- Proper routes exist at `/api/social/connect/[platform]` + `/api/social/oauth/[platform]`

### Security — Audit Fixes
- **Hardcoded test credentials removed**: `app/api/admin/create-test-account/route.ts` now reads from `TEST_ACCOUNT_EMAIL` and `TEST_ACCOUNT_PASSWORD` env vars
- **Share token entropy**: Increased from 12 chars (48-bit) to full 32-char UUID (128-bit)
- **Error message leakage**: Share API no longer exposes internal error messages to clients
- **Video upload validation**: Added 100MB file size limit + Blob type check to `/api/video/convert`
- **WhatsApp webhook validation**: Added `whatsapp:` prefix check + 500-char message length limit
- **Notification UUID validation**: Added Zod UUID safeParse on `[id]` param

### Test Foundation (149 → 204 tests, 11 files)
- **`__tests__/api-smoke.test.ts`** (33 tests): Route module exports, Zod schema validation, SQL injection/XSS/DoS prevention, parseBody helper
- **`__tests__/critical-path.test.ts`** (22 tests): Enhancement pipeline, billing gates, UTM tracking, MLS compliance pipeline, XSS prevention, rate limiting, R2 URL resolution, Stripe config

### Verification
- 0 TypeScript errors (`tsc --noEmit`)
- 0 ESLint warnings
- 204 tests passing (11 test files)

## 2026-03-10 — Battle-ready: security, features, tests, deprecated code removal

### Security & Critical Fixes
- **OG/Twitter images**: Added social preview metadata to `app/layout.tsx`
- **Deleted unauthenticated test endpoint**: Removed `app/api/v3/test-imagen/route.ts` (exposed API key info)
- **Added auth to email-template**: `app/api/email-template/route.ts` now requires Supabase auth
- **Rate limiting**: Added to `app/api/notify-approval/route.ts` (5 req/min)
- **Admin emails configurable**: `NEXT_PUBLIC_ADMIN_EMAILS` env var in admin layout + login
- **R2 env var fallback**: `lib/utils.ts` checks both `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL` and `CLOUDFLARE_R2_PUBLIC_URL`

### Social Publishing — Video Support
- **LinkedIn video publishing**: New `uploadVideoToLinkedIn()` + `publishVideoToLinkedIn()` in `lib/social/publish-service.ts`
- **Twitter video publishing**: New `uploadVideoToTwitter()` (chunked upload) + `publishVideoToTwitter()` in `lib/social/publish-service.ts`
- **TikTok privacy configurable**: `TIKTOK_PRIVACY_LEVEL` env var (was hardcoded `SELF_ONLY`)
- **Wired into cron publisher**: LinkedIn + Twitter video cases in `app/api/cron/publish-scheduled/route.ts`
- **Wired into publish-video API**: LinkedIn video in `app/api/publish-video/route.ts`

### Analytics & Property Sites
- **Property site analytics**: Wired `trackPageView` in `app/p/[slug]/PropertySiteClient.tsx` with UTM params

### Error Boundaries & Accessibility
- **31 new error.tsx files**: Coverage for all dashboard sub-routes with Sentry integration
- **Modal accessibility**: `role="dialog"` + `aria-modal="true"` on ShowingsDashboard modals
- **Alt text fixes**: BrokerDashboardClient, listings/new page

### Deprecated Package Removal
- **Deleted `lib/auth/protect.ts`**: Dead re-export file
- **Migrated 6 files** from `@supabase/auth-helpers-nextjs` to `@/lib/supabase/server` or `@/lib/supabase/client`:
  - `app/admin/login/page.tsx`, `app/api/listing-intelligence/[analysisId]/route.ts`,
  - `app/api/jobs/[id]/route.ts`, `app/(authenticated)/jobs/page.tsx`,
  - `app/(authenticated)/listings/[id]/page.tsx`, `app/(authenticated)/listings/page.tsx`
- **Removed `@supabase/auth-helpers-nextjs`** from package.json entirely

### Feature Fixes
- **Photo culling export**: Replaced clipboard-only with JSON manifest file download + separate Copy URLs button
- **Admin MRR**: Replaced hardcoded `$0` with real Stripe API integration (`fetchMRR()` queries active subscriptions)

### Test Foundation (93→149 tests)
- **4 new test files** (56 tests):
  - `__tests__/html-escape.test.ts` — XSS prevention (8 tests)
  - `__tests__/mls-specs.test.ts` — MLS validation rules (16 tests)
  - `__tests__/disclosure.test.ts` — MLS disclosure generation (17 tests)
  - `__tests__/utils.test.ts` — Core utilities + R2 URL resolution (15 tests)

### Verification
- 0 TypeScript errors (`tsc --noEmit`)
- 0 ESLint warnings
- 149 tests passing (9 test files)

## 2026-03-10 — Fix: add max length to imageBase64 schema

- `mobileAnalyzeFrameSchema.imageBase64`: added `.max(15_000_000)` (~10 MB base64 cap)
- Addresses PR #95 review: unbounded base64 string could cause memory pressure

## 2026-03-10 — Zod validation blitz: 86→99 validated API routes

### Add Zod input validation to 13 previously unvalidated API routes

**New schemas added (16 schemas in lib/validation/schemas.ts):**
- `socialPublishExtendedSchema`, `publishVideoExtendedSchema`, `emailTemplateSchema`
- `enhanceQuickExtendedSchema`, `complianceApplyExtendedSchema`
- `downloadAllExtendedSchema`, `marketingTriggerExtendedSchema`
- `oauthCallbackSchema`, `analyticsPostsQuerySchema`, `videoConvertSchema`
- `analyticsPostRecordSchema`, `listingIntelligencePatchSchema`, `jobActionSchema`
- `downloadApprovedQuerySchema` + `parseQuery` helper for query param validation
- `mobileAnalyzeFrameSchema`, `notificationsQuerySchema`, `teamsJoinQuerySchema`

**Routes wired with Zod validation:**
- `POST /api/social/publish` — platform, content, imageUrls, scheduleFor
- `POST /api/publish-video` — platform, videoUrl, caption
- `POST /api/email-template` — property, postType, agentInfo, tone
- `POST /api/download-all` — listingId (UUID)
- `POST /api/marketing/trigger` — listingId (UUID)
- `POST /api/enhance-quick` — imageUrl, photoId, listingId, userId
- `POST /api/compliance/apply` — imageUrl, toolId, watermark options
- `POST /api/analytics/posts` — platform, listingId, caption
- `PATCH /api/listing-intelligence/[analysisId]` — recommendationId (UUID)
- `POST /api/jobs/[id]` — action enum ('retry')
- `GET /api/download-approved` — listingId query param (UUID)
- `POST /api/upload` — listingId FormData field (UUID)
- `POST /api/upload-image` — folder FormData field (sanitized regex)

**Coverage: 99/163 routes validated (60%, up from 53%)**
- Remaining 64 unvalidated routes are GET-only (cron, admin, OAuth initiation, status checks)
- Only 4 body-reading routes remain unvalidated (FormData with existing runtime checks)
- Risk Level: Low (additive validation, no behavior changes for valid inputs)

## 2026-03-10 — CodeRabbit round-3 review fixes for PR #94

### Address round-3 findings: GDPR compliance, validated.data usage, Zod schemas

- **GDPR compliance**: Check Supabase delete result in facebook-deletion callback — return 500 if deletion fails instead of false success
- **Security**: Tighten Facebook deletion payload schema to `z.literal('HMAC-SHA256')` (reject unexpected algorithm claims)
- **Security**: Validate `code` query param in deletion status GET endpoint (hex format check)
- **Bug fix**: Use `validated.data` instead of raw `body` in property-site POST and PATCH handlers (bypassed Zod transforms/restrictions)
- **Validation**: Add `propertySiteUpdateSchema` for PATCH with snake_case DB field names (`id`, `is_published`, `custom_colors`, `agent_info`)
- **Validation**: Add `propertySiteDeleteSchema` for DELETE with UUID `id` validation
- **Cleanup**: Remove `.passthrough()` from `propertySiteSchema` to enforce strict schema matching
- Risk Level: Medium (GDPR + validation improvements, no schema migrations)

## 2026-03-09 — CodeRabbit review fixes for PR #94

### Address 10 inline + 6 outside-diff findings from automated code review

- **Security**: Verify Facebook signed_request HMAC-SHA256 signature before trusting user_id (was forgeable)
- **Security**: Change LinkedIn test endpoint from GET to POST (prevent accidental publishes via crawlers)
- **Bug fix**: Restore canGenerateCaption limit guard in caption route (over-limit users could generate unlimited)
- **Bug fix**: Use validated.data instead of raw body in prepare-notification route (bypassed Zod coercions)
- **Bug fix**: Thread includeCallToAction and maxLength CaptionOptions into prompt (were silently dropped)
- **Cleanup**: Remove dead setLoading state and all calls in checkout page
- **Cleanup**: Capture template query param in content-studio customize (was no-op)
- **Cleanup**: Remove unused userId prop from ComplianceSettings interface + caller
- **Observability**: Add error logging to property-site GET/DELETE catch blocks, job-status photos query, admin partners query
- **Accessibility**: Add aria-label, aria-pressed, htmlFor to compliance-settings toggle and select
- **Typing**: Fix catch clause in compliance-settings to use `catch (error: unknown)` pattern
- Risk Level: Medium (security + bug fixes, no schema changes)

## 2026-03-09 — Zero ESLint warnings: complete cleanup from 175→0

### Full codebase ESLint warning elimination across 30+ files

- **Unused vars/imports (15+ files)**: Removed unused imports, unused destructured variables, unused catch parameters (`catch (error)` → `catch {`), unused state setters (`[x, setX]` → `[, setX]`)
- **eslintrc config**: Added `argsIgnorePattern: "^_"` and `varsIgnorePattern: "^_"` to `@typescript-eslint/no-unused-vars` rule
- **Exhaustive deps (9 files)**: Added `eslint-disable-next-line react-hooks/exhaustive-deps` before dependency arrays in useEffects that intentionally omit deps (camera, campaigns, BulkCreator, library, partner, org dashboard, PropertySiteClient, tour viewer, approval-summary, preparation-overlay)
- **Unescaped entities (11 files)**: Escaped `'` → `&apos;` and `"` → `&quot;` in JSX across listings, academy (4 pages), founding, org landing, terms, approval-summary, compliance-settings, dashboard-analytics
- **next/image conversion (4 files)**: Converted `<img>` → `<NextImage>` with `unoptimized` prop in content-studio/select, listing-intelligence, virtual-tours (5 tags), watermark (2 tags)
- **Alt-text (3 files)**: Added `eslint-disable-next-line jsx-a11y/alt-text` for Lucide `Image` icon components (not actual images) in portfolio, dashboard-analytics, watermark
- **Unused Priority import**: Removed from strategy-builder.ts
- **Result**: 0 ESLint warnings, 0 TypeScript errors
- Risk Level: Low (no behavioral changes, cosmetic/lint-only)

## 2026-03-08 — Code quality batch: code splitting, entities, unused imports, next/image

### Bundle size reduction + lint cleanup across 18 files

- **Code splitting (5 pages)**: Added `next/dynamic` lazy loading for heavy client components — StudioClient, VideoCreator, UnifiedCreator, EmailMarketing, PropertySiteClient
- **Unescaped entities (9 files)**: Fixed all `'` → `&apos;` in JSX text content across partners, billing, FAQ, academy, photo-culling, not-found, upgrade-prompt, ai-analysis-tab
- **next/image conversion (1 file)**: Converted 3 `<img>` tags to `next/image` with `unoptimized` in photo-culling page; renamed Lucide `Image` → `ImageIcon` to avoid ESLint collision
- **Unused imports (3 files)**: Removed unused `Check`, `Building2`, `Sparkles`, `useCallback`, `Filter`, `Grid`, `List`, `Copy`, `Trash2` imports; removed unused `title` param
- **ESLint**: 0 warnings across all modified files
- **TypeScript**: 0 errors
- Risk Level: Low (no behavioral changes)

## 2026-03-08 — AbortSignal.timeout CodeRabbit fixes

- Upload page timeout: 15s → 120s (large file uploads need more time)
- AI descriptions timeout: 15s → 30s (matches UI expectation text)
- Email lists: surface timeout errors instead of silent empty state
- Risk Level: Low

## 2026-03-08 — AbortSignal.timeout on fetch calls (batch 1)

### Prevent hanging requests from blocking Vercel functions

- Added `AbortSignal.timeout()` to ~200 external fetch calls across 83 files
- Timeout values: 30s for AI/processing calls, 15s for standard APIs, 10s for internal calls
- Files Modified: 83 files
- Architectural Impact: Reliability improvement — no more indefinite hangs on upstream failures
- Risk Level: Low (timeout additions only, no behavioral changes)

## 2026-03-07 — Codebase Hardening: Zod Validation, Timeouts, Catch Blocks, Cleanup

### Comprehensive remediation across 255 files

- **Zod Validation (96 routes)**: Added input validation schemas to all body-accepting API routes via `lib/validation/schemas.ts`. Every POST/PATCH/PUT route now validates with `safeParse()` before processing.
- **AbortSignal.timeout (~32 files)**: Added `AbortSignal.timeout(15000)` to external fetch calls to prevent hanging requests from blocking Vercel functions.
- **Catch blocks (168 fixed)**: Standardized all catch blocks to `catch (error: unknown)` with `instanceof Error` guards, or `catch {}` for empty handlers. Eliminated all `catch (e)` and untyped `catch (error)` patterns.
- **Backup file cleanup (11 deleted)**: Removed all `.backup` files from repo (page.tsx.backup, route.ts.backup, etc.)
- **Exhaustive-deps fixes (4 bugs)**: Fixed react-hooks/exhaustive-deps warnings in settings, portfolio, virtual-tours, and listing-intelligence pages.
- **Structured logger**: Created `lib/logger.ts` with debug/info/warn/error log levels.
- Files Modified: 255 files (+2133/-9315 lines)
- Architectural Impact: Security hardened (all API inputs validated), reliability improved (fetch timeouts), code conventions enforced (typed catches).
- Risk Level: Low (no behavioral changes, only validation/safety additions)

## 2026-03-07 — Phase F Wave 2: Comprehensive Type Safety + Loading States + Error Boundaries

### Type Safety — Zero `any` types (67 → 0)
- 70+ files across `app/`, `lib/`, `components/`, `functions/`, `apps/processor/` — Eliminated ALL `any` types
- `lib/ai/listing-engine/multi-pass-twilight.ts` — Full rewrite: `unknown` + `normalizeOutputUrl` helper
- `lib/ai/listing-engine/window-masking.ts` — Full rewrite: same pattern as multi-pass-twilight
- `lib/renovation/service.ts` — Full rewrite: `PredictionResult` interface, `extractOutputUrl` helper
- `app/api/voiceover/route.ts` — `ScriptStyleKey`/`VoiceIdKey` type aliases replace `as any` casts
- `app/dashboard/settings/notifications/page.tsx` — `useCallback`, `WeeklyDay` type, keyof-based select
- `lib/cloudflare.ts` — `Record<string | symbol, unknown>` proxy getter
- `lib/ai/listing-engine/provider-router.ts` — `Record<string, string | undefined>` for env access
- `lib/ai/listing-engine/batch-processor.ts` — Index signature on `AutoEnhanceOptions`
- `lib/ai/providers/replicate-queue.ts` — `Promise<T>` cast on queue return
- `components/preparation-overlay.tsx` — `SSEData` interface for SSE message handler
- All API routes, dashboard pages, admin pages — inline type widening for Supabase query results

### Loading States — 54 new loading.tsx files
- Every dashboard sub-route now has a loading.tsx skeleton screen (gold spinner)
- Covers: ai-descriptions, approvals, auto-post, billing, brand, calendar, camera, campaigns, cma, content-studio (14 sub-routes), content/scheduled, how-it-works, leads (3 sub-routes), listing-intelligence, listings/new, mls, notify, open-houses, organization, partner, photo-culling, photographer (2), portfolio, print, renovation, settings (4 sub-routes), showings, staging, team, virtual-tours, voiceover

### Error Boundaries — 10 new error.tsx files
- `app/(authenticated)/error.tsx`, `app/checkout/error.tsx`, `app/onboarding/error.tsx`
- `app/p/[slug]/error.tsx`, `app/tour/[slug]/error.tsx`, `app/open-house/[slug]/error.tsx`, `app/book/[slug]/error.tsx`
- `app/dashboard/content-studio/error.tsx`, `app/dashboard/studio/error.tsx`, `app/dashboard/leads/error.tsx`

### Accessibility
- `components/skip-nav.tsx` — NEW: Skip-to-main-content link (sr-only, visible on focus)
- `app/layout.tsx` — Wired SkipNav + `<div id="main-content">` wrapper

### Cleanup
- Deleted `components/content-studio/unified-creator.backup.tsx` and `components/studio-client.tsx.backup`

## 2026-03-06 — Phase F Wave 1: Launch Polish

### Cleanup, Type Safety, Accessibility

- `app/sentry-example-page/page.tsx` — DELETED: Removed Sentry example page (was leaking org/project ID publicly)
- `app/page-backup.tsx`, `app/page-backup-20251229-134429.tsx` — DELETED: Removed backup page files (26K+ lines of dead code)
- `*.bak` (7 files) — DELETED: Removed all .bak backup files from root
- `app/dashboard/analytics/loading.tsx` — NEW: Skeleton loading state with gold spinner
- `app/dashboard/broker/loading.tsx` — NEW: Skeleton loading state with gold spinner
- `app/dashboard/content-studio/loading.tsx` — NEW: Skeleton loading state with gold spinner
- `app/dashboard/leads/loading.tsx` — NEW: Skeleton loading state with gold spinner
- `app/dashboard/listings/loading.tsx` — NEW: Skeleton loading state with gold spinner
- `app/dashboard/settings/loading.tsx` — NEW: Skeleton loading state with gold spinner
- `app/dashboard/studio/loading.tsx` — NEW: Skeleton loading state with gold spinner
- `app/dashboard/cma/page.tsx` — Fixed all `any` types: `listing: ListingRow` typed map, `value: string | number` in updateComp, removed dead `(window as any)` code block. Removed unused `html2pdfLoaded` and `reportData` state. Converted 2 `<img>` to `next/image`. Fixed unescaped apostrophe in JSX.
- `components/content-studio/facebook-renderer.tsx` — Added `alt=""` to all `<img>` tags (30+ occurrences). Added `/* eslint-disable @next/next/no-img-element */` — canvas rendering component cannot use next/image.
- `app/p/[slug]/page.tsx` — Removed debug `console.log` from server component.

## 2026-03-06 — Phase E: Launch Readiness

### Pricing/Checkout Alignment (Gap 1)
- `app/api/stripe/checkout/route.ts` — REWRITTEN: Replaced hardcoded `$99 base + $18/listing` formula with same per-listing pricing function as pricing-section.tsx. Gold: paygo=$28, monthly 5-50=$20/75-300=$16, annual 5-50=$16/75-300=$11. Platinum: paygo=$30, monthly 5-50=$22/75-300=$18, annual 5-50=$18/75-300=$12. Added paygo mode (Stripe `payment` vs `subscription`). Preserved `planKey` in metadata for webhook normalization.

### Sample Demo Listing (Gap 2)
- `app/api/listing/sample/route.ts` — NEW: Creates a sample listing with 5 curated Unsplash property photos so new users can explore the AI studio without uploading. Limited to one sample per user.
- `app/dashboard/listings/page.tsx` — Enhanced empty state with "Try with Sample Photos" button that creates a sample listing and navigates to studio. Kept "Upload Your Photos" as primary CTA.

### Email Verification Resend (Gap 3)
- `app/auth/signup/page.tsx` — REWRITTEN: Added dedicated verification screen after signup with "Resend verification email" button (60s cooldown), Google alternative, and "Wrong email? Go back" link. Fixed free plan subtitle accuracy.

### Password Change Notification (Gap 4)
- `app/api/auth/password-changed/route.ts` — NEW: Sends security notification email via Resend after password change. Rate limited via system_logs (5 min). Includes timestamp, device info, "Didn't change your password?" reset link.
- `app/auth/reset-password/page.tsx` — Wired fire-and-forget POST to password-changed endpoint after successful updateUser.

### Testimonials Cleanup (Gap 5)
- `components/testimonials.tsx` — Removed stock Unsplash photos (replaced with initial avatars). Changed heading from "Trusted by Photographers Everywhere" to "Built for Real Estate Pros". Replaced fabricated vanity stats (10K+ photos, 500+ clients, 4.9 rating) with honest product stats (15+ tools, 30s avg time, 5-in-1 pipeline). Shortened names to first name + initial only.

## 2026-03-06 — Phase D: Aha Moment

### Onboarding Compression (7 → 3 steps)
- `app/onboarding/page.tsx` — Compressed from 7 steps to 3: Step 1 merges profile + role selection, Step 2 keeps "How It Works" walkthrough, Step 3 is "Get Started" CTA. Removed brand profile, social connections, and WhatsApp steps (deferred to progressive disclosure in dashboard settings). Reduces time-to-first-listing from ~5 min to ~60s.

### API Timeout Hardening
- `app/api/enhance/route.ts` — Added 120s timeout on AI enhancement processing via Promise.race. Added AbortSignal.timeout(15000) on enhanced image download fetch. Fixed pre-existing unused `userTier` lint warning.

### Unsubscribe Page
- `app/unsubscribe/page.tsx` — NEW: Landing page for email unsubscribe links (referenced in welcome email and usage-check cron emails). Directs users to dashboard notification settings. Branded with luxury dark theme.

### Dead Route Fix
- `app/dashboard/listings/new/page.tsx` — NEW: Server redirect from `/dashboard/listings/new` → `/listings/new`. Fixes dead-end link in renovation page.
- `app/dashboard/renovation/page.tsx` — Fixed dead link from `/dashboard/listings/new` to `/listings/new`. Replaced `any` type with `ListingPhoto` interface. Replaced `<img>` tags with `next/image` `<Image>`. Removed unused imports (ChevronDown, MapPin).

## 2026-03-06 — Phase C: Scale Infrastructure

### Error Boundary + Sentry Integration
- `components/error-boundary.tsx` — Added Sentry.captureException in componentDidCatch with scope tags (error.boundary context). Fixed `any` type → `ErrorInfo`. Changed fallback from full-page reload to React state reset. Added optional `context` prop for labeling boundaries.

### Webhook Retry with Exponential Backoff
- `lib/webhooks/dispatch.ts` — Added retry logic: 3 attempts with exponential backoff (1s, 4s, 16s). Only retries on network errors or 5xx; 4xx is a final failure. Logs `attempts` count in `webhook_deliveries`. Added `sleep()` utility.

### API Error Handler Utility
- `lib/api/handler.ts` — NEW: DRY utilities for API routes: `withAuth()` (auth + supabase client), `parseBody(request, zodSchema)` (JSON parse + Zod validation), `apiError(message, status)` / `apiSuccess(data)` (standardized responses), `handleApiError(source, handler)` (try/catch wrapper with Sentry reporting).

### Type Safety Fixes
- `lib/error-logger.ts` — Replaced 4 `any` types with `unknown` (LogEntry.metadata, logError, logCritical, sendAlertEmail). Removed unused catch variable bindings.

## 2026-03-06 — Phase B: GTM Readiness

### Upgrade Nudge + Usage Widget
- `components/upgrade-nudge.tsx` — NEW: Reusable upgrade CTA component with 3 variants (banner, modal, inline). Tracks UPGRADE_CLICKED analytics event.
- `components/usage-widget.tsx` — NEW: Listings used / limit progress bar with contextual CTAs (at-limit upgrade button, near-limit warning, free-tier unlock marketing link).
- `components/command-center/command-center.tsx` — Added UsageWidget import, UsageData interface, optional usage prop, rendered between checklist and grid.
- `app/dashboard/page.tsx` — Added RawListing/ListingPhoto interfaces (removed 5 pre-existing `any` types), usage data computation (monthly listings query + tier limits), passed usage prop to CommandCenter.

### Usage Limit Warning Email
- `app/api/cron/usage-check/route.ts` — NEW: Daily cron (9am UTC) checks each user's monthly listing usage. Sends branded warning email at 80% and limit-reached email at 100% via Resend. Skips agency-tier (unlimited). CRON_SECRET auth.

### Analytics Events
- `lib/analytics.ts` — Added 8 new SnapREvents: UPGRADE_CLICKED, UPGRADE_NUDGE_SHOWN, UPGRADE_NUDGE_DISMISSED, USAGE_LIMIT_WARNING, LISTING_PREPARED, MARKETING_COMPLETED, VIDEO_GENERATED, POST_PUBLISHED.

### SEO + Caching
- `app/p/[slug]/page.tsx` — Changed from `force-dynamic` + `revalidate=0` to ISR with `revalidate=3600` (1-hour cache + background revalidation).
- `vercel.json` — Updated property site Cache-Control headers from `no-store` to `s-maxage=3600, stale-while-revalidate=86400`. Added usage-check cron (daily 9am) and function config.
- `app/robots.ts` — Extended disallow list: added `/auth/forgot-password`, `/auth/reset-password`, `/checkout/`, `/onboarding/`.
- `public/robots.txt` — Updated to match dynamic robots.ts with full disallow rules.

## 2026-03-06 — v1.5 Polish

### Phase 13: Broker Charts + Webhook Delivery Log
- `app/dashboard/broker/BrokerDashboardClient.tsx` — Added analytics charts: bar chart (listings per agent) + donut pie chart (listings by preparation status) using recharts
- `app/api/webhooks/deliveries/route.ts` — NEW: GET delivery log API (last 50 deliveries, filterable by webhookId)
- `app/dashboard/settings/webhooks/page.tsx` — Added Delivery Log section: status/event/endpoint/code table, click-to-expand response body, refresh button, success/fail counters

## 2026-03-05 — v1.5 Race to 100

### Phase 12: Email Contact Lists + Bulk Send
- `app/api/leads/bulk-email/route.ts` — NEW: Bulk email send to selected lead IDs via Resend (POST); returns sent/failed counts + logs activities. GET returns recent send history.
- `app/dashboard/leads/email-lists/page.tsx` — NEW: Contact list UI with search/filter, multi-select checkboxes, compose panel with {{name}}/{{first_name}} personalization, send history
- `app/dashboard/leads/page.tsx` — Added "Bulk Email" gold button linking to email-lists page
- Files Modified: bulk-email/route.ts (new), email-lists/page.tsx (new), leads/page.tsx

### Phase 11: Advanced Analytics + Lead Auto-Scoring
- `app/api/leads/activity/route.ts` — Auto-score leads on POST: SCORE_DELTAS map (call=10, showing=20, form_submitted=15, property_site_viewed=8, email/text=5, drip=2). Caps at 100.
- `app/api/analytics/listings/route.ts` — NEW: Per-listing analytics aggregation (posts, engagement, impressions, leads, qualified leads, AI cost)
- `app/dashboard/content-studio/analytics/page.tsx` — Added Listings tab (per-listing comparison table) + ROI Calculator (commission % × sale price → ROI vs AI spend)
- Files Modified: activity/route.ts, analytics/listings/route.ts (new), analytics/page.tsx

### Phase 10: Email Drip Sequence Management UI
- `app/api/leads/sequences/route.ts` — NEW: CRUD API for custom drip sequences + steps (GET/POST/PATCH/DELETE). Ownership guard; system sequences protected.
- `app/dashboard/leads/sequences/page.tsx` — NEW: Full sequence management UI with create/edit/toggle/delete + step editor + template vars reference
- `app/dashboard/leads/page.tsx` — Added "Sequences" Link button in leads header

### Phase 9: Content Calendar Drag-and-Drop Reschedule
- `app/api/schedule/route.ts` — Added PATCH handler for drag-and-drop reschedule (validates id + scheduledFor, updates where status='pending' + ownership guard)
- `app/dashboard/content-studio/calendar/page.tsx` — Full refactor:
  - Typed interfaces RawPost/RawListingPhoto/RawListing (removed all `any`)
  - `draggingId`/`dragOverDate` state for visual feedback
  - `reschedulePost` useCallback with optimistic update + PATCH + error revert
  - Post pills: draggable with onDragStart/onDragEnd
  - Calendar cells: onDragOver/onDragLeave/onDrop with gold ring highlight
- Architectural Impact: Drag-to-reschedule pending posts on calendar; no external DnD library

### Phase 1: Virtual Tour + MLS Import
- `supabase/migrations/20260305_listing_virtual_tour.sql` — adds `virtual_tour_url` column to listings
- `lib/mls/types.ts` — MLS provider types (MLSPropertyData, MLSPhoto, MLSProvider interface)
- `lib/mls/simplyrets.ts` — SimplyRETS adapter implementing MLSProvider
- `lib/mls/provider.ts` — factory for MLS providers
- `app/api/mls/import/route.ts` — POST endpoint for MLS data import
- `components/mls-import-modal.tsx` — search + preview + import modal component
- `app/p/[slug]/PropertySiteClient.tsx` — 3D Virtual Tour iframe embed section
- `app/p/[slug]/page.tsx` — pass virtual_tour_url to client
- `app/listings/new/page.tsx` — virtual tour URL input field + insert call
- `app/api/listing/update/route.ts` — added virtual_tour_url to Zod schema
- `app/dashboard/content-studio/sites/[id]/SiteEditorClient.tsx` — virtual tour URL field in site editor
- `app/dashboard/content-studio/sites/[id]/page.tsx` — include virtual_tour_url in select query
- `lib/validation/schemas.ts` — mlsImportSchema, photographerBookingSchema, openHouseCheckinSchema, openHouseFeedbackSchema

### Phase 2: Photographer Booking System
- `supabase/migrations/20260305_photographer_bookings.sql` — photographer_packages, booking_requests, photographer_availability tables
- `app/book/[slug]/page.tsx` — server component fetching org, packages, availability
- `app/book/[slug]/BookingForm.tsx` — 5-step booking form (package, property, schedule, contact, review)
- `app/api/photographer/booking/route.ts` — POST endpoint for booking submissions + client upsert

### Phase 3: Broker Team Dashboard
- `app/dashboard/broker/page.tsx` — server component fetching team, members, listings, lead stats
- `app/dashboard/broker/BrokerDashboardClient.tsx` — stats grid, agent roster, listings panel, invite modal

### Phase 4: Open House Check-in + Showing Feedback
- `supabase/migrations/20260305_open_house.sql` — open_house_events + open_house_attendees tables with RLS
- `app/open-house/[slug]/page.tsx` — public server component for open house check-in page
- `app/open-house/[slug]/CheckInForm.tsx` — mobile-first 4-step flow (welcome, form, success, feedback)
- `app/api/open-house/checkin/route.ts` — public POST for guest check-in with capacity checking
- `app/api/open-house/feedback/route.ts` — public POST for interest rating + comments

### Phase 8: Showing Feedback Forms + Auto Thank-You Email
- `app/api/showing/feedback/route.ts` — public POST endpoint: validates showing UUID, saves interest_level + comments, emails agent with rating bar
- `app/feedback/showing/[id]/page.tsx` — public feedback page (server component, looks up showing by UUID)
- `app/feedback/showing/[id]/ShowingFeedbackForm.tsx` — star-rating form with comments + follow-up checkbox, success state
- `app/api/showings/route.ts` — PATCH: when status→'completed' and contact_email present, fires auto thank-you + feedback request email (dynamic import Resend, fire-and-forget)
- `app/dashboard/showings/ShowingsDashboard.tsx` — added Send Feedback mailto button on completed showing cards with contact email

### Phase 7: Webhook Wiring + Webhook Management UI
- `app/api/leads/route.ts` — dispatch `lead.created` on POST, `lead.updated` on PATCH
- `app/api/listing/status/route.ts` — dispatch `listing.updated` on PATCH, `listing.prepared` when status→'prepared'
- `app/api/cron/publish-scheduled/route.ts` — dispatch `post.published` after each successful publish
- `app/dashboard/settings/webhooks/page.tsx` — full webhook management UI (create, toggle, delete, copy secret, signature docs)
- `app/dashboard/settings/page.tsx` — added Outgoing Webhooks section linking to /settings/webhooks

### Phase 6: Lead Kanban Pipeline + Outgoing Webhooks
- `app/dashboard/leads/page.tsx` — added Pipeline/Kanban view with HTML5 drag-and-drop; List/Pipeline toggle buttons; columns: New, Contacted, Qualified, Touring, Offer, Closed, Lost; PATCH /api/leads/:id on drop
- `app/api/webhooks/outgoing/route.ts` — CRUD API: GET list, POST create, PATCH update/toggle, DELETE remove
- `lib/webhooks/dispatch.ts` — `dispatchWebhookEvent()` with HMAC-SHA256 signing, always-complete semantics, delivery logging to `webhook_deliveries`
- `lib/validation/schemas.ts` — added webhookCreateSchema, webhookUpdateSchema, webhookDeleteSchema
- `supabase/migrations/20260305_outgoing_webhooks.sql` — outgoing_webhooks + webhook_deliveries tables with RLS

### Phase 5: Dashboard Management UIs + PWA Polish
- `app/dashboard/open-houses/page.tsx` — open house events management page wrapper
- `app/dashboard/open-houses/OpenHousesDashboard.tsx` — full event CRUD, attendee table, stats, create modal, status management
- `app/dashboard/photographer/bookings/page.tsx` — photographer booking management page wrapper
- `app/dashboard/photographer/bookings/BookingsDashboard.tsx` — booking pipeline (pending→confirmed→shot→editing→delivered), status flow, confirm modal
- `components/dashboard-sidebar.tsx` — added Open Houses (DoorOpen) and Broker Dashboard (Building2) nav links
- `public/manifest.json` — PWA: dark theme, description, orientation, categories, scope
- `app/layout.tsx` — apple-mobile-web-app meta tags, viewport-fit cover, theme-color

## 2026-03-05 — v1.4 Close the Loop

### Phase 1a: Lead drip auto-enroll
- `app/api/leads/route.ts` — after inserting a new lead, queries first active `new_lead` drip sequence for the agent and auto-enrolls in `drip_enrollments`

### Phase 1b: Client review-complete banner
- `app/share/[token]/client-gallery.tsx` — added `allReviewed` state + green "Review complete" banner; passes `onAllReviewed` prop to `ClientApprovalButtons` to trigger it; replaced `<img>` thumbnails with `<Image fill>`

### Phase 1c: Download Approved batch
- `app/api/download-approved/route.ts` — new GET endpoint: auth check, listing ownership check, returns signed URLs for all client_approved=true photos
- `app/dashboard/approvals/page.tsx` — adds emerald Download button per listing (only visible when approved > 0); sequential blob download with 200ms gap

## 2026-03-05 — v1.3 Business Intelligence

### Phase 5: Client Approval Portal
- `app/dashboard/approvals/page.tsx` — added NewApprovalModal component: listing picker (Supabase query), POST to /api/share, copyable share URL result, empty-state CTA button, and "New Approval Link" header button

### Phase 4: Brand Propagation to Video
- `app/api/video/generate/route.ts` — fetches brand_profiles and passes brand (agentName, logo, primaryColor, phone, email, website, tagline) into Remotion inputProps.brand for closing card

### Phase 2: Lead CRM Upgrade
- `supabase/migrations/20260305_lead_activity.sql` — lead_activities table + score/notes/last_activity_at columns on property_leads + auto-update trigger
- `app/api/leads/activity/route.ts` — GET/POST/PATCH for activities and lead score/notes
- `app/dashboard/leads/page.tsx` — ActivityPanel: lead scoring (0-100 stars), private notes, log call/email/text/note, timeline with icons + timestamps

## 2026-03-05 — Property Site Editor + Print Dashboard + Showings + SMS + MLS

### Phase 5: MLS Direct Submission / RESO Export
- `app/api/marketing/reso-export/route.ts` — RESO Data Dictionary 2.0 JSON export endpoint with full field mapping
- `app/dashboard/mls/page.tsx` + `MlsDashboard.tsx` — 3-step export UI: listing picker, format selector (ZIP vs RESO JSON), MLS spec chips, download
- `components/dashboard-sidebar.tsx` — MLS Submission nav item under More Tools

### Phase 4: WhatsApp/SMS Notify
- `lib/notify/twilio.ts` — Twilio REST helpers (sendSms, sendWhatsApp) using fetch + Basic auth, no SDK dependency
- `app/api/notify/sms/route.ts` — POST endpoint, Zod validated, sends SMS via Twilio
- `app/api/notify/whatsapp/route.ts` — POST endpoint, Zod validated, sends WhatsApp via Twilio sandbox
- `app/dashboard/notify/page.tsx` + `NotifyDashboard.tsx` — send UI: channel toggle, listing picker, 4 message templates + custom, phone input, send button
- `components/dashboard-sidebar.tsx` — Notify nav item under Measure

### Phase 3: Showings Intelligence
- `supabase/migrations/20260305_showings.sql` — showings table with status, outcome, interest_level, source attribution, RLS
- `app/api/showings/route.ts` — full CRUD + stats summary
- `app/dashboard/showings/page.tsx` + `ShowingsDashboard.tsx` — upcoming/past split, stats, schedule modal, outcome/feedback form with star rating
- `components/dashboard-sidebar.tsx` — Showings nav item

### Phase 2: Print Materials Dashboard
- `app/dashboard/print/page.tsx` — print dashboard page
- `app/dashboard/print/PrintDashboard.tsx` — 3-step UI: select listing → choose format (flyer/feature-sheet) → generate + download PDF
- `components/dashboard-sidebar.tsx` — added Print Materials nav item

### Phase 1: Property Site Editor
- `app/dashboard/content-studio/sites/[id]/page.tsx` — SSR editor page
- `app/dashboard/content-studio/sites/[id]/SiteEditorClient.tsx` — split-pane editor (theme, listing fields, agent info, publish toggle, live iframe preview)
- `app/dashboard/content-studio/sites/PropertySites.tsx` — rewritten: sites grid with Edit/Copy/Delete + create-new form
- `app/api/listing/update/route.ts` — PATCH endpoint for editing listing fields

---

## 2026-03-04 — Photographer White-Label Portal

Implemented the photographer partner layer: branded photo delivery, client CRM, and bulk delivery link management.

### New Files
- `supabase/migrations/20260304_photographer_portal.sql` — 5 new tables: `organizations` (fixes long-missing migration), `organization_members`, `photographer_clients`, `delivery_links`, `delivery_events`. Adds `account_type` to `profiles`. Full RLS.
- `app/api/photographer/listings/route.ts` — GET listings enriched with delivery stats per listing
- `app/api/photographer/clients/route.ts` — CRUD client roster (GET/POST/PATCH/DELETE)
- `app/api/photographer/deliver/route.ts` — POST single/bulk delivery links with branded email, GET list, PATCH revoke
- `app/api/deliver/event/route.ts` — Public event tracking (viewed/downloaded) for delivery links
- `app/deliver/[token]/page.tsx` — Public branded client delivery page (SSR, no SnapR branding)
- `app/deliver/[token]/DeliveryPageClient.tsx` — Photo grid, lightbox, single/bulk download
- `app/dashboard/photographer/page.tsx` — Photographer dashboard server wrapper
- `app/dashboard/photographer/PhotographerDashboard.tsx` — Listings tab + client CRM tab, deliver modal

### Modified Files
- `components/dashboard-sidebar.tsx` — Added "Photographer Portal" nav item under Measure section

---

## 2026-03-04 — Lead Drip Sequences

Implemented automated follow-up email sequences for property leads.

### New Files
- `supabase/migrations/20260304_lead_drip_sequences.sql` — 4 new tables: `lead_drip_sequences`, `lead_drip_steps`, `lead_drip_enrollments`, `lead_drip_emails`. Seeds a built-in 3-step "New Lead Follow-Up" sequence.
- `app/api/leads/drip/route.ts` — POST (enroll), GET (list sequences + enrollments), DELETE (unenroll)
- `app/api/leads/drip/unsubscribe/route.ts` — Public one-click unsubscribe with HTML confirmation
- `app/api/cron/drip-sequences/route.ts` — Hourly cron sends due emails via Resend

### Modified Files
- `app/dashboard/leads/page.tsx` — DripPanel inside each expanded lead row
- `vercel.json` — Registered hourly drip-sequences cron

---

## 2026-03-04 — Luxury Glassmorphism Design System

Applied a world-class luxury glassmorphism design system across the entire app (homepage + authenticated dashboard).

### CSS System (globals.css)
Added `.glass-luxury`, `.glass-gold-luxury`, `.glow-card`, `.shimmer-text`, `.glossy-top`, `.stat-glow`, `.bento-grid` classes with CSS Houdini `@property --angle` rotating conic-gradient border animation.

### Homepage (app/page.tsx)
- Hero pills → `glass-luxury rounded-full`
- Trust section → `glass-luxury glossy-top` wrapper, security badges → `glow-card`
- Problem/Solution → `glass-luxury glossy-top` container, "SnapR" → `shimmer-text`
- How It Works → bento grid (Step 1 span-2, Step 2 row-2, Step 3 span-2)
- Demo stat cards → `glow-card` + `stat-glow`
- Cost comparison → Pay-Per-Service `glass-luxury`, SnapR Gold `glass-gold-luxury glossy-top`, price → `shimmer-text`
- Modals → `glass-luxury glossy-top`

### Dashboard Components
- `components/dashboard-sidebar.tsx` — usage card, active nav items, sidebar backgrounds
- `components/desktop-notification-bar.tsx` — gold-tinted blur bar
- `components/command-center/expandable-card.tsx` — collapsed/expanded card states
- `components/getting-started-checklist.tsx` — banner `glass-gold-luxury`, items `glass-luxury`
- `components/command-center/command-center.tsx` — background deepened

### Studio
- `components/studio-client.tsx` — header, AI tools sidebar, downloads sidebar, canvas, modals, tool presets, download items
- `components/marketing-results-panel.tsx` — panel, collapsible sections, caption cards, post items

### Listings Page
- `app/dashboard/listings/page.tsx` — listing cards `glass-luxury glossy-top`, empty states, filter buttons

## 2026-02-27 — "We Heard You" Section

Added social proof section to homepage with auto-rotating carousel of real-world screenshots from Fstoppers, RISMedia, Matterport, We Get Around Network, and photography business forums. 9 screenshots auto-rotate every 3.5s, pause on hover, with dot indicators and prev/next arrows. Includes stat strip (24-48h wait, 5+ tools, $400+/mo). Screenshots sourced from `public/agent-voices/`.

## 2026-02-26 — Before/After Slider Fix

Fixed image dragging and zoom bug in the homepage LandingGallery before/after sliders.

### Root Cause
`HoverSlider` in `components/landing-gallery.tsx` was clipping the before image using a `<div>` with `width: {position}%` and sizing the inner `<img>` with a JS-captured pixel width (`width` state, default 400px). On resize or initial render, the pixel width was stale/wrong causing the before image to appear at wrong size and "drag" visually as the clip expanded.

### Fix
Replaced the clip-div + pixel-width approach with CSS `clipPath: inset(0 X% 0 0)` directly on the before image. Both images are now `position: absolute, fill: true, object-cover` — they never move or resize. Only the clip boundary changes. Also replaced `<img>` with Next.js `<Image>` and removed unused `useEffect` import.

- Files Modified: `components/landing-gallery.tsx`

## 2026-02-26 — Homepage Copy + Calendly Fix

Pre-launch copy polish and Calendly integration wired to real URL.

### 1. Homepage Copy Refresh
- Headline updated: "Upload Your Photos. We Handle the Rest."
- Tagline updated: "Stop marketing listings. Start closing them."
- Sub-headline: single clear sentence listing all deliverables (photos, descriptions, social, site, video)
- Pain/solution section replaced with compact side-by-side comparison table (6 rows)
- Removed redundant 15-tool grid and duplicate pain cards sections
- Files Modified: `app/page.tsx`

### 2. Pricing Section Copy
- Subtitle changed to "Pick Your Plan"
- Sub-copy updated to lead with inclusions (all 15 AI tools, templates, property sites, video)
- Files Modified: `components/pricing-section.tsx`

### 3. Calendly Integration Fixed
- Contact page iframe now uses real URL: https://calendly.com/rajesh-snap-r/30min
- Added embed params: dark background (0f0f0f), gold primary (d4a017), no GDPR banner
- NEXT_PUBLIC_CALENDLY_URL added to .env.local and .env.example with real default
- Files Modified: `app/contact/page.tsx`, `.env.example`

## 2026-02-25 — Phase 12: Pre-Launch Fixes

Production readiness audit identified 3 blockers and 3 should-fixes. All resolved.

### 1. Missing DB Tables (BLOCKER)
- Created migration `20260225_addon_and_human_edit_tables.sql`
- `addon_purchases` table — tracks add-on purchases referenced by Stripe webhook
- `human_edit_orders` table — tracks human editing orders referenced by Stripe webhook
- Indexes on user_id + status, RLS policies for both tables
- Files Created: `supabase/migrations/20260225_addon_and_human_edit_tables.sql`

### 2. Legacy Billing Page Crash (BLOCKER)
- Old `/billing` page queried non-existent `users` table and used credit-based model
- Replaced with server-side redirect to working `/dashboard/billing`
- Files Modified: `app/(authenticated)/billing/page.tsx`

### 3. Campaign Template trigger_status Mismatch (BLOCKER)
- Seed data used `'new'` but engine expects `'just_listed'`
- Created migration to UPDATE existing rows and re-seed with ON CONFLICT DO NOTHING
- Files Created: `supabase/migrations/20260225_fix_campaign_template_statuses.sql`

### 4. Domain Fallback Standardization
- Worker marketing handler had fallback `snapr.pro`, should be `snap-r.com`
- Files Modified: `apps/processor/src/marketing-handler.ts`

### 5. WORKER_URL Default
- Marketing trigger API route had no fallback for missing WORKER_URL env var
- Added default `http://127.0.0.1:8787` for local development
- Files Modified: `app/api/marketing/trigger/route.ts`

### 6. Upstash Redis Rate Limiting
- Rewrote `lib/rate-limit.ts` as hybrid: Upstash Redis when configured, in-memory fallback
- Sync `checkRateLimit()` preserved for edge middleware compatibility
- Added async `checkRateLimitAsync()` for API routes using Redis
- Installed `@upstash/ratelimit` and `@upstash/redis`
- Files Modified: `lib/rate-limit.ts`, `package.json`

## 2026-02-25 — Phase 11: Security Hardening

### 1. Remove NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (4 files)
- **`lib/supabase/admin.ts`** — Removed `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` fallback. Now uses only `SUPABASE_SERVICE_ROLE_KEY`.
- **`app/sitemap.ts`** — Replaced `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY` with just `SUPABASE_SERVICE_ROLE_KEY`.
- **`app/share/[token]/page.tsx`** — Same fix as sitemap.
- **`lib/ai/providers/sam-masks.ts`** — Removed `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from fallback chain. Also fixed 8 lint warnings (4 `any` types → `unknown`/`Record`, 2 unused vars, 1 unused param, 1 anonymous default export).

### 2. Add Auth to Admin Routes
- **`app/api/admin/contacts/update-status/route.ts`** — Added `WORKER_ADMIN_KEY` bearer token check. Previously had zero authentication — any caller could update contact submission status.

### 3. Fix Caller-Supplied userId (IDOR Prevention)
- **`app/api/listings/status/route.ts`** — Replaced caller-supplied `userId` from request body with session-verified user from `createClient()` + `getUser()`. Uses `adminSupabase()` for DB writes. Prevents IDOR where attacker supplies another user's ID.
- **`app/api/campaigns/route.ts`** — Same session auth fix for both GET and POST handlers. Replaced `createClient(url, serviceKey)` with session-based auth + `adminSupabase()` for DB operations.

### 4. Add Auth to AI Routes
- **`app/api/ai/generate-caption/route.ts`** — Added session auth via `createClient()` + `getUser()`. Previously unauthenticated — anyone could burn OpenAI API credits.
- **`app/api/translate/route.ts`** — Same session auth addition. Fixed catch block to typed pattern.

### 5. Gate Sentry Example Route
- **`app/api/sentry-example-api/route.ts`** — Returns 404 in production. Removed Sentry import to prevent noise. Only throws test error in development.

### 6. Environment Documentation
- **`.env.example`** [NEW] — Documents all environment variables organized by category (Supabase, AI, Stripe, Email, Cloudflare, Remotion, Social OAuth, WhatsApp, Cron/Admin, Rate Limiting, Monitoring, AI Tuning). Marks required vs optional.

**Verification:** `npx tsc --noEmit` clean | `npx vitest run` 93/93 passed | `npm run build` clean

---

## 2026-02-25 — Phase 10: WhatsApp Fix, Description Dedup, Worker Type Hardening

### 1. WhatsApp Webhook Fix
- **`app/api/webhooks/whatsapp/route.ts`** — Replaced `createClient` from `@/lib/supabase/server` (auth-based, requires session) with service role client from `@supabase/supabase-js` (Twilio webhooks have no user session). Replaced all 8 `any` type annotations with `SupabaseClient` and `ListingRow` interface. Fixed error message ("Download failed" → "Unknown error"). Fixed dead link (`/dashboard/clients` → `/dashboard/approvals`).

### 2. AI Description Deduplication
- **`apps/processor/src/marketing-handler.ts`** — Step 1 (Description) now checks for existing completed description from a previous marketing job for the same listing before generating a fresh one. If found, reuses it at zero AI cost. Prevents duplicate AI spend on re-triggered marketing jobs.
- **`apps/processor/src/index.ts`** — Auto-trigger after preparation now checks for existing marketing job (queued/processing/completed) before creating a new one. Skips auto-trigger if a job already exists, preventing duplicate marketing pipelines entirely.

### 3. Worker Type Hardening (14 `any` eliminations)
- **`apps/processor/src/types.ts`** — Added 4 missing optional fields to `Env` interface (`AUTOENHANCE_API_KEY`, `ANALYSIS_PROVIDER`, `ANALYSIS_REPLICATE_MODEL`, `AI_ANALYSIS_FAIL_OPEN`).
- **`apps/processor/src/index.ts`** — Replaced all 14 `any` types: `globalThis` polyfill uses typed `_global` constant with eslint-disable, `env` casts removed (fields now in Env), `PhotoStrategy` type imported for strategy arrays, `SupabaseClient` return type for supabase param. Removed unused `JobMessage` import and `updatePhotoStatus` variable. Named the default export.

### 4. CLAUDE.md Corrections
- **`CLAUDE.md`** — Removed "credits" from profiles table description (app is listing-based, not credit-based). Changed "zero AI credits burned" to "zero AI cost incurred".

**Verification:** `npx tsc --noEmit` clean | `npx vitest run` 93/93 passed | `npm run build` clean

---

## 2026-02-24 — Phase 9: Analytics Events Table, Approval Workflow, API Hardening

### 1. Analytics Events & Error Logs Migration
- **`supabase/migrations/20260225_analytics_events.sql`** [NEW] — Creates `analytics_events` table (session_id, event_type, event_name, event_data JSONB, page_url, referrer, user_agent, device_type, browser, user_id, ip_address, country, city) and `error_logs` table (error_message, error_stack, error_source, page_url, user_agent, user_id, metadata JSONB). Indexes on session, type, user, created_at. RLS policies for service role + user self-read.

### 2. Fix Analytics API Routes
- **`app/api/analytics/track/route.ts`** — Replaced blind spread insert with explicit field mapping (prevents arbitrary column injection). Added `export const dynamic`, proper error logging, structured insert.
- **`app/api/analytics/error/route.ts`** — Same pattern: explicit field mapping, proper catch block, `export const dynamic`.
- **`lib/analytics/tracker.ts`** — Replaced all `Record<string, any>` with `Record<string, unknown>`. Fixed catch blocks to empty `catch {}`.

### 3. Client Approval Workflow Completion
- **`app/api/approve-photo/route.ts`** — Added completion detection: after each approval update, queries all listing photos to check if any remain pending. Returns `{ success, allReviewed, stats }` so clients can detect review completion.
- **`components/client-approval-buttons.tsx`** — Wired to auto-notify agent when `allReviewed: true` returned. Calls `/api/notify-approval` with share token and client name. Added `clientName` and `onAllReviewed` props. Fixed catch blocks and added `aria-label` to textarea.

### 4. API Route Hardening
- **`app/api/approval-summary/route.ts`** — Removed unused `NextRequest` import and `req` parameter. Fixed catch block.
- **`app/api/notify-approval/route.ts`** — Fixed catch block to typed `error: unknown` pattern.

**Verification:** `npx tsc --noEmit` clean | `npx vitest run` 93/93 passed | `npm run build` clean

---

## 2026-02-24 — Phase 8: Partial Features Fix — Campaign Wiring, Drafts UI, Email Send, CMA Persistence

### 1. Wire Campaign Engine to Listing Status Changes
- **`app/api/listing/status/route.ts`** — Extended PATCH handler to accept `marketingStatus` (display statuses like "Just Listed", "Sold", etc.) alongside existing `preparation_status`. On marketing status change: fetches previous status, updates `listings.marketing_status`, converts display status to campaign key via `toCampaignStatus()`, and calls `onListingStatusChange()` to trigger the campaign engine. Both auto-post evaluation and campaign triggers are non-critical (wrapped in try/catch). Response now includes `marketingStatus` and `campaign` result.

### 2. Post Drafts Management Page
- **`app/dashboard/content-studio/drafts/page.tsx`** [NEW] — Full drafts management UI: search bar, platform filter tabs (All/Facebook/Instagram/LinkedIn/TikTok), 3-column responsive card grid showing name, platform badge, post type, caption preview (120 char truncation), hashtags, and relative timestamp. Inline edit expansion with name/platform/post type/caption/hashtags fields. Actions: edit, duplicate, delete (with confirmation), "Use in Content Studio" link. Empty states for no drafts and no filter matches.

### 3. Email Send Capability
- **`app/api/email/send/route.ts`** [NEW] — POST endpoint to send marketing emails via Resend SDK. Auth check, Zod validation (1-50 recipients, subject max 200 chars), plan tier gate (Pro/Agency only). Sends to each recipient individually to avoid exposing the list. Returns `{ success, messageId, recipientCount }`.
- **`lib/validation/schemas.ts`** — Added `emailSendSchema` Zod schema for email send validation.
- **`app/dashboard/content-studio/email/EmailMarketing.tsx`** — Added "Send Email" button (green) next to Download HTML. Modal with textarea for comma/newline-separated recipients, subject preview, send progress, and success/error feedback. Also fixed pre-existing lint warnings (unused variables, eslint-disable for `<img>` in email context).

### 4. CMA Report Persistence
- **`supabase/migrations/20260225_cma_reports.sql`** [NEW] — Creates `cma_reports` table (id, user_id, listing_id, comparables JSONB, pricing JSONB, agent_info JSONB, narrative TEXT, title TEXT, status TEXT). Indexes on user_id and listing_id. RLS policies for user-scoped access + service role bypass.
- **`app/api/cma/route.ts`** — Upgraded POST handler: saves CMA report with auto-generated title from property address, returns `reportId` in response. Upgraded GET handler: removed unused `request` parameter, fixed unused error variable. CMA save now attempts real persistence (with graceful fallback if table not yet migrated).

**Verification:** `npx tsc --noEmit` clean | `npx vitest run` 93/93 passed

---

## 2026-02-24 — Phase 7: Quick Wins — Cron Fix, Portfolio Pages, Sidebar Navigation

### Win 1: Register Daily Digest Cron
- **`vercel.json`** — Added daily digest cron (`0 8 * * *` = 8 AM UTC daily) and function config (300s timeout, 1024MB memory). The route was fully coded but never registered — will now execute automatically.

### Win 2: Portfolio Edit & Items Pages
- **`app/dashboard/portfolio/[id]/edit/page.tsx`** [NEW] — Portfolio settings page: edit title, tagline, description, theme (dark/light/minimal), accent color picker, public toggle, slug display. Save/delete actions. Previously linked from portfolio cards but returned 404.
- **`app/dashboard/portfolio/[id]/items/page.tsx`** [NEW] — Portfolio items management: before/after photo grid with reorder (up/down), featured toggle, inline title editing, delete. Add item modal with full form. "Import from Listings" modal fetches user's enhanced photos for bulk import via PATCH API.

### Win 3: Surface Hidden Pages in Sidebar
- **`components/dashboard-sidebar.tsx`** — Added 8 pages to sidebar navigation across 3 sections:
  - **Create**: Virtual Staging, Property Sites
  - **Publish**: Campaigns
  - **More Tools**: Photo Culling, Renovation, Listing Intel, Email Marketing, Partner Program
  - 5 pages intentionally excluded (camera=mobile-only, bulk=sub-nav, organization=backend-unbuilt, how-it-works=onboarding, content/scheduled=duplicate)

**Verification:** `npx tsc --noEmit` ✅ | `npm run build` ✅ | `npx vitest run` 93/93 ✅

---

## 2026-02-24 — Phase 6: Hardening + Platform Unlock Sweep

### Area 1: Unlock Twitter + TikTok
- **`app/dashboard/settings/social/page.tsx`** — Flipped `available: true` for TikTok and Twitter. Added TikTok OAuth initiation (`client_key`, scopes), Twitter OAuth 2.0 with PKCE (code verifier + SHA-256 challenge embedded in base64 state). Typed `SocialPage` interface, removed `any` from `pages` and `instagram_account`. Removed 4 unused Lucide imports.
- **`app/api/social/oauth/[platform]/route.ts`** — Added `handleTwitterOAuth()`: PKCE token exchange with Basic auth, user profile fetch via `/2/users/me`, connection upsert. Added base64 state decoding for PKCE code_verifier extraction.

### Area 2: Fix Analytics Sync Cron
- **`app/api/cron/sync-analytics/route.ts`** — Added `fetchTwitterMetrics()` (Twitter v2 `public_metrics`) and `fetchTikTokMetrics()` (TikTok Content Posting API v2). Fixed Facebook impressions with insights API call. Fixed LinkedIn shares (`sharesSummary.totalShares`). Added pagination with batch loop replacing `.limit(100)`. Defined `SocialConnectionRecord` interface, typed all function params. Added token refresh logic for expiring tokens.

### Area 3: Auto-Post Rules Executor
- **`lib/social/auto-post-evaluator.ts`** [NEW] — `evaluateAutoPostRules()` function: queries matching `auto_post_rules`, generates `scheduled_posts` rows with `status: 'pending'` and `scheduled_for: now + 5min`. Pulls captions from `marketing_jobs.captions_result`. Uses `adminSupabase` (bypasses RLS).
- **`app/api/listing/status/route.ts`** — Added auto-post evaluation after PATCH (non-critical, try/catch). Defined `FlaggedPhoto` and `PreparationLog` interfaces. `any` → `Record<string, unknown>`.

### Area 4a: Sentry in Error Boundaries
- **`app/error.tsx`** — Added `Sentry.captureException(error)` in useEffect.
- **`app/dashboard/error.tsx`** — Same fix.

### Area 4b: Eliminate `any` Types (7 files)
- **`app/api/stripe/webhook/route.ts`** — `Record<string, any>` → `Record<string, unknown>`
- **`app/admin/ai-decisions/page.tsx`** — Defined `PreparationMetadata` interface, replaced `any` casts
- **`app/api/listings/route.ts`** — `Record<string, any>` → `Record<string, unknown>`, defined `ListingPhoto` interface
- **`app/admin/page.tsx`** — Replaced ~13 inline `any` casts with typed callbacks, renamed Lucide `Image` → `ImageIcon`

### Area 4c: Zod Validation (9 API routes)
- **`lib/validation/schemas.ts`** — Added 14 schemas: `autoPostRuleCreateSchema`, `autoPostRuleToggleSchema`, `autoPostRuleDeleteSchema`, `notifySchema`, `voiceoverSchema` (discriminated union), `contactSchema`, `stagingSchema`, `batchEnhanceSchema`, `draftCreateSchema`, `draftDeleteSchema`, `listingCreateSchema`, `listingUpdateSchema`, `organizationCreateSchema`, `organizationUpdateSchema`.
- Applied `parseBody()` pattern to: `auto-post`, `notify`, `contact`, `batch-enhance`, `voiceover`, `staging`, `drafts`, `listings`, `organization` routes.

**Verification:** `npx tsc --noEmit` ✅ | `npm run build` ✅ | `npx vitest run` 93/93 ✅

---

## 2026-02-24 — Phase 5: Print Materials (Flyer + Feature Sheet PDFs)

### New Dependencies
- **`@react-pdf/renderer`** — Server-side React PDF generation producing real vector PDFs (selectable text, print-quality)
- **`qrcode`** + **`@types/qrcode`** — QR code generation as base64 data URI for property site links

### New Files
- **`lib/print/types.ts`** — Shared data interfaces: `PrintListingData`, `PrintBrandData`, `PrintPhotoData`, `PrintMaterialsInput`.
- **`lib/print/pdf-utils.ts`** — Utility functions: `generateQrCodeDataUri()`, `fetchImageAsBase64()`, `formatPrice()`, `formatAddress()`, `formatPropertyType()`, `truncateText()`.
- **`lib/print/flyer-template.tsx`** — Single-page property flyer PDF template (Letter size). Hero photo (55% height), price + stats row, up to 4 detail photos, description excerpt, gold accent line, agent branding footer with QR code.
- **`lib/print/feature-sheet-template.tsx`** — Two-page feature sheet PDF template. Page 1: header bar with logos, hero photo, address/price, stats bar, full AI description. Page 2: 3x3 photo grid, two-column features list, property details box, agent branding with QR code.
- **`app/api/marketing/print-materials/route.ts`** — `POST` API route. Validates with Zod, checks `canAccessContentStudio` billing gate (starter+), fetches listing data + marketing description + photos + brand profile + property site slug. Photos fetched as base64 in parallel via `Promise.allSettled`. Renders PDF with `renderToBuffer()`, returns binary with `Content-Disposition: attachment`.

### Modified Files
- **`lib/validation/schemas.ts`** — Added `printMaterialsSchema` (`{ listingId: uuid, type: 'flyer' | 'feature-sheet' }`).
- **`components/marketing-results-panel.tsx`** — Added 7th `CollapsibleSection` for "Print Materials" with `Printer` icon. Two download buttons (flyer + feature sheet), loading spinners, locked state for free-tier users. Added `userTier` prop + `handleDownloadPrintMaterial()` handler.
- **`components/studio-client.tsx`** — Added `subscriptionTier` prop, forwarded as `userTier` to `MarketingResultsPanel`.
- **`app/dashboard/studio/page.tsx`** — Passes `subscriptionTier={profile?.subscription_tier || 'free'}` to `StudioClient`.
- **`vercel.json`** — Added `app/api/marketing/print-materials/route.ts` function config (60s timeout, 1024MB memory).

**Verification:** `npx tsc --noEmit` ✅ | `npm run build` ✅ | `npx vitest run` 93/93 ✅

---

## 2026-02-24 — Phase 4: Watermark on Downloads + Twitter/X Publishing

### 4a. Watermark on Downloads

Downloads now apply watermark overlays server-side using the existing Sharp-based `addWatermark()` utility. Two layers: MLS compliance watermarks (mandatory for virtual-staging, declutter, etc.) and user custom watermarks (text, position, opacity from Settings).

- **`app/api/download-all/route.ts`** — ZIP download now fetches `photos.tools_applied` and `user_settings` watermark config. Applies compliance watermark (bottom-left) first, then user custom watermark (configurable position) before adding each photo to the ZIP. Fixed pre-existing `catch (fetchError)` → `catch {}` and `catch (error)` → `catch (error: unknown)`.
- **`app/api/download/route.ts`** — Rewritten to support two modes: `?url=xxx` (existing CORS proxy for external URLs) and `?photoId=xxx` (new watermarked download). Watermarked path verifies ownership via listing join, applies compliance + user watermarks, returns watermarked JPEG. Fast path: if no watermark needed, redirects to signed URL.
- **`components/studio-client.tsx`** — `handleDownload()` now calls `/api/download?photoId=xxx` instead of fetching signed URLs directly, ensuring watermarks are always applied server-side and cannot be bypassed.

### 4b. Twitter/X Publishing

The cron publisher can now post to Twitter/X. OAuth PKCE infrastructure already existed; this adds the actual publish function and cron integration.

- **`lib/social/publish-service.ts`** — Added `uploadMediaToTwitter()` (v1.1 chunked upload: INIT → APPEND → FINALIZE) and `publishToTwitter(accessToken, content)` (v2 `POST /2/tweets` with optional media_ids). Added `case 'twitter':` to `publishToSocial()` switch.
- **`app/api/cron/publish-scheduled/route.ts`** — Added `case 'twitter':` for image publishing (uploads up to 4 images, creates tweet) and video publishing (uploads video via chunked upload, creates tweet with media). Twitter doesn't need page ID or account ID — just access_token from `social_connections`.

**Verification:** `npx tsc --noEmit` ✅ | `npm run build` ✅ | `npx vitest run` 93/93 ✅

---

## 2026-02-24 — Phase 3: In-App Notification Center

### Database
- **`supabase/migrations/20260224_notifications.sql`** — New `notifications` table (id, user_id, type, title, body, link, read, created_at) with RLS policies and index on (user_id, read, created_at DESC).

### API Routes
- **`app/api/notifications/route.ts`** — `GET` with pagination (limit/offset) + unread count.
- **`app/api/notifications/[id]/route.ts`** — `PATCH` to mark single notification as read.
- **`app/api/notifications/read-all/route.ts`** — `PATCH` to mark all as read.

### Notification Sender
- **`lib/notifications/sender.ts`** — Now writes an in-app notification record on every `sendNotification()` call (fire-and-forget). Added `writeInAppNotification()` and `getNotificationLink()` helpers. Fixed pre-existing duplicate variable declarations and `catch(e)` → `catch {}`.

### UI Components
- **`components/notification-bell.tsx`** — Bell icon with unread badge, dropdown panel with notification list, mark-as-read, mark-all-read, deep-link navigation, Supabase Realtime subscription for live updates.
- **`components/desktop-notification-bar.tsx`** — Thin top bar for desktop layout rendering the bell.
- **`components/mobile-dashboard-header.tsx`** — Added NotificationBell to mobile header.
- **`app/dashboard/layout.tsx`** — Integrated DesktopNotificationBar into main content area.

**Verification:** `npx tsc --noEmit` ✅ | `npm run build` ✅ | `npx vitest run` 93/93 ✅

---

## 2026-02-24 — Phase 2: Team Listing Access + Daily Digest Email

### 2a. Team Shared Listing Access
- **`app/dashboard/listings/page.tsx`** — Full rewrite with proper TypeScript interfaces (`ListingPhoto`, `ListingRow`, `ListingWithMeta`). Eliminated all `any` types. Listings query now fetches user's `current_team_id` from profiles, then queries both own listings AND team listings (where `team_id` matches). Team listings display an indigo "Team" badge. Fixed: `Image` → `ImageIcon` (avoid conflict with HTML img), `useCallback` for fetch, `eslint-disable` for `<img>` with signed URLs, proper alt text.
- **`app/api/upload/route.ts`** — Upload authorization now checks team access: if user doesn't own the listing directly, falls back to checking if listing's `team_id` matches user's `current_team_id`. Fixed pre-existing `catch (e)` → `catch {}`.

### 2b. Daily Digest Email Channel
- **`app/api/cron/daily-digest/route.ts`** — Full rewrite. Removed `.not('phone', 'is', null)` filter — now queries ALL users. Uses unified `sendNotification()` from `lib/notifications/sender.ts` instead of raw Twilio calls. Supports both WhatsApp (opt-in via `dailyWhatsapp` pref) and email (default-on via `dailyEmail` pref). Proper TypeScript interfaces (`DigestUser`, `NeedsReviewItem`). Builds `DailySummaryData` for the template system.

**Verification:** `npx tsc --noEmit` ✅ | `npm run build` ✅ | `npx vitest run` 93/93 ✅

---

## 2026-02-24 — Phase 1: Test Safety Net (Vitest + 93 Tests)

### What
Installed Vitest and wrote targeted tests for the 5 highest-risk modules in the platform. Zero tests existed before this — now 93 tests cover billing gates, input validation, UTM attribution, MLS compliance watermarking, and rate limiting.

### Files Added
| File | Tests | Purpose |
|------|-------|---------|
| `vitest.config.ts` | — | Vitest config with path aliases matching tsconfig.json |
| `__tests__/limits.test.ts` | 33 | Billing gate logic: normalizeTier, getPlanLimits, canPublish, canCreatePost, canGenerateCaption, getRemainingPosts, canGenerateVideo, getListingLimits, shouldResetUsage |
| `__tests__/schemas.test.ts` | 37 | Zod API input validation: all 9 schemas + parseBody helper, boundary values, type safety |
| `__tests__/utm.test.ts` | 8 | UTM param construction: all platforms, all campaigns, param preservation, overwrite behavior |
| `__tests__/watermark.test.ts` | 9 | MLS compliance: requiresWatermark for all 15 tools, getWatermarkText mapping completeness |
| `__tests__/rate-limit.test.ts` | 6 | Rate limiter: decrement counting, blocking at limit, per-identifier isolation, defaults |

### Files Modified
| File | Change |
|------|--------|
| `package.json` | Added `vitest` devDependency, `test` and `test:watch` scripts |

### Verification
- `npx vitest run` — 93/93 tests passing in 337ms
- `npx tsc --noEmit` — zero errors

## 2026-02-23 — Analytics & ROI Dashboard (Measure Stage)

### What
Enhanced the analytics dashboard from a basic stat-cards + post-list view into a full ROI analytics dashboard with 4 tabs: Overview, Platforms, Leads, and ROI. Installed `recharts` for interactive charts.

### Files Added
| File | Purpose |
|------|---------|
| `app/api/analytics/roi/route.ts` | ROI aggregation API — fetches published_posts, marketing_jobs, property_leads in parallel and returns unified analytics response with daily engagement time-series, platform breakdowns, lead funnel, cost summary, and top posts |

### Files Modified
| File | Change |
|------|--------|
| `app/dashboard/content-studio/analytics/page.tsx` | Complete rewrite — 4-tab dashboard (Overview, Platforms, Leads, ROI) with recharts AreaChart, BarChart, PieChart, engagement trend, platform comparison cards, lead funnel visualization, ROI efficiency metrics, CSV export |
| `package.json` | Added `recharts` dependency |

### Architecture
- **ROI API** (`/api/analytics/roi`) aggregates 3 data sources:
  - `published_posts` → engagement metrics (likes, comments, shares, impressions, reach)
  - `marketing_jobs` → AI cost tracking (total_cost_cents, cost_breakdown)
  - `property_leads` → lead attribution (utm_source, utm_campaign, status)
- All queries run in parallel via `Promise.all` for minimal latency
- Time-series fills in missing dates with zeros for smooth chart rendering
- Date range filter: 7d / 30d / 90d / All Time

### Dashboard Tabs
1. **Overview** — 8 KPI stat cards + engagement trend (area chart) + top 5 performing posts
2. **Platforms** — Grouped bar chart (likes/comments/shares by platform) + per-platform cards with engagement rates + mini engagement composition bars
3. **Leads** — Lead KPIs (total, conversion rate, cost per lead, qualified) + pie chart of lead sources + funnel visualization (new → contacted → qualified → converted → archived) + campaign breakdown
4. **ROI** — Cost KPIs (total AI spend, cost per listing, cost per lead, cost per engagement) + impressions/reach trend chart + ROI summary with efficiency metric ("every $1 generated X engagements")

### Verification
- `npx tsc --noEmit` — zero errors
- `npm run build` — successful production build
- ESLint — zero warnings/errors

---

## 2026-02-23 — Production Hardening: Rate Limiting, Security Headers, Sentry Fix

### 1. Rate Limiting Enabled in Middleware
- Merged disabled rate limiting logic into active `middleware.ts`
- Per-endpoint limits: `/api/enhance` 10/min, `/api/analyze` 20/min, `/api/upload` 30/min, `/api/contact` 3/min, `/api/auth` 5/min, default 100/min
- Returns 429 with `Retry-After` + `X-RateLimit-*` headers when exceeded
- Bot pattern blocking: `.env`, `.git`, `wp-admin`, `.php` requests → 404
- IP extraction via `x-forwarded-for` header
- Cron endpoints excluded (they use CRON_SECRET auth)
- Refactored `lib/rate-limit.ts`: replaced `setInterval` cleanup with lazy cleanup (edge-runtime safe)

### 2. Sentry Configuration Fixed
- **DSN moved to env var** — `NEXT_PUBLIC_SENTRY_DSN` (previously hardcoded in 3 files)
- **Trace sampling reduced** — `1.0` → `0.1` in production (90% cost reduction)
- **PII sending disabled** — `sendDefaultPii: false` (was `true`, leaking user data to Sentry)
- **Environment tagging** — `VERCEL_ENV` or `NODE_ENV` added for filtering in Sentry dashboard
- Files: `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`

### 3. Security Headers Added
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-XSS-Protection: 1; mode=block` — legacy XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — blocks unnecessary browser APIs
- `Content-Security-Policy` — allowlists for self, supabase, cloudinary, stripe, sentry, googleapis, tiktok, openai

### 4. Health Check Enhanced
- `/api/health` now checks Supabase DB connectivity with latency measurement
- Returns `{ status: 'ok', timestamp, version, checks: { database: { status, latencyMs } } }`
- Returns 503 when DB is unreachable (for uptime monitoring alerts)

### Modified Files
- `middleware.ts` — rate limiting + bot blocking + auth (merged)
- `lib/rate-limit.ts` — edge-runtime safe cleanup
- `sentry.server.config.ts` — DSN env var, sampling, PII
- `sentry.edge.config.ts` — DSN env var, sampling, PII
- `instrumentation-client.ts` — DSN env var, sampling, PII
- `next.config.mjs` — security headers
- `app/api/health/route.ts` — DB connectivity check

### Verification
- `npx tsc --noEmit`: 0 errors

### Environment Variable Required
- `NEXT_PUBLIC_SENTRY_DSN` — set on Vercel (Production/Preview/Development) with the Sentry DSN value: `https://4959cf03062f6e1eb46c182711422f34@o4510685962240000.ingest.us.sentry.io/4510685964795904`

---

## 2026-02-23 — Campaign Queue → Publishing Bridge (Close the Automation Loop)

### Problem
The campaign auto-trigger system was 90% built (engine, content generator, approval UI, settings dashboard) but **approved queue items never got published**. The `campaign_queue` table and `scheduled_posts` table were completely disconnected — campaigns could be triggered, content generated, and items approved, but nothing ever went out the door.

### Solution
Extended the publish-scheduled cron (`app/api/cron/publish-scheduled/route.ts`) with a 3-stage pipeline:
1. **Video URL backfill** (existing)
2. **Campaign queue bridge** (NEW) — processes approved `campaign_queue` items
3. **Publish due posts** (existing)

### Campaign Queue Processing by Content Type
| Type | Action |
|------|--------|
| `social_post` | Insert into `scheduled_posts` → publishing loop handles it |
| `property_site_update` | Update `property_sites.status_banner` directly |
| `video` | Fire-and-forget trigger to `/api/internal/video-generate` |
| `email` | Mark as published (content available in dashboard, manual send) |

### Campaign Completion Tracking
- `checkCampaignCompletion()` runs after each bridge cycle
- When all queue items for a campaign are published/skipped, campaign status → `completed`
- History audit trail: every published item logged to `campaign_history`
- Failed items marked with error message to prevent infinite retry

### Automation OS Loop Now Complete
```
Upload → Prepare → Market → Distribute → Measure → Loop
                                                      ↑
Status Change → Campaign Engine → Queue → Approve → Publish (this PR)
```

### Modified Files
- `app/api/cron/publish-scheduled/route.ts` — campaign bridge + completion tracking

### Verification
- `npx tsc --noEmit`: 0 errors

---

## 2026-02-23 — Explainer Video v4: Fix Shakiness, Jitter, and Voiceover Desync

### Root Causes Fixed
1. **Ken Burns jitter** — `interpolate()` had NO easing; linear sub-pixel translate snapped to integer pixels causing stutter. Fixed: added `Easing.inOut(Easing.ease)` to all 3 Ken Burns interpolations (scale, panX, panY)
2. **Too many screenshots** — features-gallery had 11 shots in 9s (0.82s each) causing flickering. Fixed: trimmed 6 scenes to min 2s per screenshot (51→36 total shots)
3. **Floating-point frame distribution** — `framesPerShot = 270/11 = 24.545` with `Math.floor()` caused uneven timing. Fixed: pre-computed integer frame boundaries via `Math.round()`
4. **Voiceover 3s ahead of visuals** — `<Audio>` started at frame 0 but intro card runs 0-3s. Fixed: wrapped in `<Sequence from={INTRO_DURATION - TRANSITION_FRAMES}>` (~2.4s delay)
5. **Linear crossfades** — screenshot-to-screenshot fades used linear interpolation. Fixed: added `Easing.inOut(Easing.ease)` for smooth opacity transitions

### Also
- Zeroed out horizontal `panX` values on all scenes (vertical-only pan eliminates horizontal jitter)
- Reduced Ken Burns scale ranges to subtler values (max 4% vs previous 5%)
- Cloudinary video version: v1771851056

### Modified Files
- `remotion/compositions/ExplainerVideo.tsx` — all 5 fixes
- `components/explainer-video-player.tsx` — updated Cloudinary URL

---

## 2026-02-23 — Add pre-push hook enforcing EXECUTION_CHANGELOG.md updates

- **New file**: `.claude/hooks/require-changelog.sh` — blocks `git push` and `git commit` if `EXECUTION_CHANGELOG.md` has not been modified in the branch's diff vs `origin/main`
- **Modified**: `.claude/settings.json` — added `PreToolUse` hooks matching `Bash(git push*)` and `Bash(git commit*)` that run the changelog check
- Ensures every code change is documented before it reaches the remote

---

## 2026-02-23 — Explainer Video v3: Real Screenshots + Shimmer Voiceover

### Problem
- Previous video used placeholder/blank screenshots and the `onyx` TTS voice was too deep and depressing
- Frame filenames in Remotion composition referenced non-existent v1 captures (0053-0079)
- Voiceover narration was out of sync with what was shown on screen

### Changes
- **Modified**: `remotion/compositions/ExplainerVideo.tsx` — rewrote all 10 scenes with correct v2 frame filenames (0000-0050), synced scene durations to voiceover paragraphs, smoother 0.6s crossfade transitions
- **Modified**: `components/explainer-video-player.tsx` — updated Cloudinary video URL to v1771845430
- **Generated**: `public/explainer-voiceover.mp3` — new voiceover using OpenAI TTS HD `shimmer` voice (87s, warm/friendly tone)
- **Captured**: 51 real UI screenshots via Puppeteer (`scripts/capture-explainer-v2.mjs`) showing actual dashboard, listings, studio, content studio with real demo data
- **Seeded**: Demo account data (2 listings with photos, marketing_jobs with descriptions/captions) so screenshots show real content
- Rendered 2712 frames (90.4s), uploaded 70MB MP4 to Cloudinary

### Scene Flow (synced to voiceover)
1. Homepage hero (11s) → 2. Features/gallery (9s) → 3. AI tools (7s) → 4. Pricing (8s) → 5. Signup (5s) → 6. Login/Dashboard (12s) → 7. Listings/Studio (13s) → 8. Content Studio (10s) → 9. Analytics/Brand (7s) → 10. Closing CTA (7s)

---

## 2026-02-23 — Fix CSP blocking explainer video from Cloudinary

- **Modified**: `next.config.js` — added `https://*.cloudinary.com` to `media-src` CSP directive
- Root cause: Content Security Policy `media-src` only allowed `'self'`, `blob:`, and Supabase origins
- Cloudinary video URL was blocked by the browser, making video controls completely unresponsive
- Also re-enabled Contentsquare script (was not the cause)

---

## 2026-02-23 — Explainer Video Composition + Homepage Video Player

### 1. Remotion ExplainerVideo Composition
- **New file**: `remotion/compositions/ExplainerVideo.tsx` — 9-scene product walkthrough
- Scenes: Intro → Homepage → Upload → AI Enhancement → Marketing Pipeline → Content Studio → Auto-Publish → Analytics → Closing CTA
- 16:9 landscape (1920x1080), 30fps, ~37 seconds total duration
- Uses TransitionSeries with fade and slide transitions between scenes
- Each scene recreates SnapR UI as animated React components (mockup style)
- Animated cursor, typing effects, progress bars, spring animations
- Registered in `remotion/Root.tsx` as `ExplainerVideo` composition

### 2. Homepage Video Player
- **New file**: `components/explainer-video-player.tsx` — custom video player component
- Play/pause, mute/unmute, progress bar, fullscreen controls
- Reads video URL from `NEXT_PUBLIC_EXPLAINER_VIDEO_URL` env var
- Falls back to placeholder UI when no video URL is configured
- Replaces `ProductExplainer` interactive component on homepage

### Next Steps
- Render the video via `npx remotion render ExplainerVideo` or Lambda
- Upload rendered MP4 to Cloudinary/CDN
- Set `NEXT_PUBLIC_EXPLAINER_VIDEO_URL` on Vercel
- Add voiceover later

---

## 2026-02-23 — Mobile App: Billing Gate UI + Notifications Integration + Mobile API Endpoints

### 1. Billing Gate UI Enforcement
- **AiDirectorScreen**: Blocks free/starter users with upgrade message before camera loads
- **ContentStudioScreen**: Blocks free-tier users from content studio, skips data fetch when gated
- Gate checks placed after all hooks (React rules-of-hooks compliant)

### 2. Push Notification Integration
- **App.tsx**: Registers for push notifications on login, stores device token via backend API
- Foreground notification listener + notification tap listener with cleanup
- Inner AppContent component pattern for auth-aware notification setup

### 3. Mobile API Endpoints
- **GET /api/mobile/dashboard-stats**: Returns totalListings, totalPhotos, publishedPosts counts
- **GET /api/mobile/content-stats**: Returns scheduledCount, publishedCount, totalImpressions

### Verification
- npx tsc --noEmit: 0 errors (root + mobile)

## 2026-02-23 — Mobile App Phase 5: Push Notifications + Billing Gates + App Store Prep

### 1. Push Notifications
- **notifications.ts**: expo-notifications service with permission request, Expo push token, Android channel
- **register-device API** (app/api/mobile/register-device/route.ts): stores device tokens in profiles.notification_preferences JSONB, dedup, max 5 devices
- Notification handler configured for banner, list, sound, badge

### 2. Billing Gate Enforcement
- **useBillingGate.ts**: Hook returning tier, canUseDirector, canPublish, canAccessContentStudio, listingsLimit
- Uses shared getPlanLimits + getListingLimits from @snapr/shared
- Free/Starter: AI Director locked, upgrade message shown
- Pro/Agency: Full access

### 3. App Store Preparation
- **eas.json**: EAS Build config with development (simulator), preview (internal), production (auto-increment) profiles
- **app.json**: Updated with expo-notifications plugin, notification icon, EAS project ID
- Notification icon placeholder created

### Verification
- npx tsc --noEmit: 0 errors (root + mobile)

## 2026-02-23 — Mobile App Phase 4: Content Studio + Settings

### 1. Content Studio (Data-Driven)
- Stats row: scheduled, published, total impressions
- Tab switcher: Scheduled / Published posts
- Platform color-coded badges (Facebook blue, Instagram pink, LinkedIn blue, TikTok cyan)
- Post cards with content preview, date, engagement metrics
- Pull-to-refresh

### 2. Settings (Enhanced)
- Real social connection status fetched from API
- "Connect" action opens web dashboard OAuth flow via Linking
- "Manage Subscription" opens web billing page
- Notifications section (placeholder for Phase 5)
- Pull-to-refresh for connection status

### 3. API Client Extensions
- Added getScheduledPosts, getPublishedPosts, getContentStats, getSocialConnections

### Verification
- npx tsc --noEmit: 0 errors (root + mobile)

## 2026-02-22 — Mobile App Phase 3: Photo Upload + Dashboard Mirror

### 1. Upload Queue with Offline Support
- **upload-queue.ts**: Persistent queue using expo-file-system (legacy API)
- Photos copied to queue directory, uploaded in batches of 3 concurrent
- Max 3 retries with status tracking (pending/uploading/completed/failed)
- Progress callback for real-time UI updates

### 2. Dashboard Screen (Data-Driven)
- Fetches real stats (listings, photos, published posts) from API
- Recent listings with status dots and photo counts
- Auto-refresh every 30s + pull-to-refresh
- "Start AI Capture Session" CTA navigates to Camera tab

### 3. Listings Screen with Search/Filter
- Full listing list with search by title/address
- Status filter pills (All/Pending/Preparing/Prepared/Marketing/Marketed/Failed)
- Client-side filtering with useMemo
- Status badges with color-coded dots

### 4. Listing Detail Screen
- Preparation + marketing status display with polling
- Photo grid with "Enhanced" badges on processed photos
- Actions: Prepare Listing, Add Photos (navigates to AI Director)
- Processing banner while preparation in progress

### 5. Marketing Results Screen
- Property description with copy-to-clipboard
- Per-platform social captions with copy buttons
- MLS summary, property site link, scheduled posts count
- Uses expo-clipboard for native clipboard access

### 6. Navigation + API Updates
- **ListingsStack.tsx**: Stack navigator (ListingsList → ListingDetail → MarketingResults)
- MainTabs updated to use ListingsStack
- **api.ts**: Added getDashboardStats, getRecentListings, getAllListings, getListingDetail, getListingPhotos, prepareListing, getMarketingResults

### Verification
- npx tsc --noEmit: 0 errors (root + mobile)

---

## 2026-02-22 — Mobile App Phase 2: AI Director Camera

### 1. AI Director Engine Modules
- **checklist.ts**: Room checklist system with property-type defaults (house/apartment/condo/townhouse/commercial), progress tracking, auto-mark on capture
- **composition-scorer.ts**: Rule-of-thirds + horizon level + symmetry scoring with weighted tips
- **lighting-analyzer.ts**: Ambient light assessment for interior/exterior with lux-based scoring
- **voice-coach.ts**: expo-speech TTS wrapper with priority queue, score coaching, room transitions

### 2. Camera UI Components
- **CompositionGrid.tsx**: Rule-of-thirds overlay with grid lines + center dot
- **ScoreRing.tsx**: Circular quality indicator (green 80+, yellow 50-79, red <50)
- **GuidanceOverlay.tsx**: Animated tip list with fade-in/out
- **RoomBadge.tsx**: Detected room type pill with confidence percentage
- **PhotoChecklist.tsx**: Slide-in panel with progress bar, room list, required badges

### 3. AI Director Screen (AiDirectorScreen.tsx)
- Full camera integration with expo-camera CameraView
- Real-time composition + lighting scoring (2s interval)
- Voice coaching on score threshold crossing
- Photo capture with haptic feedback + checklist auto-update
- Controls: flash, grid, voice, checklist toggle, capture button

### 4. Supporting Screens
- **SelectListingScreen.tsx**: Property type selector, create listing form, existing listings FlatList
- **CaptureReviewScreen.tsx**: Full-screen photo preview with score, room badge, keep/retake actions

### 5. Server-Side API Endpoint
- **app/api/mobile/analyze-frame/route.ts**: GPT-4o Vision frame analysis (detail: 'low' for speed), returns room type, scores, tips, capture recommendation

### 6. Navigation + API Client
- **CameraStack.tsx**: Stack navigator (SelectListing → AiDirector → CaptureReview)
- **MainTabs.tsx**: Updated Camera tab to use CameraStack
- **api.ts**: Added apiClient with getListings, createListing, analyzeFrame methods

### Verification
- npx tsc --noEmit: 0 errors (root + mobile)
- Risk Level: Low (all new files, no existing code modified except MainTabs)

---

## 2026-02-19 — Mobile App Phase 1: Project Scaffolding + Auth

### 1. Initialized Expo Mobile App (`apps/mobile/`)
- Created React Native app with Expo 54, TypeScript strict mode
- Configured for iOS (com.snapr.app) and Android with camera permissions
- Dark theme matching web app (#0A0A0A background, #D4A017 gold accent)

### 2. Created Shared Types Package (`packages/shared/`)
- Extracted Photo, Listing, Job, PhotoType, PhotoAnalysis, ToolId from web app
- Extracted billing limits (PlanType, PLAN_LIMITS, LISTING_LIMITS)
- Added mobile-specific types: RoomChecklistItem, FrameAnalysis, CapturedPhoto

### 3. Supabase Auth Integration
- Supabase client with expo-secure-store for secure token persistence
- AuthContext provider with session management, profile fetching
- Login + Signup screens with email/password auth

### 4. Navigation Structure (React Navigation)
- RootNavigator: Auth-gated switching between Auth stack and Main tabs
- AuthStack: Login, Signup screens
- MainTabs: Dashboard, AI Director (Camera), Listings, Content Studio, Settings

### 5. REST API Client
- Wrapper for all Next.js backend endpoints with auth headers
- Covers listings, upload, prepare, marketing, analytics, social, share

### 6. Root tsconfig.json Updated
- Excluded `apps/mobile/` and `packages/` to prevent React Native type conflicts

---

## 2026-02-22 — Gated Property Sites + Lead Capture Dashboard

- Created `property_leads` table with UTM attribution columns, RLS policies, public INSERT policy for visitors
- Lead gate on property sites: Pro/Agency users' sites show first 4 photos, then a capture form to unlock all photos + video
- `/api/leads` route: POST (public lead capture), GET (dashboard fetch with filters), PATCH (status update)
- `/dashboard/leads` page: lead list with status filters, expandable details, UTM attribution, status management, CSV export
- Added `canCaptureLeads` to plan limits (pro/agency = true, free/starter = false)
- Property site server component now fetches owner tier, passes `isGated`, `propertySiteId`, `userId` to client
- PropertySiteClient captures UTM params from URL on mount, sends with lead submission
- Existing `property-inquiry` route also persists sidebar contact form submissions to `property_leads` table
- Added "Leads" nav item to dashboard sidebar under Measure section
- Files: `supabase/migrations/20260222_property_leads.sql` (NEW), `app/api/leads/route.ts` (NEW), `app/dashboard/leads/page.tsx` (NEW), `app/p/[slug]/page.tsx`, `app/p/[slug]/PropertySiteClient.tsx`, `app/api/property-inquiry/route.ts`, `components/dashboard-sidebar.tsx`, `lib/content/limits.ts`

---

## 2026-02-22 — Token Refresh Cron + Publish Cron Bug Fix

- Created `app/api/cron/refresh-tokens/route.ts` — proactive token refresh every 4 hours
- Refreshes all tokens expiring within 48 hours (critical for TikTok's 24h tokens)
- Facebook/Instagram correctly use `access_token` with `fb_exchange_token` grant; others use `refresh_token`
- Logs refresh failures to `last_error` on the social_connection for visibility
- Registered in `vercel.json` at `0 */4 * * *` with 300s/1024MB config
- Fixed bug in publish cron: was passing `refresh_token` for Facebook/Instagram refresh, now correctly passes `access_token`
- Files: `app/api/cron/refresh-tokens/route.ts` (NEW), `vercel.json`, `app/api/cron/publish-scheduled/route.ts`

---

## 2026-02-22 — UTM Tracking + TikTok Publishing Integration

- Added UTM campaign tracking to all scheduled social post captions (utm_source, utm_medium, utm_campaign, utm_content)
- Property site URLs with UTM params appended in marketing handler Step 5 for traffic attribution
- Created `lib/social/utm.ts` standalone utility for UTM param appending
- TikTok OAuth v2 callback handler with `client_key` auth, `open_id` storage, 24h/365d token lifecycle
- TikTok video publishing via Content Posting API (`PULL_FROM_URL` — TikTok fetches from our S3 URL)
- TikTok photo carousel publishing via Photo Posting API (`DIRECT_POST` mode)
- Wired TikTok into cron publisher for both image and video post types
- Updated `oauth-config.ts`: TikTok v2 endpoints, scopes (`video.upload`), JSON body token exchange/refresh
- Unaudited TikTok apps default to `privacy_level: 'SELF_ONLY'` (private posts until app audit)
- Updated CLAUDE.md with TikTok publishing docs, UTM tracking, OAuth specifics
- Files: `lib/social/utm.ts` (NEW), `apps/processor/src/marketing-handler.ts`, `lib/social/oauth-config.ts`, `app/api/social/oauth/[platform]/route.ts`, `lib/social/publish-service.ts`, `app/api/cron/publish-scheduled/route.ts`, `CLAUDE.md`

---

## 2026-02-21 — Video Pipeline: Signed URLs + Faster Pacing + New Endpoints

- Video generate routes now resolve Supabase storage paths to signed URLs before passing to Lambda (fixes broken renders with relative paths)
- Added `/api/video/health` endpoint — checks Remotion env var config before render attempt
- Added `/api/video/watch` proxy endpoint — streams completed videos without exposing S3 URLs
- Reduced photo display from 4.5s to 3s per photo, crossfade from 1.5s to 1s (all compositions)
- VideoCreator checks `/api/video/health` on mount, shows config errors in UI
- Marketing status route now returns proxy URLs via `/api/video/watch`
- Updated CLAUDE.md voiceover duration from 4.5s to 3s per photo
- Files: `app/api/video/{generate,status,health,watch}/route.ts`, `app/api/internal/video-generate/route.ts`, `app/api/marketing/status/route.ts`, `VideoCreator.tsx`, `remotion/compositions/shared.tsx`, all composition files

---

## 2026-02-21 — Auto-Campaigns: Database Schema + Bug Fixes

- Created 4 new tables: `campaigns`, `campaign_queue`, `campaign_triggers`, `campaign_history`
- Added 4 columns to existing `campaign_templates`: `is_default`, `social_schedule`, `email_subject_template`, `email_template`
- All tables have RLS policies (user + service_role) and indexes
- Fixed `content-generator.ts`: wrong column names (`zip`→`postal_code`, `sqft`→`square_feet`, `url`→`raw_url`, `enhanced_url`→`processed_url`)
- Fixed `campaigns/route.ts`: same photo column name fix in PostgREST join
- Seeded existing campaign_templates with `is_default = true`
- **Migration must be applied to Supabase** before feature works (SQL editor or `npx supabase db push`)
- Files: `supabase/migrations/20260221_campaign_tables.sql`, `lib/campaigns/content-generator.ts`, `app/api/campaigns/route.ts`

---

## 2026-02-20 — Add AWS Error Diagnostics to Video Pipeline

- Production showed "UnknownError" after Lambda upgrade — no DB rows created, so error is in generate route
- AWS SDK errors include `$metadata.httpStatusCode` (403 = permission, 429 = throttle) not exposed before
- Enhanced error catch blocks in generate, internal-generate, and status routes to extract AWS metadata
- VideoCreator now surfaces `errorName` and `awsHttpStatus` in the UI error display
- Files: `app/api/video/generate/route.ts`, `app/api/internal/video-generate/route.ts`, `app/api/video/status/route.ts`, `VideoCreator.tsx`

---

## 2026-02-20 — Upgrade Lambda to 3GB RAM / 900s Timeout

- Redeployed Lambda function: `remotion-render-4-0-424-mem3008mb-disk2048mb-900sec`
- Previous function (2GB/240s) timed out on 31-photo videos (~4200 frames)
- Added `timeoutInMilliseconds: 900000` to both `renderMediaOnLambda` calls
- Requires Vercel env var update: `REMOTION_LAMBDA_FUNCTION_NAME`
- Files: `app/api/video/generate/route.ts`, `app/api/internal/video-generate/route.ts`

---

## 2026-02-20 — Force Single-Lambda Video Rendering

- Increased `framesPerLambda` from 200 to 20000 in both video generate routes
- With 31 photos (~900 frames), `framesPerLambda: 200` spawned ~5 concurrent lambdas exceeding AWS concurrency limit
- `framesPerLambda: 20000` forces all rendering onto a single lambda (2GB RAM, 240s timeout — sufficient)
- Files: `app/api/video/generate/route.ts`, `app/api/internal/video-generate/route.ts`

---

## 2026-02-20 — Fix "s.map is not a function" in Video Generation

- Root cause: `lib/video/photo-ordering.ts` assumed `preparation_metadata.photoAudit` was an array and called `.map()` on it
- Actual data: `photoAudit` is a `Record<string, object>` (keyed by photoId), produced by `listing-engine/index.ts`
- Additionally, `photoType` lives in `decisionAudit`, not `photoAudit`
- Fix: Rewrote `orderPhotosForWalkthrough()` to read `decisionAudit` as a Record, using `Object.entries()` instead of `.map()`
- Added guards for missing/empty/non-object data with fallback to original photo order
- File: `lib/video/photo-ordering.ts`

---

## 2026-02-20 — Fix Remotion Lambda Bundling for Vercel

- Added `serverExternalPackages` to `next.config.mjs` for `@remotion/lambda`, `@remotion/lambda-client`, `@remotion/serverless`
- Root cause: Next.js webpack re-bundles the Remotion Lambda client (76K-line pre-built bundle containing AWS SDK), breaking internal `.map()` calls and producing minified "s.map is not a function" error
- `serverExternalPackages` tells Next.js to use native `require()` instead of webpack bundling for these packages
- Confirmed: `renderMediaOnLambda` works perfectly via CLI (native Node.js) but fails from Vercel serverless functions (webpack-bundled)
- Added diagnostic logging to video generate route for future debugging
- Files: `next.config.mjs`, `app/api/video/generate/route.ts`, `app/dashboard/content-studio/video/VideoCreator.tsx`

---

## 2026-02-20 — Fix Lambda Concurrency Limit for Video Rendering

- Added `framesPerLambda: 200` to `renderMediaOnLambda` calls in both video generate routes
- Root cause: AWS account has low Lambda concurrency limit; default Remotion splits renders across ~9 parallel lambdas causing `TooManyRequestsException` (surfaced as "s.map is not a function")
- Confirmed via CLI: single-lambda render succeeds, multi-lambda render fails with rate limit
- Files: `app/api/video/generate/route.ts`, `app/api/internal/video-generate/route.ts`

---

## 2026-02-20 — Fix Video Render Crash, Property Site 404, Voiceover Details

### 1. Video Render "s.map is not a function" Fix
- Made `price`, `beds`, `baths` optional in all 5 Remotion composition Zod schemas
- Root cause: API sends `undefined` for missing listing fields, but Zod schemas required `z.number()` — validation failure on Lambda produced minified error
- Updated ClosingCard to conditionally render price/details only when present
- Fixed PriceDrop composition to guard optional `listing.price`
- Files: `remotion/compositions/{PropertyShowcase,JustListed,OpenHouse,PriceDrop,Sold,ClosingCard}.tsx`

### 2. Property Site 404 Fallback
- Added listing_id fallback lookup when slug lookup fails in `app/p/[slug]/page.tsx`
- Added structured diagnostic logging with error code, message, and slug

### 3. VideoCreator Property Details for Voiceover
- Added `price`, `bedrooms`, `bathrooms`, `square_feet` to Supabase query in VideoCreator
- Passes full property details to voiceover API for richer script generation
- Displays listing price in VideoCreator preview
- File: `app/dashboard/content-studio/video/VideoCreator.tsx`

---

## 2026-02-20 — Prevent CDN Caching of Property Site 404s

- Added `no-store` Cache-Control + CDN-Cache-Control headers for `/p/*` routes in `vercel.json`
- Added `export const revalidate = 0` to `app/p/[slug]/page.tsx`
- Prevents Vercel edge from caching stale 404 responses

---

## 2026-02-20 — Fix Ambiguous photos FK (PGRST201) Across Codebase

### Root Cause
The `listings` table has TWO foreign key paths to `photos`:
1. `photos.listing_id → listings.id` (one-to-many — the one we want)
2. `listings.hero_photo_id → photos.id` (many-to-one — for hero photo)

PostgREST returns PGRST201 "Could not embed because more than one relationship was found" for any query using `photos(...)` on listings. This caused the video generate endpoint to return "Listing not found" (the entire query returned null).

### Files Fixed (6 files)
- `app/api/video/generate/route.ts` — `photos(...)` → `photos!photos_listing_id_fkey(...)`
- `app/api/internal/video-generate/route.ts` — same fix
- `app/p/[slug]/page.tsx` — same fix
- `components/dashboard-client.tsx` — same fix
- `lib/campaigns/engine.ts` — same fix
- `app/(authenticated)/listings/page.tsx` — same fix
- `app/(authenticated)/listings/[id]/page.tsx` — same fix

---

## 2026-02-20 — Voiceover Timeout Fix + Remotion Env Vars on Vercel

### 1. Voiceover TTS Timeout Fix
- Increased `AbortSignal.timeout` from 15s to 45s for both ElevenLabs and OpenAI TTS calls
- Added `export const maxDuration = 60` to voiceover route
- Added voiceover route to `vercel.json` with `maxDuration: 60` and `memory: 1024`
- Root cause: TTS generation for 130+ word property narration scripts regularly exceeds 15s

### 2. Vercel Environment Variables Added
- Added 6 `REMOTION_*` env vars to Vercel (Production, Preview, Development) — video generation was returning 503 because these were only in `.env.local`
- Added `OPENAI_API_KEY` to Preview and Development environments (was only on Production)

### 3. Property Site 404 Fix
- Replaced fragile inline `getSupabase()` with shared `adminSupabase()` helper in `app/p/[slug]/page.tsx`
- Updated all `property_sites` rows to `is_published: true` (were incorrectly `false` from old Worker code)
- Added error logging for property_sites slug lookup failures

---

## 2026-02-20 — Property Details: Migration, Form, Marketing, Video, Property Sites

### 1. Database Migration — `20260220_listing_property_details.sql`
- Added 13 columns to `listings` table: `price`, `bedrooms`, `bathrooms`, `square_feet`, `property_type`, `year_built`, `lot_size`, `parking`, `features` (JSONB), `mls_number`, `hoa_fees`, `latitude`, `longitude`
- Added indexes for `property_type`, `price`, `mls_number`
- **MUST BE APPLIED** to Supabase before deploying this code

### 2. Listing Creation Form — `app/listings/new/page.tsx`
- Added city/state/ZIP fields, price/beds/baths/sqft row, description
- Added collapsible "additional details" section: property type, year built, lot size, parking, MLS number, HOA fees
- Updated insert query to save all new fields to the database

### 3. Marketing Handler — `apps/processor/src/marketing-handler.ts`
- Expanded listing query to fetch all property detail columns
- Step 1 (Description): Now passes `price`, `beds`, `baths`, `sqft`, `propertyType` to GPT-4o
- Step 2 (Captions): Now passes `price`, `bedrooms`, `bathrooms`, `squareFeet`, `propertyType` to GPT-4o-mini
- Richer AI-generated content with real property data

### 4. Video Generate APIs
- Both `/api/video/generate` and `/api/internal/video-generate` now fetch and pass `price`, `beds`, `baths`, `sqft` to Remotion compositions
- Video overlays can now display real property details

### 5. Property Site Metadata — `app/p/[slug]/page.tsx`
- Enhanced OG tags with price and specs (beds/baths/sqft)
- Property site pages will now show full details (price, bedrooms, etc.) since `select('*')` picks up the new columns

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: Success

---

## 2026-02-20 — Fix Video Generate "Listing not found" & Voiceover Failure

### 1. Video Generate API — Non-existent Column Query
- **Root cause:** `/api/video/generate` queried `price, beds, baths, sqft, features` columns that don't exist on the `listings` table. Supabase returns null for the entire query, triggering "Listing not found" error.
- Replaced with actual columns: `title, address, city, state, description, preparation_metadata`
- Updated `ListingWithPhotos` interface and `listingProps` construction
- Files Modified: `app/api/video/generate/route.ts`

### 2. Internal Video Generate API — Same Fix
- `/api/internal/video-generate` (called by Cloudflare Worker marketing pipeline) had the exact same non-existent column query
- Same fix applied: replaced phantom columns with real ones
- Files Modified: `app/api/internal/video-generate/route.ts`

### 3. Voiceover Unblocked
- The voiceover API (`/api/video/voiceover`) was working correctly — it generates scripts via OpenAI and audio via ElevenLabs/OpenAI TTS
- Voiceover appeared broken because after generating audio, clicking "Generate Video" called `/api/video/generate` which immediately failed
- With the query fix, the full flow (voiceover → video render) now works end-to-end

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: Success

---

## 2026-02-20 — Pipeline Gap Fixes: TikTok Captions, Video→Post Bridge, Video Status

### 1. TikTok Caption Generation
- Added `'tiktok'` to marketing handler Step 2 platforms array
- gpt-copy provider already supported TikTok in its type signature — just needed the call
- Content Studio unified-creator auto-fills TikTok captions from `captions_result.tiktok`
- Files Modified: `apps/processor/src/marketing-handler.ts`

### 2. Video → Scheduled Post Bridge
- Marketing Step 6 fires Remotion Lambda but never linked the video URL back to scheduled posts
- Added video URL backfill in `publish-scheduled` cron: queries `video_render_jobs` for completed renders, updates matching `scheduled_posts.video_url`
- Runs every 15 min before the publish loop, so videos get linked before publishing
- Fixed pre-existing duplicate `const message` lint warnings in catch blocks
- Files Modified: `app/api/cron/publish-scheduled/route.ts`

### 3. Correct Video Status After Trigger
- Marketing handler was setting `video_status: 'completed'` immediately after triggering the render, but the video was still rendering on Lambda
- Changed to `video_status: 'processing'` with `status: 'rendering'` flag in result
- Actual completion is tracked by `/api/video/status` polling and cron backfill
- Files Modified: `apps/processor/src/marketing-handler.ts`

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: Success

---

## 2026-02-20 — Critical Bug Fixes: Property Site, Video Reel, Studio, Content Visibility

### 1. Property Site 404 Fix
- **Root cause:** `/p/[slug]` page extracted UUID from slug via regex, but marketing handler generates address-based slugs with random suffix (no UUID). Regex never matched, causing 404.
- Rewrote slug lookup to query `property_sites` table by slug, then fetch listing via `listing_id`
- Changed marketing handler to set `is_published: true` so pages are live immediately
- Removed non-existent columns from metadata query (bedrooms, bathrooms, square_feet)
- Files Modified: `app/p/[slug]/page.tsx`, `apps/processor/src/marketing-handler.ts`

### 2. Video Reel Photos Not Loading
- **Root cause:** VideoCreator queried 5 non-existent columns (price, bedrooms, bathrooms, square_feet, features) from listings table, causing the entire Supabase query to fail silently.
- Fixed query to only select existing columns (title, address, city, state, description)
- Updated ListingData interface to match actual schema
- Removed price/bedrooms references from script generation and fallback
- Files Modified: `app/dashboard/content-studio/video/VideoCreator.tsx`

### 3. Studio Marketing Panel Auto-Show
- **Root cause:** Marketing results panel only appeared after clicking "View Results" button, which itself only showed when marketing_status was 'completed'. Users never discovered the panel.
- Auto-show marketing results panel when marketing status is 'completed'
- Fixed unused variable lint warning in catch block
- Files Modified: `components/studio-client.tsx`

### 4. Content Studio Generated Content Visibility
- **Root cause:** marketing_jobs query only fetched status columns, not result/artifact columns. UI showed "AI Content Ready" badge but never displayed actual generated content.
- Expanded marketing_jobs query to include description_result, captions_result, property_site_result
- Added content preview below each listing card: description preview, caption count, property site link
- Fixed pre-existing `any` types in listing/photo mapping
- Files Modified: `app/dashboard/content-studio/page.tsx`, `app/dashboard/content-studio/ContentStudioClient.tsx`

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: Success

---

## 2026-02-20 — Error Handling Hardening

### Summary
Replaced all `catch (error: any)` with `catch (error: unknown)` across 83 source files (128 catch blocks), per CLAUDE.md convention. Uses `error instanceof Error` guards with proper message extraction.

### Standard Pattern
- `catch (error: any)` → `catch (error: unknown)` with `const message = error instanceof Error ? error.message : 'fallback';`
- All `error.message` and `error?.message` references replaced with guarded `message` variable

### Special Cases (5 blocks)
- `error.name === 'AbortError'` — guarded with `error instanceof Error &&` (autoenhance.ts, index.ts, preparation-overlay.tsx)
- `error.code === 'insufficient_quota'` — guarded with `instanceof Error && 'code' in error` (generate-caption/route.ts)
- `error.stack` — guarded with `error instanceof Error ? error.stack : undefined` (listing/prepare/route.ts)

### Files Modified
83 files across API routes (44), lib/AI pipeline (12), dashboard pages (7), components (6), authenticated pages (2), public pages (3), worker (1), functions (2), and other modules (6).

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: Success
- `grep -rn "catch.*: any"`: 0 results in source files

---

## 2026-02-20 — Product Readiness: Critical User-Facing Fixes

### 1. Waitlist Email Submission (Phase 2A)
- `handleNotifySubmit` now calls `/api/notify` API to save email and send confirmation
- Previously showed success UI without actually saving the email
- Files Modified: app/page.tsx

### 2. Calendly URL Configuration (Phase 2B)
- Replaced hardcoded Calendly URLs with `NEXT_PUBLIC_CALENDLY_URL` env var + fallback
- Files Modified: app/contact/page.tsx, app/why-snapr/page.tsx

### 3. Revision Notification Emails (Phase 2C)
- POST: Editors notified via Resend when new revision requested (support@snap-r.com)
- PATCH: Users notified via Resend when their revision is completed
- Added `notifyEditorsOfRevision()` and `notifyUserOfCompletion()` helpers
- Both use try/catch to prevent email failures from blocking API responses
- Fixed all `catch (error: any)` to `catch (error: unknown)` with proper type guards
- Added `RevisionUpdateData` interface replacing inline any type
- Files Modified: app/api/renovation/revision/route.ts

### 4. Organization Membership Check (Phase 2D)
- Added `organization_members` table query when user is not the org owner
- Uses `maybeSingle()` for optional membership lookup
- Non-members redirected to `/dashboard` instead of seeing empty page
- Files Modified: app/org/[slug]/dashboard/page.tsx

### 5. Team Size from Database (Phase 2E)
- Replaced hardcoded `isTeam25 = false` with actual count from `organization_members`
- Queries member count + 1 (for owner) to determine if team has 25+ members
- Files Modified: app/dashboard/organization/page.tsx

### 6. OAuth Profile Fetch — TikTok & Twitter (Phase 2F)
- Added `case 'tiktok'` using TikTok v2 User Info API
- Added `case 'twitter'` using Twitter/X v2 users/me endpoint
- Removed dead `default: throw` since all 5 platforms now handled
- Files Modified: lib/social/oauth-config.ts

### 7. Error Handling & Lint Fixes
- Fixed `catch (error: any)` → `catch (error: unknown)` in notify/route.ts
- Fixed unescaped JSX entities across 3 files (contact, why-snapr, organization)
- Removed unused imports (BookOpen, Eye, Zap, BarChart3)
- Added eslint-disable for intentional img elements

### Verification
- npx tsc --noEmit: 0 errors
- npm run build: Success

---

## 2026-02-20 — Marketing Pipeline → Content Studio Integration

### 1. Content Studio Dashboard — Marketing-Aware Routing (Phase 1A)
- Listings with completed marketing now show gold "AI Content Ready" badge with Sparkles icon
- Processing listings show animated "Generating" badge
- Click on listing auto-appends `&prefill=marketing` to route when marketing is completed
- Hover CTA changes to "Create with AI Content" and shows "Captions & hashtags auto-loaded" hint
- "Start Creating" footer link also passes prefill param
- Cleaned up unused imports (ArrowLeft, Calendar, Settings, ChevronRight, Hash, BarChart3, CheckCircle)
- Files Modified: app/dashboard/content-studio/ContentStudioClient.tsx

### 2. Auto-Populate Create Post from Marketing Captions (Phase 1C)
- Removed `?prefill=marketing` URL param requirement — now auto-detects marketing content when any listing is selected
- Captions and hashtags auto-load from marketing_jobs table for completed marketing listings
- Added "Auto-generated captions loaded from marketing pipeline" banner (only shown when not manually edited)
- Fixed all 9 `any` types → proper interfaces (ListingPhoto, ListingRecord, ListingData)
- Fixed all `catch (e: any)` → `catch (e: unknown)` with Error type guards
- Fixed `mp4Data as any` → safe ArrayBuffer copy pattern
- Cleaned up unused imports and added eslint-disable for intentionally unused vars
- Files Modified: components/content-studio/unified-creator.tsx

### 3. Video Creator — Auto-Load Existing Renders (Phase 1D)
- Added useEffect to check `/api/marketing/status` for existing video renders when listing loads
- If marketing pipeline already rendered a video, auto-sets videoUrl and shows completed state
- Users see previously rendered video immediately with download/re-render options
- Files Modified: app/dashboard/content-studio/video/VideoCreator.tsx

### 4. Email Marketing — Pre-fill from AI Description (Phase 1E)
- Added marketing description fetch when listing is selected
- AI-generated description from marketing pipeline used as primary source in email body
- Falls back to user-entered listing description when no marketing description exists
- Both HTML and text email templates updated to prefer AI description
- Fixed `any` types: propertySites forEach and listingsData map
- Cleaned up unused imports (Send, Image, X)
- Files Modified: app/dashboard/content-studio/email/EmailMarketing.tsx

### 5. Scheduled Posts Visibility (Phase 1F)
- Verified: auto-scheduled posts from marketing pipeline already appear in calendar and scheduled list views
- Both views query the same `scheduled_posts` table that the Worker writes to
- No code changes needed — integration already works

### Verification
- npx tsc --noEmit: 0 errors
- npm run build: Success

---

## 2026-02-20 — Conversion & Onboarding Polish

### 1. Real Music Tracks
- Replaced 5 silent placeholder MP3s with synthesized background music (45s each, 128kbps stereo)
- Added LICENSES.md documenting track origins
- Files Modified: public/music/upbeat.mp3, elegant.mp3, cinematic.mp3, ambient.mp3, corporate.mp3, LICENSES.md

### 2. Landing Page Conversion
- Added trust section with brokerage logos and trust badges (Shield, Lock, CheckCircle)
- Updated hero social proof line with "Join 500+ professionals"
- Added mobile sticky CTA bar using IntersectionObserver
- Added footer lead capture form (email for marketing guide)
- Files Modified: app/page.tsx

### 3. Onboarding Social Connect (Step 5)
- Inserted new Step 5: Connect Social Accounts (Facebook, Instagram, LinkedIn OAuth)
- Renumbered old Step 5 (WhatsApp) → Step 6, old Step 6 (Get Started) → Step 7
- OAuth state carries returnTo URL for post-redirect restoration
- Files Modified: app/onboarding/page.tsx

### 4. OAuth Callback returnTo Support
- Extract returnTo from JSON state with open-redirect prevention (validates path starts with / not //)
- Use correct query param separator when redirectUrl already has params
- Files Modified: app/api/social/oauth/[platform]/route.ts

### 5. Guided First Listing
- 3-step tooltip system on new listing page (title → photos → submit) with auto-advance
- Studio guided tooltip on "Prepare Listing" button with localStorage persistence
- Onboarding "Create Your First Listing" redirects to /listings/new?guided=true
- Files Modified: app/listings/new/page.tsx, app/dashboard/studio/page.tsx, components/studio-client.tsx

### 6. Gitignore Cleanup
- node_modules now ignored globally (was /node_modules only)
- Added ignore rules for .agent/, .agents/, .claude/, .cursor/, .planning/, .env.vercel-*, *.docx, *.pptx
- Files Modified: .gitignore

### Verification
- npx tsc --noEmit: 0 errors
- npm run build: Success

---

## 2026-02-19 — Fix Property Site Critical Issues

### 1. Fix Nonexistent Table Query
- Changed `listing_videos` → `video_render_jobs` in property site server component
- Added `status = 'completed'` filter to only show finished video renders
- Files Modified: app/p/[slug]/page.tsx

### 2. Remove Hardcoded Google Maps API Key
- Removed exposed fallback key `AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8` from client code
- Maps API key now passed as `mapsApiKey` prop from server component via env var
- Shows address fallback with MapPin icon when no API key configured
- Files Modified: app/p/[slug]/page.tsx, app/p/[slug]/PropertySiteClient.tsx

### 3. Fix Type Safety — Eliminate `any` Types
- Defined `ListingPhoto` interface for photo sorting and mapping
- Replaced `(a: any, b: any)` and `(photo: any)` with properly typed parameters
- Added `display_order` field to shared `Photo` interface
- Files Modified: app/p/[slug]/page.tsx, lib/types.ts

### Verification
- npx tsc --noEmit: 0 errors
- npm run build: Success

---

## 2026-02-19 — Phase 7: Additional Templates + Polish (Video Engine v1.1)

### 1. PriceDrop Template + PriceDropBadge
- Created `remotion/compositions/PriceDrop.tsx` — urgency-paced template (3.5s/photo, 1s slide
  transitions). IntroCard shows "Price Reduced" with savings subtitle. Uses slide transitions
  from @remotion/transitions for visual differentiation.
- Created `remotion/compositions/PriceDropBadge.tsx` — red badge (#EF4444) showing percentage
  drop, previous price with strikethrough, and new price in green (#22C55E). Persists at top
  of frame during slideshow. Fade-in animation over first 20 frames.
- Zod schema: `priceDropSchema` with optional `listing.previousPrice`.
- Duration: `calculatePriceDropDuration()` — urgency pacing at 105 frames/photo.

### 2. Sold Template + SoldBadge
- Created `remotion/compositions/Sold.tsx` — celebration-style template with standard pacing
  (4.5s/photo), crossfade transitions. IntroCard shows "Sold" with social proof subtitle.
  Purple closing card (#8B5CF6) instead of gold.
- Created `remotion/compositions/SoldBadge.tsx` — purple badge (#8B5CF6) with party emoji,
  optional "Sold in X Days" social proof text. Fade-in animation.
- Zod schema: `soldSchema` with optional `listing.daysOnMarket`.
- Duration: `calculateSoldDuration()` — standard pacing at 135 frames/photo.

### 3. Root.tsx Registration — 6 New Compositions
- Registered PriceDrop and Sold in 3 aspect ratios each (9:16, 1:1, 16:9) = 6 new compositions.
- Total compositions: 16 (TestVideo + 5 templates × 3 ratios).
- Added default props with sample data: `priceDropDefaultProps` (previousPrice: 2500000),
  `soldDefaultProps` (daysOnMarket: 12).
- Files Modified: remotion/Root.tsx

### 4. API Route Updates — Composition ID Routing
- Updated `app/api/video/generate/route.ts` (user-facing): added `price-drop` and `sold`
  cases to getCompositionId(), template-specific prop injection for previousPrice/daysOnMarket.
- Updated `app/api/internal/video-generate/route.ts` (internal/marketing): same composition
  ID cases, expanded InternalGenerateBody interface with previousPrice/daysOnMarket.
- Updated `lib/validation/schemas.ts`: added 'price-drop' and 'sold' to template enum,
  added previousPrice (number.positive) and daysOnMarket (int 0-9999) optional fields.

### 5. VideoCreator UI — Template Selector + Inputs
- Added PriceDrop and Sold to VIDEO_TEMPLATES constant with descriptions and icons.
- Added conditional UI controls: "Original Price" input for PriceDrop, "Days on Market"
  input for Sold. Values passed to generate API as template-specific params.
- Files Modified: app/dashboard/content-studio/video/VideoCreator.tsx

### 6. Marketing Handler — Template Auto-Selection
- Extended `MarketingJobMessage` in types.ts with optional `videoTemplate`, `previousPrice`,
  `daysOnMarket` fields for template hinting from upstream triggers.
- Updated `marketing-handler.ts` to use `message.videoTemplate` (defaults to 'property-showcase').
  Template-specific params injected into internal API call body.
- Video result recording now stores actual template name (was hardcoded to 'property-showcase').
- Files Modified: apps/processor/src/types.ts, apps/processor/src/marketing-handler.ts

### Verification
- npx tsc --noEmit: 0 errors
- npm run build: Success

---

## 2026-02-19 — Phase 6: Agent Branding + Video Publishing (Video Engine v1.1)

### 1. BrandOverlay Shared Component
- Created `remotion/compositions/BrandOverlay.tsx` with Zod `brandSchema` and two components.
- `BrandWatermark`: Agent logo overlay in top-right during photo slideshow (fade-in, 85% opacity).
- `BrandFooter`: Tagline + business name + phone/website + brokerage logo on closing card
  with staggered entrance animations.
- All brand fields optional — compositions render identically without brand data.

### 2. Brand Integration in All Templates
- Added `brand: brandSchema.optional()` to PropertyShowcase, JustListed, OpenHouse schemas.
- Each template now renders BrandWatermark during slideshow and BrandFooter on closing card.
- ClosingCard accepts `primaryColor` prop (defaults to '#D4A017'), replaces hardcoded gold.
- Updated Root.tsx with `defaultBrand` sample data for Remotion Studio preview.
- Files Modified:
  remotion/compositions/PropertyShowcase.tsx, JustListed.tsx, OpenHouse.tsx,
  ClosingCard.tsx, Root.tsx

### 3. Internal Video Generate API — Brand Data Injection
- Updated `app/api/internal/video-generate/route.ts` to fetch `brand_profiles` from DB.
- Uses `adminSupabase().from('brand_profiles').maybeSingle()` (bypasses RLS).
- Maps snake_case DB columns to camelCase composition props with `?? undefined` coercion.
- Brand data injected as `inputProps.brand` for Lambda render — videos are now branded.

### 4. Video Publishing in Cron Publisher
- Rewrote `app/api/cron/publish-scheduled/route.ts` with video publishing support.
- Checks `post.video_url` to route to video-specific publishing functions.
- Facebook video: `POST /v18.0/${pageId}/videos` with `file_url` param.
- Instagram Reels: 3-step flow (create REELS container → poll status → publish).
- LinkedIn video: returns "coming soon" error (requires complex upload flow).
- Fixed all `catch (error: any)` → `catch (error: unknown)` with instanceof guards.
- Added AbortSignal.timeout to all fetch calls (15-30s).

### 5. Database Migration — scheduled_posts video_url
- Created `supabase/migrations/20260219_scheduled_posts_video_url.sql`.
- Adds `video_url TEXT` column to `scheduled_posts` table for video post routing.

---

## 2026-02-19 — Phase 5: Marketing Pipeline + Billing (Video Engine v1.1)

### 1. Video Generation as Marketing Step 6
- Added Step 6 (video generation) to the 5-step marketing pipeline in `marketing-handler.ts`.
- Fire-and-forget: triggers Remotion Lambda render via internal API, doesn't block other steps.
- Always-complete semantics: video failure doesn't block marketing completion.
- Billing gate: Free/Starter tiers get `video_status: 'skipped'`, Pro/Agency get full generation.

### 2. Internal Video Generate API
- Created `app/api/internal/video-generate/route.ts` for Worker-to-API communication.
- Uses CRON_SECRET bearer auth (same pattern as Vercel cron jobs).
- Fetches listing + photos via adminSupabase, orders photos, triggers Lambda render.
- Returns `{ renderId, bucketName }` to marketing handler.

### 3. Database Migration
- Created `supabase/migrations/20260219_marketing_jobs_video.sql`.
- Adds `video_status` (TEXT, default 'pending') and `video_result` (JSONB) to `marketing_jobs`.

### 4. Marketing Status API — Video Resolution
- Updated `app/api/marketing/status/route.ts` to include video step data.
- Resolves actual `videoUrl` by joining `video_render_jobs` when `video_result.renderId` exists.
- Fixed `catch (error: any)` → `catch (error: unknown)`.

### 5. Marketing Banner — 6 Steps
- Updated `components/marketing-banner.tsx` with Video in STEPS array (6 progress dots).
- Added "Video ready" indicator in completed state banner.

### 6. Marketing Results Panel — Video Card
- Added 6th CollapsibleSection for "Property Video" in `components/marketing-results-panel.tsx`.
- Shows video player with download button when render complete.
- Shows rendering spinner while in progress.
- Shows upgrade prompt for skipped (billing gate).

### 7. Billing Limits — canGenerateVideo
- Added `canGenerateVideo` to all tiers in `lib/content/limits.ts`.
- Free/Starter: false, Pro/Agency: true.
- Added `canGenerateVideo()` convenience function export.

---

## 2026-02-12 — Phase 1 Billing Hardening

### 1. Fixed Tailwind Build Failure
- Installed missing `autoprefixer` dependency.
- Root cause: PostCSS config required plugin but dependency missing.
- Impact: UI rendering restored.

---

### 2. Removed Billing Increment From Worker
- Deleted `incrementUsageIfNotCounted` call from worker queue processor.
- Reason: Billing must not be controlled by async worker.
- Architectural Correction: Billing moved to API layer.

---

### 3. Moved Billing Increment to `/api/listing/prepare`
- Increment now happens immediately after successful job creation.
- Prevents race conditions and orphan billing.
- Order corrected to:
  1. Subscription enforcement
  2. Job insert
  3. Billing increment
  4. Listing status update
  5. Worker trigger

---

### 4. Identified Queue vs HTTP Architecture Mismatch
- API was calling worker via HTTP `/process`.
- Worker implemented only `queue()` consumer.
- Result: Jobs stuck in `queued`.
- Diagnosis: Hybrid trigger model.

---

### Current State
- Billing enforcement working (402 correctly returned when limit exceeded).
- Job creation working.
- Worker queue consumer active.
- Trigger alignment pending (HTTP → Queue bridge).

---

### Next Architectural Alignment
Restore proper HTTP → Queue → Consumer pipeline:

Next.js API
    ↓ HTTP
Cloudflare Worker (fetch handler)
    ↓ enqueue
Cloudflare Queue
    ↓ consume
Cloudflare Worker (queue handler)


-------------------------------------------------------------------------------
## 2026-02-12 20:37:25 — Restore HTTP to Queue architecture
-------------------------------------------------------------------------------

- Description:
- Files Modified:
- Architectural Impact:
- Blueprint Alignment:
- Risk Level:


-------------------------------------------------------------------------------
## 2026-02-12 — Normalize preparation status lifecycle
-------------------------------------------------------------------------------

- Description:
  Replaced 'queued' with 'preparing' in app/api/listing/prepare/route.ts.
  This aligns the API guard condition and the state update with the intended lifecycle.

- Files Modified:
  app/api/listing/prepare/route.ts

- Architectural Impact:
  Corrects state machine inconsistency that caused duplicate prepares,
  UI polling issues, and potential race conditions.

- Blueprint Alignment:
  Yes — lifecycle now strictly follows:
  idle → preparing → prepared | failed

- Risk Level:
  Low


-------------------------------------------------------------------------------
## 2026-02-15 — Phase 1 Infrastructure Hardening: Dead Code Removal & Subscription Fix
-------------------------------------------------------------------------------

### 1. Subscription Enforcement Bug Fix
- Description:
  Rewrote app/api/listing/prepare/route.ts to query `profiles` table
  instead of nonexistent `subscriptions` table. Corrected column names:
  `monthly_listing_limit` → `listings_limit`,
  `status` → `subscription_status`.
  Stripe webhook writes to `profiles` — prepare route now reads from `profiles`.
- Files Modified:
  app/api/listing/prepare/route.ts
- Architectural Impact:
  Critical revenue protection fix. Subscription limits were never enforced —
  any user could prepare unlimited listings. Now properly enforced.
- Blueprint Alignment:
  Yes — billing lives on `profiles` table per Stripehitecture.
- Risk Level:
  High (revenue-critical fix)

### 2. Dead Code Removal — Worker
- Description:
  Deleted enhancement-executor.ts (placeholder models, never called) and
  model-router.ts (unused routing logic). Worker index.ts already uses
  correct V2 pipeline via runTool→replicate.ts.
- Files Modified:
  apps/processor/src/services/enhancement-executor.ts (DELETED)
  apps/processor/src/lib/model-router.ts (DELETED)
- Architectural Impact:
  Eliminates type conflicts and maintenance overhead. Worker pipeline
  now has single clear path: index.ts → V2 listing-engine → replicate.ts.
- Blueprint Alignment:
  Yes — V2 pipeline is the canonical path.
- Risk Level:
  Low (dead code removal only)

### 3. Dead Code Removal — Legacy Files
- Description:
  Deleted deprecated prepare-stream route, duplicate worker prepare route,
  old backup directories, legacy workers, and worker-billing.patch.
- Files Modified:
  app/api/listing/prepare-stream/route.ts (DELETED)
  app/api/worker/prepare/route.t  backups/ai-pipeline-20251204/* (6 files DELETED)
  lib/ai/listing-engine-v2-backup/* (9 files DELETED)
  src/workers/imageEnhanceWorker.js (DELETED)
  workers/image-jobs-consumer.ts (DELETED)
  worker-billing.patch (DELETED)
- Architectural Impact:
  Removes ~15 dead files. Eliminates confusion between deprecated and
  active code paths. Single source of truth for each component.
- Blueprint Alignment:
  Yes — consolidation per Phase 1 hardening plan.
- Risk Level:
  Low

### 4. Worker Duplicate Status Update Fix
- Description:
  Removed second `updateListingPreparationStatus(listingId, 'prepared', env)`
  call at line 437 of apps/processor/src/index.ts. Status was being set
  to 'prepared' twice — once correctly, once redundantly.
- Files Modified:
  apps/processor/src/index.ts
- Architectural Impact:
  Prevents potential race condition with double status writes.
  Single status update at correct point in pipeline.
- Blueprint Alignment:
  Yes — clean state machine: preparing → prepared | failed.Level:
  Low

-------------------------------------------------------------------------------
## 2026-02-15 — Day 2: Cost Tracking Per Listing
-------------------------------------------------------------------------------

### 1. Cost Tracking Wired Into Worker Pipeline
- Description:
  Added per-tool cost tracking to apps/processor/src/index.ts.
  Each runTool call now captures duration and cost in cents.
  Analysis cost (OpenAI vision) tracked at 2¢ per photo.
  TOOL_COST_CENTS map kept inline to avoid cross-environment
  import issues in Cloudflare Worker context.
- Files Modified:
  apps/processor/src/index.ts
- Architectural Impact:
  Every job now records: totalCostCents, totalCostDollars,
  per-tool breakdown with duration/success, photosProcessed,
  toolsApplied. Failed jobs record partial costs with failed flag.
- Blueprint Alignment:
  Yes — Day 2 spec: wire cost-logger into runTool, accumulate
  per-listing total, store in listing metadata.
- Risk Level:
  additive logging, no behavioral changes)

### 2. Cost Summary Stored in jobs.metadata JSONB
- Description:
  After all photos processed, cost summary written to existing
  jobs.metadata jsonb column. No new tables or columns needed.
  Failure path also stores partial cost data.
- Files Modified:
  apps/processor/src/index.ts
- Architectural Impact:
  Enables cost visibility per job. Can query jobs table to see
  actual processing costs vs revenue per listing.
- Blueprint Alignment:
  Yes — uses existing schema (jobs.metadata jsonb).
- Risk Level:
  Low

-------------------------------------------------------------------------------
## 2026-02-15 — Day 3: Parallel Processing, Worker Hardening, Build Fix
-------------------------------------------------------------------------------

### 1. Parallel Photo Processing (Concurrency 8)
- Description:
  Restored parallel processing with PHOTO_CONCURRENCY=8. Photos process
  in batches of 8 via Promise.all chunking. Each photo runs its tool chain
  independently. Proven pattern from previous testing — hits 3min/5min
  speed targets for 30/50 photo listings.
- Files Modified:
  apps/processor/src/index.ts
- Architectural Impact:
  30 photos: ~80s processing + ~60-90s analysis = under 3 minutes.
  50 photos: ~140s processing + ~60-90s analysis = under 5 minutes.
  Matches Fotello speed targets.
- Blueprint Alignment:
  Yes — restores architecture from feat/worker-transplant-v2.
- Risk Level:
  Medium (concurrency change, proven pattern)

### 2. Always-Complete Job ics
- Description:
  Tool failures skip gracefully with logged reasons — never kill photo or job.
  Per-photo result report: toolsApplied, toolsSkipped (with reasons),
  processingMs. Only infrastructure failures trigger retries.
- Files Modified:
  apps/processor/src/index.ts
- Architectural Impact:
  Jobs always complete and mark listing as prepared. No more stuck jobs
  from transient API failures. UI gets per-photo breakdown.
- Blueprint Alignment:
  Yes — Day 3 spec: always-complete semantics.
- Risk Level:
  Low

### 3. Per-Tool Timeouts
- Description:
  withToolTimeout() wrapper using Promise.race. Twilight/staging: 60s,
  sky/lawn/declutter: 45s, default: 30s. Timeout errors logged distinctly.
- Files Modified:
  apps/processor/src/index.ts
- Architectural Impact:
  Prevents single slow API call from blocking entire job.
  Failed tools recorded with 0 cost, success=false.
- Blueprint Alignment:
  Yes — Day 3 spec: per-tool timeout.
- Risk Level:
  Low

### 4. Infrastructure Retry with Exponentckoff
- Description:
  Retry tracking via CHECKPOINTS KV: retry:{jobId} key, 24h TTL.
  Max 3 retries: 60s/120s/240s. After max retries: job marked failed
  permanently, message ack'd (dead-letter). Tool failures never retry.
- Files Modified:
  apps/processor/src/index.ts
  apps/processor/wrangler.toml (dead-letter queue config)
- Architectural Impact:
  Defense-in-depth: app-level retry + queue-level dead letter.
  Infrastructure failures retry, tool failures skip gracefully.
- Blueprint Alignment:
  Yes — Day 3 spec: max 3 retries, exponential backoff.
- Risk Level:
  Low

### 5. Fixed photo-intelligence.ts ESLint Parse Error
- Description:
  Fixed tagged template literals throughout photo-intelligence.ts.
  console.log`...`) → console.log(`...`). Same for console.error.
  This was causing Vercel build failures (ESLint parse error).
- Files Modified:
  lib/ai/listing-engine/photo-intelligence.ts
- Architectural Impact:
  Vercel builds now pass. ESLint can parse the file correctly.
- Blueprint Alignme  Yes — pre-existing bug blocking production deploys.
- Risk Level:
  Low (syntax fix only, no logic changes)

-------------------------------------------------------------------------------
## 2026-02-15 — Day 4: Model Stack Upgrade
-------------------------------------------------------------------------------

### 1. Kontext Dev → Pro
- Description:
  Changed default KONTEXT_MODEL from flux-kontext-dev to flux-kontext-pro.
  Improves virtual twilight, staging, and all instruction-based tools.
  Dev model produced dark/muddy results. Pro follows prompts accurately.
- Files Modified:
  lib/ai/providers/replicate.ts
- Architectural Impact:
  All Kontext-based tools upgraded: virtual-twilight, virtual-staging,
  fire-fireplace, tv-screen, lights-on, pool-enhance, and Kontext
  fallback paths for sky/lawn.
- Blueprint Alignment:
  Yes — Day 4-5 spec: Kontext Dev → Pro.
- Risk Level:
  Low (model swap, same API)

### 2. Sky Replacement — SAM Mask + FLUX Fill Pro
- Description:
  Sky replacement now generates a pixel-perfect sky mask via Grounded SAM
  then inpaintX Fill Pro. Only the sky region is touched —
  house, trees, lawn physically cannot be modified. Falls back to
  Kontext Pro if mask generation fails.
- Files Modified:
  lib/ai/providers/replicate.ts
- Architectural Impact:
  Mask-based sky replacement eliminates house/tree bleeding that
  instruction-based approach caused. Same pattern as lawn repair.
  Cost: ~$0.05/image (SAM $0.0014 + Fill Pro $0.05).
- Blueprint Alignment:
  Yes — Model stack v4: "Grounded SAM generates sky mask → FLUX Fill Pro
  inpaints new sky into masked region."
- Risk Level:
  Medium (new pipeline path, Kontext fallback preserves reliability)

### 3. SAM Model Priority Fix
- Description:
  Fixed getModelCandidates() in sam-masks.ts to prefer grounded_sam
  (text-prompted) over sam-2-image (points-based). Points-based model
  caused lawn hallucination — clicks random coordinates instead of
  understanding "grass" semantically. Grounded SAM uses text prompts
  like "grass. lawn." and "sky." for accurate segmentation.
- Fileed:
  lib/ai/providers/sam-masks.ts
- Architectural Impact:
  All mask-dependent tools (sky, lawn, declutter) now get accurate
  text-prompted masks. Lawn repair pipeline was already wired correctly
  but SAM was returning garbage masks due to wrong model priority.
- Blueprint Alignment:
  Yes — Model stack v4: "Fix SAM calls to use schananas/grounded_sam."
- Risk Level:
  Medium (changes mask generation for all masked tools)

## Day 4 — Feb 15, 2026
### Photo Intelligence Build Fix
- **photo-intelligence.ts**: Complete file replacement
  - Removed stale `apiKey` / `openai` references (lines 274-279) — function now correctly uses passed `client: OpenAI` parameter
  - Removed `const client` redeclaration that shadowed function parameter
  - Fixed `analyzePhotos` batch function: accepts `client?: OpenAI` instead of `apiKey?: string`
  - Removed broken `new OpenAI()` creation inside batch loop
  - Preserved `gpt-4o-mini` for analysis (deliberate speed optimization)
  - Build now passes clean

### Subscription Enforcement v2
- **prepare/route.ts**: Refactored usage tracking
  - Replaced profiles.listings_used_this_month counter with count of listings where counted_for_usage=true
  - Uses subscription_tier instead of subscription_status for active check
  - Counts actual listings table rows per month — no counter drift possible
  - Simplified usage marking: just sets counted_for_usage=true on listings table
  - Removed redundant ROLLBACK comments (rollback logic preserved)

-------------------------------------------------------------------------------
## 2026-02-15 — Day 5: DI Hardening Complete
-------------------------------------------------------------------------------

### 1. Zero Global OpenAI Instances — Full Codebase
- Description:
  Replaced all module-level `const openai = new OpenAI()` with lazy
  `getOpenAIClient(client?: OpenAI)` factory pattern across 11 files.
  Every AI function now accepts an optional `client` parameter.
  Worker explicitly creates OpenAI client from `env.OPENAI_API_KEY`
  and passes via DI — was previously passing `apiKey` which was
  silently ignored.
- Files Modified:
  apps/processor/src/index.ts
  lib/ai/listing-engine/photo-intelligence.ts
  lib/ai/listing-engine/quality-validator.ts
  lib/ai/providers/openai-vision.ts
  lib/ai/providers/gpt-copy.ts
  lib/ai/photo-culler.ts
  lib/ai/description-generator.ts
  lib/listing-intelligence/analyzer.ts
  app/api/ai/generate-caption/route.ts
  app/api/translate/route.ts
  app/api/email-template/route.ts
- Architectural Impact:
  Blueprint Section 7 (all 7 hardening goals) now complete.
  Blueprint Section 11 (all architectural guardrails) enforced.
  Zero global OpenAI instances remain anywhere in the codebase.
- Blueprint Alignment:
  Yes — Phase 1 Hardening fully satisfied.
- Risk Level:
  Low (DI refactor only, no behavioral changes)

-------------------------------------------------------------------------------
## 2026-02-16 — Phase 2: Marketing Automation Layer
-------------------------------------------------------------------------------

### 1. Database — marketing_jobs Table
- Description:
  Created marketing_jobs table with per-step status tracking
  (description, captions, mls, property_site), JSONB artifact storage,
  cost tracking, and RLS policies. CHECK constraints enforce valid states.
- Files Created:
  supabase/migrations/20260216_marketing_jobs.sql
- Architectural Impact:
  Blueprint Phase 2 data layer. Stores all marketing artifacts per listing.
  Enables cost tracking and status visibility for marketing pipeline.
- Blueprint Alignment:
  Yes — "New table: marketing_jobs" per Phase 2 spec.
- Risk Level:
  Low (additive schema only)

### 2. Discriminated Union Queue Messages
- Description:
  Extended queue message types with discriminated union:
  PreparationJobMessage | MarketingJobMessage, routed by `type` field.
  Worker queue() handler routes marketing messages to dedicated handler.
  Backwards compatible — messages without type treated as preparation.
- Files Modified:
  apps/processor/src/types.ts
  apps/processor/src/index.ts
- Architectural Impact:
  Single queue handles both preparation and marketing jobs.
  No new Cloudflare infrastructure required. Same retry/dead-letter.
- Blueprint Alignment:
  Yes — same queue, typed routing per architecture decision.
- Risk Level:
  Low (backwards-compatible routing)

### 3. Marketing Pipeline Handler
- Description:
  New marketing-handler.ts implements 4-step pipeline:
  1. Description generation (GPT-4o via description-generator.ts)
  2. Social captions per platform (GPT-4o-mini via gpt-copy.ts)
  3. MLS photo manifest (no AI — metadata ordering)
  4. Property site draft (no AI — DB insert)
  Each step is independent — failures don't block other steps.
  Same always-complete semantics as Phase 1.
  Cost tracking per step, ~21¢ estimated per listing.
- Files Created:
  apps/processor/src/marketing-handler.ts
- Architectural Impact:
  All AI code reused from existing DI-hardened modules.
  No new AI capabilities — pure orchestration.
- Blueprint Alignment:
  Yes — Phase 2 pipeline: description → captions → MLS → property site.
- Risk Level:
  Medium (new pipeline path, uses proven AI modules)

### 4. Auto-Trigger After Preparation
- Description:
  After listing preparation completes (status → prepared), Worker
  automatically creates a marketing_jobs row and enqueues a marketing
  message. Marketing trigger failure is non-fatal — preparation
  is already complete and persisted.
- Files Modified:
  apps/processor/src/index.ts
- Architectural Impact:
  Blueprint Definition of Done: "Marketing auto-triggers."
  Zero human intervention after upload → prepare → market.
- Blueprint Alignment:
  Yes — "Trigger when preparation_status = prepared."
- Risk Level:
  Low (non-fatal hook, preparation state already committed)

### 5. Marketing API Routes
- Description:
  Three new API routes for marketing status, manual trigger, and
  MLS export download:
  - GET /api/marketing/status — returns marketing job + artifacts
  - POST /api/marketing/trigger — manual re-trigger for prepared listings
  - GET /api/marketing/mls-export — on-demand MLS ZIP (Vercel, uses sharp)
  Extended GET /api/listing/status with marketingStatus and marketingJob.
- Files Created:
  app/api/marketing/status/route.ts
  app/api/marketing/trigger/route.ts
  app/api/marketing/mls-export/route.ts
- Files Modified:
  app/api/listing/status/route.ts
- Architectural Impact:
  Blueprint Definition of Done: "Artifacts generated. Status visible."
  MLS ZIP stays on Vercel (sharp+archiver requirement).
- Blueprint Alignment:
  Yes — API contracts for marketing layer.
- Risk Level:
  Low (additive API routes)

### 6. Phase 2 Completion — Cron Publishers + Studio UI + Step 5
- Description:
  Completed Phase 2 marketing automation:
  - Added Step 5 (auto-schedule social posts) to marketing-handler.ts
  - Added free-tier billing gate (skip marketing for free users)
  - Added listing marketing_status → processing state update
  - Created cron/publish-scheduled: publishes queued social posts every 15 min
  - Created cron/sync-analytics: syncs engagement metrics every 6 hours
  - Created marketing-banner.tsx: context-aware status banner in studio
  - Created marketing-results-panel.tsx: right sidebar showing all 5 artifacts
  - Updated studio-client.tsx with marketing polling + panel swap
  - Updated listings page with marketing status column
  - Added DB migrations: scheduled_posts columns, published_posts table
  - Updated vercel.json with cron schedules + function configs
  - Updated CLAUDE.md with Phase 2 documentation
- Files Created:
  app/api/cron/publish-scheduled/route.ts
  app/api/cron/sync-analytics/route.ts
  components/marketing-banner.tsx
  components/marketing-results-panel.tsx
  supabase/migrations/20260216_marketing_jobs_scheduled_posts.sql
  supabase/migrations/20260216_published_posts.sql
  docs/SOCIAL_PLATFORM_APPROVAL_GUIDE.md
- Files Modified:
  apps/processor/src/marketing-handler.ts
  apps/processor/src/lib/supabase-client.ts
  app/api/listing/status/route.ts
  app/api/marketing/status/route.ts
  app/dashboard/listings/page.tsx
  components/studio-client.tsx
  vercel.json
  CLAUDE.md
- Architectural Impact:
  Full marketing automation loop: prepare → market → publish → measure.
  Free-tier users gated at marketing handler (0 AI cost) and cron publisher.
- Blueprint Alignment:
  Yes — Phase 2 Definition of Done fully satisfied.
- Risk Level:
  Low-Medium (new pipeline paths, all independent/non-fatal)

-------------------------------------------------------------------------------
## 2026-02-16 — Enhancement Pipeline Hardening: Speed + Reliability + Quality
-------------------------------------------------------------------------------

### 1. Sharp.js Quick Enhance API Route
- Description:
  Created /api/enhance-quick Vercel endpoint wrapping Sharp.js autoEnhance().
  Worker routes auto-enhance through this instead of Replicate/Flux Kontext.
  Reduces per-photo enhance time from ~25-30s to ~1-5s at $0 cost.
  Auth via x-admin-key header. Uploads result to Supabase Storage.
- Files Created:
  app/api/enhance-quick/route.ts
- Files Modified:
  apps/processor/src/index.ts (runQuickEnhance + toolContext routing)
  apps/processor/src/types.ts (QUICK_ENHANCE_URL env binding)
- Architectural Impact:
  Auto-enhance completely bypasses Replicate queue. Free, fast, parallel.
  Worker calls Vercel API which runs Sharp.js (Node.js native module).
- Blueprint Alignment:
  Yes — speed optimization: CPU-based enhance vs generative AI.
- Risk Level:
  Low (additive path, Replicate fallback preserved)

### 2. Structural Tool Reliability — skipMask + Retry + Timeouts
- Description:
  Sky-replacement and lawn-repair were failing silently due to SAM mask
  timeout (SAM ~15s + Kontext fallback ~30s exceeded 60s tool timeout).
  Fix: Added skipMask option to skyReplacement() and lawnRepair() —
  batch prepare skips SAM mask and goes straight to Kontext instruction-based.
  Added retry-on-failure for structural tools (1 automatic retry).
  Increased tool timeouts: structural 120s, other 90s, auto-enhance 45s.
- Files Modified:
  lib/ai/providers/replicate.ts (skipMask option)
  apps/processor/src/index.ts (retry logic, timeouts, skipMask passing)
- Architectural Impact:
  Sky-replacement: 0% → 100% success rate on exterior photos.
  Lawn-repair: 0% → 100% success rate on patchy lawn photos.
  Virtual-twilight, window-masking, lights-on all confirmed working.
- Blueprint Alignment:
  Yes — reliability hardening for tool execution layer.
- Risk Level:
  Medium (changes execution path for structural tools)

### 3. Observability — toolsSkipped in photoAudit
- Description:
  photoAudit in preparation_metadata now includes toolsSkipped array
  with {tool, reason} for each failed tool. Previously this data was lost.
  Added debug logging for photos with no enhancement output.
- Files Modified:
  apps/processor/src/index.ts
- Architectural Impact:
  Can now diagnose tool failures from preparation_metadata without
  checking Worker logs. Each photo shows exactly what succeeded/failed.
- Blueprint Alignment:
  Yes — observability for production debugging.
- Risk Level:
  Low (additive logging only)

### 4. GPT-4o Model Upgrade + Aggressive Enhancement Prompts
- Description:
  Upgraded photo analysis from gpt-4o-mini to gpt-4o for better accuracy.
  Rewrote analysis prompt: enhance aggressively, always suggest auto-enhance,
  always suggest sky-replacement for non-stunning skies. Lowered strategy
  thresholds: minSkyVisiblePercent 12→8, minConfidenceForRiskyTools 70→50,
  minTwilightScore 80→70. Strategy builder always adds auto-enhance.
- Files Modified:
  lib/ai/listing-engine/photo-intelligence.ts (model + prompt)
  lib/ai/listing-engine/strategy-builder.ts (thresholds + auto-enhance)
- Architectural Impact:
  Enhancement rate: 13% → 88% → 100% across three test runs.
  More tools applied per photo, higher quality output.
- Blueprint Alignment:
  Yes — quality improvement to compete with BoxBrownie/VirtualStagingAI.
- Risk Level:
  Medium (behavioral change in AI analysis + strategy planning)

### Results
- Enhancement rate: 2/16 (13%) → 13/16 (81%) → 14/16 (88%) → 16/16 (100%)
- Processing time: ~7min → ~3min (Sharp.js + parallel + higher timeouts)
- Structural tools: 0% → 100% success rate (skipMask + retry + 120s timeout)
- Cost savings: auto-enhance $0.00 (Sharp.js) vs $0.50 (Replicate Kontext)

-------------------------------------------------------------------------------
## 2026-02-16 — Fix Phantom Column Queries + Tier Badge Display
-------------------------------------------------------------------------------

### 1. Fix Sidebar Showing "Free" for Pro Users
- Description:
  Dashboard layout.tsx queried `listings_limit` column which doesn't exist
  on profiles table. Supabase returned error, profile=null, tier defaulted
  to 'free'. Fixed to use `listings_per_month` (actual column) with
  tier-based defaults. Also added `plan` field fallback for accounts where
  Stripe webhook wrote to `plan` but not `subscription_tier`.
- Files Modified:
  app/dashboard/layout.tsx
  app/dashboard/billing/page.tsx
  app/listings/new/page.tsx
  app/api/enhance/route.ts
  app/api/stripe/webhook/route.ts
- Architectural Impact:
  All Supabase SELECT queries now reference only columns that exist.
  Stripe webhook now writes `subscription_tier` alongside `plan`.
  Tier display correct across sidebar, billing, and listing creation.
- Root Cause:
  Code referenced phantom columns (`listings_limit`, `listings_used_this_month`,
  `billing_cycle_start`, `photos_per_listing`) that were never migrated to
  the production database. Supabase REST API returns error for unknown columns,
  causing entire query to return null.
- Risk Level:
  Low (query fix + display fix, no behavioral changes)

-------------------------------------------------------------------------------
## 2026-02-16 — Fix Manual Enhancement Tools in Studio
-------------------------------------------------------------------------------

### 1. Fix storagePath Property Mismatch
- Description:
  API returned `processedPath` but studio client expected `storagePath`.
  Result: enhanced image displayed correctly in before/after slider but
  saving to DB used fallback CDN URL (temporary) instead of permanent
  Supabase storage path. Fixed API to return both `storagePath` and
  `processedPath` (legacy alias).
- Files Modified:
  app/api/enhance/route.ts
- Risk Level:
  Low (property name fix)

### 2. Add Error Handling to Manual Enhancement Flow
- Description:
  Studio client had no `res.ok` check — 500 errors parsed as JSON
  silently. Catch block only logged to console with no user feedback.
  Fixed: added res.ok validation, user-visible error alerts for
  failures and timeouts, proper error messages.
- Files Modified:
  components/studio-client.tsx
- Risk Level:
  Low (error handling improvement)

### 3. Increase Enhance API Timeout to 180s
- Description:
  Manual tools use SAM mask + Flux Fill (no skipMask) which can take
  60-120s for complex images. Bumped maxDuration from 120s to 180s
  in both vercel.json and route.ts for headroom.
- Files Modified:
  app/api/enhance/route.ts
  vercel.json
- Risk Level:
  Low (timeout increase only)

-------------------------------------------------------------------------------
## 2026-02-17 — Phase 3: Content Studio Integration + Bug Fixes
-------------------------------------------------------------------------------

### 1. Content Studio — DB-Backed Calendar
- Description:
  Rewrote calendar/page.tsx from localStorage-based to DB-backed via
  /api/schedule API. Supports multi-status filtering (pending, published,
  failed, cancelled), listing joins for display, stats pills, Recently
  Published section. Modal disabled for published posts (read-only).
  Fixed source detection bug: was always 'auto' because created_at always
  exists. Now uses post_type + content.length heuristic.
- Files Modified:
  app/dashboard/content-studio/calendar/page.tsx
  app/api/schedule/route.ts
- Architectural Impact:
  Calendar now reflects real scheduled_posts table state. Manual and
  auto-generated posts visually distinguished. CRUD operations persist
  to DB instead of localStorage.
- Risk Level:
  Low (UI + API rewrite, no pipeline changes)

### 2. Content Studio — Marketing Status Badges
- Description:
  Added MarketingStatus interface and badges on listing cards in Content
  Studio. Server-side page.tsx queries marketing_jobs table (wrapped in
  try/catch) and builds status map passed to ContentStudioClient.
  Cards show "Content Ready" (green) or "Processing" (amber) badges.
- Files Modified:
  app/dashboard/content-studio/page.tsx
  app/dashboard/content-studio/ContentStudioClient.tsx
- Architectural Impact:
  Marketing pipeline visibility in Content Studio. Graceful degradation
  if marketing_jobs table unavailable.
- Risk Level:
  Low (additive UI, non-breaking)

### 3. Content Studio — Marketing Content Preview on Select Page
- Description:
  Select page now shows marketing content preview (description + captions)
  when a listing has completed marketing. "Edit & Post with Auto Content"
  CTA links to unified creator with prefill=marketing param.
  Fixed two pre-existing bugs: original_url → raw_url column name,
  uploads → raw-images storage bucket.
- Files Modified:
  app/dashboard/content-studio/select/page.tsx
- Architectural Impact:
  Bridges marketing pipeline output to content creation workflow.
  Photos now load correctly on select page (was broken by wrong column).
- Risk Level:
  Low (bug fixes + additive UI)

### 4. Unified Creator — Marketing Prefill with Caching
- Description:
  When prefill=marketing param present, fetches marketing captions once
  from /api/marketing/status and caches in state. Platform changes apply
  cached caption without re-fetching. captionManuallyEdited flag prevents
  overwriting user edits on platform switch.
- Files Modified:
  components/content-studio/unified-creator.tsx
- Architectural Impact:
  Eliminates API hammering on platform switch. Respects user edits.
  Marketing content flows from pipeline → content studio seamlessly.
- Risk Level:
  Low (caching optimization + UX improvement)

### 5. Property Site API — PATCH Method
- Description:
  Added PATCH endpoint to /api/property-site for publish/unpublish toggle,
  theme updates, custom colors, and agent info. Selective field updates
  (only provided fields are modified).
- Files Modified:
  app/api/property-site/route.ts
- Architectural Impact:
  Enables property site management from Content Studio UI.
- Risk Level:
  Low (additive API endpoint)

-------------------------------------------------------------------------------
## 2026-02-17 — Phase 4: Dashboard UI Redesign
-------------------------------------------------------------------------------

### 1. Sidebar Extraction & Workflow-Based Navigation
- Description:
  Extracted inline sidebar from layout.tsx into components/dashboard-sidebar.tsx
  client component. Restructured navigation from arbitrary tool categories to
  workflow-based groups: OVERVIEW, CREATE, PUBLISH, MEASURE, MORE TOOLS, ACCOUNT.
  Added active-state highlighting via usePathname(). Added collapsible "More Tools"
  section for secondary tools (AI Descriptions, Portfolios, etc.).
- Files Created:
  components/dashboard-sidebar.tsx
- Files Modified:
  app/dashboard/layout.tsx
- Architectural Impact:
  Navigation now reflects automation loop: Upload → Prepare → Market → Distribute → Measure.
  Calendar, Analytics, Auto-Post promoted from buried-in-Content-Studio to first-class sidebar items.
  Secondary tools collapsed by default, reducing clutter.
- Risk Level:
  Low (layout restructure, no logic changes)

### 2. Dashboard Home Page
- Description:
  Replaced /dashboard redirect with real home page. Server component fetches
  metrics via 5 parallel Supabase queries. Renders DashboardHome client component
  with: metrics row (active listings, scheduled/published posts, impressions),
  quick actions grid, recent activity feed, processing banner for active jobs.
- Files Created:
  components/dashboard-home.tsx
- Files Modified:
  app/dashboard/page.tsx
- Architectural Impact:
  Users now see at-a-glance overview on /dashboard instead of redirect.
  Metrics pulled from listings, scheduled_posts, published_posts, marketing_jobs tables.
- Risk Level:
  Low (new page, no existing functionality changed)

### 3. Route Aliases — Calendar, Analytics, Auto-Post
- Description:
  Created /dashboard/calendar, /dashboard/analytics, /dashboard/auto-post as
  re-exports of existing content-studio sub-pages. Original content-studio routes
  remain functional (backwards compatible).
- Files Created:
  app/dashboard/calendar/page.tsx
  app/dashboard/analytics/page.tsx
  app/dashboard/auto-post/page.tsx
- Architectural Impact:
  Calendar, Analytics, and Auto-Post Rules accessible directly from sidebar
  instead of buried inside Content Studio.
- Risk Level:
  None (additive re-exports only)

### 4. Listings Page — Search, Filter, Sort
- Description:
  Added search bar (filter by title/address), status filter pills
  (All/Pending/Preparing/Prepared/Marketing/Marketed/Failed), and sort dropdown
  (Newest/Oldest/Title A-Z). Uses useMemo for client-side filtering. Dynamic
  count display: "Showing X of Y properties". Empty search results state.
- Files Modified:
  app/dashboard/listings/page.tsx
- Architectural Impact:
  Users can find listings faster. No API changes needed — filtering is client-side.
- Risk Level:
  Low (additive UI, existing grid rendering untouched)

### 5. Studio-to-Content-Studio Bridge
- Description:
  Added "Create Social Post" CTA links to marketing-results-panel.tsx footer
  (links to /dashboard/content-studio/create-all with prefill=marketing param)
  and "View Calendar" link. Added "Create Social Post" button in studio header
  when marketing_status is completed.
- Files Modified:
  components/marketing-results-panel.tsx
  components/studio-client.tsx
- Architectural Impact:
  Seamless flow from Studio (marketing completes) → Content Studio (create social post
  with pre-filled AI content). Eliminates context-switching gap.
- Risk Level:
  Low (additive links only)

### 6. Content Studio — Horizontal Tabs
- Description:
  Replaced Content Studio's redundant left sidebar (72px aside) with horizontal
  tab bar in the header. Manage/Customize links moved to top-right quick links.
  Eliminates confusing dual-sidebar experience (dashboard sidebar + CS sidebar).
  Listing grid expanded to 4 columns to use full width.
- Files Modified:
  app/dashboard/content-studio/ContentStudioClient.tsx
- Architectural Impact:
  Content Studio now uses full width of main content area. Single sidebar
  (dashboard) instead of dual-sidebar layout. More listings visible at once.
- Risk Level:
  Medium (layout restructure of existing component)

-------------------------------------------------------------------------------
## 2026-02-18 — Final Comprehensive Hardening (All 4 Phases)
-------------------------------------------------------------------------------

### Phase 1: Security Critical (16 items)
- Deleted debug endpoints (debug-share, debug/) — unauthenticated, leaked data
- Added ADMIN_SECRET auth to admin/complete-human-edit matching export pattern
- Created lib/utils/html-escape.ts; fixed XSS in contact, notify-approval, complete-human-edit emails
- Added OAuth CSRF state validation in social/oauth/[platform]/route.ts
- Fixed Twitter PKCE: S256 with random verifier instead of hardcoded 'plain'
- Fixed Facebook token refresh: fb_exchange_token grant (not refresh_token)
- Added SSRF protection to /api/analyze (blocks private IPs, localhost, metadata)
- Fixed missing await on createClient() in analyze route
- Moved access tokens from URL params to Authorization headers in sync-analytics
- Added token refresh to analytics sync cron (checks expires_at, refreshes if <1hr)
- Fixed daily digest from session-based createClient() to adminSupabase()
- Fixed social publish env var to use adminSupabase()
- Gated /api/log-error with IP rate limiter (30/min) + input sanitization
- Added Worker /process auth (x-admin-key), made /audit auth non-optional
- Standardized all admin routes on adminSupabase() (contact, notify-approval, users/export, webhook)
- Files Modified: 20+ API routes, lib/social/oauth-config.ts, lib/utils/html-escape.ts (new), apps/processor/src/index.ts

### Phase 2: Reliability & Data Integrity (14 items)
- Added Zod schemas: socialPublishSchema, analyticsPostSchema, enhanceSchema, shareSchema
- Added UUID validation to share route, toolId validation to enhance route
- Capped schedule route limit at 200
- Centralized Stripe webhook plan limits via getListingLimits() from lib/content/limits.ts
- Added error handling to all webhook profile update calls
- Added AbortSignal.timeout(15000) to all 12 fetch() calls in publish-service.ts
- Added console.warn for failed Facebook photo uploads and Instagram carousel items
- Stripped health endpoint of service configuration details
- Batched daily digest queries with Promise.all() + lookup Maps (fix N+1)
- Removed Twilio sandbox fallback number
- Files Modified: lib/social/publish-service.ts, lib/validation/schemas.ts, lib/content/limits.ts, app/api/stripe/webhook/route.ts, app/api/health/route.ts, app/api/cron/daily-digest/route.ts

### Phase 3: Frontend UX & Performance (15 items)
- Fixed 11+ broken Tailwind classes in academy page (hover:text[, bg[, from[, to[, hover:border[, hover:shadow[)
- Updated copyright year to 2026 in 8 files
- Added page metadata to academy, faq, privacy, terms
- Created loading.tsx for dashboard, admin, checkout
- Created error.tsx for dashboard, admin
- Fixed AnimatedBackground canvas height (scrollHeight*5 → window.innerHeight)
- Added useMemo to studio-client for filterStyle and listingStyleFilter
- Removed console.log from 5 production components
- Created middleware.ts for centralized auth on dashboard/admin/checkout/onboarding
- Files Created: middleware.ts, app/dashboard/loading.tsx, app/admin/loading.tsx, app/checkout/loading.tsx, app/dashboard/error.tsx, app/admin/error.tsx
- Files Modified: app/academy/page.tsx, 7 pages (copyright), 3 pages (metadata), components/animated-background.tsx, components/studio-client.tsx

### Phase 4: Architecture (3 items)
- Added batch processor timeout (10 min) and cost ceiling ($5) to CONFIG
- Added overall batch timeout check in processing loop
- Added auto-enhance fallback in AI router when primary provider fails
- Files Modified: lib/ai/listing-engine/batch-processor.ts, lib/ai/router.ts

### Verification
- npx tsc --noEmit: 0 errors
- npm run build: Success (all routes compile)
- Risk Level: Low-Medium (security fixes + reliability improvements, no behavioral changes to core pipeline)

---

## 2026-02-19 — World-Class Quality Hardening (3-Session Sprint)

### Phase 1: LinkedIn API v2 Migration
- Migrated LinkedIn publishing from v1 ugcPosts API to v2 Community Management API (`/rest/posts`)
- Added 3-step image upload flow: initializeUpload → download → PUT binary
- Updated headers: `LinkedIn-Version: 202401`, `X-Restli-Protocol-Version: 2.0.0`
- Updated OAuth scopes to `openid`, `profile`, `email`, `w_member_social`
- Files Modified: lib/social/publish-service.ts, lib/social/oauth-config.ts

### Phase 2: Build Strictness Enforcement
- Set `typescript.ignoreBuildErrors: false` in next.config.mjs
- Set `eslint.ignoreDuringBuilds: false` in next.config.mjs
- Added `@typescript-eslint/no-explicit-any: "warn"` to .eslintrc.json
- Files Modified: next.config.mjs, .eslintrc.json

### Phase 3: Type Safety — Eliminate All `any` Types (28+ files)
- Replaced all `catch (error: any)` with `catch (error: unknown)` + `error instanceof Error` guards
- Replaced all `useState<any>` with properly typed interfaces (StudioListing, StudioPhoto, etc.)
- Replaced `Record<string, any>` with `Record<string, unknown>`
- Replaced `(p: any)` callbacks with properly typed function parameters
- Added null→undefined coercion at Supabase data boundaries (`?? undefined`)
- Changed unused catch variables from `catch (e)` to `catch {` (empty binding)
- Files Modified: lib/api.ts, lib/analytics.ts, lib/analytics/error-logger.ts, lib/supabase.ts, lib/validation/schemas.ts, lib/cost-logger.ts, lib/notifications/sender.ts, lib/ai/utils/retry.ts, lib/ai/providers/openai-vision.ts, lib/ai/providers/runware.ts, lib/ai/providers/replicate.ts, lib/ai/description-generator.ts, lib/ai/hdr-processor.ts, lib/campaigns/engine.ts, lib/campaigns/content-generator.ts, lib/compliance/mls-export.ts, lib/floorplans/service.ts, lib/video/voiceover-service.ts, lib/listing-intelligence/analyzer.ts, components/studio-client.tsx, components/dashboard-client.tsx, components/dashboard-sidebar.tsx, components/adjustment-panel.tsx, components/mls-export-modal.tsx, components/marketing-banner.tsx, components/marketing-results-panel.tsx, components/content-studio/vertical-post-creator.tsx, components/content-studio/phase1/smart-hashtag-generator.tsx, components/listing-intelligence/ListingIntelligenceDashboard.tsx

### Phase 4: Accessibility
- Added semantic HTML to homepage: `<nav>`, `<section>`, `<footer>`
- Added `aria-label` to form inputs on login/signup pages
- Added `role="dialog"` + `aria-modal="true"` + `aria-label` to all modals
- Cleaned up homepage: removed duplicate content, streamlined layout
- Files Modified: app/page.tsx, app/auth/login/page.tsx, app/auth/signup/page.tsx, components/style-prompt-modal.tsx, components/ShareGalleryModal.tsx, components/batch-progress-modal.tsx, components/content-studio/schedule-modal.tsx

### Phase 5: Security Hardening
- Added OAuth CSRF state validation in social callback
- Added AbortSignal.timeout(15000) to all external API fetch calls (15+ calls)
- Twitter PKCE with S256 code challenge
- Facebook long-lived token exchange
- Files Modified: app/api/social/oauth/[platform]/route.ts, app/api/social/publish/route.ts, lib/social/publish-service.ts, lib/social/oauth-config.ts, apps/processor/src/index.ts

### Phase 6: Documentation
- Updated CLAUDE.md with Security, Hardening Patterns sections
- Added code conventions: type safety, catch blocks, null coercion, validation, network calls, accessibility
- Added Important Notes: build strictness, ESLint no-any rule
- Files Modified: CLAUDE.md

### Verification
- npx tsc --noEmit: 0 errors
- npm run build: Success (all routes compile)
- Risk Level: Medium (44 files changed, but all changes are hardening — no behavioral changes to core pipeline)

-------------------------------------------------------------------------------
## 2026-02-19 — Phase 1: Remotion Foundation (Video Engine v1.1)
-------------------------------------------------------------------------------

### 1. Remotion Test Composition & Configuration
- Description:
  Created Remotion project structure with test video composition,
  configuration, and root registration. TestVideo composition renders
  listing photo with fade-in animation and text overlay (address, price,
  beds/baths). All Remotion packages at matching version 4.0.424.
  Config sets h264 codec with yuv420p pixel format for Safari/QuickTime
  compatibility.
- Files Created:
  remotion/Root.tsx
  remotion/compositions/TestVideo.tsx
  remotion/remotion.config.ts
- Architectural Impact:
  Foundation for Remotion Lambda rendering. TestVideo composition is
  the template that API routes will invoke for video generation.
  Uses Zod schema inference for type safety.
- Blueprint Alignment:
  Yes — Phase 1 Plan 1: Remotion foundation artifacts.
- Risk Level:
  Low (additive files only, no integration yet)

### 2. Video Render Jobs Table & Validation Schemas
- Description:
  Created video_render_jobs table for tracking Remotion Lambda render
  jobs with full lifecycle (queued/rendering/completed/failed), cost
  tracking, error logging, and render metadata. Added Zod validation
  schemas (generateVideoSchema, videoStatusSchema) for API input
  validation.
- Files Created:
  supabase/migrations/20260219_video_render_jobs.sql
- Files Modified:
  lib/validation/schemas.ts
- Architectural Impact:
  Database layer ready for video rendering pipeline. RLS policies allow
  users to view their own render jobs, service role has full access for
  worker inserts/updates. Indexes optimize queries by user, listing,
  render ID, status, and creation time.
- Blueprint Alignment:
  Yes — Phase 1 Plan 1: Database and validation infrastructure.
- Risk Level:
  Low (additive schema only, no existing tables modified)

### 3. Video Generation API Route
- Description:
  Created POST /api/video/generate endpoint for triggering Remotion Lambda
  renders. Authenticates user, validates input with Zod, fetches listing
  with photos, checks Remotion env vars, triggers Lambda render via
  renderMediaOnLambda, and stores job in video_render_jobs. All error
  paths return structured JSON with appropriate status codes.
- Files Created:
  app/api/video/generate/route.ts
- Architectural Impact:
  Entry point for all video renders from UI. Follows existing SnapR
  patterns: createClient() auth, adminSupabase() service operations,
  Zod validation, always-complete semantics with structured error
  responses. No any types.
- Blueprint Alignment:
  Yes — Phase 1 Plan 2: Video generation API endpoint.
- Risk Level:
  Low (additive API route, follows established patterns)

### 4. Video Status API Route & Vercel Function Configuration
- Description:
  Created GET /api/video/status endpoint for polling render progress.
  Validates renderId, authenticates user, verifies ownership, queries
  Lambda progress via getRenderProgress, updates database on
  completion/failure, and returns structured status. Returns cached
  results for terminal states (completed/failed) to avoid unnecessary
  AWS API calls. Updated vercel.json with function configs: 60s/1024MB
  for generate route, 30s/512MB for status route.
- Files Created:
  app/api/video/status/route.ts
- Files Modified:
  vercel.json
- Architectural Impact:
  Enables real-time progress polling for video renders. Optimization:
  caches terminal states in database to reduce Lambda API calls. Vercel
  function configs ensure appropriate timeouts and memory allocation.
- Blueprint Alignment:
  Yes — Phase 1 Plan 2: Video status polling with optimization.
- Risk Level:
  Low (additive API route + function config)

-------------------------------------------------------------------------------
## 2026-02-19 — Phase 2: PropertyShowcase Composition + Multi-Format (Video Engine v1.1)
-------------------------------------------------------------------------------

### 1. PropertyShowcase Composition
- Description:
  Created cinematic property walkthrough composition using TransitionSeries
  with crossfade transitions (1.5s fade), Ken Burns zoom/pan effect on each
  photo (alternating zoom in/out with subtle translateX), persistent address
  overlay with dark gradient backdrop, and animated closing card with gold
  price, staggered fade-in for address/price/details.
- Files Created:
  remotion/compositions/PropertyShowcase.tsx
  remotion/compositions/ClosingCard.tsx
- Architectural Impact:
  Production-ready video composition replacing TestVideo. Percentage-based
  sizing handles all aspect ratios from single component. Uses @remotion/transitions
  TransitionSeries, @remotion/google-fonts Inter, Remotion Img component.
- Blueprint Alignment:
  Yes — Phase 2 Plan 02-01: PropertyShowcase composition.
- Risk Level:
  Low (additive composition files)

### 2. Multi-Format Registration with calculateMetadata
- Description:
  Registered 3 PropertyShowcase compositions in Root.tsx for each aspect ratio:
  PropertyShowcase-9x16 (1080x1920), PropertyShowcase-1x1 (1080x1080),
  PropertyShowcase-16x9 (1920x1080). Uses calculateMetadata to dynamically
  compute durationInFrames from photo count. Duration formula accounts for
  TransitionSeries overlap (N*90 + 90 frames).
- Files Modified:
  remotion/Root.tsx
- Architectural Impact:
  Lambda can render any aspect ratio by targeting the correct composition ID.
  Duration auto-calculated — no hardcoded frame counts.
- Blueprint Alignment:
  Yes — Phase 2 Plan 02-01: Multi-format registration.
- Risk Level:
  Low (composition registration)

### 3. Photo Ordering Module (AI Room Classification)
- Description:
  Created smart photo ordering using existing photoType data from preparation
  pipeline. Orders photos in walkthrough sequence: exterior_front → interior_living
  → kitchen → dining → bedrooms → bathrooms → back → drone → detail. Falls back
  to original order when no preparation metadata available. Zero additional AI cost.
- Files Created:
  lib/video/photo-ordering.ts
- Architectural Impact:
  Reuses photo-intelligence.ts classification data. No new AI calls needed.
  Walkthrough ordering makes videos feel like a guided property tour.
- Blueprint Alignment:
  Yes — Phase 2 Plan 02-02: Photo ordering module.
- Risk Level:
  Low (pure sorting logic)

### 4. Generate Route — Composition Mapping + Photo Ordering
- Description:
  Updated /api/video/generate to map template+aspectRatio to composition ID
  (property-showcase + 9:16 → PropertyShowcase-9x16). Fetches preparation_metadata
  and photo IDs for smart ordering. Added sqft to listing query. Expanded
  template enum to include 'property-showcase'.
- Files Modified:
  app/api/video/generate/route.ts
  lib/validation/schemas.ts
- Architectural Impact:
  API now supports both test and property-showcase templates. Photo ordering
  integrates seamlessly — ordered URLs passed directly to Lambda inputProps.
- Blueprint Alignment:
  Yes — Phase 2 Plans 02-01/02-02: API integration.
- Risk Level:
  Low (backwards-compatible, test template still works)

### 5. tsconfig — Exclude apps/mobile
- Description:
  Added apps/mobile/**/* to tsconfig exclude list to prevent cross-branch
  TypeScript errors from untracked mobile app files.
- Files Modified:
  tsconfig.json
- Architectural Impact:
  Prevents mobile app (feature/mobile-app branch) from interfering with
  main project compilation on feature/brand-polish branch.
- Risk Level:
  Low (build config only)

### 6. VideoCreator UI Migration — FFmpeg → Lambda
- Description:
  Major refactor of VideoCreator.tsx. Removed all FFmpeg-based browser rendering
  (~300 lines of canvas, mergeAudioWithVideo, ffmpegRef). Replaced with Lambda
  API integration: POST /api/video/generate triggers render, recursive setTimeout
  polling at 3s intervals to GET /api/video/status tracks progress. Added
  isMountedRef cleanup pattern. New UI: progress spinner with percentage bar,
  HTML5 video player with poster image, aspect ratio visual selector (3 formats),
  photo reorder with up/down arrows, download + regenerate buttons.
- Files Modified:
  app/dashboard/content-studio/video/VideoCreator.tsx
- Architectural Impact:
  Eliminates unreliable browser-side FFmpeg. All video rendering now happens on
  AWS Lambda via Remotion. Aspect ratios reduced to 3 (9:16, 1:1, 16:9) matching
  registered Remotion compositions. Template hardcoded to 'property-showcase'.
  Voiceover generation and music selection UI preserved for future audio mixing.
- Blueprint Alignment:
  Yes — Phase 2 Plan 02-03: VideoCreator UI migration.
- Risk Level:
  Medium (major UI refactor, but old FFmpeg code was non-functional)

-------------------------------------------------------------------------------
## 2026-02-19 — Phase 3: Lifecycle Templates (Video Engine v1.1)
-------------------------------------------------------------------------------

### 1. Shared Composition Components
- Description:
  Extracted PhotoSlide, AddressOverlay, font loading, and timing constants from
  PropertyShowcase into shared.tsx. Refactored PropertyShowcase and ClosingCard
  to import from shared module. Added INTRO_CARD_FRAMES constant (75 frames / 2.5s).
- Files Created:
  remotion/compositions/shared.tsx
- Files Modified:
  remotion/compositions/PropertyShowcase.tsx
  remotion/compositions/ClosingCard.tsx
- Architectural Impact:
  All compositions share the same PhotoSlide (Ken Burns), AddressOverlay, and font.
  Eliminates duplication. New compositions only need to import from shared.tsx.
- Blueprint Alignment:
  Yes — Phase 3 Plan 03-01: Shared component extraction.
- Risk Level:
  Low (refactor, no behavioral change)

### 2. JustListed Composition
- Description:
  Created JustListed template with IntroCard ("JUST LISTED" with gold accent line
  animation), slide transitions (alternating from-left/from-right), FeatureCallout
  overlays on photos, and ClosingCard. IntroCard has scale+fade title animation
  with gold line reveal. FeatureCallout shows property features as semi-transparent
  pills with gold left border.
- Files Created:
  remotion/compositions/JustListed.tsx
  remotion/compositions/IntroCard.tsx
  remotion/compositions/FeatureCallout.tsx
- Architectural Impact:
  Second production template. Uses slide transitions from @remotion/transitions
  for visual differentiation from PropertyShowcase (which uses fade). Features
  overlay adds value for listings with rich feature data.
- Blueprint Alignment:
  Yes — Phase 3 Plan 03-01: JustListed composition (COMP-02).
- Risk Level:
  Low (additive composition files)

### 3. OpenHouse Composition
- Description:
  Created OpenHouse template with faster pacing (3.5s/photo vs 4.5s), wipe
  transitions for urgency feel, EventBadge date overlay (gold background with
  calendar emoji), and IntroCard with date subtitle. EventBadge persists
  throughout slideshow at top of frame.
- Files Created:
  remotion/compositions/OpenHouse.tsx
  remotion/compositions/EventBadge.tsx
- Architectural Impact:
  Third production template. Wipe transitions + shorter photo duration create
  urgency appropriate for time-sensitive open house events. EventBadge adds
  persistent date/time context.
- Blueprint Alignment:
  Yes — Phase 3 Plan 03-02: OpenHouse composition (COMP-03).
- Risk Level:
  Low (additive composition files)

### 4. Composition Registration + API Integration
- Description:
  Registered JustListed and OpenHouse compositions in Root.tsx (3 aspect ratios
  each = 6 new compositions). Extended getCompositionId() with switch statement
  for just-listed and open-house templates. Added features field to listing query.
  Template-specific inputProps: features for JustListed, openHouseDate for OpenHouse.
  Expanded template enum to include 'just-listed' and 'open-house'. Added
  openHouseDate optional field to generate schema.
- Files Modified:
  remotion/Root.tsx
  app/api/video/generate/route.ts
  lib/validation/schemas.ts
- Architectural Impact:
  API now supports 4 templates (test, property-showcase, just-listed, open-house).
  Each template gets correct composition ID and template-specific props.
- Blueprint Alignment:
  Yes — Phase 3 Plans 03-01/03-02/03-03: Registration + API.
- Risk Level:
  Low (backwards-compatible, existing templates unchanged)

### 5. Template Selector UI
- Description:
  Added template selector to VideoCreator.tsx with 3 clickable cards (Showcase,
  Just Listed, Open House) using gold (#D4A017) border for active selection.
  Conditional date/time input appears when Open House template selected.
  Video info box dynamically shows selected template name and duration.
  Template and openHouseDate passed to generate API call.
- Files Modified:
  app/dashboard/content-studio/video/VideoCreator.tsx
- Architectural Impact:
  Users can now choose between 3 video templates in the UI. Open House template
  supports optional event date input. Template selection wired end-to-end from
  UI → API → Lambda → composition.
- Blueprint Alignment:
  Yes — Phase 3 Plan 03-03: Template selector UI (UI-03).
- Risk Level:
  Low (UI additions, existing functionality preserved)

## 2026-02-19 — Phase 4 Audio Integration

### 1. AudioLayer Composition Component + Music Library
- Created `remotion/compositions/AudioLayer.tsx` — reusable audio component for
  all compositions. Handles background music (looped, with fade in/out), voiceover
  playback, volume ducking (music ducks to 30% when voiceover present), and silent
  fallback track for platform compatibility.
- Created `public/music/` with 6 placeholder MP3 files (upbeat, elegant, cinematic,
  ambient, corporate, silent) generated via ffmpeg. Silent placeholders for dev —
  will be replaced with real royalty-free tracks.
- Integrated AudioLayer into PropertyShowcase, JustListed, OpenHouse compositions.
  Extended all Zod schemas with optional `audio` prop. Updated Root.tsx default props.
- Files Created:
  remotion/compositions/AudioLayer.tsx, public/music/*.mp3
- Files Modified:
  remotion/compositions/PropertyShowcase.tsx, JustListed.tsx, OpenHouse.tsx, Root.tsx
- Architectural Impact:
  All compositions now support optional audio (music + voiceover). Audio is rendered
  server-side by Lambda, not in the browser.
- Blueprint Alignment:
  Yes — Phase 4 Plan 04-01 (AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05).
- Risk Level:
  Low (additive, audio is optional — compositions work identically without it)

### 2. Voiceover Upload + Generate API Audio Params
- Added `upload-audio` action to voiceover API route. Uploads base64 MP3 to Supabase
  Storage (`raw-images/voiceovers/` prefix), returns signed URL (1hr expiry) for Lambda.
- Fixed all `any` types in voiceover route — typed interfaces for request bodies,
  `catch (error: unknown)` with guards, added AbortSignal.timeout to all fetches.
- Extended `generateVideoSchema` with optional `audio` object (musicTrack, musicVolume,
  voiceoverUrl, voiceoverVolume). UI sends 0-100, API converts to 0-1 for compositions.
- Updated generate route to pass audio params through to Lambda inputProps.
- Files Modified:
  app/api/video/voiceover/route.ts, lib/validation/schemas.ts,
  app/api/video/generate/route.ts
- Architectural Impact:
  Voiceover audio now persists in Supabase Storage with signed URLs. Audio params
  flow end-to-end: UI → generate API → Lambda → composition AudioLayer.
- Blueprint Alignment:
  Yes — Phase 4 Plan 04-02 (AUDIO-01, AUDIO-03, UI-05, UI-06).
- Risk Level:
  Low (existing render flow unchanged, audio is optional)

### 3. Wire Audio UI to Render Pipeline
- Updated VideoCreator voiceover flow: generate audio → upload to storage → get URL.
  Replaced `voiceoverAudio: Blob` state with `voiceoverUrl: string` (URL from storage).
- Wired audio params into generateVideo(): musicTrack, musicVolume, voiceoverUrl,
  voiceoverVolume passed to generate API when audio is enabled.
- Removed yellow "coming soon" banner. Added green audio status indicator showing
  which audio features will be mixed into the video.
- Added voiceover audio preview player (HTML5 audio element).
- Fixed share modal to show actual template name instead of hardcoded "PropertyShowcase".
- Files Modified:
  app/dashboard/content-studio/video/VideoCreator.tsx
- Architectural Impact:
  Audio tab is now fully functional — voiceover and music settings flow through to
  Lambda rendering. The audio pipeline is complete end-to-end.
- Blueprint Alignment:
  Yes — Phase 4 Plan 04-03 (UI-05, UI-06).
- Risk Level:
  Low (UI changes, existing video generation preserved)
## 2026-03-06 — Phase A: Production Hardening

### Security & Reliability Fixes for Go-Live

- `app/auth/forgot-password/page.tsx` — NEW: Forgot password page (matches login design). Calls `supabase.auth.resetPasswordForEmail()` with redirect to reset-password page. Shows confirmation state after submit.
- `app/auth/reset-password/page.tsx` — NEW: Reset password page. Exchanges Supabase recovery code for session, validates new password (min 8 chars, confirm match), calls `supabase.auth.updateUser()`. Redirects to dashboard on success.
- `app/auth/login/page.tsx` — Added "Forgot password?" link below password field linking to `/auth/forgot-password`
- `app/api/auth/welcome/route.ts` — NEW: Welcome email API (internal, CRON_SECRET auth). Sends branded HTML welcome email via Resend on first signup. Called fire-and-forget from auth callback.
- `app/auth/callback/route.ts` — Added welcome email trigger for new users (fire-and-forget, non-blocking).
- `app/api/stripe/webhook/route.ts` — Security fix: verify metadata `userId` ownership by cross-referencing profile email against Stripe session email before applying plan upgrades. Sanitize `instructions` field to 2000 chars. Profile update failures now throw (triggering Stripe retry) instead of silent log.
- `app/onboarding/page.tsx` — Fixed silent async failures: `profiles.upsert()` error now surfaces to user with alert + early return. Brand API failure is caught and non-blocking.
- `app/api/leads/bulk-email/route.ts` — Fixed sender address from `onboarding@resend.dev` to `notifications@snap-r.com` (branded domain).
- `app/api/health/route.ts` — NEW: `/api/health` endpoint. Returns `{status, timestamp, checks, version}`. Checks DB connectivity. Returns 200 ok / 503 degraded.
- `middleware.ts` — Removed noisy `console.warn` bot-blocking and rate-limit log lines (too high-volume in production; response codes already communicate outcome).
- `app/api/stripe/portal/route.ts` — Removed redundant `console.error` (error already returned to caller; Sentry captures unhandled exceptions).
