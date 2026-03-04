/**
 * /api/showings — CRUD for property showings
 * GET    ?listingId=  — list showings (optionally filtered by listing)
 * POST               — create showing
 * PATCH              — update status/outcome/feedback
 * DELETE             — delete showing
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  listingId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).default(30),
  location: z.string().nullable().optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactType: z.enum(['buyer', 'agent', 'investor', 'other']).default('buyer'),
  agentName: z.string().nullable().optional(),
  brokerage: z.string().nullable().optional(),
  source: z.enum(['mls', 'property_site', 'social_media', 'email', 'referral', 'open_house', 'direct', 'other']).nullable().optional(),
  agentNotes: z.string().nullable().optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
  outcome: z.enum(['interested', 'very_interested', 'not_interested', 'offer_submitted', 'unknown']).nullable().optional(),
  feedback: z.string().nullable().optional(),
  interestLevel: z.number().int().min(1).max(5).nullable().optional(),
  agentNotes: z.string().nullable().optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')
    const status = searchParams.get('status')

    let query = supabase
      .from('showings')
      .select('*, listings(address, city, state, title)')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (listingId) query = query.eq('listing_id', listingId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Stats summary
    const all = data ?? []
    const stats = {
      total: all.length,
      scheduled: all.filter(s => s.status === 'scheduled').length,
      completed: all.filter(s => s.status === 'completed').length,
      cancelled: all.filter(s => s.status === 'cancelled').length,
      no_show: all.filter(s => s.status === 'no_show').length,
      interested: all.filter(s => s.outcome === 'interested' || s.outcome === 'very_interested').length,
      offers: all.filter(s => s.outcome === 'offer_submitted').length,
    }

    return NextResponse.json({ showings: all, stats })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

    const d = parsed.data
    const { data, error } = await supabase
      .from('showings')
      .insert({
        user_id: user.id,
        listing_id: d.listingId,
        scheduled_at: d.scheduledAt,
        duration_minutes: d.durationMinutes,
        location: d.location ?? null,
        contact_name: d.contactName,
        contact_email: d.contactEmail ?? null,
        contact_phone: d.contactPhone ?? null,
        contact_type: d.contactType,
        agent_name: d.agentName ?? null,
        brokerage: d.brokerage ?? null,
        source: d.source ?? null,
        agent_notes: d.agentNotes ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ showing: data }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

    const { id, ...rest } = parsed.data
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (rest.status !== undefined) updates.status = rest.status
    if (rest.outcome !== undefined) updates.outcome = rest.outcome
    if (rest.feedback !== undefined) updates.feedback = rest.feedback
    if (rest.interestLevel !== undefined) updates.interest_level = rest.interestLevel
    if (rest.agentNotes !== undefined) updates.agent_notes = rest.agentNotes
    if (rest.scheduledAt !== undefined) updates.scheduled_at = rest.scheduledAt
    if (rest.durationMinutes !== undefined) updates.duration_minutes = rest.durationMinutes
    if (rest.contactName !== undefined) updates.contact_name = rest.contactName
    if (rest.contactEmail !== undefined) updates.contact_email = rest.contactEmail
    if (rest.contactPhone !== undefined) updates.contact_phone = rest.contactPhone

    const { data, error } = await supabase
      .from('showings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ showing: data })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await supabase.from('showings').delete().eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
