# Fix All Issues — SnapR Final Remediation Plan

**Created**: 2026-03-07
**Baseline**: 82/100 audit score
**Target**: 95+/100

---

## Issue 1: Zod Validation (71 unvalidated routes) — CRITICAL

**Problem**: 71 of 96 body-accepting API routes have zero Zod input validation.
**Impact**: Unvalidated user input reaches business logic. Security risk.

### Routes to fix (71 files):

```
app/api/admin/complete-human-edit/route.ts
app/api/admin/contacts/update-status/route.ts
app/api/ai/generate-caption/route.ts
app/api/ai/generate-description/route.ts
app/api/ai/photo-cull/route.ts
app/api/analytics/error/route.ts
app/api/analytics/posts/route.ts
app/api/analytics/track/route.ts
app/api/analyze/route.ts
app/api/approve-photo/route.ts
app/api/auth/welcome/route.ts
app/api/auto-post/route.ts
app/api/batch-enhance/route.ts
app/api/brand/route.ts
app/api/campaigns/route.ts
app/api/cma/route.ts
app/api/compliance/apply/route.ts
app/api/compliance/export/route.ts
app/api/contact/route.ts
app/api/content-library/route.ts
app/api/copy/caption/route.ts
app/api/copy/description/route.ts
app/api/copy/hashtags/route.ts
app/api/download-all/route.ts
app/api/drafts/route.ts
app/api/email/send/route.ts
app/api/enhance-quick/route.ts
app/api/enhance/route.ts
app/api/feedback/route.ts
app/api/human-editor/route.ts
app/api/internal/video-generate/route.ts
app/api/jobs/[id]/route.ts
app/api/listing-intelligence/[analysisId]/route.ts
app/api/listing-intelligence/analyze/route.ts
app/api/listing/prepare/route.ts
app/api/listing/status/route.ts
app/api/listings/route.ts
app/api/listings/status/route.ts
app/api/log-error/route.ts
app/api/marketing/print-materials/route.ts
app/api/marketing/trigger/route.ts
app/api/mobile/register-device/route.ts
app/api/notify-approval/route.ts
app/api/notify/route.ts
app/api/organization/route.ts
app/api/portfolio/items/route.ts
app/api/portfolio/route.ts
app/api/prepare-notification/route.ts
app/api/property-inquiry/route.ts
app/api/property-site/route.ts
app/api/publish-video/route.ts
app/api/qrcode/route.ts
app/api/renovation/revision/route.ts
app/api/renovation/route.ts
app/api/reorder-photos/route.ts
app/api/share/route.ts
app/api/social/publish/route.ts
app/api/social/route.ts
app/api/staging/route.ts
app/api/stripe/addon-purchase/route.ts
app/api/stripe/human-edit-checkout/route.ts
app/api/teams/[id]/invite/route.ts
app/api/teams/[id]/members/route.ts
app/api/teams/[id]/route.ts
app/api/teams/route.ts
app/api/translate/route.ts
app/api/v3/test-imagen/route.ts
app/api/virtual-tours/route.ts
app/api/virtual-tours/scenes/route.ts
app/api/voiceover/route.ts
app/api/watermark/route.ts
app/api/webhooks/outgoing/route.ts
```

### Fix pattern:
```typescript
import { z } from 'zod';

const schema = z.object({
  // define expected body fields
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const { field1, field2 } = parsed.data;
  // ... rest of handler
}
```

---

## Issue 2: AbortSignal.timeout Missing (283 fetch calls) — CRITICAL

**Problem**: 283 external fetch calls have no timeout. A slow/hanging upstream can block the entire request.
**Impact**: Server hangs, Vercel function timeouts, poor UX.

### Fix pattern:
```typescript
// Before
const res = await fetch(url, { method: 'POST', body });

// After
const res = await fetch(url, { method: 'POST', body, signal: AbortSignal.timeout(15000) });
```

### Top offender files (by fetch count):
```
lib/ai/providers/replicate.ts (64 console.logs, many fetches)
lib/renovation/service.ts
lib/ai/providers/runware.ts
lib/ai/listing-engine/batch-processor.ts
lib/social/publish-service.ts (all social API calls)
lib/ai/providers/autoenhance.ts
lib/ai/providers/openai-vision.ts
app/api/cron/publish-scheduled/route.ts
app/api/cron/sync-analytics/route.ts
app/api/cron/refresh-tokens/route.ts
app/api/social/publish/route.ts
app/api/stripe/* (all Stripe calls)
app/api/renovation/route.ts
app/api/staging/route.ts
app/api/video/* routes
```

---

## Issue 3: console.log in Production (372 statements) — MEDIUM

**Problem**: 372 `console.log` scattered across server code. No log levels, no filtering, noisy production output.
**Impact**: Hard to debug real issues in production logs.

### Fix: Create `lib/logger.ts`
```typescript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

export const logger = {
  debug: (...args: unknown[]) => LEVELS[LOG_LEVEL] <= 0 && console.log('[DEBUG]', ...args),
  info: (...args: unknown[]) => LEVELS[LOG_LEVEL] <= 1 && console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => LEVELS[LOG_LEVEL] <= 2 && console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => LEVELS[LOG_LEVEL] <= 3 && console.error('[ERROR]', ...args),
};
```

### Top 10 files to fix first (most console.logs):
```
64  lib/ai/providers/replicate.ts
32  lib/renovation/service.ts
27  app/api/renovation/route.ts
19  lib/ai/listing-engine/photo-intelligence.ts
18  lib/ai/listing-engine/index.ts
16  lib/ai/providers/runware.ts
16  lib/ai/listing-engine/batch-processor.ts
15  lib/compliance/mls-export.ts
11  app/api/cron/publish-scheduled/route.ts
 9  lib/ai/hdr-processor.ts
```

---

## Issue 4: Non-Conforming Catch Blocks (168 blocks) — MEDIUM

**Problem**: 168 catch blocks don't follow the project convention of `catch (error: unknown)` or `catch {}`.
**Impact**: Code convention violation. Potential runtime type issues.

### Breakdown:
- **25 using `catch (e)`** — wrong variable name
- **143 using `catch (error)` without `: unknown`** — missing type annotation

### 25 files with `catch (e)` (fix first):
```
app/admin/human-edits/actions.tsx
app/dashboard/settings/data-actions.tsx
app/dashboard/settings/watermark/page.tsx
app/dashboard/content-studio/auto-post/page.tsx
app/dashboard/content-studio/library/page.tsx
app/api/log-error/route.ts
app/api/ai/generate-description/route.ts
app/api/ai/photo-cull/route.ts
app/api/listing-intelligence/analyze/route.ts
lib/monitoring.ts
lib/cost-logger.ts
lib/analytics/error-logger.ts
components/content-studio/unified-creator.tsx
```

### Fix patterns:
```typescript
// If error is used:
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}

// If error is not used:
catch {
  // silently ignore
}
```

---

## Issue 5: `<img>` Tags (207 raw tags, 53 missing alt) — MEDIUM

**Problem**: 207 raw `<img>` tags instead of `next/image`. 53 images missing `alt` attribute entirely.
**Impact**: No image optimization (lazy loading, WebP, responsive sizes). Accessibility violation.

### Files with most `<img>` tags:
```
40  components/content-studio/template-renderer.tsx
36  components/content-studio/vertical-renderer.tsx
36  components/content-studio/facebook-renderer.tsx
 6  components/studio-client.tsx
 6  app/dashboard/content-studio/email/EmailMarketing.tsx
 5  components/studio/ai-analysis-tab.tsx
 5  components/listing-intelligence/ListingIntelligenceDashboard.tsx
 5  components/content-studio/phase1/agent-brand-kit.tsx
 5  app/portfolio/[slug]/page.tsx
 4  components/share-view.tsx
```

**Note**: template-renderer, vertical-renderer, facebook-renderer use `<img>` for canvas rendering and CANNOT use `next/image`. These 112 tags get `/* eslint-disable @next/next/no-img-element */`.

### 53 images missing `alt` (accessibility fix):
```
app/org/[slug]/page.tsx
app/lp/layout.tsx
app/dashboard/photo-culling/page.tsx (2)
app/portfolio/[slug]/page.tsx (5)
app/p/[slug]/PropertySiteClient.tsx (2)
components/studio/ai-analysis-tab.tsx
components/content-studio/content-preview.tsx (2)
components/content-studio/vertical-renderer.tsx (36)
components/content-studio/template-renderer.tsx (multiple)
```

---

## Issue 6: Zero Code Splitting (88 large components) — MEDIUM

**Problem**: Zero `next/dynamic` or `React.lazy` usage. 88 client components over 200 lines are all eagerly loaded.
**Impact**: Large initial JS bundle. Slow page loads.

### Top 15 components to lazy-load:
```
1235  components/content-studio/unified-creator.tsx
1224  app/dashboard/content-studio/video/VideoCreator.tsx
1197  app/p/[slug]/PropertySiteClient.tsx
1153  app/dashboard/leads/page.tsx
1149  components/content-studio/template-renderer.tsx
1036  app/founding/page.tsx
1034  app/dashboard/content-studio/analytics/page.tsx
1014  app/dashboard/virtual-tours/page.tsx
 958  app/dashboard/content-studio/email/EmailMarketing.tsx
 933  components/studio-client.tsx
 897  app/dashboard/staging/page.tsx
 875  app/page.tsx
 834  app/dashboard/cma/page.tsx
 825  app/dashboard/voiceover/page.tsx
 760  app/dashboard/content-studio/calendar/page.tsx
```

### Fix pattern:
```typescript
import dynamic from 'next/dynamic';

const VideoCreator = dynamic(() => import('./VideoCreator'), {
  loading: () => <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" /></div>,
});
```

---

## Issue 7: ESLint Warnings (168 warnings) — LOW-MEDIUM

**Problem**: 168 ESLint warnings across 111 files.
**Impact**: Build noise. Some are real bugs (exhaustive-deps).

### Breakdown:
```
94  @next/next/no-img-element      → fix with next/image (Issue 5)
32  img alt-text missing           → fix with alt="" (Issue 5)
16  react/no-unescaped-entities    → replace " with &quot; and ' with &apos;
 9  @typescript-eslint/no-unused-vars → remove unused imports
 4  react-hooks/exhaustive-deps    → add missing deps (REAL BUGS)
 9  Other                          → case by case
```

### 4 exhaustive-deps warnings (runtime bugs — fix immediately):
```
app/(authenticated)/settings/page.tsx          — missing 'fetchProfile'
app/portfolio/[slug]/page.tsx                  — missing 'loadPortfolio'
app/dashboard/virtual-tours/page.tsx           — missing 'loadTour'
app/dashboard/listing-intelligence/page.tsx    — missing 'loadSummary'/'goToNext'
```

---

## Issue 8: Backup Files (11 files) — LOW

**Problem**: 11 `.backup` files committed to repo.
**Impact**: Dead code, confusion, repo bloat.

### Files to delete:
```
app/page.tsx.backup
app/page.tsx.backup2
app/page.tsx.backup-20250118
app/page.tsx.backup-20260118
app/pricing/page.backup.tsx
app/api/listings/route.ts.backup
app/dashboard/content-studio/video/VideoCreator.tsx.backup
app/dashboard/renovation/page.tsx.backup
app/p/[slug]/PropertySiteClient.tsx.backup
app/p/[slug]/page.tsx.backup
apps/processor/src/index.ts.backup
```

---

## Issue 9: Duplicate Social Callback Routes (4 routes) — LOW

**Problem**: Legacy and new social callback routes coexist.
**Impact**: Confusion about which is active. Dead code.

### Duplicates:
```
app/api/social/callback/facebook/route.ts   ← legacy (delete if unused)
app/api/social/facebook/callback/route.ts   ← current

app/api/social/callback/linkedin/route.ts   ← legacy (delete if unused)
app/api/social/linkedin/callback/route.ts   ← current
```

Verify which is wired in `lib/social/oauth-config.ts` before deleting.

---

## Issue 10: Test Coverage (93 tests, 0 API tests) — LOW (for launch)

**Problem**: Only 5 test files covering utility functions. Zero tests for API routes, AI pipeline, social publishing.
**Impact**: No safety net for regressions. Acceptable for launch, critical post-launch.

### Current coverage:
```
__tests__/watermark.test.ts      (9 tests)
__tests__/schemas.test.ts        (37 tests)
__tests__/rate-limit.test.ts     (6 tests)
__tests__/utm.test.ts            (8 tests)
__tests__/limits.test.ts         (33 tests)
```

### Post-launch priority tests:
1. API route integration tests (enhance, upload, listing/prepare, marketing/trigger)
2. Social publish service mocked tests
3. Marketing pipeline end-to-end
4. Billing/Stripe webhook tests

---

## Execution Order

| Priority | Issue | Files | Est. Impact |
|----------|-------|-------|-------------|
| 1 | Zod validation (71 routes) | 71 | Security: 8→9 |
| 2 | AbortSignal.timeout (283 fetches) | ~40 | Reliability: 9→10 |
| 3 | catch blocks (168) | ~60 | Error Handling: 8→9 |
| 4 | console.log → logger (372) | ~30 + 1 new | Code Quality: 7→9 |
| 5 | Delete backup files (11) | 11 | Code Quality +0.5 |
| 6 | Delete duplicate routes (4) | 4 | Cleanup |
| 7 | exhaustive-deps (4 bugs) | 4 | Reliability bug fix |
| 8 | Missing alt text (53 images) | ~15 | Accessibility: 7→8 |
| 9 | next/image migration (~95 tags) | ~20 | Performance: 6→7 |
| 10 | Code splitting (top 15) | 15 | Performance: 7→8 |
| 11 | Unused vars + unescaped entities | ~20 | ESLint clean |

**Projected score after all fixes: 95/100**

---

## Score Projection

| Dimension | Current | After | Change |
|-----------|---------|-------|--------|
| Type Safety | 8 | 9 | +1 (ESLint warnings → 0) |
| Error Handling | 8 | 9 | +1 (catch blocks fixed) |
| Security | 8 | 10 | +2 (Zod on all routes) |
| Performance | 6 | 8 | +2 (next/image + code split) |
| Accessibility | 7 | 8 | +1 (alt text fixed) |
| Code Quality | 7 | 9 | +2 (logger + cleanup) |
| Testing | 6 | 6 | -- (post-launch) |
| Documentation | 9 | 9 | -- |
| Reliability | 9 | 10 | +1 (timeouts + deps bugs) |
| DevOps | 10 | 10 | -- |
| **TOTAL** | **82** | **98** | **+16** |
