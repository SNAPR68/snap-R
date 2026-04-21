## Database

Supabase PostgreSQL with RLS. Key tables:

### Core
- `profiles` - User profiles, subscription_tier, onboarding status, phone, notification_preferences
- `listings` - Property listings with `preparation_status`, `marketing_status`, `hero_photo_id`, `preparation_metadata`
- `photos` - Listing photos with processing status, raw_url, processed_url, variant, confidence
- `jobs` - Processing job tracking (queued/processing/completed/failed)

### Marketing & Content (Phase 2)
- `marketing_jobs` - Marketing pipeline tracking with per-step status columns:
  - `description_status/result`, `captions_status/result`, `mls_status/result`
  - `property_site_status/result`, `scheduled_posts_status/result`
  - `total_cost_cents`, `cost_breakdown` (JSON)
- `scheduled_posts` - Posts queued for auto-publishing (content, platform, scheduled_for, status)
- `published_posts` - Published posts with analytics columns (likes, comments, shares, impressions, reach, engagement_rate, last_synced_at)
- `social_connections` - OAuth connections to Facebook/Instagram/LinkedIn/TikTok (access_token, pages, instagram_account, linkedin_urn, platform_user_id for TikTok open_id)
- `property_sites` - Public property site configurations (slug, theme, brand)

### Video
- `video_render_jobs` - Lambda render tracking (render_id, bucket_name, status, input_props, output_url)

### v1.5 Features
- `open_house_events` - Open house events with capacity, check-in slug, status (upcoming/active/completed/cancelled)
- `open_house_attendees` - Guest check-in records with interest_rating and comments
- `photographer_packages` - Photographer service packages (name, price, description)
- `booking_requests` - Photographer booking pipeline (pending→confirmed→shot→editing→delivered)
- `photographer_availability` - Photographer schedule availability
- `outgoing_webhooks` - User-configured webhook endpoints (url, events[], secret, is_active)
- `webhook_deliveries` - Delivery log (event, payload, status_code, success)

### Enterprise Platform
- `api_keys` - API key storage (key_prefix, key_hash SHA-256, scopes, rate_limit_per_minute, is_active)
- `api_usage` - Per-call API usage tracking (endpoint, method, status_code, response_time_ms)
- `custom_domains` - Custom domain mapping (domain, target_type, verification_status, verification_token, brand_config)

### Other
- `content_library`, `post_drafts`, `auto_post_rules` - Content studio
- `client_approvals` - Client approval workflows
- `preparation_logs` - Preparation history
- `lead_activities` - Lead CRM activity timeline (call/email/text/showing/note)
- `drip_sequences`, `drip_enrollments` - Lead drip automation

## Supabase Clients

```typescript
// Browser client (public, client components)
import { createClient } from '@/lib/supabase/client'

// Server client (with auth, server components + API routes)
import { createClient } from '@/lib/supabase/server'

// Admin client (service role, bypasses RLS — for crons and workers)
import { adminSupabase } from '@/lib/supabase/admin'
```

## Billing / Plan Limits

Defined in `lib/content/limits.ts`:

| Tier | Content Posts | AI Captions | Can Publish | Content Studio | Marketing Auto | API | Custom Domain | Embed |
|------|-------------|-------------|-------------|----------------|----------------|-----|---------------|-------|
| free | 0 | 0 | No | No | Skipped | No | No | No |
| starter | 5 | 10 | No | Yes | Skipped | No | No | No |
| pro | 30 | 50 | Yes | Yes | Full | No | No | No |
| agency | Unlimited | Unlimited | Yes | Yes | Full | No | No | Yes |
| enterprise | Unlimited | Unlimited | Yes | Yes | Full | Yes | Yes | Yes |

```typescript
import { getPlanLimits } from '@/lib/content/limits'
const limits = getPlanLimits(tier) // returns { canPublish, canAccessContentStudio, ... }
```

**Billing gates enforced at:**
1. `marketing-handler.ts` — free-tier users get `status: 'skipped'` immediately, zero AI cost incurred
2. `publish-scheduled/route.ts` — `getPlanLimits(tier).canPublish` check before each post
3. `lib/api-v1/middleware.ts` — `canAccessApi` check blocks non-enterprise users from v1 API
4. `app/api/domains/route.ts` — `canCustomDomain` check blocks non-enterprise users

