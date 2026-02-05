# SnapR Battle Plan: Reliability & Competitive Dominance

**Created**: February 2025
**Goal**: Fix all critical bugs, optimize performance, beat Fotello
**Timeline**: 6 weeks to production-ready

---

## Executive Summary

SnapR has **more features than Fotello** but suffers from reliability issues that undermine user trust. This plan addresses:
- **47 bugs identified** (12 critical, 15 high, 20 medium)
- **Security vulnerabilities** (RLS gaps, unsigned requests)
- **Performance issues** (N+1 queries, memory leaks)
- **Missing competitive features** (HDR blending, payment portal)

---

## Phase 1: Critical Bug Fixes (Week 1)

### Day 1-2: Show-Stopper Bugs

#### 1.1 Fix AUTOENHANCE_API_KEY Bug
**File**: `/apps/processor/src/index.ts:13`
**Priority**: CRITICAL | **Effort**: 5 minutes

```typescript
// WRONG (current)
AUTOENHANCE_API_KEY: env.REPLICATE_API_TOKEN || '',

// CORRECT
AUTOENHANCE_API_KEY: env.AUTOENHANCE_API_KEY || '',
```

Also add to `/apps/processor/src/types.ts`:
```typescript
export interface Env {
  // ... existing fields
  AUTOENHANCE_API_KEY: string;  // ADD THIS
}
```

And to `/apps/processor/wrangler.toml`:
```toml
[vars]
AUTOENHANCE_API_KEY = ""  # Set via wrangler secret
```

---

#### 1.2 Fix Silent Upload Failures
**File**: `/app/api/upload/route.ts`
**Priority**: CRITICAL | **Effort**: 2 hours

```typescript
// BEFORE (silent failures)
if (!ALLOWED_MIME.has(file.type) || file.size > MAX_FILE_SIZE) continue;
// ...
catch (e) { continue; }

// AFTER (with error tracking)
const results: { success: boolean; filename: string; error?: string }[] = [];

for (const file of files) {
  if (!ALLOWED_MIME.has(file.type)) {
    results.push({ success: false, filename: file.name, error: 'Invalid file type' });
    continue;
  }
  if (file.size > MAX_FILE_SIZE) {
    results.push({ success: false, filename: file.name, error: 'File too large (max 25MB)' });
    continue;
  }

  try {
    // ... upload logic
    results.push({ success: true, filename: file.name });
  } catch (e) {
    Sentry.captureException(e);
    results.push({ success: false, filename: file.name, error: 'Upload failed' });
  }
}

return NextResponse.json({
  uploaded: results.filter(r => r.success).length,
  failed: results.filter(r => !r.success),
  results
});
```

---

#### 1.3 Enable RLS on Jobs Table
**File**: New migration `/supabase/migrations/YYYYMMDD_jobs_rls.sql`
**Priority**: CRITICAL (Security) | **Effort**: 30 minutes

```sql
-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert jobs for themselves
CREATE POLICY "Users can create own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for workers)
CREATE POLICY "Service role full access" ON jobs
  FOR ALL USING (auth.role() = 'service_role');
```

---

#### 1.4 Fix Facebook Deletion Signature Verification
**File**: `/app/api/social/facebook-deletion/route.ts:24`
**Priority**: CRITICAL (Security) | **Effort**: 1 hour

```typescript
import crypto from 'crypto';

function verifyFacebookSignature(signedRequest: string, appSecret: string): any | null {
  const [encodedSig, payload] = signedRequest.split('.');

  // Decode signature
  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  // Calculate expected signature
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest();

  // Verify signature matches
  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    console.error('Invalid Facebook signature');
    return null;
  }

  // Decode payload
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const signedRequest = formData.get('signed_request') as string;

  const data = verifyFacebookSignature(signedRequest, process.env.FACEBOOK_APP_SECRET!);
  if (!data) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ... rest of deletion logic
}
```

---

### Day 3-4: Worker Reliability

#### 1.5 Fix Checkpoint System
**File**: `/apps/processor/src/index.ts`
**Priority**: CRITICAL | **Effort**: 4 hours

```typescript
// Unified checkpoint interface (update types.ts)
export interface ProcessingCheckpoint {
  jobId: string;
  phase: 'analyzing' | 'strategizing' | 'processing' | 'completed' | 'failed';
  processedPhotoIds: string[];  // Track which photos are done
  totalPhotos: number;
  currentPhotoIndex: number;
  startedAt: string;
  lastUpdated: string;
  error?: string;
}

// In processJob(), add resume logic:
async function processJob(jobId: string, env: Env): Promise<void> {
  // Try to resume from checkpoint
  const existingCheckpoint = await getCheckpoint(jobId, env);

  if (existingCheckpoint && existingCheckpoint.phase !== 'completed') {
    console.log(`[Worker] Resuming job ${jobId} from photo ${existingCheckpoint.currentPhotoIndex}`);
    // Skip already processed photos
    const remainingPhotos = photos.filter(p => !existingCheckpoint.processedPhotoIds.includes(p.id));
    // ... continue with remainingPhotos
  }

  // Update checkpoint after EACH photo (not every 5)
  for (const photo of photosToProcess) {
    try {
      await processPhoto(photo);
      checkpoint.processedPhotoIds.push(photo.id);
      checkpoint.currentPhotoIndex++;
      checkpoint.lastUpdated = new Date().toISOString();
      await createCheckpoint(checkpoint, env);  // Every photo
    } catch (error) {
      checkpoint.phase = 'failed';
      checkpoint.error = error.message;
      await createCheckpoint(checkpoint, env);
      throw error;
    }
  }
}
```

---

#### 1.6 Add Memory Management to Worker
**File**: `/apps/processor/src/index.ts`
**Priority**: HIGH | **Effort**: 3 hours

```typescript
import pLimit from 'p-limit';

// Limit concurrent operations to prevent memory exhaustion
const analyzeLimit = pLimit(5);  // Max 5 concurrent analyses (was 20)
const processLimit = pLimit(2);  // Max 2 concurrent enhancements

// In analyzePhotos call:
const analyses = await Promise.all(
  photos.map(photo => analyzeLimit(() => analyzeSinglePhoto(photo, env)))
);

// Add explicit garbage collection hints
async function processPhoto(photo: Photo, env: Env): Promise<void> {
  let buffer: ArrayBuffer | null = null;
  try {
    const response = await fetch(photo.url);
    buffer = await response.arrayBuffer();
    // ... process
  } finally {
    buffer = null;  // Release reference for GC
  }
}
```

---

### Day 5: Rate Limiting

#### 1.7 Implement Real Rate Limiting with Upstash
**Priority**: HIGH | **Effort**: 4 hours

**Step 1**: Install dependencies
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Step 2**: Create `/lib/rate-limit-redis.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Different rate limiters for different endpoints
export const rateLimiters = {
  enhance: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:enhance',
  }),
  analyze: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'ratelimit:analyze',
  }),
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    prefix: 'ratelimit:upload',
  }),
  contact: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    prefix: 'ratelimit:contact',
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'ratelimit:auth',
  }),
  default: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:default',
  }),
};

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters = 'default'
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = rateLimiters[type];
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}
```

**Step 3**: Update `/middleware.ts`
```typescript
import { checkRateLimit } from '@/lib/rate-limit-redis';

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const path = request.nextUrl.pathname;

  // Determine rate limit type
  let limitType: 'enhance' | 'analyze' | 'upload' | 'contact' | 'auth' | 'default' = 'default';
  if (path.startsWith('/api/enhance')) limitType = 'enhance';
  else if (path.startsWith('/api/analyze')) limitType = 'analyze';
  else if (path.startsWith('/api/upload')) limitType = 'upload';
  else if (path.startsWith('/api/contact')) limitType = 'contact';
  else if (path.startsWith('/api/auth')) limitType = 'auth';

  const { success, remaining, reset } = await checkRateLimit(ip, limitType);

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  return NextResponse.next();
}
```

---

## Phase 2: Error Handling & Observability (Week 2)

### 2.1 Add Sentry to All Catch Blocks
**Priority**: HIGH | **Effort**: 1 day

Create a helper and use it everywhere:

```typescript
// /lib/error-handler.ts
import * as Sentry from '@sentry/nextjs';

export function captureError(error: unknown, context?: Record<string, any>) {
  console.error(error);
  Sentry.captureException(error, {
    extra: context,
  });
}

// Example usage in API routes:
catch (error) {
  captureError(error, { userId, endpoint: '/api/enhance', imageId });
  return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
}
```

**Files to update** (all API routes):
- `/app/api/enhance/route.ts`
- `/app/api/upload/route.ts`
- `/app/api/batch-enhance/route.ts`
- ... (all 111 routes)

---

### 2.2 Add Processing Metrics
**Priority**: HIGH | **Effort**: 1 day

```typescript
// /lib/metrics.ts
import * as Sentry from '@sentry/nextjs';

export async function trackProcessingTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    // Log to Sentry as a transaction
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name} completed`,
      data: { duration_ms: duration },
    });

    // Also log for monitoring
    console.log(`[Metrics] ${name}: ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name} failed`,
      data: { duration_ms: duration, error: String(error) },
    });
    throw error;
  }
}

// Usage:
const result = await trackProcessingTime('sky-replacement', () =>
  enhanceSky(imageUrl, options)
);
```

---

### 2.3 Add User-Facing Error Messages
**Priority**: MEDIUM | **Effort**: 1 day

Create standardized error responses:

```typescript
// /lib/api-response.ts
export const ApiErrors = {
  UNAUTHORIZED: { error: 'Please log in to continue', code: 'UNAUTHORIZED' },
  RATE_LIMITED: { error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMITED' },
  INVALID_FILE: { error: 'Invalid file type. Please upload JPG, PNG, or WebP.', code: 'INVALID_FILE' },
  FILE_TOO_LARGE: { error: 'File too large. Maximum size is 25MB.', code: 'FILE_TOO_LARGE' },
  PROCESSING_FAILED: { error: 'Processing failed. Please try again.', code: 'PROCESSING_FAILED' },
  CREDITS_EXHAUSTED: { error: 'You have no credits remaining.', code: 'NO_CREDITS' },
};

export function apiError(type: keyof typeof ApiErrors, status: number = 400) {
  return NextResponse.json(ApiErrors[type], { status });
}
```

---

## Phase 3: Performance Optimization (Week 3)

### 3.1 Fix N+1 in Listings API
**File**: `/app/api/listings/[id]/route.ts`
**Priority**: HIGH | **Effort**: 4 hours

```typescript
// BEFORE: N+1 (40 calls for 20 photos)
const photosWithSignedUrls = await Promise.all(
  (photos || []).map(async (photo) => {
    const { data } = await supabase.storage.from('raw-images').createSignedUrl(photo.raw_url, 3600);
    const { data: processed } = await supabase.storage.from('raw-images').createSignedUrl(photo.processed_url, 3600);
    return { ...photo, raw_url: data?.signedUrl, processed_url: processed?.signedUrl };
  })
);

// AFTER: Batch signing
const photoPaths = photos.flatMap(p => [p.raw_url, p.processed_url].filter(Boolean));

// Use createSignedUrls (batch) - if available, or implement parallel batching
const signedUrls = await batchSignUrls(photoPaths, supabase);

const photosWithUrls = photos.map(photo => ({
  ...photo,
  raw_url: signedUrls[photo.raw_url],
  processed_url: signedUrls[photo.processed_url],
}));
```

---

### 3.2 Fix N+1 in Teams API
**File**: `/app/api/teams/route.ts`
**Priority**: MEDIUM | **Effort**: 2 hours

```typescript
// BEFORE: 3 separate queries
const { data: memberTeams } = await supabase.from('team_members').select('team_id, role').eq('user_id', user.id);
const { data: teamData } = await supabase.from('teams').select('*').in('id', teamIds);
const { data: ownedTeams } = await supabase.from('teams').select('*').eq('owner_id', user.id);

// AFTER: Single query with join
const { data: teams } = await supabase
  .from('teams')
  .select(`
    *,
    team_members!inner(role, user_id)
  `)
  .or(`owner_id.eq.${user.id},team_members.user_id.eq.${user.id}`);
```

---

### 3.3 Fix Content Studio N+1
**File**: `/app/dashboard/content-studio/page.tsx`
**Priority**: MEDIUM | **Effort**: 2 hours

```typescript
// BEFORE: Creates signed URL per listing in loop
const listingsWithPhotos = await Promise.all(
  (listings || []).map(async (listing) => {
    const { data } = await supabase.storage.from('raw-images').createSignedUrl(photoPath, 3600);
    // ...
  })
);

// AFTER: Batch all URLs at once
const allPhotoPaths = listings
  .map(l => l.photos?.[0]?.processed_url || l.photos?.[0]?.raw_url)
  .filter(Boolean);

const signedUrls = await batchSignUrls(allPhotoPaths, supabase);

const listingsWithPhotos = listings.map(listing => {
  const photoPath = listing.photos?.[0]?.processed_url || listing.photos?.[0]?.raw_url;
  return {
    id: listing.id,
    title: listing.title || listing.address || 'Untitled',
    thumbnail: photoPath ? signedUrls[photoPath] : null,
  };
});
```

---

### 3.4 Add Database Indexes
**File**: New migration
**Priority**: HIGH | **Effort**: 1 hour

```sql
-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_user_status
  ON listings(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_user_status_created
  ON jobs(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_listing_status
  ON photos(listing_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduled_posts_status_scheduled
  ON scheduled_posts(status, scheduled_for);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user_team
  ON team_members(user_id, team_id);

-- Add user_id to enhancements for faster RLS
ALTER TABLE enhancements ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhancements_user
  ON enhancements(user_id);
```

---

## Phase 4: Security Hardening (Week 4)

### 4.1 Add JSON Parse Error Handling
**Files**: Multiple API routes
**Priority**: HIGH | **Effort**: 4 hours

```typescript
// Create safe JSON parser
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    Sentry.captureException(error, { extra: { json: json.substring(0, 100) } });
    return fallback;
  }
}

// Apply to:
// - /app/api/email-template/route.ts:49
// - /app/api/social/facebook-deletion/route.ts:24
// - /apps/processor/src/lib/supabase-client.ts:145
```

---

### 4.2 Add Environment Variable Validation
**File**: `/lib/env.ts` (new)
**Priority**: HIGH | **Effort**: 2 hours

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI Services
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  REPLICATE_API_TOKEN: z.string().min(1),
  RUNWARE_API_KEY: z.string().min(1),
  AUTOENHANCE_API_KEY: z.string().min(1).optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // Optional
  SENTRY_DSN: z.string().url().optional(),
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

---

### 4.3 Fix Race Condition in Content Library
**File**: `/app/api/content-library/route.ts:67-68`
**Priority**: MEDIUM | **Effort**: 1 hour

```typescript
// BEFORE: Check-then-act race condition
const { data: item } = await supabase.from('content_library').select('is_favorite').eq('id', id).single();
await supabase.from('content_library').update({ is_favorite: !item?.is_favorite }).eq('id', id);

// AFTER: Atomic toggle using RPC
// First, create a database function:
/*
CREATE OR REPLACE FUNCTION toggle_favorite(item_id uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  new_value boolean;
BEGIN
  UPDATE content_library
  SET is_favorite = NOT is_favorite
  WHERE id = item_id AND user_id = user_uuid
  RETURNING is_favorite INTO new_value;
  RETURN new_value;
END;
$$ LANGUAGE plpgsql;
*/

// Then in API:
const { data: newValue } = await supabase.rpc('toggle_favorite', {
  item_id: id,
  user_uuid: user.id
});
```

---

## Phase 5: Missing Features (Week 5-6)

### 5.1 HDR Bracket Blending
**Priority**: HIGH (Competitive) | **Effort**: 1 week

This is a **core feature for pro photographers** that Fotello has.

```typescript
// /app/api/hdr-blend/route.ts
export async function POST(request: NextRequest) {
  const { exposures } = await request.json();  // Array of 3-5 bracket images

  // Option 1: Use Replicate model
  const output = await replicate.run("stability-ai/hdr-merge", {
    input: {
      images: exposures,
      tone_mapping: "reinhard",
      ghost_removal: true,
    }
  });

  // Option 2: Use Sharp for basic HDR
  // Option 3: Partner with AutoEnhance for their HDR
}
```

---

### 5.2 Client Payment Portal
**Priority**: HIGH (Competitive) | **Effort**: 1 week

Fotello lets photographers charge clients through their platform.

```typescript
// Database schema
CREATE TABLE client_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid REFERENCES users(id),
  client_email text NOT NULL,
  listing_id uuid REFERENCES listings(id),
  amount_cents integer NOT NULL,
  status text DEFAULT 'pending',  -- pending, paid, cancelled
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

// API: /app/api/invoices/route.ts
// - POST: Create invoice, send email to client
// - GET: List photographer's invoices
// - PATCH: Update status

// API: /app/api/invoices/[id]/pay/route.ts
// - Creates Stripe checkout session for client
// - On success, marks invoice paid and releases photos
```

---

### 5.3 Per-Property Pricing Option
**Priority**: MEDIUM | **Effort**: 3 days

Add pay-per-property option alongside subscriptions:

```typescript
// Pricing tiers update
const PRICING = {
  // Existing subscriptions...

  // Per-property (no subscription)
  PAY_PER_PROPERTY: {
    price_per_listing: 20_00,  // $20/property
    volume_discounts: {
      5: 18_00,   // $18/property for 5+
      10: 15_00,  // $15/property for 10+
      25: 12_00,  // $12/property for 25+
    },
    credits_never_expire: true,
  }
};
```

---

## Phase 6: Go-to-Market Preparation (Ongoing)

### 6.1 Processing Speed Dashboard
Add real-time metrics visible to users:

```typescript
// Show in dashboard:
// - Average processing time: X seconds
// - Your last enhancement: X seconds
// - Queue position: X
```

---

### 6.2 Competitive Positioning

**SnapR vs Fotello Messaging:**

| Fotello Says | SnapR Response |
|--------------|----------------|
| "Photo editing" | "Complete marketing automation" |
| "5-second processing" | "23 AI tools, not just HDR" |
| "$20/property" | "Unlimited with subscription OR pay-per-property" |
| "Galleries" | "Galleries + Social + CMA + Video" |

**Key Differentiator**: "The only all-in-one real estate marketing platform"

---

## Implementation Checklist

### Week 1: Critical Bugs
- [ ] Fix AUTOENHANCE_API_KEY bug
- [ ] Fix silent upload failures
- [ ] Enable RLS on jobs table
- [ ] Fix Facebook deletion signature
- [ ] Fix checkpoint system
- [ ] Add memory management to worker
- [ ] Implement Redis rate limiting

### Week 2: Observability
- [ ] Add Sentry to all catch blocks
- [ ] Add processing metrics
- [ ] Add user-facing error messages
- [ ] Create error dashboard

### Week 3: Performance
- [ ] Fix N+1 in listings API
- [ ] Fix N+1 in teams API
- [ ] Fix N+1 in content studio
- [ ] Add database indexes
- [ ] Implement batch URL signing

### Week 4: Security
- [ ] Add JSON parse error handling
- [ ] Add environment variable validation
- [ ] Fix race conditions
- [ ] Security audit of all endpoints

### Week 5-6: Features
- [ ] HDR bracket blending
- [ ] Client payment portal
- [ ] Per-property pricing
- [ ] Processing speed dashboard

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Silent failures | Unknown | 0 | Week 2 |
| Error visibility | ~10% | 100% | Week 2 |
| Avg processing time | Unknown | < 10s | Week 3 |
| N+1 queries | 12+ locations | 0 | Week 3 |
| Security vulnerabilities | 5 critical | 0 | Week 4 |
| Feature parity vs Fotello | 80% | 100% | Week 6 |

---

## Resource Requirements

- **Engineering**: 1-2 full-time developers
- **DevOps**: Upstash Redis setup, monitoring dashboards
- **Product**: Prioritization of features vs bugs
- **QA**: Testing each fix before deploy

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes during fixes | High | High | Feature flags, staged rollout |
| New bugs from refactoring | Medium | Medium | Comprehensive testing |
| User disruption | Medium | High | Communicate maintenance windows |
| Scope creep | High | Medium | Strict prioritization |

---

*This plan will be updated weekly with progress.*
