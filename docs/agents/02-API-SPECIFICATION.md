# API Specification

## Internal Agent APIs (Admin-only, session auth)

All agent APIs require authenticated admin session. Protected by admin email check in middleware.

---

### 1. Agent Status & Control

#### GET /api/agents
Returns status of all agents.

**Response:**
```json
{
  "agents": [
    {
      "name": "content",
      "enabled": true,
      "schedule": "0 7 * * *",
      "last_run_at": "2026-03-17T07:00:00Z",
      "last_status": "completed",
      "last_duration_ms": 45000,
      "tasks_completed": 8,
      "tasks_failed": 0,
      "next_run_at": "2026-03-18T07:00:00Z"
    }
  ]
}
```

#### POST /api/agents
Manually trigger an agent.

**Request:**
```json
{
  "agent": "content",
  "force": true
}
```

**Response:**
```json
{
  "run_id": "uuid",
  "agent": "content",
  "status": "running"
}
```

---

### 2. Agent Configuration

#### GET /api/agents/config
Returns configuration for all agents.

#### PATCH /api/agents/config
Update agent configuration.

**Request:**
```json
{
  "agent": "outreach",
  "config": {
    "enabled": true,
    "daily_emails": 30,
    "target_cities": ["Los Angeles", "Miami"]
  }
}
```

---

### 3. Agent Run History

#### GET /api/agents/[agent]
Returns run history for a specific agent.

**Query params:** `?limit=20&offset=0`

**Response:**
```json
{
  "agent": "outreach",
  "runs": [
    {
      "id": "uuid",
      "status": "completed",
      "started_at": "2026-03-17T10:00:00Z",
      "completed_at": "2026-03-17T10:02:30Z",
      "duration_ms": 150000,
      "tasks_completed": 50,
      "tasks_failed": 2,
      "metadata": {
        "emails_sent": 48,
        "leads_found": 20,
        "bounces": 2
      }
    }
  ]
}
```

---

### 4. Content Queue

#### GET /api/agents/content-queue
Returns content queue items.

**Query params:** `?status=queued&platform=instagram&limit=20`

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "content_type": "caption",
      "platform": "instagram",
      "body": "Transform your listings in 60 seconds...",
      "media_urls": ["https://res.cloudinary.com/..."],
      "hashtags": ["#realestate", "#realtorlife"],
      "status": "queued",
      "scheduled_for": "2026-03-18T13:00:00Z"
    }
  ],
  "meta": { "total": 45, "queued": 12, "posted": 30, "failed": 3 }
}
```

#### POST /api/agents/content-queue
Manually add content to queue.

**Request:**
```json
{
  "content_type": "caption",
  "platform": "instagram",
  "body": "Manual post content...",
  "media_urls": ["https://..."],
  "scheduled_for": "2026-03-18T13:00:00Z"
}
```

---

### 5. Outreach Pipeline

#### GET /api/agents/outreach
Returns outreach leads pipeline.

**Query params:** `?status=new&city=Miami&limit=50`

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "name": "John Smith Photography",
      "email": "john@smithphoto.com",
      "role": "photographer",
      "city": "Miami",
      "state": "FL",
      "status": "emailed",
      "email_sent_at": "2026-03-17T10:15:00Z"
    }
  ],
  "meta": {
    "total": 500,
    "new": 50,
    "emailed": 300,
    "responded": 25,
    "converted": 8
  }
}
```

#### POST /api/agents/outreach
Manually add a lead.

**Request:**
```json
{
  "name": "Jane Agent Realty",
  "email": "jane@janerealty.com",
  "role": "agent",
  "city": "Los Angeles",
  "state": "CA"
}
```

---

### 6. Business Metrics

#### GET /api/agents/metrics
Returns daily metrics.

**Query params:** `?days=30` (default 7)

**Response:**
```json
{
  "metrics": [
    {
      "date": "2026-03-17",
      "website_visitors": 450,
      "signups": 12,
      "signup_conversion_rate": 2.67,
      "mrr_cents": 300000,
      "new_subscribers": 2,
      "churned_subscribers": 0,
      "posts_published": 3,
      "total_engagement": 156,
      "emails_sent": 50,
      "email_open_rate": 32.5,
      "leads_converted": 1,
      "ad_spend_cents": 2000,
      "cost_per_acquisition_cents": 4500
    }
  ],
  "summary": {
    "mrr": "$3,000",
    "total_signups_period": 84,
    "total_conversions_period": 8,
    "avg_cpa": "$45",
    "email_pipeline_size": 500
  }
}
```

---

## Cron Endpoint

#### POST /api/cron/agents
Vercel cron entry point. Runs every 15 minutes.

**Auth:** `CRON_SECRET` Bearer token (same as other crons).

**Logic:**
1. Check current time against each agent's schedule
2. For each agent whose schedule matches:
   a. Check if agent is enabled in agent_config
   b. Check if agent is not already running (prevent overlaps)
   c. Execute agent
   d. Record agent_run
3. Return summary of what ran

**Vercel cron config** (addition to `vercel.json`):
```json
{
  "path": "/api/cron/agents",
  "schedule": "*/15 * * * *"
}
```

---

## External API Integrations (called by agents)

### Ayrshare (Social Agent)
- **Base URL:** `https://app.ayrshare.com/api`
- **Auth:** Bearer token (API key)
- **Endpoints used:**
  - `POST /post` — Publish to multiple platforms
  - `GET /analytics/post` — Get post engagement
  - `GET /user` — Get connected account info
- **Rate limit:** 100 posts/day on Pro plan

### Hunter.io (Outreach Agent)
- **Base URL:** `https://api.hunter.io/v2`
- **Auth:** `?api_key=` query param
- **Endpoints used:**
  - `GET /domain-search?domain=example.com` — Find emails at a domain
  - `GET /email-finder?domain=example.com&first_name=John&last_name=Smith` — Find specific email
  - `GET /email-verifier?email=john@example.com` — Verify email deliverability
- **Rate limit:** 500 requests/month (Starter), 5000/month (Growth)

### Google Maps Places (Outreach Agent)
- **Base URL:** `https://maps.googleapis.com/maps/api/place`
- **Auth:** `?key=` query param
- **Endpoints used:**
  - `GET /textsearch/json?query=real+estate+photographer+Miami` — Find businesses
  - `GET /details/json?place_id=xxx` — Get business details (website, phone)
- **Cost:** $32 per 1000 text searches, $17 per 1000 detail requests

### Google Analytics 4 (Data Agent)
- **Method:** GA4 Data API (REST)
- **Base URL:** `https://analyticsdata.googleapis.com/v1beta`
- **Auth:** Service account JSON key
- **Endpoints used:**
  - `POST /properties/{propertyId}:runReport` — Query metrics
- **Metrics tracked:** `activeUsers`, `sessions`, `conversions`, `newUsers`

### Slack (Orchestrator)
- **Method:** Incoming webhook
- **URL:** Configured per workspace
- **Payload:** Formatted blocks with daily digest
- **No rate limit concerns** (we send 1-2 messages/day)

### Crisp (Support Agent)
- **Base URL:** `https://api.crisp.chat/v1`
- **Auth:** Basic auth (email:API key) + plugin token
- **Endpoints used:**
  - `GET /website/{website_id}/conversations` — List conversations
  - `POST /website/{website_id}/conversation/{session_id}/message` — Send message
  - Webhook: `message:send` event → triggers AI response
- **Rate limit:** 30 requests/min
