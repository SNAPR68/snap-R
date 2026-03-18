# User Flows — How Agents Interact with Users

## Flow 1: Organic Discovery (Social → Signup)

```
Social Agent posts before/after reel on Instagram
     ↓
User sees the transformation, visits profile
     ↓
Bio link → snap-r.com (with UTM: ?utm_source=instagram&utm_medium=social)
     ↓
User lands on homepage → sees explainer video + hero before/after slider
     ↓
Clicks "Start Free" → /auth/signup?plan=free
     ↓
Signs up (email + password or Google OAuth)
     ↓
Onboarding flow (3 steps: name + role → how it works → get started)
     ↓
Creates first listing → uploads photos → AI preparation
     ↓
    WOW moment — sees all photos enhanced + marketing materials auto-generated
     ↓
Uses 2 of 3 free listings
     ↓
Sales Agent detects → sends upgrade email with pricing link
     ↓
User upgrades to Gold ($20/listing × 15 = $300/mo)
     ↓
Data Agent records conversion → attributes to Instagram
```

**Agents involved:** Social (discovery) → Support (if questions) → Sales (conversion) → Data (attribution)

---

## Flow 2: Cold Outreach (Email → Signup)

```
Outreach Agent finds "John Smith Photography" in Miami via Google Maps
     ↓
Hunter.io finds john@johnsmithphoto.com
     ↓
Agent sends personalized email:
  "I'll edit your next listing photos for free, John"
  Link: snap-r.com/?ref=outreach-miami
     ↓
Day 1: John opens email (tracked via Resend)
     ↓
Day 2: John clicks link → lands on homepage
     ↓
Day 3: No signup yet → Outreach Agent sends Follow-up 1:
  "Did you get a chance to look at SnapR? Here's a 60-sec demo"
     ↓
Day 4: John signs up for free plan
     ↓
Outreach Agent detects conversion (email match in profiles table)
     ↓
Updates outreach_leads → status: 'converted', snapr_user_id linked
     ↓
John processes 3 listings (free limit)
     ↓
Sales Agent sends upgrade email
     ↓
John upgrades to Gold
     ↓
Data Agent records: outreach pipeline → converted, CAC = $0 (organic email)
```

**Agents involved:** Outreach (discovery + email) → Support (if questions) → Sales (conversion) → Data (tracking)

---

## Flow 3: Paid Ad (Google Ad → Signup)

```
User searches "real estate photo editing software" on Google
     ↓
Sees SnapR ad: "AI Real Estate Photo Editing — 60 Second Results. Try Free"
     ↓
Clicks ad → snap-r.com/?utm_source=google&utm_medium=cpc&utm_campaign=re-photo-editing
     ↓
GA4 records the click + session
     ↓
User explores pricing page → signs up for free
     ↓
GA4 records conversion event
     ↓
User creates listing → impressed → upgrades to Gold
     ↓
Stripe webhook fires → Data Agent records revenue + attributes to Google Ads
     ↓
Data Agent calculates CPA: ad spend / conversions
     ↓
If CPA > $50: Data Agent pauses the underperforming ad group
If CPA < $30: Data Agent flags for budget increase in weekly report
```

**Agents involved:** Data (ad management + attribution) → Support → Sales → Data (reporting)

---

## Flow 4: Support Conversation (Chat → Resolution)

```
User on /dashboard sees processing stuck
     ↓
Clicks Crisp chat widget: "My photos aren't processing"
     ↓
Crisp webhook → /api/agents/support/webhook
     ↓
Support Agent:
  1. Loads user profile: plan=pro, 12 listings, last active 2 min ago
  2. Loads conversation history
  3. Sends to GPT-4o with context
     ↓
GPT-4o response:
  "Hi! I can see you're on the Pro plan. A couple of things to check:
   1. Make sure your photos are uploaded to a specific listing (not just /upload)
   2. Try clicking 'Prepare Listing' — this triggers the AI enhancement pipeline
   3. If it's still stuck after 2 minutes, try refreshing the page.
   Let me know if that helps!"
     ↓
Support Agent posts response via Crisp API
     ↓
User: "Oh I didn't click Prepare Listing. It's working now, thanks!"
     ↓
Support Agent: "Great! Your photos should be ready in about 60 seconds. Let me know if you need anything else!"
     ↓
Conversation resolved — no human needed
```

**Agents involved:** Support (full resolution)

---

## Flow 5: Trial Expiration (Sales → Retention)

```
User signed up for Enterprise trial 11 days ago
     ↓
Sales Agent daily check: trial_end_at is 3 days away
     ↓
Sales Agent sends email:
  Subject: "Your SnapR Enterprise trial ends in 3 days"
  Body: "You've processed 28 listings and generated 12 property sites.
         Your team has saved an estimated 42 hours.
         Continue on Enterprise ($299/mo) or downgrade to Gold ($20/listing).
         [Keep Enterprise] [View Plans]"
     ↓
Day 13: User hasn't responded
     ↓
Sales Agent sends final reminder:
  "Tomorrow is your last day. Here's 20% off your first month: SNAPR20"
  (Stripe promo code auto-generated)
     ↓
User applies SNAPR20 → converts to paid Enterprise ($239.20 first month)
     ↓
Data Agent records: enterprise conversion, discount used, LTV projection
```

**Agents involved:** Sales (nurture sequence) → Data (conversion tracking)

---

## Flow 6: Win-back (Sales → Re-activation)

```
User canceled subscription 14 days ago
     ↓
Sales Agent daily check: canceled, within 7-30 day win-back window
     ↓
Sales Agent queries user's history:
  - 45 listings processed over 3 months
  - Used virtual staging 12 times
  - Published to Instagram 30 times
     ↓
Sales Agent sends personalized win-back email via GPT-4o:
  Subject: "We miss your listings, Sarah"
  Body: "Over 3 months you processed 45 listings and published 30 social posts.
         Since you left, we've added:
         - AI video creator (30-second property reels)
         - TikTok auto-posting
         - Lead capture on property sites
         Come back for 20% off: COMEBACK20
         [Reactivate My Account]"
     ↓
If user clicks → directed to /pricing with promo pre-applied
     ↓
If no response in 14 more days → lead moves to 'lost', no more emails
```

**Agents involved:** Sales (win-back) → Data (tracking)

---

## Flow 7: Daily Orchestration (Full Agent Loop)

```
07:00 ET — Orchestrator wakes up, checks schedules

07:00 — Content Agent runs:
  ✓ Generated 3 before/after pairs from stock photos
  ✓ Generated 5 captions (1 per platform)
  ✓ Queued all to content_queue with scheduled times

08:00 — Orchestrator sends daily Slack digest:
  "Yesterday: 5 signups, $300 revenue, 3 posts, 48 emails"

09:00 — Social Agent run 1:
  ✓ Posted before/after #1 to Instagram + Facebook
  ✓ Posted caption to LinkedIn

10:00 — Outreach Agent runs:
  ✓ Found 20 photographers in Dallas via Google Maps
  ✓ Found 15 emails via Hunter.io (5 domains had no public email)
  ✓ Sent 48 emails (35 new + 13 follow-ups)
  ✓ 2 bounced → marked as 'bounced'

13:00 — Social Agent run 2:
  ✓ Posted before/after #2 to TikTok + Twitter
  ✓ Posted caption to Facebook

17:00 — Social Agent run 3:
  ✓ Posted before/after #3 to Instagram + LinkedIn
  ✓ Posted video script teaser to TikTok

18:00 — Sales Agent runs:
  ✓ Found 3 free users at 2/3 listings → sent upgrade emails
  ✓ Found 1 trial expiring in 3 days → sent reminder
  ✓ Found 2 inactive paid users (7+ days) → sent re-engagement
  ✓ Generated SNAPR20 promo code (valid 30 days)

23:00 — Data Agent runs:
  ✓ GA4: 420 visitors, 5 signups, 1.2% conversion
  ✓ Stripe: $3,200 MRR, +$300 today, 0 churn
  ✓ Social: 156 total engagement, +45 followers
  ✓ Outreach: 32% open rate, 2 replies
  ✓ Wrote to agent_daily_metrics
  ✓ Monday: generated weekly CMO report → emailed to founder

23:30 — All agents complete. Orchestrator logs: "All agents healthy. 0 failures."
```

---

## Exception Flows

### Agent Failure
```
Social Agent fails (Ayrshare API down)
     ↓
Orchestrator catches error → records in agent_runs (status: 'failed')
     ↓
Slack alert: "Social Agent failed: Ayrshare API returned 503"
     ↓
Next 15-min cron: Orchestrator retries Social Agent
     ↓
If fails 3x: Orchestrator auto-disables Social Agent
     ↓
Slack critical alert: "Social Agent disabled after 3 consecutive failures. Manual intervention needed."
```

### Rate Limit Hit
```
Outreach Agent tries to send email #51 (daily limit: 50)
     ↓
Agent checks: emails_sent_today >= daily_emails config
     ↓
Skips remaining, logs: "Daily email limit reached (50/50)"
     ↓
Remaining leads queued for tomorrow
```

### Duplicate Lead
```
Outreach Agent finds john@smithphoto.com in Dallas
     ↓
INSERT INTO outreach_leads → UNIQUE constraint violation on email
     ↓
Agent skips (already in pipeline), moves to next lead
```

### User Unsubscribes from Outreach
```
User replies "unsubscribe" to outreach email
     ↓
Resend webhook → detects reply with "unsubscribe" keyword
     ↓
Outreach Agent marks lead as 'unsubscribed'
     ↓
Lead never emailed again
```
