/**
 * RevenueCat TypeScript type definitions for server-side API v1.
 * Reference: https://www.revenuecat.com/reference/basic
 */

// ─── Subscriber Info (GET /v1/subscribers/{app_user_id}) ───

export interface RevenueCatSubscriberInfo {
  request_date: string
  request_date_ms: number
  subscriber: RevenueCatSubscriber
}

export interface RevenueCatSubscriber {
  entitlements: Record<string, RevenueCatEntitlement>
  first_seen: string
  last_seen: string
  management_url: string | null
  non_subscriptions: Record<string, RevenueCatNonSubscription[]>
  original_app_user_id: string
  original_application_version: string | null
  original_purchase_date: string | null
  other_purchases: Record<string, RevenueCatOtherPurchase>
  subscriptions: Record<string, RevenueCatSubscription>
}

export interface RevenueCatEntitlement {
  expires_date: string | null
  grace_period_expires_date: string | null
  product_identifier: string
  purchase_date: string
}

export interface RevenueCatSubscription {
  auto_resume_date: string | null
  billing_issues_detected_at: string | null
  expires_date: string | null
  grace_period_expires_date: string | null
  is_sandbox: boolean
  original_purchase_date: string
  ownership_type: string
  period_type: string
  product_plan_identifier: string | null
  purchase_date: string
  refunded_at: string | null
  store: string
  unsubscribe_detected_at: string | null
}

export interface RevenueCatNonSubscription {
  id: string
  is_sandbox: boolean
  original_purchase_date: string
  purchase_date: string
  store: string
}

export interface RevenueCatOtherPurchase {
  purchase_date: string
  store: string
}

// ─── Webhook Events ───

export type RevenueCatWebhookEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'BILLING_ISSUE'
  | 'SUBSCRIBER_ALIAS'
  | 'PRODUCT_CHANGE'
  | 'EXPIRATION'
  | 'TRANSFER'
  | 'TEST'

export interface RevenueCatWebhookEvent {
  api_version: string
  event: {
    aliases: string[]
    app_id: string
    app_user_id: string
    commission_percentage: number | null
    country_code: string
    currency: string
    entitlement_id: string | null
    entitlement_ids: string[]
    environment: 'SANDBOX' | 'PRODUCTION'
    event_timestamp_ms: number
    expiration_at_ms: number | null
    id: string
    is_family_share: boolean
    offer_code: string | null
    original_app_user_id: string
    original_transaction_id: string
    period_type: 'TRIAL' | 'INTRO' | 'NORMAL'
    presented_offering_id: string | null
    price: number | null
    price_in_purchased_currency: number | null
    product_id: string
    purchased_at_ms: number
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL'
    subscriber_attributes: Record<string, { value: string; updated_at_ms: number }>
    takehome_percentage: number | null
    tax_percentage: number | null
    transaction_id: string
    type: RevenueCatWebhookEventType
  }
}

// ─── Entitlement-to-Tier Mapping ───

/**
 * RevenueCat entitlement IDs configured in the RC dashboard.
 * These map to SnapR plan capabilities in lib/content/limits.ts.
 */
export const RC_ENTITLEMENTS = {
  CONTENT_STUDIO: 'content_studio',
  PUBLISHING: 'publishing',
  VIDEO: 'video',
  LEAD_CAPTURE: 'lead_capture',
  API_ACCESS: 'api_access',
  CUSTOM_DOMAIN: 'custom_domain',
  EMBEDS: 'embeds',
} as const

export type RCEntitlementId = (typeof RC_ENTITLEMENTS)[keyof typeof RC_ENTITLEMENTS]

/**
 * Stripe Price ID configuration for pre-created products.
 * These must match the Stripe Products/Prices created in the Stripe Dashboard
 * and configured in the RevenueCat dashboard.
 *
 * Format: STRIPE_PRICES[plan][billing][listingBand]
 */
export interface StripePriceConfig {
  [plan: string]: {
    [billing: string]: {
      [listingBand: string]: string // Stripe Price ID
    }
  }
}

/**
 * Result of resolving a subscriber's tier from RevenueCat.
 */
export interface ResolvedSubscriberTier {
  tier: 'free' | 'starter' | 'pro' | 'agency' | 'enterprise'
  status: 'active' | 'past_due' | 'canceled' | 'expired' | 'trial' | 'inactive'
  listingsLimit: number
  photosLimit: number
  productId: string | null
  expiresAt: string | null
}
