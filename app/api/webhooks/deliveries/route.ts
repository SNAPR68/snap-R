/**
 * /api/webhooks/deliveries
 * GET ?webhookId=<id>&limit=50 — paginated delivery log for a webhook
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

import { logger } from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('webhookId')
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))

    const admin = adminSupabase()

    // Verify webhook belongs to user
    if (webhookId) {
      const { data: webhook } = await admin
        .from('outgoing_webhooks')
        .select('id')
        .eq('id', webhookId)
        .eq('user_id', user.id)
        .single()
      if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Get all webhook IDs for this user (to scope deliveries if no specific webhook)
    let webhookIds: string[]
    if (webhookId) {
      webhookIds = [webhookId]
    } else {
      const { data: userWebhooks } = await admin
        .from('outgoing_webhooks')
        .select('id')
        .eq('user_id', user.id)
      webhookIds = (userWebhooks || []).map(w => w.id)
    }

    if (webhookIds.length === 0) {
      return NextResponse.json({ deliveries: [] })
    }

    const { data: deliveries, error } = await admin
      .from('webhook_deliveries')
      .select('id, webhook_id, event, status_code, success, response_body, created_at')
      .in('webhook_id', webhookIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ deliveries: deliveries || [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch deliveries'
    logger.error('[WebhookDeliveries] GET error:', message)
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 })
  }
}
