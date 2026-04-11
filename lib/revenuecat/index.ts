/**
 * RevenueCat integration barrel export.
 */

export {
  getSubscriberInfo,
  resolveSubscriberTier,
  ensureSubscriber,
  getStripeCustomerId,
  entitlementsToTier,
  getActiveEntitlements,
  productToListingLimit,
} from './client'

export { handleRevenueCatWebhook } from './webhook-handler'

export { syncSubscriberProfile } from './sync'

export type {
  RevenueCatSubscriberInfo,
  RevenueCatWebhookEvent,
  RevenueCatWebhookEventType,
  RevenueCatEntitlement,
  ResolvedSubscriberTier,
  StripePriceConfig,
  RCEntitlementId,
} from './types'

export { RC_ENTITLEMENTS } from './types'
