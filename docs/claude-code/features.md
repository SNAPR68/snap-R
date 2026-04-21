## Cloudflare Worker (apps/processor)

The async processing worker handles both photo enhancement and marketing automation.

**Constraints:**
- No direct Node.js APIs — use Env object for secrets
- Dynamic imports for V2 modules
- R2 bucket: `snapr-images`
- KV namespace: `CHECKPOINTS`

**Key files:**
- `handler.ts` — Photo enhancement handler (Phase 1)
- `marketing-handler.ts` — Marketing pipeline handler (Phase 2)
- `lib/supabase-client.ts` — Supabase client with `db: { schema: 'public' }` config

**Worker URL (dev):** `https://snapr-processor-dev.rajesh-fba.workers.dev`

**Deploy:** `cd apps/processor && npx wrangler deploy`

## Marketing Pipeline (Phase 2)

`apps/processor/src/marketing-handler.ts` — 5-step pipeline with always-complete semantics:

| Step | What | AI Model | Cost |
|------|------|----------|------|
| 1. Description | MLS-quality property description | GPT-4o | ~15c |
| 2. Captions | Platform-specific social captions + hashtags | GPT-4o-mini | ~3c/platform |
| 3. MLS Package | Photo manifest + property metadata | None (metadata) | 0c |
| 4. Property Site | Insert draft into `property_sites` table | None (DB) | 0c |
| 5. Scheduled Posts | Auto-schedule posts with UTM-tagged property site links | None (DB) | 0c |

**Auto-trigger:** Marketing fires automatically when `listings.preparation_status` transitions to `'prepared'` (via webhook/trigger in the preparation flow).

**Status writes:** Handler updates `listings.marketing_status` (`processing` → `completed`/`failed`/`skipped`).

## Social Publishing

`lib/social/publish-service.ts` exports:
- `publishToFacebook(pageAccessToken, pageId, content)` → `PublishResult`
- `publishToInstagram(accessToken, igAccountId, content)` → `PublishResult`
- `publishToLinkedIn(accessToken, personUrn, content)` → `PublishResult`
  - Uses LinkedIn Community Management API v2 (`/rest/posts`)
  - Headers: `LinkedIn-Version: 202401`, `X-Restli-Protocol-Version: 2.0.0`
  - Image upload: 3-step flow (initializeUpload → download → PUT binary)
  - Post URN returned in `x-restli-id` response header
- `publishVideoToTikTok(accessToken, videoUrl, caption)` → `PublishResult`
  - Uses TikTok Content Posting API v2 (`PULL_FROM_URL` method)
  - TikTok fetches video from our S3/CDN URL
  - Unaudited apps default to `privacy_level: 'SELF_ONLY'` (private posts)
- `publishPhotoToTikTok(accessToken, imageUrls, caption)` → `PublishResult`
  - Uses TikTok Photo Posting API (creates photo carousel)

`PublishResult` = `{ success, postId?, postUrl?, error? }`

**UTM Tracking** (`lib/social/utm.ts`):
- `appendUtmParams(url, { platform, postType, listingId })` → URL with UTM query params
- Marketing handler Step 5 auto-appends UTM-tagged property site link to every scheduled post caption
- Params: `utm_source` (platform), `utm_medium` (social), `utm_campaign` (post type), `utm_content` (listing ID)

**OAuth scopes** (`lib/social/oauth-config.ts`):
- LinkedIn: `openid`, `profile`, `email`, `w_member_social`
- TikTok: `user.info.basic`, `video.publish`, `video.upload` (v2 API, uses `client_key` not `client_id`)
- Twitter: Uses PKCE (S256) with code verifier embedded in state
- Facebook: Long-lived token exchange via `fb_exchange_token` grant

**TikTok OAuth specifics:**
- Auth URL: `https://www.tiktok.com/v2/auth/authorize/`
- Token URL: `https://open.tiktokapis.com/v2/oauth/token/` (JSON body, not form-urlencoded)
- Token exchange returns `open_id` (stored as `platform_user_id` in `social_connections`)
- Access tokens last ~24 hours; refresh tokens ~365 days
- Refresh uses JSON body with `client_key` param

## Video Generation (Remotion Lambda)

Property showcase videos rendered via Remotion on AWS Lambda.

### Architecture
```
VideoCreator UI → /api/video/generate → renderMediaOnLambda() → AWS Lambda → S3 → public MP4 URL
                → /api/video/status (polls every 3s via getRenderProgress)
```

### Lambda Function
- **Name**: `remotion-render-4-0-424-mem3008mb-disk2048mb-900sec`
- **Config**: 3GB RAM, 2GB disk, 900s (15 min) timeout
- **Region**: `us-east-1`
- **S3 Bucket**: `remotionlambda-useast1-64vfat1kzg`
- **Serve URL**: Deployed via `npx remotion lambda sites create --site-name=snapr-video remotion/index.ts`
- **Single-lambda rendering**: `framesPerLambda: 20000` forces all frames onto one Lambda (AWS account has low concurrency limit)

### Remotion Commands
```bash
# Deploy Lambda site (after composition changes)
export $(grep -E '^REMOTION_AWS' .env.local | xargs) && npx remotion lambda sites create --site-name=snapr-video remotion/index.ts

# Deploy Lambda function (after timeout/memory changes)
export $(grep -E '^REMOTION_AWS' .env.local | xargs) && npx remotion lambda functions deploy --memory=3008 --disk=2048 --timeout=900

# List functions
export $(grep -E '^REMOTION_AWS' .env.local | xargs) && npx remotion lambda functions ls

# Test local render
npx remotion render PropertyShowcase-9x16

# Render explainer video locally (~50s, ~35MB)
npx remotion render ExplainerVideo --output=/tmp/snapr-explainer-video.mp4 --codec=h264

# Render single explainer frame for testing
npx remotion still ExplainerVideo --frame=950 --output=/tmp/test-frame.png

# Regenerate explainer voiceover (requires OPENAI_API_KEY in .env.local)
node scripts/generate-voiceover.mjs

# Test Lambda render from CLI
export $(grep -E '^REMOTION_AWS' .env.local | xargs) && npx remotion lambda render <serve-url> PropertyShowcase-9x16 --frames-per-lambda=20000
```

### Video Compositions (5 templates × 3 aspect ratios + 1 explainer)
- **PropertyShowcase** — Ken Burns zoom/pan with closing card
- **JustListed** — Urgency pacing with event date badge
- **OpenHouse** — Urgency pacing with open house date
- **PriceDrop** — Price reduced badge with urgency
- **Sold** — Celebration styling with social proof
- **ExplainerVideo** — Homepage product walkthrough (16:9, 50s, 10 scenes of real UI screenshots + shimmer voiceover)

Each property template has 3 variants: `9x16` (vertical), `16x9` (landscape), `1x1` (square)

### Explainer Video
- `remotion/compositions/ExplainerVideo.tsx` — 10-scene product walkthrough (50s, 16:9, 1920x1080 @ 30fps)
- **Screenshot versions**: `public/explainer-frames-v3/` (v3 full-page captures) + fallback from `public/explainer-frames/` (v1 viewport captures for authenticated pages where v3 auth failed)
- **Capture scripts**: `scripts/capture-explainer-v3.mjs` (full-page, auth broken), `scripts/capture-explainer-v2.mjs` (viewport, v1 working)
- **Voiceover**: OpenAI TTS HD `shimmer` voice, generated via `scripts/generate-voiceover.mjs`, saved to `public/explainer-voiceover.mp3`
- `components/explainer-video-player.tsx` — Homepage video player, loads from Cloudinary CDN with poster auto-generation
- **Cloudinary**: `snapr-explainer-video.mp4` (version `v1772556197`, overwrite on re-upload)
- **Scene flow**: Homepage Hero → Before/After Gallery → One Platform → How It Works → Pricing → Signup → Dashboard → AI Studio → Content Studio → Analytics → CTA
- **Scroll modes**: `smooth` (tall page scroll), `pauseAtTop` (hold 1.5s then scroll), `none` (Ken Burns gentle zoom)
- **Known issue**: `capture-explainer-v3.mjs` Puppeteer auth fails — dashboard/studio/content-studio/analytics screenshots are sourced from v1 captures

### Key Files
- `remotion/compositions/PropertyShowcase.tsx` — Main composition with Zod schema
- `remotion/components/AudioLayer.tsx` — Music + voiceover mixing (music ducks to 30% under voiceover)
- `remotion/components/ClosingCard.tsx` — End card with property details
- `lib/video/photo-ordering.ts` — Smart photo ordering using `decisionAudit` from preparation pipeline
- `lib/video/voiceover-service.ts` — GPT-4o script generation + ElevenLabs/OpenAI TTS
- `app/api/video/generate/route.ts` — Trigger Lambda render
- `app/api/video/status/route.ts` — Poll render progress
- `app/api/video/voiceover/route.ts` — 3-action voiceover flow (generate-script → generate-audio → upload-audio)
- `app/dashboard/content-studio/video/VideoCreator.tsx` — Video creator UI

### Database Table
- `video_render_jobs` — Tracks render jobs (render_id, bucket_name, status, input_props)

### Voiceover Pipeline
1. **Script generation** (GPT-4o): Personalized to listing (address, price, beds, baths, sqft, description)
2. **4 script styles**: Professional, Luxury, Friendly, FirstTimeBuyer — each has a different system prompt tone
3. **6 voice options**: 3 male + 3 female across professional/luxury/friendly (ElevenLabs voice IDs)
4. **TTS**: ElevenLabs primary (`eleven_monolingual_v1`), OpenAI TTS HD fallback (`tts-1-hd`)
5. **Duration**: Calculated from photo count × 3s, converted to word count at 130 words/min

### Critical Data Structure Note
`preparation_metadata.photoAudit` is a **Record<string, object>** (NOT an array). Photo type classification lives in `preparation_metadata.decisionAudit[photoId].photoType`. The `photo-ordering.ts` utility reads from `decisionAudit`, not `photoAudit`.

## Vercel Crons

Defined in `vercel.json`:

| Cron | Schedule | File |
|------|----------|------|
| Publish Scheduled Posts | Every 15 min | `app/api/cron/publish-scheduled/route.ts` |
| Sync Analytics | Every 6 hours | `app/api/cron/sync-analytics/route.ts` |
| Refresh Tokens | Every 4 hours | `app/api/cron/refresh-tokens/route.ts` |
| Daily Digest | Daily 8am | `app/api/cron/daily-digest/route.ts` |
| Drip Sequences | Hourly | `app/api/cron/drip-sequences/route.ts` |
| Usage Check | Daily 9am | `app/api/cron/usage-check/route.ts` |
| Health Check | Hourly | `app/api/cron/health-check/route.ts` |
| MLS Sync | Every 6 hours | `app/api/cron/mls-sync/route.ts` |
| Verify Domains | Every 6 hours | `app/api/cron/verify-domains/route.ts` |
| Data Cleanup | Weekly (Sun 3am) | `app/api/cron/cleanup/route.ts` |
| DB Monitor | Daily 6am | `app/api/cron/db-monitor/route.ts` |

All crons use `CRON_SECRET` Bearer auth. Max duration: 300s, memory: 1024MB.

