/**
 * Listing Health Score Calculator
 * ================================
 * Calculates a 0-100 health score for a listing based on:
 * - Marketing completion (photos enhanced, description generated, etc.)
 * - Distribution status (posts scheduled/published)
 * - Engagement velocity (views, clicks, leads per day)
 * - Lead capture activity
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ListingHealthScore {
  score: number           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: {
    preparation: number   // 0-25 points
    marketing: number     // 0-25 points
    distribution: number  // 0-25 points
    engagement: number    // 0-25 points
  }
  interventions: string[] // suggested actions
  updatedAt: string
}

function computeGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
}

export async function calculateListingHealth(
  supabase: SupabaseClient,
  listingId: string
): Promise<ListingHealthScore> {
  const interventions: string[] = []

  // ------------------------------------------------------------------
  // 1. Preparation score (0-25)
  // ------------------------------------------------------------------
  let preparation = 0

  const { data: listing } = await supabase
    .from('listings')
    .select('id, hero_photo_id')
    .eq('id', listingId)
    .single()

  const { data: photos } = await supabase
    .from('photos')
    .select('id, tools_applied, status')
    .eq('listing_id', listingId)

  const photoList = photos ?? []
  const hasPhotos = photoList.length > 0
  const enhancedPhotos = photoList.filter(
    (p) => Array.isArray(p.tools_applied) && p.tools_applied.length > 0
  )
  const hasEnhancedPhotos = enhancedPhotos.length > 0
  const allEnhanced = hasPhotos && enhancedPhotos.length === photoList.length
  const hasHeroPhoto = !!listing?.hero_photo_id

  if (hasPhotos) preparation += 5
  if (hasEnhancedPhotos) preparation += 10
  if (hasHeroPhoto) preparation += 5
  if (allEnhanced) preparation += 5

  if (!hasPhotos) {
    interventions.push('Upload photos to get started with your listing')
  } else if (!hasEnhancedPhotos) {
    interventions.push('Enhance your photos to improve listing presentation')
  } else if (!allEnhanced) {
    interventions.push(`${photoList.length - enhancedPhotos.length} photos still need enhancement`)
  }
  if (hasPhotos && !hasHeroPhoto) {
    interventions.push('Select a hero photo for your listing')
  }

  // ------------------------------------------------------------------
  // 2. Marketing score (0-25)
  // ------------------------------------------------------------------
  let marketing = 0

  const { data: marketingJob } = await supabase
    .from('marketing_jobs')
    .select(
      'description_status, captions_status, property_site_status'
    )
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const descriptionDone = marketingJob?.description_status === 'completed'
  const captionsDone = marketingJob?.captions_status === 'completed'
  const propertySiteDone = marketingJob?.property_site_status === 'completed'

  if (descriptionDone) marketing += 8
  if (captionsDone) marketing += 7
  if (propertySiteDone) marketing += 5

  // Video generated?
  const { count: videoCount } = await supabase
    .from('video_render_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)
    .eq('status', 'done')

  const hasVideo = (videoCount ?? 0) > 0
  if (hasVideo) marketing += 5

  if (!descriptionDone) {
    interventions.push('Generate an AI property description to boost your marketing score')
  }
  if (!captionsDone && descriptionDone) {
    interventions.push('Generate social captions for multi-platform distribution')
  }

  // ------------------------------------------------------------------
  // 3. Distribution score (0-25)
  // ------------------------------------------------------------------
  let distribution = 0

  const { data: scheduledPosts } = await supabase
    .from('scheduled_posts')
    .select('id, platform, content')
    .eq('listing_id', listingId)

  const scheduledList = scheduledPosts ?? []
  const hasScheduledPosts = scheduledList.length > 0

  const { data: publishedPosts } = await supabase
    .from('published_posts')
    .select('id, platform, impressions, engagement_rate')
    .eq('listing_id', listingId)

  const publishedList = publishedPosts ?? []
  const uniquePlatforms = new Set(publishedList.map((p) => p.platform))
  const hasPublished = publishedList.length > 0
  const multiPlatform = uniquePlatforms.size >= 3

  // Check UTM tracking — look for property site URL in scheduled/published post content
  const { data: propertySite } = await supabase
    .from('property_sites')
    .select('slug')
    .eq('listing_id', listingId)
    .limit(1)
    .maybeSingle()

  const hasUtmTracking =
    !!propertySite?.slug &&
    scheduledList.some((p) => p.content?.includes('utm_source'))

  if (hasScheduledPosts) distribution += 5
  if (hasPublished) distribution += 5
  if (multiPlatform) distribution += 10
  if (hasUtmTracking) distribution += 5

  if (!hasScheduledPosts && !hasPublished) {
    interventions.push('Connect social accounts to enable auto-publishing')
  } else if (hasPublished && !multiPlatform) {
    interventions.push(
      `Published on ${uniquePlatforms.size} platform${uniquePlatforms.size === 1 ? '' : 's'} — expand to 3+ for wider reach`
    )
  }

  // ------------------------------------------------------------------
  // 4. Engagement score (0-25)
  // ------------------------------------------------------------------
  let engagement = 0

  const hasImpressions = publishedList.some((p) => (p.impressions ?? 0) > 0)
  const avgEngagementRate =
    publishedList.length > 0
      ? publishedList.reduce((sum, p) => sum + (p.engagement_rate ?? 0), 0) /
        publishedList.length
      : 0
  const goodEngagement = avgEngagementRate > 1

  const { count: leadCount } = await supabase
    .from('property_leads')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)

  const hasLeads = (leadCount ?? 0) > 0

  const { count: showingCount } = await supabase
    .from('showings')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)

  const hasShowings = (showingCount ?? 0) > 0

  if (hasImpressions) engagement += 5
  if (goodEngagement) engagement += 5
  if (hasLeads) engagement += 10
  if (hasShowings) engagement += 5

  if (!hasImpressions && hasPublished) {
    interventions.push('Your published posts have 0 impressions — check your social connections')
  }
  if (!hasLeads && hasPublished) {
    interventions.push('No leads captured yet — ensure your property site has a contact form')
  }
  if (!hasShowings && hasLeads) {
    interventions.push(
      'Your listing has 0 showings — consider a price adjustment or open house'
    )
  }

  // ------------------------------------------------------------------
  // Assemble result
  // ------------------------------------------------------------------
  const score = preparation + marketing + distribution + engagement

  // Keep interventions to top 3 most impactful
  const topInterventions = interventions.slice(0, 3)

  return {
    score,
    grade: computeGrade(score),
    breakdown: {
      preparation,
      marketing,
      distribution,
      engagement,
    },
    interventions: topInterventions,
    updatedAt: new Date().toISOString(),
  }
}
