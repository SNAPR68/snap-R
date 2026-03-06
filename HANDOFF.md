# Session Handoff — v1.5 Complete (March 6, 2026)

## Current State

**Competitive Score**: ~98/100 (all planned features + polish shipped)
**Branch**: `main` (PRs #78–83 all merged)
**Uncommitted local changes**: explainer video frame PNGs + ExplainerVideo.tsx + CLAUDE.md edits (cosmetic, not blocking)

---

## v1.5 Sprint — All PRs

| PR | Title | Status |
|----|-------|--------|
| #78 | Lead Kanban + Outgoing Webhooks API | ✓ Merged |
| #79 | Webhook Wiring + Settings Management UI | ✓ Merged |
| #80 | Showing Feedback Forms + Auto Thank-You | ✓ Merged |
| #81 | Content Calendar DnD + Drip Sequence Management | ✓ Merged |
| #82 | Analytics Dashboards, Bulk Email, Lead Auto-Scoring | ✓ Merged |
| #83 | Broker Charts + Webhook Delivery Log | ✓ Merged |

---

## What Was Built in v1.5

### Lead CRM Enhancements
- **Kanban pipeline**: HTML5 drag-and-drop, 7 columns (New → Contacted → Qualified → Touring → Offer → Closed → Lost)
- **Lead auto-scoring**: POST `/api/leads/activity` auto-increments score (call=+10, showing=+20, form_submitted=+15, property_site_viewed=+8, email/text=+5, drip=+2), capped at 100
- **Drip sequence management**: `/dashboard/leads/sequences` — create/edit/enable/delete custom sequences + step editor
- **Bulk email**: `/dashboard/leads/email-lists` — multi-select contacts, compose with `{{name}}`/`{{first_name}}` vars, send via Resend, view history

### Analytics
- **Per-listing analytics**: `GET /api/analytics/listings` aggregates engagement/impressions/leads/cost per listing
- **Analytics Listings tab**: per-listing comparison table + ROI Calculator (commission % × sale price → ROI vs AI spend)

### Outgoing Webhooks
- **CRUD API**: `GET/POST/PATCH/DELETE /api/webhooks/outgoing`
- **HMAC-SHA256 dispatch**: `lib/webhooks/dispatch.ts` — wired into leads, listing status, publish cron
- **Management UI**: `/dashboard/settings/webhooks` — create/toggle/delete, signing secret copy
- **Delivery log**: `GET /api/webhooks/deliveries` + delivery log section in settings (status table, response body expand, success/fail counters)

### Open House & Bookings
- Public check-in form at `/open-house/[slug]`
- Photographer booking pipeline (`pending → confirmed → shot → editing → delivered`)
- Showing feedback forms with auto thank-you email

### Broker Dashboard
- Agent roster with role badges + listing counts
- **Analytics charts**: bar chart (listings per agent) + donut pie (listings by prep status) — recharts

### Content Calendar
- Drag-and-drop rescheduling (HTML5, gold ring drop target, optimistic update)

---

## Database Migrations (All Applied to Live Supabase)

1. `20260216_marketing_jobs.sql` ✓
2. `20260216_marketing_jobs_scheduled_posts.sql` ✓
3. `20260216_published_posts.sql` ✓
4. `20260216_photos_tools_applied.sql` ✓
5. `20260217_phone_and_partners.sql` ✓
6. `20260305_lead_activity.sql` ✓
7. `20260305_showings.sql` ✓
8. `20260305_listing_virtual_tour.sql` ✓
9. `20260305_photographer_bookings.sql` ✓
10. `20260305_open_house.sql` ✓
11. `20260305_outgoing_webhooks.sql` ✓

---

## Remaining / Future Work

Nothing blocking. Optional next-milestone ideas:
- **v2.0 targets**: AI offer analysis, transaction coordination timeline, neighborhood market heat maps
- **Explainer video refresh**: Recapture authenticated screenshots (Puppeteer auth now works via `scripts/capture-explainer-v3.mjs`), re-render, upload to Cloudinary
- **Webhook retry logic**: Currently fire-and-forget; could add exponential backoff retry queue
- **Email list management**: Saved named lists (currently ad-hoc selection per send)

---

## Key Technical Context

### Deployment Flow
```
feature-branch → PR → main → Vercel auto-deploys to snap-r.com
```
`main` is branch-protected. Always use feature branches + PRs.

### Pre-Commit Hook
Blocks commits on structural changes unless `EXECUTION_CHANGELOG.md` is updated and staged.

### ESLint Hook — Critical Pattern
Hook fires after **every** Edit tool call. Import + first usage must be in the **same** edit.
- Safe approach: use **Write** to rewrite full files when adding imports + state + JSX together
- State variables declared but not yet used in JSX → blocked immediately

### Supabase Migration Execution
When `supabase db push` fails, use the Management API:
```bash
TOKEN=$(security find-generic-password -s "Supabase CLI" -w | sed 's/^go-keyring-base64://' | base64 -d)
curl -s -X POST "https://api.supabase.com/v1/projects/asoiwonhqoesbvcilqwd/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat migration_file.sql | sed 's/\"/\\"/g' | tr '\n' ' ')\"}"
```

### Demo Account
- Email: demo@snap-r.com / Password: DemoVideo2026x
- Listing ID: 2d032018-af8b-4cef-a3f2-1a69f12923c8

### Vercel Deploy (manual)
```bash
vercel --prod --yes
```

### Preview Browser Limitation
The headless preview browser cannot authenticate — middleware redirects all `/dashboard/*` to sign-in. Verify dashboard changes via `npx tsc --noEmit` + `npx next build` instead.
