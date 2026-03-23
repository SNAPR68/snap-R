# SnapR Production Readiness 2.0 — Complete Execution Document

**Date**: 2026-03-21
**Objective**: Take SnapR from 70/100 to 95/100 production readiness
**Codebase**: 705 TypeScript files, 122,799 lines, 183 API routes, 69 dashboard pages
**Execution model**: Single autonomous run — no back-and-forth

---

## Table of Contents

1. [Phase 1: CRITICAL Security & Reliability Fixes](#phase-1-critical-security--reliability-fixes)
2. [Phase 2: Error Handling & Resilience](#phase-2-error-handling--resilience)
3. [Phase 3: Structured Logging](#phase-3-structured-logging)
4. [Phase 4: Test Coverage](#phase-4-test-coverage)
5. [Phase 5: Performance & Code Quality](#phase-5-performance--code-quality)
6. [Phase 6: Accessibility & UX Hardening](#phase-6-accessibility--ux-hardening)
7. [Phase 7: Infrastructure & CI/CD](#phase-7-infrastructure--cicd)
8. [Verification Checklist](#verification-checklist)

---

## Phase 1: CRITICAL Security & Reliability Fixes

**Priority**: P0 — Do first, before anything else
**Impact**: Security score 78→92, Reliability score 68→85

### 1.1 Add AbortSignal.timeout to 148 fetch calls

Every external `fetch()` call MUST have `AbortSignal.timeout(15000)` to prevent hung third-party APIs from cascading failures.

**Files to fix (148 calls across these files)**:

| File | Approx Missing | Notes |
|------|---------------|-------|
| `lib/social/publish-service.ts` | ~35 | Facebook, Instagram, LinkedIn, TikTok API calls |
| `app/api/social/publish/route.ts` | ~15 | Social publishing endpoint |
| `app/api/social/oauth/[platform]/route.ts` | ~12 | OAuth token exchange calls |
| `lib/renovation/service.ts` | ~7 | Replicate/AI API calls |
| `app/api/cron/sync-analytics/route.ts` | ~7 | Platform analytics API calls |
| `lib/social/oauth-config.ts` | ~6 | Token refresh calls |
| `app/api/renovation/route.ts` | ~6 | Renovation API calls |
| `app/api/cron/publish-scheduled/route.ts` | ~5 | Scheduled post publishing |
| `app/api/video/voiceover/route.ts` | 3 | ElevenLabs/OpenAI TTS calls |
| `lib/ai/providers/sam-masks.ts` | 3 | SAM model API calls |
| All remaining files with `fetch(` | ~49 | Grep for `fetch(` without `AbortSignal` |

**Pattern to apply**:
```typescript
// BEFORE (broken — can hang forever)
const res = await fetch(url, { method: 'POST', headers, body })

// AFTER (15s timeout)
const res = await fetch(url, {
  method: 'POST',
  headers,
  body,
  signal: AbortSignal.timeout(15000),
})
```

**Verification**:
```bash
# Should return 0 results
grep -rn "fetch(" --include="*.ts" app/ lib/ | grep -v "AbortSignal\|timeout\|node_modules\|\.test\.\|\.spec\." | wc -l
```

### 1.2 Add auth to 5 vulnerable endpoints

These endpoints accept mutations without authentication and are exploitable:

| File | Issue | Fix |
|------|-------|-----|
| `app/api/chat/route.ts` | Uses `adminSupabase()` with **zero auth** — anyone can burn OpenAI credits | Add rate limit by IP (3 req/min) + validate `propertySiteId` exists before calling OpenAI |
| `app/api/notify-approval/route.ts` | Triggers approval emails without auth | Add `getUser()` auth check |
| `app/api/approve-photo/route.ts` | Approves photos without auth | Add `getUser()` auth check |
| `app/api/deliver/event/route.ts` | Event delivery without auth | Add HMAC signature verification or `getUser()` |
| `app/api/qrcode/route.ts` | Resource-intensive QR generation without auth | Add rate limit by IP (10 req/min) |

**Note**: These are legitimately public and should NOT have auth added:
- `app/api/contact/route.ts` — public contact form (has rate limit)
- `app/api/embed/analytics/route.ts` — widget tracking (fire-and-forget)
- `app/api/open-house/checkin/route.ts` — public check-in
- `app/api/open-house/feedback/route.ts` — public feedback
- `app/api/property-inquiry/route.ts` — public lead form
- `app/api/photographer/booking/route.ts` — public booking
- `app/api/stripe/webhook/route.ts` — Stripe signature verified
- `app/api/social/facebook-deletion/route.ts` — Facebook data deletion callback
- `app/api/webhooks/whatsapp/route.ts` — WhatsApp webhook
- `app/api/log-error/route.ts` — client error logging
- `app/api/analytics/track/route.ts` — analytics tracking
- `app/api/analytics/error/route.ts` — error tracking
- `app/api/guide/request/route.ts` — lead magnet form
- `app/api/notify/route.ts` — iOS waitlist (email only)
- `app/api/share/verify/route.ts` — share link password verification
- `app/api/showing/feedback/route.ts` — public showing feedback

### 1.3 Add Zod validation to 14 unvalidated POST routes

| File | Schema to add |
|------|---------------|
| `app/api/video/generate/route.ts` | Already has `generateVideoSchema` in schemas.ts — wire it up |
| `app/api/video/convert/route.ts` | Already has `videoConvertSchema` in schemas.ts — wire it up |
| `app/api/auth/password-changed/route.ts` | Create `passwordChangedSchema` (email: string) |
| `app/api/listings/sample/route.ts` | No body expected — add early return if body present |
| `app/api/listing/sample/route.ts` | Same as above |
| `app/api/user/delete-account/route.ts` | No body — add confirmation check |
| `app/api/user/export-data/route.ts` | No body — acceptable as-is |
| `app/api/social/disconnect/facebook/route.ts` | No body — acceptable (just disconnects) |
| `app/api/social/disconnect/instagram/route.ts` | Same |
| `app/api/social/disconnect/linkedin/route.ts` | Same |
| `app/api/social/test-linkedin/route.ts` | Add basic schema for test post content |
| `app/api/mobile/analyze-frame/route.ts` | Already has `mobileAnalyzeFrameSchema` — wire it up |
| `app/api/webhooks/whatsapp/route.ts` | WhatsApp validates via signature — acceptable |
| `app/api/stripe/webhook/route.ts` | Stripe validates via signature — acceptable |

**Net new schemas needed**: 1 (`passwordChangedSchema`)
**Existing schemas to wire up**: 3 (`generateVideoSchema`, `videoConvertSchema`, `mobileAnalyzeFrameSchema`)

### 1.4 Add try/catch to 20 unprotected routes

Every route handler MUST be wrapped in try/catch. An unhandled exception returns a bare 500 with no useful error body.

**Files that need try/catch wrapping**:

```
app/api/v1/openapi.json/route.ts
app/api/video/health/route.ts
app/api/video/watch/route.ts
app/api/domains/route.ts
app/api/embed/property/route.ts
app/api/embed/photos/route.ts
app/api/leads/drip/unsubscribe/route.ts
app/api/listings/route.ts
app/api/listings/[id]/route.ts
app/api/listings/[id]/photos/route.ts
app/api/admin/listings/latest/route.ts
app/api/admin/listings/[id]/preparation/route.ts
app/api/admin/listings/recent/route.ts
app/api/mobile/content-stats/route.ts
app/api/mobile/register-device/route.ts
app/api/mobile/dashboard-stats/route.ts
app/api/notifications/read-all/route.ts
app/api/notifications/route.ts
app/api/notifications/[id]/route.ts
app/api/analytics/route.ts
```

**Pattern**:
```typescript
export async function GET(request: NextRequest) {
  try {
    // ... existing code ...
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[RouteName] GET error:', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 1.5 Add .limit() to 20 unbounded queries

| File | Add |
|------|-----|
| `app/api/approval-summary/route.ts` | `.limit(500)` on listings query |
| `app/api/video/status/route.ts` | `.limit(50)` on render jobs |
| `app/api/video/generate/route.ts` | `.limit(200)` on photos query |
| `app/api/batch-enhance/route.ts` | `.limit(200)` on photos query |
| `app/api/admin/users/export/route.ts` | `.limit(10000)` on users query |
| `app/api/internal/video-generate/route.ts` | `.limit(200)` on photos query |
| `app/api/user/delete-account/route.ts` | `.limit(10000)` on cleanup queries |
| `app/api/dashboard/processing-status/route.ts` | `.limit(200)` on jobs query |
| `app/api/social/connections/route.ts` | `.limit(20)` on connections |
| `app/api/social/route.ts` | `.limit(20)` on connections |
| `app/api/mobile/content-stats/route.ts` | `.limit(500)` |
| `app/api/mobile/dashboard-stats/route.ts` | `.limit(500)` |
| `app/api/partners/status/route.ts` | `.limit(10)` |
| `app/api/copy/caption/route.ts` | `.limit(50)` |
| `app/api/copy/hashtags/route.ts` | `.limit(50)` |
| `app/api/notifications/route.ts` | `.limit(100)` |
| `app/api/cron/refresh-tokens/route.ts` | `.limit(1000)` |
| `app/api/cron/usage-check/route.ts` | `.limit(10000)` |
| `app/api/cron/verify-domains/route.ts` | `.limit(1000)` |
| `app/api/cron/mls-sync/route.ts` | `.limit(1000)` |

---

## Phase 2: Error Handling & Resilience

**Priority**: P1
**Impact**: Error Handling score 72→90

### 2.1 Add error boundaries to 28 dashboard pages

Create `error.tsx` files for every dashboard page that doesn't have one. Use the existing pattern from `app/dashboard/billing/error.tsx`.

**Pages needing error.tsx**:
```
app/dashboard/settings/domains/error.tsx
app/dashboard/settings/api-keys/error.tsx
app/dashboard/settings/social/error.tsx
app/dashboard/settings/watermark/error.tsx
app/dashboard/settings/webhooks/error.tsx
app/dashboard/settings/notifications/error.tsx
app/dashboard/leads/sequences/error.tsx
app/dashboard/content-studio/auto-post/error.tsx
app/dashboard/content-studio/video/error.tsx
app/dashboard/content-studio/bulk/error.tsx
app/dashboard/content-studio/calendar/error.tsx
app/dashboard/content-studio/drafts/error.tsx
app/dashboard/content-studio/library/error.tsx
app/dashboard/content-studio/sites/error.tsx
app/dashboard/content-studio/create-all/error.tsx
app/dashboard/content-studio/facebook/error.tsx
app/dashboard/content-studio/select/error.tsx
app/dashboard/content-studio/tiktok/error.tsx
app/dashboard/content-studio/create/error.tsx
app/dashboard/content-studio/instagram/error.tsx
app/dashboard/content-studio/email/error.tsx
app/dashboard/content-studio/story/error.tsx
app/dashboard/content-studio/linkedin/error.tsx
app/dashboard/content-studio/analytics/error.tsx
app/dashboard/content-studio/customize/error.tsx
app/dashboard/listings/new/error.tsx
app/dashboard/content/scheduled/error.tsx
app/dashboard/campaigns/settings/error.tsx
```

**Template** (copy from `app/dashboard/billing/error.tsx`):
```typescript
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
      <p className="text-sm text-gray-400">{error.message || 'An unexpected error occurred'}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-[#D4A017] px-4 py-2 text-sm font-medium text-black hover:bg-[#B8860B] transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}
```

### 2.2 Add 3 missing loading states

```
app/dashboard/settings/domains/loading.tsx
app/dashboard/settings/api-keys/loading.tsx
app/dashboard/settings/widgets/loading.tsx
```

**Template** (copy from any existing `loading.tsx`):
```typescript
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A017] border-t-transparent" />
    </div>
  )
}
```

---

## Phase 3: Structured Logging

**Priority**: P1
**Impact**: Error Handling score +5, Infrastructure score +5

### 3.1 Replace 129 console.error calls with logger

The codebase has `lib/logger.ts` already. Replace all `console.error` calls with `logger.error`.

**Command to find all occurrences**:
```bash
grep -rn "console\.error" --include="*.ts" --include="*.tsx" app/ lib/ components/ | grep -v node_modules | grep -v ".test."
```

**Rules**:
- Server-side (app/api/, lib/) → `import { logger } from '@/lib/logger'` then `logger.error()`
- Client-side (components/, app/dashboard/) → keep `console.error` BUT also call the error logger API:
  ```typescript
  import { logError } from '@/lib/error-logger'
  // ... in catch block:
  console.error('[Component] Error:', message)
  logError(message, { component: 'ComponentName', context })
  ```

**Files with highest concentration** (fix these first):
| File | Count | Type |
|------|-------|------|
| `components/content-studio/unified-creator.tsx` | 18 | Client |
| `app/dashboard/virtual-tours/page.tsx` | 6 | Client |
| `app/dashboard/content-studio/video/VideoCreator.tsx` | 5 | Client |
| `app/dashboard/content-studio/drafts/page.tsx` | 5 | Client |
| `app/dashboard/content-studio/calendar/page.tsx` | 4 | Client |
| `components/studio-client.tsx` | 3 | Client |

### 3.2 Enhance lib/logger.ts with request context

Update `lib/logger.ts` to support structured JSON output with request IDs:

```typescript
// lib/logger.ts — enhanced version
const isDev = process.env.NODE_ENV === 'development'

function formatLog(level: string, message: string, ...args: unknown[]) {
  if (isDev) {
    return `[${level.toUpperCase()}] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}`
  }
  // Production: JSON for log aggregation
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    data: args.length === 1 ? args[0] : args,
  })
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => console.log(formatLog('debug', message, ...args)),
  info: (message: string, ...args: unknown[]) => console.log(formatLog('info', message, ...args)),
  warn: (message: string, ...args: unknown[]) => console.warn(formatLog('warn', message, ...args)),
  error: (message: string, ...args: unknown[]) => console.error(formatLog('error', message, ...args)),
}
```

---

## Phase 4: Test Coverage

**Priority**: P1
**Impact**: Test Coverage score 38→80

### 4.1 Critical service tests (highest risk, write first)

These files have the highest blast radius if they break, and zero test coverage:

#### 4.1.1 `lib/social/publish-service.ts` (1,037 lines)
Create: `__tests__/publish-service.test.ts`

Test cases:
- `publishToFacebook()` — success, error, token expired, rate limited
- `publishToInstagram()` — success, error, container creation timeout
- `publishToLinkedIn()` — success, error, image upload 3-step flow
- `publishVideoToTikTok()` — success, error, PULL_FROM_URL method
- `publishPhotoToTikTok()` — success, error, photo carousel
- All functions handle AbortSignal.timeout correctly
- All functions return correct `PublishResult` shape on success and error
- Mock `fetch` for all external API calls

#### 4.1.2 `lib/webhooks/dispatch.ts` (168 lines)
Create: `__tests__/webhook-dispatch.test.ts`

Test cases:
- Fetches active webhooks matching event type
- Sends POST with correct `X-Webhook-Signature` (HMAC-SHA256)
- 10s timeout on delivery
- Logs delivery success/failure to `webhook_deliveries`
- Never throws (always-complete semantics)
- Handles no active webhooks gracefully
- Handles webhook URL returning 500
- Handles webhook URL timing out

#### 4.1.3 `lib/notifications/sender.ts` (452 lines)
Create: `__tests__/notification-sender.test.ts`

Test cases:
- Email notification delivery via Resend
- Push notification delivery
- SMS delivery via Twilio
- Handles missing recipient gracefully
- Handles API failures gracefully

#### 4.1.4 `lib/ai/listing-engine/batch-processor.ts` (1,030 lines)
Create: `__tests__/batch-processor.test.ts`

Test cases:
- Processes multiple photos in parallel
- Handles individual photo failures without blocking others (always-complete)
- Respects concurrency limits
- Updates job status correctly
- Handles empty photo list

#### 4.1.5 `lib/ai/listing-engine/provider-router.ts` (449 lines)
Create: `__tests__/provider-router.test.ts`

Test cases:
- Routes to correct provider based on tool type
- Falls back when primary provider fails
- Handles unknown tool types
- Returns correct result shape

### 4.2 API route tests

Create: `__tests__/api-routes.test.ts`

Test the 10 most critical API routes with mocked Supabase:

| Route | Test Cases |
|-------|-----------|
| `POST /api/leads` | Valid lead submission, invalid email, rate limit, webhook dispatch |
| `POST /api/enhance` | Valid enhancement, invalid photo ID, missing auth |
| `POST /api/upload` | Valid upload, file too large, missing auth |
| `GET /api/leads` | Authenticated fetch, filter by status, pagination |
| `PATCH /api/leads` | Status update, invalid status, wrong user's lead |
| `POST /api/leads/bulk-email` | Valid send, invalid lead IDs, rate limit |
| `POST /api/social/publish` | Valid publish, invalid platform, missing connection |
| `POST /api/video/generate` | Valid generation, invalid listing, missing auth |
| `GET /api/marketing/status` | Valid status, missing job, wrong user |
| `POST /api/chat` | Valid message, rate limit, listing not found |

### 4.3 Cron job tests

Create: `__tests__/cron-jobs.test.ts`

Test all 10 cron jobs with mocked Supabase and external APIs:

| Cron | Test Cases |
|------|-----------|
| `publish-scheduled` | Publishes due posts, skips future posts, handles platform errors, respects plan limits |
| `sync-analytics` | Fetches metrics from all platforms, handles token expiry, updates published_posts |
| `refresh-tokens` | Refreshes expiring tokens, handles refresh failure, skips valid tokens |
| `daily-digest` | Generates digest email, handles no activity, skips users with digest disabled |
| `drip-sequences` | Sends due emails, advances step, completes sequences, handles send failures |
| `usage-check` | Warns at 80%, blocks at 100%, skips unlimited tiers |
| `health-check` | Reports healthy status, checks all dependencies |
| `mls-sync` | Imports new listings, updates existing, handles API errors |
| `verify-domains` | Verifies DNS TXT records, updates status, handles DNS failures |
| `cleanup` | Deletes old webhook deliveries, api_usage, completed jobs |

### 4.4 Component tests

Create tests for the 5 most complex client components:

| Component | Test File | Key Tests |
|-----------|-----------|-----------|
| `components/studio-client.tsx` (952 lines) | `__tests__/components/studio-client.test.tsx` | Renders tools, handles enhancement flow, shows before/after |
| `components/content-studio/unified-creator.tsx` (1,302 lines) | `__tests__/components/unified-creator.test.tsx` | Template selection, content generation, platform switching |
| `components/marketing-results-panel.tsx` | `__tests__/components/marketing-results-panel.test.tsx` | Shows 5 marketing artifacts, copy buttons, error states |
| `components/ai-chatbot.tsx` | `__tests__/components/ai-chatbot.test.tsx` | Sends messages, streams responses, handles errors |
| `app/dashboard/leads/page.tsx` (1,159 lines) | `__tests__/components/leads-page.test.tsx` | List view, Kanban drag-drop, status filters, bulk actions |

### 4.5 Set up CI test enforcement

Create: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint app/ lib/ components/ --quiet
      - run: npx vitest run --reporter=verbose
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
```

### 4.6 Add coverage thresholds

Update `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
})
```

**Target**: 60% line coverage initially, raise to 80% over time.

---

## Phase 5: Performance & Code Quality

**Priority**: P2
**Impact**: Performance score 68→85, Code Quality score 82→90

### 5.1 Split monolithic components

These 6 files exceed 1,000 lines and should be decomposed:

| File | Lines | Split Into |
|------|-------|-----------|
| `components/content-studio/unified-creator.tsx` | 1,302 | `TemplateSelector`, `ContentEditor`, `PlatformPreview`, `PublishControls` |
| `app/dashboard/content-studio/video/VideoCreator.tsx` | 1,233 | `VideoSettings`, `VideoPreview`, `VoiceoverPanel`, `RenderProgress` |
| `app/p/[slug]/PropertySiteClient.tsx` | 1,215 | `PropertyHero`, `PropertyGallery`, `PropertyDetails`, `PropertyContact`, `PropertyMap` |
| `app/dashboard/leads/page.tsx` | 1,159 | `LeadsList`, `LeadsKanban`, `LeadFilters`, `LeadBulkActions` |
| `components/content-studio/template-renderer.tsx` | 1,149 | Split by platform: `FacebookRenderer`, `InstagramRenderer`, `LinkedInRenderer`, `TikTokRenderer` |
| `app/dashboard/virtual-tours/page.tsx` | 1,088 | `TourEditor`, `SceneManager`, `HotspotEditor`, `TourPreview` |

**Rules**:
- Extract into same directory as sub-components
- Use `next/dynamic` with `{ ssr: false }` for heavy client components
- Pass state via props, not by lifting massive state objects
- Each sub-component should be <300 lines

### 5.2 Fix N+1 query patterns

| File | Issue | Fix |
|------|-------|-----|
| `app/api/download-approved/route.ts:52` | `await storage` inside map | Use `Promise.all()` to parallelize signed URL generation |
| `app/api/ai/generate-description/route.ts:92` | `await storage` inside loop | Batch signed URL generation |
| `app/api/ai/photo-cull/route.ts:64` | `await storage` inside loop | Batch signed URL generation |
| `app/api/video/generate/route.ts:171` | `await storage` inside loop | Batch signed URL generation |
| `app/api/marketing/print-materials/route.ts:165` | `await storage` inside loop | Batch signed URL generation |

**Pattern**:
```typescript
// BEFORE (N+1)
for (const photo of photos) {
  const { data } = await supabase.storage.from('photos').createSignedUrl(photo.path, 3600)
  urls.push(data.signedUrl)
}

// AFTER (batch)
const urls = await Promise.all(
  photos.map(photo =>
    supabase.storage.from('photos').createSignedUrl(photo.path, 3600)
      .then(({ data }) => data?.signedUrl)
  )
)
```

### 5.3 Add cache headers for static API responses

| Route | Cache Header |
|-------|-------------|
| `app/api/v1/openapi.json/route.ts` | `Cache-Control: public, max-age=3600, s-maxage=86400` |
| `app/api/video/health/route.ts` | `Cache-Control: no-cache` (but add `max-age=10` to reduce hammering) |

---

## Phase 6: Accessibility & UX Hardening

**Priority**: P2
**Impact**: UX score 70→85

### 6.1 Fix base form components

These are the root cause — fixing them cascades to all usage:

| File | Fix |
|------|-----|
| `components/ui/input.tsx` | Add `aria-label` prop, forward `id` prop, add `aria-invalid` for error states |
| `components/ui/textarea.tsx` | Same as input |
| `components/ui/select.tsx` | Add `aria-label` prop, add `aria-expanded` for dropdown state |

**Pattern for input.tsx**:
```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, 'aria-label': ariaLabel, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn('...', className)}
        ref={ref}
        aria-label={ariaLabel}
        {...props}
      />
    )
  }
)
```

### 6.2 Add aria-labels to 20 form inputs

After fixing base components, add `aria-label` to these specific usages:

```
components/ai-chatbot.tsx:250            — aria-label="Chat message"
components/ai-chatbot.tsx:279            — aria-label="Your name"
components/guide-request-form.tsx:77     — aria-label="Your name"
components/guide-request-form.tsx:113    — aria-label="Email address"
components/guide-request-form.tsx:121    — aria-label="Company name"
components/compliance-settings.tsx:84    — aria-label="Compliance level"
components/pricing-section.tsx:224       — aria-label="Number of listings"
components/ShareGalleryModal.tsx:63      — aria-label="Gallery password"
components/ShareGalleryModal.tsx:67      — aria-label="Expiry days"
components/ShareGalleryModal.tsx:71      — aria-label="Access level"
components/content-studio/caption-generator.tsx:157  — aria-label="Caption style"
components/content-studio/caption-generator.tsx:166  — aria-label="Platform"
components/content-studio/schedule-modal.tsx:59      — aria-label="Schedule date"
components/content-studio/schedule-modal.tsx:69      — aria-label="Schedule time"
components/ui/before-after-slider.tsx:45 — aria-label="Comparison slider"
components/ui/auth-buttons.tsx:57        — aria-label="Email address"
```

### 6.3 Add skip navigation

Verify `components/skip-nav.tsx` is in the root layout. If not:

```typescript
// app/layout.tsx — add as first child of <body>
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-[#D4A017] focus:text-black"
>
  Skip to main content
</a>
```

And add `id="main-content"` to the main content area of dashboard layout.

---

## Phase 7: Infrastructure & CI/CD

**Priority**: P2
**Impact**: Infrastructure score 75→90

### 7.1 GitHub Actions CI pipeline

Create `.github/workflows/ci.yml` (see Phase 4.5 above).

### 7.2 Branch protection rules

Configure on GitHub:
- Require CI to pass before merge
- Require 1 review (or auto-approve for solo dev)
- Prevent force push to main
- Require up-to-date branch before merge

### 7.3 Rollback playbook

Create `docs/ROLLBACK.md`:

```markdown
# SnapR Rollback Playbook

## Vercel Instant Rollback
1. Go to https://vercel.com/tscllps-projects/snap-r/deployments
2. Find the last known good deployment
3. Click "..." → "Promote to Production"
4. Takes effect in ~30 seconds

## Git Rollback
git revert HEAD  # Revert last merge
git push origin main
vercel --prod --yes

## Database Rollback
- Supabase point-in-time recovery: Settings → Database → Backups
- Supabase project ref: asoiwonhqoesbvcilqwd
- Maximum recovery window: 7 days

## Cloudflare Worker Rollback
cd apps/processor
npx wrangler rollback  # Rolls back to previous deployment
```

### 7.4 Health check dashboard

The existing `/api/cron/health-check` route checks dependencies. Add a status page:

Create `app/status/page.tsx` — public status page that hits the health check endpoint and displays:
- API status
- Database connectivity
- External service status (Supabase, Cloudinary, Stripe)
- Last cron run timestamps

---

## Verification Checklist

Run these after ALL changes are complete:

```bash
# 1. Zero TypeScript errors
npx tsc --noEmit

# 2. Zero ESLint errors
npx eslint app/ lib/ components/ --quiet

# 3. All unit tests pass
npx vitest run

# 4. All E2E tests pass
npx playwright test

# 5. Build succeeds
npx next build

# 6. No fetch calls without timeout
MISSING=$(grep -rn "fetch(" --include="*.ts" app/ lib/ | grep -v "AbortSignal\|timeout\|node_modules\|\.test\.\|\.spec\." | wc -l)
echo "Fetch calls without timeout: $MISSING (should be 0)"

# 7. No unbounded queries
UNBOUNDED=$(for f in $(find app/api -name "route.ts"); do
  if grep -q "\.select(" "$f" && ! grep -q "\.limit(\|\.single()" "$f"; then
    echo "$f"
  fi
done | wc -l)
echo "Unbounded queries: $UNBOUNDED (should be 0)"

# 8. No routes without try/catch
NO_TRYCATCH=$(for f in $(find app/api -name "route.ts"); do
  has_handler=$(grep -c "export async function" "$f")
  has_trycatch=$(grep -c "try {" "$f")
  if [ "$has_handler" -gt 0 ] && [ "$has_trycatch" -eq 0 ]; then echo "$f"; fi
done | wc -l)
echo "Routes without try/catch: $NO_TRYCATCH (should be 0)"

# 9. No console.error in server code
SERVER_CONSOLE=$(grep -rn "console\.error" --include="*.ts" app/api/ lib/ | grep -v node_modules | grep -v ".test." | wc -l)
echo "Server console.error: $SERVER_CONSOLE (should be 0)"

# 10. All dashboard pages have error boundaries
NO_ERROR=$(for d in $(find app/dashboard -type d -maxdepth 2); do
  if [ -f "$d/page.tsx" ] && [ ! -f "$d/error.tsx" ]; then echo "$d"; fi
done | wc -l)
echo "Pages without error.tsx: $NO_ERROR (should be 0)"
```

---

## Score Projection

| Dimension | Current | After Phase 1-2 | After All Phases | Weight |
|-----------|---------|-----------------|-----------------|--------|
| Code Quality | 82 | 85 | 92 | 15% |
| Test Coverage | 38 | 38 | 82 | 20% |
| Security | 78 | 93 | 95 | 20% |
| Error Handling | 72 | 90 | 92 | 10% |
| Infrastructure | 75 | 78 | 90 | 10% |
| Features | 93 | 93 | 93 | 10% |
| UX | 70 | 72 | 86 | 7.5% |
| Performance | 68 | 75 | 86 | 7.5% |
| **Weighted Total** | **70** | **78** | **90** | |

**Realistic target: 90/100** after all 7 phases. Reaching 95+ requires sustained testing investment beyond this document (component test coverage, mutation testing, load testing).

---

## Execution Order (for autonomous agent)

1. **Phase 1.1** — AbortSignal.timeout on 148 fetch calls (CRITICAL, do first)
2. **Phase 1.4** — try/catch on 20 routes (quick wins)
3. **Phase 1.5** — .limit() on 20 queries (quick wins)
4. **Phase 1.2** — Auth fixes on 5 endpoints
5. **Phase 1.3** — Zod validation on 4 routes (wire existing schemas)
6. **Phase 2.1** — 28 error boundaries (mechanical, fast)
7. **Phase 2.2** — 3 loading states (trivial)
8. **Phase 3.1** — Replace 129 console.error with logger (mechanical)
9. **Phase 3.2** — Enhance logger with JSON output
10. **Phase 5.2** — Fix N+1 queries (5 files)
11. **Phase 5.3** — Cache headers (2 files)
12. **Phase 6.1** — Fix base form components (3 files)
13. **Phase 6.2** — Add aria-labels (16 files)
14. **Phase 4.1** — Service tests (5 test files)
15. **Phase 4.2** — API route tests (1 test file)
16. **Phase 4.3** — Cron job tests (1 test file)
17. **Phase 4.4** — Component tests (5 test files)
18. **Phase 4.5** — CI pipeline (.github/workflows/ci.yml)
19. **Phase 4.6** — Coverage thresholds
20. **Phase 5.1** — Component decomposition (6 files → ~24 files)
21. **Phase 7** — Rollback playbook, status page

**Commit after each phase.** Run `npx tsc --noEmit` after every change.
**Create PRs per phase** (Phase 1, Phase 2, etc.) to keep changes reviewable.

---

## Files Modified Summary

| Phase | Files Created | Files Modified | Estimated Changes |
|-------|--------------|----------------|-------------------|
| Phase 1 | 0 | ~175 | 148 fetch fixes + 20 try/catch + 20 limits + 5 auth + 4 zod |
| Phase 2 | 31 | 0 | 28 error.tsx + 3 loading.tsx |
| Phase 3 | 0 | ~60 | 129 console.error replacements + logger enhancement |
| Phase 4 | 14 | 2 | 12 test files + CI workflow + vitest config |
| Phase 5 | ~18 | 13 | Component splits + N+1 fixes + cache headers |
| Phase 6 | 0 | 19 | 3 base components + 16 aria-label additions |
| Phase 7 | 3 | 0 | CI, rollback doc, status page |
| **Total** | **~66** | **~269** | |
