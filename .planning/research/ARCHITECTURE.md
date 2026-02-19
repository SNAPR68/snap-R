# Architecture Patterns: Real Estate Video Generation

**Domain:** Real estate property video automation
**Researched:** 2026-02-19
**Confidence:** HIGH (patterns based on existing SnapR architecture analysis + Remotion best practices)

---

## Recommended Architecture

### High-Level Flow

```
User uploads photos → Preparation pipeline (existing)
  ↓
Listing marked as 'prepared' → Marketing pipeline triggers (existing)
  ↓
Marketing Step 6 (new): Video generation
  ↓
API route → Remotion Lambda render → S3 output → R2 storage → Cloudinary CDN
  ↓
Video URL stored in marketing_jobs.video_result
  ↓
Auto-publish to social platforms (existing publish-service.ts)
```

**Integration points:**
- **Trigger:** `listings.preparation_status` = 'prepared' → marketing webhook → video generation
- **Input:** `listings` table (address, price, beds, baths) + `photos` table (processed_url array)
- **Output:** Video MP4 URL in `marketing_jobs.video_result` (JSON)
- **Publishing:** Existing `lib/social/publish-service.ts` publishes video to Instagram/Facebook/LinkedIn

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **VideoCreator UI** (`app/dashboard/content-studio/video/VideoCreator.tsx`) | User input (aspect ratio, music, template, voiceover), preview, download | `/api/video/generate` API route, Supabase (listings, photos) |
| **Video Generation API** (`app/api/video/generate/route.ts`) | Validate input, fetch listing data, trigger Remotion render, poll for completion | Remotion Lambda, Supabase (listings, photos, video_render_jobs) |
| **Remotion Compositions** (`remotion/compositions/*.tsx`) | Video layout, text overlays, transitions, photo sequences, audio mixing | None (stateless React components) |
| **Remotion Lambda** (AWS) | Render video from composition, upload to S3, notify completion | S3, CloudWatch (logs), webhook callback (optional) |
| **Storage Layer** (S3 → R2 → Cloudinary) | Temporary video storage (S3), permanent storage (R2), CDN delivery (Cloudinary) | Remotion Lambda (S3 write), API route (R2 copy), Cloudinary (fetch from R2) |
| **Marketing Handler** (`apps/processor/src/marketing-handler.ts`) | Trigger video generation as Step 6 in pipeline, track status | Cloudflare Queue, Supabase (marketing_jobs), `/api/video/generate` |
| **Publish Service** (`lib/social/publish-service.ts`) | Publish video to Instagram Reels, Facebook, LinkedIn | Social platform APIs, Supabase (social_connections, published_posts) |

---

## Data Flow

### 1. Manual Video Creation (VideoCreator UI)

```
User navigates to /dashboard/content-studio/video?listing=<id>
  ↓
VideoCreator.tsx loads listing + photos from Supabase
  ↓
User selects:
  - Aspect ratio (9:16, 1:1, 16:9)
  - Template (Just Listed, Open House, etc.)
  - Music track
  - Voiceover (optional, uses existing voiceover service)
  - Photos to include (checkboxes)
  ↓
User clicks "Generate Video"
  ↓
POST /api/video/generate { listingId, aspectRatio, template, musicTrack, voiceoverUrl, selectedPhotoIds }
  ↓
API route:
  1. Fetch listing data (address, price, beds, baths)
  2. Fetch selected photos (processed_url array)
  3. Call renderMediaOnLambda() with inputProps
  4. Insert record into video_render_jobs (status: 'rendering')
  5. Return { renderId }
  ↓
VideoCreator.tsx polls GET /api/video/status?renderId=<id> every 2s
  ↓
When status = 'completed':
  - Display video player with videoUrl
  - Show download button
  - Show "Add to Calendar" button (existing content calendar)
  - Show "Publish Now" buttons (Instagram/Facebook/LinkedIn)
```

**Database changes:**
```sql
-- Insert into video_render_jobs
INSERT INTO video_render_jobs (listing_id, render_id, status, aspect_ratio)
VALUES ('<listing-id>', '<render-id>', 'rendering', '9:16');

-- Update when complete
UPDATE video_render_jobs
SET status = 'completed', video_url = '<s3-url>', render_time_ms = 12000
WHERE render_id = '<render-id>';
```

---

### 2. Automated Video Creation (Marketing Pipeline)

```
Listing preparation completes → listings.preparation_status = 'prepared'
  ↓
Webhook/trigger → marketing-handler.ts (Cloudflare Worker)
  ↓
Marketing Step 6: Video Generation
  ↓
POST /api/video/generate {
  listingId,
  aspectRatio: '9:16', // Default to Reels format
  template: 'just-listed', // Auto-select based on listing status
  musicTrack: 'upbeat', // Default
  voiceoverUrl: null, // Skip voiceover for auto-gen (optional)
  selectedPhotoIds: null // Use all photos
}
  ↓
API route triggers Remotion Lambda render
  ↓
Marketing handler updates marketing_jobs.video_status = 'processing'
  ↓
Poll /api/video/status?renderId=<id> in handler
  ↓
When complete:
  - Update marketing_jobs.video_status = 'completed'
  - Store video URL in marketing_jobs.video_result (JSON)
  - Optionally: Auto-schedule post to social_connections platforms
  ↓
User sees video in Command Center → Marketing tab
```

**Always-complete semantics:**
- If video generation fails (Lambda timeout, S3 error, etc.), marketing_jobs.video_status = 'failed'
- Other marketing steps (description, captions, MLS, property site) are NOT blocked
- User can retry video generation manually from UI

---

### 3. Video Publishing Flow

```
User clicks "Publish to Instagram Reels" in VideoCreator.tsx
  ↓
POST /api/social/publish-video {
  platform: 'instagram',
  videoUrl: '<cloudinary-url>',
  caption: '<from marketing_jobs.captions_result>',
  listingId
}
  ↓
publishToInstagram() from lib/social/publish-service.ts:
  1. Fetch Instagram account ID from social_connections
  2. Download video from Cloudinary
  3. Upload video to Instagram Graph API
  4. Create media container
  5. Publish container
  6. Insert record into published_posts
  ↓
Return { success: true, postId, postUrl }
  ↓
UI shows "Published!" confirmation with link to post
```

**Note:** Existing `publish-service.ts` supports Facebook + Instagram. LinkedIn video publishing currently returns 501 (needs research/implementation).

---

## Remotion Composition Architecture

### Composition Structure

```
remotion/
├── Root.tsx                     # Remotion root (defines all compositions)
├── compositions/
│   ├── PropertyVideo.tsx        # Main composition (orchestrates all elements)
│   ├── templates/
│   │   ├── JustListed.tsx       # Just Listed template
│   │   ├── OpenHouse.tsx        # Open House template
│   │   ├── PriceDrop.tsx        # Price Drop template
│   │   ├── Sold.tsx             # Sold template
│   │   └── PropertyShowcase.tsx # Full property tour template
│   ├── components/
│   │   ├── PhotoSlideshow.tsx   # Photo sequence with transitions
│   │   ├── TextOverlay.tsx      # Price, address, stats overlays
│   │   ├── IntroCard.tsx        # "JUST LISTED" intro cards
│   │   ├── EndCard.tsx          # Agent branding end card
│   │   ├── Transitions.tsx      # Fade, slide, zoom transitions
│   │   └── AudioMixer.tsx       # Voiceover + music ducking
│   └── utils/
│       ├── aspectRatios.ts      # Dimension calculations for 9:16, 1:1, 16:9
│       └── animations.ts        # Reusable interpolation helpers
└── remotion.config.ts           # Video codec, quality, concurrency settings
```

### PropertyVideo.tsx (Main Composition)

```tsx
import { AbsoluteFill, Sequence, Audio } from 'remotion';
import { JustListed } from './templates/JustListed';
import { OpenHouse } from './templates/OpenHouse';

export const PropertyVideo: React.FC<{
  listing: {
    address: string;
    price: number;
    beds: number;
    baths: number;
    photos: { url: string }[];
  };
  template: 'just-listed' | 'open-house' | 'price-drop' | 'sold' | 'showcase';
  aspectRatio: '9:16' | '1:1' | '16:9';
  musicTrack?: string;
  voiceoverUrl?: string;
  brandColors: { primary: string; background: string };
}> = ({ listing, template, aspectRatio, musicTrack, voiceoverUrl, brandColors }) => {
  const dimensions = getDimensions(aspectRatio);
  const TemplateComponent = getTemplate(template);

  return (
    <AbsoluteFill style={{ backgroundColor: brandColors.background }}>
      <TemplateComponent
        listing={listing}
        dimensions={dimensions}
        brandColors={brandColors}
      />

      {/* Audio layer */}
      {voiceoverUrl && <Audio src={voiceoverUrl} volume={1.0} />}
      {musicTrack && (
        <Audio
          src={staticFile(`music/${musicTrack}.mp3`)}
          volume={voiceoverUrl ? 0.3 : 0.6} // Duck music under voiceover
          loop
        />
      )}
    </AbsoluteFill>
  );
};
```

### Template Component Example: JustListed.tsx

```tsx
import { Sequence, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { IntroCard } from '../components/IntroCard';
import { PhotoSlideshow } from '../components/PhotoSlideshow';
import { TextOverlay } from '../components/TextOverlay';
import { EndCard } from '../components/EndCard';

export const JustListed: React.FC<{
  listing: any;
  dimensions: { width: number; height: number };
  brandColors: any;
}> = ({ listing, dimensions, brandColors }) => {
  const { fps } = useVideoConfig();

  // Timeline:
  // 0-90 frames (3s): Intro card "JUST LISTED"
  // 90-690 frames (20s): Photo slideshow (5 photos x 4s each)
  // 690-840 frames (5s): End card with agent info

  return (
    <>
      {/* Intro card */}
      <Sequence from={0} durationInFrames={90}>
        <IntroCard
          text="JUST LISTED"
          address={listing.address}
          brandColors={brandColors}
        />
      </Sequence>

      {/* Photo slideshow */}
      <Sequence from={90} durationInFrames={600}>
        <PhotoSlideshow
          photos={listing.photos}
          photoDuration={4} // seconds per photo
          transition="fade"
          dimensions={dimensions}
        />
        <TextOverlay
          price={listing.price}
          address={listing.address}
          beds={listing.beds}
          baths={listing.baths}
          position="bottom"
          brandColors={brandColors}
        />
      </Sequence>

      {/* End card */}
      <Sequence from={690} durationInFrames={150}>
        <EndCard
          agentName="Your Agent Name"
          agentPhone="(555) 123-4567"
          agentLogo="/agent-logo.png"
          brandColors={brandColors}
        />
      </Sequence>
    </>
  );
};
```

**Key patterns:**
- **Sequence-based timeline:** Each section (intro, slideshow, end card) is a `<Sequence>` with `from` and `durationInFrames`
- **Frame-accurate timing:** All animations use `useCurrentFrame()` and `interpolate()` for smooth transitions
- **Reusable components:** `<IntroCard>`, `<PhotoSlideshow>`, `<TextOverlay>` are shared across templates
- **Aspect ratio agnostic:** All positioning/sizing uses percentage-based values or dimension props

---

## Patterns to Follow

### Pattern 1: Aspect Ratio Abstraction
**What:** Calculate all dimensions based on aspect ratio prop, never hardcode pixel values
**When:** Always — videos must render in 9:16, 1:1, and 16:9 without code changes
**Example:**
```tsx
// utils/aspectRatios.ts
export const getDimensions = (aspectRatio: '9:16' | '1:1' | '16:9') => {
  const heights = {
    '9:16': 1920,
    '1:1': 1080,
    '16:9': 1080,
  };
  const widths = {
    '9:16': 1080,
    '1:1': 1080,
    '16:9': 1920,
  };
  return { width: widths[aspectRatio], height: heights[aspectRatio] };
};

// In composition:
const { width, height } = getDimensions(aspectRatio);

<div style={{
  fontSize: height * 0.05, // 5% of video height (scales with aspect ratio)
  bottom: height * 0.1,    // 10% from bottom (relative positioning)
}}>
```

---

### Pattern 2: Photo Loading with Fallback
**What:** Always use `<Img>` from Remotion, handle loading states, provide fallbacks
**When:** Loading remote images from Cloudinary/Supabase
**Example:**
```tsx
import { Img, continueRender, delayRender } from 'remotion';
import { useState, useEffect } from 'react';

export const SafeImg: React.FC<{ src: string }> = ({ src }) => {
  const [handle] = useState(() => delayRender());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoaded(true);
      continueRender(handle);
    };
    img.onerror = () => {
      console.error('Failed to load image:', src);
      continueRender(handle); // Don't block render on failed image
    };
  }, [src, handle]);

  return <Img src={src} style={{ opacity: loaded ? 1 : 0 }} />;
};
```

---

### Pattern 3: Voiceover + Music Ducking
**What:** Reduce music volume when voiceover is speaking, restore after
**When:** Any template with both voiceover and music
**Example:**
```tsx
import { Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import { getAudioDurationInFrames } from '@remotion/media-utils';

export const AudioMixer: React.FC<{
  voiceoverUrl?: string;
  musicTrack?: string;
}> = ({ voiceoverUrl, musicTrack }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // If voiceover exists, calculate its duration
  const voiceoverDuration = voiceoverUrl
    ? getAudioDurationInFrames({ src: voiceoverUrl, fps })
    : 0;

  return (
    <>
      {voiceoverUrl && (
        <Audio src={voiceoverUrl} volume={1.0} />
      )}
      {musicTrack && (
        <Audio
          src={staticFile(`music/${musicTrack}.mp3`)}
          volume={(f) => {
            // Duck music during voiceover
            if (voiceoverUrl && f < voiceoverDuration) {
              return 0.25; // 25% volume during voiceover
            }
            return 0.6; // 60% volume otherwise
          }}
          loop
        />
      )}
    </>
  );
};
```

---

### Pattern 4: Template Selection Logic
**What:** Auto-select template based on listing lifecycle status
**When:** Marketing pipeline auto-generation (no user input)
**Example:**
```tsx
// app/api/video/generate/route.ts
function selectTemplate(listing: Listing): TemplateId {
  if (listing.status === 'sold') return 'sold';
  if (listing.status === 'pending') return 'sold'; // "Under Contract" uses sold template

  // Check if open house is scheduled
  const hasOpenHouse = listing.open_house_date && new Date(listing.open_house_date) > new Date();
  if (hasOpenHouse) return 'open-house';

  // Check if price dropped recently
  const priceDrop = listing.price_history?.find(
    (h) => h.type === 'price_drop' && Date.now() - new Date(h.date).getTime() < 7 * 24 * 60 * 60 * 1000
  );
  if (priceDrop) return 'price-drop';

  // Check if newly listed (within 7 days)
  const listingAge = Date.now() - new Date(listing.created_at).getTime();
  if (listingAge < 7 * 24 * 60 * 60 * 1000) return 'just-listed';

  // Default to property showcase
  return 'showcase';
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded Pixel Values
**What goes wrong:** Text/elements sized for 9:16 look tiny on 16:9, or overflow on 1:1
**Why it happens:** Developer tests in one aspect ratio and hardcodes values
**Instead:** Always use percentage-based sizing or dimension props
```tsx
// BAD
<div style={{ fontSize: 72, bottom: 100 }}>

// GOOD
<div style={{
  fontSize: dimensions.height * 0.06, // 6% of height
  bottom: dimensions.height * 0.08,   // 8% from bottom
}}>
```

---

### Anti-Pattern 2: Using `<img>` Instead of `<Img>`
**What goes wrong:** Videos render with blank frames because images haven't loaded yet
**Why it happens:** Developer uses standard HTML `<img>` tag
**Instead:** Always use Remotion's `<Img>` component (waits for image load before rendering frame)
```tsx
// BAD
<img src={photo.url} />

// GOOD
import { Img } from 'remotion';
<Img src={photo.url} />
```

---

### Anti-Pattern 3: CSS Animations/Transitions
**What goes wrong:** Animations don't render in video (CSS transitions require DOM, videos are frame-by-frame)
**Why it happens:** Developer expects CSS `transition: opacity 0.5s` to work
**Instead:** Use Remotion's `interpolate()` for all animations
```tsx
// BAD
<div className="fade-in" style={{ transition: 'opacity 0.5s' }}>

// GOOD
import { interpolate, useCurrentFrame } from 'remotion';

const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

<div style={{ opacity }}>
```

---

### Anti-Pattern 4: Synchronous External API Calls in Composition
**What goes wrong:** Render blocks waiting for API responses, Lambda times out
**Why it happens:** Developer fetches data inside composition render
**Instead:** Fetch all data in API route BEFORE calling `renderMediaOnLambda()`, pass as inputProps
```tsx
// BAD (in composition)
const { data: listing } = await supabase.from('listings').select('*').eq('id', listingId).single();

// GOOD (in API route before render)
const { data: listing } = await supabase.from('listings').select('*').eq('id', listingId).single();

await renderMediaOnLambda({
  inputProps: { listing }, // Pass data as props
});
```

---

### Anti-Pattern 5: Not Handling Missing/Null Data
**What goes wrong:** Video render crashes if listing.price is null or photo URL is broken
**Why it happens:** Assuming all data is present
**Instead:** Always provide fallbacks and null checks
```tsx
// BAD
<div>${listing.price.toLocaleString()}</div>

// GOOD
<div>{listing.price ? `$${listing.price.toLocaleString()}` : 'Contact for Price'}</div>
```

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Rendering throughput** | Lambda auto-scales (5-10 concurrent renders) | Lambda scales to 100+ concurrent | May need dedicated render farm or queue throttling |
| **Storage cost** | S3 (~$5/mo) + R2 (~$2/mo) | S3 (~$50/mo) + R2 (~$20/mo) | Move to R2-only (skip S3, direct Lambda output to R2 via custom function) |
| **Video delivery** | Cloudinary free tier (25 GB/mo) | Cloudinary Pro ($99/mo, 250 GB) | Cloudinary Enterprise or R2 public URLs with caching |
| **Database (video_render_jobs)** | ~1K records/mo, negligible | ~100K records/mo, still small | Archive old records (move to cold storage after 90 days) |
| **API rate limits** | Supabase free tier (500 req/min) | Supabase Pro (1000 req/min) | Connection pooling, read replicas |
| **Lambda cold starts** | 2-5s delay, acceptable | Pre-warm Lambda functions with scheduled pings | Reserved concurrency (50-100 instances) to eliminate cold starts |

**Optimization strategies:**
- **Batch rendering:** Queue multiple videos, render in parallel (Lambda scales automatically)
- **Template caching:** Pre-bundle Remotion compositions, skip bundling step (saves 10-30s per render)
- **Progressive delivery:** Start with low-res preview (480p), generate 1080p in background
- **CDN caching:** Cloudinary caches videos at edge, reduces origin bandwidth

---

## Sources

**High confidence sources:**
- **Existing SnapR codebase:** `/Users/baba/snap-R/apps/processor/src/marketing-handler.ts` (always-complete pipeline pattern), `/Users/baba/snap-R/lib/social/publish-service.ts` (social publishing architecture)
- **Agent skills:** `.agents/skills/remotion-best-practices/` (Remotion composition patterns, anti-patterns)
- **Training data:** Remotion documentation (composition architecture, audio mixing, image loading)

**Confidence:**
- **HIGH:** Component boundaries, data flow, Remotion composition patterns (proven in existing skills and docs)
- **MEDIUM:** Scalability numbers (based on typical Lambda/Cloudinary pricing, not SnapR-specific projections)
- **NEEDS VERIFICATION:** LinkedIn video publishing API (current code returns 501, unclear if supported in 2026)
