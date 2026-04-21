## Environment Validation

`lib/env.ts` validates required env vars on startup (called from `instrumentation.ts`). Fast-fails in production if critical vars are missing. Warns for recommended vars.

## Applied Migrations

These migrations have been applied to the live Supabase database:

1. `20260216_marketing_jobs.sql` — marketing_jobs table with per-step status, JSONB artifacts, cost tracking, RLS
2. `20260216_marketing_jobs_scheduled_posts.sql` — scheduled_posts_status/result columns on marketing_jobs
3. `20260216_published_posts.sql` — published_posts table with analytics columns, RLS, service role bypass
4. `20260216_photos_tools_applied.sql` — tools_applied text[] column on photos table
5. `20260217_phone_and_partners.sql` — profiles.phone/referred_by/notification_preferences columns, partner_applications table with referral_code, RLS
6. `20260305_lead_activity.sql` — lead_activities table + score/notes/last_activity_at on property_leads
7. `20260305_showings.sql` — showings table with RLS
8. `20260305_listing_virtual_tour.sql` — virtual_tour_url column on listings
9. `20260305_photographer_bookings.sql` — photographer_packages, booking_requests, photographer_availability
10. `20260305_open_house.sql` — open_house_events + open_house_attendees
11. `20260305_outgoing_webhooks.sql` — outgoing_webhooks + webhook_deliveries ✓ (applied Session 4)
12. `20260316_api_keys.sql` — api_keys + api_usage tables with RLS, SHA-256 key hashing ✓
13. `20260316_custom_domains.sql` — custom_domains table with DNS TXT verification, RLS ✓

## Environment Variables

**Public (NEXT_PUBLIC_):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Private (Vercel):**
- `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, `RUNWARE_API_KEY`
- `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `CLOUDFLARE_API_TOKEN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `CRON_SECRET` (for Vercel Cron auth)
- `REMOTION_AWS_REGION`, `REMOTION_AWS_ACCESS_KEY_ID`, `REMOTION_AWS_SECRET_ACCESS_KEY`
- `REMOTION_LAMBDA_FUNCTION_NAME`, `REMOTION_LAMBDA_SERVE_URL`, `REMOTION_S3_BUCKET_NAME`
- `ELEVENLABS_API_KEY` (voiceover TTS)
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` (TikTok OAuth)
- `STRIPE_ENTERPRISE_PRICE_ID`, `STRIPE_ENTERPRISE_ANNUAL_PRICE_ID` (enterprise checkout)

**Worker (Cloudflare):**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `OPENAI_API_KEY`, `R2_BUCKET` (binding)
- `PROCESS_QUEUE`, `MARKETING_QUEUE` (Queue bindings)

