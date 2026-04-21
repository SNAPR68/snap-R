# Next.js API Routes — app/api/

## Auth patterns

Choose the right client for the caller:

```ts
// Server component / API route with user session
import { createClient } from '@/lib/supabase/server'

// Service role (crons, workers, admin) — bypasses RLS
import { adminSupabase } from '@/lib/supabase/admin'
```

Never use the browser client (`@/lib/supabase/client`) in an API route — it has no session context.

## Input validation (mandatory)

Every POST/PATCH/PUT route parses inputs through Zod schemas from `lib/validation/schemas.ts` before any side effect. No exceptions.

```ts
const parsed = schema.safeParse(await req.json())
if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
```

## External calls

All outbound `fetch()` calls must use `AbortSignal.timeout(15000)` — prevents a hung third-party from tying up a Vercel function.

## Rate limiting

- **Per-IP**: `checkRateLimit(ip, route)` — edge-runtime safe, from `lib/rate-limit-edge.ts`
- **Per-user** (AI-heavy routes): `checkRateLimitPerUser(userId, route, limit, windowMs)` — protects against single-user credit burn

Never import `@upstash/redis` or `@upstash/ratelimit` inside `middleware.ts` — they use `eval`/`process.version` and crash the Edge Runtime.

## Auth callback (`/auth/callback/route.ts`) — critical

Must set:
```ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
```
AND wrap every `NextResponse.redirect(...)` with a `noStore()` helper that adds `Cache-Control: no-store`, `CDN-Cache-Control: no-store`, `Vercel-CDN-Cache-Control: no-store`. Without those headers, Vercel's edge can pin a transient 500 for hours on `If-None-Match` revalidation. See incident 2026-04-15 (#147).

## Cron routes

- Path: `app/api/cron/*`
- Auth: `Authorization: Bearer ${process.env.CRON_SECRET}`
- Config: `export const maxDuration = 300`
- Never read from the user session; always use `adminSupabase`

## v1 public API (`app/api/v1/`)

Every v1 route wraps its handler in `withApiAuth()` from `lib/api-v1/middleware.ts`. Enterprise tier only. Response envelope:
- Single: `{ data }`
- List: `{ data, meta: { page, per_page, total } }`
- Error: `{ error: { message, code } }`

## Error handling

```ts
try {
  // ...
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  // never `catch (error: any)`, never leave error untyped
}
```

## Capability gates for social platforms

Before any social DB write or OAuth call, call `getSocialCapability(platform).enabled` from `lib/social/capabilities.ts`. Return 503 with a clear message if disabled. Never hit a disabled platform's API.
