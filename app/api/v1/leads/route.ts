/**
 * SnapR API v1 — Leads
 * GET /api/v1/leads — List leads for authenticated user
 * POST /api/v1/leads — Create a new lead
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'
import { z } from 'zod'

const leadCreateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
  listing_id: z.string().uuid().optional(),
  source: z.string().max(100).optional(),
})

export const GET = withApiAuth(async (ctx) => {
  const { searchParams } = ctx.request.nextUrl
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = Math.min(parseInt(searchParams.get('per_page') ?? '50', 10), 100)
  const listingId = searchParams.get('listing_id')
  const offset = (page - 1) * perPage

  let query = ctx.supabase
    .from('property_leads')
    .select('id, name, email, phone, message, listing_id, score, status, created_at, updated_at', { count: 'exact' })
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (listingId && z.string().uuid().safeParse(listingId).success) {
    query = query.eq('listing_id', listingId)
  }

  const { data: leads, error, count } = await query

  if (error) {
    return NextResponse.json(
      { error: { message: 'Failed to fetch leads', code: 'internal_error' } },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: leads ?? [],
    meta: { page, per_page: perPage, total: count ?? 0 },
  })
})

export const POST = withApiAuth(async (ctx) => {
  const body = await ctx.request.json()
  const parsed = leadCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Validation failed', code: 'validation_error', details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    )
  }

  const { data: lead, error } = await ctx.supabase
    .from('property_leads')
    .insert({
      user_id: ctx.userId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      message: parsed.data.message ?? null,
      listing_id: parsed.data.listing_id ?? null,
      source: parsed.data.source ?? 'api',
      status: 'new',
      score: 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: { message: 'Failed to create lead', code: 'internal_error' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: lead }, { status: 201 })
})
