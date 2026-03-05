/**
 * /api/webhooks/outgoing
 * GET    — List user's outgoing webhooks
 * POST   — Create a new webhook
 * PATCH  — Update an existing webhook
 * DELETE — Delete a webhook
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  parseBody,
  webhookCreateSchema,
  webhookUpdateSchema,
  webhookDeleteSchema,
} from '@/lib/validation/schemas'

// ── GET — list webhooks ──────────────────────────────────────────

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: webhooks, error } = await supabase
      .from('outgoing_webhooks')
      .select('id, url, events, secret, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ webhooks: webhooks ?? [] })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// ── POST — create webhook ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = parseBody(webhookCreateSchema, body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { url, events, secret } = parsed.data

    const { data: webhook, error } = await supabase
      .from('outgoing_webhooks')
      .insert({
        user_id: user.id,
        url,
        events,
        secret: secret ?? null,
      })
      .select('id, url, events, is_active, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ webhook }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// ── PATCH — update webhook ───────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = parseBody(webhookUpdateSchema, body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { id, ...updates } = parsed.data

    // Build update payload — only include fields that were provided
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.url !== undefined) updatePayload.url = updates.url
    if (updates.events !== undefined) updatePayload.events = updates.events
    if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active
    if (updates.secret !== undefined) updatePayload.secret = updates.secret

    const { data: webhook, error } = await supabase
      .from('outgoing_webhooks')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, url, events, is_active, secret, created_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return NextResponse.json({ webhook })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// ── DELETE — delete webhook ──────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = parseBody(webhookDeleteSchema, body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error, details: parsed.details },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('outgoing_webhooks')
      .delete()
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
