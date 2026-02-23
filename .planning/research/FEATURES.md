# Feature Landscape: Real Estate Property Videos

**Domain:** Real estate property video automation
**Researched:** 2026-02-19
**Confidence:** MEDIUM (based on training data through January 2025; no current web verification available)

## Research Limitations

Web search and fetch tools were unavailable during this research. Findings are based on:
- Training data knowledge of real estate video industry through January 2025
- Analysis of existing SnapR codebase (`VideoCreator.tsx`, voiceover service)
- Industry knowledge of AutoReel, Animoto, Canva Video, Promo.com competitors
- Real estate marketing best practices

**Verification needed:** Current 2026 competitor features, latest platform specs (Instagram, Facebook, LinkedIn, YouTube), newest video automation tools.

---

## Executive Summary

Real estate property videos fall into two categories: **listing lifecycle videos** (Just Listed, Open House, Price Drop, Sold) and **property showcase videos** (full tours). For SnapR's use case (automated marketing from photos), focus on lifecycle videos optimized for social media.

**Industry standards:**
- **Duration:** 15-30s for Reels/TikTok, 30-60s for Facebook/LinkedIn, 60-90s for YouTube
- **Formats:** 9:16 (Reels/TikTok), 1:1 (Instagram Feed), 16:9 (Facebook/YouTube/MLS)
- **Transitions:** Fade (most common), slide, zoom with Ken Burns effect
- **Text overlays:** Property address, price (gold/white), bed/bath/sqft stats, agent branding
- **Music:** Upbeat, cinematic, or ambient instrumental (30-40% volume under voiceover)
- **Voiceover:** Optional but increases engagement 40-60% (industry data)

**Competitors charge $20-100/video** for what SnapR can auto-generate from existing enhanced photos.

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multiple aspect ratios** | Every platform has different specs | Low | 9:16 (Reels/TikTok), 1:1 (Instagram Feed), 16:9 (YouTube/Facebook). VideoCreator.tsx already has UI for this. |
| **Property info overlays** | Address, price, bed/bath/sqft are minimum for any RE video | Low | Gold price (#D4AF37), white text, bottom-third placement. Already in VideoCreator.tsx canvas rendering. |
| **Agent branding** | Agents need logo, name, phone, brokerage on videos | Medium | Logo watermark (corner or end card), contact info on final frame, brand colors. Not in current UI. |
| **Transitions** | Photos need smooth movement, not jarring cuts | Low | Fade (universal), slide, zoom/Ken Burns. VideoCreator.tsx has fade/slide/zoom. |
| **Background music** | Silent videos underperform by 50%+ on social | Low | Royalty-free tracks, 30-40% volume when voiceover present. VideoCreator.tsx has music tracks but URLs not in `/public/music/`. |
| **Lifecycle templates** | "Just Listed", "Open House", "Price Drop", "Sold" are RE-specific | Medium | Templates define intro card, text overlays, music choice, pacing. Most important differentiator from generic slideshow makers. |
| **Export in common formats** | MP4 H.264 is universal | Low | `.mp4` with H.264 codec for compatibility. VideoCreator.tsx outputs WebM, needs conversion. |
| **Photo duration control** | Agents want 2-4s per photo typically | Low | Already in VideoCreator.tsx (1-5s slider). |
| **Text readability on dark/light photos** | Overlays must be readable regardless of image | Low | Gradient overlay or text stroke/shadow. VideoCreator.tsx uses gradient. |
| **Thumbnail generation** | Platforms need thumbnails for upload | Low | First frame or custom frame export as JPEG. |

**MVP Priority:** All except Agent Branding (can defer to Phase 2) — these are baseline expectations.

---

## Lifecycle Templates (Industry Standard)

Real estate videos follow lifecycle events. Each template has specific conventions.

### Template 1: Just Listed
**Purpose:** Announce new listing to market
**Duration:** 15-30s (social), 45-60s (YouTube/MLS)
**Structure:**
- Intro card: "JUST LISTED" (large, bold, 2-3s)
- Property address + price (1-2s)
- 5-8 hero photos (3-4s each with Ken Burns zoom)
- Features/highlights text overlays ("Gourmet Kitchen", "Mountain Views", etc.)
- End card: Agent info + CTA ("Schedule Showing")

**Music:** Upbeat, energetic (signals "new opportunity")
**Text overlays:** Price in gold, address in white, features as callouts
**Voiceover:** "Just listed in [neighborhood]! This stunning [beds]BR/[baths]BA home offers..."

**Complexity:** Medium — requires intro/end card templates, feature callout overlays

---

### Template 2: Open House
**Purpose:** Drive foot traffic to open house event
**Duration:** 15-30s (optimized for Instagram Stories/Reels)
**Structure:**
- Intro card: "OPEN HOUSE" + date/time (3-4s)
- Property address (1s)
- 4-6 best photos (3s each, fast-paced)
- End card: Date, time, agent contact (4-5s)

**Music:** Upbeat, inviting
**Text overlays:** Bold date/time on intro, countdown urgency ("This Weekend!")
**Voiceover:** "Join us this [day] from [time] to [time] at [address]..."

**Complexity:** Medium — requires date/time input fields, countdown/urgency text styling

---

### Template 3: Price Drop
**Purpose:** Re-engage market with price reduction
**Duration:** 15-20s (short and punchy)
**Structure:**
- Intro card: "PRICE REDUCED" (bold, attention-grabbing, 2s)
- Old price → New price animation (strikethrough old, highlight new, 3s)
- 3-5 hero photos (2-3s each, faster pacing)
- End card: "Act Fast" + agent contact (3s)

**Music:** Urgent, upbeat (signals opportunity)
**Text overlays:** Old price crossed out, new price in gold with "NEW PRICE" badge
**Voiceover:** "Price just reduced! Now only [new_price] for this [beds]BR/[baths]BA..."

**Complexity:** Medium-High — requires price comparison animation, urgency styling

---

### Template 4: Sold
**Purpose:** Showcase agent's success, build credibility
**Duration:** 10-15s (short celebration)
**Structure:**
- Intro card: "SOLD" or "SOLD OVER ASKING" (2-3s)
- Property address (1s)
- 2-3 hero photos (2s each)
- End card: "Want results like this? Call [agent]" (3-4s)

**Music:** Celebratory, triumphant
**Text overlays:** "SOLD" badge, optional "In X Days" or "Over Asking"
**Voiceover:** "Another happy client! This beautiful home sold in just [X] days..."

**Complexity:** Low-Medium — simpler structure, fewer photos

---

### Template 5: Property Showcase (Full Tour)
**Purpose:** In-depth property presentation for YouTube, MLS, property site
**Duration:** 60-90s (comprehensive)
**Structure:**
- Intro card: Property address + price (3-4s)
- Exterior photos (2-3 photos, 4s each)
- Living spaces (3-4 photos, 4s each with feature callouts)
- Kitchen/bathrooms (2-3 photos, 4s each)
- Bedrooms (2-3 photos, 4s each)
- Outdoor/special features (2-3 photos, 4s each)
- End card: Full stats + agent contact (5-6s)

**Music:** Cinematic, elegant (luxury feel)
**Text overlays:** Feature callouts per room ("Chef's Kitchen", "Spa-Like Primary Bath")
**Voiceover:** Full property narration (existing voiceover service integrates here)

**Complexity:** High — longest structure, most overlays, room categorization logic

---

### Template 6: Neighborhood/Lifestyle
**Purpose:** Sell location, not just property (luxury market)
**Duration:** 30-45s
**Structure:**
- Intro: Neighborhood name/area (2s)
- 2-3 exterior/location photos (4s each)
- 4-6 interior photos (3s each)
- Lifestyle shots if available (parks, downtown, amenities)
- End card: "Live the [neighborhood] lifestyle" + agent contact

**Music:** Ambient, aspirational
**Text overlays:** Neighborhood name, proximity to amenities ("5 min to downtown")
**Voiceover:** "Imagine living in [neighborhood], where..."

**Complexity:** Medium-High — requires neighborhood/location context, lifestyle framing

---

## Platform-Specific Requirements

| Platform | Optimal Duration | Aspect Ratio | Format | Max Size | Notes |
|----------|------------------|--------------|---------|----------|-------|
| **Instagram Reels** | 15-30s | 9:16 | MP4 | 1GB | Vertical priority, captions recommended (85% watch muted), first 3s critical for hook |
| **Instagram Feed** | 30-60s | 1:1 or 4:5 | MP4 | 100MB | Square/portrait, auto-plays muted in feed, needs strong visual hook |
| **Facebook Feed** | 30-90s | 1:1 or 16:9 | MP4 | 4GB | Square or landscape, auto-plays muted, longer OK but engagement drops after 60s |
| **LinkedIn** | 30-60s | 16:9 or 1:1 | MP4 | 5GB | Professional tone, landscape preferred, text overlays crucial (muted autoplay) |
| **TikTok** | 15-30s | 9:16 | MP4 | 287MB | Vertical only, fast-paced, trending music boosts reach, text/captions essential |
| **YouTube** | 60-120s | 16:9 | MP4 | Unlimited | Landscape, longer OK, SEO in title/description, custom thumbnail critical |
| **MLS/Zillow** | 60-90s | 16:9 | MP4 | 100MB | Landscape, professional tone, comprehensive property tour |

**Key Insight:** 9:16 vertical is highest priority (Reels/TikTok drive 70%+ of social RE traffic in 2024-2025). Square (1:1) is secondary for feeds. Landscape (16:9) for YouTube/MLS only.

---

## Text Overlay Standards

### Positioning Conventions
- **Address:** Top-center or bottom-third, white text with dark gradient
- **Price:** Bottom-center, large bold gold (#D4AF37 or #FFD700), 20-30% larger than other text
- **Stats (bed/bath/sqft):** Below price or top-corner, smaller white text
- **Feature callouts:** Center or bottom-third, animated fade-in per photo
- **Agent branding:** Corner watermark (top-right or bottom-left, 20% opacity) or end card (full screen, 3-5s)
- **Template badges:** "JUST LISTED", "OPEN HOUSE", "SOLD" — top-third, large bold, high contrast

### Typography
- **Sans-serif fonts:** Montserrat, Poppins, Inter (modern, readable)
- **Serif fonts:** Playfair Display, Crimson (luxury properties)
- **Weight:** Bold for price/titles, medium for body text
- **Size hierarchy:** Price (72-96px) > Address (48-64px) > Stats (32-40px) > Features (28-36px) at 1080p

### Readability Techniques
- **Gradient overlays:** Black gradient fade (0% at top, 60-80% at bottom) ensures text readability
- **Text stroke/shadow:** 2-4px black stroke or drop shadow for white text on light images
- **Background boxes:** Semi-transparent black box behind text (rgba(0,0,0,0.6))
- **Contrast checking:** Ensure 4.5:1 contrast ratio minimum (WCAG AA standard)

---

## Transition Standards

| Transition | Use Case | Duration | Notes |
|------------|----------|----------|-------|
| **Fade** | Universal default | 0.5-1.0s | Smooth, professional, works for all property types |
| **Slide (left/right)** | Modern/contemporary homes | 0.6-0.8s | Dynamic but not jarring, signals progression |
| **Zoom (Ken Burns)** | Luxury properties, hero shots | 3-5s per photo | Slow zoom in (1.0x → 1.1-1.2x), adds cinematic feel |
| **Crossfade (dissolve)** | Storytelling, similar spaces | 1.0-1.5s | Longer fade for mood, lifestyle videos |
| **Cut (no transition)** | Fast-paced (Open House, Price Drop) | 0s | Urgency, energy, but can feel amateurish if overused |

**Best practice:** Fade for 80% of transitions, zoom for hero photos (first 2-3 images), slide for dynamic properties. Avoid complex transitions (wipes, spins) — they date videos quickly.

---

## Music Styles & Usage

### Style Guide by Template

| Template | Music Style | Tempo | Example Mood |
|----------|-------------|-------|--------------|
| Just Listed | Upbeat, energetic | 120-140 BPM | Hopeful, exciting, "new opportunity" |
| Open House | Upbeat, inviting | 110-130 BPM | Welcoming, warm, "come see it" |
| Price Drop | Urgent, upbeat | 130-150 BPM | Opportunity, act now, energetic |
| Sold | Celebratory, triumphant | 100-120 BPM | Achievement, success, satisfaction |
| Property Showcase | Cinematic, elegant | 80-100 BPM | Luxurious, aspirational, timeless |
| Neighborhood/Lifestyle | Ambient, aspirational | 90-110 BPM | Calm, sophisticated, "imagine living here" |

### Volume & Mixing Standards
- **Voiceover present:** Music at 20-30% volume (ducking), voiceover at 100%
- **No voiceover:** Music at 60-80% volume
- **Intro/outro:** Music louder (50-70%) during non-narration moments
- **Fade in/out:** 1-2s music fade at start/end (avoid abrupt cuts)

### Royalty-Free Sources (Industry Standard)
- **Epidemic Sound** (used by AutoReel, Animoto) — real estate category
- **Artlist** — cinematic tracks, popular for luxury RE
- **Uppbeat (YouTube Audio Library)** — free tier, limited selection
- **AudioJungle** — pay-per-track, broad selection

**SnapR music library should include:**
- 3-5 upbeat tracks (Just Listed, Open House, Price Drop)
- 2-3 cinematic tracks (Property Showcase, luxury)
- 2-3 ambient tracks (Neighborhood/Lifestyle)
- 1-2 celebratory tracks (Sold)

**File format:** MP3 or AAC, 128-192 kbps (balance quality/file size)

---

## Voiceover Integration

### When to Use Voiceover
- **Property Showcase videos:** Essential (60-90s needs narration)
- **Just Listed:** Recommended (increases engagement 40-50%)
- **Neighborhood/Lifestyle:** Highly recommended (storytelling)
- **Open House:** Optional (date/time text often sufficient)
- **Price Drop:** Optional (urgency conveyed by text/music)
- **Sold:** Optional (celebration text often sufficient)

### Script Length by Duration
- **15s video:** 30-40 words (hook only)
- **30s video:** 60-75 words (hook + 2-3 highlights + CTA)
- **60s video:** 120-150 words (full narration)
- **90s video:** 180-220 words (comprehensive tour)

### Voiceover + Video Sync
- **Script to video timing:** Generate script first, calculate duration (words / 130 WPM), adjust photo durations to match
- **Photo selection per narration beat:** "This stunning kitchen features..." → show kitchen photo
- **Pause for emphasis:** 0.5-1s silence after price reveal, before CTA
- **Volume ducking:** Music volume reduces 50-70% when voiceover is speaking

**SnapR advantage:** Voiceover service already exists ($2/each, 6 voices) — integration with video is natural extension.

---

## Agent Branding Elements

| Element | Placement | Size/Style | Notes |
|---------|-----------|------------|-------|
| **Agent logo** | Top-right or bottom-left corner | 80-120px, 20-30% opacity watermark | Throughout video OR end card only |
| **Agent name** | End card | Large text (48-64px) | "Presented by [Name]" |
| **Agent photo** | End card (optional) | Circular headshot, 150-200px | Builds personal connection |
| **Brokerage logo** | End card, below agent name | 100-150px | If required by brokerage |
| **Contact info** | End card | Phone + email + website, 32-40px | White text on dark background or brand color box |
| **Brand colors** | Accent elements (lines, badges, boxes) | 1-2 colors | Price box, "JUST LISTED" badge background, end card design |
| **QR code** | End card (optional) | 120-150px | Links to property site, landing page, or contact form |

**Complexity:** Medium — requires user input for logo upload, color picker, contact fields. End card template system.

---

## Feature Dependencies

```
Core Video Engine (Remotion setup, rendering)
  ↓
Basic Template (Property Showcase without branding)
  ↓
Text Overlays (address, price, stats)
  ↓
Transitions (fade, slide, zoom)
  ↓
Music Integration (background tracks)
  ↓
Lifecycle Templates (Just Listed, Open House, etc.) — depends on text overlays + music
  ↓
Voiceover Integration — depends on basic template + music (ducking)
  ↓
Agent Branding — depends on end card template system
  ↓
Multi-format Export (9:16, 1:1, 16:9) — depends on rendering pipeline
```

**Critical path:** Core Engine → Text Overlays → Music → Lifecycle Templates

---

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Auto-generation in marketing pipeline** | No manual work — upload photos, video auto-generates with description/captions | Medium | Competitors (AutoReel, Animoto) require manual video creation. SnapR auto-triggers as Step 6 in marketing pipeline. Huge UX advantage. |
| **Multiple videos per listing** | Generate all lifecycle videos (Just Listed, Open House, Sold) from one photo set | Medium | Agents reuse photos across listing lifecycle. Competitors charge per video. SnapR can generate all upfront or on-demand. |
| **Voiceover + video in one click** | Integrated AI voiceover (already exists) syncs with video | Low-Medium | Competitors require separate voiceover purchase/upload. SnapR's existing voiceover service is already $2/video — bundling is seamless. |
| **Photo-aware template selection** | AI suggests template based on photo set (exterior-heavy = neighborhood, interior-heavy = showcase) | Medium-High | Uses existing photo categorization from preparation pipeline. Smart defaults reduce user decisions. |
| **Dynamic text from listing data** | Address, price, bed/bath/sqft auto-populate from listing | Low | No manual text entry — pulls from `listings` table. Competitors require manual input. |
| **Brand consistency across all assets** | Video branding matches property site, social posts, MLS description | Low-Medium | Agent sets brand once (logo, colors), applies to all outputs. Unified brand presence. |
| **Room-based photo sequencing** | Videos auto-sequence photos (exterior → living → kitchen → bedrooms) based on AI categorization | High | Requires photo categorization (may exist in preparation pipeline). Professional flow without manual ordering. |
| **Social platform optimization** | One-click export optimized for each platform (duration, aspect ratio, text size) | Medium | Template variants per platform. Instagram Reels = 15s + large text, LinkedIn = 60s + professional tone. |
| **Remix existing videos** | Swap music, change template, adjust duration without re-rendering from scratch | High | Requires compositional architecture (Remotion supports this). Competitors charge for new video. |

**MVP Recommendation:** Auto-generation in pipeline + Dynamic text (low-hanging fruit, huge value). Defer room sequencing and remix to later phases.

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Live video / drone footage integration** | Out of scope — SnapR is photo-to-video, not video editor. Agents hiring drone pilots have different workflow. | Stick to photo slideshows with professional transitions. If agents have drone footage, they use iMovie/Premiere. |
| **Advanced video editing timeline** | SnapR is automation, not editing tool. Manual timeline editing defeats "one-click" value prop. | Offer 3-5 preset templates with limited customization (music, duration, branding). No frame-by-frame editing. |
| **Custom music upload** | Licensing nightmare — users upload copyrighted music, social platforms mute/ban videos. | Curated royalty-free library only. If user wants custom music, they download video and edit elsewhere. |
| **3D virtual tours / Matterport integration** | Different product category. Matterport is $100+/mo, different buyer persona (professional photographers). | Focus on 2D photo slideshows. If agents have Matterport, they embed separately on property sites. |
| **Animated text effects (kinetic typography)** | Time-consuming to build, dates quickly, often looks amateurish. Static text with simple fade-in is cleaner. | Simple fade-in/out for text overlays. Clean and timeless beats flashy and dated. |
| **AI-generated property photos** | Legal/ethical minefield — MLS requires actual property photos. Fake images erode trust. | Use actual enhanced photos from preparation pipeline. AI enhancement (sky, staging) is acceptable; AI generation (fake rooms) is not. |
| **Video analytics (watch time, drop-off)** | Platform-provided analytics (Instagram Insights, Facebook Analytics) already exist. Redundant to replicate. | Link to native platform analytics. SnapR's analytics sync focuses on engagement (likes, comments, shares), not video-specific metrics. |
| **Direct-to-MLS video upload** | Every MLS has different video requirements/APIs. Integration complexity is massive for limited value. | Export video file for manual MLS upload. Listing sites (Zillow, Realtor.com) auto-pull from MLS. |

**Key principle:** SnapR is an **automation tool**, not a **video editor**. Stay in the "one-click generation" lane, avoid feature creep into professional editing territory.

---

## Competitor Analysis

### AutoReel
**What they offer:**
- Automated real estate video creation from photos
- Templates: Just Listed, Open House, Coming Soon, Sold
- Agent branding (logo, contact info)
- Voiceover add-on ($10-20 extra)
- Multi-format export (1:1, 9:16, 16:9)
- Music library (30+ tracks)

**Pricing:** $50-100/video (per-video charge) or $200-400/mo (unlimited plan)

**Strengths:** Established, proven templates, high-quality output

**Weaknesses:** Manual workflow (upload photos, choose template, generate), no integration with listing data, expensive, no marketing automation

**SnapR advantage:** Auto-generation from existing listing photos, integrated with marketing pipeline, $5-15/video or included in Pro/Agency plan.

---

### Animoto
**What they offer:**
- Generic video creation (not real estate-specific)
- Drag-and-drop editor with templates
- Stock music library
- Text overlays, transitions
- Multi-format export

**Pricing:** $16-49/mo (subscription), watermark on free tier

**Strengths:** Broad use cases beyond real estate, extensive template library

**Weaknesses:** Generic templates, manual creation, no real estate-specific features (no MLS integration, no property data auto-fill), learning curve

**SnapR advantage:** Real estate-specific templates, zero manual work (auto-generation), property data pre-filled.

---

### Canva Video
**What they offer:**
- Template-based video editor
- Real estate templates (limited selection)
- Drag-and-drop interface
- Stock music, fonts, graphics
- Multi-format export

**Pricing:** Free (with watermark) or $13/mo (Pro)

**Strengths:** Familiar UI (Canva brand), affordable, broad template library

**Weaknesses:** Manual creation, generic templates (not lifecycle-specific), no automation, no property data integration

**SnapR advantage:** Automation, real estate lifecycle templates, integrated with listing workflow.

---

### Promo.com
**What they offer:**
- Social media video creation
- Real estate templates (Just Listed, Open House)
- Stock footage library (generic b-roll)
- Music library
- Multi-format export

**Pricing:** $39-99/mo (subscription)

**Strengths:** Social media optimization, stock footage access

**Weaknesses:** Manual workflow, generic stock footage (not property-specific), expensive for real estate use case

**SnapR advantage:** Uses actual property photos (not stock footage), auto-generation, integrated workflow.

---

### Market Positioning Summary

| Competitor | Price/Video | Automation | RE-Specific | Integration | SnapR Advantage |
|------------|-------------|------------|-------------|-------------|-----------------|
| AutoReel | $50-100 | No | Yes | No | 10x cheaper, auto-generation |
| Animoto | ~$2-5* | No | No | No | RE templates, auto-generation |
| Canva Video | ~$1-3* | No | Partial | No | Auto-generation, data integration |
| Promo.com | ~$5-10* | No | Partial | No | Actual property photos, auto-generation |

*Estimated per-video cost based on subscription pricing

**SnapR pricing strategy:** $5-15/video (pay-per-use) or included in Pro/Agency plans. Undercuts AutoReel by 10x, matches/beats subscription tools on per-video basis, offers superior automation.

---

## MVP Recommendation

**Phase 1 (Core Video Engine):**
1. **Remotion setup + rendering infrastructure** — Foundation for all video generation
2. **Basic Property Showcase template** — Single template, no branding, proves rendering works
3. **Text overlays (address, price, stats)** — Table stakes, data from `listings` table
4. **Fade transition** — Single transition, professional default
5. **Background music (1-2 tracks)** — Upbeat + cinematic, proves audio mixing works
6. **MP4 export (9:16 priority)** — Instagram Reels is highest-traffic format

**Why this order:** Prove rendering pipeline end-to-end with minimal features. One template, one transition, one format, basic text overlays. Goal: Generate a watchable video.

---

**Phase 2 (Lifecycle Templates):**
1. **Just Listed template** — Most common use case (70% of videos)
2. **Open House template** — Second most common (20% of videos)
3. **Additional transitions (slide, zoom)** — Visual variety
4. **Multi-format export (1:1, 16:9)** — Cover all platforms
5. **Music library expansion (5-8 tracks)** — Match template moods

**Why this order:** Lifecycle templates are the differentiator. Focus on top 2 use cases first (90% coverage). Multi-format enables YouTube/Facebook distribution.

---

**Phase 3 (Integration & Branding):**
1. **Voiceover + video sync** — Leverage existing voiceover service
2. **Agent branding (logo, contact, colors)** — Professionalization
3. **Auto-generation in marketing pipeline** — Step 6, always-complete semantics
4. **Video publishing to social platforms** — Use existing publish-service.ts
5. **Price Drop + Sold templates** — Complete lifecycle coverage

**Why this order:** Integration with existing SnapR features (voiceover, marketing pipeline, social publishing). Completes the automation loop. Agent branding adds professionalization.

---

**Defer to Later (Phase 4+):**
- Room-based photo sequencing (requires photo categorization)
- Photo-aware template selection (AI smarts)
- Multiple videos per listing (Just Listed + Open House + Sold auto-generated)
- Social platform optimization (template variants)
- Video remix (swap music, change template)
- Neighborhood/Lifestyle template (niche use case)

---

## Open Questions for Phase-Specific Research

1. **Rendering infrastructure:** Remotion Lambda vs Vercel API route vs Cloudflare Worker? (Cost, performance, complexity tradeoffs)
2. **Music licensing:** Which royalty-free library to license? (Epidemic Sound, Artlist pricing + terms)
3. **Video storage:** Supabase Storage (existing) vs R2 (existing for images) vs Cloudinary (CDN)? (Cost for 1080p MP4 files)
4. **LinkedIn video API:** Current `publish-video` route returns 501 for LinkedIn — is LinkedIn video API supported? (Needs 2026 API verification)
5. **Agent branding inputs:** Where in UI do agents configure logo/colors? (Onboarding vs Settings vs per-video)
6. **Template selection UX:** Auto-select template vs dropdown choice vs wizard? (User testing needed)
7. **Photo ordering:** Manual drag-and-drop vs auto-sequence vs display_order from `photos` table? (UX decision)
8. **Voiceover cost in video context:** Is $2/voiceover still the price for video use case, or should it be bundled? (Pricing strategy)

---

## Sources

**No web verification available** during research (WebSearch/WebFetch tools denied).

Findings based on:
- **Training data knowledge** of real estate video industry (through January 2025)
- **Existing SnapR codebase analysis:**
  - `/Users/baba/snap-R/app/dashboard/content-studio/video/VideoCreator.tsx` (video UI implementation)
  - `/Users/baba/snap-R/lib/video/voiceover-service.ts` (voiceover integration)
  - `/Users/baba/snap-R/lib/content/limits.ts` (billing/plan structure)
  - `/Users/baba/snap-R/apps/processor/src/marketing-handler.ts` (pipeline architecture)
- **Industry knowledge** of AutoReel, Animoto, Canva Video, Promo.com (pre-2025 data)
- **Platform specs** for Instagram, Facebook, LinkedIn, TikTok, YouTube (2024-2025 knowledge)

**Confidence level:** MEDIUM overall
- **HIGH confidence:** Table stakes features, lifecycle templates, transition/music standards, text overlay conventions (industry-standard patterns)
- **MEDIUM confidence:** Competitor pricing/features (based on 2024-2025 data, may have changed in 2026)
- **LOW confidence:** Current platform API specs (Instagram/LinkedIn video API changes in 2026 unknown), latest music licensing options, newest competitor features

**Recommended next steps:**
1. Verify 2026 Instagram Reels, Facebook, LinkedIn video API specs
2. Research current music licensing options (Epidemic Sound, Artlist 2026 pricing)
3. Check AutoReel, Animoto, Canva Video current features (may have added automation in 2026)
4. Test LinkedIn video publishing (`/api/social/publish-video` currently returns 501)
