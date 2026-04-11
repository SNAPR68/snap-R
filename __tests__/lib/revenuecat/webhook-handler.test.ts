// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RevenueCatWebhookEvent } from '@/lib/revenuecat/types'

// Mock dependencies before importing the handler
vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          single: vi.fn().mockResolvedValue({ data: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
}))

vi.mock('@/lib/revenuecat/client', () => ({
  resolveSubscriberTier: vi.fn().mockResolvedValue({
    tier: 'pro',
    status: 'active',
    listingsLimit: 30,
    photosLimit: 75,
    productId: 'pro_monthly_30',
    expiresAt: '2026-04-27T00:00:00Z',
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

function makeWebhookEvent(
  type: string,
  overrides: Partial<RevenueCatWebhookEvent['event']> = {}
): RevenueCatWebhookEvent {
  return {
    api_version: '1.0',
    event: {
      aliases: [],
      app_id: 'test_app',
      app_user_id: 'user-123',
      commission_percentage: null,
      country_code: 'US',
      currency: 'USD',
      entitlement_id: null,
      entitlement_ids: ['content_studio', 'publishing'],
      environment: 'PRODUCTION',
      event_timestamp_ms: Date.now(),
      expiration_at_ms: null,
      id: `evt_${Date.now()}`,
      is_family_share: false,
      offer_code: null,
      original_app_user_id: 'user-123',
      original_transaction_id: 'txn_123',
      period_type: 'NORMAL',
      presented_offering_id: null,
      price: 20,
      price_in_purchased_currency: 20,
      product_id: 'pro_monthly_30',
      purchased_at_ms: Date.now(),
      store: 'STRIPE',
      subscriber_attributes: {},
      takehome_percentage: null,
      tax_percentage: null,
      transaction_id: 'txn_456',
      type: type as RevenueCatWebhookEvent['event']['type'],
      ...overrides,
    },
  }
}

describe('revenuecat/webhook-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles INITIAL_PURCHASE event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('INITIAL_PURCHASE')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toContain('initial_purchase')
    expect(result.action).toContain('pro')
  })

  it('handles RENEWAL event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('RENEWAL')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toContain('renewal')
  })

  it('handles CANCELLATION event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('CANCELLATION')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toContain('cancellation')
    expect(result.action).toContain('downgraded')
  })

  it('handles EXPIRATION event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('EXPIRATION')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toContain('expiration')
    expect(result.action).toContain('downgraded')
  })

  it('handles BILLING_ISSUE event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('BILLING_ISSUE')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toBe('billing_issue_past_due')
  })

  it('handles PRODUCT_CHANGE event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('PRODUCT_CHANGE')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toContain('product_change')
  })

  it('handles TEST event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('TEST')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toBe('test_acknowledged')
  })

  it('handles SUBSCRIBER_ALIAS event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('SUBSCRIBER_ALIAS')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toBe('alias_logged')
  })

  it('handles TRANSFER event', async () => {
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('TRANSFER', {
      app_user_id: 'new-user-456',
      original_app_user_id: 'old-user-789',
    })
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toBe('transfer_processed')
  })

  it('skips duplicate events via idempotency check', async () => {
    // Re-mock admin to return an existing event
    vi.doMock('@/lib/supabase/admin', () => ({
      adminSupabase: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { event_id: 'evt_duplicate' },
              }),
            })),
          })),
        })),
      })),
    }))

    // Need to re-import to pick up new mock
    vi.resetModules()
    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('RENEWAL', { id: 'evt_duplicate' })
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toBe('duplicate_skipped')
  })

  it('handles unknown event types gracefully', async () => {
    vi.resetModules()
    // Reset mocks to original
    vi.doMock('@/lib/supabase/admin', () => ({
      adminSupabase: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        })),
      })),
    }))

    const { handleRevenueCatWebhook } = await import('@/lib/revenuecat/webhook-handler')
    const event = makeWebhookEvent('UNKNOWN_TYPE')
    const result = await handleRevenueCatWebhook(event)

    expect(result.success).toBe(true)
    expect(result.action).toContain('unhandled')
  })
})
