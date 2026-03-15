/**
 * SnapR API v1 — Listings
 * GET /api/v1/listings — List all listings
 * POST /api/v1/listings — Create a new listing
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'
import { getListings, createListing } from '@/lib/services/listings-service'
import { listingCreateSchema, parseBody } from '@/lib/validation/schemas'

export const GET = withApiAuth(async (ctx) => {
  const { searchParams } = ctx.request.nextUrl
  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1
  const perPage = Math.min(parseInt(searchParams.get('per_page') ?? '50', 10) || 50, 100)

  const result = await getListings(ctx.supabase, ctx.userId, { page, perPage })

  return NextResponse.json({ data: result.listings, meta: result.meta })
})

export const POST = withApiAuth(async (ctx) => {
  const body = await ctx.request.json()
  const parsed = parseBody(listingCreateSchema, body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error, code: 'validation_error', details: parsed.details } },
      { status: 400 }
    )
  }

  const listing = await createListing(ctx.supabase, ctx.userId, parsed.data)
  return NextResponse.json({ data: listing }, { status: 201 })
})
