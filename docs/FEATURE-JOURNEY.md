# SnapR — Complete Feature Journey Document

> **Internal Team Reference** | Last updated: 2026-03-16
> Covers the full user journey for all three personas: Photographers, Agents, and Brokers.

---

## Platform Overview

SnapR is an AI-powered photo enhancement and marketing automation platform for real estate professionals. The core loop:

```
Upload → Prepare → Market → Distribute → Measure → Loop
```

**162+ API routes | 39 dashboard areas | 69 pages | 15 AI tools | 5 video templates | 5 social platforms**

---

## 1. Onboarding Journey (All Roles)

### 1.1 Signup & Role Selection
| Step | What Happens | Page |
|------|-------------|------|
| Sign up | Email/password registration | `/auth/signup` |
| Welcome email | 3-step setup guide sent via Resend | Automatic |
| Onboarding wizard | 3-step flow: Profile → How It Works → Role toolkit | `/onboarding` |
| Role selection | Photographer, Agent, Broker, Property Manager, or Property Owner | Step 1 |
| Role-specific CTAs | Toolkit overview tailored to selected role | Step 3 |

### 1.2 First-Use Activation (7 Quick Wins)
| Feature | What It Does |
|---------|-------------|
| Hero before/after slider | Homepage draggable demo showing sky replacement |
| Sample listing CTA | "Try with Sample Photos" for zero-listing users |
| Celebration modal | Confetti modal when first listing is prepared |
| Processing toasts | Real-time toast notifications during AI preparation |
| Role-tailored onboarding | Different toolkit highlights per role |

### 1.3 Academy (31 Guide Pages)
Self-serve knowledge base at `/academy`:
- **Getting Started** (4 pages): First listing, studio guide, first enhancement, overview
- **Enhancing Photos** (8 pages): Each of the main AI tools explained
- **Photography Tips** (5 pages): Shooting exteriors/interiors, equipment, composition, lighting
- **Delivering to Clients** (3 pages): Approvals, sharing galleries
- **Plans & Credits** (4 pages): Understanding credits, choosing plan, billing FAQ
- **Troubleshooting** (5 pages): Account, upload, processing, quality issues

---

## 2. Photographer Journey

### 2.1 Setup
```
Signup → Select "Photographer" → Set up profile → Create packages → Set availability
```

| Feature | Description | Location |
|---------|------------|----------|
| Profile setup | Name, business name, bio, contact | `/dashboard/settings` |
| Brand kit | Upload logo, set colors, fonts | `/dashboard/brand` |
| Package creation | Create service tiers (Basic, Premium, Luxury) with pricing | `/dashboard/photographer/bookings` |
| Availability calendar | Set available days/times for bookings | `/dashboard/photographer/bookings` |
| Public portfolio | Showcase best work with shareable link | `/dashboard/portfolio` |
| Public booking form | Branded page where agents book shoots | `/book/[slug]` |

### 2.2 Core Workflow: Booking → Shoot → Deliver
```
Agent books → Photographer confirms → Shoots property → Uploads photos →
AI enhances → Shares gallery → Client approves → Marketing auto-triggers
```

| Stage | Pipeline Status | What Happens |
|-------|----------------|-------------|
| **Pending** | New booking received | Agent filled out booking form with package, property details, preferred date |
| **Confirmed** | Photographer accepts | Date confirmed, both parties notified |
| **Shot** | Photos captured | Photographer marks as shot after visiting property |
| **Editing** | Photos uploaded | Upload to SnapR → AI Prepare → Enhancement pipeline runs |
| **Delivered** | Gallery shared | Client approval link sent → Client views, approves/rejects photos |

### 2.3 AI Enhancement (15 Tools)

**Automatic Mode (Prepare):**
- Upload all photos → Hit "Prepare" → AI classifies each photo (exterior, kitchen, bathroom, living room, etc.) → Applies optimal tool combination automatically
- Typical batch: 30-50 photos processed in under 60 seconds

**Manual Mode (AI Studio):**
| Category | Tools | Presets |
|----------|-------|---------|
| Exterior | Sky Replacement | Clear Blue, Sunset, Dramatic Clouds, Twilight Sky |
| | Virtual Twilight | Multiple twilight intensities |
| | Lawn Repair | Auto-detects and greens lawn areas |
| | Pool Enhancement | Water clarity and color |
| Interior | Declutter | Removes clutter, personal items |
| | Virtual Staging | Furnish empty rooms by room type |
| | Fire in Fireplace | Adds realistic fire glow |
| | TV Screen Art | Replaces TV screens with artwork |
| | Lights On | Illuminates dark rooms |
| | Window Masking | Balances interior/exterior exposure |
| Enhance | HDR Processing | Multi-exposure look |
| | Auto Enhance | One-click color/brightness optimization |
| | Color Balance | White balance and tone correction |
| | Perspective Correction | Straighten verticals |
| | Lens Correction | Remove barrel/pincushion distortion |

### 2.4 Revenue & Analytics
| Metric | Where |
|--------|-------|
| Booking count | `/dashboard/photographer/bookings` pipeline |
| Revenue tracking | Bookings × package price |
| Client satisfaction | Approval rates from gallery shares |
| Portfolio views | Portfolio page analytics |

---

## 3. Agent Journey

### 3.1 Setup
```
Signup → Select "Agent" → Set up profile → Connect social accounts → Upload first listing
```

| Feature | Description | Location |
|---------|------------|----------|
| Profile setup | Name, brokerage, phone, photo | `/dashboard/settings` |
| Social connections | Connect Facebook, Instagram, LinkedIn, TikTok, Twitter | `/dashboard/settings/social` |
| Brand kit | Logo, colors, contact info for marketing materials | `/dashboard/brand` |

### 3.2 Core Workflow: List → Enhance → Market → Close

#### Step 1: Upload Listing
```
Create listing → Enter property details → Upload photos (up to 50MB each)
→ Photos stored in Supabase Storage → Thumbnails generated
```
- Property details: address, price, beds, baths, sqft, description, lot size, year built
- Photo upload: drag-and-drop, multi-file, progress indicator

#### Step 2: AI Preparation
```
Hit "Prepare" → AI classifies photos → Applies enhancements → Confidence score calculated
→ Celebration modal with results → Marketing auto-triggers
```
- Status tracking: `raw` → `processing` → `prepared`
- Each photo gets a `confidence` score and `tools_applied` list
- Preparation metadata includes `decisionAudit` (photo type classification) and `photoAudit`

#### Step 3: Marketing Pipeline (Automatic)
```
Listing prepared → 6-step marketing pipeline fires:
1. Description (GPT-4o, ~15¢)
2. Captions (GPT-4o-mini, ~3¢/platform)
3. MLS Package (metadata only, free)
4. Property Website (draft in property_sites, free)
5. Cinematic Video (Remotion Lambda render)
6. Scheduled Posts (auto-queued with UTM tracking, free)
```

**Marketing banner** shows real-time progress (1/6 steps, 2/6 steps, etc.)
- Skipped for free-tier users (with upgrade prompt)
- Always-complete semantics: each step independent

#### Step 4: Distribution
```
Cron runs every 15 minutes → Publishes due posts →
Token refresh if expiring → Billing gate check → Platform API call →
Bridge to published_posts → Webhook dispatch (post.published)
```

| Platform | Post Types | Video Support |
|----------|-----------|--------------|
| Facebook | Page posts with photos | Video via Graph API /videos |
| Instagram | Photo + carousel, Reels | Reels via container → poll → publish |
| LinkedIn | Professional posts | Video upload (3-step flow) |
| TikTok | Photo carousel | Video via PULL_FROM_URL |
| Twitter | Text + media | Video upload |

#### Step 5: Measure
```
Every 6 hours → Sync analytics from all platforms →
Impressions, likes, comments, shares, reach, engagement rate →
Per-listing and per-platform breakdown
```

Analytics dashboard: `/dashboard/analytics`
- ROI tracking: AI spend vs leads generated
- Per-listing analytics: engagement, lead count, cost
- Content calendar: `/dashboard/content-studio/calendar` (drag-and-drop rescheduling)

### 3.3 Lead Management
```
Lead enters CRM (from property site, open house, booking, social, manual) →
Auto-scored → Pipeline: New → Contacted → Qualified → Touring → Offer → Closed/Lost
```

**Lead Sources:**
| Source | Entry Point | Auto-Score |
|--------|------------|-----------|
| Property site contact form | `/p/[slug]` | +15 (form_submitted) |
| Open house check-in | `/open-house/[slug]` | +15 (form_submitted) |
| Social traffic (UTM) | Any social post link | +8 (property_site_viewed) |
| Photographer booking | `/book/[slug]` | +15 (form_submitted) |
| Manual entry | `/dashboard/leads` | 0 |
| API (Enterprise) | `POST /api/v1/leads` | 0 |

**Score Increments:**
| Activity | Points |
|----------|--------|
| Showing | +20 |
| Form submitted | +15 |
| Phone call | +10 |
| Property site viewed | +8 |
| Email / Text | +5 |
| Drip email sent | +2 |
| Score cap | 100 |

**Drip Sequences:**
- Create multi-step email sequences with configurable delays
- Enroll leads manually or automatically
- System sequences protected from deletion
- Runs hourly via cron

### 3.4 Open Houses
```
Create event → Get check-in URL → Display QR at door →
Guests check in on phone → Track attendees → Rate interest →
Attendees auto-flow to CRM leads
```

| Feature | Detail |
|---------|--------|
| Event CRUD | Date, time, capacity, description, listing link |
| Check-in form | Public URL, responsive, no app needed |
| Attendee data | Name, email, phone, source, interest rating |
| Post-event | Feedback collection, lead pipeline integration |

### 3.5 Photographer Booking (Agent Side)
```
Visit photographer's booking page → Select package →
Enter property details → Choose date from available slots →
Submit → Notification sent to photographer
```

### 3.6 Video Creation
```
Content Studio → Video Creator → Select listing →
Choose template (5) → Choose aspect ratio (3) →
Generate AI voiceover script → Select voice (6 options) →
Render on AWS Lambda → Download or auto-schedule
```

| Template | Use Case |
|----------|----------|
| PropertyShowcase | Standard property tour with Ken Burns effect |
| JustListed | Urgency pacing with listing date badge |
| OpenHouse | Open house date and event details |
| PriceDrop | Price reduced badge with comparison |
| Sold | Celebration styling with social proof |

### 3.7 Additional Agent Features
| Feature | Description | Location |
|---------|------------|----------|
| CMA (Comparative Market Analysis) | Comparable property analysis | `/dashboard/cma` |
| Floor Plans | AI-generated floor plan layouts | `/dashboard/floor-plans` |
| Virtual Tours | Scene-based tour builder with hotspots | `/dashboard/virtual-tours` |
| Virtual Staging | Standalone staging for vacant rooms | `/dashboard/staging` |
| Renovation Visualization | Before/after renovation concepts | `/dashboard/renovation` |
| Print Materials | PDF flyers, postcards, brochures | `/dashboard/print` |
| MLS Integration | Import listings from SimplyRETS | `/dashboard/mls` |

---

## 4. Broker Journey

### 4.1 Setup
```
Signup → Select "Broker" → Set up organization → Invite agents →
Configure brand kit → Set team permissions
```

### 4.2 Broker Command Center (`/dashboard/broker`)
| Feature | What It Shows |
|---------|--------------|
| Agent roster | All team members with roles, listing counts, lead counts |
| Team stats | Aggregate listings, leads, published posts across team |
| Performance charts | Activity trends over time |
| Invite agents | Email invitation with role selection (Admin, Editor, Viewer) |

### 4.3 Team Management (`/dashboard/team`)
| Capability | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| View team dashboard | ✅ | ✅ | ✅ |
| Create/edit listings | ✅ | ✅ | ❌ |
| Generate marketing | ✅ | ✅ | ❌ |
| Publish to social | ✅ | ✅ | ❌ |
| Manage leads | ✅ | ✅ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ |

### 4.4 Organization Settings (`/dashboard/organization`)
- Organization name, logo, contact
- Default social accounts (shared across team)
- Notification preferences
- Brand kit (team-wide branding for all generated content)

### 4.5 Broker-Specific Features
| Feature | Description |
|---------|------------|
| Cross-agent analytics | See performance across all agents |
| Team content calendar | View all scheduled/published posts across the brokerage |
| Centralized lead pool | Option to route leads to specific agents |
| White-label (Agency+) | Embeddable widgets with brokerage branding |
| Custom domains (Enterprise) | Map your domain to property sites |
| REST API (Enterprise) | Integrate with existing brokerage CRM/MLS |

---

## 5. Enterprise Features

Available on Enterprise tier ($299/mo or $249/mo annual, 14-day free trial):

### 5.1 REST API v1
- **Auth**: Bearer token with `sk_live_` prefix, SHA-256 hash stored
- **10 endpoint groups**: listings, photos, leads, video, webhooks, status
- **Rate limit**: Configurable per key (default 60 req/min)
- **OpenAPI 3.0 spec**: `/api/v1/openapi.json` (1037 lines)
- **Interactive docs**: `/developers/api-reference`

### 5.2 Custom Domains
- Map your domain to property sites or portfolios
- DNS TXT verification: `_snapr-verify.{domain}`
- Verified every 6 hours by cron
- Full brand control over property site URLs

### 5.3 Embeddable Widgets
- Before/after slider, photo gallery, property card
- iframe-based with auto-resize via postMessage
- Script: `<script src="https://snap-r.com/widget/snapr-embed.js"></script>`
- Agency+ tier

### 5.4 Outgoing Webhooks
- HMAC-SHA256 signed payloads
- Events: listing.created/updated/prepared, lead.created/updated, post.published/scheduled, photo.enhanced
- Delivery log with response tracking
- 10s timeout, always-complete semantics

---

## 6. Billing Tiers

| Feature | Free | Gold | Platinum | Enterprise |
|---------|------|------|----------|-----------|
| Listings/month | 3 | 5-300 (slider) | 5-300 (slider) | Unlimited |
| Photos/listing | 30 | 50 | 75 | Unlimited |
| AI tools | All 15 | All 15 | All 15 | All 15 |
| HD exports | ❌ (watermark) | ✅ | ✅ | ✅ |
| Content Studio | ❌ | ✅ (150+ templates) | ✅ | ✅ |
| Social publishing | ❌ | ✅ | ✅ | ✅ |
| Video creator | ❌ | ✅ | ✅ | ✅ |
| Virtual staging/listing | - | 2 | 5 | Unlimited |
| Email marketing | ❌ | ✅ | ✅ | ✅ |
| Team management | ❌ | ❌ | ✅ | ✅ |
| White-label embed | ❌ | ❌ | ✅ | ✅ |
| REST API | ❌ | ❌ | ❌ | ✅ |
| Custom domains | ❌ | ❌ | ❌ | ✅ |
| Listings rollover | ❌ | ✅ | ✅ | ✅ |

**Pricing:**
- Gold PAYG: $28/listing | Monthly: $20 (5-50), $16 (75+) | Annual: $16 (5-50), $11 (75+)
- Platinum PAYG: $30/listing | Monthly: $22 (5-50), $18 (75+) | Annual: $18 (5-50), $12 (75+)
- Enterprise: $299/mo or $249/mo annual

---

## 7. Notification System

17 notification types with email + WhatsApp (Twilio) delivery:

| Category | Notifications |
|----------|--------------|
| Transactional | listing_prepared, listing_failed, human_edit_complete, export_ready, tour_published |
| Client engagement | client_viewed, client_approved, client_rejected, client_downloaded, client_commented |
| Social | post_published, post_failed |
| Alerts | credits_low, credits_depleted, social_disconnected, subscription_expiring |
| Digests | daily_summary, weekly_report |

**Daily digest** (8am): listings prepared, client views, approvals, posts published, pending actions.

---

## 8. Monitoring & Reliability

| System | What It Does |
|--------|-------------|
| 10 Vercel crons | Publish posts, sync analytics, refresh tokens, digest, drip sequences, usage check, health check, MLS sync, domain verify, cleanup |
| Sentry | Error tracking (server + edge + client), Session Replay, cron monitoring |
| Cron heartbeats | Each cron records success/failure to system_logs, health-check detects staleness |
| Slack alerts | Critical alerts via incoming webhook (throttled, 15-min dedup) |
| Env validation | Fast-fail on missing critical vars at startup |
| Rate limiting | Per-route limits (3-100 req/min depending on endpoint) |

---

## 9. Technical Architecture Summary

```
Frontend: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind + shadcn/ui
Backend:  Supabase (PostgreSQL + Auth + RLS + Realtime + Storage)
Workers:  Cloudflare Workers (photo enhancement + marketing pipeline)
Storage:  Supabase Storage (raw) → Cloudflare R2 (processed) → Cloudinary (CDN)
AI:       OpenAI GPT-4o/4o-mini + Replicate + Runware + AutoEnhance
Video:    Remotion 4.0 + AWS Lambda (rendering) + ElevenLabs/OpenAI TTS
Social:   Facebook Graph API + Instagram API + LinkedIn Community Mgmt + TikTok v2 + Twitter
Payments: Stripe (subscriptions + checkout)
Email:    Resend (transactional) + Twilio (SMS/WhatsApp)
Monitor:  Sentry + OpenTelemetry + custom cron heartbeats + Slack alerts
```

---

*This document is auto-maintained by the engineering team. For product questions, see the Academy at snap-r.com/academy.*
