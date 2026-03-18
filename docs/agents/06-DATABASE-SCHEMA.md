# Database Schema

## New Tables

### agent_runs
Tracks every execution of every agent.

```sql
CREATE TABLE agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name      TEXT NOT NULL,              -- 'content', 'social', 'outreach', 'sales', 'data', 'support', 'orchestrator'
  status          TEXT NOT NULL DEFAULT 'running',  -- 'running', 'completed', 'failed', 'skipped'
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed    INTEGER DEFAULT 0,
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',         -- Agent-specific output data
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:** `agent_name`, `started_at DESC`
**RLS:** Service role only

---

### content_queue
Generated content awaiting publication.

```sql
CREATE TABLE content_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    TEXT NOT NULL,              -- 'before_after', 'caption', 'blog_post', 'video_script', 'reel'
  platform        TEXT,                       -- 'instagram', 'tiktok', 'facebook', 'linkedin', 'twitter', 'blog'
  title           TEXT,
  body            TEXT NOT NULL,
  media_urls      TEXT[] DEFAULT '{}',
  hashtags        TEXT[] DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'queued',  -- 'queued', 'scheduled', 'posted', 'failed'
  scheduled_for   TIMESTAMPTZ,
  posted_at       TIMESTAMPTZ,
  post_url        TEXT,
  engagement      JSONB DEFAULT '{}',         -- { likes, comments, shares, impressions }
  agent_run_id    UUID REFERENCES agent_runs(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:** `status`, `platform`, `scheduled_for WHERE status='queued'`
**RLS:** Service role only

---

### outreach_leads
Cold outreach lead pipeline.

```sql
CREATE TABLE outreach_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  company         TEXT,
  role            TEXT,                       -- 'photographer', 'agent', 'broker'
  city            TEXT,
  state           TEXT,
  source          TEXT,                       -- 'google_maps', 'realtor_com', 'manual', 'referral'
  website         TEXT,
  phone           TEXT,
  status          TEXT NOT NULL DEFAULT 'new',
  -- Status values: 'new', 'emailed', 'followed_up', 'responded', 'converted', 'unsubscribed', 'bounced', 'no_response'
  email_sent_at   TIMESTAMPTZ,
  followup_1_at   TIMESTAMPTZ,
  followup_2_at   TIMESTAMPTZ,
  responded_at    TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  snapr_user_id   UUID,                      -- Links to profiles.id on conversion
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:** `email (UNIQUE)`, `status`, `city + state`
**RLS:** Service role only

---

### outreach_emails
Every email sent by the Outreach Agent.

```sql
CREATE TABLE outreach_emails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES outreach_leads(id) ON DELETE CASCADE,
  email_type      TEXT NOT NULL,              -- 'initial', 'followup_1', 'followup_2', 'custom'
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  resend_id       TEXT,                       -- Resend message ID
  status          TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  agent_run_id    UUID REFERENCES agent_runs(id),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:** `lead_id`
**RLS:** Service role only

---

### agent_config
Per-agent configuration (tunable without redeployment).

```sql
CREATE TABLE agent_config (
  agent_name      TEXT PRIMARY KEY,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  schedule        TEXT,                       -- Cron expression or 'manual' or 'realtime'
  config          JSONB NOT NULL DEFAULT '{}',
  last_run_at     TIMESTAMPTZ,
  last_status     TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Seeded with:** Default configs for all 7 agents
**RLS:** Service role only

---

### agent_daily_metrics
Aggregated daily business metrics.

```sql
CREATE TABLE agent_daily_metrics (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                        DATE NOT NULL UNIQUE,
  -- Traffic
  website_visitors            INTEGER DEFAULT 0,
  signups                     INTEGER DEFAULT 0,
  signup_conversion_rate      NUMERIC(5,2) DEFAULT 0,
  -- Revenue
  mrr_cents                   INTEGER DEFAULT 0,
  new_subscribers             INTEGER DEFAULT 0,
  churned_subscribers         INTEGER DEFAULT 0,
  revenue_today_cents         INTEGER DEFAULT 0,
  -- Social
  total_followers             JSONB DEFAULT '{}',
  posts_published             INTEGER DEFAULT 0,
  total_engagement            INTEGER DEFAULT 0,
  top_post_url                TEXT,
  -- Outreach
  emails_sent                 INTEGER DEFAULT 0,
  emails_opened               INTEGER DEFAULT 0,
  email_open_rate             NUMERIC(5,2) DEFAULT 0,
  leads_found                 INTEGER DEFAULT 0,
  leads_converted             INTEGER DEFAULT 0,
  -- Ads
  ad_spend_cents              INTEGER DEFAULT 0,
  ad_clicks                   INTEGER DEFAULT 0,
  ad_conversions              INTEGER DEFAULT 0,
  cost_per_acquisition_cents  INTEGER DEFAULT 0,
  -- System
  errors_count                INTEGER DEFAULT 0,
  uptime_percent              NUMERIC(5,2) DEFAULT 100,
  metadata                    JSONB DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:** `date (UNIQUE)`
**RLS:** Service role only

---

## Existing Tables Used by Agents

| Table | Used By | How |
|-------|---------|-----|
| `profiles` | Sales Agent, Support Agent, Data Agent | Read user data, check plans, track activity |
| `listings` | Content Agent | Source of demo content from sample listings |
| `photos` | Content Agent | Source before/after images |
| `scheduled_posts` | Social Agent (reads existing) | Check for conflicts with auto-posts |
| `published_posts` | Data Agent | Read engagement metrics |
| `property_leads` | Outreach Agent | Cross-reference inbound vs outreach leads |
| `social_connections` | Social Agent | Check which platforms are connected |

---

## Migration File

Located at: `supabase/migrations/20260317_autonomous_agents.sql`

Includes:
- All 6 tables above
- All indexes
- RLS enabled on all tables
- Service role bypass policies
- Default agent_config seed data
