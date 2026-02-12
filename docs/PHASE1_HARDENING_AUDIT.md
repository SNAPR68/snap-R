# SnapR Phase 1 Hardening Audit

**Document:** Phase 1 Hardening Audit for SnapR Automation OS  
**Purpose:** Infrastructure audit for Claude AI context / reference  
**Date:** 2026-02-10  

---

## 1. Stripe Integration

### Subscription Validation Logic
- **Location:** `app/api/stripe/webhook/route.ts`
- No pre-action subscription validation; webhooks update profiles when Stripe events fire.
- Plan limits defined in webhook:

```typescript
const PLAN_LIMITS: Record<string, { listings: number; photos: number }> = {
  'free': { listings: 3, photos: 30 },
  'photographer-ultimate': { listings: 0, photos: 75 },
  'photographer-complete': { listings: 0, photos: 75 },
  'agent-starter': { listings: 0, photos: 60 },
  'agent-complete': { listings: 0, photos: 75 },
  'starter': { listings: 10, photos: 50 },
  'professional': { listings: 30, photos: 75 },
  'agency': { listings: 50, photos: 75 },
  'pro': { listings: 30, photos: 75 },
  'team': { listings: 50, photos: 75 },
};
```

### Webhook Handlers
**File:** `app/api/stripe/webhook/route.ts`
- `checkout.session.completed` → subscription, human edits, add-on purchases
- `invoice.payment_succeeded` → resets `listings_used_this_month` to 0
- `invoice.payment_failed` → `subscription_status = 'past_due'`
- `customer.subscription.updated` → sync subscription status
- `customer.subscription.deleted` → downgrade to free plan
- Signature verification: `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`

### Stripe Customer Creation
- No explicit customer create; uses `customer_email: user.email` on checkout
- `stripe_customer_id` set on `checkout.session.completed` from `session.customer`

### Plan Metadata Handling
- Profiles table: `plan`, `role`, `listings_limit`, `photos_per_listing`, `stripe_customer_id`, `subscription_status`, `billing_cycle`
- Checkout metadata: `userId`, `plan`, `billing`, `listings`

### Billing Enforcement Middleware
- **None.** No middleware enforcing subscription before listing preparation.
- `/api/listing/prepare` does **not** check subscription or usage limits.

---

## 2. Usage Enforcement

### Usage Tracking Tables
- `profiles`: `listings_limit`, `listings_used_this_month`, `plan`, `subscription_status`
- `api_costs`: cost logging (not subscription limits)
- `addon_purchases`: addon purchase records

### Logic Counting Prepared Listings
- **Location:** `app/listings/new/page.tsx` (client-side listing creation)
- Counts `listings.created_at` within current month (NOT preparation_status)
- Increments `listings_used_this_month` on insert
- Webhook resets `listings_used_this_month` on `invoice.payment_succeeded`

### Limits Enforced in API Routes
| Route | Enforcement |
|-------|-------------|
| `/api/listing/prepare` | **None** |
| `/api/listing/status` | **None** |
| `/api/listings` | **None** |
| `/api/enhance` | Ownership only; no plan/limit checks |
| Listing creation (`app/listings/new`) | Yes – checks monthly listings count |

Note: `lib/content/limits.ts` is for Content Studio (posts, captions) only, not listings.

---

## 3. API Layer

### `/api/listing/prepare`
**File:** `app/api/listing/prepare/route.ts`
- POST: `{ listingId, priority? }`
- Auth: User session or `x-admin-key` (WORKER_ADMIN_KEY / PREPARE_ADMIN_KEY)
- Flow: Create job → set `preparation_status = 'preparing'` → POST worker `/process`
- Returns: `{ success: true, jobId }`
- **No subscription or usage limit checks**

### `/api/listing/status`
**File:** `app/api/listing/status/route.ts`
- GET: `?listingId=` – returns listing status, jobId, jobStatus, photos, history
- PATCH: body `{ listingId, status?, heroPhotoId? }` – **can mutate preparation_status** (user-initiated)

### Middleware Wrapping These Routes
**File:** `middleware.ts`
- No specific rule for `/api/listing/*`; falls under default (100 req/min)
- No subscription or billing enforcement

---

## 4. Worker Code

### Job Processing Entry Point
**File:** `apps/processor/src/index.ts`
- HTTP: `POST /process` with `{ jobId, listingId, userId, priority, timestamp }`
- Called by Next.js `prepare` route: `fetch(\`${WORKER_URL}/process\`, { body: JSON.stringify(...) })`

### Idempotency Logic
- Checkpoint in KV: `createCheckpoint`, `getCheckpoint`
- **No true idempotency:** checkpoint used for resume; does not prevent duplicate processing
- No “job already running” guard

### Status Updates
- `updateJobStatus(jobId, 'processing')` at start
- `updateJobStatus(jobId, 'completed')` on success
- `updateJobStatus(jobId, 'failed')` on error
- `updateListingPreparationStatus(listingId, 'prepared' | 'failed')` at completion

### Cost Tracking
- **Worker does NOT call `logApiCost` or write to `api_costs`**
- `lib/cost-logger.ts` used by `/api/enhance`, photo-cull, etc. – not worker
- Worker does **not** update `listings.total_cost_cents`

### Retry Logic
- `message.retry({ delaySeconds: 60 })` on catch
- HTTP `/process` uses mock message; `retry` is no-op unless using Cloudflare Queue

---

## 5. Database Schema (Live Migrations)

### Listings Table
- **Migration:** `202602100000_listing_preparation_and_marketing_status.sql`
- Columns: `preparation_status`, `marketing_status`, `processing_started_at`, `processing_completed_at`, `total_cost_cents`
- Base: `database/schema.sql` – `user_id`, `title`, `address`, etc.

### Jobs Table
- Columns: `id`, `user_id`, `listing_id`, `variant`, `metadata`, `error`, `completed_at`, `status`, `created_at`, `updated_at`
- `status` default: `'queued'`
- **No index on `listing_id`** (status API queries by listing_id)

### Photos Table
- Columns: `id`, `listing_id`, `job_id`, `raw_url`, `processed_url`, `processed_at`, `variant`, `error`, `status`, etc.

### Subscription/Usage Tables
- `profiles` – created by trigger + auth callback; columns include `plan`, `credits`, `listings_limit`, `listings_used_this_month`, `stripe_customer_id`, `subscription_status`, `billing_cycle` (no single migration with full definition)
- `addon_purchases`, `human_edit_orders`

---

## 6. Environment Variables Referenced in Code

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin/worker operations |
| `WORKER_URL` | Prepare route → worker (default: `http://127.0.0.1:8787`) |
| `WORKER_ADMIN_KEY` | Admin bypass for prepare |
| `PREPARE_ADMIN_KEY` | Admin bypass for prepare |
| `OPENAI_API_KEY` | Worker, AI routes |
| `REPLICATE_API_TOKEN` | Worker |
| `NEXT_PUBLIC_BASE_URL` | Stripe redirects |
| `RESEND_API_KEY` | Critical alerts (cost-logger) |
| `CRON_SECRET` | Cron routes |
| `ANALYSIS_CONCURRENCY`, `ANALYSIS_BATCH_DELAY_MS` | Worker |

`env.template` does **not** list: `WORKER_URL`, `WORKER_ADMIN_KEY`, `PREPARE_ADMIN_KEY`, `STRIPE_WEBHOOK_SECRET`.

---

## Gaps and Recommendations

1. **Missing:** Subscription/usage check before `/api/listing/prepare`
2. **Missing:** Index on `jobs(listing_id)` for status API
3. **Missing:** Worker cost logging + `listings.total_cost_cents` updates
4. **Missing:** Idempotency (job dedup) in worker processing
5. **Inconsistency:** PATCH `/api/listing/status` allows user to mutate `preparation_status`
6. **Inconsistency:** `lib/ai/listing-engine/index.ts` mutates `preparation_status` (sync/legacy path)
7. **Confusion:** `/api/listings/status` (plural) updates `marketing_status`, not `preparation_status`
8. **Inconsistency:** Usage based on listing creation count, not prepared count

---

## Direct Mutations of `listing.preparation_status` (Outside Worker)

| Location | Mutation | Context |
|---------|----------|---------|
| `app/api/listing/prepare/route.ts` | `'preparing'` | Job creation |
| `app/api/listing/status/route.ts` (PATCH) | Any valid status | User-initiated |
| `lib/ai/listing-engine/index.ts` | `updateListingStatus`, `finalizeListing` | Legacy sync engine |
| `apps/processor/src/lib/supabase-client.ts` | `'prepared'` \| `'failed'` | Worker completion |

---

## Deprecated

- `POST /api/listing/prepare-stream` → Returns **410 Gone**; use `POST /api/listing/prepare` + poll `GET /api/listing/status`
