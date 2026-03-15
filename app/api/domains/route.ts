/**
 * SnapR API — Custom Domain Management
 * POST — Add a custom domain
 * GET — List user's domains
 * PATCH — Re-verify a domain
 * DELETE — Remove a domain
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { getPlanLimits } from '@/lib/content/limits'

const domainCreateSchema = z.object({
  domain: z.string().min(3).max(253).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i, 'Invalid domain format'),
  target_type: z.enum(['property_site', 'portfolio', 'organization']).default('property_site'),
  target_id: z.string().uuid().optional(),
})

const domainDeleteSchema = z.object({
  id: z.string().uuid(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: domains, error } = await supabase
    .from('custom_domains')
    .select('id, domain, target_type, target_id, verification_status, verification_token, verified_at, brand_config, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })

  return NextResponse.json({ domains: domains ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const limits = getPlanLimits(profile?.subscription_tier ?? 'free')
  if (!limits.canCustomDomain) {
    return NextResponse.json(
      { error: 'Custom domains require an Enterprise plan' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = domainCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const verificationToken = randomBytes(16).toString('hex')

  const { data: domain, error } = await supabase
    .from('custom_domains')
    .insert({
      user_id: user.id,
      domain: parsed.data.domain.toLowerCase(),
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id ?? null,
      verification_token: verificationToken,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
  }

  return NextResponse.json({
    domain,
    instructions: {
      step1: `Add a TXT record to your DNS for _snapr-verify.${parsed.data.domain}`,
      value: `snapr-verify=${verificationToken}`,
      step2: `Add a CNAME record: ${parsed.data.domain} → custom.snap-r.com`,
      note: 'Verification runs automatically every 6 hours, or click "Verify Now" in settings.',
    },
  }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id } = body
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Valid domain ID required' }, { status: 400 })
  }

  // Reset verification status to trigger re-check
  const { error } = await supabase
    .from('custom_domains')
    .update({ verification_status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 })

  return NextResponse.json({ success: true, message: 'Verification re-queued' })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = domainDeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid domain ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('custom_domains')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })

  return NextResponse.json({ success: true })
}
