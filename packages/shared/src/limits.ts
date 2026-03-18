/**
 * @snapr/shared - Plan limits
 * ============================
 * Extracted from lib/content/limits.ts for use by both web and mobile apps.
 */

// Tier alias mapping: UI-facing names -> internal canonical names
const TIER_ALIASES: Record<string, string> = {
  gold: 'pro',
  platinum: 'agency',
  enterprise: 'agency',
  professional: 'pro',
  team: 'agency',
};

export const PLAN_LIMITS = {
  free: {
    contentPosts: 0,
    aiCaptions: 0,
    canPublish: false,
    canAccessContentStudio: false,
    canUseAiDirector: false,
  },
  starter: {
    contentPosts: 5,
    aiCaptions: 10,
    canPublish: false,
    canAccessContentStudio: true,
    canUseAiDirector: false,
  },
  pro: {
    contentPosts: 30,
    aiCaptions: 50,
    canPublish: true,
    canAccessContentStudio: true,
    canUseAiDirector: true,
  },
  agency: {
    contentPosts: Infinity,
    aiCaptions: Infinity,
    canPublish: true,
    canAccessContentStudio: true,
    canUseAiDirector: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const LISTING_LIMITS: Record<PlanType, { listings: number; photos: number }> = {
  free: { listings: 3, photos: 30 },
  starter: { listings: 10, photos: 50 },
  pro: { listings: 30, photos: 75 },
  agency: { listings: 999, photos: 75 },
};

/**
 * Normalizes any tier name to canonical form: free | starter | pro | agency
 */
export function normalizeTier(tier: string | null | undefined): PlanType {
  const lower = (tier || 'free').toLowerCase().trim();
  if (lower in TIER_ALIASES) return TIER_ALIASES[lower] as PlanType;
  if (lower in PLAN_LIMITS) return lower as PlanType;
  return 'free';
}

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[normalizeTier(plan)];
}

export function getListingLimits(plan: string) {
  return LISTING_LIMITS[normalizeTier(plan)];
}

export function canUseAiDirector(plan: string): boolean {
  return getPlanLimits(plan).canUseAiDirector;
}
