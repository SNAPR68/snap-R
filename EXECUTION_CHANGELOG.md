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
