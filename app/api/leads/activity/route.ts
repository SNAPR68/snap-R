/**
 * /api/leads/activity
 * GET  ?leadId=<id>  — list activities for a lead
 * POST              — create activity (note, call, email, status_change, etc.)
 * PATCH             — update lead score or notes
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  leadId: z.string().uuid(),
  activityType: z.enum(['note', 'call', 'email', 'text', 'showing', 'status_change', 'drip_email_sent', 'property_site_viewed', 'form_submitted', 'auto']),
  body: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

const patchSchema = z.object({
  leadId: z.string().uuid(),
  score: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'archived']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const leadId = new URL(request.url).searchParams.get('leadId')
    if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })

    // Verify lead belongs to user
    const { data: lead } = await supabase
      .from('property_leads')
      .select('id, score, notes, status, last_activity_at')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const { data: activities } = await supabase
      .from('lead_activities')
      .select('id, activity_type, body, metadata, created_at')
      .eq('lead_id', leadId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ activities: activities ?? [], lead })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as unknown
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { leadId, activityType, body: actBody, metadata } = parsed.data

    // Score delta per activity type (caps at 100)
    const SCORE_DELTAS: Record<string, number> = {
      call: 10,
      email: 5,
      text: 5,
      showing: 20,
      property_site_viewed: 8,
      form_submitted: 15,
      drip_email_sent: 2,
      status_change: 0,
      note: 0,
      auto: 0,
    }

    // Verify lead belongs to user
    const { data: lead } = await supabase
      .from('property_leads')
      .select('id, score')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: activityType,
        body: actBody ?? null,
        metadata: metadata ?? null,
      })
      .select('id, activity_type, body, metadata, created_at')
      .single()

    if (error) throw error

    // Auto-update score based on activity
    const delta = SCORE_DELTAS[activityType] ?? 0
    if (delta > 0) {
      const newScore = Math.min(100, (lead.score ?? 0) + delta)
      await supabase
        .from('property_leads')
        .update({ score: newScore, last_activity_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('property_leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ activity: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as unknown
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { leadId, score, notes, status } = parsed.data

    const updates: Record<string, unknown> = {}
    if (score !== undefined) updates.score = score
    if (notes !== undefined) updates.notes = notes
    if (status !== undefined) updates.status = status

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('property_leads')
      .update(updates)
      .eq('id', leadId)
      .eq('user_id', user.id)
      .select('id, score, notes, status')
      .single()

    if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 404 })

    // Auto-log status changes
    if (status) {
      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: 'status_change',
        body: `Status changed to ${status}`,
        metadata: { new_status: status },
      })
    }

    return NextResponse.json({ lead: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
