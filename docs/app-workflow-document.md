# SnapR — Complete App Workflow Document

## What Is SnapR?

SnapR is an AI-powered real estate marketing platform. It takes ordinary property photos and transforms them into a full marketing engine — enhanced photos, property descriptions, social media posts, property websites, lead capture, analytics, and team management — all automated.

The tagline: **"Photos to fully published listing in under ten minutes."**

---

## Who Is SnapR For?

### 1. Real Estate Agents
The primary user. Agents upload property photos, and SnapR handles everything from enhancement to publishing.

**Their workflow:**
1. Upload raw property photos
2. AI prepares them (sky replacement, virtual staging, twilight, declutter — 15 tools)
3. Marketing auto-generates: property description, social captions, property website, scheduled posts
4. Posts auto-publish to Facebook, Instagram, LinkedIn, TikTok, and Twitter/X
5. Analytics track reach, engagement, clicks, and leads across every platform
6. Leads flow into a built-in CRM with scoring, drip sequences, and bulk email

### 2. Brokers & Team Leaders
Brokers manage multiple agents under one roof.

**Their workflow:**
1. Create a team and invite agents (admin, editor, viewer roles)
2. Broker dashboard shows all agents' listings, lead counts, and performance charts
3. Bar chart: listings per agent. Pie chart: listings by preparation status
4. Click any agent's listing to view or edit it directly
5. Invite new agents via email — secure token links with 7-day expiry
6. Role-based access: admins manage team, editors create content, viewers observe

### 3. Photographers
Photographers use SnapR as their delivery and booking platform — white-labeled under their own brand.

**Delivery workflow:**
1. Upload and enhance property photos in the AI Studio
2. Navigate to Photographer Portal → select listing → click "Deliver"
3. Choose a client (from CRM) or enter new client details
4. Add personal message, set link expiry, enable/disable downloads
5. Client receives a branded email with "View & Download Photos" link
6. Client opens a photographer-branded gallery — no SnapR branding visible
7. Photographer tracks: views, downloads, per-client delivery history

**Booking workflow:**
1. Photographer sets up packages (pricing, features, estimated duration)
2. Agents visit `snap-r.com/book/[photographer-slug]` — a public booking form
3. Agent selects package → enters property details → picks preferred date → submits
4. Photographer sees booking in pipeline: Pending → Confirmed → Shot → Editing → Delivered
5. Each status transition is one click. Confirmed requires setting a date.

---

## The Full Platform — Feature by Feature

### Homepage & Onboarding
- Hero section with explainer video and call-to-action
- Before/after photo gallery showcasing AI enhancements
- Pricing tiers: Free, Starter ($29), Pro ($79), Agency ($199)
- Free PDF guide: 6 chapters on real estate marketing
- Sign up → onboarding checklist guides first listing

### Dashboard (Command Center)
- Quick stats: published posts, total engagement, plan usage
- Listings grid with preparation + marketing status badges
- Getting started checklist (has listings, has brand, has socials, has prepared, has marketing)
- Activity feed: recent completions, upcoming posts, recent publishes
- Calendar widget showing next 50 scheduled posts
- Currently processing thumbnails (real-time)

### Listings Management
- Create, search, filter, sort listings
- Status pipeline: Pending → Preparing → Prepared → Marketing → Marketed
- Each listing card: thumbnail, title, address, price, photo count, status

### AI Studio (Photo Enhancement)
- 15 AI enhancement tools across 3 categories:
  - **Exterior:** Sky replacement (4 presets), virtual twilight, lawn repair, pool enhance
  - **Interior:** Declutter, virtual staging, fire/fireplace, TV screen, lights on, window masking
  - **Enhance:** HDR, auto enhance, perspective correction, lens correction, color balance
- Before/after slider for every enhancement
- Each tool has presets (e.g., Clear Blue Sky, Sunset, Dramatic Clouds)
- Downloads panel: ZIP export of all enhanced photos (watermark-free on paid plans)
- Marketing results panel: auto-generated description, captions, property site link

### Content Studio (Marketing Hub)
- **Post Creator:** Select listing → choose platforms → select post type → AI generates captions + hashtags
- **Drafts:** Save, edit, duplicate post drafts before publishing
- **Calendar:** Month view with scheduled posts, drag-and-drop rescheduling
- **Video Creator:** AI-scripted property videos with voiceover (4 script styles, 6 voices, 3 aspect ratios)
- **Email Templates:** 150+ branded email templates for campaigns
- **Sites:** Auto-generated property landing pages with lead capture forms
- **Bulk Create:** Generate marketing content for multiple listings at once

### Social Publishing (5 Platforms)
- Connect accounts via OAuth: Facebook, Instagram, LinkedIn, TikTok, Twitter/X
- Cron publishes scheduled posts every 15 minutes
- Platform-specific formatting and hashtags
- UTM tracking on every post (auto-appended property site links)

### Analytics
- Engagement metrics: likes, comments, shares, impressions, reach
- Daily trend charts
- Platform breakdown (which platform performs best)
- Top 5 performing posts
- Cost per metric: cost/listing, cost/lead, cost/engagement
- Content type performance comparison
- Analytics sync every 6 hours via cron

### Lead CRM
- **List view:** All leads with name, email, phone, status, score, source
- **Kanban pipeline:** 7 columns (New → Contacted → Qualified → Touring → Offer → Closed → Lost)
- **Drag-and-drop** between pipeline stages
- **Auto-scoring:** Activities add points (call +10, showing +20, form +15, site view +8, email +5)
- **Activity timeline:** Full history of every interaction per lead
- **Drip sequences:** Automated multi-step email sequences with template variables
- **Bulk email:** Select leads, compose message with {{name}} merge tags, send via Resend
- **Email lists:** Contact management with status filters and selection tools

### Open Houses
- Create events with date, time, address, capacity
- Public check-in page: guests enter name, email, phone, interest rating
- Attendee tracking with interest ratings and comments
- Auto-creates leads from check-in data

### Broker Dashboard
- Team overview: agent roster with roles, listing counts, avatars
- Aggregated stats: total agents, active listings, total leads
- Charts: listings per agent (bar), listings by status (pie)
- Click any listing to open in Studio
- Team management: invite agents, change roles, remove members
- Role hierarchy: Owner → Admin → Editor → Viewer

### Photographer Portal
- **Delivery tab:** Generate branded delivery links per listing per client
- **Clients tab:** CRM of all agents/clients with delivery history
- **Bookings:** Pipeline management (Pending → Confirmed → Shot → Editing → Delivered)
- **Public booking form:** Agent-facing, photographer-branded, 5-step wizard
- **White-label:** Custom logo, colors, platform name — no SnapR branding on client-facing pages

### Settings
- Social connections (5 platforms with OAuth)
- Outgoing webhooks (8 event types, HMAC-SHA256 signed)
- Notification preferences (email, WhatsApp, quiet hours)
- MLS compliance settings
- Data privacy (GDPR/CCPA export/delete)

### Property Sites (Public)
- Auto-generated landing pages at `snap-r.com/p/[slug]`
- Hero gallery with Ken Burns zoom, property details, agent contact card
- Virtual tour embed, interactive map
- Lead capture form (pro/agency tiers)
- SEO optimized: Open Graph, Twitter Cards, JSON-LD structured data

### Outgoing Webhooks
- 8 event types: listing.created, listing.updated, listing.prepared, lead.created, lead.updated, post.published, post.scheduled, photo.enhanced
- HMAC-SHA256 signature verification
- Delivery log with response bodies

### Pricing Tiers
| Tier | Price | Listings/mo | AI Captions | Social Publish | Content Studio |
|------|-------|------------|-------------|----------------|----------------|
| Free | $0 | 2 | 0 | No | No |
| Starter | $29 | 5 | 10 | No | Yes |
| Pro | $79 | 30 | 50 | Yes | Yes |
| Agency | $199 | Unlimited | Unlimited | Yes | Yes |

All 15 AI enhancement tools available on every plan.

---

## The Automation Loop

```
Upload → Prepare → Market → Distribute → Measure → Loop
```

1. **Upload:** Photos go to Supabase Storage
2. **Prepare:** AI enhancement pipeline (15 tools) via Cloudflare Worker
3. **Market:** 5-step pipeline auto-triggers (description → captions → MLS → property site → scheduled posts)
4. **Distribute:** Cron publisher posts to 5 platforms every 15 min
5. **Measure:** Analytics sync cron fetches engagement metrics every 6 hours
6. **Loop:** Status changes (price drop, open house) re-trigger marketing
