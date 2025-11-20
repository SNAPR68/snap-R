# Changelog

## 2025-11-20 – Build stabilization prep
- Created safety branch `fix/build-errors-audit` before applying fixes.
- Capturing build issues and step-by-step remediation in this log for easy rollback.
- Fixed `"use client"` directive ordering on `app/(authenticated)/jobs/[id]/page.tsx`, `.../settings/page.tsx`, and `.../upload/page.tsx`.
- Switched `lib/supabase/server.ts` to use `createServerComponentClient` so env vars are read at runtime instead of build time.
- Normalized Navbar re-exports so default export is used consistently (fixes case-sensitive import warning).
- Ensured Supabase client helper validates `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, after adding the missing URL env locally.
- Memoized Supabase client in `SessionProvider` to avoid infinite render loops during prerender.
- Removed `export const revalidate = 60` from authenticated server pages so `force-dynamic` pages no longer try to prerender during build.
- Marked `app/(authenticated)/layout.tsx` as `force-dynamic` so no protected child page is statically prerendered.
- Added richer listing + photo columns (address, metadata, variant, error) and recorded a Supabase migration.
- Created `/api/listings` route (GET + POST) so clients can create and fetch listings via Supabase securely.
- Added Cloudinary + Cloudflare queue helpers and implemented `/api/upload` to create jobs, store photos, and enqueue AI work.
- Extended jobs/photos schema with metadata + indexes and added `/api/jobs/[id]` for status + retry support.
