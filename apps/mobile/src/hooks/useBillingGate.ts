/**
 * Billing Gate Hook
 * Enforces subscription tier restrictions in the mobile app.
 * Free/Starter users get limited access; Pro/Agency get full AI Director.
 */

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { canUseAiDirector, getPlanLimits, getListingLimits } from '../types/shared';
import type { PlanType } from '../types/shared';

interface BillingGate {
  /** Current subscription tier */
  tier: PlanType;
  /** Whether the user can access the AI Director camera */
  canUseDirector: boolean;
  /** Whether the user can publish social posts */
  canPublish: boolean;
  /** Whether the user can access content studio */
  canAccessContentStudio: boolean;
  /** Maximum listings per month */
  listingsLimit: number;
  /** Maximum content posts */
  contentPostsLimit: number;
  /** Whether the user is on a paid plan */
  isPaid: boolean;
  /** Upgrade message for gated features */
  upgradeMessage: string;
}

export function useBillingGate(): BillingGate {
  const { profile } = useAuth();

  return useMemo(() => {
    const tier = (profile?.subscription_tier ?? 'free') as PlanType;
    const limits = getPlanLimits(tier);
    const listingLimits = getListingLimits(tier);

    return {
      tier,
      canUseDirector: canUseAiDirector(tier),
      canPublish: limits.canPublish,
      canAccessContentStudio: limits.canAccessContentStudio,
      listingsLimit: listingLimits.listings,
      contentPostsLimit: limits.contentPosts,
      isPaid: tier !== 'free',
      upgradeMessage:
        tier === 'free'
          ? 'Upgrade to Pro to unlock the AI Photography Director, auto-publishing, and more.'
          : tier === 'starter'
            ? 'Upgrade to Pro to unlock auto-publishing and the full AI Director.'
            : '',
    };
  }, [profile?.subscription_tier]);
}
