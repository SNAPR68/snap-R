# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL CRON TRIGGER                          │
│              /api/cron/agents (every 15 min)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                             │
│                   lib/agents/orchestrator.ts                      │
│                                                                   │
│  • Checks agent_config for which agents should run               │
│  • Evaluates schedule (cron expression vs current time)          │
│  • Launches agents in sequence or parallel                       │
│  • Records agent_runs for each execution                         │
│  • Sends daily Slack/email digest                                │
└──┬──────┬──────┬──────┬──────┬──────┬───────────────────────────┘
   │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌────────┐┌─────┐┌─────┐┌───────┐
│CONTENT││SOCIAL││OUTREACH││SALES││ DATA ││SUPPORT│
│AGENT ││AGENT ││ AGENT  ││AGENT││AGENT ││ AGENT │
└──┬───┘└──┬───┘└───┬────┘└──┬──┘└──┬──┘└───┬───┘
   │       │        │        │      │       │
   ▼       ▼        ▼        ▼      ▼       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                         │
│                                                                   │
│  agent_runs          — Execution history per agent               │
│  agent_config        — Per-agent settings & schedules            │
│  content_queue       — Generated content awaiting publish        │
│  outreach_leads      — Cold outreach pipeline                    │
│  outreach_emails     — Email send/open/click tracking            │
│  agent_daily_metrics — Aggregated daily business metrics         │
│                                                                   │
│  (Existing tables)                                               │
│  profiles            — User data, subscription status            │
│  scheduled_posts     — Social posts queued for publishing        │
│  published_posts     — Published posts with analytics            │
│  property_leads      — Inbound leads from property sites         │
└─────────────────────────────────────────────────────────────────┘
```

## External Service Integrations

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐          │
│  │ Ayrshare    │  │ Hunter.io    │  │ Google         │          │
│  │ Social API  │  │ Email Finder │  │ Analytics 4    │          │
│  │             │  │              │  │ (Measurement   │          │
│  │ 13 platforms│  │ Find emails  │  │  Protocol)     │          │
│  │ from 1 API  │  │ from domains │  │                │          │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘          │
│         │                │                   │                   │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌───────┴────────┐          │
│  │ Resend      │  │ OpenAI       │  │ Stripe         │          │
│  │ Email API   │  │ GPT-4o       │  │ Billing API    │          │
│  │             │  │ Content gen  │  │ Revenue data   │          │
│  │ Cold emails │  │ Captions     │  │ Promo codes    │          │
│  │ + drip      │  │ Blog posts   │  │ Subscriptions  │          │
│  └─────────────┘  └──────────────┘  └────────────────┘          │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐          │
│  │ Slack       │  │ Google Ads   │  │ Crisp/         │          │
│  │ Webhook     │  │ API          │  │ Intercom       │          │
│  │             │  │              │  │                │          │
│  │ Daily digest│  │ Ad perf data │  │ Live chat      │          │
│  │ Alerts      │  │ Budget mgmt  │  │ AI responses   │          │
│  └─────────────┘  └──────────────┘  └────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Per Agent

### Content Agent
```
OpenAI GPT-4o → generates captions/blog/scripts
Replicate API → generates before/after images (existing pipeline)
Cloudinary    → uploads media assets
     ↓
content_queue table (status: 'queued')
```

### Social Agent
```
content_queue (status: 'queued', scheduled_for <= now)
     ↓
Ayrshare API → posts to Instagram/TikTok/Facebook/LinkedIn/Twitter
     ↓
content_queue (status: 'posted', post_url filled)
```

### Outreach Agent
```
Google Maps Places API → find "real estate photographer" in target cities
Hunter.io API          → find email from domain
     ↓
outreach_leads table (status: 'new')
     ↓
Resend API → send personalized email
     ↓
outreach_leads (status: 'emailed')
outreach_emails (tracking record)
```

### Sales Agent
```
profiles table → find free users near limits, inactive users, expiring trials
     ↓
Resend API → send nurture/upgrade/re-engagement emails
Stripe API → create promo codes for targeted discounts
     ↓
Update profiles.metadata with nurture status
```

### Data Agent
```
GA4 Measurement Protocol → website visitor data
Stripe API               → MRR, subscribers, churn
Ayrshare API             → social follower counts, engagement
Google Ads API           → ad spend, clicks, conversions
     ↓
agent_daily_metrics table
     ↓
Generate CMO report (weekly)
Slack webhook → daily digest
```

### Support Agent
```
Crisp/Intercom webhook → incoming chat message
     ↓
OpenAI GPT-4o → generate response (context: SnapR docs + user profile)
     ↓
Crisp/Intercom API → send response
     ↓
If confidence < threshold → escalate via email to support@snap-r.com
```

## File Structure

```
lib/agents/
  index.ts                  — Agent type definitions, shared utilities
  orchestrator.ts           — Master scheduler, runs all agents
  content-agent.ts          — Content generation (GPT-4o + Replicate)
  social-agent.ts           — Social posting via Ayrshare
  outreach-agent.ts         — Lead finding + cold email via Hunter.io + Resend
  sales-agent.ts            — Free→paid nurture + trial management
  data-agent.ts             — Metrics aggregation + reporting
  support-agent.ts          — AI chat responses + escalation
  integrations/
    ayrshare.ts             — Ayrshare API client
    hunter.ts               — Hunter.io API client
    google-maps.ts          — Google Maps Places API client
    ga4.ts                  — Google Analytics 4 data pull
    google-ads.ts           — Google Ads API client
    slack.ts                — Slack webhook for notifications
    crisp.ts                — Crisp chat API client

app/api/cron/agents/
  route.ts                  — Vercel cron entry point (every 15 min)

app/api/agents/
  route.ts                  — GET: agent status, POST: manual trigger
  [agent]/route.ts          — GET: specific agent history, POST: trigger specific agent
  config/route.ts           — GET/PATCH: agent configuration
  metrics/route.ts          — GET: daily metrics + dashboard data
  content-queue/route.ts    — GET: content queue, POST: add manual content
  outreach/route.ts         — GET: outreach pipeline, POST: add manual lead

app/dashboard/agents/
  page.tsx                  — Agent command center (status, metrics, controls)
  content/page.tsx          — Content queue management
  outreach/page.tsx         — Outreach pipeline view
  metrics/page.tsx          — Business metrics dashboard
```

## Deployment

- **Agent code**: Deploys with main Next.js app to Vercel
- **Cron trigger**: Added to `vercel.json` crons array
- **Database**: Migration applied to Supabase
- **Secrets**: New env vars added to Vercel (Ayrshare, Hunter.io, Slack webhook, etc.)
- **No separate infrastructure** — runs entirely within existing Vercel + Supabase stack
