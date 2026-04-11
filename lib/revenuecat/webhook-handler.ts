/**
 * RevenueCat webhook event handler.
 * Processes subscription lifecycle events and syncs profiles.subscription_tier.
 * Replaces the subscription management logic from the Stripe webhook.
 *
 * All 11 billing gate locations in the codebase read from profiles.subscription_tier
 * via getPlanLimits(). This handler writes to that column, keeping gates unchanged.
 */

import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getListingLimits } from '@/lib/content/limits'
import { resolveSubscriberTier } from './client'
import type { RevenueCatWebhookEvent, RevenueCatWebhookEventType } from './types'

/**
 * Process a RevenueCat webhook event.
 * Uses always-complete semantics — logs errors but doesn't throw.
 */
export async function handleRevenueCatWebhook(
  payload: RevenueCatWebhookEvent
): Promise<{ success: boolean; action: string }> {
  const { event } = payload
  const appUserId = event.app_user_id
  const eventType = event.type
  const eventId = event.id

  logger.info(`[RevenueCat Webhook] ${eventType} for user ${appUserId}`, {
    eventId,
    productId: event.product_id,
    store: event.store,
    environment: event.environment,
  })

  const supabase = adminSupabase()

  // Idempotency check — same pattern as Stripe webhook
  const { data: existing } = await supabase
    .from('processed_webhook_events')
    .select('event_id')
    .eq('event_id', eventId)
    .maybeSingle()

  if (existing) {
    logger.info(`[RevenueCat Webhook] Duplicate event ${eventId}, skipping`)
    return { success: true, action: 'duplicate_skipped' }
  }

  // Record event ID for idempotency
  try {
    await supabase
      .from('processed_webhook_events')
      .insert({ event_id: eventId, event_type: eventType })
  } catch {
    // Ignore constraint violation from race condition
  }

  try {
    const action = await processEvent(supabase, appUserId, eventType, event)
    return { success: true, action }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`[RevenueCat Webhook] Error processing ${eventType}:`, message)
    return { success: false, action: `error: ${message}` }
  }
}

async function processEvent(
  supabase: ReturnType<typeof adminSupabase>,
  appUserId: string,
  eventType: RevenueCatWebhookEventType,
  event: RevenueCatWebhookEvent['event']
): Promise<string> {
  switch (eventType) {
    case 'TEST':
      logger.info('[RevenueCat Webhook] Test event received')
      return 'test_acknowledged'

    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'NON_RENEWING_PURCHASE':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
      return handleSubscriptionActive(supabase, appUserId, eventType)

    case 'CANCELLATION':
    case 'EXPIRATION':
      return handleSubscriptionEnded(supabase, appUserId, eventType)

    case 'BILLING_ISSUE':
      return handleBillingIssue(supabase, appUserId)

    case 'SUBSCRIPTION_PAUSED':
      return handleSubscriptionPaused(supabase, appUserId)

    case 'SUBSCRIBER_ALIAS':
      logger.info(`[RevenueCat Webhook] Subscriber alias for ${appUserId}`)
      return 'alias_logged'

    case 'TRANSFER': {
      // Transfer: new user gets the subscription, old user loses it
      const newUserId = event.app_user_id
      const originalUserId = event.original_app_user_id
      if (newUserId !== originalUserId) {
        await handleSubscriptionActive(supabase, newUserId, 'TRANSFER')
        await handleSubscriptionEnded(supabase, originalUserId, 'TRANSFER')
      }
      return 'transfer_processed'
    }

    default:
      logger.warn(`[RevenueCat Webhook] Unhandled event type: ${eventType}`)
      return `unhandled_${eventType}`
  }
}

/**
 * Handle events that activate or renew a subscription.
 * Resolves the tier from RevenueCat and updates the profile.
 */
async function handleSubscriptionActive(
  supabase: ReturnType<typeof adminSupabase>,
  appUserId: string,
  eventType: string
): Promise<string> {
  // Resolve the current tier from RevenueCat's authoritative state
  const resolved = await resolveSubscriberTier(appUserId)

  const limits = getListingLimits(resolved.tier)

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: resolved.tier,
      plan: resolved.tier,
      subscription_status: resolved.status === 'trial' ? 'active' : resolved.status,
      listings_limit: resolved.listingsLimit || limits.listings,
      photos_per_listing: resolved.photosLimit || limits.photos,
      revenuecat_app_user_id: appUserId,
      last_payment_date: new Date().toISOString(),
      // Reset usage on new subscription / renewal
      ...(eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL'
        ? { listings_used_this_month: 0 }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', appUserId)

  if (error) {
    logger.error(
      `[RevenueCat Webhook] Profile update failed for ${appUserId}:`,
      error.message
    )
    throw new Error(`Profile update failed: ${error.message}`)
  }

  logger.info(
    `[RevenueCat Webhook] ${eventType}: ${appUserId} → tier=${resolved.tier}, status=${resolved.status}, listings=${resolved.listingsLimit}`
  )

  return `${eventType.toLowerCase()}_tier_${resolved.tier}`
}

/**
 * Handle events that end a subscription (cancellation, expiration).
 * Downgrades the user to the free tier.
 */
async function handleSubscriptionEnded(
  supabase: ReturnType<typeof adminSupabase>,
  appUserId: string,
  eventType: string
): Promise<string> {
  const freeLimits = getListingLimits('free')

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
      plan: 'free',
      subscription_status: eventType === 'EXPIRATION' ? 'expired' : 'canceled',
      listings_limit: freeLimits.listings,
      photos_per_listing: freeLimits.photos,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appUserId)

  if (error) {
    logger.error(
      `[RevenueCat Webhook] Downgrade failed for ${appUserId}:`,
      error.message
    )
    throw new Error(`Downgrade failed: ${error.message}`)
  }

  logger.info(
    `[RevenueCat Webhook] ${eventType}: ${appUserId} → downgraded to free`
  )

  return `${eventType.toLowerCase()}_downgraded`
}

/**
 * Handle billing issues (failed payment, card expired, etc.).
 * Sets subscription_status to past_due but doesn't downgrade tier yet.
 * RevenueCat will send EXPIRATION if the grace period ends without payment.
 */
async function handleBillingIssue(
  supabase: ReturnType<typeof adminSupabase>,
  appUserId: string
): Promise<string> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appUserId)

  if (error) {
    logger.error(
      `[RevenueCat Webhook] Billing issue update failed for ${appUserId}:`,
      error.message
    )
  }

  logger.info(
    `[RevenueCat Webhook] BILLING_ISSUE: ${appUserId} → past_due`
  )

  return 'billing_issue_past_due'
}

/**
 * Handle subscription paused (Android only, not applicable for Stripe/web).
 */
async function handleSubscriptionPaused(
  supabase: ReturnType<typeof adminSupabase>,
  appUserId: string
): Promise<string> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appUserId)

  if (error) {
    logger.error(
      `[RevenueCat Webhook] Pause update failed for ${appUserId}:`,
      error.message
    )
  }

  return 'subscription_paused'
}
