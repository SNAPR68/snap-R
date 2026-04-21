# Cloudflare Worker — apps/processor

Async processing worker for photo enhancement (Phase 1) and marketing pipeline (Phase 2).

## Constraints (non-negotiable)

- No direct Node.js APIs — use the `Env` object for secrets
- Dynamic imports required for V2 modules (prevents bundle bloat)
- R2 bucket binding: `snapr-images`
- KV namespace: `CHECKPOINTS`
- Queue bindings: `PROCESS_QUEUE`, `MARKETING_QUEUE`
- Supabase client **must** pass `db: { schema: 'public' }` (see `lib/supabase-client.ts`) — Worker runtime otherwise defaults to the wrong schema context

## Files

- `handler.ts` — photo enhancement handler (sky replacement, staging, twilight, etc.)
- `marketing-handler.ts` — 5-step marketing pipeline (description → captions → MLS → property site → scheduled posts)
- `index.ts` — queue router + HTTP entrypoint
- `types.ts` — shared message shapes
- `lib/supabase-client.ts` — Supabase client factory (schema-aware)

## Pipeline semantics

**Always-complete** — one step failing never blocks the others. Each step writes its own `*_status` column on `marketing_jobs` (processing/completed/failed/skipped).

Free-tier users get `status: 'skipped'` immediately in marketing-handler (zero AI cost incurred).

## Deploy

```bash
cd apps/processor && npx wrangler deploy
```

Local testing:
```bash
npm run preview   # wrangler dev
```

Dev URL: `https://snapr-processor-dev.rajesh-fba.workers.dev`

## Gotchas

- `preparation_metadata.photoAudit` is `Record<string, object>`, not an array — always `Object.entries()`, never `.map()`
- Photo type classification lives in `preparation_metadata.decisionAudit[photoId].photoType`, not `photoAudit`
- Batch timeout: default 30 min (`BATCH_TIMEOUT_MS` env var, previously 10 min caused incomplete runs on 20+ photos)
- AI provider circuit breaker: after 3 consecutive failures, provider is unhealthy for 60s — `recordProviderResult()` must be called after every invocation (see `lib/ai/listing-engine/provider-router.ts`)
