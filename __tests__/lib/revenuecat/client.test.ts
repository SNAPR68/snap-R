// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  entitlementsToTier,
  getActiveEntitlements,
  productToListingLimit,
} from '@/lib/revenuecat/client'
import type { RevenueCatEntitlement } from '@/lib/revenuecat/types'

describe('revenuecat/client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('entitlementsToTier', () => {
    it('returns enterprise when api_access is active', () => {
      const entitlements = new Set([
        'content_studio', 'publishing', 'video', 'lead_capture',
        'api_access', 'custom_domain', 'embeds',
      ])
      expect(entitlementsToTier(entitlements)).toBe('enterprise')
    })

    it('returns agency when embeds is active but not api_access', () => {
      const entitlements = new Set([
        'content_studio', 'publishing', 'video', 'lead_capture', 'embeds',
      ])
      expect(entitlementsToTier(entitlements)).toBe('agency')
    })

    it('returns pro when publishing is active but not embeds', () => {
      const entitlements = new Set([
        'content_studio', 'publishing', 'video', 'lead_capture',
      ])
      expect(entitlementsToTier(entitlements)).toBe('pro')
    })

    it('returns starter when only content_studio is active', () => {
      const entitlements = new Set(['content_studio'])
      expect(entitlementsToTier(entitlements)).toBe('starter')
    })

    it('returns free when no entitlements are active', () => {
      const entitlements = new Set<string>()
      expect(entitlementsToTier(entitlements)).toBe('free')
    })

    it('handles unknown entitlements gracefully', () => {
      const entitlements = new Set(['unknown_feature', 'another_unknown'])
      expect(entitlementsToTier(entitlements)).toBe('free')
    })
  })

  describe('getActiveEntitlements', () => {
    it('returns entitlements that have not expired', () => {
      const future = new Date(Date.now() + 86400000).toISOString()
      const entitlements: Record<string, RevenueCatEntitlement> = {
        content_studio: {
          expires_date: future,
          grace_period_expires_date: null,
          product_identifier: 'starter_monthly',
          purchase_date: '2026-01-01T00:00:00Z',
        },
        publishing: {
          expires_date: future,
          grace_period_expires_date: null,
          product_identifier: 'pro_monthly_15',
          purchase_date: '2026-01-01T00:00:00Z',
        },
      }

      const active = getActiveEntitlements(entitlements)
      expect(active.has('content_studio')).toBe(true)
      expect(active.has('publishing')).toBe(true)
      expect(active.size).toBe(2)
    })

    it('excludes expired entitlements', () => {
      const past = new Date(Date.now() - 86400000).toISOString()
      const future = new Date(Date.now() + 86400000).toISOString()
      const entitlements: Record<string, RevenueCatEntitlement> = {
        content_studio: {
          expires_date: future,
          grace_period_expires_date: null,
          product_identifier: 'starter_monthly',
          purchase_date: '2026-01-01T00:00:00Z',
        },
        publishing: {
          expires_date: past,
          grace_period_expires_date: null,
          product_identifier: 'pro_monthly_15',
          purchase_date: '2025-01-01T00:00:00Z',
        },
      }

      const active = getActiveEntitlements(entitlements)
      expect(active.has('content_studio')).toBe(true)
      expect(active.has('publishing')).toBe(false)
      expect(active.size).toBe(1)
    })

    it('treats null expires_date as lifetime/active', () => {
      const entitlements: Record<string, RevenueCatEntitlement> = {
        api_access: {
          expires_date: null,
          grace_period_expires_date: null,
          product_identifier: 'enterprise_lifetime',
          purchase_date: '2026-01-01T00:00:00Z',
        },
      }

      const active = getActiveEntitlements(entitlements)
      expect(active.has('api_access')).toBe(true)
    })

    it('returns empty set for empty entitlements', () => {
      const active = getActiveEntitlements({})
      expect(active.size).toBe(0)
    })
  })

  describe('productToListingLimit', () => {
    it('extracts listing count from product ID', () => {
      expect(productToListingLimit('pro_monthly_50')).toBe(50)
      expect(productToListingLimit('agency_annual_300')).toBe(300)
      expect(productToListingLimit('pro_monthly_5')).toBe(5)
      expect(productToListingLimit('agency_monthly_75')).toBe(75)
    })

    it('returns 9999 for enterprise products', () => {
      expect(productToListingLimit('enterprise_monthly')).toBe(9999)
      expect(productToListingLimit('enterprise_annual')).toBe(9999)
    })

    it('returns null for null input', () => {
      expect(productToListingLimit(null)).toBeNull()
    })

    it('returns null for products without listing count', () => {
      expect(productToListingLimit('starter_monthly')).toBeNull()
    })
  })
})
