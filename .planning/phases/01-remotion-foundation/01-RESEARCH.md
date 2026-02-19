# Phase 1 Research: Remotion Foundation

**Phase:** 01-remotion-foundation
**Goal:** Deploy Remotion Lambda to AWS and prove end-to-end video generation
**Researched:** 2026-02-19
**Confidence:** HIGH (based on Stack/Architecture/Pitfalls research + existing SnapR patterns)

---

## Research Question

**"What do I need to know to PLAN this phase well?"**

This research answers:
1. What infrastructure is required for Remotion Lambda?
2. How does Remotion integrate with existing SnapR architecture (Next.js + Supabase + Vercel)?
3. What database schema is needed to track render jobs?
4. What are the critical gotchas and failure modes?
5. What does a minimal end-to-end proof-of-concept look like?

---

## Phase 1 Requirements Recap

| Req ID | Requirement | Why Critical for Phase 1 |
|--------|-------------|--------------------------|
| **REND-01** | Remotion Lambda deployed to AWS with S3 output bucket and IAM roles configured | Foundation infrastructure — nothing works without Lambda + S3 |
| **REND-02** | `/api/video/generate` API route accepts listing ID, template, aspect ratio, and options — triggers Lambda render | Entry point for all video generation (manual + automated) |
| **REND-03** | `/api/video/status` API route returns render progress (queued/rendering/completed/failed) with video URL on completion | User feedback loop — without this, renders are "black box" |
| **REND-05** | `video_render_jobs` database table tracks render ID, status, input props, output URL, render time, cost | State persistence — enables polling, debugging, cost tracking |
| **REND-06** | Render errors handled gracefully — failed renders don't crash pipeline, user sees actionable error message | Always-complete semantics — consistent with existing SnapR patterns |

**Success Criteria:**
1. `POST /api/video/generate` triggers Lambda render and returns render ID
2. `GET /api/video/status?renderId=X` returns progress and final video URL
3. A 30-second test video renders successfully in under 90 seconds
4. Render failures return structured error (not 500 crash)
5. `video_render_jobs` table tracks lifecycle (queued → rendering → completed/failed)

---

## Technology Stack (Remotion Lambda)

### Why Remotion Lambda (Not Alternatives)

| Option | Verdict | Reason |
|--------|---------|--------|
| **Remotion Lambda** | ✅ REQUIRED | Only production-viable option. Vercel times out (300s max), Cloudflare Workers have no FFmpeg/Node.js, FFmpeg.wasm crashes browsers. |
| Vercel API Routes | ❌ NOT VIABLE | 300s timeout insufficient for complex videos, 1024 MB memory too small, bundling adds 10-30s overhead per render |
| Cloudflare Workers | ❌ NOT FEASIBLE | No Node.js APIs, no FFmpeg, 30s timeout, 128 MB memory — fundamentally incompatible with video rendering |
| FFmpeg.wasm (browser) | ❌ BROKEN | 5-10x slower than server, 4 GB+ RAM crashes browsers, inconsistent output. **Current SnapR approach — must be replaced.** |

**Verdict:** Remotion Lambda is the ONLY option. This decision is locked.

### Core Packages Required

```json
{
  "remotion": "^4.0.0",
  "@remotion/lambda": "^4.0.0",
  "@remotion/media": "^4.0.0",
  "@remotion/google-fonts": "^4.0.0",
  "@remotion/tailwind": "^4.0.0"
}

// Dev dependencies
{
  "@remotion/cli": "^4.0.0"
}
```

**CRITICAL:** All `@remotion/*` packages MUST have matching versions. Version mismatch causes cryptic errors.

**Current codebase:**
- Node 20 ✓ (required: 18+)
- React 18.3.1 ✓ (compatible)
- Zod already installed ✓ (use for inputProps validation)
- Tailwind already configured ✓ (@remotion/tailwind will reuse)

---

## AWS Infrastructure Requirements

### Resources Needed

| Resource | Purpose | Setup Command |
|----------|---------|---------------|
| **Lambda Function** | Runs video rendering (deployed by Remotion CLI) | `npx remotion lambda sites create remotion` |
| **S3 Bucket** | Stores rendered video output (temporary) | Auto-created by Remotion CLI |
| **IAM Role** | Grants Lambda permission to write to S3 | Auto-configured by Remotion CLI |
| **CloudWatch Logs** | Lambda execution logs for debugging | Auto-configured |

**One-time deployment:**
```bash
# From project root
npx remotion lambda sites create remotion

# Output:
# Lambda ARN: arn:aws:lambda:us-east-1:ACCOUNT:function:remotion-render-4-0-*
# S3 Bucket: remotion-render-us-east-1-*
# Serve URL: https://s3.amazonaws.com/remotion-render-us-east-1-*/sites/remotion/
```

**Store in Vercel environment variables:**
```bash
REMOTION_AWS_REGION=us-east-1
REMOTION_AWS_ACCESS_KEY_ID=<IAM key>
REMOTION_AWS_SECRET_ACCESS_KEY=<IAM secret>
REMOTION_LAMBDA_FUNCTION_NAME=<function ARN from deploy output>
REMOTION_S3_BUCKET_NAME=<bucket name from deploy output>
REMOTION_LAMBDA_SERVE_URL=<serve URL from deploy output>
```

### AWS Account Considerations

**Cost estimates (Phase 1 testing):**
- Lambda compute: ~$0.10-0.15 per 30s video render
- S3 storage: ~$0.023/GB/month (negligible for testing)
- Data transfer: Free within same region

**Testing budget:** ~$5-10 for Phase 1 (50-100 test renders)

---

## Database Schema (video_render_jobs)

### New Table: video_render_jobs

**Migration:** `supabase/migrations/20260219_video_render_jobs.sql`

```sql
CREATE TABLE video_render_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  listing_id uuid REFERENCES listings NOT NULL,
  render_id text NOT NULL UNIQUE, -- Remotion render ID
  bucket_name text,                -- S3 bucket name
  status text NOT NULL,            -- 'queued' | 'rendering' | 'completed' | 'failed'
  video_url text,                  -- Final video URL (S3 or CDN)

  -- Input parameters (stored for debugging/retry)
  input_props jsonb NOT NULL,      -- { listingId, aspectRatio, template, etc. }

  -- Performance tracking
  render_time_ms integer,          -- Total render duration
  cost_cents integer,              -- Estimated render cost

  -- Error handling
  error text,                      -- Error message if failed

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_video_render_jobs_user_id ON video_render_jobs(user_id);
CREATE INDEX idx_video_render_jobs_listing_id ON video_render_jobs(listing_id);
CREATE INDEX idx_video_render_jobs_render_id ON video_render_jobs(render_id);
CREATE INDEX idx_video_render_jobs_status ON video_render_jobs(status);
CREATE INDEX idx_video_render_jobs_created_at ON video_render_jobs(created_at DESC);

-- RLS policies (user can only see own renders)
ALTER TABLE video_render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video renders"
  ON video_render_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage video renders"
  ON video_render_jobs FOR ALL
  USING (auth.role() = 'service_role');
```

**Status lifecycle:**
```
queued → rendering → completed
                  └→ failed
```

**Notes:**
- `render_id` comes from Remotion Lambda (`renderMediaOnLambda()` return value)
- `input_props` stored as JSONB for debugging (what was sent to Lambda)
- `video_url` updated when render completes (initially null)
- `cost_cents` estimated based on render time (~$0.10-0.30 per video)

---

## API Route Architecture

### Route 1: POST /api/video/generate

**Purpose:** Trigger a new video render

**Input schema (Zod):**
```typescript
import { z } from 'zod';

const GenerateVideoSchema = z.object({
  listingId: z.string().uuid(),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  template: z.enum(['test']), // Phase 1: Single test template
  // Phase 2+ will add: musicTrack, voiceoverUrl, selectedPhotoIds
});

type GenerateVideoInput = z.infer<typeof GenerateVideoSchema>;
```

**Flow:**
1. Validate input with Zod schema
2. Authenticate user (from Supabase session)
3. Fetch listing data from Supabase (address, photos, etc.)
4. Call `renderMediaOnLambda()` with composition + inputProps
5. Insert record into `video_render_jobs` with `status: 'rendering'`
6. Return `{ renderId }` to client

**Example implementation:**
```typescript
// app/api/video/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renderMediaOnLambda } from '@remotion/lambda/client';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { z } from 'zod';

const GenerateVideoSchema = z.object({
  listingId: z.string().uuid(),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  template: z.enum(['test']),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const input = GenerateVideoSchema.parse(body);

    // 3. Fetch listing data
    const { data: listing, error: listingError } = await adminSupabase()
      .from('listings')
      .select('id, address, price, beds, baths, photos(processed_url)')
      .eq('id', input.listingId)
      .eq('user_id', user.id) // Security: user can only generate videos for own listings
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // 4. Trigger Lambda render
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: process.env.REMOTION_AWS_REGION!,
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
      serveUrl: process.env.REMOTION_LAMBDA_SERVE_URL!,
      composition: 'TestVideo', // Phase 1: Simple test composition
      inputProps: {
        listing: {
          address: listing.address,
          price: listing.price,
          beds: listing.beds,
          baths: listing.baths,
          photos: listing.photos.map((p) => p.processed_url),
        },
        aspectRatio: input.aspectRatio,
      },
      codec: 'h264',
      imageFormat: 'jpeg',
      maxRetries: 3,
      privacy: 'public',
      outName: `${input.listingId}-${input.aspectRatio}-${Date.now()}.mp4`,
    });

    // 5. Store render job in database
    await adminSupabase().from('video_render_jobs').insert({
      user_id: user.id,
      listing_id: input.listingId,
      render_id: renderId,
      bucket_name: bucketName,
      status: 'rendering',
      input_props: input,
    });

    // 6. Return render ID
    return NextResponse.json({ renderId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[video/generate] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 60; // 60s timeout (just for API call, not render)
```

**Vercel configuration:**
Add to `vercel.json`:
```json
{
  "functions": {
    "app/api/video/generate/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

---

### Route 2: GET /api/video/status

**Purpose:** Poll render progress and get final video URL

**Input:** `?renderId=<render-id>`

**Flow:**
1. Validate `renderId` query parameter
2. Authenticate user
3. Call `getRenderProgress()` from Remotion Lambda client
4. If render completed, update `video_render_jobs` with final URL
5. Return progress object to client

**Example implementation:**
```typescript
// app/api/video/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRenderProgress } from '@remotion/lambda/client';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    // 1. Get renderId from query params
    const { searchParams } = new URL(req.url);
    const renderId = searchParams.get('renderId');
    if (!renderId) {
      return NextResponse.json({ error: 'Missing renderId' }, { status: 400 });
    }

    // 2. Authenticate
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Verify user owns this render job
    const { data: job, error: jobError } = await adminSupabase()
      .from('video_render_jobs')
      .select('*')
      .eq('render_id', renderId)
      .eq('user_id', user.id) // Security check
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Render job not found' }, { status: 404 });
    }

    // 4. Get render progress from Lambda
    const progress = await getRenderProgress({
      renderId,
      bucketName: job.bucket_name,
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
      region: process.env.REMOTION_AWS_REGION!,
    });

    // 5. If render completed, update database
    if (progress.done && job.status !== 'completed') {
      await adminSupabase()
        .from('video_render_jobs')
        .update({
          status: 'completed',
          video_url: progress.outputFile,
          render_time_ms: progress.timeToFinish,
          cost_cents: Math.round((progress.timeToFinish / 1000) * 0.005), // ~$0.005/second estimate
          updated_at: new Date().toISOString(),
        })
        .eq('render_id', renderId);
    }

    // 6. If render failed, update database
    if (progress.fatalErrorEncountered && job.status !== 'failed') {
      await adminSupabase()
        .from('video_render_jobs')
        .update({
          status: 'failed',
          error: progress.errors?.[0]?.message || 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('render_id', renderId);
    }

    // 7. Return progress
    return NextResponse.json({
      renderId,
      status: progress.done ? 'completed' : progress.fatalErrorEncountered ? 'failed' : 'rendering',
      progress: progress.overallProgress, // 0-1 (percentage)
      videoUrl: progress.outputFile,
      error: progress.errors?.[0]?.message,
      renderTime: progress.timeToFinish,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[video/status] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

## Remotion Composition Structure (Phase 1)

### Minimal Test Composition

**Directory structure:**
```
/remotion
  /compositions
    TestVideo.tsx          # Simple test composition (Phase 1)
  Root.tsx                 # Remotion root (registers compositions)
  remotion.config.ts       # Video codec, quality settings
```

**remotion/Root.tsx:**
```tsx
import { Composition } from 'remotion';
import { TestVideo } from './compositions/TestVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TestVideo"
        component={TestVideo}
        durationInFrames={900} // 30 seconds at 30 fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          listing: {
            address: '123 Main St',
            price: 500000,
            beds: 3,
            baths: 2,
            photos: ['https://example.com/photo1.jpg'],
          },
          aspectRatio: '9:16' as const,
        }}
      />
    </>
  );
};
```

**remotion/compositions/TestVideo.tsx:**
```tsx
import { AbsoluteFill, Img, useCurrentFrame, interpolate } from 'remotion';

interface TestVideoProps {
  listing: {
    address: string;
    price: number;
    beds: number;
    baths: number;
    photos: string[];
  };
  aspectRatio: '9:16' | '1:1' | '16:9';
}

export const TestVideo: React.FC<TestVideoProps> = ({ listing, aspectRatio }) => {
  const frame = useCurrentFrame();

  // Simple fade in animation (first 30 frames)
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      {/* Photo */}
      <Img
        src={listing.photos[0]}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity,
        }}
      />

      {/* Text overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          right: '5%',
          color: 'white',
          fontFamily: 'sans-serif',
          fontSize: '48px',
          fontWeight: 'bold',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          opacity,
        }}
      >
        <div>{listing.address}</div>
        <div style={{ fontSize: '36px', marginTop: '10px' }}>
          ${listing.price.toLocaleString()}
        </div>
        <div style={{ fontSize: '28px', marginTop: '5px' }}>
          {listing.beds} Beds · {listing.baths} Baths
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

**remotion/remotion.config.ts:**
```typescript
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p'); // CRITICAL: Universal player compatibility
Config.setImageFormat('jpeg');
Config.setConcurrency(4); // Parallel rendering
Config.setScale(1); // Full resolution
Config.setQuality(8); // 1-10, higher = better quality
```

**Why this composition:**
- Single static photo (no slideshow complexity)
- Text overlay with fade animation (proves interpolation works)
- Hardcoded 30s duration (no dynamic length calculation)
- No audio (simplifies Phase 1)
- 9:16 dimensions hardcoded (multi-format in Phase 2)

**Success metric:** This composition should render in ~15-20 seconds on Lambda.

---

## Integration with Existing SnapR Architecture

### Pattern Alignment

| SnapR Pattern | How Phase 1 Follows It |
|---------------|------------------------|
| **Always-complete semantics** | Video render failures update `status: 'failed'` with error message, don't crash API route |
| **Supabase admin client** | `adminSupabase()` used in API routes (bypasses RLS for service operations) |
| **Zod validation** | All API inputs validated with Zod schemas before processing |
| **TypeScript strict mode** | No `any` types, explicit `unknown` in catch blocks |
| **AbortSignal timeouts** | Not needed in Phase 1 (Remotion client has built-in timeouts) |
| **RLS policies** | `video_render_jobs` has RLS enabled, users can only view own renders |

### Differences from Existing Patterns

| Existing Pattern | Phase 1 Deviation | Why Acceptable |
|------------------|-------------------|----------------|
| Cloudflare Worker for async processing | Remotion Lambda in AWS | Cloudflare Workers cannot run FFmpeg/Node.js — AWS is only option |
| Next.js API routes call Cloudflare Worker | Next.js API routes call Remotion Lambda directly | Simpler flow, no Worker intermediary needed for video |
| R2 storage for permanent files | S3 storage (Phase 1), R2 in Phase 5 | S3 auto-configured by Remotion, R2 copy is optimization for later |

---

## Critical Pitfalls (Phase 1 Specific)

### Pitfall 1: Version Mismatches Between @remotion/* Packages

**What goes wrong:** Installing `remotion@4.0.0` but `@remotion/lambda@4.1.0` causes cryptic errors.

**Prevention:**
```bash
# Install all with same version
npm install remotion@4.0.0 @remotion/lambda@4.0.0 @remotion/media@4.0.0 @remotion/google-fonts@4.0.0 @remotion/tailwind@4.0.0 -D @remotion/cli@4.0.0
```

**Detection:** TypeScript errors like "Property 'X' does not exist on type 'Y'" in Remotion code.

---

### Pitfall 2: Missing Pixel Format (yuv420p)

**What goes wrong:** Default pixel format (`yuv444p`) is incompatible with QuickTime/Safari players.

**Prevention:** Set in `remotion.config.ts`:
```typescript
Config.setPixelFormat('yuv420p');
```

**Detection:** Videos won't play in Safari or QuickTime Player (black screen).

---

### Pitfall 3: CORS Errors on Image Loading

**What goes wrong:** Remotion tries to fetch listing photos from Cloudinary/Supabase, hits CORS block.

**Prevention:** Ensure CORS headers allow Lambda's IP range on image origins.

**Detection:** Lambda CloudWatch logs show "Failed to load image: CORS error".

---

### Pitfall 4: Lambda Cold Start Delays

**What goes wrong:** First render of the day takes 5-10s longer due to cold Lambda function.

**Prevention (Phase 1):** Accept delay as acceptable for MVP. (Phase 6 will add pre-warming.)

**Detection:** User reports "video taking forever to start rendering" on first request.

---

### Pitfall 5: Hardcoded Test Data in Composition

**What goes wrong:** Forgetting to use `inputProps` and hardcoding test values in composition.

**Prevention:** Always destructure props at top of component:
```tsx
export const TestVideo: React.FC<TestVideoProps> = ({ listing, aspectRatio }) => {
  // Use listing.address, not "123 Main St"
}
```

**Detection:** All videos show same address/price regardless of listing.

---

## Existing Codebase Integration Points

### Files to Modify

| File | Change | Why |
|------|--------|-----|
| `package.json` | Add Remotion packages | Install dependencies |
| `vercel.json` | Add `/api/video/*` function config | Set timeouts for video API routes |
| `.env.local` | Add `REMOTION_*` env vars | Store AWS credentials + Lambda ARN |
| N/A (new) | Create `supabase/migrations/20260219_video_render_jobs.sql` | Track render jobs in database |

### Files to Create

| File | Purpose |
|------|---------|
| `app/api/video/generate/route.ts` | Trigger video render |
| `app/api/video/status/route.ts` | Poll render progress |
| `remotion/Root.tsx` | Remotion root (register compositions) |
| `remotion/compositions/TestVideo.tsx` | Phase 1 test composition |
| `remotion/remotion.config.ts` | Video codec/quality settings |
| `supabase/migrations/20260219_video_render_jobs.sql` | Database schema |

### Untouched Files (Phase 1)

- `apps/processor/` (Cloudflare Worker) — no changes in Phase 1
- `app/dashboard/content-studio/video/VideoCreator.tsx` — UI migration in Phase 2
- `lib/social/publish-service.ts` — publishing in Phase 6
- `lib/content/limits.ts` — billing gates in Phase 5

---

## Success Validation (How to Test Phase 1)

### Manual Test Flow

1. **Deploy Remotion Lambda:**
   ```bash
   npx remotion lambda sites create remotion
   # Note Lambda ARN and S3 bucket name
   ```

2. **Add env vars to Vercel:**
   ```bash
   REMOTION_AWS_REGION=us-east-1
   REMOTION_AWS_ACCESS_KEY_ID=<key>
   REMOTION_AWS_SECRET_ACCESS_KEY=<secret>
   REMOTION_LAMBDA_FUNCTION_NAME=<ARN>
   REMOTION_S3_BUCKET_NAME=<bucket>
   REMOTION_LAMBDA_SERVE_URL=<serve-url>
   ```

3. **Create a test listing:**
   - Navigate to SnapR dashboard
   - Create a listing with 1-2 enhanced photos
   - Note the `listing_id`

4. **Trigger render via API:**
   ```bash
   curl -X POST https://snap-r.com/api/video/generate \
     -H "Authorization: Bearer <session-token>" \
     -H "Content-Type: application/json" \
     -d '{"listingId":"<uuid>","aspectRatio":"9:16","template":"test"}'

   # Response: {"renderId":"abc123"}
   ```

5. **Poll status:**
   ```bash
   curl https://snap-r.com/api/video/status?renderId=abc123 \
     -H "Authorization: Bearer <session-token>"

   # Response: {"status":"rendering","progress":0.35}
   # ... wait ~15-20s ...
   # Response: {"status":"completed","videoUrl":"https://s3.amazonaws.com/..."}
   ```

6. **Verify video:**
   - Download video from S3 URL
   - Play in QuickTime/VLC (should show listing photo + text overlay)
   - Check `video_render_jobs` table (status = completed, video_url populated)

### Automated Tests (Nice-to-Have)

**Phase 1 scope:** Manual testing only. Automated tests deferred to Phase 3+.

Future test ideas:
- Unit test: Zod schema validation
- Integration test: Mock `renderMediaOnLambda()`, verify database insert
- E2E test: Trigger real render, poll until completion (slow, ~2 min)

---

## Cost & Performance Expectations

### Phase 1 Testing Budget

| Item | Estimated Cost |
|------|----------------|
| Lambda compute (50 test renders @ $0.12 each) | $6.00 |
| S3 storage (10 GB) | $0.23/month |
| Data transfer (within us-east-1) | Free |
| **Total (Phase 1)** | **~$7** |

### Render Performance Targets

| Video Length | Expected Render Time | Lambda Cost |
|--------------|---------------------|-------------|
| 30 seconds (Phase 1 test) | 15-20s | $0.10-0.12 |
| 60 seconds (Phase 2+) | 30-40s | $0.20-0.30 |

**If render time > 90s for 30s video:** Composition is too complex, optimize before Phase 2.

---

## Dependencies & Prerequisites

### Before Starting Phase 1

- [ ] AWS account created (or access to existing account)
- [ ] AWS IAM user with programmatic access (access key + secret)
- [ ] IAM permissions: Lambda, S3, CloudWatch Logs (Remotion CLI will configure)
- [ ] Vercel project has access to new env vars (not committed to repo)
- [ ] No ongoing work on `app/api/video/*` routes (will conflict)

### Phase 1 Does NOT Depend On

- Phase 2+ templates (JustListed, OpenHouse, etc.)
- Audio integration (music/voiceover)
- UI changes to VideoCreator.tsx
- Marketing pipeline integration
- Billing gates
- R2/Cloudinary CDN delivery (Phase 5)

**Phase 1 is self-contained:** Proves infrastructure works, nothing more.

---

## Open Questions (Requiring Decisions)

### Q1: AWS Region Selection

**Options:**
- `us-east-1` (N. Virginia) — cheapest, most services available
- `us-west-2` (Oregon) — closer to West Coast users
- Multi-region — overkill for Phase 1

**Recommendation:** Use `us-east-1` for Phase 1 (lowest cost, fastest setup). Defer multi-region to v1.2+.

---

### Q2: S3 Lifecycle Policy

**Options:**
- Keep videos in S3 forever (expensive)
- Delete after 7 days (assumes copy to R2/Cloudinary)
- Delete after 24 hours (aggressive, risky)

**Recommendation:** Phase 1 manual cleanup (no lifecycle policy). Phase 5 will automate S3 → R2 copy + 24-hour deletion.

---

### Q3: Vercel API Route Timeout

**Current:** Most API routes have 60s or 180s timeout in `vercel.json`

**For `/api/video/generate`:**
- Render itself takes 15-20s (happens in Lambda, not Vercel)
- API route only triggers render (should return in <5s)
- But: Supabase fetch + Lambda call could take 10-15s

**Recommendation:** Set `maxDuration: 60` for Phase 1. If timeouts occur, increase to 120s.

---

## Research Confidence Assessment

| Area | Confidence | Source | Gaps |
|------|-----------|--------|------|
| **Remotion Lambda setup** | HIGH | STACK.md research + Remotion docs (training data Jan 2025) | Version numbers may be outdated (Feb 2026) |
| **Next.js API route patterns** | HIGH | Existing SnapR codebase (marketing-handler, enhance routes) | None |
| **Database schema design** | HIGH | Existing SnapR patterns (marketing_jobs table) | None |
| **AWS costs** | MEDIUM | Remotion docs + AWS pricing (training data) | Actual costs may vary by usage |
| **Cold start delays** | MEDIUM | General Lambda knowledge | Remotion-specific cold start behavior unverified |
| **CORS setup for images** | MEDIUM | General knowledge | Cloudinary/Supabase CORS config may need trial-and-error |

**Needs verification (during implementation):**
1. Current Remotion version (may be 4.x or 5.x in Feb 2026)
2. Cloudinary CORS headers for Lambda IP ranges
3. Actual Lambda render times (15-20s is estimate)

---

## Sources

**Primary sources (high confidence):**
- `.planning/research/STACK.md` — Remotion Lambda vs alternatives, package list
- `.planning/research/ARCHITECTURE.md` — Data flow, component boundaries, integration patterns
- `.planning/research/PITFALLS.md` — Critical gotchas (version mismatches, CORS, cold starts)
- Existing SnapR codebase:
  - `apps/processor/src/marketing-handler.ts` — Always-complete pattern
  - `lib/supabase/admin.ts` — Admin client usage
  - `package.json` — Current dependencies (React 18, Zod, Tailwind)
  - `vercel.json` — Function timeout patterns

**Secondary sources (medium confidence):**
- `.agents/skills/remotion-best-practices/` — Composition patterns (training data)
- Training data (Remotion documentation, January 2025)

**Assumed true (no verification possible):**
- Remotion Lambda is still the recommended production approach in Feb 2026
- AWS Lambda pricing has not drastically changed since 2025
- Cloudflare Workers still do not support FFmpeg/Node.js

---

## Next Steps (After Research)

1. **Review this research document** — Ensure all questions answered
2. **Create Phase 1 plans** — Break into executable tasks (01-01, 01-02)
3. **Set up AWS account** — IAM user, credentials
4. **Deploy Remotion Lambda** — Run `npx remotion lambda sites create`
5. **Begin implementation** — Follow plans, validate success criteria

**Research complete.** Ready for planning.

---

*Research completed: 2026-02-19*
*Confidence: HIGH (Stack/Architecture/Pitfalls research + existing patterns)*
*Next: Create Phase 1 plans (01-01, 01-02)*
