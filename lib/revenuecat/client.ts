/**
 * RevenueCat server-side API v1 client.
 * Uses REVENUECAT_API_KEY (secret key) for all API calls.
 * Reference: https://www.revenuecat.com/reference/basic
 */

import { logger } from '@/lib/logger'
import { getListingLimits, type PlanType } from '@/lib/content/limits'
import type {
  RevenueCatSubscriberInfo,
  RevenueCatEntitlement,
  ResolvedSubscriberTier,
} from './types'
import { RC_ENTITLEMENTS } from './types'

const RC_API_BASE = 'https://api.revenuecat.com/v1'

function getApiKey(): string {
  const key = process.env.REVENUECAT_API_KEY
  if (!key) {
    throw new Error('REVENUECAT_API_KEY is not configured')
  }
  return key
}

/**
 * Fetch full subscriber info from RevenueCat.
 */
export async function getSubscriberInfo(
  appUserId: string
): Promise<RevenueCatSubscriberInfo> {
  const response = await fetch(
    `${RC_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`RevenueCat API error ${response.status}: ${text}`)
  }

  return response.json() as Promise<RevenueCatSubscriberInfo>
}

/**
 * Create or get a subscriber in RevenueCat.
 * Uses GET which creates the subscriber if they don't exist.
 */
export async function ensureSubscriber(appUserId: string): Promise<void> {
  try {
    await getSubscriberInfo(appUserId)
  } catch (error: unknown) {
    logger.warn(
      '[RevenueCat] Failed to ensure subscriber:',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

/**
 * Get active entitlements from subscriber info.
 * Returns only entitlements that haven't expired.
 */
function getActiveEntitlements(
  entitlements: Record<string, RevenueCatEntitlement>
): Set<string> {
  const now = Date.now()
  const active = new Set<string>()

  for (const [entitlementId, entitlement] of Object.entries(entitlements)) {
    // No expiry = lifetime / active
    if (!entitlement.expires_date) {
      active.add(entitlementId)
      continue
    }
    // Check if not expired
    if (new Date(entitlement.expires_date).getTime() > now) {
      active.add(entitlementId)
    }
  }

  return active
}

/**
 * Map active entitlements to SnapR PlanType.
 * Priority: enterprise > agency > pro > starter > free
 * Each tier is a strict superset of the tier below.
 */
function entitlementsToTier(activeEntitlements: Set<string>): PlanType {
  if (activeEntitlements.has(RC_ENTITLEMENTS.API_ACCESS)) return 'enterprise'
  if (activeEntitlements.has(RC_ENTITLEMENTS.EMBEDS)) return 'agency'
  if (activeEntitlements.has(RC_ENTITLEMENTS.PUBLISHING)) return 'pro'
  if (activeEntitlements.has(RC_ENTITLEMENTS.CONTENT_STUDIO)) return 'starter'
  return 'free'
}

/**
 * Extract listing count from a RevenueCat product identifier.
 * Product IDs follow the pattern: {plan}_{billing}_{listingCount}
 * e.g., "pro_monthly_50" → 50, "enterprise_annual" → 9999
 */
function productToListingLimit(productId: string | null): number | null {
  if (!productId) return null

  // Enterprise products don't have listing counts in the ID
  if (productId.includes('enterprise')) return 9999

  // Extract trailing number: "pro_monthly_50" → "50"
  const match = productId.match(/_(\d+)$/)
  if (match) return parseInt(match[1], 10)

  return null
}

/**
 * Determine subscription status from RevenueCat subscriber data.
 */
function resolveStatus(
  subscriptions: Record<string, { billing_issues_detected_at: string | null; unsubscribe_detected_at: string | null; expires_date: string | null; period_type: string }>,
  activeEntitlements: Set<string>
): ResolvedSubscriberTier['status'] {
  if (activeEntitlements.size === 0) return 'inactive'

  // Check all active subscriptions for billing issues
  for (const sub of Object.values(subscriptions)) {
    if (sub.billing_issues_detected_at) return 'past_due'
    if (sub.period_type === 'TRIAL') return 'trial'
    if (sub.unsubscribe_detected_at) {
      // Still active but set to cancel at period end
      const expiresAt = sub.expires_date ? new Date(sub.expires_date).getTime() : 0
      if (expiresAt > Date.now()) return 'active' // Still in paid period
      return 'canceled'
    }
  }

  return 'active'
}

/**
 * Resolve a subscriber's SnapR tier from RevenueCat.
 * This is the main function used by the webhook handler and sync utility.
 */
export async function resolveSubscriberTier(
  appUserId: string
): Promise<ResolvedSubscriberTier> {
  const info = await getSubscriberInfo(appUserId)
  const { subscriber } = info

  const activeEntitlements = getActiveEntitlements(subscriber.entitlements)
  const tier = entitlementsToTier(activeEntitlements)

  // Find the primary active subscription's product ID
  let primaryProductId: string | null = null
  let expiresAt: string | null = null

  for (const [productId, sub] of Object.entries(subscriber.subscriptions)) {
    const subExpires = sub.expires_date ? new Date(sub.expires_date).getTime() : Infinity
    if (subExpires > Date.now()) {
      primaryProductId = productId
      expiresAt = sub.expires_date
      break
    }
  }

  // Also check entitlements for product ID
  if (!primaryProductId) {
    for (const entitlement of Object.values(subscriber.entitlements)) {
      if (entitlement.product_identifier) {
        primaryProductId = entitlement.product_identifier
        expiresAt = entitlement.expires_date
        break
      }
    }
  }

  // Resolve listing/photo limits
  const listingCountFromProduct = productToListingLimit(primaryProductId)
  const tierLimits = getListingLimits(tier)
  const listingsLimit = listingCountFromProduct ?? tierLimits.listings
  const photosLimit = tierLimits.photos

  const status = resolveStatus(
    subscriber.subscriptions as Record<string, { billing_issues_detected_at: string | null; unsubscribe_detected_at: string | null; expires_date: string | null; period_type: string }>,
    activeEntitlements
  )

  return {
    tier,
    status,
    listingsLimit,
    photosLimit,
    productId: primaryProductId,
    expiresAt,
  }
}

/**
 * Get the Stripe customer ID associated with a RevenueCat subscriber.
 * RevenueCat stores this in the subscriber's attributes when Stripe is the store.
 */
export async function getStripeCustomerId(
  appUserId: string
): Promise<string | null> {
  try {
    const info = await getSubscriberInfo(appUserId)
    // Check subscriber attributes for stripe_customer_id
    const attrs = info.subscriber as unknown as {
      subscriber_attributes?: Record<string, { value: string }>
    }
    return attrs?.subscriber_attributes?.['$stripeCustomerId']?.value ?? null
  } catch {
    return null
  }
}

// Re-export for convenience
export { entitlementsToTier, getActiveEntitlements, productToListingLimit }
