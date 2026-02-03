# SnapR AI Pipeline Forensic Audit (2026-02)
**Generated:** 2026-02-01  
**Scope:** Listing preparation pipeline (analysis, strategy, tool routing, enhancement execution, QA, and finalization)

---

## Executive Summary
**Status:** ⚠️ **IMPROVING, NOT YET PRODUCTION-GRADE**  
**Current Rating:** **7.1 / 10**  
**Target Rating:** **9.5+**

### Top 3 Risks Blocking 9.5+
1. **SAM availability and stability**: Mask generation fails when model versions are not permitted or return unexpected payloads.
2. **Replicate rate limiting**: Throttling causes tool failures under normal usage unless requests are queued and backoff is enforced.
3. **Masked tools fallback behavior**: Full-frame fallbacks can damage images if mask generation fails. Manual lawn now blocks, batch still depends on inpaint config.

---

## 1) End-to-End Pipeline Flow (Current)
**Entry:** `app/api/listing/prepare-stream/route.ts` → `lib/ai/listing-engine/prepareListing()`

### Phase 1 — Fetch Photos
- Source: `photos` table; uses signed URLs for storage paths.
- External URLs are used directly.

### Phase 2 — Photo Analysis (GPT-4o Vision)
- File: `lib/ai/listing-engine/photo-intelligence.ts`
- Determines: photo type, sky/lawn visibility, window exposure, lighting, clutter, and tool suggestions.
- Controlled by `ANALYSIS_CONCURRENCY` and `ANALYSIS_BATCH_DELAY_MS`.

### Phase 3 — Locked Presets
- File: `lib/ai/listing-engine/preset-locker.ts`
- Ensures consistency (sky, twilight, lawn, staging).

### Phase 4 — Strategy Builder
- File: `lib/ai/listing-engine/strategy-builder.ts`
- Maps analysis → tool list for each photo.
- Enforces thresholds: `minSkyVisiblePercent`, `minLawnVisiblePercent`, etc.

### Phase 5 — Batch Processing
- File: `lib/ai/listing-engine/batch-processor.ts`
- Applies tools in order, runs QA, retries with lower guidance, applies brightness guard.

### Phase 6 — Consistency Pass
- File: `lib/ai/listing-engine/consistency.ts`

### Phase 7 — Validation
- File: `lib/ai/listing-engine/quality-validator.ts`
- Uses OpenAI for QC or quick validation.

### Phase 8 — Finalize + Persist
- `preparation_metadata` now stores:
  - tool audit, decision audit, cost breakdown
  - **phase timings** (new)

---

## 2) Decision Logic (What is Strategized)

### Photo Analysis Inputs
- `photoType`, `heroScore`, `lighting`, `needsHDR`
- `hasSky`, `skyVisible`, `skyQuality`, `skyNeedsReplacement`
- `hasLawn`, `lawnVisible`, `lawnQuality`, `lawnNeedsRepair`
- `windowExposureIssue`, `hasVisibleWindows`
- `clutterLevel`, `roomEmpty`

### Tool Selection Rules (Current)
- **Sky replacement:** exterior + visible sky + `skyNeedsReplacement`
- **Lawn repair:** exterior + visible lawn + `lawnNeedsRepair`
- **Window masking:** interior + `windowExposureIssue`
- **HDR:** `needsHDR` or dark/mixed lighting
- **Declutter:** `clutterLevel` moderate/heavy
- **Staging:** `roomEmpty`
- **Twilight:** hero exterior is preferred target

### Notes
- Tool selection is now **explicit** (flags from analysis) rather than keyword guessing.
- This is correct and should remain the default for predictable behavior.

---

## 3) Tool Routing (What Tools Are Called)

### Router
File: `lib/ai/router.ts`
- Sky → `replicate.skyReplacement(...)`
- Twilight → `replicate.virtualTwilight(...)`
- Lawn → `replicate.lawnRepair(..., requireMask: true)` (manual)

### Batch Processing
File: `lib/ai/listing-engine/batch-processor.ts`
- Routes tool execution to providers (Replicate, AutoEnhance, Sharp)
- Applies QA gates and retries
- Uses locked presets and tool order

### Masked Tools (Sky/Lawn)
File: `lib/ai/providers/sam-masks.ts`
- Grounded SAM is used for sky/lawn/window masks
- Mask output normalization added for multiple output shapes

---

## 4) Enhancement Execution (How Changes Are Applied)

### Replicate Models
- **Flux Kontext** for instruction edits (sky, twilight, lawn, staging, etc.)
- **Flux Fill** for inpainting with masks
- **Real-ESRGAN** for hero upscaling

### Mask Enforcement
- Manual lawn requires mask (no full-frame fallback).
- Batch inpainting depends on `AI_INPAINT_PROVIDER` and `AI_REQUIRE_MASK_FOR_INPAINT`.

### Quality Gates
- OpenAI scoring + structure integrity checks for sensitive tools.
- Brightness guard prevents darkened outputs.
- Lower guidance retry on failures.

---

## 5) Current Failures Observed (From Logs)

1) **SAM 422 errors**  
`Invalid version or not permitted` → mask generation fails  
Impact: sky/lawn/window tools skip or fall back.  

2) **Replicate 429 throttling**  
Low credit reduces rate limit to 6/min, causing tool failures.  
Impact: random failures during manual or batch processing.

3) **False failure: "No enhancements applied"**  
Previously flagged when no tools were required.  
Now corrected to pass as valid.

---

## 6) Observability (Audit Trail)

### Stored per listing
- `preparation_metadata.decisionAudit`
- `preparation_metadata.photoAudit`
- `preparation_metadata.costBreakdown`
- `preparation_metadata.phaseTimingsMs` (fetch/analysis/strategy/processing/etc.)

### What is still missing
- A UI panel to surface tool-by-tool audit details (admin-only) during a run.
- A consolidated listing-level timeline report (start/end per phase).

---

## 7) Scorecard

### Strengths
- Deterministic preset routing
- Locked listing-level presets for consistency
- Robust QA gating (quality + structure + brightness)
- Phase-level timing captured for optimization

### Weak Points
- SAM availability is not guaranteed
- Replicate throttling remains a runtime risk
- Masked tools can still be blocked by model permissions

**Current rating:** **7.1 / 10**

---

## 8) Required Actions to Reach 9.5+

### A. Fix SAM Once and For All (Mandatory)
1) Verify Grounded SAM access (Replicate account).
2) If access is unreliable, replace with **self-hosted SAM2** or a provider with guaranteed access.
3) Enforce **mask-only** changes for sky/lawn in batch (no full-frame fallback).

### B. Eliminate 429 Failures (Mandatory)
1) Central queue + backoff for Replicate (in progress).
2) Queue in Worker for batch processing in production.

### C. Add Tool-Level Performance Budget
- Enforce max retries per tool with safe fallback (skip, not smear).

### D. Tighten Prompt + Guidance Profiles
- Lower lawn guidance, higher staging guidance.
- Keep twilight bright and cloud-free by default.

---

## 9) Final Rating
**7.1 / 10 (current)**  
**9.5+ achievable** after SAM access + rate-limit hardening are resolved.
