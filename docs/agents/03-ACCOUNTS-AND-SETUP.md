# Accounts & Setup Checklist

## New Accounts Required

### 1. Ayrshare (Social Media Posting API)
- **URL:** https://www.ayrshare.com/
- **Plan:** Premium ($99/mo) — 13 platforms, 300 posts/mo, analytics
- **What to do:**
  1. Sign up at ayrshare.com
  2. Connect Instagram Business account (@snapr.ai)
  3. Connect Facebook Page (SnapR)
  4. Connect LinkedIn Company Page (SnapR)
  5. Connect TikTok Business account (@snapr.ai)
  6. Connect Twitter/X account (@snapr_ai)
  7. Copy API key → add as `AYRSHARE_API_KEY` to Vercel env vars
- **Monthly cost:** $99

### 2. Hunter.io (Email Finder)
- **URL:** https://hunter.io/
- **Plan:** Starter ($49/mo) — 500 searches + 1000 verifications/mo
- **What to do:**
  1. Sign up at hunter.io
  2. Copy API key → add as `HUNTER_API_KEY` to Vercel env vars
- **Monthly cost:** $49
- **Note:** Upgrade to Growth ($149/mo) when outreach scales past 500 leads/mo

### 3. Google Maps Platform (Lead Discovery)
- **URL:** https://console.cloud.google.com/
- **Plan:** Pay-as-you-go ($200 free credit/mo)
- **What to do:**
  1. Create new project "SnapR Agents" in Google Cloud Console
  2. Enable "Places API" and "Places API (New)"
  3. Create API key with Places API restriction
  4. Copy API key → add as `GOOGLE_MAPS_API_KEY` to Vercel env vars
- **Monthly cost:** ~$20-50 (based on 500-1000 searches/mo)

### 4. Google Analytics 4 (Website Analytics)
- **URL:** https://analytics.google.com/
- **Plan:** Free
- **What to do:**
  1. Create GA4 property for snap-r.com
  2. Get Measurement ID (G-XXXXXXXXXX)
  3. Add GA4 script to `app/layout.tsx` (or use `@next/third-parties/google`)
  4. Create service account for Data API access:
     a. Google Cloud Console → IAM → Service Accounts → Create
     b. Grant "Analytics Data API" viewer role
     c. Download JSON key
     d. Base64-encode JSON key → add as `GA4_SERVICE_ACCOUNT_KEY` to Vercel env vars
  5. Add `GA4_PROPERTY_ID` to Vercel env vars
- **Monthly cost:** $0

### 5. Slack Workspace (Notifications)
- **URL:** https://api.slack.com/apps
- **Plan:** Free
- **What to do:**
  1. Create Slack workspace (or use existing)
  2. Create Slack App → "Incoming Webhooks" → Enable
  3. Create webhook for #snapr-agents channel
  4. Copy webhook URL → add as `SLACK_WEBHOOK_URL` to Vercel env vars
  5. Create webhook for #snapr-alerts channel (critical alerts)
  6. Copy webhook URL → add as `SLACK_ALERT_WEBHOOK_URL` to Vercel env vars
- **Monthly cost:** $0

### 6. Crisp (Live Chat Widget)
- **URL:** https://crisp.chat/
- **Plan:** Basic (Free) or Pro ($25/mo for AI features)
- **What to do:**
  1. Sign up at crisp.chat
  2. Add snap-r.com as website
  3. Copy website ID → add as `CRISP_WEBSITE_ID` to Vercel env vars
  4. Settings → API → Create token pair
  5. Copy credentials → add as `CRISP_TOKEN_ID` and `CRISP_TOKEN_KEY` to Vercel env vars
  6. Add Crisp JavaScript widget to `app/layout.tsx`
  7. Configure webhook for `message:send` → `https://snap-r.com/api/agents/support/webhook`
- **Monthly cost:** $0-25

### 7. Google Ads (Paid Acquisition) — Phase 2
- **URL:** https://ads.google.com/
- **Plan:** Pay-per-click ($20-30/day budget)
- **What to do:**
  1. Create Google Ads account
  2. Set up conversion tracking (link to GA4)
  3. Create search campaigns targeting RE photo editing keywords
  4. Enable Google Ads API access for Data Agent
  5. Copy Developer Token → add as `GOOGLE_ADS_DEVELOPER_TOKEN` to Vercel env vars
  6. Copy Customer ID → add as `GOOGLE_ADS_CUSTOMER_ID` to Vercel env vars
- **Monthly cost:** $600-900 (ad spend, not a SaaS fee)
- **Note:** Start this in Phase 2 after organic channels are validated

### 8. Meta Ads (Facebook/Instagram Ads) — Phase 2
- **URL:** https://business.facebook.com/
- **Plan:** Pay-per-impression ($15-20/day budget)
- **What to do:**
  1. Create Meta Business Suite account
  2. Create ad account
  3. Install Meta Pixel on snap-r.com
  4. Create conversion campaigns with before/after creative
  5. Copy access token → add as `META_ADS_ACCESS_TOKEN` to Vercel env vars
- **Monthly cost:** $450-600 (ad spend)
- **Note:** Start this in Phase 2

---

## Social Media Accounts to Create

| Platform | Handle | Account Type | Purpose |
|----------|--------|-------------|---------|
| Instagram | @snapr.ai | Business | Before/after reels, property showcases |
| TikTok | @snapr.ai | Business | Short-form before/after videos |
| Facebook | SnapR - AI Real Estate Photos | Page | Community building, ad platform |
| LinkedIn | SnapR | Company Page | B2B content, brokerage outreach |
| Twitter/X | @snapr_ai | Business | Industry news, quick tips |
| YouTube | SnapR | Channel | Tutorials, demos, SEO content |
| Reddit | u/snapr_official | Account | Community engagement (manual only) |

**Note:** Reddit engagement should remain human-operated. AI posting on Reddit gets detected and banned.

---

## Existing Accounts (Already Set Up)

These are already configured and working:

| Service | Purpose | Env Var |
|---------|---------|---------|
| OpenAI | GPT-4o content generation | `OPENAI_API_KEY` |
| Replicate | AI image generation | `REPLICATE_API_TOKEN` |
| Resend | Email sending | `RESEND_API_KEY` |
| Stripe | Payments & billing | `STRIPE_SECRET_KEY` |
| Cloudinary | Image/video CDN | `CLOUDINARY_*` |
| Supabase | Database & auth | `SUPABASE_*` |
| Sentry | Error monitoring | Configured in instrumentation.ts |
| Vercel | Hosting & crons | Configured |
| Cloudflare | Worker & R2 storage | `CLOUDFLARE_API_TOKEN` |

---

## New Environment Variables Summary

Add these to Vercel env vars after creating accounts:

```bash
# Social Media Agent
AYRSHARE_API_KEY=                    # From ayrshare.com dashboard

# Outreach Agent
HUNTER_API_KEY=                       # From hunter.io dashboard
GOOGLE_MAPS_API_KEY=                 # From Google Cloud Console

# Data Agent
GA4_PROPERTY_ID=                     # From Google Analytics
GA4_SERVICE_ACCOUNT_KEY=             # Base64-encoded service account JSON

# Notifications
SLACK_WEBHOOK_URL=                   # From Slack app → Incoming Webhooks
SLACK_ALERT_WEBHOOK_URL=             # Separate channel for critical alerts

# Support Agent
CRISP_WEBSITE_ID=                    # From Crisp dashboard
CRISP_TOKEN_ID=                      # From Crisp API settings
CRISP_TOKEN_KEY=                     # From Crisp API settings

# Phase 2 (Paid Ads)
GOOGLE_ADS_DEVELOPER_TOKEN=          # From Google Ads API Center
GOOGLE_ADS_CUSTOMER_ID=              # From Google Ads account
META_ADS_ACCESS_TOKEN=               # From Meta Business Suite
```

---

## Monthly Cost Summary

### Phase 1 (Organic — Month 1-2)

| Service | Cost |
|---------|------|
| Ayrshare (social posting) | $99/mo |
| Hunter.io (email finder) | $49/mo |
| Google Maps (lead discovery) | ~$30/mo |
| Google Analytics 4 | $0 |
| Slack | $0 |
| Crisp (live chat) | $0-25/mo |
| OpenAI (content generation) | ~$30-50/mo |
| **Total** | **~$210-255/mo** |

### Phase 2 (Paid Ads — Month 3+)

| Service | Cost |
|---------|------|
| Phase 1 costs | $210-255/mo |
| Google Ads | $600-900/mo |
| Meta Ads | $450-600/mo |
| Hunter.io upgrade | +$100/mo |
| **Total** | **~$1,360-1,855/mo** |

### Break-even Analysis
- At Gold plan ($300/mo avg per customer): Need **5 customers** to cover Phase 1 costs
- At Phase 2 spend: Need **6-7 customers** to break even on marketing spend
- Target: 10+ paying customers by Month 3 = profitable
