/**
 * SnapR API — Photographer Delivery Links
 * =========================================
 * POST:   Create delivery link(s) — single or bulk (multiple clients/listings)
 * GET:    List delivery links for the photographer (with stats)
 * PATCH:  Revoke or update a delivery link
 *
 * Delivery links power /deliver/[token] — the photographer-branded client page.
 * No SnapR branding visible to clients. Shows photographer's org branding.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { randomBytes } from 'node:crypto'

function generateToken(): string {
  return randomBytes(10).toString('hex') // 20-char hex token
}

// ----------------------------------------
// Schemas
// ----------------------------------------

const singleDeliverySchema = z.object({
  listingId: z.string().uuid(),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().max(200),
  clientId: z.string().uuid().optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
  allowDownload: z.boolean().default(true),
  expiresInDays: z.number().int().min(1).max(365).optional().nullable(),
  sendEmail: z.boolean().default(true),
})

const bulkDeliverySchema = z.object({
  deliveries: z.array(singleDeliverySchema).min(1).max(50),
})

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'revoked']).optional(),
  message: z.string().max(1000).optional().nullable(),
})

// ----------------------------------------
// POST — Create delivery link(s)
// ----------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const admin = adminSupabase()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'

    // Detect bulk vs single
    const isBulk = Array.isArray(body.deliveries)
    const deliveries = isBulk ? body.deliveries : [body]

    const bulkParsed = bulkDeliverySchema.safeParse({ deliveries })
    if (!bulkParsed.success) {
      return NextResponse.json({ error: bulkParsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 })
    }

    // Fetch photographer's org for branding in emails
    const { data: org } = await admin
      .from('organizations')
      .select('id, name, platform_name, logo_url, primary_color')
      .eq('owner_id', user.id)
      .single()

    // Fetch photographer profile for name
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const photographerName = profile?.full_name ?? org?.platform_name ?? 'Your Photographer'
    const studioName = org?.platform_name ?? org?.name ?? photographerName

    const created: Array<{ token: string; url: string; clientEmail: string; clientName: string; listingId: string }> = []
    const errors: string[] = []
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

    for (const delivery of bulkParsed.data.deliveries) {
      try {
        // Verify photographer owns this listing
        const { data: listing } = await admin
          .from('listings')
          .select('id, address, city, state, title')
          .eq('id', delivery.listingId)
          .eq('user_id', user.id)
          .single()

        if (!listing) {
          errors.push(`Listing ${delivery.listingId}: not found or unauthorized`)
          continue
        }

        const token = generateToken()
        const expiresAt = delivery.expiresInDays
          ? new Date(Date.now() + delivery.expiresInDays * 86400000).toISOString()
          : null

        const { data: link, error: insertErr } = await admin
          .from('delivery_links')
          .insert({
            photographer_id: user.id,
            listing_id: delivery.listingId,
            client_id: delivery.clientId ?? null,
            organization_id: org?.id ?? null,
            token,
            client_name: delivery.clientName,
            client_email: delivery.clientEmail,
            allow_download: delivery.allowDownload,
            expires_at: expiresAt,
            message: delivery.message ?? null,
            status: 'active',
          })
          .select('id, token')
          .single()

        if (insertErr || !link) {
          errors.push(`Listing ${delivery.listingId}: ${insertErr?.message ?? 'insert failed'}`)
          continue
        }

        const deliveryUrl = `${baseUrl}/deliver/${link.token}`
        created.push({
          token: link.token,
          url: deliveryUrl,
          clientEmail: delivery.clientEmail,
          clientName: delivery.clientName,
          listingId: delivery.listingId,
        })

        // Update client stats if client_id provided
        if (delivery.clientId) {
          await admin
            .from('photographer_clients')
            .update({
              total_deliveries: admin.from('photographer_clients').select('total_deliveries'),
              last_delivery_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', delivery.clientId)
            .eq('photographer_id', user.id)
        }

        // Send delivery email to client
        if (delivery.sendEmail && resend) {
          const propertyLabel = [listing.address, listing.city, listing.state].filter(Boolean).join(', ')
            || listing.title
            || 'Your Property'

          const primaryColor = org?.primary_color ?? '#D4A017'

          try {
            await resend.emails.send({
              from: `${studioName} <notifications@snap-r.com>`,
              replyTo: user.email ?? undefined,
              to: delivery.clientEmail,
              subject: `Your photos are ready — ${propertyLabel}`,
              html: buildDeliveryEmail({
                clientName: delivery.clientName,
                photographerName,
                studioName,
                propertyLabel,
                deliveryUrl,
                message: delivery.message ?? null,
                primaryColor,
                logoUrl: org?.logo_url ?? null,
                expiresAt,
              }),
            })
          } catch {
            // Email failure doesn't fail the delivery creation
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Listing ${delivery.listingId}: ${msg}`)
      }
    }

    return NextResponse.json({
      success: created.length > 0,
      created,
      errors: errors.length > 0 ? errors : undefined,
      total: created.length,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ----------------------------------------
// GET — List delivery links
// ----------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const listingId = url.searchParams.get('listing_id')
    const clientId = url.searchParams.get('client_id')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200)

    const admin = adminSupabase()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'

    let query = admin
      .from('delivery_links')
      .select(`
        id, token, listing_id, client_id, client_name, client_email,
        allow_download, expires_at, status, message,
        viewed_at, downloaded_at, download_count, created_at,
        listings!delivery_links_listing_id_fkey(address, city, state, title)
      `)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (listingId) query = query.eq('listing_id', listingId)
    if (clientId) query = query.eq('client_id', clientId)

    const { data: links, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Enrich with delivery URLs
    const enriched = (links || []).map(l => ({
      ...l,
      url: `${baseUrl}/deliver/${l.token}`,
    }))

    return NextResponse.json({ links: enriched, total: enriched.length })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ----------------------------------------
// PATCH — Revoke / update delivery link
// ----------------------------------------

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

    const { id, ...updates } = parsed.data
    const admin = adminSupabase()

    const { error } = await admin
      .from('delivery_links')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('photographer_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ----------------------------------------
// Email template builder
// ----------------------------------------

interface DeliveryEmailParams {
  clientName: string
  photographerName: string
  studioName: string
  propertyLabel: string
  deliveryUrl: string
  message: string | null
  primaryColor: string
  logoUrl: string | null
  expiresAt: string | null
}

function buildDeliveryEmail(p: DeliveryEmailParams): string {
  const expiry = p.expiresAt
    ? `<p style="color:#888;font-size:13px;margin:16px 0 0;">This link expires on ${new Date(p.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>`
    : ''

  const logo = p.logoUrl
    ? `<img src="${p.logoUrl}" alt="${p.studioName}" style="max-height:50px;max-width:200px;margin-bottom:16px;" />`
    : `<div style="font-size:22px;font-weight:700;color:${p.primaryColor};margin-bottom:16px;">${p.studioName}</div>`

  const message = p.message
    ? `<div style="background:#1A1A1A;border-radius:10px;padding:20px;margin-bottom:24px;border-left:3px solid ${p.primaryColor};">
        <p style="color:#ccc;font-size:15px;margin:0;line-height:1.6;white-space:pre-wrap;">${p.message}</p>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:36px;">
      ${logo}
    </div>

    <div style="background:#141414;border-radius:14px;padding:32px;margin-bottom:24px;border:1px solid #222;">
      <p style="color:#fff;font-size:17px;margin:0 0 18px;line-height:1.6;">Hi ${p.clientName},</p>
      <p style="color:#ddd;font-size:15px;margin:0 0 18px;line-height:1.6;">
        Your photos for <strong style="color:#fff;">${p.propertyLabel}</strong> are ready for download.
      </p>
      ${message}
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${p.deliveryUrl}"
           style="display:inline-block;background:${p.primaryColor};color:#000;padding:15px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;">
          View &amp; Download Photos
        </a>
      </div>
      ${expiry}
    </div>

    <div style="background:#141414;border-radius:12px;padding:20px;border:1px solid #222;">
      <p style="color:#888;font-size:13px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.08em;">Delivered by</p>
      <p style="color:#fff;font-size:15px;font-weight:600;margin:0;">${p.photographerName}</p>
    </div>

    <p style="color:#444;font-size:12px;text-align:center;margin:28px 0 0;line-height:1.6;">
      If you have questions, reply to this email directly.
    </p>
  </div>
</body>
</html>`
}
