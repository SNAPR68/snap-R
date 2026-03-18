# Security & Compliance

## Email Compliance (CAN-SPAM Act)

The Outreach Agent sends cold emails to U.S. businesses. Must comply with CAN-SPAM:

### Requirements
1. **Accurate "From" line** — Emails from "SnapR Team <hello@snap-r.com>"
2. **No deceptive subject lines** — Subject must reflect content
3. **Identify as advertisement** — Not required for B2B if content is relevant
4. **Physical address** — Include business address in email footer
5. **Opt-out mechanism** — Every email includes unsubscribe link
6. **Honor opt-outs within 10 days** — Agent processes immediately (same-day)
7. **No harvested emails** — Only publicly listed business emails

### Implementation
- Every outreach email footer includes:
  ```
  SnapR | AI Real Estate Photo Enhancement
  [Business Address]
  Don't want to hear from us? Reply "unsubscribe" or click here: [unsubscribe_link]
  ```
- Resend handles unsubscribe link generation
- Outreach Agent checks `outreach_leads.status != 'unsubscribed'` before every send
- Bounce handling: emails marked `'bounced'` are never retried

### Daily Limits
- Max 50 emails/day (well under spam thresholds)
- Max 2 follow-ups per lead (then stop)
- 7-day cooldown between emails to same lead
- Never email personal email addresses (only business domains)

---

## Data Privacy

### Outreach Lead Data
- Sourced from **publicly available** business listings (Google Maps)
- Email addresses from **public business websites** (Hunter.io domain search)
- No personal/consumer data collected
- Leads can request deletion by replying "remove my data"
- Data retention: leads older than 6 months with no engagement → auto-deleted by cleanup cron

### User Data (Existing)
- Existing Supabase RLS policies unchanged
- Agent tables use service_role access (server-side only)
- No agent has access to user passwords, payment details, or raw Stripe data
- Support Agent sees: plan, listing count, last activity (no sensitive data)

---

## API Key Security

### New Keys
| Key | Access Level | Stored In |
|-----|-------------|-----------|
| `AYRSHARE_API_KEY` | Social posting only | Vercel env var |
| `HUNTER_API_KEY` | Email search only | Vercel env var |
| `GOOGLE_MAPS_API_KEY` | Places API only (restricted) | Vercel env var |
| `GA4_SERVICE_ACCOUNT_KEY` | Analytics read-only | Vercel env var (base64) |
| `SLACK_WEBHOOK_URL` | Post to specific channel | Vercel env var |
| `CRISP_TOKEN_*` | Chat read/write for our website | Vercel env var |

### Key Restrictions
- Google Maps API key: restrict to Places API only, limit to Vercel IP ranges
- GA4 service account: read-only role (no write access to Analytics)
- Ayrshare: no billing access, posting only
- All keys rotatable without code changes (env var swap + redeploy)

---

## Rate Limit Protection

| Service | Limit | Our Usage | Safety Margin |
|---------|-------|-----------|---------------|
| Ayrshare | 300 posts/mo (Premium) | ~90 posts/mo (3/day) | 3.3x |
| Hunter.io | 500 searches/mo (Starter) | ~400/mo (20/day × 20 days) | 1.25x |
| Google Maps | $200 free/mo | ~$30-50/mo | 4-6x |
| Resend | 100 emails/day (free) or 50K/mo (Pro) | ~50/day | 2x (free) or 1000x (Pro) |
| OpenAI | Rate limit per model | ~100 calls/day | Well within limits |
| Crisp | 30 req/min | ~5-10 req/min peak | 3-6x |

### Backoff Strategy
All integration clients implement exponential backoff:
```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Agent Access Control

### Dashboard Access
- Agent dashboard at `/dashboard/agents` — restricted to admin emails only
- Uses existing admin auth check from `lib/admin-auth.ts`
- Non-admin users see 404 (route doesn't appear in sidebar for non-admins)

### API Access
- `POST /api/agents` (trigger agent) — admin session auth required
- `PATCH /api/agents/config` (change config) — admin session auth required
- `GET /api/agents/*` (read status) — admin session auth required
- `POST /api/agents/support/webhook` — Crisp webhook signature verification
- `POST /api/cron/agents` — CRON_SECRET Bearer auth (same as other crons)

### Agent Permissions (What Each Agent Can Do)

| Agent | DB Write | External API Write | Email Send | Financial |
|-------|----------|-------------------|------------|-----------|
| Orchestrator | agent_runs | Slack webhook | No | No |
| Content | content_queue | OpenAI, Cloudinary | No | No |
| Social | content_queue (update) | Ayrshare (post) | No | No |
| Outreach | outreach_leads, outreach_emails | Google Maps (read), Hunter.io (read) | Yes (Resend) | No |
| Sales | profiles (update nudge_at) | None | Yes (Resend) | Stripe promo codes only |
| Data | agent_daily_metrics | GA4 (read), Stripe (read) | Weekly report email | Read-only |
| Support | None | Crisp (send message) | Escalation email | No |

**No agent has:**
- Direct database admin access
- Ability to delete user data
- Access to raw Stripe payment data or credit card info
- Ability to modify subscription pricing
- Push access to git repository
- Access to other environment variables

---

## Monitoring & Alerting

### Slack Channels
| Channel | Purpose | Alert Level |
|---------|---------|-------------|
| #snapr-agents | Daily digest, agent completion logs | Informational |
| #snapr-alerts | Agent failures, rate limit hits, errors | Critical |

### Alert Triggers
| Event | Channel | Priority |
|-------|---------|----------|
| Agent completed successfully | #snapr-agents | Low |
| Agent failed | #snapr-alerts | High |
| Agent disabled (3x failures) | #snapr-alerts | Critical |
| Daily email limit reached | #snapr-agents | Low |
| Rate limit hit on external API | #snapr-alerts | Medium |
| New paid subscriber | #snapr-agents | Low |
| Payment failure | #snapr-alerts | High |
| Support escalation | #snapr-alerts | Medium |

### Sentry Integration
- All agent errors logged to Sentry (existing setup)
- Agent name included in Sentry context for filtering
- Cron heartbeat monitoring for orchestrator (existing pattern)
