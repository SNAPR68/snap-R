# Shared Libraries — lib/

## Supabase clients — pick the right one

| Client | Use in | RLS | Session |
|---|---|---|---|
| `@/lib/supabase/client` | Client components only | Enforced | From browser cookie |
| `@/lib/supabase/server` | Server components, API routes | Enforced | From server cookie |
| `@/lib/supabase/admin` (`adminSupabase`) | Crons, Workers, admin scripts | **Bypassed** | None (service role) |

Wrong client = subtle auth bugs. Check before importing.

## Validation — `lib/validation/schemas.ts`

Central Zod schemas. Every API route uses one. Add new schemas here — never inline in routes.

## Rate limiting — split module

- `lib/rate-limit-edge.ts` — Edge-safe implementation. No Upstash imports. Used by `middleware.ts`.
- `lib/rate-limit.ts` — Node-runtime wrapper. Re-exports `checkRateLimit` + the async Upstash-backed `checkRateLimitAsync`.

Middleware must only import from `rate-limit-edge.ts`.

## AI routing — `lib/ai/`

- `listing-engine/provider-router.ts` — circuit breaker (3 failures → 60s unhealthy)
- `router.ts` — retry logic (transient errors: 1s/2s/4s backoff; creative tools retry with lower guidance)
- Every provider call **must** call `recordProviderResult(provider, success)` after

Auto-enhance fallback is a last resort for enhance-category tools only — never for creative edits.

## Social capabilities — `lib/social/capabilities.ts`

Single source of truth for whether a platform is usable. `getSocialPlatformCapabilities()` returns `{ enabled, launchVisible, missing: string[] }` per platform, evaluated from env vars at runtime.

- Launch-visible: Facebook, Instagram, LinkedIn
- Hidden until audit: TikTok, Twitter/X

## Phone normalization — `lib/phone.ts`

- `normalizePhoneNumber(raw)` → E.164 or null (adds `+1` for bare 10-digit US)
- `normalizeWhatsAppAddress(raw)` → `whatsapp:+...`
- `phoneNumbersMatch(a, b)` — compare two raw inputs normalized

All phone storage in DB is E.164. Validate at boundaries (WhatsApp route, notification settings save).

## Webhooks — `lib/webhooks/dispatch.ts`

`dispatchWebhookEvent(userId, event, payload)`:
- HMAC-SHA256 signs body with webhook secret (header: `X-Webhook-Signature`)
- 10s timeout
- Logs every delivery to `webhook_deliveries`
- Never throws — always-complete semantics

Events: `listing.created`, `listing.updated`, `listing.prepared`, `lead.created`, `lead.updated`, `post.published`, `post.scheduled`, `photo.enhanced`.

## Monitoring — `lib/monitoring/`

- `pagerduty.ts` — Events API v2, graceful no-op when `PAGERDUTY_ROUTING_KEY` missing
- `cron-heartbeat.ts` — tracks cron liveness, alerts on overdue via PagerDuty
- `db-monitor.ts` — daily check of pg_stat_statements, connection pool, table bloat

## Env validation — `lib/env.ts`

`REQUIRED_VARS` is intentionally minimal: Supabase, Stripe, `CRON_SECRET`, `WORKER_URL`. `RECOMMENDED_VARS` (Twilio, social OAuth, ElevenLabs, RevenueCat) use call-time capability checks, never fail startup.

**Never promote a var to REQUIRED without `vercel env ls production` confirming it's set in every environment.** Promoting prematurely crashes prod on every request (see incident 2026-04-17 #150).

## Listing health — `lib/listing-health.ts`

`calculateListingHealth(supabase, listingId)` → 0-100 score + A-F grade across 4 dimensions (Preparation, Marketing, Distribution, Engagement), each 0-25. Foundation of the Listing Performance OS dashboard.
