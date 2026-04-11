/**
 * On-demand RevenueCat subscriber profile sync.
 * Resolves the authoritative tier from RevenueCat and writes back to profiles.
 * Falls back to cached profiles.subscription_tier if RevenueCat is unreachable.
 *
 * Use cases:
 * - Billing page load (show real-time status)
 * - Login (catch up on webhook misses)
 * - API gate checks requiring real-time verification
 */

import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getListingLimits, type PlanType } from '@/lib/content/limits'
import { resolveSubscriberTier } from './client'

/**
 * Sync a user's subscription tier from RevenueCat to the profiles table.
 * Returns the resolved tier. Falls back to cached tier on RC failure.
 */
export async function syncSubscriberProfile(userId: string): Promise<PlanType> {
  // If RevenueCat is not configured, return cached tier
  if (!process.env.REVENUECAT_API_KEY) {
    return getCachedTier(userId)
  }

  try {
    const resolved = await resolveSubscriberTier(userId)
    const supabase = adminSupabase()

    // Only update if something changed
    const { data: current } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single()

    if (
      current &&
      (current.subscription_tier !== resolved.tier ||
        current.subscription_status !== resolved.status)
    ) {
      const limits = getListingLimits(resolved.tier)

      await supabase
        .from('profiles')
        .update({
          subscription_tier: resolved.tier,
          plan: resolved.tier,
          subscription_status: resolved.status,
          listings_limit: resolved.listingsLimit || limits.listings,
          photos_per_listing: resolved.photosLimit || limits.photos,
          revenuecat_app_user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      logger.info(
        `[RevenueCat Sync] Updated ${userId}: ${current.subscription_tier} → ${resolved.tier}`
      )
    }

    return resolved.tier
  } catch (error: unknown) {
    logger.warn(
      '[RevenueCat Sync] Failed to sync, using cached tier:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return getCachedTier(userId)
  }
}

/**
 * Get the cached tier from the profiles table.
 * Used as fallback when RevenueCat is unreachable.
 */
async function getCachedTier(userId: string): Promise<PlanType> {
  const supabase = adminSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  return (data?.subscription_tier as PlanType) || 'free'
}
