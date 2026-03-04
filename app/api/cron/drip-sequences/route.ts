/**
 * SnapR API — Lead Drip Sequence Sender Cron
 * ===========================================
 * Runs every hour via Vercel Cron.
 *
 * Pipeline:
 * 1. Fetch all scheduled drip emails that are due (scheduled_for <= now)
 * 2. For each email: render template vars, send via Resend
 * 3. Mark email sent/failed
 * 4. Advance enrollment to next step; mark completed when all steps done
 *
 * Auth: CRON_SECRET Bearer token (same as other crons)
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminSupabase } from '@/lib/supabase/admin'

interface DripEmail {
  id: string
  enrollment_id: string
  step_id: string
  lead_id: string
  user_id: string
  scheduled_for: string
  subject: string
  lead_drip_enrollments: Array<{
    status: string
    sequence_id: string
    listing_id: string | null
  }>
  lead_drip_steps: Array<{
    body_template: string
    step_number: number
  }>
  property_leads: Array<{
    name: string
    email: string
  }>
}

interface ProfileRow {
  full_name: string | null
  phone: string | null
}

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

  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      result = result.replaceAll(`{{${key}}}`, value)
    }
  }

  // Conditional blocks
  for (const [key, value] of Object.entries(vars)) {
    const openTag = `{{#${key}}}`
    const closeTag = `{{/${key}}}`
    if (value) {
      result = result.replaceAll(openTag, '').replaceAll(closeTag, '')
    } else {
      const blockRegex = new RegExp(
        `${openTag.replace(/[{}]/g, '\\$&')}[\\s\\S]*?${closeTag.replace(/[{}]/g, '\\$&')}`,
        'g'
      )
      result = result.replace(blockRegex, '')
    }
  }

  return result
}

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminSupabase()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'
  const now = new Date().toISOString()

  let sent = 0
  let failed = 0
  let skipped = 0

  try {
    // Fetch due emails (batch of 50 to stay within execution time)
    const { data: dueEmails, error: fetchError } = await admin
      .from('lead_drip_emails')
      .select(`
        id, enrollment_id, step_id, lead_id, user_id, scheduled_for, subject,
        lead_drip_enrollments!lead_drip_emails_enrollment_id_fkey(status, sequence_id, listing_id),
        lead_drip_steps!lead_drip_emails_step_id_fkey(body_template, step_number),
        property_leads!lead_drip_emails_lead_id_fkey(name, email)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(50)

    if (fetchError) {
      console.error('[DripCron] Fetch error:', fetchError.message)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const emails = (dueEmails || []) as DripEmail[]
    console.log(`[DripCron] Processing ${emails.length} due drip emails`)

    for (const email of emails) {
      const enrollment = email.lead_drip_enrollments[0] ?? null
      const step = email.lead_drip_steps[0] ?? null
      const lead = email.property_leads[0] ?? null

      // Skip if enrollment was cancelled or lead doesn't exist
      if (!enrollment || enrollment.status !== 'active' || !lead || !step) {
        await admin
          .from('lead_drip_emails')
          .update({ status: 'skipped' })
          .eq('id', email.id)
        skipped++
        continue
      }

      // Fetch agent profile
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, phone')
        .eq('id', email.user_id)
        .single() as { data: ProfileRow | null }

      // Fetch listing address + property site
      let listingAddress = 'the property'
      let propertySiteUrl: string | undefined

      if (enrollment.listing_id) {
        const { data: listing } = await admin
          .from('listings')
          .select('address, city, state')
          .eq('id', enrollment.listing_id)
          .single()

        if (listing) {
          listingAddress = [listing.address, listing.city, listing.state].filter(Boolean).join(', ')
        }

        const { data: site } = await admin
          .from('property_sites')
          .select('slug')
          .eq('listing_id', enrollment.listing_id)
          .single()

        if (site?.slug) {
          propertySiteUrl = `${baseUrl}/p/${site.slug}`
        }
      }

      const agentName = profile?.full_name || 'Your Agent'

      const templateVars: TemplateVars = {
        name: lead.name,
        address: listingAddress,
        agent_name: agentName,
        agent_phone: profile?.phone ?? undefined,
        property_site_url: propertySiteUrl,
        unsubscribe_url: `${baseUrl}/api/leads/drip/unsubscribe?e=${email.enrollment_id}`,
      }

      const htmlBody = renderTemplate(step.body_template, templateVars)

      try {
        const { data: resendData, error: sendError } = await resend.emails.send({
          from: `${agentName} via SnapR <notifications@snap-r.com>`,
          to: lead.email as string,
          subject: email.subject,
          html: htmlBody,
        })

        if (sendError) {
          throw new Error(sendError.message)
        }

        // Mark email sent
        await admin
          .from('lead_drip_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_message_id: resendData?.id ?? null,
          })
          .eq('id', email.id)

        sent++

        // Check if this was the last step in the sequence — if so, complete enrollment
        const { count: remainingCount } = await admin
          .from('lead_drip_emails')
          .select('id', { count: 'exact', head: true })
          .eq('enrollment_id', email.enrollment_id)
          .eq('status', 'scheduled')

        if (!remainingCount || remainingCount === 0) {
          await admin
            .from('lead_drip_enrollments')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', email.enrollment_id)
        }
      } catch (sendErr: unknown) {
        const errMsg = sendErr instanceof Error ? sendErr.message : 'Send failed'
        console.error(`[DripCron] Failed to send email ${email.id}:`, errMsg)

        await admin
          .from('lead_drip_emails')
          .update({ status: 'failed', error: errMsg })
          .eq('id', email.id)

        failed++
      }
    }

    console.log(`[DripCron] Done — sent=${sent} failed=${failed} skipped=${skipped}`)

    return NextResponse.json({ success: true, sent, failed, skipped })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DripCron] Fatal error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
