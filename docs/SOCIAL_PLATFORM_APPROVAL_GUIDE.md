# SnapR — Social Platform Approval & Setup Guide

## Context

SnapR's auto-publishing pipeline is fully coded (OAuth connect → marketing auto-generates content → cron publishes every 15 min). But users can't publish until each platform's API permissions are approved. This document covers the **approval process, requirements, and submission materials** for all four platforms: Facebook, Instagram, LinkedIn, and TikTok.

---

## Platform 1: Facebook

### App Details
- **App ID:** `1831280807749677`
- **Callback URL:** `https://snap-r.com/api/social/oauth/facebook`
- **Developer Console:** [developers.facebook.com](https://developers.facebook.com)

### Permissions Required

| Permission | Purpose | Review Required |
|-----------|---------|-----------------|
| `pages_show_list` | Show user's Pages so they can pick which one to post to | Yes |
| `pages_manage_posts` | Publish property listing posts to Facebook Pages | Yes |
| `pages_read_engagement` | Read likes/comments/shares for analytics dashboard | Yes |
| `publish_video` | Publish video tours to Pages | Yes |

### Prerequisites
1. **Business Verification** — Facebook requires this before granting publishing permissions
   - Government-issued business registration document OR utility bill with business name/address
   - Submit at: App Dashboard → Settings → Business Verification
   - Takes 1-5 business days

2. **Privacy Policy** — Must be publicly accessible
   - Current: `https://snap-r.com/privacy` (exists, last updated Dec 2025)
   - Must explicitly mention Facebook/Instagram data handling (see Privacy Updates section below)

3. **Terms of Service** — Must be publicly accessible
   - Current: `https://snap-r.com/terms` (exists)

### Submission Text per Permission

**`pages_show_list`**
> SnapR is a real estate marketing platform. When an agent connects their Facebook account, we display their managed Facebook Pages so they can choose which Page to publish property listing content to. Without this permission, we cannot identify the correct Page for posting.

**`pages_manage_posts`**
> When a real estate agent prepares a property listing in SnapR, our AI generates marketing content including MLS-quality descriptions, platform-specific captions, and enhanced photos. Agents can auto-publish or schedule these as Facebook Page posts featuring their property listings. This is the core value of SnapR — automated social media marketing for real estate professionals.

**`pages_read_engagement`**
> SnapR provides an analytics dashboard showing how property listing posts perform across social platforms. We sync engagement metrics (likes, comments, shares, reach, impressions) every 6 hours so agents can understand which listings generate the most interest and optimize their marketing strategy.

**`publish_video`**
> SnapR allows agents to create property video tours and publish them directly to their Facebook Page alongside photo posts. Video tours are a key marketing format for real estate listings.

### Screen Recording Script (2-3 min per permission)

Record at 1080p. Narrate each step — reviewers are non-technical.

**Recording 1 — pages_show_list + pages_manage_posts (combine in one video)**
1. Log into SnapR → Dashboard → Settings → Social
2. Click "Connect Facebook" → Complete OAuth dialog (show permissions being requested)
3. Show the Page selector dropdown appearing with user's Pages
4. Select a default Page
5. Go to Studio → Show a prepared listing with enhanced photos
6. Show the marketing pipeline auto-generating captions
7. Show the scheduled post in Marketing Results panel
8. Show the post appearing on the Facebook Page timeline

**Recording 2 — pages_read_engagement**
1. Show the Analytics dashboard at Dashboard → Content Studio → Analytics
2. Filter by Facebook
3. Show engagement metrics (likes, comments, shares, impressions) for published posts
4. Explain the automatic 6-hour sync

### Timeline
- Business Verification: 1-5 business days
- App Review: 1-5 business days (sometimes longer)
- **Total: Plan for 2 weeks**

---

## Platform 2: Instagram

### How It Works
Instagram publishing uses the **Facebook Graph API** — not a separate Instagram API. The user connects their Facebook account, and SnapR discovers the Instagram Business Account linked to their Facebook Page.

**Prerequisite:** The user must have an **Instagram Business Account** (not Personal or Creator) connected to a Facebook Page.

### App Details
- **Same Facebook App ID:** `1831280807749677`
- **Callback URL:** `https://snap-r.com/api/social/oauth/facebook` (same OAuth flow)

### Permissions Required

| Permission | Purpose | Review Required |
|-----------|---------|-----------------|
| `instagram_basic` | Read IG Business Account info for connection setup | Yes |
| `instagram_content_publish` | Publish property photos/carousels to Instagram | Yes |
| `pages_show_list` | Required to discover which Page has a linked IG account | Yes (same as Facebook) |

### Submission Text per Permission

**`instagram_basic`**
> SnapR connects to Instagram Business Accounts (linked via Facebook Pages) to enable automated property listing posts. We need instagram_basic to identify the Instagram Business Account connected to the agent's Facebook Page and to read basic profile information during the connection setup flow.

**`instagram_content_publish`**
> After SnapR's AI enhances property photos and generates Instagram-specific captions with relevant hashtags, agents can auto-publish or schedule Instagram posts. We support single image posts and photo carousels (multiple listing photos). This automated marketing saves real estate agents hours of manual social media work per listing.

### Screen Recording Script

**Recording 3 — instagram_basic + instagram_content_publish (combine)**
1. Settings → Social → Click "Connect Instagram"
2. Complete Facebook OAuth (Instagram uses same flow)
3. Show the Instagram Business Account detected and connected
4. Show it in the Social connections list
5. Show a prepared listing with AI-enhanced photos
6. Show Instagram-specific captions with hashtags in Marketing Results panel
7. Show a scheduled Instagram post
8. Show the post appearing on the Instagram Business Account (carousel format)

### Timeline
- Submitted alongside Facebook permissions in the same App Review
- **No additional wait** — same review cycle as Facebook

---

## Platform 3: LinkedIn

### App Details
- **Client ID:** `86h0z30jfjjerr`
- **Callback URL:** `https://snap-r.com/api/social/oauth/linkedin`
- **Developer Console:** [linkedin.com/developers](https://linkedin.com/developers)

### Permissions Required

| Permission | Purpose | How to Get |
|-----------|---------|------------|
| `openid` | Basic OpenID Connect auth | Default — no review needed |
| `profile` | Read user's name/profile | Default — no review needed |
| `email` | Read user's email | Default — no review needed |
| `w_member_social` | Post content on user's behalf | Request "Share on LinkedIn" product |

### How to Get `w_member_social`
1. Go to [linkedin.com/developers](https://linkedin.com/developers) → Your App
2. Click **Products** tab
3. Find **"Share on LinkedIn"** → Click **Request Access**
4. Accept the terms
5. Usually **auto-approved within minutes to hours**

### No Screen Recording Needed
LinkedIn does not require video demonstrations for the Share product. It's a self-service product request.

### Submission Text (if a description is required)
> SnapR is a real estate marketing platform that auto-generates property listing content. When a listing is prepared, our AI creates LinkedIn-specific professional captions. Agents can auto-publish or schedule these posts to their LinkedIn profile to market properties to their professional network.

### Timeline
- **Minutes to hours** — significantly faster than Facebook/Instagram

---

## Platform 4: TikTok

### App Details
- **Client Key:** Requires `TIKTOK_CLIENT_KEY` (set in env)
- **Callback URL:** `https://snap-r.com/api/social/tiktok/callback`
- **Developer Console:** [developers.tiktok.com](https://developers.tiktok.com)

### Current Code Status
| Component | Status |
|-----------|--------|
| OAuth config | Configured in `lib/social/oauth-config.ts` |
| Auth route | Implemented at `/api/social/tiktok` |
| Callback route | Implemented at `/api/social/tiktok/callback` |
| Settings UI | Shows "Coming Soon" (`available: false`) |
| Publish function | **NOT IMPLEMENTED** — needs `publishToTikTok()` in `publish-service.ts` |

### Permissions/Scopes Required

| Scope | Purpose | Review Required |
|-------|---------|-----------------|
| `user.info.basic` | Read user's display name + avatar for connection setup | Included with Login Kit (default) |
| `video.publish` | Direct Post — publish photos/videos to user's TikTok profile | Yes — App Audit required |
| `video.upload` | Upload as draft — user reviews in TikTok before posting | Yes — App Audit required |
| `user.info.stats` | Read follower/following counts for analytics | Yes |
| `video.list` | Read user's video list with per-video metrics | Yes |

### Key TikTok Facts for SnapR
1. **Photo posts ARE supported** — TikTok Content Posting API supports photo carousels. Perfect for property listings.
2. **Photo post endpoint:** `POST /v2/post/publish/content/init/` with `media_type: "PHOTO"` and `photo_images` array
3. **Photos can be pulled from URL** — use `PULL_FROM_URL` transfer type with SnapR's CDN URLs (Cloudinary)
4. **Before audit approval:** Only 5 users can post per day, all posts are forced PRIVATE
5. **After audit approval:** Public posting unlocked, creator cap set based on your estimates

### App Setup Steps
1. Go to [developers.tiktok.com](https://developers.tiktok.com) → Create App (or configure existing)
2. Enable **Login Kit** (for OAuth)
3. Enable **Content Posting API** (for publishing)
4. Set redirect URI: `https://snap-r.com/api/social/tiktok/callback`
5. Set Terms of Service URL: `https://snap-r.com/terms`
6. Set Privacy Policy URL: `https://snap-r.com/privacy`

### Business Verification (Required)
Submit at developers.tiktok.com → App Settings → Verify Business:
- Company name and registration number
- Business registration document (Articles of Incorporation, Certificate of Registration)
- Government-issued photo ID of authorized representative (Passport, Driver's License, National ID)
- If representative's name is not on business docs: Letter of Authorization (TikTok provides template)

### App Audit Submission
After business verification, submit for App Audit:

**App Description:**
> SnapR is an AI-powered real estate marketing platform used by property agents across the United States. When an agent prepares a property listing, SnapR's AI enhances the photos (sky replacement, virtual staging, twilight conversion) and generates platform-specific marketing content. For TikTok, we create photo carousel posts featuring enhanced property photos with optimized captions and relevant hashtags. Agents can auto-publish or schedule these posts. The goal is to automate property marketing on TikTok, saving agents hours of manual content creation per listing.

**Use Case:**
> Automated real estate property marketing. Users connect their TikTok account via OAuth, then SnapR auto-creates and schedules property listing photo posts when a listing is prepared.

**Content Type:** Photo carousels (property listing photos)

**Estimated Daily Active Creators:** Start with 50-100, scale to 1000+ (provide your best estimate)

### Screen Recording Script for TikTok

**Recording 4 — Login Kit + Content Posting (combine)**
1. Log into SnapR → Dashboard → Settings → Social
2. Click "Connect TikTok" → Complete TikTok OAuth
3. Show TikTok account connected in settings
4. Go to Studio → Show a prepared listing with enhanced photos
5. Show TikTok-specific caption in Marketing Results panel
6. Show scheduled TikTok post
7. Show the photo carousel appearing on TikTok profile

### Rate Limits
- 6 publish requests/minute per user
- ~15 posts/day per creator account (shared across all API clients)
- Unaudited: max 5 unique creators per 24 hours

### Code Work Needed (Implementation)
Once TikTok app is approved, implement `publishToTikTok()` in `lib/social/publish-service.ts`:
- Use Content Posting API v2: `POST https://open.tiktokapis.com/v2/post/publish/content/init/`
- Photo post with `PULL_FROM_URL` (pull from Cloudinary CDN)
- Support photo carousels via `photo_images` array
- Add TikTok case to `publishToSocial()` switch statement
- Enable TikTok in settings UI: set `available: true`
- Add TikTok caption generation in marketing-handler.ts Step 2

### Timeline
- Business Verification: 1-5 business days
- App Audit: 1-2 weeks (sometimes longer)
- **Total: Plan for 2-3 weeks**

---

## Privacy Policy Updates Required

Facebook may reject the app review if the privacy policy doesn't explicitly mention platform-specific data handling. Add these sections to `https://snap-r.com/privacy`:

### Section: "Social Media Platform Data"

> **Facebook & Instagram Data:** When you connect your Facebook or Instagram account, we access your Facebook Pages list, Page access tokens, and Instagram Business Account information. We use this data solely to publish property listing content on your behalf. We store your Page access token securely to enable scheduled publishing. We read engagement metrics (likes, comments, shares, impressions, reach) on posts we published to provide analytics. We do not access your personal Facebook profile, friends list, messages, or any other personal data.

> **LinkedIn Data:** When you connect your LinkedIn account, we access your basic profile information and a publishing token. We use this solely to post property listing content to your LinkedIn profile. We do not access your connections, messages, or any other LinkedIn data.

> **TikTok Data:** When you connect your TikTok account, we access your basic profile information (display name, avatar). We use this to publish property listing photo posts to your TikTok profile. We do not access your videos, followers list, messages, or any other TikTok data.

### Section: "Data Deletion"

> You can disconnect any social media account at any time from Settings → Social. When you disconnect, we immediately revoke the stored access token and delete all platform-specific connection data. Previously published posts remain on the respective platforms and must be deleted directly from those platforms.

---

## Recommended Order of Operations

| Priority | Platform | Action | Timeline |
|----------|----------|--------|----------|
| 1 | LinkedIn | Request "Share on LinkedIn" product | Hours |
| 2 | Facebook + Instagram | Submit Business Verification | 1-5 days |
| 3 | Facebook + Instagram | Submit App Review (all 6 permissions) | 1-5 days after verification |
| 4 | TikTok | Create developer app + Business Verification | 1-5 days |
| 5 | TikTok | Submit App Audit | 1-2 weeks after verification |

**Parallel work while waiting:**
- Fix Supabase billing → apply migrations → E2E test
- Add yourself as Facebook App tester → test full flow immediately
- Build TikTok `publishToTikTok()` function (ready for when audit passes)

---

## Immediate Testing (Before Any Approvals)

You can test the full auto-publish flow RIGHT NOW without platform approvals:

1. **Facebook:** Add your personal Facebook account as a **Tester** or **Developer** in the Facebook App Dashboard → Roles. Testers can use all permissions without App Review.
2. **Instagram:** Same — your tester Facebook account's linked IG Business Account will work.
3. **LinkedIn:** Request the Share product (usually instant) → test immediately.
4. **TikTok:** Create the developer app → add yourself as tester → posts will be PRIVATE but the flow works.

---

## Verification

After all approvals:
1. Remove yourself from Facebook App tester role → confirm OAuth still works for regular users
2. Have a non-tester user connect Facebook → verify they can authorize all permissions
3. Publish a test post to each platform → verify it appears publicly
4. Wait 6 hours → verify analytics sync pulls engagement metrics
5. Test with a free-tier user → verify they get "skipped" (no publishing)
6. Test with expired token → verify graceful error handling
