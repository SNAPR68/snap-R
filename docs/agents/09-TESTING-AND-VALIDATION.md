# Testing & Validation Plan

## Unit Tests

### Agent Framework Tests (`__tests__/agents/`)

| Test File | Tests | Description |
|-----------|-------|-------------|
| `orchestrator.test.ts` | 8 | Schedule parsing, agent selection, failure handling, digest generation |
| `content-agent.test.ts` | 6 | Caption generation, content queue insertion, media URL handling |
| `social-agent.test.ts` | 6 | Queue consumption, Ayrshare payload, retry logic |
| `outreach-agent.test.ts` | 10 | Lead deduplication, email template rendering, follow-up timing, daily limits |
| `sales-agent.test.ts` | 8 | Limit detection, trial expiration, promo code generation, cooldown logic |
| `data-agent.test.ts` | 6 | Metric aggregation, CMO report generation, CPA threshold |
| `support-agent.test.ts` | 5 | Response generation, escalation detection, context building |

### Integration Client Tests

| Test File | Tests | Description |
|-----------|-------|-------------|
| `ayrshare.test.ts` | 4 | Post creation, engagement fetch, error handling |
| `hunter.test.ts` | 4 | Domain search, email verification, rate limit handling |
| `google-maps.test.ts` | 3 | Text search, detail fetch, result parsing |
| `slack.test.ts` | 3 | Digest format, alert format, webhook delivery |

**Total: ~63 new tests**

---

## Validation Checklist (Per Agent)

### Orchestrator
- [ ] Correctly parses cron expressions
- [ ] Skips disabled agents
- [ ] Prevents overlapping runs (checks for status='running')
- [ ] Records agent_run on completion
- [ ] Sends Slack digest at configured time
- [ ] Handles agent timeout (kills after 5 min)
- [ ] Auto-disables agent after 3 consecutive failures
- [ ] Sends critical alert on auto-disable

### Content Agent
- [ ] Generates 3 before/after pairs daily
- [ ] Generates 5 platform-specific captions daily
- [ ] Generates 1 blog post on Monday
- [ ] Inserts all content into content_queue with correct scheduled_for
- [ ] Handles OpenAI API errors gracefully
- [ ] Does not generate duplicate content (checks recent queue)

### Social Agent
- [ ] Picks queued items with scheduled_for <= now
- [ ] Posts to correct platform via Ayrshare
- [ ] Includes media when media_urls present
- [ ] Updates content_queue status to 'posted'
- [ ] Retries failed posts (max 3 attempts)
- [ ] Pulls engagement metrics weekly
- [ ] Respects Ayrshare rate limits

### Outreach Agent
- [ ] Finds businesses via Google Maps for target city
- [ ] Extracts emails via Hunter.io
- [ ] Deduplicates on email (no duplicate outreach_leads)
- [ ] Sends personalized email via Resend
- [ ] Stops at daily email limit
- [ ] Sends Follow-up 1 after 3 days
- [ ] Sends Follow-up 2 after 7 days
- [ ] Stops emailing after Follow-up 2
- [ ] Marks bounced emails correctly
- [ ] Detects conversions (email match in profiles)
- [ ] Respects 'unsubscribed' status

### Sales Agent
- [ ] Finds free users approaching limits
- [ ] Finds expiring trials
- [ ] Finds inactive paid users
- [ ] Finds recently churned users (win-back window)
- [ ] Generates Stripe promo codes
- [ ] Sends appropriate email template
- [ ] Respects nudge cooldown (no spam)
- [ ] Caps nudges per user

### Data Agent
- [ ] Pulls GA4 metrics correctly
- [ ] Pulls Stripe revenue data
- [ ] Pulls social metrics from Ayrshare
- [ ] Aggregates outreach metrics from DB
- [ ] Writes to agent_daily_metrics
- [ ] Generates weekly CMO report
- [ ] Emails report on Monday
- [ ] Flags high CPA ads for pause

### Support Agent
- [ ] Receives Crisp webhook
- [ ] Loads user context from profiles
- [ ] Generates relevant response via GPT-4o
- [ ] Posts response to Crisp
- [ ] Detects [ESCALATE] and sends email
- [ ] Handles unknown users (no profile match)
- [ ] Respects rate limits

---

## Dry Run Protocol

Before enabling each agent in production:

1. **Enable with `enabled: false` in agent_config** — code deploys but doesn't run
2. **Manual trigger via API** — `POST /api/agents { "agent": "content", "force": true }`
3. **Verify in dashboard** — Check agent_runs for status='completed'
4. **Verify outputs** — Check content_queue / outreach_leads / metrics
5. **Review Slack** — Confirm digest/alerts arrive correctly
6. **Enable on schedule** — Set `enabled: true` in agent_config

---

## Rollback Plan

If an agent causes problems:

1. **Immediate:** Set `enabled: false` via API or Supabase dashboard
2. **If cron itself is broken:** Remove from `vercel.json` and redeploy
3. **If data is corrupt:** Agent tables are isolated — no impact on user-facing tables
4. **If emails went wrong:** Resend dashboard shows all sent emails, can be manually reviewed
5. **Nuclear option:** Revert the entire feature branch (main is unaffected)
