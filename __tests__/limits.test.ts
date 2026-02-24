/**
 * Tests for lib/content/limits.ts — Billing gate logic
 * =====================================================
 * These functions guard every paid feature. Getting them wrong means
 * free users access paid features or paying users get blocked.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeTier,
  getPlanLimits,
  canUseContentStudio,
  canGenerateCaption,
  canCreatePost,
  getRemainingCaptions,
  getRemainingPosts,
  canGenerateVideo,
  getListingLimits,
  shouldResetUsage,
  PLAN_LIMITS,
  LISTING_LIMITS,
} from '@/lib/content/limits'

// ── normalizeTier ──

describe('normalizeTier', () => {
  it('returns "free" for null/undefined/empty', () => {
    expect(normalizeTier(null)).toBe('free')
    expect(normalizeTier(undefined)).toBe('free')
    expect(normalizeTier('')).toBe('free')
  })

  it('returns canonical tier names as-is', () => {
    expect(normalizeTier('free')).toBe('free')
    expect(normalizeTier('starter')).toBe('starter')
    expect(normalizeTier('pro')).toBe('pro')
    expect(normalizeTier('agency')).toBe('agency')
  })

  it('normalizes aliases to canonical names', () => {
    expect(normalizeTier('gold')).toBe('pro')
    expect(normalizeTier('platinum')).toBe('agency')
    expect(normalizeTier('enterprise')).toBe('agency')
    expect(normalizeTier('professional')).toBe('pro')
    expect(normalizeTier('team')).toBe('agency')
    expect(normalizeTier('photographer-ultimate')).toBe('agency')
    expect(normalizeTier('photographer-complete')).toBe('pro')
    expect(normalizeTier('agent-starter')).toBe('starter')
    expect(normalizeTier('agent-complete')).toBe('pro')
  })

  it('is case-insensitive', () => {
    expect(normalizeTier('PRO')).toBe('pro')
    expect(normalizeTier('Gold')).toBe('pro')
    expect(normalizeTier('AGENCY')).toBe('agency')
  })

  it('trims whitespace', () => {
    expect(normalizeTier('  pro  ')).toBe('pro')
    expect(normalizeTier(' gold ')).toBe('pro')
  })

  it('falls back to "free" for unknown tiers', () => {
    expect(normalizeTier('premium')).toBe('free')
    expect(normalizeTier('vip')).toBe('free')
    expect(normalizeTier('garbage')).toBe('free')
  })
})

// ── getPlanLimits ──

describe('getPlanLimits', () => {
  it('returns correct limits for each tier', () => {
    expect(getPlanLimits('free').canPublish).toBe(false)
    expect(getPlanLimits('free').contentPosts).toBe(0)

    expect(getPlanLimits('starter').canAccessContentStudio).toBe(true)
    expect(getPlanLimits('starter').canPublish).toBe(false)
    expect(getPlanLimits('starter').contentPosts).toBe(5)

    expect(getPlanLimits('pro').canPublish).toBe(true)
    expect(getPlanLimits('pro').contentPosts).toBe(30)
    expect(getPlanLimits('pro').canGenerateVideo).toBe(true)

    expect(getPlanLimits('agency').contentPosts).toBe(Infinity)
    expect(getPlanLimits('agency').aiCaptions).toBe(Infinity)
  })

  it('resolves aliases through normalizeTier', () => {
    expect(getPlanLimits('gold')).toEqual(PLAN_LIMITS.pro)
    expect(getPlanLimits('platinum')).toEqual(PLAN_LIMITS.agency)
  })
})

// ── canUseContentStudio ──

describe('canUseContentStudio', () => {
  it('blocks free users', () => {
    expect(canUseContentStudio('free')).toBe(false)
  })

  it('allows starter and above', () => {
    expect(canUseContentStudio('starter')).toBe(true)
    expect(canUseContentStudio('pro')).toBe(true)
    expect(canUseContentStudio('agency')).toBe(true)
  })
})

// ── canGenerateCaption ──

describe('canGenerateCaption', () => {
  it('blocks free users regardless of usage', () => {
    expect(canGenerateCaption('free', 0)).toBe(false)
  })

  it('allows starter users under limit', () => {
    expect(canGenerateCaption('starter', 0)).toBe(true)
    expect(canGenerateCaption('starter', 9)).toBe(true)
  })

  it('blocks starter users at limit', () => {
    expect(canGenerateCaption('starter', 10)).toBe(false)
    expect(canGenerateCaption('starter', 50)).toBe(false)
  })

  it('always allows agency (Infinity)', () => {
    expect(canGenerateCaption('agency', 0)).toBe(true)
    expect(canGenerateCaption('agency', 999999)).toBe(true)
  })
})

// ── canCreatePost ──

describe('canCreatePost', () => {
  it('blocks free users', () => {
    expect(canCreatePost('free', 0)).toBe(false)
  })

  it('allows starter under limit of 5', () => {
    expect(canCreatePost('starter', 4)).toBe(true)
    expect(canCreatePost('starter', 5)).toBe(false)
  })

  it('allows pro under limit of 30', () => {
    expect(canCreatePost('pro', 29)).toBe(true)
    expect(canCreatePost('pro', 30)).toBe(false)
  })

  it('always allows agency', () => {
    expect(canCreatePost('agency', 999999)).toBe(true)
  })
})

// ── getRemainingCaptions ──

describe('getRemainingCaptions', () => {
  it('returns "unlimited" for agency', () => {
    expect(getRemainingCaptions('agency', 100)).toBe('unlimited')
  })

  it('returns correct remaining count', () => {
    expect(getRemainingCaptions('starter', 0)).toBe(10)
    expect(getRemainingCaptions('starter', 7)).toBe(3)
    expect(getRemainingCaptions('starter', 10)).toBe(0)
  })

  it('never returns negative', () => {
    expect(getRemainingCaptions('starter', 100)).toBe(0)
  })
})

// ── getRemainingPosts ──

describe('getRemainingPosts', () => {
  it('returns "unlimited" for agency', () => {
    expect(getRemainingPosts('agency', 100)).toBe('unlimited')
  })

  it('returns correct remaining count', () => {
    expect(getRemainingPosts('pro', 0)).toBe(30)
    expect(getRemainingPosts('pro', 25)).toBe(5)
    expect(getRemainingPosts('pro', 30)).toBe(0)
  })

  it('never returns negative', () => {
    expect(getRemainingPosts('free', 100)).toBe(0)
  })
})

// ── canGenerateVideo ──

describe('canGenerateVideo', () => {
  it('blocks free and starter', () => {
    expect(canGenerateVideo('free')).toBe(false)
    expect(canGenerateVideo('starter')).toBe(false)
  })

  it('allows pro and agency', () => {
    expect(canGenerateVideo('pro')).toBe(true)
    expect(canGenerateVideo('agency')).toBe(true)
  })
})

// ── getListingLimits ──

describe('getListingLimits', () => {
  it('returns correct listing limits per tier', () => {
    expect(getListingLimits('free')).toEqual({ listings: 3, photos: 30 })
    expect(getListingLimits('starter')).toEqual({ listings: 10, photos: 50 })
    expect(getListingLimits('pro')).toEqual({ listings: 30, photos: 75 })
    expect(getListingLimits('agency')).toEqual({ listings: 999, photos: 75 })
  })

  it('resolves aliases', () => {
    expect(getListingLimits('gold')).toEqual(LISTING_LIMITS.pro)
  })
})

// ── shouldResetUsage ──

describe('shouldResetUsage', () => {
  it('returns true for null/undefined reset date', () => {
    expect(shouldResetUsage(null)).toBe(true)
  })

  it('returns false if same month/year', () => {
    const now = new Date()
    // Set to the 1st of the current month
    const sameMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    expect(shouldResetUsage(sameMonth)).toBe(false)
  })

  it('returns true if different month', () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
    expect(shouldResetUsage(lastMonth)).toBe(true)
  })

  it('returns true if different year', () => {
    const lastYear = new Date(2024, 0, 15)
    expect(shouldResetUsage(lastYear)).toBe(true)
  })

  it('accepts ISO string dates', () => {
    const now = new Date()
    const sameMonth = new Date(now.getFullYear(), now.getMonth(), 5).toISOString()
    expect(shouldResetUsage(sameMonth)).toBe(false)
  })
})
