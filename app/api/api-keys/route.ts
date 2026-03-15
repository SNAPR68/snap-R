/**
 * SnapR API — API Key Management
 * GET /api/api-keys — List user's API keys
 * POST /api/api-keys — Create a new API key
 * DELETE /api/api-keys — Revoke an API key
 *
 * Uses session auth (dashboard), not API key auth.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/api-keys'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  expires_in_days: z.number().int().min(1).max(365).optional(),
})

const deleteSchema = z.object({
  id: z.string().uuid(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, rate_limit_per_minute, last_used_at, expires_at, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }

  return NextResponse.json({ keys: keys ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Limit number of active keys per user
  const { count } = await supabase
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)

  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: 'Maximum 10 active API keys allowed' },
      { status: 400 }
    )
  }

  const { key, keyPrefix, keyHash } = generateApiKey()

  const expiresAt = parsed.data.expires_in_days
    ? new Date(Date.now() + parsed.data.expires_in_days * 86400000).toISOString()
    : null

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      expires_at: expiresAt,
    })
    .select('id, name, key_prefix, created_at, expires_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }

  // Return the full key ONCE — it's never stored or shown again
  return NextResponse.json({
    key,
    api_key: apiKey,
    warning: 'Save this key — it will not be shown again.',
  }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
