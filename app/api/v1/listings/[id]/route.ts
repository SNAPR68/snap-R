/**
 * SnapR API v1 — Single Listing
 * GET /api/v1/listings/:id — Get listing details
 * PATCH /api/v1/listings/:id — Update listing
 * DELETE /api/v1/listings/:id — Delete listing
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'
import { getListing, updateListing, deleteListing } from '@/lib/services/listings-service'
import { listingUpdateSchema, parseBody } from '@/lib/validation/schemas'
import { z } from 'zod'

function extractId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/')
  // /api/v1/listings/[id] → segments[4]
  return segments[4] ?? null
}

export const GET = withApiAuth(async (ctx) => {
  const id = extractId(ctx.request)
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { error: { message: 'Invalid listing ID', code: 'validation_error' } },
      { status: 400 }
    )
  }

  const result = await getListing(ctx.supabase, ctx.userId, id)
  if (!result) {
    return NextResponse.json(
      { error: { message: 'Listing not found', code: 'not_found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: result })
})

export const PATCH = withApiAuth(async (ctx) => {
  const id = extractId(ctx.request)
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { error: { message: 'Invalid listing ID', code: 'validation_error' } },
      { status: 400 }
    )
  }

  const body = await ctx.request.json()
  const parsed = parseBody(listingUpdateSchema, { ...body, id })
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error, code: 'validation_error', details: parsed.details } },
      { status: 400 }
    )
  }

  const listing = await updateListing(ctx.supabase, ctx.userId, id, parsed.data)
  return NextResponse.json({ data: listing })
})

export const DELETE = withApiAuth(async (ctx) => {
  const id = extractId(ctx.request)
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { error: { message: 'Invalid listing ID', code: 'validation_error' } },
      { status: 400 }
    )
  }

  await deleteListing(ctx.supabase, ctx.userId, id)
  return NextResponse.json({ data: { success: true } })
})
