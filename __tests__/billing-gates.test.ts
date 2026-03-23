import { describe, it, expect } from 'vitest'
import {
  getPlanLimits,
  normalizeTier,
  PLAN_LIMITS,
  LISTING_LIMITS,
  getListingLimits,
  canUseContentStudio,
  canGenerateCaption,
  canCreatePost,
  getRemainingCaptions,
  getRemainingPosts,
  canGenerateVideo,
  canAccessApi,
  canCustomDomain,
  shouldResetUsage,
} from '@/lib/content/limits'

describe('billing-gates', () => {
  // ============================================
  // normalizeTier
  // ============================================

  describe('normalizeTier', () => {
    it('should return free for null/undefined', () => {
      expect(normalizeTier(null)).toBe('free')
      expect(normalizeTier(undefined)).toBe('free')
      expect(normalizeTier('')).toBe('free')
    })

    it('should handle canonical tier names', () => {
      expect(normalizeTier('free')).toBe('free')
      expect(normalizeTier('starter')).toBe('starter')
      expect(normalizeTier('pro')).toBe('pro')
      expect(normalizeTier('agency')).toBe('agency')
      expect(normalizeTier('enterprise')).toBe('enterprise')
    })

    it('should handle case-insensitive input', () => {
      expect(normalizeTier('FREE')).toBe('free')
      expect(normalizeTier('Pro')).toBe('pro')
      expect(normalizeTier('ENTERPRISE')).toBe('enterprise')
    })

    it('should map aliases to canonical names', () => {
      expect(normalizeTier('gold')).toBe('pro')
      expect(normalizeTier('platinum')).toBe('agency')
      expect(normalizeTier('professional')).toBe('pro')
      expect(normalizeTier('team')).toBe('agency')
    })

    it('should default unknown tiers to free', () => {
      expect(normalizeTier('unknown')).toBe('free')
      expect(normalizeTier('super-premium')).toBe('free')
      expect(normalizeTier('basic')).toBe('free')
    })
  })

  // ============================================
  // getPlanLimits — per-tier limits
  // ============================================

  describe('getPlanLimits', () => {
    it('should return correct limits for free tier', () => {
      const limits = getPlanLimits('free')
      expect(limits.contentPosts).toBe(0)
      expect(limits.aiCaptions).toBe(0)
      expect(limits.canPublish).toBe(false)
      expect(limits.canAccessContentStudio).toBe(false)
      expect(limits.canGenerateVideo).toBe(false)
      expect(limits.canCaptureLeads).toBe(false)
      expect(limits.canAccessApi).toBe(false)
      expect(limits.canCustomDomain).toBe(false)
      expect(limits.canEmbed).toBe(false)
    })

    it('should return correct limits for starter tier', () => {
      const limits = getPlanLimits('starter')
      expect(limits.contentPosts).toBe(5)
      expect(limits.aiCaptions).toBe(10)
      expect(limits.canPublish).toBe(false)
      expect(limits.canAccessContentStudio).toBe(true)
      expect(limits.canGenerateVideo).toBe(false)
      expect(limits.canCaptureLeads).toBe(false)
      expect(limits.canAccessApi).toBe(false)
      expect(limits.canCustomDomain).toBe(false)
      expect(limits.canEmbed).toBe(false)
    })

    it('should return correct limits for pro tier', () => {
      const limits = getPlanLimits('pro')
      expect(limits.contentPosts).toBe(30)
      expect(limits.aiCaptions).toBe(50)
      expect(limits.canPublish).toBe(true)
      expect(limits.canAccessContentStudio).toBe(true)
      expect(limits.canGenerateVideo).toBe(true)
      expect(limits.canCaptureLeads).toBe(true)
      expect(limits.canAccessApi).toBe(false)
      expect(limits.canCustomDomain).toBe(false)
      expect(limits.canEmbed).toBe(false)
    })

    it('should return correct limits for agency tier', () => {
      const limits = getPlanLimits('agency')
      expect(limits.contentPosts).toBe(Infinity)
      expect(limits.aiCaptions).toBe(Infinity)
      expect(limits.canPublish).toBe(true)
      expect(limits.canAccessContentStudio).toBe(true)
      expect(limits.canGenerateVideo).toBe(true)
      expect(limits.canCaptureLeads).toBe(true)
      expect(limits.canAccessApi).toBe(false)
      expect(limits.canCustomDomain).toBe(false)
      expect(limits.canEmbed).toBe(true)
    })

    it('should return correct limits for enterprise tier', () => {
      const limits = getPlanLimits('enterprise')
      expect(limits.contentPosts).toBe(Infinity)
      expect(limits.aiCaptions).toBe(Infinity)
      expect(limits.canPublish).toBe(true)
      expect(limits.canAccessContentStudio).toBe(true)
      expect(limits.canGenerateVideo).toBe(true)
      expect(limits.canCaptureLeads).toBe(true)
      expect(limits.canAccessApi).toBe(true)
      expect(limits.canCustomDomain).toBe(true)
      expect(limits.canEmbed).toBe(true)
    })

    it('should default unknown tier to free limits', () => {
      const limits = getPlanLimits('nonexistent')
      expect(limits).toEqual(PLAN_LIMITS.free)
    })
  })

  // ============================================
  // canPublish gate
  // ============================================

  describe('canPublish', () => {
    it('should be false for free tier', () => {
      expect(getPlanLimits('free').canPublish).toBe(false)
    })

    it('should be false for starter tier', () => {
      expect(getPlanLimits('starter').canPublish).toBe(false)
    })

    it('should be true for pro tier', () => {
      expect(getPlanLimits('pro').canPublish).toBe(true)
    })

    it('should be true for agency tier', () => {
      expect(getPlanLimits('agency').canPublish).toBe(true)
    })

    it('should be true for enterprise tier', () => {
      expect(getPlanLimits('enterprise').canPublish).toBe(true)
    })
  })

  // ============================================
  // canAccessApi gate
  // ============================================

  describe('canAccessApi', () => {
    it('should be false for free, starter, pro, agency', () => {
      expect(canAccessApi('free')).toBe(false)
      expect(canAccessApi('starter')).toBe(false)
      expect(canAccessApi('pro')).toBe(false)
      expect(canAccessApi('agency')).toBe(false)
    })

    it('should be true only for enterprise', () => {
      expect(canAccessApi('enterprise')).toBe(true)
    })
  })

  // ============================================
  // canCustomDomain gate
  // ============================================

  describe('canCustomDomain', () => {
    it('should be false for free, starter, pro, agency', () => {
      expect(canCustomDomain('free')).toBe(false)
      expect(canCustomDomain('starter')).toBe(false)
      expect(canCustomDomain('pro')).toBe(false)
      expect(canCustomDomain('agency')).toBe(false)
    })

    it('should be true only for enterprise', () => {
      expect(canCustomDomain('enterprise')).toBe(true)
    })
  })

  // ============================================
  // canEmbed gate
  // ============================================

  describe('canEmbed', () => {
    it('should be false for free, starter, pro', () => {
      expect(getPlanLimits('free').canEmbed).toBe(false)
      expect(getPlanLimits('starter').canEmbed).toBe(false)
      expect(getPlanLimits('pro').canEmbed).toBe(false)
    })

    it('should be true for agency and enterprise', () => {
      expect(getPlanLimits('agency').canEmbed).toBe(true)
      expect(getPlanLimits('enterprise').canEmbed).toBe(true)
    })
  })

  // ============================================
  // Content Studio access
  // ============================================

  describe('canUseContentStudio', () => {
    it('should be false for free tier', () => {
      expect(canUseContentStudio('free')).toBe(false)
    })

    it('should be true for starter and above', () => {
      expect(canUseContentStudio('starter')).toBe(true)
      expect(canUseContentStudio('pro')).toBe(true)
      expect(canUseContentStudio('agency')).toBe(true)
      expect(canUseContentStudio('enterprise')).toBe(true)
    })
  })

  // ============================================
  // Credit limits per tier
  // ============================================

  describe('credit limits', () => {
    it('should have correct content post limits', () => {
      expect(PLAN_LIMITS.free.contentPosts).toBe(0)
      expect(PLAN_LIMITS.starter.contentPosts).toBe(5)
      expect(PLAN_LIMITS.pro.contentPosts).toBe(30)
      expect(PLAN_LIMITS.agency.contentPosts).toBe(Infinity)
      expect(PLAN_LIMITS.enterprise.contentPosts).toBe(Infinity)
    })

    it('should have correct AI caption limits', () => {
      expect(PLAN_LIMITS.free.aiCaptions).toBe(0)
      expect(PLAN_LIMITS.starter.aiCaptions).toBe(10)
      expect(PLAN_LIMITS.pro.aiCaptions).toBe(50)
      expect(PLAN_LIMITS.agency.aiCaptions).toBe(Infinity)
      expect(PLAN_LIMITS.enterprise.aiCaptions).toBe(Infinity)
    })
  })

  // ============================================
  // canGenerateCaption
  // ============================================

  describe('canGenerateCaption', () => {
    it('should return false for free tier', () => {
      expect(canGenerateCaption('free', 0)).toBe(false)
    })

    it('should respect usage limits for starter', () => {
      expect(canGenerateCaption('starter', 0)).toBe(true)
      expect(canGenerateCaption('starter', 9)).toBe(true)
      expect(canGenerateCaption('starter', 10)).toBe(false)
    })

    it('should always return true for unlimited tiers', () => {
      expect(canGenerateCaption('agency', 9999)).toBe(true)
      expect(canGenerateCaption('enterprise', 9999)).toBe(true)
    })
  })

  // ============================================
  // canCreatePost
  // ============================================

  describe('canCreatePost', () => {
    it('should return false for free tier', () => {
      expect(canCreatePost('free', 0)).toBe(false)
    })

    it('should respect usage limits for starter', () => {
      expect(canCreatePost('starter', 0)).toBe(true)
      expect(canCreatePost('starter', 4)).toBe(true)
      expect(canCreatePost('starter', 5)).toBe(false)
    })

    it('should always return true for unlimited tiers', () => {
      expect(canCreatePost('agency', 9999)).toBe(true)
    })
  })

  // ============================================
  // getRemainingCaptions / getRemainingPosts
  // ============================================

  describe('getRemainingCaptions', () => {
    it('should return unlimited for agency/enterprise', () => {
      expect(getRemainingCaptions('agency', 0)).toBe('unlimited')
      expect(getRemainingCaptions('enterprise', 50)).toBe('unlimited')
    })

    it('should return correct remaining count', () => {
      expect(getRemainingCaptions('starter', 3)).toBe(7)
      expect(getRemainingCaptions('pro', 20)).toBe(30)
    })

    it('should not go below zero', () => {
      expect(getRemainingCaptions('starter', 100)).toBe(0)
    })
  })

  describe('getRemainingPosts', () => {
    it('should return unlimited for agency/enterprise', () => {
      expect(getRemainingPosts('agency', 0)).toBe('unlimited')
    })

    it('should return correct remaining count', () => {
      expect(getRemainingPosts('starter', 2)).toBe(3)
      expect(getRemainingPosts('pro', 10)).toBe(20)
    })
  })

  // ============================================
  // canGenerateVideo
  // ============================================

  describe('canGenerateVideo', () => {
    it('should be false for free and starter', () => {
      expect(canGenerateVideo('free')).toBe(false)
      expect(canGenerateVideo('starter')).toBe(false)
    })

    it('should be true for pro and above', () => {
      expect(canGenerateVideo('pro')).toBe(true)
      expect(canGenerateVideo('agency')).toBe(true)
      expect(canGenerateVideo('enterprise')).toBe(true)
    })
  })

  // ============================================
  // Listing limits
  // ============================================

  describe('getListingLimits', () => {
    it('should return correct listing limits per tier', () => {
      expect(getListingLimits('free')).toEqual({ listings: 3, photos: 30 })
      expect(getListingLimits('starter')).toEqual({ listings: 10, photos: 50 })
      expect(getListingLimits('pro')).toEqual({ listings: 30, photos: 75 })
      expect(getListingLimits('agency')).toEqual({ listings: 999, photos: 75 })
      expect(getListingLimits('enterprise')).toEqual({ listings: 9999, photos: 200 })
    })

    it('should normalize tier aliases for listing limits', () => {
      expect(getListingLimits('gold')).toEqual(LISTING_LIMITS.pro)
      expect(getListingLimits('platinum')).toEqual(LISTING_LIMITS.agency)
    })
  })

  // ============================================
  // shouldResetUsage
  // ============================================

  describe('shouldResetUsage', () => {
    it('should return true for null', () => {
      expect(shouldResetUsage(null)).toBe(true)
    })

    it('should return false for same month', () => {
      const now = new Date()
      expect(shouldResetUsage(now.toISOString())).toBe(false)
    })

    it('should return true for previous month', () => {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      expect(shouldResetUsage(lastMonth.toISOString())).toBe(true)
    })
  })
})
