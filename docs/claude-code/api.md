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

### Additional API Routes (162 total non-v1 routes)

| Category | Routes | Purpose |
|----------|--------|---------|
| AI Content | `/api/ai/generate-caption`, `/api/ai/generate-description`, `/api/ai/photo-cull` | AI-powered content generation |
| Admin | `/api/admin/*` (7 routes) | Test accounts, user export, manual preparation triggers |
| Analytics | `/api/analytics/roi`, `/api/analytics/track`, `/api/analytics/error` | ROI tracking, event tracking, error logging |
| Brand | `/api/brand` | Brand kit management |
| Campaigns | `/api/campaigns` | Campaign CRUD |
| Chat | `/api/chat` | AI chatbot for lead qualification |
| CMA | `/api/cma` | Comparative market analysis |
| Compliance | `/api/compliance/apply`, `/api/compliance/export` | Watermarking, GDPR export |
| Floor Plans | `/api/floor-plans/generate` | AI floor plan generation |
| Mobile | `/api/mobile/*` (4 routes) | Mobile device registration, analytics |
| Portfolio | `/api/portfolio`, `/api/property-inquiry` | Photographer portfolios |
| Renovation | `/api/renovation`, `/api/renovation/revision` | Virtual renovation visualization |
| Social OAuth | `/api/social/connect/*`, `/api/social/callback/*`, `/api/social/disconnect/*` | OAuth flows for 4 platforms |
| Staging | `/api/staging` | Virtual staging |
| Stripe | `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook` | Billing & subscriptions |
| Teams | `/api/teams`, `/api/teams/[id]/invite`, `/api/teams/[id]/members` | Team management |
| User | `/api/user/delete-account`, `/api/user/export-data` | Account management, GDPR |
| Virtual Tours | `/api/virtual-tours`, `/api/virtual-tours/generate`, `/api/virtual-tours/scenes` | Virtual tour builder |
| Voiceover | `/api/voiceover` | Standalone voiceover generation |
| Watermark | `/api/watermark`, `/api/qrcode` | Image watermarking, QR codes |

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

**Per-IP (all routes):**
```
/api/enhance:  10 req/min
/api/analyze:  20 req/min
/api/upload:   30 req/min
/api/contact:  3 req/min
/api/auth:     5 req/min
Default:       100 req/min
```

**Per-User (AI-heavy routes, via `checkRateLimitPerUser()`):**
```
/api/enhance:               10 req/min
/api/batch-enhance:          3 req/min
/api/chat:                  20 req/min
/api/ai/generate-caption:   15 req/min
/api/ai/generate-description: 10 req/min
/api/video/generate:         5 req/min
/api/staging:                5 req/min
/api/renovation:             5 req/min
/api/floor-plans/generate:   5 req/min
```

## Security

- **OAuth CSRF validation**: State parameter verified against `user.id` in callback (`app/api/social/oauth/[platform]/route.ts`)
- **Twitter PKCE**: S256 code challenge with `crypto.createHash('sha256')` (`lib/social/oauth-config.ts`)
- **Facebook token refresh**: Short-lived tokens exchanged for long-lived tokens via `fb_exchange_token`
- **TikTok token refresh**: 24-hour access tokens auto-refreshed via cron publisher; refresh tokens last ~365 days
- **Centralized auth middleware**: `middleware.ts` protects `/dashboard/*`, `/admin/*`, `/checkout/*`, `/onboarding/*` — redirects unauthenticated users with `?redirect=` param
- **Zod validation**: All API inputs parsed through Zod schemas before processing (`lib/validation/schemas.ts`)
- **Security headers**: CSP, Permissions-Policy, X-Content-Type-Options, X-Frame-Options configured in `next.config.mjs`
- **Per-user rate limiting**: AI-heavy routes enforce per-user limits via `checkRateLimitPerUser()` (prevents single user burning credits)
- **Admin auth**: All 7 admin routes use unified `Authorization: Bearer ADMIN_SECRET`
- **OWASP ZAP**: Automated security scan in CI (`security/zap-config.yaml`, `.github/workflows/security.yml`)

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
2. **Test suite**: Vitest + React Testing Library + Playwright — 42 test files, 545 tests, coverage thresholds at 80%/80%/70%/80%
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
37. **PagerDuty alerting**: `lib/monitoring/pagerduty.ts` sends alerts via Events API v2. Integrated into `error-logger.ts` (logCritical) and `cron-heartbeat.ts` (overdue crons). Requires `PAGERDUTY_ROUTING_KEY` env var; gracefully no-ops when not set.
38. **DB monitoring cron**: `app/api/cron/db-monitor/route.ts` runs daily at 6am. Checks `pg_stat_statements` for slow queries, connection pool health, table bloat. Alerts via PagerDuty on thresholds.
39. **Per-user rate limiting**: `checkRateLimitPerUser(userId, route, limit, windowMs)` in `lib/rate-limit.ts`. Uses `user:{userId}:{route}` key pattern. Applied to all AI-heavy routes to prevent single-user credit burn.
40. **Syndication feeds**: `lib/syndication/reso-feed.ts` generates RESO Data Dictionary 2.0 XML. Endpoints at `/api/syndication/zillow/route.ts` and `/api/syndication/realtor/route.ts`. Field mapping in `lib/syndication/field-mapping.ts`.
41. **Modals must have ESC key handlers**: All 14 custom modal overlays (`fixed inset-0 z-50`) have `useEffect` keydown listeners for Escape key. The shadcn Dialog (Radix) handles ESC natively.
42. **Settings pages must show errors**: All settings pages (api-keys, domains, webhooks) display dismissible error banners on API failure. No silent `catch {}` blocks — always surface errors to the user.
43. **SEO metadata**: Every public page has unique `<title>` and `<meta name="description">` via page-level `export const metadata` or route-specific `layout.tsx` files. Never reuse homepage metadata.
44. **Lighthouse CI**: `.github/workflows/lighthouse.yml` runs on PRs. Thresholds: LCP < 2.5s, FID < 100ms, CLS < 0.1, accessibility > 90. Config in `lighthouserc.js`.
45. **Load testing**: k6 scripts in `load-tests/` cover upload, enhance, publish, auth-flow, api-v1, marketing-pipeline. Thresholds: p95 < 2s, p99 < 5s, error rate < 1%.
46. **WCAG audit**: `e2e/wcag-audit.spec.ts` runs axe-core on homepage, dashboard, listing, and settings pages. Tests keyboard navigation and focus traps.
47. **i18n framework**: next-intl configured with `i18n/request.ts` and `i18n/routing.ts`. English strings in `messages/en.json`, Spanish skeleton in `messages/es.json`. Middleware handles locale detection.
48. **Mutation testing**: Stryker configured in `stryker.config.mjs`. Targets `lib/**/*.ts`. Threshold: 70% mutation score. Run via `npm run test:mutate`.
49. **Staging seed**: `scripts/seed-staging.mjs` creates realistic staging data (users, listings, leads, photos, posts). Idempotent — safe to re-run.
50. **RevenueCat**: Infrastructure built but **dormant**. Stripe remains billing source of truth. RC module at `lib/revenuecat/` has full API client, webhook handler (11 event types), on-demand sync, and 25 passing tests. Webhook route at `/api/webhooks/revenuecat`. Auth callback creates RC subscriber on signup. DB column `profiles.revenuecat_app_user_id` exists. **Do not enable both Stripe and RC webhooks simultaneously** without adding a precedence rule — they both write to `profiles.subscription_tier`. Activate RC when mobile billing (App Store / Play Store) or RC-specific features (churn analytics, paywall A/B testing) are needed. Env vars: `REVENUECAT_API_KEY`, `REVENUECAT_WEBHOOK_AUTH_KEY` (both optional, graceful no-op when missing).
51. **AI engine circuit breaker**: `lib/ai/listing-engine/provider-router.ts` tracks provider health with a rolling window of 50 results. After 3 consecutive failures, provider is marked unhealthy for 60 seconds (circuit breaker). `getHealthyProviderForTool()` auto-routes to fallback provider. `recordProviderResult()` must be called after every provider invocation. Fail-open: if both primary and fallback are unhealthy, routes to primary anyway.
52. **AI router retry**: `lib/ai/router.ts` retries transient errors (rate limits, timeouts, 502/503) with exponential backoff (1s, 2s, 4s). Creative tools retry with lower guidance before giving up. Technical tools retry once. Auto-enhance fallback is last resort for enhance-category tools only — never for creative edits like sky replacement.
53. **tools_applied tracking**: `app/api/enhance/route.ts` appends every applied tool to `photos.tools_applied text[]` on successful enhancement. This is the foundation of the data moat — every photo's enhancement history is tracked.
54. **Listing health score**: `lib/listing-health.ts` exports `calculateListingHealth(supabase, listingId)` returning a 0-100 score (A-F grade) across 4 dimensions: Preparation (0-25), Marketing (0-25), Distribution (0-25), Engagement (0-25). Generates 1-3 intervention suggestions. Foundation for the Listing Performance OS dashboard.
55. **Skip-enhancement path**: `POST /api/listing/skip-preparation` bypasses AI enhancement for agents with professional photos. Sets `preparation_status='prepared'` with `preparation_metadata.skipped=true`, marks photos as completed, triggers marketing pipeline via webhook. Studio UI has split button: "AI Prepare" + "Skip to Marketing" with confirmation modal explaining both paths.
56. **Facebook publishing**: Uses `URLSearchParams` (not `FormData`) for all Graph API v18 calls. `FormData` breaks single-image posts on the photos endpoint.
57. **LinkedIn error handling**: `uploadImageToLinkedIn` and `uploadVideoToLinkedIn` throw on failure instead of returning `null`. If all image uploads fail, the post fails rather than silently falling back to text-only.
58. **Batch processor timeout**: Default `maxBatchTimeoutMs` is 30 minutes (1800000ms), configurable via `BATCH_TIMEOUT_MS` env var. Previous 10-minute default caused incomplete processing on listings with 20+ photos.
59. **Video generation error handling**: `POST /api/video/generate` returns 500 (not 200) when the `video_render_jobs` DB insert fails. `voiceover-service.ts` exposes actual OpenAI API error messages instead of generic "Failed to generate script".
60. **Staging download**: `AdjustmentPanel` has a Download button for pending enhancements (blob download). Users can download virtual staging results before accepting/saving.
61. **Content Studio badges**: Listing select page (`content-studio/select`) shows "Enhanced" or "Original" badges on photo thumbnails so users can see which photos have been processed.
62. **Env validation — minimal required set**: `lib/env.ts` `REQUIRED_VARS` is intentionally minimal (Supabase, Stripe, `CRON_SECRET`, `WORKER_URL`). `validateEnv()` throws at instrumentation boot when a required var is missing, which crashes **every** request with Next.js `/500` (`x-matched-path: /500`, `x-next-error-status: 500`). Optional integrations (Twilio, Facebook/LinkedIn/TikTok/Twitter OAuth, ElevenLabs, RevenueCat) live in `RECOMMENDED_VARS` and use capability-check + graceful skip at call-time (see `lib/social/capabilities.ts`). **Never promote a var to required without `vercel env ls production` confirming it is set in every environment** — this crashed prod on 2026-04-17 (#150).
63. **Social capability system**: `lib/social/capabilities.ts` is the single source of truth for whether a social platform is usable. `getSocialPlatformCapabilities()` returns per-platform `{ enabled, launchVisible, missing: string[] }` evaluated from env vars at runtime. Launch-visible platforms: Facebook, Instagram, LinkedIn. TikTok and X are hidden until audit passes (`launchVisible: false`). All connect routes (`/api/social/connect/*`) and the publish route (`/api/social/publish`) call `getSocialCapability(platform).enabled` before any DB/OAuth work — return 503 with a clear message if disabled.
64. **Auth callback must be no-store**: `app/auth/callback/route.ts` sets `export const dynamic = 'force-dynamic'`, `export const revalidate = 0`, `export const fetchCache = 'force-no-store'`, AND wraps every `NextResponse.redirect(...)` in a `noStore()` helper that adds `Cache-Control: no-store`, `CDN-Cache-Control: no-store`, `Vercel-CDN-Cache-Control: no-store`. Reason: `dynamic = 'force-dynamic'` prevents Next.js from caching, but does NOT prevent Vercel's edge/CDN from caching the HTTP response. A transient 500 with `cache-control: public, max-age=0, must-revalidate` gets pinned at the edge and replayed for hours on `If-None-Match` revalidation. Happened on 2026-04-15 (#147) and would have recurred on 2026-04-17 (#149) if not hardened.
65. **Edge rate limiter split**: `lib/rate-limit-edge.ts` (no Upstash imports) is the edge-safe implementation used by `middleware.ts`. `lib/rate-limit.ts` re-exports `checkRateLimit` from it for Node-runtime callers and keeps the async Upstash-backed `checkRateLimitAsync` for API routes. Never import `@upstash/redis` or `@upstash/ratelimit` from middleware — they use `eval`/`process.version` which trigger `EvalError: Code generation from strings disallowed` on the Edge Runtime.
66. **Phone normalization**: `lib/phone.ts` exports `normalizePhoneNumber(raw)` (returns E.164 or null; adds `+1` for bare 10-digit US), `normalizeWhatsAppAddress(raw)` (`whatsapp:+...` format), and `phoneNumbersMatch(a, b)`. WhatsApp route validates + normalizes before sending and logs every attempt to `notification_logs`. Notification settings page validates before save — inline error if format invalid. All phone storage in DB is E.164.
67. **Launch admin dashboard**: `/admin/launch` is a server component showing live social connection health (last_error, connected_at), recent publish failures from `scheduled_posts`, and WhatsApp notification logs. Use this as the first stop when debugging a customer-reported publishing or notification failure.
