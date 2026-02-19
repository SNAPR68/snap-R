# Technology Stack: Remotion Video Generation

**Project:** SnapR Video Generation (Milestone Addition)
**Researched:** 2026-02-19
**Confidence:** MEDIUM (based on training data from Jan 2025, no current web sources available)

## Context

Adding server-rendered property video generation to existing SnapR real estate marketing platform. Videos render from enhanced property photos with text overlays (price, address, beds/baths), transitions, optional voiceover, background music, and agent branding. Output formats: 9:16, 1:1, 16:9.

**Existing validated stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind, Supabase, Cloudflare Workers, Vercel Serverless, Cloudinary CDN.

**Current broken implementation:** FFmpeg.wasm in browser (`VideoCreator.tsx`) — client-side rendering unsuitable for production video generation.

## Recommended Stack

### Core Remotion Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `remotion` | ^4.0.x | Core framework for React-based video | Industry standard for programmatic video, React component model fits existing codebase |
| `@remotion/player` | ^4.0.x | Optional: client-side preview player | Preview compositions in UI before rendering (VideoCreator.tsx preview) |
| `@remotion/lambda` | ^4.0.x | **IF choosing Lambda**: AWS Lambda rendering | Managed rendering infrastructure, scales to zero |
| `@remotion/media` | ^4.0.x | Video/Audio components with trim/volume/speed | Essential for background music mixing, voiceover integration |
| `@remotion/gif` | ^4.0.x | Optional: GIF support if needed | Timeline-synced GIFs (likely not needed for real estate videos) |

**Version note:** Remotion 4.x is the current stable version as of Jan 2025. Always install matching versions across all `@remotion/*` packages.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@remotion/google-fonts` | ^4.0.x | Google Fonts integration | Load Montserrat, Inter, or other brand fonts for text overlays |
| `zod` | ^4.3.6 | Schema validation for video params | Already in project — use for composition props validation |
| `mediabunny` | Latest | Audio/video duration/dimensions detection | Get dimensions of property photos, duration of voiceover files |
| `@remotion/tailwind` | ^4.0.x | Tailwind in Remotion compositions | Reuse existing Tailwind styling patterns |

### Rendering Infrastructure Decision

This is the **critical architectural choice**. Three options:

| Option | Infrastructure | Cost Model | Complexity | Recommendation |
|--------|---------------|------------|------------|----------------|
| **Remotion Lambda** | AWS Lambda + S3 | Pay-per-render (~$0.10-0.30/video) | Medium | **RECOMMENDED for production** |
| **Vercel API Routes** | Vercel Serverless Functions | Included in Vercel plan (with limits) | Low | **NOT RECOMMENDED** (timeouts, memory limits) |
| **Self-Hosted (Cloudflare Worker)** | Cloudflare Worker + DO/R2 | Worker compute + storage | High | **NOT FEASIBLE** (no Node.js, no FFmpeg, 30s timeout) |
| **Render.com/Railway** | Container-based rendering service | ~$7-20/month + compute | Medium | Alternative if avoiding AWS |

**Verdict:** Use **Remotion Lambda** for production. Here's why:

---

## Remotion Lambda (RECOMMENDED)

### What It Provides

- **Managed rendering infrastructure** on AWS Lambda with automatic FFmpeg/Chrome provisioning
- **Parallel rendering**: Splits video into chunks, renders in parallel, stitches together
- **S3 integration**: Automatic upload of rendered videos to S3 bucket
- **Progress tracking**: Webhook-based progress updates during rendering
- **Automatic retry**: Failed renders retry automatically
- **Cost efficiency**: Pay only for render time (~10-30s for typical 30s video)

### Setup Requirements

**AWS Resources:**
- AWS Lambda function (deployed via Remotion CLI)
- S3 bucket for output videos
- IAM role with Lambda/S3 permissions
- CloudWatch for logs

**Installation:**

```bash
# Core Remotion packages
npm install remotion @remotion/lambda @remotion/media @remotion/google-fonts @remotion/tailwind

# Dev dependencies (for local development/preview)
npm install -D @remotion/cli
```

**Configuration:**

Remotion compositions live in a separate directory (not part of Next.js bundle):

```
/remotion
  /compositions
    PropertyVideo.tsx        # Main video composition
    TextOverlay.tsx          # Reusable text overlay component
    Transitions.tsx          # Fade/slide/zoom transitions
  Root.tsx                   # Remotion root with Composition definitions
  remotion.config.ts         # Remotion config (video codec, quality, etc.)
```

**remotion.config.ts:**

```typescript
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setImageFormat('jpeg');
Config.setConcurrency(4); // Parallel rendering
Config.setScale(1); // Full resolution
Config.setQuality(8); // 1-10, higher = better quality
```

**Deploy Lambda function:**

```bash
# Deploy to AWS (one-time setup)
npx remotion lambda sites create remotion

# Returns Lambda function ARN and S3 bucket name — store in env vars
```

**Environment Variables (Vercel):**

```bash
REMOTION_AWS_REGION=us-east-1
REMOTION_AWS_ACCESS_KEY_ID=<IAM key>
REMOTION_AWS_SECRET_ACCESS_KEY=<IAM secret>
REMOTION_LAMBDA_FUNCTION_NAME=<function ARN>
REMOTION_S3_BUCKET_NAME=<bucket name>
```

### Integration with Next.js API Routes

**API Route:** `app/api/videos/render/route.ts`

```typescript
import { renderMediaOnLambda } from '@remotion/lambda/client';

export async function POST(req: Request) {
  const { listingId, aspectRatio, voiceoverUrl, musicTrack } = await req.json();

  // Fetch listing data from Supabase
  const { data: listing } = await adminSupabase
    .from('listings')
    .select('*, photos(*)')
    .eq('id', listingId)
    .single();

  // Trigger Lambda render
  const { renderId, bucketName } = await renderMediaOnLambda({
    region: process.env.REMOTION_AWS_REGION!,
    functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
    serveUrl: '<deployed-site-url>', // From `npx remotion lambda sites create`
    composition: 'PropertyVideo', // Composition ID from Root.tsx
    inputProps: {
      listing: {
        address: listing.address,
        price: listing.price,
        beds: listing.beds,
        baths: listing.baths,
        photos: listing.photos.map(p => p.processed_url),
      },
      aspectRatio, // '9:16' | '1:1' | '16:9'
      voiceoverUrl,
      musicTrack,
      brandColors: {
        primary: '#D4A017',
        background: '#0A0A0A',
      },
    },
    codec: 'h264',
    imageFormat: 'jpeg',
    maxRetries: 3,
    privacy: 'public',
    outName: `${listingId}-${aspectRatio}-${Date.now()}.mp4`,
  });

  // Store render job in database
  await adminSupabase.from('video_render_jobs').insert({
    listing_id: listingId,
    render_id: renderId,
    bucket_name: bucketName,
    status: 'rendering',
  });

  return Response.json({ renderId });
}
```

**Polling/Webhook for status:**

```typescript
// app/api/videos/status/route.ts
import { getRenderProgress } from '@remotion/lambda/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const renderId = searchParams.get('renderId');

  const progress = await getRenderProgress({
    renderId: renderId!,
    bucketName: process.env.REMOTION_S3_BUCKET_NAME!,
    functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
    region: process.env.REMOTION_AWS_REGION!,
  });

  if (progress.done) {
    // Update database with final video URL
    await adminSupabase
      .from('video_render_jobs')
      .update({
        status: 'completed',
        video_url: progress.outputFile,
        render_time_ms: progress.timeToFinish,
      })
      .eq('render_id', renderId);
  }

  return Response.json(progress);
}
```

### Cost Breakdown

**Per-video rendering costs (estimated):**

| Video Length | Resolution | Lambda Time | Cost |
|--------------|------------|-------------|------|
| 30 seconds | 1080x1920 (9:16) | ~15-20s | $0.10-0.15 |
| 60 seconds | 1080x1920 (9:16) | ~30-40s | $0.20-0.30 |
| 30 seconds | 1920x1080 (16:9) | ~12-18s | $0.08-0.12 |

**Monthly costs (example):**
- 100 videos/month: ~$10-30
- 500 videos/month: ~$50-150
- 1,000 videos/month: ~$100-300

**S3 storage:**
- ~5-15 MB per video
- 1,000 videos = 5-15 GB = ~$0.30/month storage

**Advantages:**
- Scales to zero (no idle costs)
- Parallel rendering (fast)
- Managed infrastructure (no server maintenance)

**Disadvantages:**
- Requires AWS account setup
- Additional cloud provider dependency
- Cold start delays (2-5s for first render)

---

## Vercel API Routes (NOT RECOMMENDED)

### Why Not Recommended

**Vercel Serverless Function Limits:**
- **Timeout:** 300s max (Pro plan) — insufficient for complex videos or cold starts
- **Memory:** 1024 MB max — FFmpeg + Chrome + video encoding needs 2-4 GB
- **Ephemeral filesystem:** 512 MB temp storage — videos must stream to external storage
- **Cold starts:** 10-30s to provision FFmpeg + Chrome — eats into 300s timeout
- **No GPU:** CPU-only rendering — 2-3x slower than Lambda with GPU instances

**What This Means:**
- Simple 30s videos might work (barely)
- 60s+ videos likely timeout
- Multiple concurrent renders = resource exhaustion
- Vercel billing explodes with high render volume

**If You Must Use Vercel:**

```bash
npm install @remotion/renderer
```

```typescript
// app/api/videos/render-vercel/route.ts
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export async function POST(req: Request) {
  const { listingId, inputProps } = await req.json();

  // Bundle Remotion project (10-30s)
  const bundled = await bundle({
    entryPoint: join(process.cwd(), 'remotion/Root.tsx'),
    webpackOverride: (config) => config,
  });

  // Select composition
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'PropertyVideo',
    inputProps,
  });

  // Render video (60-120s for 30s video)
  const outputPath = join(tmpdir(), `${listingId}.mp4`);
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
  });

  // Upload to Cloudflare R2 or Supabase Storage
  const videoBuffer = await readFile(outputPath);
  const { data } = await adminSupabase.storage
    .from('videos')
    .upload(`${listingId}.mp4`, videoBuffer, {
      contentType: 'video/mp4',
    });

  return Response.json({ videoUrl: data.path });
}

export const maxDuration = 300; // 5 minutes (Vercel Pro max)
export const memory = 1024; // Vercel max
```

**Issues:**
- Bundling adds 10-30s overhead EVERY request (no caching on serverless)
- 30s video = ~60-90s render time + 30s bundling = 90-120s total (40% of timeout used)
- 60s video = ~120-180s render = likely timeout
- No parallelization = slow

**Verdict:** Only viable for MVP/testing with <30s videos and low volume (<10 renders/day).

---

## Cloudflare Worker (NOT FEASIBLE)

### Why Not Feasible

**Cloudflare Worker constraints:**
- **No Node.js APIs:** Remotion requires Node.js filesystem, child_process, FFmpeg binaries
- **No FFmpeg:** No way to run FFmpeg (video encoding) in Workers
- **30s timeout:** Insufficient for video rendering (needs 60-300s)
- **128 MB memory:** Remotion needs 1-4 GB
- **No Chrome/Puppeteer:** Remotion uses Puppeteer to render React to frames

**What About Durable Objects?**
- Still no FFmpeg/Chrome
- Still no Node.js APIs
- Would need to rewrite entire Remotion rendering pipeline (not feasible)

**Verdict:** Not an option. Cloudflare Workers are for lightweight API logic, not video rendering.

---

## Self-Hosted Container (Alternative)

### When to Consider

If you want full control and avoid AWS dependency.

**Options:**
- **Render.com** (Managed Docker hosting)
- **Railway.app** (Managed Docker hosting)
- **DigitalOcean App Platform**
- **Self-managed EC2/Compute Engine**

### Setup

**Dockerfile:**

```dockerfile
FROM node:20-bullseye

# Install FFmpeg + Chrome dependencies
RUN apt-get update && apt-get install -y \
  ffmpeg \
  chromium \
  fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["node", "render-server.js"]
```

**Render Server (Express):**

```typescript
// render-server.ts
import express from 'express';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const app = express();
app.use(express.json());

let bundledSite: string | null = null;

// Bundle once on startup
async function init() {
  bundledSite = await bundle({
    entryPoint: './remotion/Root.tsx',
    webpackOverride: (config) => config,
  });
}

app.post('/render', async (req, res) => {
  const { compositionId, inputProps } = req.body;

  const composition = await selectComposition({
    serveUrl: bundledSite!,
    id: compositionId,
    inputProps,
  });

  const outputPath = `/tmp/${Date.now()}.mp4`;
  await renderMedia({
    composition,
    serveUrl: bundledSite!,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
  });

  // Upload to R2/Supabase, return URL
  res.json({ videoPath: outputPath });
});

init().then(() => app.listen(3001));
```

**Cost:**
- **Render.com:** $7/month (starter) + compute overages
- **Railway:** $5/month baseline + usage
- **DigitalOcean:** $12/month (2 GB droplet)

**Advantages:**
- Full control over infrastructure
- No AWS dependency
- Predictable monthly costs

**Disadvantages:**
- Manual scaling (need to monitor queue, spin up workers)
- Server maintenance (updates, monitoring, alerts)
- Higher baseline cost (server runs 24/7 even if idle)
- No automatic parallelization (need to build queue system)

---

## Fonts in Remotion

### Google Fonts (Recommended)

```typescript
// remotion/compositions/PropertyVideo.tsx
import { loadFont } from '@remotion/google-fonts/Montserrat';

const { fontFamily } = loadFont();

export const PropertyVideo = ({ listing }) => {
  return (
    <div style={{ fontFamily }}>
      <h1>{listing.address}</h1>
    </div>
  );
};
```

**Available fonts:** Any Google Font (Montserrat, Inter, Roboto, etc.)

### Local Fonts

Place fonts in `remotion/public/fonts/`:

```typescript
import { continueRender, delayRender, staticFile } from 'remotion';
import { useEffect, useState } from 'react';

const fontFamily = 'CustomFont';

const CustomFont = () => {
  const [handle] = useState(() => delayRender());

  useEffect(() => {
    const font = new FontFace(
      fontFamily,
      `url('${staticFile('fonts/CustomFont.woff2')}')`,
    );

    font.load().then(() => {
      document.fonts.add(font);
      continueRender(handle);
    });
  }, [handle]);

  return null;
};

export const PropertyVideo = () => {
  return (
    <>
      <CustomFont />
      <div style={{ fontFamily }}>Content</div>
    </>
  );
};
```

**Best practice:** Use Google Fonts to avoid font file management.

---

## Audio Mixing in Remotion

### Background Music + Voiceover

```typescript
import { Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio as AudioComponent } from '@remotion/media';

export const PropertyVideo = ({ voiceoverUrl, musicTrack, musicVolume, voiceoverVolume }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      {/* Voiceover (full volume) */}
      <Audio
        src={voiceoverUrl}
        volume={voiceoverVolume / 100}
      />

      {/* Background music (ducked) */}
      <Audio
        src={staticFile(`music/${musicTrack}.mp3`)}
        volume={(f) => {
          // Duck music when voiceover is playing
          // This example assumes voiceover plays from frame 0 to voiceoverDurationFrames
          const voiceoverDurationFrames = 5 * fps; // 5 seconds
          if (f < voiceoverDurationFrames) {
            return (musicVolume / 100) * 0.3; // 30% volume during voiceover
          }
          return musicVolume / 100; // Full music volume after
        }}
        loop
      />
    </>
  );
};
```

**Dynamic volume curve (fade in/out):**

```typescript
import { interpolate } from 'remotion';

<Audio
  src={staticFile('music/elegant.mp3')}
  volume={(f) => {
    const fadeInDuration = 2 * fps; // 2 seconds
    const fadeOutStart = durationInFrames - 2 * fps; // Last 2 seconds

    // Fade in
    if (f < fadeInDuration) {
      return interpolate(f, [0, fadeInDuration], [0, 0.3], {
        extrapolateRight: 'clamp',
      });
    }

    // Fade out
    if (f > fadeOutStart) {
      return interpolate(f, [fadeOutStart, durationInFrames], [0.3, 0], {
        extrapolateRight: 'clamp',
      });
    }

    return 0.3; // Constant volume in middle
  }}
  loop
/>
```

---

## Image Loading in Remotion

### Loading Property Photos

**Always use `<Img>` from `remotion`** (not Next.js `<Image>` or `<img>`):

```typescript
import { Img, Sequence, useCurrentFrame, interpolate } from 'remotion';

export const PhotoSlideshow = ({ photos, duration }) => {
  const frame = useCurrentFrame();
  const photoDuration = duration / photos.length;

  return (
    <>
      {photos.map((photo, index) => {
        const startFrame = index * photoDuration;
        const endFrame = startFrame + photoDuration;

        return (
          <Sequence
            key={photo.id}
            from={startFrame}
            durationInFrames={photoDuration}
          >
            <Img
              src={photo.processed_url} // Remote URL (Cloudinary)
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: interpolate(
                  frame,
                  [startFrame, startFrame + 15, endFrame - 15, endFrame],
                  [0, 1, 1, 0], // Fade in/out
                ),
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};
```

**Remote images (Cloudinary, Supabase Storage):** Remotion fetches them during render. Ensure CORS is enabled.

**Image optimization:** Remotion automatically waits for images to load before rendering frames (prevents blank frames).

---

## Installation Commands

### Remotion Lambda (Production)

```bash
# Core packages
npm install remotion @remotion/lambda @remotion/media @remotion/google-fonts @remotion/tailwind

# Dev dependencies
npm install -D @remotion/cli

# Optional: Player for client-side preview
npm install @remotion/player

# AWS SDK (if not already present)
npm install @aws-sdk/client-s3 @aws-sdk/client-lambda
```

### Remotion Vercel (Not Recommended)

```bash
npm install remotion @remotion/renderer @remotion/bundler @remotion/media @remotion/google-fonts @remotion/tailwind
npm install -D @remotion/cli
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Rendering** | Remotion Lambda | Shotstack API | Proprietary, less control, higher per-video cost ($0.50+) |
| **Rendering** | Remotion Lambda | Cloudflare Stream | No programmatic generation (video hosting only) |
| **Rendering** | Remotion Lambda | FFmpeg.wasm (browser) | Too slow (5-10x slower), 4 GB memory requirement crashes browsers |
| **Rendering** | Remotion Lambda | Vercel API Routes | Timeouts, memory limits, slow bundling |
| **Rendering** | Remotion Lambda | Self-hosted container | Higher baseline cost, manual scaling, server maintenance |
| **Fonts** | Google Fonts | Local font files | File management overhead, no CDN benefits |
| **Audio Mixing** | Remotion `<Audio>` | External FFmpeg script | More complex, no frame-accurate timing |
| **Transitions** | Remotion `interpolate` | CSS animations | CSS doesn't work in server-rendered video frames |

---

## What NOT to Use

### Do NOT Use These

| Technology | Why Avoid |
|------------|-----------|
| **FFmpeg.wasm** | 5-10x slower than native FFmpeg, crashes browsers with large videos |
| **Next.js `<Image>`** | Doesn't work in Remotion (requires Next.js runtime) |
| **CSS Animations** | Not rendered in video frames (Remotion uses frame-by-frame rendering) |
| **`<img>` tags** | May not wait for image load = blank frames in video |
| **Browser-based rendering** | Memory limits, slow, unreliable, crashes on complex compositions |
| **Cloudflare Workers for rendering** | No FFmpeg, no Node.js, timeouts too short |
| **framer-motion** | Already in project but NOT compatible with Remotion (use `interpolate` instead) |

---

## Version Compatibility

**Remotion versions:** All `@remotion/*` packages MUST match versions.

```json
{
  "remotion": "^4.0.0",
  "@remotion/lambda": "^4.0.0",
  "@remotion/media": "^4.0.0",
  "@remotion/google-fonts": "^4.0.0",
  "@remotion/tailwind": "^4.0.0"
}
```

**Node.js:** Requires Node.js 18+ (project already on Node 20).

**React:** Compatible with React 18.3.1 (already in project).

**Next.js:** Remotion compositions are separate from Next.js (no direct dependency). Next.js API routes call Remotion rendering functions.

---

## Integration Points with Existing Stack

### Next.js Integration

Remotion compositions live in `/remotion` directory (outside `/app`). Next.js API routes in `/app/api/videos/` call Remotion rendering functions.

**Build process:**
- Next.js build: `next build` (unchanged)
- Remotion bundle: `npx remotion lambda sites create remotion` (deploy to AWS once)

### Supabase Integration

**New table: `video_render_jobs`**

```sql
CREATE TABLE video_render_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  listing_id uuid REFERENCES listings NOT NULL,
  render_id text NOT NULL,
  bucket_name text,
  status text NOT NULL, -- 'rendering' | 'completed' | 'failed'
  video_url text,
  aspect_ratio text NOT NULL,
  render_time_ms integer,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Cloudflare R2 / Cloudinary

**Storage strategy:**
- Lambda renders to S3 (temporary)
- Lambda completion webhook triggers copy to Cloudflare R2 or Cloudinary (permanent)
- Delete from S3 after 24 hours (lifecycle rule)

**Alternative:** Render directly to Cloudflare R2 (requires custom Lambda function modification — more complex).

### Stripe Billing

**Add video generation limits to plan tiers:**

| Tier | Videos/Month |
|------|--------------|
| Free | 0 |
| Starter | 5 |
| Pro | 50 |
| Agency | Unlimited |

Enforce in `app/api/videos/render/route.ts` before rendering.

---

## Migration from FFmpeg.wasm

### Current State (Broken)

`app/dashboard/content-studio/video/VideoCreator.tsx` uses `@ffmpeg/ffmpeg` (browser-based) which is:
- Too slow (5-10x slower than server FFmpeg)
- Memory-intensive (4 GB+ for 60s video = browser crashes)
- Limited codec support
- No parallelization

### Migration Path

**Phase 1: Server-Side Rendering (Week 1)**
- Install Remotion Lambda packages
- Create `/remotion` directory with compositions
- Deploy Lambda function to AWS
- Create `app/api/videos/render/route.ts` API endpoint

**Phase 2: UI Integration (Week 2)**
- Replace FFmpeg.wasm calls with API calls to `/api/videos/render`
- Add polling UI for render status
- Show progress bar with Lambda render progress
- Display video player when render completes

**Phase 3: Remove FFmpeg.wasm (Week 2)**
- Remove `@ffmpeg/ffmpeg` and `@ffmpeg/util` from package.json
- Delete browser-based rendering code from VideoCreator.tsx
- Keep UI state management (aspect ratio, music, voiceover)

**Code removal:**

```diff
- import { FFmpeg } from '@ffmpeg/ffmpeg'
- import { fetchFile } from '@ffmpeg/util'
- const ffmpegRef = useRef<FFmpeg | null>(null)
- const [ffmpegLoaded, setFfmpegLoaded] = useState(false)

+ const [renderJobId, setRenderJobId] = useState<string | null>(null)
+ const [renderStatus, setRenderStatus] = useState<'idle' | 'rendering' | 'completed' | 'failed'>('idle')
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Remotion Core Packages** | HIGH | Standard stack, well-documented, version 4.x stable |
| **Lambda Rendering** | HIGH | Remotion's recommended production approach, proven at scale |
| **Vercel Limitations** | HIGH | Well-known timeout/memory constraints, documented in Vercel docs |
| **Cloudflare Worker Infeasibility** | HIGH | No Node.js APIs, no FFmpeg, confirmed in Cloudflare docs |
| **Cost Estimates** | MEDIUM | Based on Remotion docs + typical video length, may vary by complexity |
| **Audio Mixing Patterns** | HIGH | Standard Remotion patterns, documented in @remotion/media |
| **Font Loading** | HIGH | Google Fonts package is standard, local fonts are documented |
| **Image Loading** | HIGH | `<Img>` component is required, documented in Remotion best practices |
| **Version Numbers** | LOW | Training data from Jan 2025, may have newer versions by Feb 2026 |

**Verification needed:**
- Current Remotion version (may be 4.1.x or 5.x by Feb 2026)
- Latest AWS Lambda function pricing (may have changed)
- Vercel timeout limits (Pro plan may have increased from 300s)

**Sources:**
- Training data (Remotion documentation, January 2025)
- Existing agent skills in `.agents/skills/remotion-best-practices/`
- Project codebase analysis (package.json, vercel.json, VideoCreator.tsx)

---

## Next Steps for Roadmap

**Phase structure recommendation:**

1. **Phase 1: Remotion Setup** (2-3 days)
   - Install packages, create `/remotion` directory, basic composition
   - Deploy Lambda function to AWS
   - Test single video render from API route

2. **Phase 2: Composition Development** (4-5 days)
   - Build property video composition with photo slideshow
   - Add text overlays (price, address, beds/baths)
   - Implement transitions (fade, slide, zoom)
   - Support all aspect ratios (9:16, 1:1, 16:9)

3. **Phase 3: Audio Integration** (3-4 days)
   - Background music mixing
   - Voiceover integration (ElevenLabs TTS)
   - Volume ducking/fade in/out

4. **Phase 4: UI Integration** (3-4 days)
   - Update VideoCreator.tsx to call render API
   - Polling for render status
   - Progress bar with Lambda progress
   - Video player for completed videos

5. **Phase 5: Storage & Delivery** (2-3 days)
   - S3 to Cloudflare R2 copy workflow
   - Video CDN delivery (Cloudinary or R2 public URL)
   - Database tracking (video_render_jobs table)

6. **Phase 6: Billing & Limits** (1-2 days)
   - Enforce tier limits (videos/month)
   - Cost tracking in database
   - Usage dashboard

**Total estimated effort:** 15-21 days

**Research flags:**
- **Phase 3** may need deeper research into ElevenLabs API for voiceover generation
- **Phase 5** may need research into optimal S3-to-R2 copy workflow (Lambda trigger vs. webhook)

---

## Open Questions

1. **Current Remotion version:** Is 4.x still current or has 5.x been released? (Need web search)
2. **ElevenLabs TTS integration:** How to generate voiceover audio from listing data? (Needs separate research)
3. **S3-to-R2 copy:** Best pattern for moving videos from S3 (Lambda output) to R2 (permanent storage)? Manual vs. automated?
4. **Video preview in UI:** Use `@remotion/player` for client-side preview before render? Or skip preview and render directly?
5. **Render queue:** If multiple users trigger renders simultaneously, how to queue them? (Lambda auto-scales, but cost control?)

