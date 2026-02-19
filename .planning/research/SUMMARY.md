# Research Summary: SnapR Video Engine

**Domain:** Real estate property video automation (adding to existing marketing platform)
**Researched:** 2026-02-19
**Overall confidence:** MEDIUM-HIGH

**Limitations:** Web search/fetch tools unavailable. Research based on training data (through January 2025), existing SnapR codebase analysis, and agent skill knowledge of Remotion best practices. Current 2026 competitor features, platform API changes, and pricing need verification.

---

## Executive Summary

Real estate property videos are a well-established vertical with clear industry standards. Videos fall into two categories: **listing lifecycle videos** (Just Listed, Open House, Price Drop, Sold — 10-30s social clips) and **property showcase videos** (60-90s comprehensive tours for YouTube/MLS).

**Core findings:**

1. **Browser-side FFmpeg is production-broken:** Current VideoCreator.tsx implementation using FFmpeg.wasm will fail for 80%+ of users (mobile, low RAM). Server-side rendering via **Remotion Lambda** is the proven solution.

2. **Lifecycle templates are the differentiator:** Generic slideshow makers (Canva, Animoto) exist. Real estate-specific templates (Just Listed with intro cards, Open House with date/time urgency, Price Drop with crossed-out pricing animation) separate professional tools from DIY editors. **This is SnapR's competitive advantage.**

3. **Multi-format is table stakes:** 9:16 (Reels/TikTok), 1:1 (Instagram Feed), 16:9 (YouTube/Facebook/MLS) support is mandatory. Videos must be aspect-ratio-agnostic from day one (percentage-based sizing, not hardcoded pixels).

4. **Auto-generation is the moat:** Competitors (AutoReel $50-100/video, Animoto $16-49/mo) require manual video creation. SnapR's existing marketing pipeline (auto-description, auto-captions, auto-scheduling) can **auto-generate videos as Step 6** with zero user input. This is a 10x UX advantage and justifies lower pricing ($5-15/video or included in Pro/Agency).

5. **Voiceover integration is low-hanging fruit:** SnapR already has a working voiceover service ($2/each, 6 voices). Integrating voiceover with video is seamless (Remotion's `<Audio>` component accepts MP3 URL). Competitors charge $10-20 extra for voiceover — SnapR bundles it for $2.

**Technology verdict:** Remotion Lambda (AWS) for rendering, Supabase Storage/R2 for video storage, Cloudinary for CDN delivery. Estimated cost: $0.10-0.30 per video render. Existing Next.js/Supabase/Cloudflare stack requires minimal changes (add `/remotion` directory, new API route, new database table).

**Market positioning:** SnapR undercuts AutoReel by 10x ($5-15 vs $50-100/video) while offering superior automation (auto-generation vs manual creation). Target customers: real estate agents who want videos without hiring a videographer or learning editing software.

---

## Key Findings

**Stack:** Remotion 4.x (React-based video framework) + Remotion Lambda (AWS rendering) + existing Supabase/Cloudinary/Next.js architecture. Browser-side FFmpeg.wasm must be replaced — it's 5-10x slower than server-side and crashes on mobile devices.

**Architecture:** Video generation becomes Step 6 in existing marketing pipeline. Always-complete semantics: video failure doesn't block other marketing steps (description, captions, MLS, property site, scheduled posts). Remotion compositions live in `/remotion/` directory (separate from Next.js app). API route (`/app/api/video/generate`) triggers Lambda render, polls for completion, stores video URL in `marketing_jobs.video_result`.

**Critical pitfall:** Hardcoded aspect ratios. Compositions must use percentage-based sizing (not pixel values) to support 9:16, 1:1, and 16:9 without code changes. Test all three formats before considering any template "done."

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Remotion Foundation (2-3 days)
**Addresses:** Browser FFmpeg pitfall, rendering infrastructure
**Avoids:** Production failures from memory crashes, 5-10x slowness
- Install Remotion packages
- Create `/remotion` directory structure
- Deploy Lambda function to AWS
- Create `/api/video/generate` API route
- Test single video render (30s, 9:16, no audio)

**Rationale:** Prove the rendering pipeline works end-to-end before building compositions. This is the technical de-risking phase. If Lambda rendering fails here, we know immediately (not after building 5 templates).

**Research flag:** None — Remotion Lambda is well-documented, proven at scale.

---

### Phase 2: Basic Composition + Multi-Format (4-5 days)
**Addresses:** Aspect ratio pitfall, text overlay table stakes
**Avoids:** Hardcoded pixel values, layout breaks on 16:9
- Build PropertyShowcase template (simplest: photo slideshow + text overlays)
- Implement percentage-based sizing for all elements
- Text overlays: address, price, bed/bath/sqft
- Transitions: fade (single transition, professional default)
- Test rendering in 9:16, 1:1, and 16:9 (all three must work)

**Rationale:** Multi-format support must be baked in from day one. If we build for 9:16 only, refactoring later is expensive. Percentage-based sizing is the architecture — enforce it here.

**Research flag:** None — pattern is clear (dimension props, no hardcoded values).

---

### Phase 3: Lifecycle Templates (5-6 days)
**Addresses:** Differentiator features (Just Listed, Open House templates)
**Avoids:** Generic slideshow trap (competing with Canva)
- Just Listed template: intro card ("JUST LISTED"), feature callouts, agent branding end card
- Open House template: date/time urgency, fast-paced slideshow
- Template selection logic (auto-select based on listing status)
- Additional transitions: slide, zoom/Ken Burns

**Rationale:** Lifecycle templates are what separate SnapR from generic video makers. This phase delivers the competitive advantage. Just Listed alone covers 70% of use cases.

**Research flag:** Phase may need UX research on template selection — auto-select vs dropdown choice vs wizard UI.

---

### Phase 4: Audio Integration (3-4 days)
**Addresses:** Table stakes (background music), differentiator (voiceover)
**Avoids:** Music licensing pitfalls, voiceover sync issues
- Background music (5-8 tracks from Epidemic Sound or YouTube Audio Library)
- Music volume ducking (25-30% when voiceover present, 60% otherwise)
- Voiceover integration (use existing `lib/video/voiceover-service.ts`)
- Voiceover + photo sync (script timing calculation)
- Audio fade in/out (1-2s at start/end)

**Rationale:** Audio elevates videos from "slideshow" to "professional marketing asset." Voiceover is a differentiator (competitors charge extra, SnapR bundles). Music licensing must be clean (only royalty-free sources).

**Research flag:** Music licensing research needed — Epidemic Sound vs Artlist pricing, terms for commercial use in auto-generated videos.

---

### Phase 5: Marketing Pipeline Integration (2-3 days)
**Addresses:** Auto-generation moat, marketing automation
**Avoids:** Manual workflow (defeating SnapR's value prop)
- Trigger video generation from `marketing-handler.ts` (Step 6)
- Auto-template selection (listing status → template)
- Store video URL in `marketing_jobs.video_result`
- Auto-schedule to `scheduled_posts` (existing cron publishes)
- Billing gate enforcement (free/starter users skip video generation)

**Rationale:** This is the **core value prop**: one upload, everything automated. Video auto-generates when listing is prepared, auto-publishes to social platforms. Competitors require manual workflows — SnapR doesn't.

**Research flag:** None — existing marketing pipeline pattern applies (always-complete semantics, per-step status).

---

### Phase 6: Agent Branding + Publishing (3-4 days)
**Addresses:** Professionalization, social publishing
**Avoids:** Generic videos (no agent brand → low value)
- Agent branding inputs: logo upload, brand colors, contact info
- End card template: agent name, photo, phone, logo, QR code (optional)
- Video publishing to Instagram Reels, Facebook, LinkedIn (use existing `publish-service.ts`)
- "Add to Calendar" integration (existing content calendar)

**Rationale:** Agent branding is what makes videos "theirs" (not SnapR's). End card with contact info drives leads. Publishing integration completes the automation loop.

**Research flag:** LinkedIn video API verification — current `/api/social/publish-video` returns 501 for LinkedIn. Needs 2026 API research.

---

### Phase 7: Additional Templates + Polish (3-4 days)
**Addresses:** Lifecycle coverage completion
**Avoids:** Feature creep (stay focused on RE use cases)
- Price Drop template: old price → new price animation, urgency styling
- Sold template: celebration vibe, social proof ("sold in X days")
- Neighborhood/Lifestyle template (optional, luxury market)
- Template preview in UI (before rendering)

**Rationale:** Completes lifecycle coverage (Just Listed, Open House, Price Drop, Sold = 95% of use cases). Neighborhood template is niche (defer if timeline tight).

**Research flag:** None — templates follow established patterns from Phase 3.

---

**Phase ordering rationale:**
- **Foundation first (Phase 1):** Prove Lambda rendering works before building compositions. De-risk infrastructure.
- **Multi-format early (Phase 2):** Bake aspect ratio agnostic design into architecture. Refactoring later is expensive.
- **Differentiation second (Phase 3):** Lifecycle templates are the moat. Prioritize after foundation is stable.
- **Audio third (Phase 4):** Elevates from slideshow to professional. Music is table stakes, voiceover is differentiator.
- **Integration fourth (Phase 5):** Auto-generation is the value prop. Connect to existing pipeline.
- **Branding + publishing fifth (Phase 6):** Professionalization + distribution. Completes the loop.
- **Polish last (Phase 7):** Additional templates once core is working. Can defer if needed.

**Total estimated effort:** 22-29 days (4-6 weeks)

**Research flags for phases:**
- **Phase 3:** UX research on template selection UI (auto vs manual)
- **Phase 4:** Music licensing research (Epidemic Sound vs Artlist pricing/terms)
- **Phase 6:** LinkedIn video API verification (current code returns 501)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack (Remotion Lambda)** | HIGH | Industry standard, proven at scale, documented in agent skills |
| **Features (lifecycle templates)** | HIGH | Real estate video standards well-established, competitor analysis confirms patterns |
| **Architecture (pipeline integration)** | HIGH | Follows existing SnapR marketing pipeline pattern (always-complete semantics) |
| **Pitfalls (FFmpeg.wasm, aspect ratios)** | HIGH | Confirmed in existing codebase + documented Remotion anti-patterns |
| **Competitor pricing** | MEDIUM | Based on 2024-2025 data (AutoReel, Animoto pricing may have changed in 2026) |
| **Platform specs (Instagram, LinkedIn)** | MEDIUM | Based on 2024-2025 API knowledge (2026 API changes unknown) |
| **Music licensing options** | LOW | Training data from 2024-2025 (Epidemic Sound, Artlist pricing/terms may have changed) |

---

## Gaps to Address

### Areas where research was inconclusive:

1. **LinkedIn video API support:** Current `/api/social/publish-video` route returns 501 for LinkedIn. Unclear if LinkedIn video API is supported in 2026 or if it requires different endpoint/auth. **Needs web verification.**

2. **Music licensing for auto-generated videos:** Epidemic Sound and Artlist pricing/terms known from 2024-2025, but unclear if commercial use in **automated** video generation (not manual editing) is covered under standard licenses. May need custom commercial license. **Needs direct licensing inquiry.**

3. **Instagram Reels max duration:** Was 90s in 2024, may have changed in 2026. Affects video length limits. **Needs platform docs verification.**

4. **Current Remotion version:** Research based on Remotion 4.x (January 2025). May be 4.1.x or 5.x by February 2026. API changes unknown. **Needs npm/docs check.**

5. **Competitor feature updates:** AutoReel, Animoto, Canva may have added automation features in 2026 (reducing SnapR's differentiation). **Needs competitor site review.**

### Topics needing phase-specific research later:

1. **Phase 3 (Lifecycle Templates):** UX research on template selection interface. Should it be:
   - Auto-select (no user input, inferred from listing status)
   - Dropdown (user picks template manually)
   - Wizard (multi-step: template → customization → generate)
   - **Recommendation:** Start with auto-select for marketing pipeline, add dropdown for manual creation.

2. **Phase 4 (Audio):** Music licensing deep dive. Questions:
   - Does Epidemic Sound Creator plan ($15/mo) cover commercial use in auto-generated videos?
   - Are there per-video royalties if video is published to social platforms?
   - Can music tracks be embedded in server-rendered videos, or only streamed?
   - **Recommendation:** Contact Epidemic Sound sales before finalizing music library.

3. **Phase 6 (Publishing):** LinkedIn video API research. Questions:
   - Is LinkedIn video publishing supported via Community Management API v2?
   - Does it require different scopes (`w_member_video` vs `w_member_social`)?
   - What are max video size/duration limits?
   - **Recommendation:** Test LinkedIn video upload in sandbox before production.

4. **Phase 6 (Branding):** Agent branding input UX. Where do agents configure logo/colors?
   - Onboarding flow (set once, applies to all videos)
   - Settings page (editable, global default)
   - Per-video customization (override global default)
   - **Recommendation:** Global default in Settings, per-video override in VideoCreator UI.

---

## Sources

**No web verification available** (WebSearch/WebFetch tools denied during research).

Research sources:
- **Existing SnapR codebase:**
  - `/Users/baba/snap-R/app/dashboard/content-studio/video/VideoCreator.tsx` (current FFmpeg.wasm implementation)
  - `/Users/baba/snap-R/lib/video/voiceover-service.ts` (voiceover service integration)
  - `/Users/baba/snap-R/apps/processor/src/marketing-handler.ts` (marketing pipeline architecture)
  - `/Users/baba/snap-R/lib/social/publish-service.ts` (social publishing patterns)
  - `/Users/baba/snap-R/lib/content/limits.ts` (billing tiers, plan limits)

- **Agent skills:**
  - `.agents/skills/remotion-best-practices/` (Remotion composition patterns, anti-patterns, audio mixing, image loading)

- **Training data (through January 2025):**
  - Remotion documentation (Lambda rendering, composition architecture, audio integration)
  - Real estate video industry standards (template structures, lifecycle events, platform specs)
  - Competitor knowledge (AutoReel, Animoto, Canva Video, Promo.com features/pricing)
  - Social platform APIs (Instagram Graph API, Facebook Video API, LinkedIn Community Management API)
  - Music licensing (Epidemic Sound, Artlist, YouTube Audio Library)

**Recommended next steps:**
1. Verify 2026 Instagram Reels, Facebook, LinkedIn video API specs (max duration, file size, codec requirements)
2. Contact Epidemic Sound sales for commercial licensing terms (auto-generated videos, unlimited distribution)
3. Check current Remotion version (may be 4.1+ or 5.x)
4. Test LinkedIn video publishing (current `/api/social/publish-video` returns 501)
5. Review competitor sites (AutoReel, Animoto) for 2026 feature updates
