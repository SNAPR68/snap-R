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

