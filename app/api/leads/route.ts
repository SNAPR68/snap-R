/**
 * SnapR API — Property Leads
 * ===========================
 * POST: Public endpoint for property site visitors to submit leads (no auth)
 * GET:  Authenticated endpoint for agents to fetch their leads (dashboard)
 * PATCH: Authenticated endpoint for agents to update lead status
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { adminSupabase } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'

import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/utils/client-ip';
import { checkRateLimitAsync } from '@/lib/rate-limit';
// ============================================
// Zod Schemas
// ============================================

const leadSubmitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').max(200),
  phone: z.string().max(30).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  listingId: z.string().uuid().optional().nullable(),
  propertySiteId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid(), // The agent who owns the listing
  listingAddress: z.string().max(500).optional().nullable(),
  agentEmail: z.string().email().optional().nullable(),
  // UTM attribution
  utmSource: z.string().max(100).optional().nullable(),
  utmMedium: z.string().max(100).optional().nullable(),
  utmCampaign: z.string().max(100).optional().nullable(),
  utmContent: z.string().max(200).optional().nullable(),
})

const leadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'archived']),
})

// ============================================
// POST — Submit a lead (public, no auth)
// ============================================

export async function POST(request: NextRequest) {
  // Rate limit: 5 req/min per IP (public endpoint, prevent spam)
  const ip = getClientIp(request.headers);
  const { success: withinLimit } = await checkRateLimitAsync(`leads:${ip}`, 5, 60_000);
  if (!withinLimit) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    const body = await request.json()
    const parsed = leadSubmitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const {
      name, email, phone, message,
      listingId, propertySiteId, userId, listingAddress, agentEmail,
      utmSource, utmMedium, utmCampaign, utmContent,
    } = parsed.data

    const supabase = adminSupabase()

    // Insert lead
    const { error: insertError } = await supabase
      .from('property_leads')
      .insert({
        user_id: userId,
        listing_id: listingId ?? null,
        property_site_id: propertySiteId ?? null,
        name,
        email,
        phone: phone ?? null,
        message: message ?? null,
        utm_source: utmSource ?? null,
        utm_medium: utmMedium ?? null,
        utm_campaign: utmCampaign ?? null,
        utm_content: utmContent ?? null,
        status: 'new',
      })

    if (insertError) {
      logger.error('[Leads] Insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    // Increment leads counter on property_sites
    // NOTE: This is a read-then-write pattern with a potential race condition
    // under high concurrency. An RPC function (e.g. increment_property_site_leads)
    // would be ideal but requires a DB migration. The race window is small
    // (single-user property sites) so the risk is acceptable for now.
    if (propertySiteId) {
      const { data: site } = await supabase
        .from('property_sites')
        .select('leads')
        .eq('id', propertySiteId)
        .single()

      if (site) {
        await supabase
          .from('property_sites')
          .update({ leads: (site.leads || 0) + 1 })
          .eq('id', propertySiteId)
      }
    }

    // Send notification email to agent
    const recipientEmail = agentEmail || process.env.DEFAULT_NOTIFICATION_EMAIL || 'support@snap-r.com'
    const resend = new Resend(process.env.RESEND_API_KEY)

    const sourceLabel = utmSource
      ? ` via ${utmSource.charAt(0).toUpperCase() + utmSource.slice(1)}`
      : ''

    try {
      await resend.emails.send({
        from: 'SnapR Property Leads <noreply@snap-r.com>',
        to: [recipientEmail],
        replyTo: email,
        subject: `New Lead${sourceLabel}: ${listingAddress || 'Your Property'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #D4A017; font-size: 24px; margin: 0;">New Property Lead</h1>
              </div>
              ${listingAddress ? `
              <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
                <p style="color: #888; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">Property</p>
                <p style="color: #fff; font-size: 18px; margin: 0; font-weight: 600;">${listingAddress}</p>
              </div>
              ` : ''}
              <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
                <h2 style="color: #D4A017; font-size: 16px; margin: 0 0 16px 0;">Contact Information</h2>
                <div style="margin-bottom: 12px;">
                  <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">Name</p>
                  <p style="color: #fff; font-size: 16px; margin: 0;">${name}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">Email</p>
                  <p style="color: #fff; font-size: 16px; margin: 0;">
                    <a href="mailto:${email}" style="color: #D4A017; text-decoration: none;">${email}</a>
                  </p>
                </div>
                ${phone ? `
                <div style="margin-bottom: 12px;">
                  <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">Phone</p>
                  <p style="color: #fff; font-size: 16px; margin: 0;">
                    <a href="tel:${phone}" style="color: #D4A017; text-decoration: none;">${phone}</a>
                  </p>
                </div>
                ` : ''}
                ${utmSource ? `
                <div>
                  <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">Source</p>
                  <p style="color: #fff; font-size: 16px; margin: 0;">${utmSource.charAt(0).toUpperCase() + utmSource.slice(1)} (${utmCampaign || 'organic'})</p>
                </div>
                ` : ''}
              </div>
              ${message ? `
              <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
                <h2 style="color: #D4A017; font-size: 16px; margin: 0 0 16px 0;">Message</h2>
                <p style="color: #fff; font-size: 16px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              ` : ''}
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Reply to ${name}
                </a>
              </div>
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  This lead was captured via your SnapR property page.
                </p>
                <p style="color: #666; font-size: 12px; margin: 8px 0 0 0;">
                  <a href="https://snap-r.com/dashboard/leads" style="color: #D4A017; text-decoration: none;">View all leads in your dashboard</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      })
    } catch (emailError: unknown) {
      const msg = emailError instanceof Error ? emailError.message : 'Unknown email error'
      logger.error('[Leads] Email notification error:', msg)
      // Don't fail the lead submission if email fails
    }

    // Send confirmation to visitor
    try {
      await resend.emails.send({
        from: 'SnapR <noreply@snap-r.com>',
        to: [email],
        subject: `Your inquiry about ${listingAddress || 'the property'} has been sent`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #D4A017; font-size: 24px; margin: 0;">Thanks for Your Interest!</h1>
              </div>
              <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
                <p style="color: #fff; font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">Hi ${name},</p>
                <p style="color: #fff; font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">We've received your inquiry about <strong>${listingAddress || 'the property'}</strong> and forwarded it to the listing agent.</p>
                <p style="color: #fff; font-size: 16px; margin: 0; line-height: 1.6;">They'll be in touch with you soon!</p>
              </div>
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px; margin: 0;"><a href="https://snap-r.com" style="color: #D4A017; text-decoration: none;">Powered by SnapR</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      })
    } catch {
      // Confirmation email failure is not critical
    }

    // Auto-enroll in first active drip sequence for this agent (non-blocking)
    try {
      const { data: newLead } = await supabase
        .from('property_leads')
        .select('id')
        .eq('user_id', userId)
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (newLead) {
        const { data: sequences } = await supabase
          .from('drip_sequences')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('trigger_type', 'new_lead')
          .order('created_at', { ascending: true })
          .limit(1)

        if (sequences && sequences.length > 0) {
          await supabase.from('drip_enrollments').insert({
            lead_id: newLead.id,
            sequence_id: sequences[0].id,
            user_id: userId,
            status: 'active',
            current_step: 0,
            enrolled_at: new Date().toISOString(),
          })
        }

        // Dispatch lead.created webhook (fire-and-forget, non-blocking)
        dispatchWebhookEvent(userId, 'lead.created', {
          leadId: newLead.id,
          name,
          email,
          phone: phone ?? undefined,
          message: message ?? undefined,
          listingId: listingId ?? undefined,
          listingAddress: listingAddress ?? undefined,
          utmSource: utmSource ?? undefined,
          utmMedium: utmMedium ?? undefined,
          utmCampaign: utmCampaign ?? undefined,
        }).catch(() => { /* non-critical */ })
      }
    } catch {
      // Drip enrollment / webhook failure is non-critical
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Leads] POST error:', message)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// ============================================
// GET — Fetch leads for dashboard (authenticated)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const listingId = url.searchParams.get('listing_id')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)

    const admin = adminSupabase()

    let query = admin
      .from('property_leads')
      .select(`
        id, name, email, phone, message,
        utm_source, utm_medium, utm_campaign, utm_content,
        status, created_at, updated_at,
        listing_id,
        listings!property_leads_listing_id_fkey(address, city, state, title)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }
    if (listingId) {
      query = query.eq('listing_id', listingId)
    }
    if (from) {
      query = query.gte('created_at', from)
    }
    if (to) {
      query = query.lte('created_at', to)
    }

    const { data: leads, error } = await query

    if (error) {
      logger.error('[Leads] GET error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get total count for this user
    const { count } = await admin
      .from('property_leads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get new leads count (today)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: newToday } = await admin
      .from('property_leads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'new')
      .gte('created_at', todayStart.toISOString())

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      newToday: newToday || 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Leads] GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ============================================
// PATCH — Update lead status (authenticated)
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = leadStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { id, status } = parsed.data

    // Use user-scoped supabase to ensure RLS enforcement
    const { error } = await supabase
      .from('property_leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id) // Extra safety: only update own leads

    if (error) {
      logger.error('[Leads] PATCH error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Dispatch lead.updated webhook (fire-and-forget)
    dispatchWebhookEvent(user.id, 'lead.updated', { leadId: id, status })
      .catch(() => { /* non-critical */ })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Leads] PATCH error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
