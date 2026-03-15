# SnapR Session Handoff — 2026-03-15

## Current State

- **Branch**: `main` (up to date)
- **Last merged PRs**: #116 (enterprise platform) and #117 (production hardening)
- **Deployed**: Vercel production at snap-r.com
- **Build status**: Clean (`tsc --noEmit` passes, `next build` succeeds)
- **Tests**: 220/220 passing (12 test files, vitest)
- **Total PRs merged**: #85–#117 (33 PRs across CTO roadmap + enterprise platform)

## Completed This Session

### 1. Applied Database Migrations (was URGENT)
Both pending migrations applied to live Supabase via Management API:
- `20260316_api_keys.sql` — api_keys + api_usage tables with RLS
- `20260316_custom_domains.sql` — custom_domains table with DNS TXT verification, RLS
- **All 13 migrations now applied** (was 11/13)

### 2. Fixed Failing Test
- `__tests__/limits.test.ts` — Updated stale test that expected `normalizeTier('enterprise')` to return `'agency'` (enterprise is now its own canonical tier since PR #116)
- Added enterprise tier coverage across all billing gate tests

## What Was Built (PRs #116–#117)

### PR #116: Enterprise Platform Layer
- **Public API v1** — 10 REST endpoints with API key auth (`sk_live_` prefix, SHA-256 hashing, timing-safe comparison)
- **Custom Domains** — DNS TXT verification flow, 6-hour verification cron
- **Embeddable Widgets** — Before/after slider, gallery, property card via iframe + loader script
- **Enterprise Tier** — New billing tier with `canAccessApi`, `canCustomDomain`, `canEmbed` capability flags
- **Developer Portal** — Public docs at `/developers` with auth guide, endpoint reference, code examples
- **Dashboard Settings** — API keys, domains, widgets management UIs
- **Service Layer** — `lib/services/listings-service.ts` extracted for v1 + internal route reuse

### PR #117: Production Hardening
- **Stripe Enterprise** — $299/mo or $249/mo annual, 14-day free trial checkout
- **OpenAPI 3.0 Spec** — 1037-line spec at `/api/v1/openapi.json` + interactive API reference page
- **Env Validation** — `lib/env.ts` fast-fails on missing critical vars at startup
- **Onboarding** — Empty state with 3-step visual guide + progress bars on listing cards
- **Sentry Tracking** — Transaction tracking for critical API paths
- **Data Retention Cron** — Weekly cleanup of old webhook deliveries, API usage, completed jobs

## Remaining Items (Priority Order)

### 1. Additional Improvements
- Mobile app polish (responsive dashboard)
- Analytics dashboard enhancements
- TikTok app audit for public posting (currently private-only)
- Fix Puppeteer auth in `scripts/capture-explainer-v3.mjs` for dashboard screenshots

## Known Issues

1. **Explainer video Puppeteer auth broken** — `capture-explainer-v3.mjs` can't authenticate; dashboard screenshots sourced from v1 captures
2. **TikTok unaudited app** — Posts default to `SELF_ONLY` (private). Need app audit for public posting

## Codebase Quality Snapshot

| Metric | Value |
|--------|-------|
| `any` types | 0 |
| TypeScript errors | 0 |
| ESLint warnings | 0 |
| Tests | 220/220 passing (12 files) |
| Zod-validated routes | 99/163 (60%) |
| Loading states | 61 loading.tsx files |
| Error boundaries | 13 error.tsx files |
| AbortSignal.timeout | All ~200 external fetches |
| API v1 endpoints | 10 (enterprise-gated) |
| Database migrations | 13 total (all applied) |
| Vercel crons | 5 (publish, analytics, digest, verify-domains, cleanup) |
