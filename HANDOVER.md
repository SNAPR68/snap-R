
# SnapR Project Handover Document

Generated: December 2, 2024



## Project Overview

SnapR is a real estate photo enhancement application with AI-powered tools for sky replacement, virtual twilight, lawn repair, declutter, virtual staging, HDR enhancement, and auto-enhance.



**Live URL:** https://snap-r.com

**Tech Stack:** Next.js 14, Supabase (auth, database, storage), Tailwind CSS

**AI Providers:** Replicate, Runware, OpenAI Vision



---



## Current Issues to Fix



### 1. Settings Page Syntax Error

**File:** `app/(authenticated)/settings/page.tsx`

**Error:** "Unexpected token `div`. Expected jsx identifier" at line 136

**Action:** The file was being rewritten but may have gotten corrupted. Need to recreate it properly.



### 2. Studio Redirect

**Status:** Fixed

**Details:** Dashboard now redirects to `/dashboard/studio?id=xxx` for listings



---



## Database Schema



### Tables



**projects** (NEW)

```sql

- id: UUID (PK)

- user_id: UUID (FK to auth.users)

- title: TEXT

- created_at: TIMESTAMP

- updated_at: TIMESTAMP

```



**listings**

```sql

- id: UUID (PK)

- user_id: UUID (FK to auth.users)

- project_id: UUID (FK to projects) -- NEW COLUMN

- title: TEXT

- address: TEXT

- description: TEXT

- created_at: TIMESTAMP

```



**photos**

```sql

- id: UUID (PK)

- listing_id: UUID (FK to listings)

- raw_url: TEXT

- processed_url: TEXT

- status: TEXT (pending/processing/completed/failed)

- variant: TEXT

- created_at: TIMESTAMP

```



**profiles**

```sql

- id: UUID (PK, FK to auth.users)

- credits: INTEGER

- name: TEXT

- plan: TEXT

```



---



## Project Hierarchy (NEW)

```

Projects → Listings → Photos

├── Project (e.g., "Aqua Residences")

│   ├── Listing (e.g., "Water Tower Unit")

│   │   └── Photos (10-50 images)

│   ├── Listing (e.g., "Ocean View Suite")

│   │   └── Photos

│   └── + New Listing

└── + New Project

```



---



## Key Files



### Dashboard

- `components/dashboard-client.tsx` - Main dashboard with project/listing hierarchy

- `app/(authenticated)/dashboard/page.tsx` - Dashboard page wrapper



### Studio

- `components/studio-client.tsx` - Photo enhancement studio

- `app/dashboard/studio/page.tsx` - Studio page (uses `?id=` query param)



### Authentication

- `lib/supabase/server.ts` - Supabase server client + `protect()` function

- `lib/auth/protect.ts` - Re-exports protect function

- `app/auth/login/page.tsx` - Login page

- `app/auth/signup/page.tsx` - Signup page

- `app/auth/callback/route.ts` - OAuth callback



### AI Enhancement

- `lib/ai/router.ts` - AI tool router with credit costs

- `app/api/enhance/route.ts` - Enhancement API endpoint



### Settings & Billing

- `app/(authenticated)/settings/page.tsx` - Settings page (HAS ERROR)

- `app/(authenticated)/billing/page.tsx` - Billing page



### Academy

- `app/academy/page.tsx` - SnapR Academy main page

- `app/academy/getting-started/page.tsx` - Getting started category



---



## Credit System



**Credit costs per enhancement:**

| Tool | Credits |

|------|---------|

| Sky Replacement | 1 |

| HDR Enhancement | 1 |

| Lawn Repair | 1 |

| Auto Enhance | 1 |

| Virtual Twilight | 2 |

| Declutter | 2 |

| Virtual Staging | 3 |



**Credit deduction:** Happens in `app/api/enhance/route.ts` after successful enhancement



---



## Design System



**Colors:**

- Gold/Accent: `#D4A017`

- Gold Gradient: `from-[#D4A017] to-[#B8860B]`

- Background: `#0F0F0F`

- Surface: `#1A1A1A`

- Border: `border-white/10`

- Text Muted: `text-white/60`



**Logo:** `/public/snapr-logo.png` (green/gold camera aperture with house icon)



---



## Recent Changes Made



### Completed

1. ✅ Email addresses updated to `support@snap-r.com` and `sales@snap-r.com`

2. ✅ Mobile badge updated to Apple-like style

3. ✅ Logo added to all pages (replaces "S" placeholder)

4. ✅ Dashboard header with logo and sign-out on top right

5. ✅ SnapR Academy page created with categories

6. ✅ GraduationCap icon added to Academy link

7. ✅ Project/Listing hierarchy implemented in dashboard

8. ✅ New Project and New Listing modals working

9. ✅ Database: `projects` table created, `project_id` added to listings

10. ✅ Navbar circular import fixed

11. ✅ `protect()` function added to `lib/supabase/server.ts`

12. ✅ Studio redirect fixed to use `/dashboard/studio?id=`



### Pending

1. ❌ Settings page has syntax error - needs fix

2. ❌ Google OAuth shows Supabase URL instead of snap-r.com (Google Cloud Console config)

3. ❌ Credit deduction testing needed

4. ❌ Academy article pages need content



---



## File Locations

```

snapr-gpt/

├── app/

│   ├── (authenticated)/

│   │   ├── dashboard/page.tsx

│   │   ├── settings/page.tsx    <-- HAS ERROR

│   │   ├── billing/page.tsx

│   │   ├── listings/[id]/page.tsx

│   │   └── jobs/[id]/page.tsx

│   ├── academy/

│   │   ├── page.tsx

│   │   └── getting-started/page.tsx

│   ├── auth/

│   │   ├── login/page.tsx

│   │   ├── signup/page.tsx

│   │   └── callback/route.ts

│   ├── api/

│   │   ├── enhance/route.ts

│   │   ├── analytics/route.ts

│   │   └── jobs/[id]/route.ts

│   ├── dashboard/

│   │   └── studio/page.tsx

│   └── page.tsx (landing page)

├── components/

│   ├── dashboard-client.tsx

│   ├── studio-client.tsx

│   ├── dashboard-analytics.tsx

│   ├── navbar.tsx

│   ├── mobile-badge.tsx

│   ├── testimonials.tsx

│   ├── share-view.tsx

│   └── human-edit-request.tsx

├── lib/

│   ├── supabase/

│   │   ├── server.ts (has protect function)

│   │   └── client.ts

│   ├── auth/

│   │   └── protect.ts

│   └── ai/

│       ├── router.ts

│       └── providers/

└── public/

    └── snapr-logo.png

```



---



## Environment Variables

```

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

REPLICATE_API_TOKEN=

RUNWARE_API_KEY=

OPENAI_API_KEY=

```



---



## Commands



**Start dev server:**

```bash

cd /Users/baba/Desktop/snapr-gpt && npm run dev

```



**Clear cache and restart:**

```bash

rm -rf .next && npm run dev

```



---



## Immediate Fix Needed



The settings page at `app/(authenticated)/settings/page.tsx` has a syntax error. The file needs to be completely rewritten with a clean version. The intended features are:



1. **Profile Tab:** Avatar, name, email

2. **Billing Tab:** Current plan, credits, upgrade link

3. **Notifications Tab:** Toggle switches for email preferences

4. **Security Tab:** Password change, 2FA (coming soon), delete account



---



## User Preferences



- User prefers surgical, targeted fixes over wholesale code replacements

- Every command must include warning: "⚠️ IMPORTANT: Only run this exact command. Do NOT modify any other files or code."

- User is not a coder - building a real estate photo app

- Domain: snap-r.com

- Email: support@snap-r.com, sales@snap-r.com



---



## Pricing Strategy (Decided)



| Plan | Price | Credits/Month |

|------|-------|---------------|

| Free Trial | $0 | 10 credits (7 days) |

| Starter | $29/mo | 50 credits |

| Pro | $79/mo | 200 credits |

| Brokerage | $199/mo | 500 credits |



---



## Next Steps



1. Fix settings page syntax error

2. Test project → listing → photo workflow end-to-end

3. Test credit deduction on enhancement

4. Deploy to Vercel and test on snap-r.com

5. Add content to Academy article pages

6. Fix Google OAuth display name in Google Cloud Console

