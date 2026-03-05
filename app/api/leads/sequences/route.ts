/**
 * SnapR API — Drip Sequence CRUD
 * ================================
 * GET    ?include_steps=true — list user's custom sequences + steps count
 * POST   { name, description, triggerEvent, steps[] } — create sequence with steps
 * PATCH  { id, name, description, triggerEvent, is_active, steps? } — update sequence (+ replace steps if provided)
 * DELETE { id } — delete custom sequence (system sequences are protected)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

// ── Zod schemas ───────────────────────────────────────────────────────────────

const stepSchema = z.object({
  step_number: z.number().int().min(1),
  delay_days: z.number().int().min(0),
  subject_template: z.string().min(1).max(500),
  body_template: z.string().min(1),
})

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  triggerEvent: z.enum(['manual', 'lead_captured', 'status_change']).optional(),
  steps: z.array(stepSchema).min(1).max(20),
})

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  triggerEvent: z.enum(['manual', 'lead_captured', 'status_change']).optional(),
  is_active: z.boolean().optional(),
  steps: z.array(stepSchema).min(1).max(20).optional(),
})

const deleteSchema = z.object({
  id: z.string().uuid(),
})

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const includeSteps = searchParams.get('include_steps') === 'true'
    const admin = adminSupabase()

    const baseQuery = admin
      .from('lead_drip_sequences')
      .select('id, name, description, trigger_event, is_active, is_system, created_at, updated_at')
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: true })

    const { data: sequences, error } = await baseQuery
    if (error) throw error

    // Optionally fetch steps in a separate query
    let stepsMap: Record<string, Array<{ id: string; step_number: number; delay_days: number; subject_template: string; body_template: string }>> = {}
    if (includeSteps && sequences && sequences.length > 0) {
      const sequenceIds = sequences.map(s => s.id)
      const { data: allSteps } = await admin
        .from('lead_drip_steps')
        .select('id, sequence_id, step_number, delay_days, subject_template, body_template')
        .in('sequence_id', sequenceIds)
        .order('step_number', { ascending: true })

      stepsMap = {}
      for (const step of allSteps || []) {
        if (!stepsMap[step.sequence_id]) stepsMap[step.sequence_id] = []
        stepsMap[step.sequence_id].push({
          id: step.id,
          step_number: step.step_number,
          delay_days: step.delay_days,
          subject_template: step.subject_template,
          body_template: step.body_template,
        })
      }
    }

    // Fetch enrollment counts per sequence for this user
    const { data: enrollments } = await admin
      .from('lead_drip_enrollments')
      .select('sequence_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const enrollmentCounts: Record<string, number> = {}
    for (const e of enrollments || []) {
      enrollmentCounts[e.sequence_id] = (enrollmentCounts[e.sequence_id] || 0) + 1
    }

    const result = (sequences || []).map(s => ({
      ...s,
      steps: stepsMap[s.id] ?? [],
      active_enrollments: enrollmentCounts[s.id] || 0,
    }))

    return NextResponse.json({ sequences: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sequences'
    console.error('[Sequences] GET error:', message)
    return NextResponse.json({ error: 'Failed to fetch sequences' }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 })
    }

    const { name, description, triggerEvent, steps } = parsed.data
    const admin = adminSupabase()

    const { data: sequence, error: seqErr } = await admin
      .from('lead_drip_sequences')
      .insert({
        user_id: user.id,
        name,
        description: description ?? null,
        trigger_event: triggerEvent ?? 'manual',
        is_active: true,
        is_system: false,
      })
      .select('id')
      .single()

    if (seqErr || !sequence) {
      throw seqErr ?? new Error('Insert failed')
    }

    const { error: stepsErr } = await admin
      .from('lead_drip_steps')
      .insert(steps.map(s => ({ ...s, sequence_id: sequence.id })))

    if (stepsErr) throw stepsErr

    return NextResponse.json({ success: true, sequenceId: sequence.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create sequence'
    console.error('[Sequences] POST error:', message)
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 })
    }

    const { id, name, description, triggerEvent, is_active, steps } = parsed.data
    const admin = adminSupabase()

    // Verify ownership (cannot edit system sequences)
    const { data: existing } = await admin
      .from('lead_drip_sequences')
      .select('id, is_system')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Sequence not found or not editable' }, { status: 404 })
    }

    if (existing.is_system) {
      return NextResponse.json({ error: 'System sequences cannot be edited' }, { status: 403 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (triggerEvent !== undefined) updates.trigger_event = triggerEvent
    if (is_active !== undefined) updates.is_active = is_active

    const { error: updateErr } = await admin
      .from('lead_drip_sequences')
      .update(updates)
      .eq('id', id)

    if (updateErr) throw updateErr

    // Replace steps if provided
    if (steps) {
      await admin.from('lead_drip_steps').delete().eq('sequence_id', id)
      const { error: stepsErr } = await admin
        .from('lead_drip_steps')
        .insert(steps.map(s => ({ ...s, sequence_id: id })))
      if (stepsErr) throw stepsErr
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update sequence'
    console.error('[Sequences] PATCH error:', message)
    return NextResponse.json({ error: 'Failed to update sequence' }, { status: 500 })
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid sequence ID' }, { status: 400 })
    }

    const { id } = parsed.data
    const admin = adminSupabase()

    // Verify ownership — cannot delete system sequences
    const { data: existing } = await admin
      .from('lead_drip_sequences')
      .select('id, is_system')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    if (existing.is_system) {
      return NextResponse.json({ error: 'System sequences cannot be deleted' }, { status: 403 })
    }

    const { error } = await admin
      .from('lead_drip_sequences')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete sequence'
    console.error('[Sequences] DELETE error:', message)
    return NextResponse.json({ error: 'Failed to delete sequence' }, { status: 500 })
  }
}
