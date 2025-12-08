// Content Studio Plan Limits
// This file defines usage limits for each subscription tier

export const PLAN_LIMITS = {
  free: {
    contentPosts: 0,
    aiCaptions: 0,
    canPublish: false,
    canAccessContentStudio: false
  },
  starter: {
    contentPosts: 5,
    aiCaptions: 10,
    canPublish: false,
    canAccessContentStudio: true
  },
  pro: {
    contentPosts: 30,
    aiCaptions: 50,
    canPublish: true,
    canAccessContentStudio: true
  },
  agency: {
    contentPosts: Infinity,
    aiCaptions: Infinity,
    canPublish: true,
    canAccessContentStudio: true
  }
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  const normalizedPlan = plan?.toLowerCase() || 'free'
  return PLAN_LIMITS[normalizedPlan as PlanType] || PLAN_LIMITS.free
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

// Check if usage counters should be reset (monthly reset)
export function shouldResetUsage(resetAt: Date | string | null): boolean {
  if (!resetAt) return true
  const resetDate = new Date(resetAt)
  const now = new Date()
  // Reset if we're in a new month
  return now.getMonth() !== resetDate.getMonth() || 
         now.getFullYear() !== resetDate.getFullYear()
}
