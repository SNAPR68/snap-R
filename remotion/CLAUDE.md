# Remotion Video Pipeline — remotion/

React-based video compositions rendered on AWS Lambda.

## Versions (pinned)

- Remotion 4.0.424 — upgrades break Lambda bundle compatibility; coordinate before bumping
- Zod 3.22.3 — Remotion internals break on Zod v4

## Lambda config

- Function: `remotion-render-4-0-424-mem3008mb-disk2048mb-900sec`
- Memory: 3008 MB, Disk: 2048 MB, Timeout: 900s
- Region: `us-east-1`
- S3 bucket: `remotionlambda-useast1-64vfat1kzg`
- Always use `framesPerLambda: 20000` — forces single-lambda rendering. AWS account concurrency is low; splitting across lambdas causes `TooManyRequestsException`.

## Deploy

```bash
# After composition changes (redeploy serve URL)
export $(grep -E '^REMOTION_AWS' .env.local | xargs) \
  && npx remotion lambda sites create --site-name=snapr-video remotion/index.ts

# After function config changes (memory/timeout/disk)
export $(grep -E '^REMOTION_AWS' .env.local | xargs) \
  && npx remotion lambda functions deploy --memory=3008 --disk=2048 --timeout=900
```

After redeploying function, update `REMOTION_LAMBDA_FUNCTION_NAME` in **both** `.env.local` and Vercel env vars.

## Compositions

Five property templates × 3 aspect ratios (`9x16`, `16x9`, `1x1`) + one explainer:
- PropertyShowcase (Ken Burns + closing card)
- JustListed (urgency pacing)
- OpenHouse (date badge)
- PriceDrop (price reduced badge)
- Sold (celebration styling)
- ExplainerVideo (16:9, 50s, 10-scene product walkthrough)

## Next.js integration

`next.config.mjs` must include:
```js
serverExternalPackages: [
  '@remotion/lambda',
  '@remotion/lambda-client',
  '@remotion/serverless'
]
```
Webpack re-bundling of the pre-built 76K-line `@remotion/lambda-client` breaks `.map()` calls at runtime.

## Audio

`AudioLayer.tsx` mixes background music + voiceover. Music ducks to 30% under voiceover automatically. Voiceover sources:
- Primary: ElevenLabs (`eleven_monolingual_v1`)
- Fallback: OpenAI TTS HD (`tts-1-hd`)
- 4 script styles × 6 voices (3 male, 3 female)

## Explainer video

- Cloudinary: `snapr-explainer-video.mp4` — bump the version in `components/explainer-video-player.tsx` after every re-upload
- Screenshots: `public/explainer-frames-v3/` (v3 full-page) with fallback to `public/explainer-frames/` (v1 viewport) for authenticated pages — Puppeteer auth in `scripts/capture-explainer-v3.mjs` is broken, fix before recapturing dashboard/studio frames
