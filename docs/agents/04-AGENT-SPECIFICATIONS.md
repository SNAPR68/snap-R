# Agent Specifications

Detailed specification for each of the 7 agents.

---

## Agent 1: Orchestrator

**File:** `lib/agents/orchestrator.ts`
**Schedule:** Every 15 min via Vercel cron (evaluates which agents should run)
**Dependencies:** All other agents

### Responsibilities
1. Read `agent_config` table for each agent's schedule and enabled status
2. Parse cron expressions, determine which agents are due to run
3. Check for already-running agents (prevent overlap via `agent_runs` where status='running')
4. Execute due agents in order: Content → Social → Outreach → Sales → Data
5. Record each execution in `agent_runs`
6. At 8 AM ET: Generate and send daily Slack digest

### Daily Digest (Slack Message)
```
SnapR Daily Report — March 17, 2026

Revenue: $3,200 MRR (+$300 from yesterday)
Signups: 5 new (3 free, 2 paid)
Visitors: 420 (+12% vs yesterday)

Social: 3 posts published, 156 engagements
Outreach: 48 emails sent, 32% open rate, 2 replies
Support: 8 conversations, 7 auto-resolved

Agents: All healthy
  Content: 8/8 tasks
  Social: 3/3 posts
  Outreach: 48/50 emails (2 bounced)
  Sales: 3 nurture emails sent
  Data: Metrics collected

Action needed: None
```

### Error Handling
- If an agent fails: log to `agent_runs`, send Slack alert, continue with next agent
- If agent takes > 5 min: kill and mark as failed
- If agent fails 3x consecutively: auto-disable, send critical Slack alert

### Config
```json
{
  "timezone": "America/New_York",
  "max_agent_runtime_ms": 300000,
  "consecutive_failure_disable": 3,
  "digest_time": "08:00"
}
```

---

## Agent 2: Content Factory

**File:** `lib/agents/content-agent.ts`
**Schedule:** Daily 7 AM ET
**Dependencies:** OpenAI API, Replicate API, Cloudinary

### Daily Tasks
1. **Generate 3 before/after image pairs**
   - Source: Stock property photos (curated set in Cloudinary folder)
   - Process: Run through existing SnapR enhancement pipeline (sky replacement, twilight, HDR)
   - Output: Before URL + After URL pair → `content_queue` with `content_type: 'before_after'`

2. **Generate 5 platform-specific captions**
   - For each platform (Instagram, TikTok, Facebook, LinkedIn, Twitter):
   - GPT-4o prompt: "Write a {platform} post promoting AI real estate photo editing. Include a CTA to try free at snap-r.com. Tone: {platform_tone}. Max {char_limit} chars."
   - Platform tones: Instagram=visual/inspirational, TikTok=casual/trending, Facebook=informative, LinkedIn=professional, Twitter=concise/witty
   - Output: Caption + hashtags → `content_queue`

3. **Generate 1 blog post per week** (Monday only)
   - SEO-targeted topics from keyword list:
     - "Best real estate photo editing software 2026"
     - "How to edit real estate photos with AI"
     - "Virtual staging vs real staging: cost comparison"
     - "Real estate photography tips for beginners"
     - "How to create a property listing in 60 seconds"
   - GPT-4o generates 1500-2000 word post with H2/H3 structure
   - Output: `content_queue` with `content_type: 'blog_post'`

4. **Generate 2 video scripts per week** (Tuesday, Thursday)
   - Short-form (15-30s) scripts for TikTok/Reels
   - Format: Hook (3s) → Demo (15s) → CTA (5s)
   - Output: `content_queue` with `content_type: 'video_script'`

### GPT-4o System Prompts

**Caption prompt:**
```
You are SnapR's social media manager. SnapR is an AI-powered platform that transforms ordinary real estate photos into luxury showcases in 60 seconds.

Write a {platform} post that:
- Shows the power of AI photo enhancement for real estate
- Includes a CTA: "Try free at snap-r.com"
- Uses {platform}-appropriate tone and formatting
- Stays under {char_limit} characters
- Includes 5-8 relevant hashtags (for Instagram/TikTok)

Do NOT use generic AI language. Be specific about real estate photography.
```

**Blog post prompt:**
```
You are a real estate technology writer. Write a comprehensive blog post about "{topic}".

Requirements:
- 1500-2000 words
- SEO-optimized with the target keyword in H1, first paragraph, and 2-3 H2s
- Include practical tips, not just theory
- Mention SnapR naturally (not salesy) as a solution in 1-2 places
- Include a "Key Takeaways" section at the end
- Write for real estate photographers and agents (your audience)
```

### Content Scheduling Logic
- Before/afters: Scheduled for same day at 9 AM, 1 PM, 5 PM (one per Social Agent run)
- Captions: Scheduled across the next 2 days (to maintain buffer)
- Blog posts: Scheduled for publication the following Monday
- Video scripts: Flagged for manual video creation (future: auto-generate via Remotion)

### Config
```json
{
  "daily_before_afters": 3,
  "daily_captions": 5,
  "weekly_blog_posts": 1,
  "weekly_video_scripts": 2,
  "stock_photos_folder": "snapr-stock/properties",
  "seo_keywords": [
    "real estate photo editing software",
    "AI real estate photography",
    "virtual staging software",
    "real estate marketing automation",
    "property photo enhancement"
  ]
}
```

---

## Agent 3: Social Media

**File:** `lib/agents/social-agent.ts`
**Schedule:** 3x daily (9 AM, 1 PM, 5 PM ET)
**Dependencies:** Ayrshare API, content_queue table

### Per-Run Tasks
1. Query `content_queue` for items where `status = 'queued'` and `scheduled_for <= now()`
2. For each item (max 2 per run):
   a. Call Ayrshare API to post to the item's target platform
   b. If media_urls present: include images/video in the post
   c. Update `content_queue` → `status: 'posted'`, save `post_url`
   d. If Ayrshare fails: mark as `failed`, retry on next run (max 3 retries)
3. Every Sunday: Pull engagement metrics for all posts from the past 7 days via Ayrshare analytics

### Ayrshare Post Payload
```json
{
  "post": "Your caption here...",
  "platforms": ["instagram", "facebook", "linkedin"],
  "mediaUrls": ["https://res.cloudinary.com/..."],
  "hashtags": ["#realestate", "#realtorlife"],
  "scheduleDate": "2026-03-18T13:00:00Z",
  "shortenLinks": true
}
```

### Platform-Specific Rules
| Platform | Max chars | Media | Posting rules |
|----------|----------|-------|---------------|
| Instagram | 2200 | Required (image/video) | Must have media; hashtags in caption |
| TikTok | 2200 | Required (video preferred) | Video performs 10x better than images |
| Facebook | 63206 | Optional | Longer-form OK; links get previews |
| LinkedIn | 3000 | Optional | Professional tone; no hashtag spam |
| Twitter/X | 280 | Optional | Short, punchy; 1-2 hashtags max |

### Engagement Tracking
After posting, the Social Agent records:
- `post_url` from Ayrshare response
- On weekly analytics pull: update `content_queue.engagement` with `{ likes, comments, shares, impressions }`
- Feed top-performing content types back to Content Agent (stored in `agent_config.metadata`)

### Config
```json
{
  "platforms": ["instagram", "tiktok", "facebook", "linkedin", "twitter"],
  "posts_per_run": 2,
  "max_retries": 3,
  "engagement_pull_day": "sunday"
}
```

---

## Agent 4: Outreach

**File:** `lib/agents/outreach-agent.ts`
**Schedule:** Weekdays 10 AM ET
**Dependencies:** Google Maps API, Hunter.io API, Resend API

### Daily Tasks

#### Step 1: Find New Leads (20/day)
1. Pick next city from `target_cities` rotation
2. Google Maps Text Search: `"real estate photographer {city}"` → get 20 results
3. For each result:
   a. Extract: business name, website, phone, address
   b. If website exists: Hunter.io domain search → find email
   c. If no website: Hunter.io email finder with business name
   d. Verify email deliverability via Hunter.io
   e. Insert into `outreach_leads` (dedupe on email)

#### Step 2: Send Initial Emails (up to 50/day)
1. Query `outreach_leads` where `status = 'new'`, limit 50
2. For each lead:
   a. Generate personalized email via GPT-4o (see templates below)
   b. Send via Resend API
   c. Record in `outreach_emails`
   d. Update lead status → `'emailed'`

#### Step 3: Send Follow-ups
1. Query leads where `status = 'emailed'` AND `email_sent_at < now() - 3 days` AND `followup_1_at IS NULL`
   → Send Follow-up 1
2. Query leads where `followup_1_at IS NOT NULL` AND `followup_1_at < now() - 4 days` AND `followup_2_at IS NULL`
   → Send Follow-up 2
3. After Follow-up 2 with no response: mark as `'no_response'` (stop emailing)

### Email Templates

**Initial Email (Photographer):**
```
Subject: I'll edit your next listing photos for free, {first_name}

Hi {first_name},

I came across {company} and your work looks great.

I built an AI tool called SnapR that enhances real estate photos — sky replacement, virtual twilight, HDR, virtual staging — all in under 60 seconds per listing.

I'd love to run one of your shoots through it for free so you can see the quality. No credit card, no commitment.

Just upload your photos here: https://snap-r.com/?ref=outreach-{city_slug}

Best,
The SnapR Team

P.S. Here's a before/after from a recent listing: {before_after_url}
```

**Initial Email (Agent):**
```
Subject: Your listings deserve better photos, {first_name}

Hi {first_name},

Quick question: how much time do you spend per listing getting photos edited, writing descriptions, and creating social posts?

SnapR does all of that in 60 seconds. Upload your photos, and AI handles: enhancement, MLS descriptions, social captions, property sites, and scheduled posts.

Try it free (3 listings, no credit card): https://snap-r.com/?ref=outreach-{city_slug}

Best,
The SnapR Team
```

**Follow-up 1 (Day 3):**
```
Subject: Re: {original_subject}

Hi {first_name},

Just checking in — did you get a chance to look at SnapR?

Here's a 60-second demo: {demo_video_url}

No reply needed if it's not a fit. Just thought it might save you some editing time.

Best,
The SnapR Team
```

**Follow-up 2 (Day 7):**
```
Subject: Last one from me, {first_name}

Hi {first_name},

Last email, I promise. Just wanted to share that SnapR now includes:

- AI virtual twilight (no re-shoot needed)
- One-click sky replacement
- Auto-generated MLS descriptions
- Social media auto-posting

If you ever want to try it: https://snap-r.com/?ref=outreach-{city_slug}

No hard feelings either way. Wishing you a great {season}!

Best,
The SnapR Team
```

### City Rotation
Rotate through top U.S. metros, one per day:
```
Week 1: Los Angeles, New York, Miami, Chicago, Houston
Week 2: Dallas, Phoenix, San Francisco, Seattle, Atlanta
Week 3: Denver, Boston, San Diego, Nashville, Austin
Week 4: Portland, Charlotte, Tampa, Las Vegas, Orlando
```

### Config
```json
{
  "daily_new_leads": 20,
  "daily_emails": 50,
  "followup_1_days": 3,
  "followup_2_days": 7,
  "max_followups": 2,
  "target_cities": ["Los Angeles", "New York", "Miami", "Chicago", "Houston",
                     "Dallas", "Phoenix", "San Francisco", "Seattle", "Atlanta"]
}
```

---

## Agent 5: Sales & Conversion

**File:** `lib/agents/sales-agent.ts`
**Schedule:** Daily 6 PM ET
**Dependencies:** Supabase (profiles table), Resend API, Stripe API

### Daily Tasks

#### 1. Free User Approaching Limits
```sql
SELECT * FROM profiles
WHERE plan = 'free'
AND listings_used_this_month >= 2
AND last_nudge_at IS NULL OR last_nudge_at < now() - interval '7 days'
```
→ Send "You've used 2 of 3 free listings. Upgrade to Gold for $20/listing" email

#### 2. Trial Expiration Reminders
```sql
SELECT * FROM profiles
WHERE subscription_status = 'trialing'
AND trial_end_at BETWEEN now() AND now() + interval '3 days'
```
→ Send "Your trial ends in X days" email with upgrade CTA

#### 3. Inactive User Re-engagement
```sql
SELECT * FROM profiles
WHERE plan != 'free'
AND last_sign_in_at < now() - interval '7 days'
AND subscription_status = 'active'
```
→ Send "We miss you! Here's what's new in SnapR" email

#### 4. Win-back Churned Users
```sql
SELECT * FROM profiles
WHERE subscription_status = 'canceled'
AND updated_at BETWEEN now() - interval '30 days' AND now() - interval '7 days'
```
→ Send "Come back for 20% off" email with Stripe promo code

#### 5. Generate Stripe Promo Codes
- Create time-limited coupon: 20% off first month
- `stripe.coupons.create({ percent_off: 20, duration: 'once', max_redemptions: 50, redeem_by: +30days })`
- Include coupon code in win-back and conversion emails

### Config
```json
{
  "free_trial_reminder_days": [3, 7, 10],
  "inactive_days_trigger": 7,
  "winback_window_days": [7, 30],
  "discount_percent": 20,
  "max_nudges_per_user": 3,
  "nudge_cooldown_days": 7
}
```

---

## Agent 6: Data & Analytics

**File:** `lib/agents/data-agent.ts`
**Schedule:** Daily 11 PM ET
**Dependencies:** GA4 API, Stripe API, Ayrshare API, Supabase

### Daily Tasks

#### 1. Pull Website Analytics (GA4)
- Active users today
- New users (signups)
- Sessions by source (organic, social, email, ads)
- Top landing pages
- Conversion rate (visitor → signup)

#### 2. Pull Revenue Data (Stripe)
- Current MRR (sum of active subscriptions)
- New subscribers today
- Churned subscribers today
- Revenue collected today
- Failed payments

#### 3. Pull Social Metrics (Ayrshare)
- Follower counts per platform
- Posts published today
- Total engagement (likes + comments + shares)
- Top performing post

#### 4. Pull Outreach Metrics (Supabase)
- Emails sent today
- Emails opened (from outreach_emails)
- Open rate
- New leads found
- Leads converted

#### 5. Pull Ad Metrics (Phase 2 — Google Ads + Meta Ads)
- Ad spend today
- Clicks
- Conversions
- CPA (cost per acquisition)
- Auto-pause ads with CPA > threshold

#### 6. Write to agent_daily_metrics
- Insert one row per day with all aggregated metrics

#### 7. Weekly CMO Report (Monday only)
Generate comprehensive report via GPT-4o:
```
SnapR Weekly CMO Report — Week of March 10, 2026

REVENUE
- MRR: $3,200 (+$600 vs last week, +23%)
- New subscribers: 4 (2 Gold, 1 Platinum, 1 Enterprise trial)
- Churn: 1 (reason: "not using enough")
- LTV estimate: $1,800

GROWTH
- Website visitors: 2,940 (+18% vs last week)
- Signups: 35 (12% conversion from visitor)
- Free→Paid conversion: 11% (4 of 35)

CHANNELS
- Organic search: 1,200 visitors (best channel)
- Social media: 800 visitors (Instagram driving 60%)
- Email outreach: 540 visitors (from 250 emails, 22% CTR)
- Direct: 400 visitors

SOCIAL
- Instagram: 1,240 followers (+180)
- TikTok: 890 followers (+220, fastest growing)
- LinkedIn: 340 followers (+40)
- Best post: Before/after reel on Instagram (12K views, 340 likes)

RECOMMENDATIONS
1. Double down on TikTok (fastest follower growth)
2. Increase outreach to photographers (higher conversion than agents)
3. Create more before/after content (top performer across all platforms)
4. Consider increasing Google Ads budget from $20→$30/day (CPA is $35, below $50 target)
```

### Config
```json
{
  "track_ga4": true,
  "track_stripe": true,
  "track_social": true,
  "track_ads": false,
  "cpa_pause_threshold_cents": 5000,
  "weekly_report_day": "monday",
  "report_email": "founder@snap-r.com"
}
```

---

## Agent 7: Support

**File:** `lib/agents/support-agent.ts`
**Schedule:** Realtime (webhook-triggered)
**Dependencies:** Crisp API, OpenAI GPT-4o, Supabase

### How It Works

1. User sends message via Crisp chat widget on snap-r.com
2. Crisp webhook fires → `POST /api/agents/support/webhook`
3. Support Agent:
   a. Loads conversation history (last 10 messages)
   b. Looks up user in Supabase (by email if available)
   c. Builds context: user plan, listing count, last activity
   d. Sends to GPT-4o with system prompt (see below)
   e. Posts response back via Crisp API
4. If GPT-4o confidence is low (response includes "[ESCALATE]"): send email to support@snap-r.com

### GPT-4o System Prompt
```
You are SnapR's AI support assistant. SnapR is an AI-powered platform that transforms real estate photos into luxury showcases and auto-generates marketing materials.

ABOUT THE USER:
- Plan: {plan}
- Listings: {listings_used}/{listings_limit}
- Member since: {created_at}
- Last active: {last_sign_in_at}

COMMON QUESTIONS AND ANSWERS:
- "How do I upgrade?": Direct to /pricing or /dashboard/billing
- "My photos aren't processing": Check if they uploaded to a listing, suggest refreshing
- "How do I connect social media?": Go to /dashboard/settings/social
- "Cancel subscription": Direct to /dashboard/billing → Manage Subscription
- "How does pricing work?": Per-listing pricing, slider at /pricing
- "Is there a free trial?": Free plan = 3 listings/month forever, no CC needed
- "What AI tools are included?": All 15 tools on every plan
- "How do I get MLS descriptions?": Auto-generated when you "Prepare Listing"

RULES:
- Be helpful, concise, and friendly
- Never make up features that don't exist
- If you're not sure about the answer, include "[ESCALATE]" at the end of your response
- Never share internal system details, API keys, or technical architecture
- For billing disputes, always [ESCALATE]
- For bug reports, log the details and [ESCALATE]
```

### Config
```json
{
  "auto_reply": true,
  "max_context_messages": 10,
  "escalation_email": "support@snap-r.com",
  "confidence_threshold": 0.7,
  "greeting": "Hi! I'm SnapR's AI assistant. How can I help you today?"
}
```
