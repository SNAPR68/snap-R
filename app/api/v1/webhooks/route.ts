/**
 * SnapR API v1 — Webhooks
 * GET /api/v1/webhooks — List outgoing webhooks
 * POST /api/v1/webhooks — Create a webhook
 * PATCH /api/v1/webhooks — Update a webhook
 * DELETE /api/v1/webhooks — Delete a webhook
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'
import { webhookCreateSchema, webhookUpdateSchema, webhookDeleteSchema, parseBody } from '@/lib/validation/schemas'

export const GET = withApiAuth(async (ctx) => {
  const { data: webhooks, error } = await ctx.supabase
    .from('outgoing_webhooks')
    .select('id, url, events, is_active, created_at, updated_at')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: { message: 'Failed to fetch webhooks', code: 'internal_error' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: webhooks ?? [] })
})

export const POST = withApiAuth(async (ctx) => {
  const body = await ctx.request.json()
  const parsed = parseBody(webhookCreateSchema, body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error, code: 'validation_error', details: parsed.details } },
      { status: 400 }
    )
  }

  const { data: webhook, error } = await ctx.supabase
    .from('outgoing_webhooks')
    .insert({
      user_id: ctx.userId,
      url: parsed.data.url,
      events: parsed.data.events,
      secret: parsed.data.secret ?? null,
      is_active: true,
    })
    .select('id, url, events, is_active, created_at')
    .single()

  if (error) {
    return NextResponse.json(
      { error: { message: 'Failed to create webhook', code: 'internal_error' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: webhook }, { status: 201 })
})

export const PATCH = withApiAuth(async (ctx) => {
  const body = await ctx.request.json()
  const parsed = parseBody(webhookUpdateSchema, body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error, code: 'validation_error', details: parsed.details } },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.url !== undefined) updates.url = parsed.data.url
  if (parsed.data.events !== undefined) updates.events = parsed.data.events
  if (parsed.data.secret !== undefined) updates.secret = parsed.data.secret
  if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active

  const { data: webhook, error } = await ctx.supabase
    .from('outgoing_webhooks')
    .update(updates)
    .eq('id', parsed.data.id)
    .eq('user_id', ctx.userId)
    .select('id, url, events, is_active, updated_at')
    .single()

  if (error) {
    return NextResponse.json(
      { error: { message: 'Failed to update webhook', code: 'internal_error' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: webhook })
})

export const DELETE = withApiAuth(async (ctx) => {
  const body = await ctx.request.json()
  const parsed = parseBody(webhookDeleteSchema, body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error, code: 'validation_error', details: parsed.details } },
      { status: 400 }
    )
  }

  const { error } = await ctx.supabase
    .from('outgoing_webhooks')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', ctx.userId)

  if (error) {
    return NextResponse.json(
      { error: { message: 'Failed to delete webhook', code: 'internal_error' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { success: true } })
})
