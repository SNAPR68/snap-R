# SnapR Technical Infrastructure & Service Registry
*Last updated: 2026-04-07*

---

## 1. Platform Accounts & IDs

### 1a. Core Infrastructure

| Platform | Account/ID | URL | Purpose |
|----------|-----------|-----|---------|
| **GitHub** | SNAPR68/snap-R | github.com/SNAPR68/snap-R | Source code, CI/CD (private repo) |
| **Vercel** | tscllps-projects/snap-r | vercel.com/tscllps-projects/snap-r | Hosting, serverless, crons |
| **Cloudflare** | Account `fba122ac756d435879872c360b2004f7` | dash.cloudflare.com | DNS, Workers, R2 storage |
| **Supabase** | Project `asoiwonhqoesbvcilqwd` | asoiwonhqoesbvcilqwd.supabase.co | PostgreSQL, Auth, Storage, Realtime |
| **AWS** | us-east-1 | console.aws.amazon.com | Lambda (Remotion video rendering) |

### 1b. Payments & Subscriptions

| Platform | Account/ID | URL | Purpose |
|----------|-----------|-----|---------|
| **Stripe** | Production account | dashboard.stripe.com | Payment processing, subscriptions |
| **RevenueCat** | Project `proj0181f5d6` | app.revenuecat.com/projects/0181f5d6 | Subscription management, entitlements, analytics |

### 1c. AI & Processing Services

| Platform | Account/ID | URL | Purpose |
|----------|-----------|-----|---------|
| **OpenAI** | API account | platform.openai.com | GPT-4o descriptions, GPT-4o-mini captions, TTS |
| **ElevenLabs** | API account | elevenlabs.io | Voiceover TTS (primary provider) |
| **Replicate** | API account | replicate.com | AI enhancement, virtual renovation |
| **Runware** | API account | runware.ai | Sky replacement, image generation |
| **FAL** | API account | fal.ai | Serverless AI inference |

### 1d. Media & CDN

| Platform | Account/ID | URL | Purpose |
|----------|-----------|-----|---------|
| **Cloudinary** | Cloud `drie9liyn` | console.cloudinary.com | Image/video CDN, transforms |
| **Cloudflare R2** | Bucket `snap-r` | dash.cloudflare.com | Processed image storage |
| **AWS S3** | Bucket `remotionlambda-useast1-64vfat1kzg` | console.aws.amazon.com | Video render output |

### 1e. Social Platform Integrations

| Platform | API Version | Account/App ID | OAuth Scopes |
|----------|------------|---------------|-------------|
| **Facebook** | Graph API v18.0 | App ID `1831280807749677` | pages_manage_posts, pages_read_engagement, pages_manage_metadata, publish_video, pages_show_list |
| **Instagram** | Graph API v18.0 | Via Facebook App `1831280807749677` | instagram_basic, instagram_content_publish, instagram_manage_comments |
| **LinkedIn** | REST API v202401 | Client ID `86h0z30jfjjerr` | openid, profile, email, w_member_social |
| **TikTok** | Open API v2 | Via `TIKTOK_CLIENT_KEY` | user.info.basic, video.publish, video.upload |
| **Twitter/X** | API v2 | Via `TWITTER_CLIENT_ID` (PKCE S256) | tweet.read, tweet.write, users.read |

### 1f. Communication

| Platform | Account/ID | URL | Purpose |
|----------|-----------|-----|---------|
| **Resend** | API account | resend.com | Transactional email (alerts, digests, bulk) |
| **Twilio** | SID `[REDACTED]` | twilio.com | SMS + WhatsApp notifications |
| **Twilio WhatsApp** | `[REDACTED]` | — | WhatsApp sender number |

### 1g. Monitoring & Analytics

| Platform | Account/ID | URL | Purpose |
|----------|-----------|-----|---------|
| **Sentry** | DSN `4959cf03...@o4510685962240000` | sentry.io | Error tracking, session replay, performance |
| **Hotjar (Contentsquare)** | Script ID `72ac82fa71720` | contentsquare.com | Heatmaps, session recordings, user behavior |
| **Google Analytics** | Via `NEXT_PUBLIC_GA_ID` (G-tag) | analytics.google.com | Web traffic analytics, conversions |
| **PagerDuty** | Via `PAGERDUTY_ROUTING_KEY` | pagerduty.com | Incident alerting (Events API v2) |
| **Slack Webhooks** | Via `SLACK_ALERT_WEBHOOK_URL` | slack.com | Critical alert notifications |

### 1h. Scheduling & Sales

| Platform | Account/ID | URL | Purpose |
|----------|-----------|-----|---------|
| **Calendly** | `calendly.com/rajesh-snap-r/30min` | calendly.com | Sales meeting booking |

### Domain & DNS

| Domain | Registrar/DNS | CDN | SSL |
|--------|--------------|-----|-----|
| **snap-r.com** | Cloudflare | Cloudflare | Cloudflare (auto-managed) |

---

## 2. Developer Tooling & AI Assistants

| Tool | Current Plan | Monthly Cost | Purpose | Upgrade Needed |
|------|-------------|-------------|---------|---------------|
| **Claude (Anthropic)** | Max | $200/mo | AI coding assistant, architecture, code review | Enterprise ($100/seat/mo, SSO, admin controls) |
| **Cursor IDE** | Pro | $20/mo | AI-powered code editor, inline completions | Business ($40/seat/mo for team) |
| **GitHub Copilot** | — | $0–19/mo | AI code suggestions (supplementary) | Optional, covered by Claude + Cursor |
| **OpenAI Codex** | — | TBD | Autonomous coding agent | Evaluate when GA |
| **GitHub** | Team (1 seat) | $4/mo | Private repo, Actions CI/CD, branch protection | Team ($4/seat/mo) scales with hires |
| **Vercel CLI** | Included in Pro | $0 | Local dev, preview deploys, production deploy | — |
| **Wrangler CLI** | Included in Workers | $0 | Cloudflare Worker deploy | — |

### Developer Tools Summary

| Category | Tools | Monthly Cost |
|----------|-------|-------------|
| **AI Coding** | Claude Max, Cursor Pro | $220/mo |
| **Source Control** | GitHub Team | $4/mo |
| **Deployment CLI** | Vercel CLI, Wrangler CLI | $0 |
| **Total Developer Tooling** | | **$224/mo** |

---

## 3. Current Subscriptions (Monthly Cost)

### Infrastructure & Hosting

| Service | Plan | Monthly Cost | What It Does |
|---------|------|-------------|-------------|
| **Vercel** | Pro | $20/mo | Next.js hosting, serverless functions, 11 cron jobs |
| **Supabase** | Pro | $25/mo | PostgreSQL, Auth, RLS, Storage, Realtime |
| **Cloudflare** | Workers Paid | $5/mo | Workers, R2 object storage, KV, Queues |
| **Cloudinary** | Plus | $89/mo | Image transforms, CDN, video hosting |
| **Upstash** | Pay-as-you-go | ~$10/mo | Redis for rate limiting |
| **GitHub** | Team (1 seat) | $4/mo | Private repo, Actions CI/CD |
| **Domain (snap-r.com)** | Cloudflare | $15/yr | Domain registration |

### AI & Processing

| Service | Plan | Monthly Cost | What It Does |
|---------|------|-------------|-------------|
| **OpenAI** | Pay-as-you-go | ~$50–200/mo | GPT-4o descriptions, GPT-4o-mini captions, TTS |
| **ElevenLabs** | Starter | $22/mo | Voiceover TTS (primary) |
| **Replicate** | Pay-as-you-go | ~$20–100/mo | AI enhancement, virtual renovation |
| **Runware** | Pay-as-you-go | ~$5–20/mo | Sky replacement, image generation |
| **FAL** | Pay-as-you-go | ~$5–15/mo | Serverless AI inference |
| **AWS Lambda** | Pay-as-you-go | ~$5–20/mo | Remotion video rendering |

### Communication

| Service | Plan | Monthly Cost | What It Does |
|---------|------|-------------|-------------|
| **Resend** | Pro | $20/mo | Transactional email (alerts, digests, bulk) |
| **Twilio** | Pay-as-you-go | ~$5–20/mo | SMS + WhatsApp notifications |

### Monitoring & Alerting

| Service | Plan | Monthly Cost | What It Does |
|---------|------|-------------|-------------|
| **Sentry** | Team | $26/mo | Error tracking, session replay, performance |
| **Hotjar (Contentsquare)** | Basic | $0–39/mo | User behavior analytics, heatmaps, session recordings |
| **PagerDuty** | Free | $0 | Incident alerting (5 users) |
| **Google Analytics** | Free | $0 | Web traffic analytics |

### Payments & Billing

| Service | Plan | Monthly Cost | What It Does |
|---------|------|-------------|-------------|
| **Stripe** | Standard | 2.9% + $0.30/txn | Payment processing |
| **RevenueCat** | Free (<$2.5K MTR) | $0 (then 1% of MTR) | Subscription management, entitlements |

### Developer Tools

| Service | Plan | Monthly Cost | What It Does |
|---------|------|-------------|-------------|
| **Claude (Anthropic)** | Max | $200/mo | AI coding, architecture, code generation |
| **Cursor IDE** | Pro | $20/mo | AI code editor, completions |

### Scheduling

| Service | Plan | Monthly Cost | What It Does |
|---------|------|-------------|-------------|
| **Calendly** | — | $0 (basic) | Sales meeting booking |

---

### Total Current Monthly Cost

| Category | Monthly Cost |
|----------|-------------|
| Infrastructure & Hosting | ~$168 |
| AI & Processing (variable) | ~$107–377 |
| Communication | ~$25–40 |
| Monitoring | ~$26–65 |
| Payments | Variable (% of revenue) |
| Developer Tools | ~$224 |
| **Total Fixed** | **~$460/mo** |
| **Total with Variable (est.)** | **~$600–900/mo** |

---

## 4. Social Platform Integrations (Detailed)

| Platform | API Version | OAuth Flow | Publish Capability | Analytics Scope |
|----------|------------|-----------|-------------------|----------------|
| **Facebook** | Graph API v18.0 | App ID `1831280807749677`, redirect to `/api/social/callback/facebook` | Pages API (photos, carousel, feed) | pages_read_engagement |
| **Instagram** | Graph API v18.0 | Via Facebook OAuth (same App ID) | Media API (single, carousel) via Instagram Business Account | instagram_basic |
| **LinkedIn** | REST API v202401 | Client ID `86h0z30jfjjerr`, Community Management API v2 | Posts API (text, image, multi-image), 3-step image upload | w_member_social |
| **TikTok** | Open API v2 | Via `TIKTOK_CLIENT_KEY`, JSON body (not form-urlencoded) | Photo/Video posting (`PULL_FROM_URL`), unaudited = private-only | user.info.basic |
| **Twitter/X** | API v2 | Via `TWITTER_CLIENT_ID` (PKCE S256 with code verifier in state) | Tweets + chunked media upload | — |

### Social Platform Token Lifecycle

| Platform | Access Token TTL | Refresh Strategy |
|----------|-----------------|-----------------|
| Facebook | ~60 days (long-lived) | Short→long-lived exchange via `fb_exchange_token` |
| Instagram | Via Facebook token | Same as Facebook |
| LinkedIn | 365 days | Cron refresh every 4 hours |
| TikTok | ~24 hours | Refresh token ~365 days, auto-refreshed by cron publisher |
| Twitter/X | ~2 hours | Refresh token used by cron |

---

## 5. Environment Variables Registry

### Public (Client-Side)

| Variable | Value/Pattern | Service |
|----------|--------------|---------|
| `NEXT_PUBLIC_BASE_URL` | `https://snap-r.com` | App |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://asoiwonhqoesbvcilqwd.supabase.co` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT token | Supabase |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_*` | Stripe |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | `1831280807749677` | Facebook |
| `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` | `86h0z30jfjjerr` | LinkedIn |
| `NEXT_PUBLIC_CALENDLY_URL` | `https://calendly.com/rajesh-snap-r/30min` | Calendly |
| `NEXT_PUBLIC_GA_ID` | GA tracking ID (G-tag) | Google Analytics |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://4959cf03...@o4510685962240000.ingest.us.sentry.io/...` | Sentry |
| `NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY` | RC public key | RevenueCat |

### Private (Server-Side)

| Variable | Service | Purpose |
|----------|---------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Admin DB access (bypasses RLS) |
| `SUPABASE_JWT_SECRET` | Supabase | JWT verification |
| `STRIPE_SECRET_KEY` | Stripe | Server-side API |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook signature verification |
| `OPENAI_API_KEY` | OpenAI | GPT-4o, TTS |
| `REPLICATE_API_TOKEN` | Replicate | AI models |
| `RUNWARE_API_KEY` | Runware | Image generation |
| `FAL_API_KEY` | FAL | AI inference |
| `ELEVENLABS_API_KEY` | ElevenLabs | Voiceover TTS |
| `RESEND_API_KEY` | Resend | Email delivery |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | Workers, R2 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | `fba122ac756d435879872c360b2004f7` |
| `CLOUDFLARE_R2_BUCKET` | Cloudflare | `snap-r` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | `drie9liyn` |
| `CLOUDINARY_API_KEY` | Cloudinary | Image API |
| `CLOUDINARY_API_SECRET` | Cloudinary | Image API |
| `CRON_SECRET` | Vercel | Cron job auth |
| `REMOTION_AWS_REGION` | AWS | `us-east-1` |
| `REMOTION_AWS_ACCESS_KEY_ID` | AWS | Lambda access |
| `REMOTION_AWS_SECRET_ACCESS_KEY` | AWS | Lambda access |
| `REMOTION_LAMBDA_FUNCTION_NAME` | AWS | `remotion-render-4-0-424-mem3008mb-disk2048mb-900sec` |
| `REMOTION_S3_BUCKET_NAME` | AWS | `remotionlambda-useast1-64vfat1kzg` |
| `REMOTION_LAMBDA_SERVE_URL` | AWS | S3 site URL |
| `TWILIO_ACCOUNT_SID` | Twilio | `[REDACTED]` |
| `TWILIO_AUTH_TOKEN` | Twilio | API auth |
| `TWILIO_WHATSAPP_FROM` | Twilio | `[REDACTED]` |
| `FACEBOOK_APP_SECRET` | Facebook | OAuth |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn | OAuth |
| `TIKTOK_CLIENT_KEY` | TikTok | OAuth |
| `TIKTOK_CLIENT_SECRET` | TikTok | OAuth |
| `TWITTER_CLIENT_ID` | Twitter | OAuth |
| `TWITTER_CLIENT_SECRET` | Twitter | OAuth |
| `PAGERDUTY_ROUTING_KEY` | PagerDuty | Alerting (Events API v2) |
| `SLACK_ALERT_WEBHOOK_URL` | Slack | Critical alerts |
| `REVENUECAT_API_KEY` | RevenueCat | Server API (sk_*) |
| `REVENUECAT_SECRET_KEY` | RevenueCat | Server API |
| `REVENUECAT_WEBHOOK_AUTH_KEY` | RevenueCat | Webhook auth |
| `WORKER_ADMIN_KEY` | Internal | Admin API auth |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse | CI integration |
| `UPSTASH_REDIS_REST_URL` | Upstash | Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Redis auth |

---

## 6. CI/CD Pipeline

| Stage | Tool | Config File | Trigger |
|-------|------|------------|---------|
| **Type Check** | TypeScript 5.x | `tsconfig.json` | Every PR |
| **Lint** | ESLint | `.eslintrc.json` | Every PR |
| **Unit Tests** | Vitest (42 files, 545 tests) | `vitest.config.ts` | Every PR |
| **E2E Tests** | Playwright | `playwright.config.ts` | Every PR |
| **WCAG Audit** | axe-core (via Playwright) | `e2e/wcag-audit.spec.ts` | Every PR |
| **Lighthouse** | Lighthouse CI | `lighthouserc.js` | Every PR |
| **Security Scan** | OWASP ZAP | `security/zap-config.yaml` | Every PR |
| **Mutation Tests** | Stryker | `stryker.config.mjs` | Manual |
| **Load Tests** | k6 | `load-tests/*.k6.js` | Manual |
| **Deploy (Preview)** | Vercel | `vercel.json` | Every PR |
| **Deploy (Production)** | Vercel | `vercel.json` | Merge to `main` |
| **Worker Deploy** | Cloudflare Wrangler | `wrangler.toml` | Manual |

---

## 7. Cron Jobs (Vercel)

| Job | Schedule | Route | Purpose |
|-----|----------|-------|---------|
| Publish Posts | Every 15 min | `/api/cron/publish-scheduled` | Auto-publish to social |
| Sync Analytics | Every 6 hrs | `/api/cron/sync-analytics` | Fetch engagement metrics |
| Refresh Tokens | Every 4 hrs | `/api/cron/refresh-tokens` | OAuth token refresh |
| Daily Digest | Daily 8am | `/api/cron/daily-digest` | Email summary |
| Drip Sequences | Hourly | `/api/cron/drip-sequences` | Lead nurture emails |
| Usage Check | Daily 9am | `/api/cron/usage-check` | Billing usage alerts |
| Health Check | Hourly | `/api/cron/health-check` | System health |
| MLS Sync | Every 6 hrs | `/api/cron/mls-sync` | SimplyRETS data sync |
| Verify Domains | Every 6 hrs | `/api/cron/verify-domains` | DNS TXT verification |
| Data Cleanup | Weekly Sun 3am | `/api/cron/cleanup` | Retention enforcement |
| DB Monitor | Daily 6am | `/api/cron/db-monitor` | Slow query + pool alerts |

---

## 8. Mobile App Infrastructure

### Current Status

The mobile app scaffold exists at `apps/mobile/` using Expo SDK 54 + React Native 0.81.

| Component | Detail |
|-----------|--------|
| **Framework** | Expo SDK 54, React Native 0.81.5 |
| **Bundle ID (iOS)** | `com.snapr.app` |
| **Package Name (Android)** | `com.snapr.app` |
| **Build System** | EAS Build (Expo Application Services) |
| **EAS Project ID** | `snapr-mobile` |
| **Navigation** | React Navigation v7 (native-stack + bottom-tabs) |
| **State Management** | Zustand v5 |
| **Data Fetching** | TanStack React Query v5 |
| **Backend** | Supabase JS v2 (shared with web) |
| **Auth Storage** | expo-secure-store (encrypted keychain/keystore) |

### Mobile-Specific Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo-camera | ~17.0.0 | AI Photography Director |
| expo-image-picker | ~17.0.0 | Photo library access |
| expo-notifications | ~0.32.16 | Push notifications |
| expo-secure-store | ~14.0.0 | Encrypted credential storage |
| expo-speech | ~13.0.0 | AI voice coaching |
| expo-haptics | ~14.0.0 | Haptic feedback |
| expo-clipboard | ~8.0.8 | Share/copy functionality |
| react-native-reanimated | ~3.18.0 | Fluid animations |
| react-native-gesture-handler | ~2.25.0 | Touch gestures |

### Required Accounts for Mobile Launch

| Account | Cost | Status | Purpose |
|---------|------|--------|---------|
| **Apple Developer Program** | $99/yr | Not yet enrolled | iOS App Store publishing, TestFlight beta |
| **Google Play Console** | $25 one-time | Not yet enrolled | Android publishing, internal testing tracks |
| **Expo / EAS Build** | $0–99/mo | Free tier active | OTA updates, cloud builds, submission |
| **RevenueCat** | Free→1% MTR | Integrated (server-side) | Cross-platform IAP (Apple + Google + Stripe) |
| **Firebase** (Crashlytics) | $0 | Not yet set up | Mobile crash reporting |
| **Apple App Store Connect** | Included in dev program | — | App metadata, screenshots, review |
| **Google Play Console** | Included in $25 | — | App metadata, staged rollouts |

### Mobile Build Profiles (eas.json)

| Profile | Distribution | Use Case |
|---------|-------------|----------|
| `development` | Internal (simulator) | Local dev + testing |
| `preview` | Internal (device) | Beta testing (TestFlight / internal track) |
| `production` | App Store / Play Store | Public release |

---

## 9. Future Subscriptions Needed

### Phase 1: Scale (next 3 months)

| Service | Why | Est. Cost |
|---------|-----|----------|
| **Vercel Pro (team)** | Multiple developers, higher limits | $20/seat/mo |
| **Supabase Pro (scaling)** | Higher connection pool, more storage | $25→$75/mo |
| **Cloudinary (Advanced)** | Higher transform limits at scale | $89→$224/mo |
| **Sentry (Business)** | Higher event volume, better replay | $26→$80/mo |
| **Upstash (Pro)** | Higher rate limit throughput | $10→$50/mo |
| **Claude (Enterprise)** | SSO, admin controls, team management | $200→$100/seat/mo |
| **Cursor (Business)** | Team features, admin controls | $20→$40/seat/mo |

### Phase 2: Mobile App (3-6 months)

| Service | Why | Est. Cost |
|---------|-----|----------|
| **Apple Developer Program** | iOS App Store publishing | $99/yr |
| **Google Play Console** | Android publishing | $25 one-time |
| **RevenueCat (paid tier)** | >$2,500 MTR, cross-platform billing | 1% of MTR |
| **Firebase (Crashlytics)** | Mobile crash reporting | Free tier |
| **Expo / EAS Build** | React Native OTA updates + builds | $0→$99/mo |
| **Apple Push Notification Service** | iOS push notifications | $0 (included in dev program) |
| **Firebase Cloud Messaging** | Android push notifications | $0 (free tier) |

### Phase 3: Enterprise (6-12 months)

| Service | Why | Est. Cost |
|---------|-----|----------|
| **Datadog or New Relic** | APM, distributed tracing at scale | $15/host/mo |
| **LaunchDarkly** | Feature flags for enterprise rollouts | $10→$20/seat/mo |
| **Auth0 or WorkOS** | SSO/SAML for enterprise customers | $0→$130/mo |
| **AWS CloudFront** | Global CDN for video delivery at scale | ~$50–200/mo |
| **SendGrid or Postmark** | Higher-volume transactional email | $20→$50/mo |
| **Intercom or Crisp** | In-app support chat for enterprise | $39→$89/mo |
| **SOC 2 Compliance** | Enterprise security certification | ~$15K one-time |

### Phase 4: Growth (12+ months)

| Service | Why | Est. Cost |
|---------|-----|----------|
| **PostHog or Amplitude** | Product analytics, funnels, cohorts | $0→$450/mo |
| **Segment** | Customer data platform | $0→$120/mo |
| **HubSpot or Salesforce** | CRM for enterprise sales pipeline | $0→$50/seat/mo |
| **Zapier or Make** | User-facing integrations marketplace | $0→$20/mo |
| **StatusPage (Atlassian)** | Public status page for enterprise SLA | $29/mo |
| **PagerDuty (paid)** | Higher alert volume, on-call rotation | $0→$21/user/mo |

---

## 10. Architecture Diagram (Text)

```
                    [snap-r.com]
                         |
                   [Cloudflare DNS]
                         |
                    [Vercel Edge]
                    /         \
              [Next.js SSR]  [API Routes]
                |               |
         [Supabase Auth]  [Supabase DB]
                |               |
         [Dashboard UI]  [11 Cron Jobs]
                |               |
    [Cloudflare Worker] <-- [Processing Queue]
         /      |      \
   [Replicate] [OpenAI] [Runware]
        |         |         |
   [Cloudflare R2] --> [Cloudinary CDN]
                          |
              [Social Publishing]
             /    |     |      \
         [FB] [IG] [LinkedIn] [TikTok]
                          |
                 [Analytics Sync]
                          |
                 [RevenueCat] <-- [Stripe]
                /           \
         [Web Billing]   [Mobile IAP]
              |          /          \
         [Stripe]  [App Store] [Play Store]
                          |
                 [User Entitlements]
```

### Mobile Architecture (Planned)

```
    [Expo / React Native App]
            |
    [expo-secure-store]  -- Auth tokens
            |
    [Supabase JS SDK]   -- Same backend as web
            |
    [RevenueCat SDK]     -- IAP + entitlements
            |
    [EAS Build]          -- Cloud builds
     /         \
  [iOS]      [Android]
     |            |
  [TestFlight] [Internal Track]
     |            |
  [App Store]  [Play Store]
```

---

## 11. Service Count Summary

| Category | Count | Services |
|----------|-------|----------|
| **Infrastructure** | 5 | Vercel, Cloudflare, Supabase, AWS, Upstash |
| **AI/ML** | 5 | OpenAI, ElevenLabs, Replicate, Runware, FAL |
| **Media** | 3 | Cloudinary, Cloudflare R2, Remotion |
| **Social** | 5 | Facebook, Instagram, LinkedIn, TikTok, Twitter |
| **Payments** | 2 | Stripe, RevenueCat |
| **Communication** | 2 | Resend, Twilio |
| **Monitoring** | 5 | Sentry, PagerDuty, Slack Webhooks, Hotjar, Google Analytics |
| **Developer Tools** | 4 | Claude (Anthropic), Cursor IDE, GitHub, GitHub Actions |
| **Mobile (planned)** | 4 | Expo/EAS, Apple Developer, Google Play, Firebase |
| **Scheduling** | 1 | Calendly |
| **Auth** | 1 | Google (via Supabase) |
| **Testing** | 5 | Vitest, Playwright, Stryker, Lighthouse CI, OWASP ZAP |
| **Total Active** | **38** | |
| **Total (incl. planned)** | **42** | |

---

## 12. Security & Compliance

| Control | Implementation |
|---------|---------------|
| **RLS (Row-Level Security)** | All Supabase tables enforce per-user access |
| **API Authentication** | Bearer token (SHA-256 hash, timing-safe comparison) |
| **Webhook Signatures** | HMAC-SHA256 (`X-Webhook-Signature` header) |
| **OAuth CSRF** | State parameter verified against `user.id` |
| **Twitter PKCE** | S256 code challenge (`crypto.createHash('sha256')`) |
| **Input Validation** | Zod schemas on all API routes |
| **Security Headers** | CSP, Permissions-Policy, X-Content-Type-Options, X-Frame-Options |
| **Rate Limiting** | Per-IP + per-user via Upstash Redis |
| **Network Timeouts** | All external fetches use `AbortSignal.timeout(15000)` |
| **Secret Management** | Vercel env vars (encrypted), Cloudflare secrets |
| **CI Security Scan** | OWASP ZAP on every PR |
| **Data Retention** | Weekly cron cleanup (30-day webhooks, 90-day API usage, 60-day jobs) |
| **WCAG 2.1 AA** | axe-core audit on every PR |

---

*Sources: Vercel project settings, Supabase dashboard, Cloudflare dashboard, Stripe dashboard, RevenueCat pricing, OpenAI API pricing, internal codebase analysis*
