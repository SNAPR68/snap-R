# Session Handoff — 95+ Score Push In Progress (March 6, 2026)

## Current State

**Honest Audit Score**: ~62/100 (fresh re-audit showed original 74 was inflated)
**Branch**: `feature/phase-f-launch-polish` (23 files modified, uncommitted — Wave 1 type safety)
**PR**: #90 OPEN (committed Phase F base: cleanup, loading states, CMA fix, alt text)
**Production**: snap-r.com running Phase E (commit `41f277fa`, PR #89 merged)
**Target**: Push score to 95+

---

## What's Done (Phases A–E + Phase F base, all committed)

| PR | Phase | Status |
|----|-------|--------|
| #85 | Phase A — Production hardening (auth, security, reliability) | Merged |
| #86 | Phase B — GTM readiness (upgrade nudges, usage limits, SEO) | Merged |
| #87 | Phase C — Scale infrastructure (retry, error handling, type safety) | Merged |
| #88 | Phase D — Aha moment (onboarding 7→3, timeouts, dead routes) | Merged |
| #89 | Phase E — Launch readiness (pricing, sample listing, auth UX, testimonials) | Merged + Deployed |
| #90 | Phase F base — Cleanup, loading states, CMA fix, alt text | OPEN (committed `09b11eac`) |

### Phase F Base (Committed in PR #90)
- [x] Deleted Sentry example page (was leaking org/project ID)
- [x] Removed all backup files (7 `.bak` + 2 `page-backup*.tsx`, 26K+ lines)
- [x] Added `loading.tsx` to 7 dashboard sub-routes (analytics, broker, content-studio, leads, listings, settings, studio)
- [x] CMA page full rewrite — removed all `any`, unused state, converted 2 `<img>` to `next/image`
- [x] Facebook renderer — added `alt=""` to all 30+ `<img>` tags
- [x] Cleaned up `console.log` in `app/p/[slug]/page.tsx`
- [x] Updated EXECUTION_CHANGELOG.md

---

## Wave 1 — Type Safety Blitz (23 files modified, UNCOMMITTED)

4 parallel agents reduced `any` count from ~410 → 67. These 23 files are modified but **not staged or committed**:

### Agent 1: AI Engine Files (28+ any removed)
- `lib/ai/listing-engine/photo-intelligence.ts` — Added `RawPhotoAnalysis`, `NormalizedRawForToolValidation`, `ReplicateOutput` interfaces
- `lib/ai/listing-engine/batch-processor.ts` — Added `AutoEnhanceOptions`, typed `supabase: SupabaseClient`
- `lib/ai/listing-engine/quality-validator.ts` — Added `RawValidationResult` interface
- `lib/ai/listing-engine/index.ts` — Added `PhotoAuditEntry`, `DecisionAuditEntry` interfaces

### Agent 2: Admin Pages (28 any removed)
- `app/admin/command-center/page.tsx` — Added `ActivityEvent`, `CostRecord`, `ErrorRecord`, `HumanEditOrder`, `ProfileRecord`
- `app/admin/users/page.tsx` — Added `ApiCostRecord`, `UserProfile`
- `app/admin/contacts/page.tsx` — Added `ContactSubmission`
- `app/admin/revenue/page.tsx` — Added `ProfileRecord`
- `app/admin/logs/page.tsx` — Added `ErrorLog`
- `app/admin/analytics/page.tsx` — Added `CostRecord`, `ProfileRecord`, `AnalyticsEvent`

### Agent 3: Dashboard Pages (all any removed)
- `app/dashboard/virtual-tours/page.tsx`
- `app/dashboard/ai-descriptions/page.tsx`
- `app/dashboard/listing-intelligence/page.tsx`
- `app/dashboard/voiceover/page.tsx`
- `app/dashboard/staging/page.tsx`
- `app/dashboard/campaigns/page.tsx` — Added `ContentData`, `TabId`, used `LucideIcon`

### Agent 4: Content Studio + Misc (16 any removed)
- `components/content-studio/instagram-post-creator.tsx` — `ListingPhoto` interface
- `components/content-studio/facebook-post-creator.tsx` — `ListingPhoto` interface
- `components/content-studio/phase1/post-type-selector.tsx` — `icon: LucideIcon`
- `components/dashboard-home.tsx` — `icon: LucideIcon`
- `lib/ai/photo-culler.ts` — `RawPhotoAnalysis`, `RawDuplicateGroup`
- `app/(authenticated)/jobs/page.tsx` — `JobPhoto`, `JobListing`, `JobRecord`

### Partially Fixed
- `functions/replicate.ts` — `extractUrl()` partially fixed (object section done, array section still has casts)

---

## Remaining Work for 95+ Score

### 1. Fix Remaining 67 `any` Types (48 files)

Top files by count:
```
3  lib/ai/listing-engine/window-masking.ts        — `as any` on replicate.run results + normalizeOutputUrl
3  lib/ai/listing-engine/multi-pass-twilight.ts   — `as any` on replicate.run results + normalizeOutputUrl
3  app/api/voiceover/route.ts                     — `style as any`, `voiceId as any`
2  lib/renovation/service.ts                      — `segmentationData?: any`, `Promise<any>`
2  lib/ai/providers/autoenhance.ts
2  lib/ai/listing-engine/provider-router.ts
2  app/dashboard/settings/notifications/page.tsx  — `(prefs as any)[item.key]`
2  app/dashboard/photo-culling/page.tsx            — `listing: any` in filter/map
2  app/dashboard/content-studio/bulk/BulkCreator.tsx — `listing: any`
2  app/api/virtual-tours/scenes/route.ts           — `supabase: any`, `updateData: any`
2  app/api/virtual-tours/route.ts                  — `scene: any`, `updateData: any`
2  app/api/renovation/route.ts                     — `Promise<any>`, `result: any`
2  app/api/portfolio/items/route.ts                — `dbUpdates: any`, `item: any`
2  app/api/jobs/[id]/route.ts                      — `(a: any, b: any)` sort comparator, `payload: any`
2  app/api/ai/photo-cull/route.ts                  — `(p: any)` in filter
```

Plus 33 more files with 1 `any` each (see grep output in session context).

**Pattern for Replicate files** (window-masking, multi-pass-twilight, functions/replicate):
```typescript
// Before:
}) as any;
if (typeof (result as any).url === 'function') return (result as any).url();

// After:
}) as { url?: () => string } | string | string[];
// Or use a shared normalizeOutputUrl that accepts `unknown`:
function normalizeOutputUrl(output: unknown): string {
  if (!output) throw new Error('No output');
  const result = Array.isArray(output) ? output[0] : output;
  if (typeof result === 'string') return result;
  const obj = result as Record<string, unknown>;
  if (typeof obj.url === 'function') return (obj.url as () => string)();
  if (typeof obj.url === 'string') return obj.url;
  return String(result);
}
```

**Approach**: Use Write tool for files with 2+ `any`. Use Edit tool for files with 1 `any`. Always fix ALL `any` in a file in one pass (check-any-changed hook blocks otherwise).

### 2. Zod Validation (20/163 routes = 12%)

Only 20 API routes have Zod. Priority routes to add Zod:
```
app/api/enhance/route.ts
app/api/upload/route.ts
app/api/listing/prepare/route.ts
app/api/listing/status/route.ts
app/api/campaigns/route.ts
app/api/share/route.ts
app/api/download-all/route.ts
app/api/video/generate/route.ts
app/api/video/voiceover/route.ts
app/api/renovation/route.ts
app/api/staging/route.ts
app/api/virtual-tours/route.ts
app/api/virtual-tours/scenes/route.ts
app/api/portfolio/items/route.ts
app/api/tour/[slug]/route.ts
app/api/property-site/route.ts
app/api/ai/generate-description/route.ts
app/api/ai/photo-cull/route.ts
app/api/listing-intelligence/analyze/route.ts
app/api/prepare-notification/route.ts
```

Pattern: Add `z.object({...})` schema + `schema.safeParse(body)` at top of POST handler. Return 400 with `parsed.error.flatten()`.

### 3. Convert `<img>` to `next/image` (173 raw `<img>` tags)

Key high-impact pages (LCP/performance):
- `app/page.tsx` (landing page hero)
- `app/pricing/page.tsx`
- `app/academy/**` pages
- `components/studio-client.tsx` (photo canvas)
- Dashboard pages with listing thumbnails

Note: Canvas-rendered components (`facebook-renderer.tsx`) CANNOT use next/image — already have eslint-disable.
For dynamic URLs (Supabase signed URLs, Cloudinary), use `unoptimized` prop.

### 4. Add `loading.tsx` to 55 Dashboard Routes

8 already exist. 55 routes still missing. Use consistent skeleton pattern:
```tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

### 5. Add Scoped `error.tsx` Boundaries (3 exist, need ~10 more)

Current: `app/error.tsx`, `app/dashboard/error.tsx`, `app/admin/error.tsx`
Need:
- `app/checkout/error.tsx`
- `app/onboarding/error.tsx`
- `app/p/[slug]/error.tsx` (public property sites)
- `app/tour/[slug]/error.tsx`
- `app/open-house/[slug]/error.tsx`
- `app/book/[slug]/error.tsx`
- `app/(authenticated)/error.tsx`
- `app/dashboard/content-studio/error.tsx`
- `app/dashboard/studio/error.tsx`
- `app/dashboard/leads/error.tsx`

### 6. Skip-Nav Component

Create `components/skip-nav.tsx` and add to `app/layout.tsx`:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 ...">
  Skip to main content
</a>
```
Add `id="main-content"` to main content wrapper.

### 7. Code Splitting with `next/dynamic`

Heavy components to split:
- `components/studio-client.tsx` (800+ lines)
- `app/dashboard/staging/page.tsx` (891 lines)
- `app/dashboard/content-studio/video/VideoCreator.tsx`
- `remotion/` compositions (only load when video is being created)

---

## Audit Score Projection

| Dimension | Current | After Fixes | Target |
|-----------|---------|-------------|--------|
| Type Safety | 5/10 | 9/10 | Eliminate all 67 `any` |
| Security | 5/10 | 8/10 | Add Zod to 20+ routes (12%→25%+) |
| Error Handling | 5/10 | 8/10 | 10 scoped error boundaries |
| SEO & Meta | 8/10 | 8/10 | Already solid |
| Accessibility | 5/10 | 8/10 | Skip-nav + alt text done + focus styles |
| Performance | 5/10 | 8/10 | next/image, loading.tsx, code splitting |
| User Experience | 6/10 | 8/10 | Loading states everywhere |
| Billing | 8/10 | 8/10 | Already solid |
| Email | 7/10 | 7/10 | Already solid |
| Production | 7/10 | 9/10 | Cleanup done, error boundaries |
| **Total** | **~62/100** | **~91/100** | **95+** |

---

## Workflow to Resume

```bash
# 1. You're on feature/phase-f-launch-polish with 23 uncommitted files (Wave 1)
git status

# 2. Fix remaining 67 `any` types across 48 files
#    Start with the 3-count files (window-masking, multi-pass-twilight, voiceover)
#    Use Write for files with 2+ any, Edit for files with 1 any
#    ALWAYS fix ALL any in a file in one pass (check-any-changed hook)

# 3. Add Zod validation to 20 priority API routes
#    Pattern: z.object schema + safeParse + 400 error

# 4. Add loading.tsx to 55 remaining dashboard routes
#    Use batch approach — all are identical skeleton components

# 5. Add 10 scoped error.tsx boundaries

# 6. Create skip-nav component + wire into layout

# 7. Convert key <img> to next/image (focus on landing, pricing, academy)

# 8. Add next/dynamic code splitting for heavy components

# 9. Run checks
npx tsc --noEmit
npx next build  # catches ESLint too

# 10. Stage Wave 1 + all new fixes, commit, push
git add <files>
git commit -m "feat: 95+ score push — type safety, Zod, loading states, error boundaries, accessibility"
git push origin feature/phase-f-launch-polish

# 11. PR #90 already open — push updates it automatically

# 12. After merge, deploy
vercel --prod --yes
```

---

## Key Technical Context

### ESLint Hook — Critical Pattern
Hook fires after **every** Edit tool call. Import + first usage must be in the **same** edit.
- **Safe approach**: use **Write** to rewrite full files when adding imports + state + JSX together
- **check-any-changed hook**: If you touch a file with pre-existing `any` types, the hook blocks until ALL `any` in that file are fixed in the same pass

### Pre-Commit Hook
Blocks commits on structural changes unless `EXECUTION_CHANGELOG.md` is updated and staged.

### Stale Worktree Warning
`.claude/worktrees/nervous-almeida/` may exist with stale file copies. Always use `--exclude-dir=.claude` in grep commands to avoid inflated counts.

### Deployment
```
feature-branch → PR → merge to main → vercel --prod --yes
```
`main` is branch-protected. Direct push blocked.

### Demo Account
- Email: demo@snap-r.com / Password: DemoVideo2026x
- Listing ID: 2d032018-af8b-4cef-a3f2-1a69f12923c8
