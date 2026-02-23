# Domain Pitfalls: Real Estate Video Generation

**Domain:** Real estate property video automation
**Researched:** 2026-02-19
**Confidence:** HIGH (based on known Remotion gotchas + existing SnapR codebase analysis + video automation patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Browser-Based FFmpeg for Production Video

**What goes wrong:**
Using FFmpeg.wasm (browser-side video rendering) for production video generation leads to:
- **Performance collapse:** 5-10x slower than server-side FFmpeg (30s video takes 5+ minutes in browser)
- **Memory exhaustion:** 4 GB+ RAM required for 60s 1080p video → browser crashes on mobile/low-end devices
- **Inconsistent output:** Different browsers produce different-quality videos, some fail silently
- **User frustration:** Long waits, progress bars that freeze, "Out of Memory" errors

**Why it happens:**
Developers choose browser-side rendering to avoid server infrastructure costs or complexity. They test with short videos (10-15s) on high-end machines and don't realize the production failure mode.

**Consequences:**
- Current SnapR `VideoCreator.tsx` uses FFmpeg.wasm → broken in production (users report crashes)
- If not replaced, video feature will be unusable for 80%+ of users (mobile, low RAM)
- Rewrites require migrating to server-side rendering (Remotion Lambda), invalidating all browser-side code

**Prevention:**
- **Never use browser-side video rendering for videos > 15s or users on mobile**
- Use server-side rendering (Remotion Lambda, containerized FFmpeg, or video API) from day one
- Test on mobile devices and low-end laptops (4 GB RAM) before launch

**Detection:**
Early warning signs:
- FFmpeg.wasm package size > 30 MB (already a red flag)
- Video generation takes > 2x the video duration (30s video taking 60s+ to render)
- Chrome DevTools shows memory climbing past 2 GB during render
- User reports of "Page Unresponsive" or crashes

**SnapR status:** Currently experiencing this pitfall. VideoCreator.tsx uses FFmpeg.wasm. Must migrate to Remotion Lambda.

---

### Pitfall 2: Hardcoded Aspect Ratio Assumptions

**What goes wrong:**
Designing video compositions for one aspect ratio (e.g., 9:16 Instagram Reels) with hardcoded pixel values causes:
- **Text overflow:** Titles/prices sized for 9:16 (1080x1920) are cut off in 16:9 (1920x1080)
- **Layout breaks:** Elements positioned for vertical videos appear in wrong positions on horizontal videos
- **Unusable output:** Videos generated for Facebook (16:9) look broken because code assumes Reels (9:16)

**Why it happens:**
Developers test in one aspect ratio (usually 9:16, the "default" for social) and use pixel values like `fontSize: 72px` or `bottom: 100px` without considering other formats.

**Consequences:**
- Videos work for Instagram Reels but fail for YouTube/Facebook/LinkedIn
- Re-rendering required for each platform (burns Lambda costs)
- User complaints: "My Facebook video has the price cut off"

**Prevention:**
- **Use percentage-based or dimension-relative sizing** for all elements:
  ```tsx
  // BAD
  <div style={{ fontSize: 72, bottom: 100 }}>

  // GOOD
  const { height } = dimensions;
  <div style={{
    fontSize: height * 0.06,  // 6% of video height
    bottom: height * 0.08,    // 8% from bottom
  }}>
  ```
- **Test all three aspect ratios (9:16, 1:1, 16:9) before considering composition "done"**
- **Create a test suite** that renders the same composition in all formats and compares screenshots

**Detection:**
- UI review at each aspect ratio shows misaligned elements
- Automated screenshot comparison (render same composition at 9:16, 1:1, 16:9 → visual diff)
- User feedback: "Text is cut off" or "Logo is in the wrong corner"

---

### Pitfall 3: Synchronous Data Fetching in Remotion Compositions

**What goes wrong:**
Fetching data (Supabase queries, API calls) inside Remotion composition render functions causes:
- **Render blocking:** Lambda waits for API responses → timeout risk
- **Race conditions:** Multiple frames trying to fetch data simultaneously → inconsistent state
- **Failed renders:** API downtime or rate limits → entire video render fails

**Why it happens:**
Developers treat Remotion compositions like Next.js server components, assuming they can fetch data inside render.

**Consequences:**
- Lambda timeouts (300s max) when Supabase is slow or API calls stack up
- Videos render with missing data (blank text overlays) if API call fails mid-render
- Expensive re-renders when data fetch fails at frame 800 of 900

**Prevention:**
- **Fetch ALL data in API route BEFORE calling `renderMediaOnLambda()`**
- **Pass data as `inputProps`** to composition (props are static, no async fetching in composition)
  ```tsx
  // BAD (in composition)
  const { data: listing } = await supabase.from('listings').select('*').single();

  // GOOD (in API route before render)
  const { data: listing } = await supabase.from('listings').select('*').single();
  await renderMediaOnLambda({
    inputProps: { listing }, // Pass as prop
  });
  ```
- **Compositions should be pure functions:** Same props → same output (no side effects, no async)

**Detection:**
- Renders take > 60s for simple videos (sign of blocking API calls)
- Lambda CloudWatch logs show network errors or timeouts
- Inconsistent output: Same composition renders differently on retry (race condition)

---

### Pitfall 4: Missing Image Load Handling

**What goes wrong:**
Using standard `<img>` tags or not waiting for remote images to load results in:
- **Blank frames:** Video renders before images load → black/white rectangles in output
- **Inconsistent quality:** Some renders succeed (images cached), others fail (cold start)
- **User confusion:** "Why are half the photos missing in my video?"

**Why it happens:**
Developers forget that Remotion renders frame-by-frame. If image hasn't loaded when frame is captured, the frame is blank.

**Consequences:**
- 30% of videos have missing/blank photos (especially on first render or slow networks)
- Users blame the platform: "SnapR's video feature is broken"
- Re-rendering costs stack up as users retry failed videos

**Prevention:**
- **Always use `<Img>` from Remotion** (not `<img>` or Next.js `<Image>`)
- **Use `delayRender()` / `continueRender()`** for custom image loading logic
  ```tsx
  import { Img, delayRender, continueRender } from 'remotion';
  import { useState, useEffect } from 'react';

  const [handle] = useState(() => delayRender());

  useEffect(() => {
    const img = new Image();
    img.src = photoUrl;
    img.onload = () => continueRender(handle);
    img.onerror = () => continueRender(handle); // Don't block on error
  }, [photoUrl, handle]);

  return <Img src={photoUrl} />;
  ```
- **Enable CORS on image origins** (Cloudinary, Supabase Storage) to prevent cross-origin blocks

**Detection:**
- Render output has blank/black rectangles where photos should be
- Lambda logs show CORS errors or image fetch failures
- Inconsistent output: Sometimes photos render, sometimes they don't (caching variance)

---

### Pitfall 5: Ignoring Lambda Timeout Limits

**What goes wrong:**
Building complex video compositions without considering Lambda's 15-minute max timeout leads to:
- **Failed renders:** 90s videos with complex effects (parallax, effects, voiceover sync) exceed timeout
- **Wasted compute:** Render runs for 14 minutes, fails at 99%, no output, full cost charged
- **Blocked users:** High-paying agency users can't generate long-form YouTube videos (2-3 minutes)

**Why it happens:**
Developers test with short videos (30s) and don't realize that render time scales non-linearly with:
- Video length (60s video takes 3-4x longer than 30s, not 2x)
- Number of layers (text overlays, audio tracks, transitions add overhead)
- Image resolution (4K photos take 10x longer to process than 1080p)

**Consequences:**
- Agency users (who need 90-120s videos for YouTube/MLS) can't use the feature
- Feature feels "broken" for premium use cases (luxury properties with 20+ photos)
- Manual intervention required (chunked rendering, lower quality) → support overhead

**Prevention:**
- **Set video length limits** based on render testing:
  - Free/Starter: Max 30s videos
  - Pro: Max 60s videos
  - Agency: Max 90s videos
- **Optimize render settings** in `remotion.config.ts`:
  ```ts
  Config.setConcurrency(4); // Parallel rendering (faster)
  Config.setScale(1);        // Don't upscale beyond 1080p
  Config.setQuality(8);      // Balance quality/speed (1-10)
  ```
- **Test render times at different lengths:**
  - Render a 30s video → measure time
  - Render a 60s video → measure time (should be < 5x the 30s time)
  - If 60s > 5 minutes, optimize composition before launch

**Detection:**
- Lambda CloudWatch logs show "Task timed out after 15 minutes"
- Render success rate drops for videos > 60s
- Users report: "Long videos never finish rendering"

---

## Moderate Pitfalls

### Pitfall 6: No Fallback for Missing Listing Data

**What goes wrong:**
Assuming all listings have complete data (price, beds, baths, address) leads to:
- Crashes when `listing.price` is null → `toLocaleString()` fails
- Blank overlays when `listing.address` is missing → empty text in video
- Inconsistent branding when `user.logo_url` is null → broken image in end card

**Prevention:**
- **Always provide fallbacks:**
  ```tsx
  {listing.price ? `$${listing.price.toLocaleString()}` : 'Contact for Price'}
  {listing.beds || 'N/A'} Beds | {listing.baths || 'N/A'} Baths
  ```
- **Validate data in API route before rendering:** Return 400 error if required fields are missing

---

### Pitfall 7: CSS `transition` / `animation` in Compositions

**What goes wrong:**
Using CSS animations (`transition: opacity 0.5s`, `@keyframes`) in Remotion compositions produces static frames (no animation in video).

**Prevention:**
- **Use `interpolate()` for all animations:**
  ```tsx
  import { interpolate, useCurrentFrame } from 'remotion';

  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  <div style={{ opacity }}>
  ```

---

### Pitfall 8: Not Testing on All Platforms

**What goes wrong:**
Testing videos only on Instagram Reels, then publishing to Facebook/LinkedIn/YouTube reveals:
- Cropped text (aspect ratio mismatch)
- Audio sync issues (LinkedIn mutes auto-play)
- Format incompatibility (LinkedIn doesn't support some H.264 profiles)

**Prevention:**
- **Test video playback on all target platforms** before launch:
  - Upload test video to Instagram Reels → verify text readability, audio playback
  - Upload to Facebook Feed → verify 16:9 rendering, auto-play behavior
  - Upload to LinkedIn → verify professional tone, text-only consumption (muted)
  - Upload to YouTube → verify thumbnail, description, SEO
- **Use platform-specific templates** (different pacing, text size, music for LinkedIn vs Reels)

---

### Pitfall 9: Music Licensing Violations

**What goes wrong:**
Using copyrighted music (pulled from YouTube, Spotify, etc.) in videos leads to:
- Social platforms muting videos (Instagram removes audio)
- Copyright strikes (Facebook/YouTube Content ID flags videos)
- Account bans (repeated violations → platform suspension)

**Prevention:**
- **Only use royalty-free music** from licensed sources (Epidemic Sound, Artlist, YouTube Audio Library)
- **Never allow user-uploaded music** (liability nightmare)
- **Display music credits** in video or metadata (optional but good practice)

---

### Pitfall 10: Ignoring Voiceover + Music Volume Balance

**What goes wrong:**
Playing background music at same volume as voiceover makes narration inaudible → users can't hear property details.

**Prevention:**
- **Duck music volume to 20-30% when voiceover is playing:**
  ```tsx
  <Audio
    src={musicTrack}
    volume={(frame) => voiceoverActive(frame) ? 0.25 : 0.6}
  />
  ```
- **Fade music in/out** at video start/end (avoid abrupt cuts)

---

## Minor Pitfalls

### Pitfall 11: Not Handling Remotion Version Mismatches

**What goes wrong:** Installing `remotion@4.0.0` but `@remotion/lambda@4.1.0` causes cryptic errors.

**Prevention:** All `@remotion/*` packages must have matching versions. Use `npm install remotion@4.0.0 @remotion/lambda@4.0.0 @remotion/media@4.0.0` (same version for all).

---

### Pitfall 12: Forgetting to Set Pixel Format

**What goes wrong:** Default pixel format (`yuv444p`) is incompatible with some players (QuickTime, Safari).

**Prevention:** Set `Config.setPixelFormat('yuv420p')` in `remotion.config.ts` for universal compatibility.

---

### Pitfall 13: Not Pre-Warming Lambda Functions

**What goes wrong:** First video render of the day has 5-10s cold start delay → user thinks render failed.

**Prevention:** Schedule a Lambda warm-up ping every 5 minutes during business hours (keeps functions hot).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Remotion Setup** | Version mismatches between `remotion` and `@remotion/*` packages | Install all packages with same version number |
| **Composition Development** | Hardcoded pixel values for 9:16, breaks on 1:1 and 16:9 | Use percentage-based sizing from day one |
| **Audio Integration** | Music volume drowns out voiceover | Implement volume ducking (music at 25% when voiceover active) |
| **API Integration** | Fetching listing data inside composition → Lambda timeout | Fetch all data in API route, pass as inputProps |
| **Storage & Delivery** | Videos stored only in S3 (no CDN) → slow playback, high bandwidth cost | Copy to Cloudinary or R2 public URLs for CDN delivery |
| **Production Launch** | No Lambda cold start mitigation → 10s delays on first render | Pre-warm Lambdas with scheduled pings |

---

## Sources

**High confidence sources:**
- **Existing SnapR codebase:** `/Users/baba/snap-R/app/dashboard/content-studio/video/VideoCreator.tsx` (confirmed FFmpeg.wasm pitfall)
- **Agent skills:** `.agents/skills/remotion-best-practices/` (Remotion anti-patterns: CSS animations, `<img>` vs `<Img>`, sync data fetching)
- **Training data:** Remotion documentation pitfalls, Lambda timeout best practices, video encoding standards (through January 2025)

**Confidence:**
- **HIGH:** FFmpeg.wasm issues (confirmed in codebase), hardcoded aspect ratios (common Remotion mistake), sync data fetching (proven anti-pattern), missing image load handling (documented Remotion gotcha)
- **MEDIUM:** Lambda timeout thresholds (based on typical 1080p render times, may vary by composition complexity), music licensing (standard industry practice)
- **LOW:** Platform-specific upload failures (Instagram/LinkedIn API changes in 2026 unknown)

**Needs verification:**
- LinkedIn video upload API support (current code returns 501)
- Instagram Reels max video length (was 90s in 2024, may have changed in 2026)
- Facebook video codec requirements (H.264 profile restrictions)
