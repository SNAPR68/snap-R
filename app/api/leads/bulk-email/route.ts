/**
 * /api/leads/bulk-email
 * POST — Send a bulk email to a set of lead IDs using a subject + body template
 * GET  — List recent bulk sends for the user
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { bulkEmailSendSchema } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/utils/client-ip';
import { checkRateLimitAsync } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 req/min per IP (uses Upstash Redis in production)
    const ip = getClientIp(request.headers)
    const { success: withinLimit } = await checkRateLimitAsync(`bulk-email:${ip}`, 5, 60_000)
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as unknown
    const parsed = bulkEmailSendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 })
    }

    const { leadIds, subject, body: emailBody, fromName } = parsed.data
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Fetch agent profile for from address
    const admin = adminSupabase()
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Fetch leads belonging to this user
    const { data: leads, error: leadsErr } = await admin
      .from('property_leads')
      .select('id, name, email, status')
      .in('id', leadIds)
      .eq('user_id', user.id)
      .not('email', 'is', null)

    if (leadsErr) throw leadsErr

    const recipientLeads = (leads || []).filter(l => l.email && l.status !== 'archived')

    if (recipientLeads.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 })
    }

    const senderName = fromName || profile?.full_name || 'Your Agent'
    const fromAddress = `${senderName} <notifications@snap-r.com>`

    // Send emails (Resend free tier: 1 per call; use batch for paid)
    const results: Array<{ leadId: string; success: boolean; error?: string }> = []
    const activityRows: Array<{
      lead_id: string
      user_id: string
      activity_type: string
      body: string
      metadata: Record<string, unknown>
    }> = []
    let sent = 0
    let failed = 0

    for (const lead of recipientLeads) {
      // Personalise body: replace {{name}} template var
      const personalBody = emailBody
        .replace(/\{\{name\}\}/gi, lead.name || 'there')
        .replace(/\{\{first_name\}\}/gi, (lead.name || 'there').split(' ')[0])

      const { error: sendErr } = await resend.emails.send({
        from: fromAddress,
        to: lead.email!,
        subject,
        html: personalBody.includes('<') ? personalBody : `<p style="font-family:sans-serif;line-height:1.6;color:#333">${personalBody.replace(/\n/g, '<br>')}</p>`,
      })

      if (sendErr) {
        results.push({ leadId: lead.id, success: false, error: sendErr.message })
        failed++
      } else {
        results.push({ leadId: lead.id, success: true })
        sent++

        // Collect activity row for batch insert
        activityRows.push({
          lead_id: lead.id,
          user_id: user.id,
          activity_type: 'email',
          body: `Bulk email sent: "${subject}"`,
          metadata: { bulk: true, subject },
        })
      }
    }

    // Batch insert all activity records in a single query instead of N individual inserts
    if (activityRows.length > 0) {
      const { error: activityErr } = await admin.from('lead_activities').insert(activityRows)
      if (activityErr) {
        logger.error('[BulkEmail] Failed to batch-insert activities:', activityErr.message)
      }
    }

    return NextResponse.json({ sent, failed, total: recipientLeads.length, results })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Send failed'
    logger.error('[BulkEmail] POST error:', message)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Return recent bulk email activities for this user
    const admin = adminSupabase()
    const { data: activities } = await admin
      .from('lead_activities')
      .select('id, body, metadata, created_at')
      .eq('user_id', user.id)
      .eq('activity_type', 'email')
      .contains('metadata', { bulk: true })
      .order('created_at', { ascending: false })
      .limit(20)

    // Deduplicate by subject + timestamp bucket (group sends that happened together)
    const sendGroups: Record<string, { subject: string; count: number; at: string }> = {}
    for (const act of activities || []) {
      const meta = act.metadata as Record<string, unknown> | null
      const subject = (meta?.subject as string) || ''
      const bucket = `${subject}__${act.created_at?.slice(0, 16)}`
      if (!sendGroups[bucket]) {
        sendGroups[bucket] = { subject, count: 0, at: act.created_at || '' }
      }
      sendGroups[bucket].count++
    }

    const sends = Object.values(sendGroups)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 10)

    return NextResponse.json({ sends })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Fetch failed'
    logger.error('[BulkEmail] GET error:', message)
    return NextResponse.json({ error: 'Failed to fetch send history' }, { status: 500 })
  }
}
