# SnapR Final Forensic Audit

Date: 2026-03-17

## Scope

This document consolidates the latest forensic audit across:

- application security
- operational security and secret handling
- runtime health and build integrity
- web and mobile functionality
- user journey integrity
- third-party provider integrations

The audit combined:

- code review of the current repository
- repo-wide health checks
- typecheck, lint, test, and build validation
- selected live third-party/provider checks against the deployed app

## Executive Summary

SnapR is materially healthier than in earlier audit rounds. The major server-side security issues previously identified around share access, photo approval writes, WhatsApp signature validation, and OAuth CSRF protection now appear fixed in code and remained intact in this pass.

The main remaining risk areas are:

1. local operational secret exposure in `.env.local`
2. mobile authentication mismatch between bearer-token clients and cookie-based API routes
3. mobile API contract drift causing likely runtime failures even where authentication succeeds
4. incomplete live verification of the browser-based OAuth session flow

## Final Findings

### P1: Live secrets stored in local plaintext environment file

Severity: Critical

File:

- [`.env.local`](/Users/snap-R/.env.local)

Finding:

The workspace still contains live production-grade credentials in plaintext in `.env.local`. Although this file is not currently tracked in git, it is still an operational security issue because compromise of the developer machine, backups, logs, or accidental sharing would expose real infrastructure and provider access.

Observed categories of secrets in the file included:

- Supabase service credentials
- Stripe secret keys
- Twilio credentials
- Resend API key
- OpenAI API key
- Cloudinary secrets
- Cloudflare credentials
- AWS/Remotion credentials
- social provider client secrets

Risk:

- unauthorized infrastructure access
- data exfiltration
- billing abuse
- account takeover of external services
- inability to confidently scope credential exposure

Recommendation:

- rotate every live credential currently stored in `.env.local`
- move secrets to a managed secret store or deployment environment
- keep only local development placeholders or non-sensitive values on disk
- ensure `.env.local` remains ignored and is never copied into support artifacts or backups

### P1: Mobile authenticated routes still rely on cookie-only server auth

Severity: Critical

Files:

- [apps/mobile/src/lib/api.ts](/Users/snap-R/apps/mobile/src/lib/api.ts)
- [lib/supabase/server.ts](/Users/snap-R/lib/supabase/server.ts)
- [app/api/listings/route.ts](/Users/snap-R/app/api/listings/route.ts)
- [app/api/listing/status/route.ts](/Users/snap-R/app/api/listing/status/route.ts)
- [app/api/listing/prepare/route.ts](/Users/snap-R/app/api/listing/prepare/route.ts)
- [app/api/schedule/route.ts](/Users/snap-R/app/api/schedule/route.ts)
- [app/api/analytics/posts/route.ts](/Users/snap-R/app/api/analytics/posts/route.ts)
- [app/api/social/connections/route.ts](/Users/snap-R/app/api/social/connections/route.ts)
- [app/api/marketing/status/route.ts](/Users/snap-R/app/api/marketing/status/route.ts)

Finding:

The mobile client continues to attach bearer tokens in requests, but many core routes it calls still authenticate using the cookie-based `createClient()` helper instead of the bearer-aware `createClientFromRequest()` helper.

Evidence:

- mobile bearer-token usage is defined in [apps/mobile/src/lib/api.ts](/Users/snap-R/apps/mobile/src/lib/api.ts)
- bearer-aware auth helper exists in [lib/supabase/server.ts](/Users/snap-R/lib/supabase/server.ts)
- several mobile-used routes still import and use the cookie-based helper

Affected mobile journeys likely include:

- dashboard listings
- all listings view
- listing detail
- prepare listing
- content studio
- social connection status
- marketing results

Risk:

- authenticated mobile users receive unauthorized responses
- broken end-to-end mobile journey despite green local tests
- inconsistent behavior between web and mobile

Recommendation:

- migrate all mobile-consumed routes to `createClientFromRequest(request)`
- alternatively create a dedicated `/api/mobile/*` surface and have mobile call only those routes
- add integration tests that authenticate with bearer tokens and exercise every mobile route

### P1: Mobile API response contracts remain inconsistent with screen expectations

Severity: Critical

Files:

- [apps/mobile/src/lib/api.ts](/Users/snap-R/apps/mobile/src/lib/api.ts)
- [apps/mobile/src/screens/content/ContentStudioScreen.tsx](/Users/snap-R/apps/mobile/src/screens/content/ContentStudioScreen.tsx)
- [apps/mobile/src/screens/listings/ListingDetailScreen.tsx](/Users/snap-R/apps/mobile/src/screens/listings/ListingDetailScreen.tsx)
- [apps/mobile/src/screens/listings/MarketingResultsScreen.tsx](/Users/snap-R/apps/mobile/src/screens/listings/MarketingResultsScreen.tsx)
- [apps/mobile/src/screens/settings/SettingsScreen.tsx](/Users/snap-R/apps/mobile/src/screens/settings/SettingsScreen.tsx)
- [app/api/schedule/route.ts](/Users/snap-R/app/api/schedule/route.ts)
- [app/api/analytics/posts/route.ts](/Users/snap-R/app/api/analytics/posts/route.ts)
- [app/api/social/connections/route.ts](/Users/snap-R/app/api/social/connections/route.ts)
- [app/api/listings/[id]/photos/route.ts](/Users/snap-R/app/api/listings/[id]/photos/route.ts)
- [app/api/marketing/status/route.ts](/Users/snap-R/app/api/marketing/status/route.ts)

Finding:

Several mobile screens still assume response shapes that the APIs do not return.

Confirmed mismatches:

- `getScheduledPosts()` expects an array, but [app/api/schedule/route.ts](/Users/snap-R/app/api/schedule/route.ts) returns `{ posts: [...] }`
- `getPublishedPosts()` expects an array, but [app/api/analytics/posts/route.ts](/Users/snap-R/app/api/analytics/posts/route.ts) returns `{ posts: [...], totals: ... }`
- `getSocialConnections()` expects an array, but [app/api/social/connections/route.ts](/Users/snap-R/app/api/social/connections/route.ts) returns `{ connections: [...] }`
- listing detail photo rendering expects `signed_url`, but [app/api/listings/[id]/photos/route.ts](/Users/snap-R/app/api/listings/[id]/photos/route.ts) returns `signedOriginalUrl` and `signedProcessedUrl`
- marketing results screen expects flat fields like `description`, `captions`, `mls_summary`, `property_site_url`, and `scheduled_posts_count`, but [app/api/marketing/status/route.ts](/Users/snap-R/app/api/marketing/status/route.ts) returns nested `marketingJob` data

Risk:

- mobile runtime failures
- empty states masking live data
- images not rendering on listing detail
- marketing content unavailable even when generated

Recommendation:

- choose one canonical response contract per route
- either adapt the API responses to the mobile client or update the mobile client to unwrap nested server responses
- add schema-based client contract tests for all mobile-consumed endpoints

### P3: Build emits noisy dynamic-server-usage warnings during prerender

Severity: Low

Files:

- [app/api/social/connections/route.ts](/Users/snap-R/app/api/social/connections/route.ts)
- [app/api/dashboard/processing-status/route.ts](/Users/snap-R/app/api/dashboard/processing-status/route.ts)
- [app/api/analytics/listings/route.ts](/Users/snap-R/app/api/analytics/listings/route.ts)
- [app/api/analytics/roi/route.ts](/Users/snap-R/app/api/analytics/roi/route.ts)

Finding:

The production build passes, but it still emits dynamic-server-usage errors during prerender for cookie-backed routes. This is not currently build-blocking, but it creates noise and could hide real regressions later.

Risk:

- reduced signal during builds
- harder debugging of genuine SSR/ISR failures

Recommendation:

- mark routes explicitly dynamic where intended
- avoid accidental prerender access to cookie-dependent API routes
- keep build output clean so new regressions stand out

## Items Verified As Fixed

These previously-open issues appear fixed and remained stable in the current audit:

### Share password protection

Files:

- [app/api/share/route.ts](/Users/snap-R/app/api/share/route.ts)
- [app/api/share/verify/route.ts](/Users/snap-R/app/api/share/verify/route.ts)
- [app/share/[token]/page.tsx](/Users/snap-R/app/share/[token]/page.tsx)

Status:

- share passwords are hashed before storage
- password-protected share pages do not preload signed media
- password verification occurs before listing and photo data are returned
- comparison-disabled shares do not expose raw images server-side

### Photo approval write protection

Files:

- [app/api/approve-photo/route.ts](/Users/snap-R/app/api/approve-photo/route.ts)

Status:

- share token is required
- token is validated
- token expiry is enforced
- updates are constrained to the share’s listing

### WhatsApp webhook verification

Files:

- [app/api/webhooks/whatsapp/route.ts](/Users/snap-R/app/api/webhooks/whatsapp/route.ts)

Status:

- Twilio signatures are checked
- unsigned requests are rejected

### OAuth CSRF protection

Files:

- [app/api/social/oauth/[platform]/route.ts](/Users/snap-R/app/api/social/oauth/[platform]/route.ts)

Status:

- callback requires authenticated user session
- callback validates OAuth `state` against the active user
- mismatch path rejects the connection flow

## Health Check Results

Completed successfully:

- `npm test`
- `npm run lint`
- top-level `npx tsc --noEmit`
- `apps/mobile` typecheck
- `apps/processor` typecheck
- `npm run build`

Latest observed result set:

- tests passed: 294
- lint passed
- all TypeScript checks passed
- production build passed when network access was allowed for external font fetching

## Live Third-Party Provider Validation

### Twilio / WhatsApp

Status: Live-tested

Results:

- correctly signed live webhook request returned `200`
- unsigned live webhook request returned `403`
- signed request followed the expected safe account-not-found behavior for an unregistered phone number

Conclusion:

- webhook signature validation is functioning live

### Facebook OAuth provider reachability

Status: Partially live-tested

Results:

- direct token-exchange request with configured credentials reached Facebook
- Facebook returned `OAuthException` for a fake code

Conclusion:

- the configured Facebook app credentials and endpoint path are live enough to reach Facebook
- full end-to-end browser OAuth completion was not verified in this pass

### LinkedIn OAuth provider reachability

Status: Partially live-tested

Results:

- direct token-exchange request with configured credentials reached LinkedIn
- LinkedIn returned “authorization code not found” for a fake code

Conclusion:

- the configured LinkedIn app credentials and endpoint path are live enough to reach LinkedIn
- full end-to-end browser OAuth completion was not verified in this pass

### Browser-backed OAuth session flow

Status: Not fully verified

What happened:

- a temporary audit user was created successfully
- a headless login attempt against the deployed app did not establish a usable authenticated browser session
- callback probes therefore redirected to `/auth/login?error=Not authenticated`

Interpretation:

- this pass confirmed the server rejects unauthenticated OAuth callbacks safely
- it did not prove the full happy-path browser session and provider callback flow end-to-end

Recommended next step:

- run a manual or headed browser E2E test against production or staging with a real operator login

## User Journey Assessment

### Web journey

Current assessment:

- core web build and route integrity are broadly healthy
- share flow looks substantially improved and server-gated correctly
- previously-flagged server-side security regressions remain closed

Residual concern:

- browser-authenticated OAuth happy path still needs explicit end-to-end confirmation

### Mobile journey

Current assessment:

- this remains the weakest product area
- major screens are still exposed to auth mismatch and response-shape mismatch

High-risk mobile screens:

- dashboard
- listings
- listing detail
- marketing results
- content studio
- settings/social connections

## Recommended Remediation Plan

### Priority 0: Contain credential exposure

1. Rotate all secrets currently present in `.env.local`.
2. Remove live secrets from local plaintext env files where possible.
3. Move secrets to managed secret storage for local and deployment workflows.
4. Audit logs, backups, and team machines for secret duplication.

### Priority 1: Repair mobile authentication

1. Inventory every endpoint called by the mobile app.
2. Convert those endpoints to `createClientFromRequest(request)` or move them behind `/api/mobile/*`.
3. Add bearer-token integration tests for every mobile API dependency.

### Priority 1: Repair mobile contract drift

1. Normalize route responses for scheduled posts, analytics posts, social connections, listing photos, and marketing status.
2. Update the mobile client and screens to the canonical response shapes.
3. Add typed response parsing or validation at the client boundary.

### Priority 2: Verify provider happy paths

1. Run manual or headed E2E login validation.
2. Complete full Facebook OAuth happy-path validation.
3. Complete full LinkedIn OAuth happy-path validation.
4. Optionally validate TikTok and Twitter/X if they are intended to be live now.

### Priority 3: Clean operational noise

1. Reduce build-time dynamic route warnings.
2. Keep build logs clean enough to spot real regressions quickly.

## Concrete Fix List

### Must fix now

- rotate and relocate secrets from [`.env.local`](/Users/snap-R/.env.local)
- make all mobile-consumed routes bearer-token compatible
- align mobile API contracts with actual server responses

### Should fix next

- update listing detail image handling to use returned signed fields
- update marketing results screen or flatten the API response
- update content studio and settings screens to unwrap response objects correctly
- clean prerender/dynamic route build noise

### Must verify after fixes

- real mobile end-to-end pass
- real browser login/session establishment
- full OAuth callback happy path with real operator account

## Audit Limitations

This audit did not fully verify:

- successful browser login and OAuth completion in headless automation
- provider account posting actions with real end-user social accounts
- every possible external provider path beyond the tested routes

Where live validation was incomplete, conclusions above are based on a mix of code review and limited provider reachability checks.

## Final Bottom Line

SnapR’s server-side security posture is much stronger than it was in earlier rounds. The most important remaining work is no longer the public-share or webhook class of issue. It is now:

1. secret hygiene
2. mobile auth compatibility
3. mobile contract consistency
4. final live browser OAuth verification

If those are addressed, the platform should be in a much stronger position both technically and operationally.
