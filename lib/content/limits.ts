// Content Studio Plan Limits
// This file defines usage limits for each subscription tier

// Tier alias mapping: UI-facing names → internal canonical names
const TIER_ALIASES: Record<string, string> = {
  gold: 'pro',
  platinum: 'agency',
  enterprise: 'agency',
  professional: 'pro',
  team: 'agency',
  'photographer-ultimate': 'agency',
  'photographer-complete': 'pro',
  'agent-starter': 'starter',
  'agent-complete': 'pro',
}

/**
 * Normalizes any tier name to canonical form: free | starter | pro | agency
 * Handles: gold→pro, platinum→agency, enterprise→agency, professional→pro, team→agency
 */
export function normalizeTier(tier: string | null | undefined): PlanType {
  const lower = (tier || 'free').toLowerCase().trim()
  if (lower in TIER_ALIASES) return TIER_ALIASES[lower] as PlanType
  if (lower in PLAN_LIMITS) return lower as PlanType
  return 'free'
}

export const PLAN_LIMITS = {
  free: {
    contentPosts: 0,
    aiCaptions: 0,
    canPublish: false,
    canAccessContentStudio: false,
    canGenerateVideo: false,
  },
  starter: {
    contentPosts: 5,
    aiCaptions: 10,
    canPublish: false,
    canAccessContentStudio: true,
    canGenerateVideo: false,
  },
  pro: {
    contentPosts: 30,
    aiCaptions: 50,
    canPublish: true,
    canAccessContentStudio: true,
    canGenerateVideo: true,
  },
  agency: {
    contentPosts: Infinity,
    aiCaptions: Infinity,
    canPublish: true,
    canAccessContentStudio: true,
    canGenerateVideo: true,
  }
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[normalizeTier(plan)]
}

export function canUseContentStudio(plan: string): boolean {
  return getPlanLimits(plan).canAccessContentStudio
}

export function canGenerateCaption(plan: string, used: number): boolean {
  const limits = getPlanLimits(plan)
  if (!limits.canAccessContentStudio) return false
  if (limits.aiCaptions === Infinity) return true
  return used < limits.aiCaptions
}

export function canCreatePost(plan: string, used: number): boolean {
  const limits = getPlanLimits(plan)
  if (!limits.canAccessContentStudio) return false
  if (limits.contentPosts === Infinity) return true
  return used < limits.contentPosts
}

export function getRemainingCaptions(plan: string, used: number): number | 'unlimited' {
  const limits = getPlanLimits(plan)
  if (limits.aiCaptions === Infinity) return 'unlimited'
  return Math.max(0, limits.aiCaptions - used)
}

export function getRemainingPosts(plan: string, used: number): number | 'unlimited' {
  const limits = getPlanLimits(plan)
  if (limits.contentPosts === Infinity) return 'unlimited'
  return Math.max(0, limits.contentPosts - used)
}

export function canGenerateVideo(plan: string): boolean {
  return getPlanLimits(plan).canGenerateVideo
}

// Listing/photo limits per plan (used by Stripe webhook)
export const LISTING_LIMITS: Record<PlanType, { listings: number; photos: number }> = {
  free: { listings: 3, photos: 30 },
  starter: { listings: 10, photos: 50 },
  pro: { listings: 30, photos: 75 },
  agency: { listings: 999, photos: 75 },
}

export function getListingLimits(plan: string) {
  return LISTING_LIMITS[normalizeTier(plan)]
}

// Check if usage counters should be reset (monthly reset)
export function shouldResetUsage(resetAt: Date | string | null): boolean {
  if (!resetAt) return true
  const resetDate = new Date(resetAt)
  const now = new Date()
  // Reset if we're in a new month
  return now.getMonth() !== resetDate.getMonth() || 
         now.getFullYear() !== resetDate.getFullYear()
}
