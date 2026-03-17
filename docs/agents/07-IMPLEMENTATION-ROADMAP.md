# Implementation Roadmap

## Phase 1: Foundation (Week 1)
**Goal:** Database, agent framework, orchestrator, and agent dashboard

### Tasks
| # | Task | File(s) | Est Hours |
|---|------|---------|-----------|
| 1.1 | Apply database migration | `supabase/migrations/20260317_autonomous_agents.sql` | 0.5 |
| 1.2 | Agent type definitions & shared utilities | `lib/agents/index.ts` | 1 |
| 1.3 | Orchestrator agent | `lib/agents/orchestrator.ts` | 2 |
| 1.4 | Cron endpoint | `app/api/cron/agents/route.ts` | 1 |
| 1.5 | Agent status API | `app/api/agents/route.ts` | 1 |
| 1.6 | Agent config API | `app/api/agents/config/route.ts` | 1 |
| 1.7 | Agent command center dashboard | `app/dashboard/agents/page.tsx` | 3 |
| 1.8 | Add cron to vercel.json | `vercel.json` | 0.5 |
| 1.9 | Slack integration (webhook) | `lib/agents/integrations/slack.ts` | 1 |
| 1.10 | Env var validation for new keys | `lib/env.ts` | 0.5 |

**Deliverable:** Orchestrator runs on schedule, agent dashboard shows status, Slack digest works.

---

## Phase 2: Content Agent (Week 1-2)
**Goal:** Auto-generate before/after content and social captions daily

### Prerequisites
- OpenAI API key (already have)
- Cloudinary account (already have)
- Stock property photos uploaded to Cloudinary folder

### Tasks
| # | Task | File(s) | Est Hours |
|---|------|---------|-----------|
| 2.1 | Content Agent core | `lib/agents/content-agent.ts` | 3 |
| 2.2 | GPT-4o caption generation (5 platform prompts) | Part of content-agent.ts | 2 |
| 2.3 | Before/after generation (use existing pipeline) | Part of content-agent.ts | 2 |
| 2.4 | Blog post generation (weekly) | Part of content-agent.ts | 1 |
| 2.5 | Content queue API | `app/api/agents/content-queue/route.ts` | 1 |
| 2.6 | Content queue dashboard view | `app/dashboard/agents/content/page.tsx` | 2 |
| 2.7 | Stock photo curation (upload 50 properties) | Cloudinary upload | 2 |

**Deliverable:** Content queue fills daily with 3 before/afters + 5 captions. Visible in dashboard.

---

## Phase 3: Social Agent (Week 2)
**Goal:** Auto-post content to all platforms via Ayrshare

### Prerequisites
- Ayrshare account + API key
- Instagram Business, TikTok Business, Facebook Page, LinkedIn Page, Twitter accounts created and connected to Ayrshare

### Tasks
| # | Task | File(s) | Est Hours |
|---|------|---------|-----------|
| 3.1 | Ayrshare API client | `lib/agents/integrations/ayrshare.ts` | 2 |
| 3.2 | Social Agent core | `lib/agents/social-agent.ts` | 3 |
| 3.3 | Engagement tracking (weekly pull) | Part of social-agent.ts | 1 |
| 3.4 | Social metrics in agent dashboard | Part of agents dashboard | 1 |

**Deliverable:** 3 posts/day published automatically. Engagement tracked weekly.

---

## Phase 4: Outreach Agent (Week 2-3)
**Goal:** Find leads and send cold emails automatically

### Prerequisites
- Hunter.io account + API key
- Google Maps API key
- Resend configured (already have)

### Tasks
| # | Task | File(s) | Est Hours |
|---|------|---------|-----------|
| 4.1 | Google Maps Places API client | `lib/agents/integrations/google-maps.ts` | 2 |
| 4.2 | Hunter.io API client | `lib/agents/integrations/hunter.ts` | 2 |
| 4.3 | Outreach Agent core (lead finding) | `lib/agents/outreach-agent.ts` | 3 |
| 4.4 | Email template system (GPT-4o personalization) | Part of outreach-agent.ts | 2 |
| 4.5 | Follow-up logic (Day 3 + Day 7) | Part of outreach-agent.ts | 1 |
| 4.6 | Outreach pipeline API | `app/api/agents/outreach/route.ts` | 1 |
| 4.7 | Outreach pipeline dashboard | `app/dashboard/agents/outreach/page.tsx` | 2 |
| 4.8 | Conversion tracking (match email → profiles) | Part of outreach-agent.ts | 1 |

**Deliverable:** 20 new leads/day, 50 emails/day with follow-ups, visible pipeline.

---

## Phase 5: Sales Agent (Week 3)
**Goal:** Nurture free→paid conversions automatically

### Prerequisites
- Stripe API (already have)
- Resend (already have)

### Tasks
| # | Task | File(s) | Est Hours |
|---|------|---------|-----------|
| 5.1 | Sales Agent core | `lib/agents/sales-agent.ts` | 3 |
| 5.2 | Limit-approaching detection | Part of sales-agent.ts | 1 |
| 5.3 | Trial expiration reminders | Part of sales-agent.ts | 1 |
| 5.4 | Inactive user re-engagement | Part of sales-agent.ts | 1 |
| 5.5 | Win-back flow with Stripe promo codes | Part of sales-agent.ts | 2 |
| 5.6 | Nurture email templates (GPT-4o) | Part of sales-agent.ts | 1 |

**Deliverable:** Automated nurture sequences, promo code generation, churn reduction emails.

---

## Phase 6: Data Agent (Week 3-4)
**Goal:** Track all metrics, generate reports, optimize spend

### Prerequisites
- GA4 property + service account
- All other agents running (to have data to aggregate)

### Tasks
| # | Task | File(s) | Est Hours |
|---|------|---------|-----------|
| 6.1 | GA4 Data API client | `lib/agents/integrations/ga4.ts` | 2 |
| 6.2 | Data Agent core | `lib/agents/data-agent.ts` | 3 |
| 6.3 | Stripe metrics pull | Part of data-agent.ts | 1 |
| 6.4 | Social metrics aggregation | Part of data-agent.ts | 1 |
| 6.5 | Weekly CMO report generation | Part of data-agent.ts | 2 |
| 6.6 | Metrics API endpoint | `app/api/agents/metrics/route.ts` | 1 |
| 6.7 | Metrics dashboard (charts) | `app/dashboard/agents/metrics/page.tsx` | 3 |

**Deliverable:** Daily metrics in DB, weekly CMO report emailed, metrics dashboard with charts.

---

## Phase 7: Support Agent (Week 4)
**Goal:** AI-powered live chat support

### Prerequisites
- Crisp account + widget installed
- Support knowledge base (FAQ content)

### Tasks
| # | Task | File(s) | Est Hours |
|---|------|---------|-----------|
| 7.1 | Crisp API client | `lib/agents/integrations/crisp.ts` | 2 |
| 7.2 | Support Agent core | `lib/agents/support-agent.ts` | 3 |
| 7.3 | Webhook endpoint for Crisp | `app/api/agents/support/webhook/route.ts` | 1 |
| 7.4 | Knowledge base builder (FAQ → context) | Part of support-agent.ts | 1 |
| 7.5 | Escalation flow (email on low confidence) | Part of support-agent.ts | 1 |
| 7.6 | Add Crisp widget to layout | `app/layout.tsx` | 0.5 |

**Deliverable:** AI chat responds to user questions, escalates complex issues.

---

## Phase 8: Paid Ads Integration (Week 5+)
**Goal:** Google Ads + Meta Ads with auto-optimization

### Prerequisites
- Google Ads account + API access
- Meta Business Suite + Pixel
- Validated organic channels (know what converts)

### Tasks
| # | Task | File(s) | Est Hours |
|---|------|---------|-----------|
| 8.1 | Google Ads API client | `lib/agents/integrations/google-ads.ts` | 3 |
| 8.2 | Meta Ads API client | `lib/agents/integrations/meta-ads.ts` | 3 |
| 8.3 | Ad performance pull in Data Agent | Part of data-agent.ts | 2 |
| 8.4 | Auto-pause underperforming ads | Part of data-agent.ts | 2 |
| 8.5 | Ad dashboard in metrics view | Part of metrics dashboard | 2 |

**Deliverable:** Ad spend tracked, CPA monitored, underperforming ads auto-paused.

---

## Timeline Summary

```
Week 1:  Phase 1 (Foundation) + Phase 2 start (Content)
Week 2:  Phase 2 (Content) + Phase 3 (Social) + Phase 4 start (Outreach)
Week 3:  Phase 4 (Outreach) + Phase 5 (Sales) + Phase 6 start (Data)
Week 4:  Phase 6 (Data) + Phase 7 (Support)
Week 5+: Phase 8 (Paid Ads) — only after organic is validated
```

**Total estimated hours: ~85-95 hours of development**

---

## Definition of Done (Full Autonomy)

- [ ] All 7 agents running on schedule with zero manual intervention
- [ ] Agent dashboard shows real-time status of all agents
- [ ] Content queue auto-fills daily (3 before/afters + 5 captions)
- [ ] Social posts publish 3x daily across 5 platforms
- [ ] 50 cold emails sent daily with automated follow-ups
- [ ] Free→paid nurture sequences trigger automatically
- [ ] Daily metrics written to DB, weekly CMO report emailed
- [ ] Live chat responds to 90%+ of support questions
- [ ] Slack daily digest arrives at 8 AM ET
- [ ] Critical alerts fire within 1 minute of failure
- [ ] Human time required: < 15 min/day (reviewing digest)
