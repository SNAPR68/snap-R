---
phase: 01-remotion-foundation
plan: 02
subsystem: api
tags:
  - remotion
  - lambda
  - video-api
  - zod-validation
  - aws

dependency_graph:
  requires:
    - phase: 01-01
      provides: remotion-composition, video-render-jobs-table, video-validation-schemas
  provides:
    - video-generation-api
    - video-status-polling-api
    - vercel-function-configs
  affects:
    - video-ui-integration
    - video-pipeline-integration

tech_stack:
  added:
    - "@remotion/lambda@4.0.424 (client imports)"
  patterns:
    - structured-error-responses
    - terminal-state-caching
    - ownership-verification

key_files:
  created:
    - app/api/video/generate/route.ts
    - app/api/video/status/route.ts
  modified:
    - vercel.json
    - EXECUTION_CHANGELOG.md

key_decisions:
  - "Cache terminal states (completed/failed) in database to avoid unnecessary Lambda API calls on status polling"
  - "Use adminSupabase() for ownership verification instead of RLS to ensure precise user_id + render_id matching"
  - "Set maxDuration 60s for generate (Lambda trigger fast), 30s for status (progress query fast)"
  - "Return 503 (service unavailable) for missing Remotion env vars instead of 500 (server error) - indicates config issue not code bug"

patterns_established:
  - "Terminal state optimization: check DB first, only query Lambda for active renders"
  - "Structured error responses: all error paths return { error, code?, details? } JSON with appropriate HTTP status"
  - "Ownership verification: adminSupabase query with user_id + resource_id for access control"

requirements_completed:
  - REND-02
  - REND-03
  - REND-06

duration: 4min
completed: 2026-02-19
---

# Phase 01 Plan 02: Video API Routes Summary

**Video generation and status polling API with Lambda integration, Zod validation, ownership verification, and terminal state caching**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-02-19T08:34:02Z
- **Completed:** 2026-02-19T08:38:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- POST /api/video/generate triggers Remotion Lambda renders with full validation and error handling
- GET /api/video/status polls render progress with terminal state caching optimization
- All error paths return structured JSON (no 500 crashes on render failures)
- Vercel function configs ensure appropriate timeouts and memory allocation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create POST /api/video/generate route** - `287d5ba` (feat)
2. **Task 2: Create GET /api/video/status route and update vercel.json** - `34f3ec6` (feat)

## Files Created/Modified

**Created:**
- `app/api/video/generate/route.ts` - Video generation endpoint: authenticates, validates, fetches listing, triggers Lambda, stores job
- `app/api/video/status/route.ts` - Status polling endpoint: validates, authenticates, verifies ownership, queries Lambda, updates DB

**Modified:**
- `vercel.json` - Added function configs: 60s/1024MB for generate, 30s/512MB for status
- `EXECUTION_CHANGELOG.md` - Documented Phase 1 Remotion Foundation API layer

## What Was Built

### Task 1: POST /api/video/generate Route

Created the entry point for all video renders from the UI.

**Flow:**
1. Authenticate user via `await createClient()` then `getUser()` (401 if unauthorized)
2. Validate input with `generateVideoSchema.parse()` (400 on ZodError)
3. Fetch listing with photos via `adminSupabase()` (404 if not found)
4. Validate listing has photos (400 if empty array)
5. Check all 6 `REMOTION_*` env vars (503 if any missing)
6. Trigger Lambda render via `renderMediaOnLambda()` with composition, input props, codec
7. Store job in `video_render_jobs` table (non-fatal if insert fails - render already triggered)
8. Return `{ renderId, bucketName }` (200)

**Error handling:**
- ZodError → 400 with flattened details
- No user → 401
- Listing not found → 404
- No photos → 400
- Missing env vars → 503 with details
- Lambda/DB errors → 500 with structured error

**Key implementation details:**
- Used `AwsRegion` type assertion for region env var
- Mapped `listing.photos` to extract `processed_url` and filter nulls
- Generated unique `outName`: `${listingId}-${aspectRatio.replace(':', 'x')}-${timestamp}.mp4`
- Set Lambda params: codec h264, imageFormat jpeg, maxRetries 3, privacy public
- No `any` types - all error handling uses `catch (error: unknown)` with instanceof guard

**Commit:** `287d5ba`

### Task 2: GET /api/video/status Route & Vercel Config

Created the status polling endpoint with terminal state caching optimization.

**Flow:**
1. Extract `renderId` from query params and validate with `videoStatusSchema` (400 if invalid)
2. Authenticate user (401 if unauthorized)
3. Verify ownership via `adminSupabase()` query with `render_id` + `user_id` (404 if not found)
4. **Optimization:** Check job status in DB first:
   - If `status === 'completed'` → return cached result immediately (skip Lambda call)
   - If `status === 'failed'` → return cached error immediately (skip Lambda call)
5. If status is `rendering` or `queued`, query Lambda via `getRenderProgress()`
6. Handle completion: update DB with `video_url`, `render_time_ms`, `cost_cents` (estimated $0.50/min)
7. Handle failure: update DB with error message
8. Return structured status: `{ renderId, status, progress, videoUrl?, renderTime?, error? }`

**Error handling:**
- Invalid renderId → 400 with ZodError details
- No user → 401
- Job not found or user mismatch → 404
- Missing env vars → 503
- Lambda/DB errors → 500 with structured error

**Vercel function config:**
- `app/api/video/generate/route.ts`: 60s timeout, 1024MB memory (Lambda trigger is fast)
- `app/api/video/status/route.ts`: 30s timeout, 512MB memory (progress query is fast)

**Key implementation details:**
- Terminal state caching eliminates redundant AWS API calls for completed/failed renders
- Used explicit `VideoRenderJob` and `RenderProgressResponse` interfaces (no any types)
- Cost estimation: `(render_time_ms / 1000) * 0.5` cents per second
- Database updates include `updated_at` timestamp
- Progress value returned as number 0-1 from Lambda `overallProgress`

**Commit:** `34f3ec6`

## Decisions Made

**1. Terminal state caching in database**
- **Rationale:** Avoid unnecessary Lambda API calls for renders that have already completed or failed
- **Implementation:** Check `job.status` in DB before calling `getRenderProgress()`
- **Impact:** Reduces AWS costs and latency for status polling on finished renders

**2. Use adminSupabase() for ownership verification**
- **Rationale:** Precise control over access check with `user_id` + `render_id` matching
- **Alternative:** RLS policies (rejected - service role needs write access for worker, explicit check clearer)

**3. Return 503 for missing env vars instead of 500**
- **Rationale:** 503 (Service Unavailable) indicates configuration issue, not code bug
- **Impact:** Clearer error categorization for ops debugging

**4. Vercel timeout allocation**
- **Generate:** 60s (Lambda render trigger is fast ~1-2s, extra headroom for safety)
- **Status:** 30s (progress query is fast ~500ms, minimal timeout needed)
- **Rationale:** Avoid timeout waste - status checks should be near-instant

## Deviations from Plan

None - plan executed exactly as written.

All requirements from the plan were implemented:
- POST /api/video/generate validates, authenticates, fetches listing, triggers Lambda, stores job ✓
- GET /api/video/status polls Lambda, updates DB, returns structured status ✓
- Render failures return structured error JSON (not 500 crash) ✓
- Vercel function config sets appropriate timeouts and memory ✓
- No `any` types ✓
- All error paths return structured JSON ✓

## Issues Encountered

None. TypeScript compilation, JSON validation, and all verification steps passed on first attempt.

## User Setup Required

**AWS credentials and Remotion environment variables must be configured.**

The following env vars are checked by both API routes:
- `REMOTION_AWS_REGION` (e.g., `us-east-1`)
- `REMOTION_AWS_ACCESS_KEY_ID`
- `REMOTION_AWS_SECRET_ACCESS_KEY`
- `REMOTION_LAMBDA_FUNCTION_NAME`
- `REMOTION_S3_BUCKET_NAME`
- `REMOTION_LAMBDA_SERVE_URL`

**Note:** Per important_context, these env vars are already set in `.env.local` from Plan 01-01 deployment. No additional setup required.

## Self-Check: PASSED

**Files created:**
```bash
✓ app/api/video/generate/route.ts
✓ app/api/video/status/route.ts
✓ .planning/phases/01-remotion-foundation/01-02-SUMMARY.md
```

**Files modified:**
```bash
✓ vercel.json (generate route config: 60s/1024MB)
✓ vercel.json (status route config: 30s/512MB)
✓ EXECUTION_CHANGELOG.md (Phase 1 Remotion Foundation entries)
```

**Commits:**
```bash
✓ 287d5ba: feat(01-02): create POST /api/video/generate route
✓ 34f3ec6: feat(01-02): create GET /api/video/status route and update vercel.json
```

**TypeScript compilation:**
```bash
✓ npx tsc --noEmit — 0 errors
```

**No any types:**
```bash
✓ grep -n "any" app/api/video/generate/route.ts — No matches
✓ grep -n "any" app/api/video/status/route.ts — No matches
```

**vercel.json validation:**
```bash
✓ Valid JSON
✓ Both video route configs present with correct timeouts
```

**Key imports verified:**
```bash
✓ renderMediaOnLambda imported in generate route
✓ getRenderProgress imported in status route
✓ generateVideoSchema/videoStatusSchema imported
✓ adminSupabase imported in both routes
✓ createClient (async) imported in both routes
```

## Next Phase Readiness

**Ready for UI integration:**
- POST /api/video/generate can be called from video creation UI
- GET /api/video/status can be polled every 2-5 seconds for progress
- Both routes return consistent structured responses

**Database ready:**
- video_render_jobs table tracks all renders
- Status transitions: queued → rendering → completed/failed
- Cost tracking columns populated on completion

**Remotion Lambda configured:**
- TestVideo composition deployed and ready to render
- Lambda function, S3 bucket, and serve URL configured
- All env vars validated on every request

**Blockers:** None

**Next steps (future phases):**
- UI components for video creation and progress display
- Integration with marketing pipeline (auto-generate videos for listings)
- Additional video templates beyond TestVideo

---
*Phase: 01-remotion-foundation*
*Plan: 02*
*Completed: 2026-02-19*
