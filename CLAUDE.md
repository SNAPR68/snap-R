# CLAUDE.md - SnapR Codebase Guide

## Project Overview

SnapR is an AI-powered photo enhancement platform for real estate professionals. It transforms ordinary property photos into luxury showcases using AI tools like sky replacement, virtual staging, twilight conversion, lawn repair, and more.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth), Cloudflare Workers, Vercel Serverless Functions
- **Storage**: Supabase Storage (raw images), Cloudflare R2 (processed images), Cloudinary (CDN)
- **AI Services**: OpenAI, Replicate, Runware, AutoEnhance
- **Payments**: Stripe (subscription tiers)
- **Email**: Resend
- **Monitoring**: Sentry, OpenTelemetry

## Project Structure

```
/app              - Next.js App Router pages and API routes
/apps/processor   - Cloudflare Worker for async photo processing
/apps/web         - Secondary web app
/lib              - Shared libraries (AI engine, Supabase clients, utils)
/components       - React components (shadcn/ui based)
/functions        - Vercel serverless functions
/database         - Supabase schema reference
/supabase         - Migrations and config
```

## Key Directories

- `/lib/ai/` - AI enhancement pipeline (listing-engine, decision-engine, providers)
- `/lib/supabase/` - Database clients (client.ts, server.ts, admin.ts)
- `/app/api/` - API routes (enhance, batch-enhance, upload, listings, etc.)
- `/components/` - UI components following shadcn/ui conventions

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build Next.js app
npm run lint      # Run ESLint
npm run deploy    # Deploy Cloudflare Worker (wrangler deploy)
npm run preview   # Local Worker testing (wrangler dev)
```

## Code Conventions

- **TypeScript**: Strict mode, explicit types, path aliases (@/lib, @/components)
- **React**: Server Components by default, "use client" directive for client components
- **Naming**: PascalCase for components, kebab-case for utilities
- **Styling**: Tailwind CSS, dark mode via class selector
- **Imports**: Named imports preferred, path aliases required

## Database

Supabase PostgreSQL with RLS. Core tables:
- `users` - User profiles, credits, onboarding status
- `listings` - Property listings
- `photos` - Listing photos with processing status
- `jobs` - Processing job tracking
- `payments` - Transaction records

## Supabase Clients

```typescript
// Browser client (public)
import { createClient } from '@/lib/supabase/client'

// Server client (with auth)
import { createClient } from '@/lib/supabase/server'
import { protect } from '@/lib/supabase/server' // Redirects if not authenticated

// Admin client (service role)
import { createAdminClient } from '@/lib/supabase/admin'
```

## Cloudflare Worker (apps/processor)

The async processing worker has constraints:
- No direct Node.js APIs - use Env object for secrets
- Dynamic imports for V2 modules
- R2 bucket: `snapr-images`
- KV namespace: `CHECKPOINTS`

## Enhancement Tools (23 available)

Exterior: sky-replacement, virtual-twilight, lawn-repair, pool-enhance
Interior: declutter, virtual-staging, fire-fireplace, tv-screen, lights-on
Lighting: color-balance, hdr, auto-enhance
Advanced: window-masking, perspective-correction, lens-correction
Seasonal: snow-removal, seasonal-spring/summer/fall
Fixes: reflection-removal, power-line-removal, object-removal, flash-fix

## API Rate Limits

```
/api/enhance:  10 req/min
/api/analyze:  20 req/min
/api/upload:   30 req/min
/api/contact:  3 req/min
/api/auth:     5 req/min
Default:       100 req/min
```

## Environment Variables

Public (NEXT_PUBLIC_):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Private:
- `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, `RUNWARE_API_KEY`
- `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `CLOUDFLARE_API_TOKEN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Current Development

Branch: `feat/worker-transplant-v2`
Focus: Integrating V2 intelligence engine into Cloudflare Worker for async photo processing

## Important Notes

1. **Node Version**: 20 (see .nvmrc)
2. **No test framework** currently configured
3. **Pricing Model**: Subscription tiers (FREE, Starter, Pro, Agency) with listing limits per month
4. **Image Pipeline**: Raw → Supabase Storage → Process → R2 → CDN (Cloudinary)
5. **Deploy**: Next.js to Vercel, Worker to Cloudflare via wrangler
