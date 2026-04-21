proceed
# SnapR Forensic Audit Report
**Date:** February 2026  
**Scope:** Complete project tree, functionalities, working/broken status, user flow

---

## A. Complete Project Tree

```
snap-R/
├── app/                          # Next.js App Router
│   ├── (authenticated)/          # Auth-protected routes
│   │   ├── billing/
│   │   ├── jobs/[id]/
│   │   ├── listings/[id]/
│   │   ├── listings/
│   │   ├── settings/
│   │   ├── upload/
│   │   └── layout.tsx
│   ├── academy/                  # Educational content (photos, plans, troubleshooting)
│   ├── admin/                    # Admin panel (users, contacts, logs, ai-decisions)
│   ├── auth/                     # login, signup, callback
│   ├── dashboard/                # Main dashboard + all dashboard sections
│   │   ├── content-studio/        # Facebook, Instagram, LinkedIn, TikTok, Video, etc.
│   │   ├── portfolio/[id]/        # edit, items
│   │   ├── settings/             # social, notifications, watermark
│   │   └── [staging, calendar, campaigns, analytics, leads, approvals, ...]
│   ├── org/[slug]/               # Organization dashboard
│   ├── portfolio/[slug]/         # Public portfolio view
│   ├── p/[slug]/                 # Public property site
│   ├── tour/[slug]/              # Tour page
│   ├── share/[token]/            # Share gallery
│   ├── api/                      # 134 API route files
│   ├── page.tsx                  # Landing
│   ├── onboarding/
│   ├── pricing/
│   ├── checkout/
│   ├── contact/
│   ├── faq/
│   ├── terms/
│   ├── privacy/
│   ├── partners/
│   └── founding/
├── apps/
│   ├── processor/                # Cloudflare Worker (photo + marketing pipeline)
│   └── mobile/                   # Mobile app (React Native?)
├── components/                   # React components
├── lib/
│   ├── ai/                       # AI engine (listing-engine, providers, router)
│   ├── supabase/                 # client, server, admin
│   ├── content/                  # limits, billing
│   ├── social/                   # publish-service, oauth-config
│   ├── video/                    # photo-ordering, voiceover-service
│   └── validation/               # Zod schemas
├── remotion/                     # Video compositions
│   ├── compositions/             # PropertyShowcase, JustListed, OpenHouse, PriceDrop, Sold
│   └── components/
├── database/                    # Supabase schema reference
├── supabase/migrations/          # 32 migrations
├── docs/
├── vercel.json                   # Crons, function config
├── package.json
└── next.config.mjs
```

---

## B. In-Built Functionalities

### API Routes (134 total)

| Category | Routes | Purpose |
|----------|--------|---------|
| **Listing/Prepare** | `/api/listing/prepare`, `/api/listing/status` | Trigger AI prep, poll status |
| **Upload** | `/api/upload`, `/api/upload-image` | Photo upload to Supabase |
| **Enhance** | `/api/enhance`, `/api/batch-enhance`, `/api/enhance-quick`, `/api/staging` | Single/batch enhancement |
| **Marketing** | `/api/marketing/trigger`, `/api/marketing/status`, `/api/marketing/print-materials`, `/api/marketing/mls-export` | Marketing pipeline |
| **Video** | `/api/video/generate`, `/api/video/status`, `/api/video/watch`, `/api/video/health`, `/api/video/voiceover`, `/api/internal/video-generate` | Remotion Lambda, proxy, voiceover |
| **Social** | `/api/social/oauth/[platform]`, `/api/social/publish`, `/api/social/connections`, `/api/social/scheduled` | OAuth, publish, connections |
| **Cron** | `/api/cron/publish-scheduled` (every 15 min), `/api/cron/sync-analytics` (every 6h), `/api/cron/refresh-tokens` (every 4h), `/api/cron/daily-digest` (8 AM UTC) | Background jobs |
| **Stripe** | `/api/stripe/checkout`, `/api/stripe/webhook`, `/api/stripe/portal`, `/api/stripe/addon-purchase`, `/api/stripe/human-edit-checkout` | Billing |
| **Portfolio** | `/api/portfolio`, `/api/portfolio/items` | CRUD portfolios |
| **AI** | `/api/ai/photo-cull`, `/api/ai/generate-description`, `/api/ai/generate-caption` | Photo cull, descriptions, captions |
| **Analytics** | `/api/analytics`, `/api/analytics/posts`, `/api/analytics/roi`, `/api/analytics/track` | Engagement metrics |
| **Content** | `/api/content-library`, `/api/drafts`, `/api/schedule` | Content studio |
| **Other** | `/api/share`, `/api/download-all`, `/api/contact`, `/api/leads`, `/api/brand`, `/api/cma`, `/api/renovation`, `/api/listing-intelligence`, `/api/translate` | Misc |

### 23 AI Enhancement Tools (lib/ai/router.ts)

**Exterior:** sky-replacement, virtual-twilight, lawn-repair, pool-enhance  
**Seasonal:** snow-removal, seasonal-spring/summer/fall  
**Interior:** declutter, virtual-staging, fire-fireplace, tv-screen, lights-on, window-masking  
**Enhance:** hdr, auto-enhance, perspective-correction, lens-correction, color-balance  
**Fix:** reflection-removal, power-line-removal, object-removal, flash-fix  

### Cron Jobs (vercel.json)

| Cron | Schedule | Purpose |
|------|----------|---------|
| publish-scheduled | */15 * * * * | Publish queued posts to social platforms |
| sync-analytics | 0 */6 * * * | Sync engagement metrics from platforms |
| refresh-tokens | 0 */4 * * * | Refresh OAuth tokens |
| daily-digest | 0 8 * * * | Daily digest email |

### Third-Party Integrations

- **Supabase:** Auth, PostgreSQL, RLS, Storage (raw-images)
- **Cloudflare:** Worker (processor), R2 (processed images), Queues
- **Cloudinary:** CDN for images/videos
- **Stripe:** Subscriptions, checkout, webhooks
- **OpenAI:** GPT-4o (descriptions, voiceover), GPT-4o-mini (captions)
- **Replicate / Runware / AutoEnhance:** Image enhancement providers
- **ElevenLabs:** Voiceover TTS
- **Remotion + AWS Lambda:** Video rendering
- **Resend:** Email
- **Social:** Facebook, Instagram, LinkedIn, TikTok OAuth + publishing
- **Sentry:** Error monitoring
- **Vercel:** Hosting, serverless functions

### Dashboard Sections (Sidebar)

**Overview:** Dashboard, My Listings  
**Create:** Content Studio, Brand Profile, Virtual Staging, Property Sites  
**Publish:** Calendar, Auto-Post Rules, Campaigns  
**Measure:** Analytics, Leads, Client Approvals  
**More Tools:** AI Descriptions, Portfolios, Property Gallery, AI Voiceover, CMA, Photo Culling, Renovation, Listing Intel, Email Marketing, Partner Program  
**Account:** Team, Settings, Billing  

---

## C. Working vs Broken Audit

### ✅ Fully Working

| Area | Status | Notes |
|------|--------|-------|
| Auth | ✅ | Supabase Auth, login, signup, callback |
| Onboarding | ✅ | 7-step flow (profile, role, region, social, brand, plan, success) |
| Upload | ✅ | `/api/upload`, raw-images bucket |
| Listing Prepare | ✅ | POST `/api/listing/prepare` → Worker → jobs table |
| Listing Status | ✅ | GET `/api/listing/status` with job status |
| Photo Enhancement | ✅ | 23 tools via Worker (Replicate, Runware, AutoEnhance) |
| Marketing Pipeline | ✅ | 5-step: description → captions → MLS → property site → scheduled posts |
| Cron Publisher | ✅ | Every 15 min, gates by plan (canPublish) |
| Token Refresh | ✅ | Every 4h |
| Video Generation | ✅ | Remotion Lambda, signed URLs for photos, proxy `/api/video/watch` |
| Portfolio | ✅ | CRUD, edit page, items page, import from listings |
| Content Studio | ✅ | Facebook, Instagram, LinkedIn, TikTok, Video Creator |
| Stripe | ✅ | Checkout, webhook, portal |
| Property Sites | ✅ | Public `/p/[slug]` |
| Share Galleries | ✅ | `/share/[token]` |
| OAuth Social | ✅ | Facebook, Instagram, LinkedIn, TikTok (callback `/api/social/oauth/[platform]`) |

### ⚠️ Partial / Gated

| Area | Status | Notes |
|------|--------|-------|
| Free tier | ⚠️ | Marketing skipped, canPublish false, Content Studio access gated |
| TikTok | ⚠️ | Code complete, needs `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` on Vercel + app audit |
| Usage limits | ⚠️ | Counted on listing creation, not preparation; `/api/listing/prepare` has no subscription check |
| 2FA | ⚠️ | UI shows "Coming Soon" |

### ❌ Coming Soon / Placeholder

| Area | Location | Notes |
|------|----------|-------|
| iOS App | Landing page | "iOS App Coming Soon" |
| Two-Factor Auth | Settings | Badge "Coming Soon" |
| LinkedIn/TikTok connect | Settings > Social | "Coming Soon" badges |
| Campaign "coming_soon" | Campaigns settings | One campaign type |

### 🗑️ Deprecated / Removed

| Route | Status |
|-------|--------|
| `/api/listing/prepare-stream` | **410 Gone** — use POST `/api/listing/prepare` + poll GET `/api/listing/status` |

### Known Gaps (from PHASE1_HARDENING_AUDIT)

- `/api/listing/prepare` does **not** check subscription or usage limits before creating job
- `profiles.listings_used_this_month` incremented on listing creation, not preparation
- Worker does not log costs to `api_costs` or update `total_cost_cents`
- PATCH `/api/listing/status` allows direct mutation of `preparation_status` (could desync from Worker)

---

## D. Full User Flow

### 1. Anonymous → Signed Up

```
Landing (/) 
  → See Demo (#see-demo), Pricing, FAQ, Academy
  → Sign up (/auth/signup) or Log in (/auth/login)
  → Supabase Auth callback
  → Redirect to /onboarding (if new) or /dashboard
```

### 2. Onboarding (7 steps)

```
Step 1: Profile (name, company, region, role)
Step 2: Social platforms (Facebook, Instagram, LinkedIn)
Step 3: Brand (business name, logo)
Step 4: Plan selection (Free, Starter, Pro, Agency)
Step 5: Billing (Stripe checkout if paid)
Step 6: Success / first listing prompt
Step 7: Optional "Import first listing"
  → Redirect to /dashboard or /listings/new
```

### 3. Core Loop: Upload → Prepare → Market → Distribute

```
1. UPLOAD
   /listings/new or /(authenticated)/upload
   → Photos to Supabase Storage (raw-images)
   → Creates listing + photos rows

2. PREPARE
   Listing detail page → "Prepare" button
   → POST /api/listing/prepare
   → Creates job, sets preparation_status='preparing'|'queued'
   → HTTP trigger to Cloudflare Worker
   → Worker: AI analysis → enhancement tools → upload to R2 → update photos.processed_url
   → preparation-overlay polls GET /api/listing/status (job + listing status)

3. MARKET (auto-triggers after preparation)
   Worker marketing-handler: 5-step pipeline
   - Step 1: GPT-4o description
   - Step 2: Captions (per platform)
   - Step 3: MLS export
   - Step 4: Property site
   - Step 5: Scheduled posts
   → marketing_jobs, scheduled_posts populated

4. DISTRIBUTE
   Vercel Cron every 15 min: /api/cron/publish-scheduled
   → Fetches scheduled_posts with status='pending'
   → Publishes to Facebook/Instagram/LinkedIn/TikTok (if canPublish)
   → Writes to published_posts

5. MEASURE
   Vercel Cron every 6h: /api/cron/sync-analytics
   → Fetches engagement from platforms
   → Updates published_posts (likes, comments, shares, impressions)
```

### 4. Content Studio Flow

```
/dashboard/content-studio
  → Select listing
  → Create tab: Facebook, Instagram, LinkedIn, TikTok, Video
  → Video Creator: template + aspect ratio + voiceover → POST /api/video/generate
  → Poll /api/video/status → Play via /api/video/watch (proxied)
  → Add to calendar, schedule, or publish
```

### 5. Portfolio Flow

```
/dashboard/portfolio
  → Create portfolio
  → /dashboard/portfolio/[id]/edit — settings, theme, accent
  → /dashboard/portfolio/[id]/items — add/reorder/import from listings
  → Public: /portfolio/[slug]
```

### 6. Billing Flow

```
/dashboard/billing
  → View plan, usage
  → Stripe checkout for upgrade
  → Webhook: checkout.session.completed, invoice.payment_succeeded
  → Profile updated (plan, subscription_status)
```

### 7. Public Entry Points

```
/                   — Landing
/p/[slug]           — Public property site
/portfolio/[slug]   — Public portfolio
/share/[token]      — Share gallery (signed)
/tour/[slug]        — Tour page
```

### 8. Admin Flow

```
/admin/login
  → /admin (command center)
  → Users, Contacts, Revenue, Logs, AI Decisions, Human Edits, Partners, etc.
```

---

## Summary

- **Project:** ~2800 TS/TSX/JSON source files; 134 API routes; 124 pages
- **Automation:** Full loop Upload → Prepare → Market → Distribute → Measure
- **AI:** 23 enhancement tools, GPT descriptions/captions, voiceover, video
- **Social:** Facebook, Instagram, LinkedIn, TikTok (TikTok pending env + audit)
- **Known issues:** No subscription check on prepare; usage counted at creation; Worker cost logging missing; some "Coming Soon" features
