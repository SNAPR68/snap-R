# SnapR Explainer Video Script
# Target: ~160 seconds | ~345 words at 130 wpm
# 16:9 (1920x1080) @ 30fps

---

## SCENE PLAN (15 scenes + intro + closing = 17 total)

| # | Scene | Duration | Screenshot | Voiceover |
|---|-------|----------|------------|-----------|
| 0 | Intro Card | 4s | (animated title) | — |
| 1 | Homepage | 10s | homepage.png (scroll) | Opening hook |
| 2 | Dashboard | 10s | dashboard.png | Command center |
| 3 | AI Studio | 12s | studio.png | Enhancement tools |
| 4 | Content Studio | 10s | content-studio.png | Marketing automation |
| 5 | Video Creator | 8s | video-creator.png | AI videos |
| 6 | Social Publish | 9s | social-settings.png | 5 platforms |
| 7 | Calendar | 8s | calendar.png | Scheduling |
| 8 | Analytics | 10s | analytics.png | Performance tracking |
| 9 | Lead CRM | 10s | leads.png (NEW) | Lead management |
| 10 | Open Houses | 8s | open-houses.png (NEW) | Event management |
| 11 | Broker Dashboard | 12s | broker.png (NEW) | Team oversight |
| 12 | Photographer Portal | 10s | photographer.png (NEW) | Delivery & booking |
| 13 | Booking Form | 8s | booking-form.png (NEW) | Public booking |
| 14 | Pricing | 8s | pricing.png (scroll) | Plans |
| 15 | Closing CTA | 6s | (animated card) | — |
| | **TOTAL** | **~153s** | | |

---

## VOICEOVER SCRIPT

**[Scene 1 — Homepage, 10s]**
SnapR is the AI-powered marketing platform built for real estate. Upload your property photos — and we handle everything else.

**[Scene 2 — Dashboard, 10s]**
Your dashboard is mission control. Every listing, its preparation status, marketing progress, upcoming posts, and recent activity — all in one place.

**[Scene 3 — AI Studio, 12s]**
The AI Studio gives you fifteen professional enhancement tools. Replace skies, stage empty rooms, add twilight lighting, remove clutter, correct perspectives — each with instant before-and-after previews.

**[Scene 4 — Content Studio, 10s]**
Once your photos are enhanced, marketing kicks in automatically. SnapR generates property descriptions, platform-specific captions, hashtags, and a branded property website — all in seconds.

**[Scene 5 — Video Creator, 8s]**
Create cinematic property videos with AI voiceover. Choose a script style, pick a voice, select your aspect ratio, and render in minutes.

**[Scene 6 — Social Publish, 9s]**
Connect your accounts — Facebook, Instagram, LinkedIn, TikTok, and Twitter. SnapR publishes directly to all five platforms with UTM tracking built in.

**[Scene 7 — Calendar, 8s]**
The content calendar shows every scheduled and published post. Drag and drop to reschedule. Never miss a posting window.

**[Scene 8 — Analytics, 10s]**
Track everything. Impressions, engagement, clicks, and cost per lead — broken down by platform, by listing, and by content type. Know exactly what's working.

**[Scene 9 — Lead CRM, 10s]**
Every lead flows into a built-in CRM. View them as a list or drag them through a Kanban pipeline — from New to Contacted to Closed. Auto-scoring tracks engagement, and drip sequences nurture leads on autopilot.

**[Scene 10 — Open Houses, 8s]**
Manage open house events with guest check-in pages. Attendees register on their phones, and their data flows straight into your lead pipeline.

**[Scene 11 — Broker Dashboard, 12s]**
Brokers get a team command center. See every agent's listings, lead counts, and performance charts. Invite agents with role-based access — admins manage the team, editors create content, viewers observe. One dashboard for the entire brokerage.

**[Scene 12 — Photographer Portal, 10s]**
Photographers get their own white-label portal. Deliver enhanced photos to clients with branded gallery links — your logo, your colors, zero SnapR branding. Track views and downloads per client.

**[Scene 13 — Booking Form, 8s]**
Agents book photography shoots through your branded public page. They pick a package, enter property details, choose a date, and submit. You manage the pipeline from pending to delivered.

**[Scene 14 — Pricing, 8s]**
Start free with all fifteen AI tools. Upgrade when you're ready — Starter, Pro, or Agency. Social publishing and full automation unlock on Pro.

---

## WORD COUNT: ~340 words
## ESTIMATED DURATION AT 130 WPM: ~157 seconds
## TOTAL VIDEO WITH INTRO + CLOSING: ~167 seconds (2 min 47 sec)

---

## SCREENSHOTS NEEDED (NEW)

5 new screenshots required:
1. **leads.png** — `/dashboard/leads` (lead list or Kanban view)
2. **open-houses.png** — `/dashboard/open-houses` (event list)
3. **broker.png** — `/dashboard/broker` (team overview with charts)
4. **photographer.png** — `/dashboard/photographer` (delivery portal)
5. **booking-form.png** — `/book/[slug]` (public booking page)

These need to be captured via the Puppeteer script (capture-explainer-v3.mjs) with auth cookies for authenticated pages.
