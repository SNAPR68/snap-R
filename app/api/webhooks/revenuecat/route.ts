export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { handleRevenueCatWebhook } from '@/lib/revenuecat/webhook-handler'
import type { RevenueCatWebhookEvent } from '@/lib/revenuecat/types'

/**
 * RevenueCat webhook endpoint.
 * Receives subscription lifecycle events and syncs profiles.subscription_tier.
 *
 * Configure this URL in the RevenueCat dashboard:
 *   https://snap-r.com/api/webhooks/revenuecat
 *
 * Authentication: Bearer token matching REVENUECAT_WEBHOOK_AUTH_KEY.
 * RevenueCat retries on non-2xx responses.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.REVENUECAT_WEBHOOK_AUTH_KEY

    if (!expectedKey) {
      logger.error('[RevenueCat Webhook] REVENUECAT_WEBHOOK_AUTH_KEY not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 }
      )
    }

    // RevenueCat sends auth as Bearer token
    const providedKey = authHeader?.replace('Bearer ', '')
    if (providedKey !== expectedKey) {
      logger.warn('[RevenueCat Webhook] Invalid authentication')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse webhook payload
    const body = await request.json() as RevenueCatWebhookEvent

    if (!body.event?.type || !body.event?.app_user_id) {
      logger.warn('[RevenueCat Webhook] Invalid payload — missing event.type or event.app_user_id')
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // Process the event
    const result = await handleRevenueCatWebhook(body)

    logger.info(
      `[RevenueCat Webhook] Processed ${body.event.type}: ${result.action}`
    )

    return NextResponse.json({
      received: true,
      action: result.action,
      success: result.success,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[RevenueCat Webhook] Unhandled error:', message)

    // Return 500 so RevenueCat retries
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
