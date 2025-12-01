# SnapR Comprehensive Audit Report
_Prepared: Dec 1, 2025_

---

## 1. Executive Summary
- SnapR is a Next.js 14.2 application that combines Supabase (auth, database, storage), Cloudinary uploads, Cloudflare Workers/Queues, and multiple AI providers (Runware, Replicate, AutoEnhance.ai, OpenAI).
- There are two enhancement paths: an interactive Studio flow that operates synchronously against Supabase Storage, and a queued bulk pipeline triggered via `/api/upload` that stores assets in Cloudinary and dispatches Cloudflare queue jobs.
- Key strengths include a rich Studio experience (`components/studio-client.tsx`) with before/after previews, built-in sharing, and retry/QC mechanisms (`app/api/enhance/route.ts`). Risks cluster around inconsistent storage semantics, missing helper exports, provider variant mismatches, and suppressed build-time safety checks.
- Immediate priorities: repair Supabase server helper exports, unify storage paths between manual/queued flows, map user-facing variants to provider model IDs, and re-enable lint/TS gates.

---

## 2. Repository Topology
- `app/`: Next.js App Router pages for marketing, auth, onboarding, dashboard, Studio, listings, jobs, share viewer, and API route handlers.
- `components/`: Shared UI (cards, buttons, sliders), higher-level clients (`dashboard-client.tsx`, `studio-client.tsx`, `share-view.tsx`), plus layout/navigation bits.
- `lib/`: Integration helpers (Supabase client/server, Cloudflare, Cloudinary, queues), AI provider SDK wrappers, retries, config constants, and types.
- `functions/` & `workers/`: Cloudflare Pages/Worker scripts for provider proxies, uploads, and queue consumers.
- `supabase/` & `database/`: SQL schema/migrations and Supabase CLI config.
- `public/`, `styles`, and docs (`LAUNCH_CHECKLIST.md`, `BRANDING_ASSETS_GUIDE.md`) round out branding and deployment assets.

---

## 3. Application Architecture
### 3.1 Next.js App & Providers
- Global metadata, fonts, and providers are defined in `app/layout.tsx`, loading Supabase session context via `app/providers.tsx`.
- Middleware (`middleware.ts`) guards authenticated routes, redirecting unauthenticated traffic to `/auth/login`.
- The session provider wraps Supabase client helpers to keep user/session state in sync on the client (`app/providers/session-provider.tsx`).

### 3.2 API Routes
- `/api/listings`, `/api/jobs/[id]`, `/api/share`, `/api/upload`, `/api/enhance`, and `/api/analyze` form the REST-ish backend, each re-validating Supabase auth and coordinating with storage/providers.
- AI-specific routes (enhance/analyze) rely on the tool registry and OpenAI vision scoring to orchestrate provider calls and QC scoring.

### 3.3 Cloudflare Workers & Queues
- `wrangler.toml` binds an `image-jobs` queue and `UPLOADS` R2 bucket for asynchronous processing.
- `workers/image-jobs-consumer.ts` consumes queue messages, updates Supabase `jobs`/`photos`, and calls Runware’s `/v1/infer`.
- `src/workers/imageEnhanceWorker.js` demonstrates additional workloads (Cloudflare AI, OpenAI Vision, Replicate pipelines) for non-Supabase ingestion through R2.
- Pages functions under `functions/` mirror provider proxies and basic upload endpoints for Cloudflare Pages deployments.

### 3.4 Data Model
- Supabase tables (`users`, `listings`, `jobs`, `photos`, `floorplans`, `payments`) define tenant data, with migrations (e.g., `supabase/migrations/202511201945_extend_jobs.sql`) extending metadata, variant, error, and timestamp columns.
- Jobs and photos track `status`, `variant`, `error`, and storage pointers (`raw_url`, `processed_url`), enabling dashboards and share flows.

---

## 4. AI Pipeline & Provider Integrations
### 4.1 Tool Registry
- `lib/ai/tools/index.ts` wires higher-level tools (sky replacement, HDR, declutter, staging, upscale) to provider-specific functions with retry support.

```9:142:lib/ai/tools/index.ts
import {
  upscale as replicateUpscale,
  virtualTwilight as replicateVirtualTwilight,
  lawnRepair as replicateLawnRepair,
  declutter as replicateDeclutter,
  virtualStaging as replicateVirtualStaging,
} from '../providers/replicate';
...
export async function virtualTwilight(imageUrl: string) {
  return withRetry(() => replicateVirtualTwilight(imageUrl), { maxRetries: 2 });
}
```

### 4.2 Provider Wrappers
- Replicate: FLUX Kontext editing plus ESRGAN upscale and interior staging (`lib/ai/providers/replicate.ts`).
- Runware: general enhancement (`runwareEnhance`) and a multi-step sky replacement pipeline (upload → mask → inpaint) (`lib/ai/providers/runware.ts`).
- AutoEnhance.ai: manages upload/poll cycle for HDR/perspective adjustments (`lib/ai/providers/autoenhance.ts`).
- OpenAI Vision: GPT-4o-based analysis and QC scoring (`lib/ai/providers/openai-vision.ts`).

### 4.3 Manual Studio Flow
- `components/studio-client.tsx` drives the interactive experience: fetches listing/photos, signs Supabase storage URLs, triggers `/api/enhance`, previews before/after overlays, and manages share/download flows.

```19:205:components/studio-client.tsx
const AI_TOOLS = [
  { id: 'sky-replacement', name: 'Sky Replacement', ... },
  ...
];
const res = await fetch('/api/enhance', { method: 'POST', body: JSON.stringify({ imageId: selectedPhoto.id, toolId }) });
...
const { data: signedUrl } = await supabase.storage.from('raw-images').createSignedUrl(photo.raw_url, 3600);
```

- `/api/enhance` validates auth, fetches the photo, signs Supabase storage URLs, invokes the requested tool, optionally runs OpenAI QC scoring, re-uploads the enhanced bytes to Supabase storage, and updates the `photos` row.

```11:114:app/api/enhance/route.ts
const { data: signedUrlData } = await supabase.storage.from('raw-images').createSignedUrl(photo.raw_url, 3600);
const enhancedUrl = await tool(rawImageUrl, options);
...
await supabase.storage.from('raw-images').upload(storagePath, enhancedBuffer, { upsert: true });
await supabase.from('photos').update({ processed_url: storagePath, status: 'completed', variant: toolId }).eq('id', imageId);
```

### 4.4 Bulk Upload & Queue Flow
- The authenticated Upload page posts files to `/api/upload`, which streams them to Cloudinary, inserts photo records, and enqueues jobs if Cloudflare credentials exist.

```1:152:app/api/upload/route.ts
const upload = await uploadBuffer(buffer, file.name, `listings/${listingId}`);
await supabase.from('photos').insert({ listing_id: listingId, job_id: job.id, raw_url: upload.secure_url, status: 'pending', variant });
if (cloudflareReady) {
  await enqueueImageJob({ jobId: job.id, listingId, userId: user.id, variant, photos });
}
```

- Queue consumer (`workers/image-jobs-consumer.ts`) sets job/photo statuses and hits Runware’s infer endpoint using the provided variant as a model slug.

---

## 5. User Experience & Flows
### 5.1 Marketing & Public Pages
- `app/page.tsx` hosts the marketing site with mobile-first messaging, features, pricing tiers, and CTAs to signup/login. Additional static content covers FAQ, pricing, contact, privacy, and terms.

### 5.2 Auth & Onboarding
- `/auth/login` and `/auth/signup` rely on Supabase client SDK. `/auth/callback` ensures the `users` table row exists and routes non-onboarded users to `/onboarding`, a multi-step wizard.
- Middleware ensures protected routes (`/dashboard`, `/upload`, `/listings`, `/jobs`, etc.) always require a valid Supabase session.

### 5.3 Dashboard & Listings
- Dashboard grid lists projects with search, creation modal, and deletion controls. Listing detail pages summarize status breakdowns (completed/processing/failed), show before/after sliders, and provide upload shortcuts.

### 5.4 Studio
- The Studio provides tool palettes, preview canvases, download queues, share modal with live link generation (`/api/share`), and slider-based comparison UI for both pending enhancements and completed photos.

### 5.5 Jobs & Share View
- Jobs list and detail pages show progress bars, statuses, retry/refresh actions, and per-photo statuses.
- Public share pages (`/share/[token]`) render the `ShareView` component with optional before/after slider, approval toggles, and downloads depending on share settings.

### 5.6 Billing & Settings
- Billing page currently shows a placeholder INR plan and button stub (Stripe integration pending). Settings allow name edits against the `users` table.

---

## 6. Configuration & Infrastructure
- `env.template` enumerates all required environment variables (Supabase, Cloudflare, Cloudinary, Runware, Replicate, OpenAI).
- `wrangler.toml` configures the Cloudflare deployment, binding queues, R2, and exporting API tokens for providers.
- `supabase/config.toml` sets local dev ports, auth behavior, and analytics.
- `next.config.mjs` disables next/image optimization and, critically, ignores ESLint and TypeScript build errors (risk).
- `tailwind.config.ts` and `app/globals.css` define the design system tokens (gold/charcoal palette, glassmorphism cards).

---

## 7. Issues & Risks
1. **Missing helper export** – Authenticated pages import `createSupabaseServerClient` from `@/lib/supabase/server`, but that function is not defined/exported, leading to runtime errors once pages load.
2. **Storage inconsistency** – `/api/upload` and the worker store Cloudinary URLs in `raw_url`/`processed_url`, while `/api/enhance`, listings, jobs, and share flows assume Supabase Storage paths and attempt to create signed URLs. This breaks downloads/previews for queue-processed assets.
3. **Variant/model mismatch** – Upload UI variants (`"sky-replacement"`, `"hdr-enhance"`, etc.) are passed verbatim to Runware’s `model` parameter in the queue consumer, which expects provider-specific slugs (e.g., `runware:100@1`). Jobs fail by default.
4. **Processed URL semantics** – Worker writes final URLs directly (likely Cloudinary), but share and listing views treat `processed_url` as a storage key to be re-signed, causing runtime errors or double-fetches.
5. **Navbar circular exports** – `components/navbar.tsx` and `components/ui/Navbar.tsx` re-export each other with no implementation, so `AuthenticatedLayout` fails when trying to render `<Navbar />`.
6. **Suppressed lint/TS checks** – Globally ignoring ESLint/TypeScript errors masks the issues above and invites regressions.
7. **Billing placeholder** – Payment flows are not implemented despite pricing CTA, risking user confusion.
8. **Documentation gaps** – README is minimal; there is no runbook for queue deployment, provider configuration, or troubleshooting.
9. **Testing absence** – No automated tests or smoke scripts exist (even simple provider test commands referenced earlier are missing), so provider/API regressions go unnoticed.

---

## 8. Recommendations
1. **Implement/export Supabase server helper** – Provide a `createSupabaseServerClient` (or update imports to the existing `createClient`) to restore server data fetching in authenticated pages.
2. **Unify storage strategy** – Choose either Supabase Storage or Cloudinary as the canonical store for `raw_url`/`processed_url`, update `/api/upload`, worker, `/api/enhance`, listings/jobs/share code accordingly, and store metadata to distinguish when external URLs are used.
3. **Map variants to provider models** – Introduce a lookup table translating UI variant IDs (`sky-replacement`, `hdr-enhance`) to provider-specific parameters (Runware model slug, prompts, etc.) before queue dispatch.
4. **Normalize processed URL handling** – Store both original pointer and signed/public URL fields, or consistently treat columns as absolute URLs, removing signed URL assumptions downstream.
5. **Fix Navbar exports** – Replace the circular exports with a concrete component, or inline nav markup in the authenticated layout to avoid runtime crashes.
6. **Re-enable lint/TS gates** – Remove `ignoreDuringBuilds` and `ignoreBuildErrors` once the above issues are fixed to catch future regressions automatically.
7. **Complete billing integration** – Wire Stripe Checkout or Customer Portal, gate access to billing page until live, and align pricing currency/messaging with target audience.
8. **Enhance documentation** – Expand README with setup steps, environment provisioning, queue deployment guide, provider rate-limit notes, and runbooks derived from `LAUNCH_CHECKLIST.md`.
9. **Add health checks/tests** – Create scripts (e.g., `scripts/test-models.js`) to hit each provider with sample inputs, add unit/integration tests for API routes, and consider end-to-end tests for Studio flows.

---

## 9. Suggested Next Steps
1. Patch `lib/supabase/server.ts` (or create a new helper) and update all imports.
2. Decide on the canonical storage approach; refactor `/api/upload`, `workers/image-jobs-consumer.ts`, `/api/enhance`, listings/jobs/share components accordingly.
3. Introduce a `VARIANT_CONFIG` object shared by Studio, upload API, and worker to prevent mismatched provider parameters.
4. Repair navigation component exports and re-enable lint/TS checks to validate fixes.
5. Implement Stripe billing and update marketing copy once transactions are live.
6. Write operational docs covering Cloudflare queue deployment, Supabase migrations, and provider setup; store them under `docs/` or expand this audit file with appendices as processes mature.
7. Build automated smoke tests to run provider calls nightly (or pre-release) and surface failures before customers encounter them.

---

_End of report._

