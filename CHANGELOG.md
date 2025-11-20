# Changelog

## 2025-11-20 – Build stabilization prep
- Created safety branch `fix/build-errors-audit` before applying fixes.
- Capturing build issues and step-by-step remediation in this log for easy rollback.
- Fixed `"use client"` directive ordering on `app/(authenticated)/jobs/[id]/page.tsx`, `.../settings/page.tsx`, and `.../upload/page.tsx`.
- Switched `lib/supabase/server.ts` to use `createServerComponentClient` so env vars are read at runtime instead of build time.
- Normalized Navbar re-exports so default export is used consistently (fixes case-sensitive import warning).
