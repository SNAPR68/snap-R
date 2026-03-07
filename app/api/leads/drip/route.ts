/**
 * SnapR API — Lead Drip Sequence Enrollment
 * ==========================================
 * POST: Enroll a lead in a drip sequence (schedules emails)
 * GET:  List enrollments + sequences available to the user
 * DELETE: Unenroll (unsubscribe) a lead from a sequence
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

import { logger } from '@/lib/logger';
// ============================================
// Schemas
// ============================================

const enrollSchema = z.object({
  leadId: z.string().uuid(),
  sequenceId: z.string().uuid(),
})

const unenrollSchema = z.object({
  enrollmentId: z.string().uuid(),
})

// ============================================
// Template rendering helper
// ============================================

interface TemplateVars {
  name: string
  address: string
  agent_name: string
  agent_phone?: string
  property_site_url?: string
  unsubscribe_url: string
}

function renderTemplate(template: string, vars: TemplateVars): string {
  let result = template

  // Simple mustache-style variable substitution
  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      result = result.replaceAll(`{{${key}}}`, value)
    }
  }

  // Handle conditional blocks: {{#field}}...content...{{/field}}
  for (const [key, value] of Object.entries(vars)) {
    const openTag = `{{#${key}}}`
    const closeTag = `{{/${key}}}`
    if (value) {
      // Keep content, remove tags
      result = result.replaceAll(openTag, '').replaceAll(closeTag, '')
    } else {
      // Remove entire block
      const blockRegex = new RegExp(
        `${openTag.replace(/[{}]/g, '\\$&')}[\\s\\S]*?${closeTag.replace(/[{}]/g, '\\$&')}`,
        'g'
      )
      result = result.replace(blockRegex, '')
    }
  }

  return result
}

// ============================================
// POST — Enroll a lead
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = enrollSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { leadId, sequenceId } = parsed.data
    const admin = adminSupabase()

    // Verify lead belongs to this user
    const { data: lead, error: leadError } = await admin
      .from('property_leads')
      .select('id, name, email, listing_id')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Verify sequence exists (system or owned by user)
    const { data: sequence, error: seqError } = await admin
      .from('lead_drip_sequences')
      .select('id, name, is_system')
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .eq('id', sequenceId)
      .eq('is_active', true)
      .single()

    if (seqError || !sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Check for duplicate enrollment
    const { data: existing } = await admin
      .from('lead_drip_enrollments')
      .select('id, status')
      .eq('lead_id', leadId)
      .eq('sequence_id', sequenceId)
      .single()

    if (existing && existing.status === 'active') {
      return NextResponse.json({ error: 'Lead is already enrolled in this sequence' }, { status: 409 })
    }

    // Fetch agent profile for template vars
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // Fetch listing + property site for template vars
    let listingAddress = ''
    let propertySiteUrl: string | undefined

    if (lead.listing_id) {
      const { data: listing } = await admin
        .from('listings')
        .select('address, city, state')
        .eq('id', lead.listing_id)
        .single()

      if (listing) {
        listingAddress = [listing.address, listing.city, listing.state].filter(Boolean).join(', ')
      }

      const { data: site } = await admin
        .from('property_sites')
        .select('slug')
        .eq('listing_id', lead.listing_id)
        .single()

      if (site?.slug) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'
        propertySiteUrl = `${baseUrl}/p/${site.slug}`
      }
    }

    // Fetch sequence steps
    const { data: steps, error: stepsError } = await admin
      .from('lead_drip_steps')
      .select('id, step_number, delay_days, subject_template, body_template')
      .eq('sequence_id', sequenceId)
      .order('step_number', { ascending: true })

    if (stepsError || !steps || steps.length === 0) {
      return NextResponse.json({ error: 'Sequence has no steps' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'
    const agentName = profile?.full_name || user.email?.split('@')[0] || 'Your Agent'

    // Create or reactivate enrollment
    let enrollmentId: string

    if (existing) {
      // Reactivate a previously completed/unsubscribed enrollment
      const { data: updated, error: updateErr } = await admin
        .from('lead_drip_enrollments')
        .update({
          status: 'active',
          next_step_number: 1,
          completed_at: null,
          listing_id: lead.listing_id ?? null,
          enrolled_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single()

      if (updateErr || !updated) {
        return NextResponse.json({ error: 'Failed to reactivate enrollment' }, { status: 500 })
      }

      enrollmentId = updated.id

      // Cancel any lingering scheduled emails from previous run
      await admin
        .from('lead_drip_emails')
        .update({ status: 'skipped' })
        .eq('enrollment_id', enrollmentId)
        .eq('status', 'scheduled')
    } else {
      // New enrollment
      const { data: enrollment, error: enrollError } = await admin
        .from('lead_drip_enrollments')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          sequence_id: sequenceId,
          listing_id: lead.listing_id ?? null,
          status: 'active',
          next_step_number: 1,
        })
        .select('id')
        .single()

      if (enrollError || !enrollment) {
        logger.error('[Drip] Enrollment insert error:', enrollError?.message)
        return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
      }

      enrollmentId = enrollment.id
    }

    // Schedule all emails
    const now = new Date()
    const templateVars: TemplateVars = {
      name: lead.name,
      address: listingAddress || 'the property',
      agent_name: agentName,
      agent_phone: profile?.phone ?? undefined,
      property_site_url: propertySiteUrl,
      unsubscribe_url: `${baseUrl}/api/leads/drip/unsubscribe?e=${enrollmentId}`,
    }

    const emailInserts = steps.map(step => {
      const scheduledFor = new Date(now)
      scheduledFor.setDate(scheduledFor.getDate() + step.delay_days)

      const subject = renderTemplate(step.subject_template, templateVars)

      return {
        enrollment_id: enrollmentId,
        step_id: step.id,
        lead_id: leadId,
        user_id: user.id,
        scheduled_for: scheduledFor.toISOString(),
        status: 'scheduled' as const,
        subject,
      }
    })

    const { error: emailInsertError } = await admin
      .from('lead_drip_emails')
      .insert(emailInserts)

    if (emailInsertError) {
      logger.error('[Drip] Email schedule error:', emailInsertError.message)
      // Don't fail — enrollment is created, cron will retry scheduling
    }

    return NextResponse.json({
      success: true,
      enrollmentId,
      emailsScheduled: emailInserts.length,
      sequenceName: sequence.name,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Drip] POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ============================================
// GET — List available sequences + enrollments for a lead
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const leadId = url.searchParams.get('lead_id')

    const admin = adminSupabase()

    // Fetch sequences available to this user
    const { data: sequences } = await admin
      .from('lead_drip_sequences')
      .select('id, name, description, trigger_event')
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .eq('is_active', true)
      .order('is_system', { ascending: false })

    // Fetch enrollments for the specific lead (if requested)
    let enrollments: unknown[] = []
    if (leadId) {
      const { data } = await admin
        .from('lead_drip_enrollments')
        .select(`
          id, status, enrolled_at, completed_at, next_step_number,
          sequence_id,
          lead_drip_sequences!lead_drip_enrollments_sequence_id_fkey(name),
          lead_drip_emails(id, status, scheduled_for, sent_at, subject)
        `)
        .eq('lead_id', leadId)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })

      enrollments = data || []
    }

    return NextResponse.json({
      sequences: sequences || [],
      enrollments,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Drip] GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ============================================
// DELETE — Unenroll (unsubscribe)
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = unenrollSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid enrollment ID' }, { status: 400 })
    }

    const { enrollmentId } = parsed.data
    const admin = adminSupabase()

    // Mark enrollment as unsubscribed
    const { error } = await admin
      .from('lead_drip_enrollments')
      .update({ status: 'unsubscribed', completed_at: new Date().toISOString() })
      .eq('id', enrollmentId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Cancel remaining scheduled emails
    await admin
      .from('lead_drip_emails')
      .update({ status: 'skipped' })
      .eq('enrollment_id', enrollmentId)
      .eq('status', 'scheduled')

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Drip] DELETE error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
