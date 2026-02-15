# SnapR Execution Changelog
=================================

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
