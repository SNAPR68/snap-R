# SnapR Project Reference
_Generated: Dec 1, 2025_

This document captures three reference views of the repository:
- Full database structure (per `database/schema.sql`)
- Complete project file inventory (excluding `node_modules`, `.git`, `.next`)
- Installed packages (dependencies and devDependencies from `package.json`)

---

## 1. Database Structure (`database/schema.sql`)

```sql
-- USERS
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  avatar_url text,
  credits integer default 20,
  has_onboarded boolean default false,
  created_at timestamp with time zone default now()
);

-- LISTINGS
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  address text,
  city text,
  state text,
  postal_code text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- JOBS (must be created before photos due to foreign key reference)
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  listing_id uuid,
  variant text,
  metadata jsonb,
  error text,
  completed_at timestamp with time zone,
  status text default 'queued',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- PHOTOS
create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  job_id uuid references jobs(id),
  raw_url text,
  processed_url text,
  processed_at timestamp with time zone,
  variant text,
  error text,
  status text default 'pending',
  room_type text,
  quality_score numeric,
  created_at timestamp with time zone default now()
);

-- FLOORPLANS
create table if not exists floorplans (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  source_url text,
  processed_url text,
  created_at timestamp with time zone default now()
);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  amount numeric,
  credits integer,
  provider text,
  created_at timestamp with time zone default now()
);

-- INDEXES for better query performance
create index if not exists idx_jobs_user_id on jobs(user_id);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_created_at on jobs(created_at);
create index if not exists idx_photos_job_id on photos(job_id);
create index if not exists idx_photos_listing_id on photos(listing_id);
create index if not exists idx_photos_status on photos(status);
create index if not exists idx_photos_listing_status on photos(listing_id, status);
create index if not exists idx_listings_user_id on listings(user_id);
create index if not exists idx_listings_created_at on listings(created_at);
create index if not exists idx_payments_user_id on payments(user_id);
```

---

## 2. Project File Inventory
_(Generated via `find` excluding `.git`, `node_modules`, `.next`.)_

```text
.
./middleware.ts
./database
./database/schema.sql
./.env.production
./.DS_Store
./.env.local
./app
./app/settings
./app/settings/page.tsx
./app/contact
./app/contact/page.tsx
./app/favicon.ico
./app/privacy
./app/privacy/page.tsx
./app/auth
./app/auth/signup
./app/auth/signup/page.tsx
./app/auth/callback
./app/auth/callback/route.ts
./app/auth/callback/page.tsx
./app/auth/login
./app/auth/login/page.tsx
./app/faq
./app/faq/page.tsx
./app/providers
./app/providers/session-provider.tsx
./app/terms
./app/terms/page.tsx
./app/(authenticated)
./app/(authenticated)/settings
./app/(authenticated)/settings/page.tsx
./app/(authenticated)/listings
./app/(authenticated)/listings/[id]
./app/(authenticated)/listings/[id]/page.tsx
./app/(authenticated)/listings/page.tsx
./app/(authenticated)/layout.tsx
./app/(authenticated)/jobs
./app/(authenticated)/jobs/[id]
./app/(authenticated)/jobs/[id]/page.tsx
./app/(authenticated)/jobs/page.tsx
./app/(authenticated)/billing
./app/(authenticated)/billing/billing-client.tsx
./app/(authenticated)/billing/page.tsx
./app/(authenticated)/upload
./app/(authenticated)/upload/page.tsx
./app/dashboard
./app/dashboard/studio
./app/dashboard/studio/page.tsx
./app/dashboard/page.tsx
./app/sitemap.ts
./app/layout.tsx
./app/api
./app/api/listings
./app/api/listings/route.ts
./app/api/analyze
./app/api/analyze/route.ts
./app/api/enhance
./app/api/enhance/route.ts
./app/api/jobs
./app/api/jobs/[id]
./app/api/jobs/[id]/route.ts
./app/api/upload
./app/api/upload/route.ts
./app/api/share
./app/api/share/route.ts
./app/fonts
./app/fonts/GeistMonoVF.woff
./app/fonts/GeistVF.woff
./app/page.tsx
./app/pricing
./app/globals.css
./app/onboarding
./app/onboarding/step3
./app/onboarding/step3/page.tsx
./app/onboarding/step2.tsx
./app/onboarding/step3.tsx
./app/onboarding/step2
./app/onboarding/step2/page.tsx
./app/onboarding/step1.tsx
./app/onboarding/layout.tsx
./app/onboarding/page.tsx
./app/share
./app/share/[token]
./app/share/[token]/page.tsx
./app/providers.tsx
./CHANGELOG.md
./postcss.config.mjs
./next.config.mjs
./.npmrc
./env.template
./next-env.d.ts
./inject-env-to-wrangler.js
./supabase
./supabase/migrations
./supabase/migrations/202511201830_extend_listings_and_photos.sql
./supabase/migrations/202511202010_photos_listing_status_index.sql
./supabase/migrations/202511201945_extend_jobs.sql
./supabase/migrations/20251119155714_add_has_onboarded_to_users.sql
./supabase/migrations/202511202025_add_jobs_metadata.sql
./supabase/.temp
./supabase/.temp/postgres-version
./supabase/.temp/project-ref
./supabase/.temp/rest-version
./supabase/.temp/storage-version
./supabase/.temp/gotrue-version
./supabase/.temp/pooler-url
./supabase/.temp/cli-latest
./supabase/.gitignore
./supabase/config.toml
./README.md
./tailwind.config.ts
./components
./components/ui
./components/ui/Navbar.tsx
./components/ui/tabs.tsx
./components/ui/card.tsx
./components/ui/progress.tsx
./components/ui/auth-buttons.tsx
./components/ui/label.tsx
./components/ui/file-count.tsx
./components/ui/tooltip.tsx
./components/ui/before-after-slider.tsx
./components/ui/avatar.tsx
./components/ui/dialog.tsx
./components/ui/dashboard-action-card.tsx
./components/ui/badge.tsx
./components/ui/index.ts
./components/ui/separator.tsx
./components/ui/job-card-skeleton.tsx
./components/ui/button.tsx
./components/ui/photo-grid-skeleton.tsx
./components/ui/dropdown-menu.tsx
./components/ui/textarea.tsx
./components/ui/input.tsx
./components/ui/job-timestamp.tsx
./components/ui/listing-date.tsx
./components/ui/skeleton.tsx
./components/navbar.tsx
./components/.DS_Store
./components/layout
./components/layout/authenticated-layout.tsx
./components/layout/landing-page.tsx
./components/share-view.tsx
./components/listing-card.tsx
./components/modals
./components/studio-client.tsx
./components/dashboard-client.tsx
./components/mobile-badge.tsx
./public
./public/favicon.ico
./public/apple-touch-icon.png
./public/og-image.jpg
./public/manifest.json
./public/google-icon.svg
./public/robots.txt
./LAUNCH_CHECKLIST.md
./.gitignore
./package-lock.json
./package.json
./.nvmrc
./AUDIT_REPORT.md
./lib
./lib/cloudinary.ts
./lib/auth
./lib/auth/protect.ts
./lib/utils.ts
./lib/api.ts
./lib/supabase
./lib/supabase/client.ts
./lib/supabase/server.ts
./lib/types.ts
./lib/cloudflare.ts
./lib/ai
./lib/ai/tools
./lib/ai/tools/index.ts
./lib/ai/providers
./lib/ai/providers/autoenhance.ts
./lib/ai/providers/openai-vision.ts
./lib/ai/providers/runware.ts
./lib/ai/providers/replicate.ts
./lib/ai/utils
./lib/ai/utils/retry.ts
./lib/ai/utils/config.ts
./lib/db
./lib/db/shares-migration.sql
./lib/supabase.ts
./lib/queues.ts
./package-lock.json.bak
./functions
./functions/openai.ts
./functions/runware.ts
./functions/replicate.ts
./functions/api
./functions/api/runware
./functions/api/runware/index.ts
./functions/api/job-status
./functions/api/job-status/index.ts
./functions/api/replicate
./functions/api/replicate/index.ts
./functions/api/upload
./functions/api/upload/index.ts
./functions/api/openai
./functions/api/openai/index.ts
./functions/_middleware.js
./functions/upload.ts
./functions/job-status.ts
./components.json
./tsconfig.json
./workers
./workers/image-jobs-consumer.ts
./BRANDING_ASSETS_GUIDE.md
./wrangler.toml
./.vscode
./.vscode/settings.json
./.cfignore
./package.json.bak
./.eslintrc.json
./src
./src/workers
./src/workers/imageEnhanceWorker.js
```

---

## 3. Installed Packages (`package.json`)

### Dependencies
```text
@opentelemetry/api ^1.9.0
@radix-ui/react-avatar ^1.1.11
@radix-ui/react-dialog ^1.1.15
@radix-ui/react-dropdown-menu ^2.1.16
@radix-ui/react-label ^2.1.8
@radix-ui/react-progress ^1.1.8
@radix-ui/react-separator ^1.1.8
@radix-ui/react-slot ^1.2.4
@radix-ui/react-tabs ^1.1.13
@radix-ui/react-tooltip ^1.2.8
@supabase/auth-helpers-nextjs ^0.10.0
@supabase/ssr ^0.7.0
@supabase/supabase-js ^2.81.1
class-variance-authority ^0.7.1
cloudinary ^2.8.0
clsx ^2.1.1
critters ^0.0.23
framer-motion ^12.23.24
lucide-react ^0.553.0
next ^14.2.15
openai ^6.9.1
react ^18.3.1
react-dom ^18.3.1
react-dropzone ^14.3.8
replicate ^1.4.0
sharp ^0.34.5
tailwind-merge ^3.4.0
tailwindcss-animate ^1.0.7
```

### DevDependencies
```text
@opennextjs/cloudflare ^1.13.0
@types/node ^20
@types/react ^18
@types/react-dom ^18
eslint ^8
eslint-config-next 14.2.33
node ^20.19.5
open-next ^3.1.3
postcss ^8
supabase ^2.58.5
tailwindcss ^3.4.1
typescript ^5.9.3
wrangler ^4.49.0
```

---

_End of reference._

