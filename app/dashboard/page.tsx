import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommandCenter from '@/components/command-center/command-center'

export const dynamic = 'force-dynamic'

interface ListingPhoto {
  id: string
  raw_url: string | null
  processed_url: string | null
}

interface RawListing {
  id: string
  title: string | null
  address: string | null
  preparation_status: string | null
  marketing_status: string | null
  hero_photo_id: string | null
  updated_at: string
  photos: ListingPhoto[]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Parallel queries for Command Center data
  const [
    listingsResult,
    scheduledResult,
    publishedResult,
    marketingJobsResult,
    processingResult,
    brandResult,
    socialsResult,
    profileResult,
  ] = await Promise.all([
    // All listings with photos for thumbnails
    supabase
      .from('listings')
      .select('id, title, address, preparation_status, marketing_status, hero_photo_id, updated_at, photos!photos_listing_id_fkey(id, raw_url, processed_url)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20),

    // All scheduled posts (all statuses for calendar view)
    supabase
      .from('scheduled_posts')
      .select('id, platform, content, scheduled_for, status')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true })
      .limit(50),

    // Published posts with full analytics
    supabase
      .from('published_posts')
      .select('id, platform, post_type, caption, published_at, likes, comments, shares, impressions, reach')
      .eq('user_id', user.id)
      .order('published_at', { ascending: false })
      .limit(50),

    // Marketing jobs for all user listings
    supabase
      .from('marketing_jobs')
      .select('listing_id, status, description_status, captions_status, property_site_status, scheduled_posts_status, created_at')
      .eq('user_id', user.id),

    // Currently processing listings (with photos for thumbnails)
    supabase
      .from('listings')
      .select('id, title, preparation_status, marketing_status, photos!photos_listing_id_fkey(id, raw_url, processed_url)')
      .eq('user_id', user.id)
      .or('preparation_status.eq.preparing,marketing_status.eq.processing'),

    // Brand profile exists?
    supabase
      .from('brand_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),

    // Social connections exist?
    supabase
      .from('social_connections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true),

    // User tier
    supabase
      .from('profiles')
      .select('subscription_tier, plan')
      .eq('id', user.id)
      .single(),
  ])

  const rawListings = (listingsResult.data || []) as unknown as RawListing[]
  const scheduledPosts = scheduledResult.data || []
  const publishedPosts = publishedResult.data || []
  const marketingJobs = marketingJobsResult.data || []
  const processingListings = (processingResult.data || []) as unknown as RawListing[]

  // Resolve thumbnails for listings
  const listings = await Promise.all(
    rawListings.map(async (listing) => {
      const photos = listing.photos || []
      let thumbnailUrl: string | null = null

      // Try hero photo first, then first photo with processed_url, then first photo
      const heroPhoto = listing.hero_photo_id
        ? photos.find((p) => p.id === listing.hero_photo_id)
        : null
      const firstPhoto = heroPhoto || photos.find((p) => p.processed_url) || photos[0]

      if (firstPhoto) {
        const photoPath = firstPhoto.processed_url || firstPhoto.raw_url
        if (photoPath && !photoPath.startsWith('http')) {
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(photoPath, 3600)
          thumbnailUrl = data?.signedUrl || null
        } else {
          thumbnailUrl = photoPath || null
        }
      }

      return {
        id: listing.id,
        title: listing.title || listing.address || 'Untitled',
        address: listing.address || undefined,
        thumbnail: thumbnailUrl,
        preparation_status: listing.preparation_status,
        marketing_status: listing.marketing_status,
        photoCount: photos.length,
      }
    })
  )

  // Build marketing status map
  const marketingStatuses: Record<string, {
    status: string
    hasDescription: boolean
    hasCaptions: boolean
    hasSite: boolean
    hasScheduledPosts: boolean
  }> = {}
  for (const job of marketingJobs) {
    if (!marketingStatuses[job.listing_id]) {
      marketingStatuses[job.listing_id] = {
        status: job.status,
        hasDescription: job.description_status === 'completed',
        hasCaptions: job.captions_status === 'completed',
        hasSite: job.property_site_status === 'completed',
        hasScheduledPosts: job.scheduled_posts_status === 'completed',
      }
    }
  }

  // Calculate analytics totals
  const analyticsTotals = {
    posts: publishedPosts.length,
    likes: publishedPosts.reduce((sum, p) => sum + ((p.likes as number) || 0), 0),
    comments: publishedPosts.reduce((sum, p) => sum + ((p.comments as number) || 0), 0),
    shares: publishedPosts.reduce((sum, p) => sum + ((p.shares as number) || 0), 0),
    impressions: publishedPosts.reduce((sum, p) => sum + ((p.impressions as number) || 0), 0),
    reach: publishedPosts.reduce((sum, p) => sum + ((p.reach as number) || 0), 0),
  }

  // Build analytics posts with proper types
  const analyticsPosts = publishedPosts.map(p => ({
    id: p.id,
    platform: p.platform as string,
    post_type: (p.post_type as string) || undefined,
    caption: (p.caption as string) || undefined,
    published_at: p.published_at as string,
    likes: (p.likes as number) || 0,
    comments: (p.comments as number) || 0,
    shares: (p.shares as number) || 0,
    impressions: (p.impressions as number) || 0,
    reach: (p.reach as number) || 0,
  }))

  // Build recent activity feed
  type ActivityItemType = {
    type: 'listing_prepared' | 'marketing_completed' | 'post_scheduled' | 'post_published'
    title: string
    subtitle: string
    timestamp: string
    href: string
    icon: 'listing' | 'marketing' | 'calendar' | 'analytics'
  }

  const activities: ActivityItemType[] = []

  // Recent prepared listings
  listings
    .filter(l => l.preparation_status === 'prepared')
    .slice(0, 3)
    .forEach(l => {
      activities.push({
        type: 'listing_prepared',
        title: l.title,
        subtitle: 'Photos enhanced and ready',
        timestamp: rawListings.find(r => r.id === l.id)?.updated_at || new Date().toISOString(),
        href: `/dashboard/studio?id=${l.id}`,
        icon: 'listing',
      })
    })

  // Recent marketing completions
  marketingJobs
    .filter(j => j.status === 'completed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .forEach(j => {
      const listing = listings.find(l => l.id === j.listing_id)
      activities.push({
        type: 'marketing_completed',
        title: listing?.title || 'Listing',
        subtitle: 'Marketing content generated',
        timestamp: j.created_at,
        href: `/dashboard/studio?id=${j.listing_id}`,
        icon: 'marketing',
      })
    })

  // Upcoming scheduled posts
  scheduledPosts
    .filter(p => p.status === 'pending')
    .slice(0, 3)
    .forEach(p => {
      activities.push({
        type: 'post_scheduled',
        title: `${((p.platform as string) || 'social').charAt(0).toUpperCase() + ((p.platform as string) || 'social').slice(1)} post scheduled`,
        subtitle: p.content ? (p.content as string).slice(0, 60) + '...' : 'Scheduled for publishing',
        timestamp: p.scheduled_for as string,
        href: '/dashboard/calendar',
        icon: 'calendar',
      })
    })

  // Recent published posts
  publishedPosts.slice(0, 3).forEach(p => {
    activities.push({
      type: 'post_published',
      title: `${((p.platform as string) || 'post').charAt(0).toUpperCase() + ((p.platform as string) || 'post').slice(1)} post published`,
      subtitle: p.caption ? (p.caption as string).slice(0, 60) + '...' : 'Published successfully',
      timestamp: p.published_at as string,
      href: '/dashboard/content-studio/analytics',
      icon: 'analytics',
    })
  })

  // Sort all activities by timestamp (most recent first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Resolve thumbnails for processing items
  const processingItems = await Promise.all(
    processingListings.map(async (listing) => {
      const photos = listing.photos || []
      let thumbnailUrl: string | null = null
      const firstPhoto = photos.find((p) => p.processed_url) || photos[0]

      if (firstPhoto) {
        const photoPath = firstPhoto.processed_url || firstPhoto.raw_url
        if (photoPath && !photoPath.startsWith('http')) {
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(photoPath, 3600)
          thumbnailUrl = data?.signedUrl || null
        } else {
          thumbnailUrl = photoPath || null
        }
      }

      return {
        id: listing.id,
        title: listing.title || 'Untitled',
        thumbnail: thumbnailUrl,
        preparation_status: listing.preparation_status as string | null,
        marketing_status: listing.marketing_status as string | null,
      }
    })
  )

  // Setup status for getting-started checklist
  const hasPrepared = listings.some(l => l.preparation_status === 'prepared')
  const hasMarketing = Object.values(marketingStatuses).some(m => m.status === 'completed')

  const setupStatus = {
    hasListings: listings.length > 0,
    hasBrand: (brandResult.count || 0) > 0,
    hasSocials: (socialsResult.count || 0) > 0,
    hasPrepared,
    hasMarketing,
    tier: profileResult.data?.subscription_tier || profileResult.data?.plan || 'free',
  }

  // Format scheduled posts for calendar container
  const calendarPosts = scheduledPosts.map(p => ({
    id: p.id,
    platform: p.platform as string,
    content: (p.content as string) || undefined,
    scheduled_for: p.scheduled_for as string,
    status: p.status as string,
  }))

  // Usage data for the usage widget
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count: listingsThisMonth } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart)

  const tierDefaults: Record<string, number> = { free: 3, starter: 10, pro: 30, agency: 50 }
  const userTier = setupStatus.tier
  const listingsLimit = tierDefaults[userTier] || 3

  const usage = {
    listingsUsed: listingsThisMonth || 0,
    listingsLimit,
    tier: userTier,
  }

  return (
    <CommandCenter
      listings={listings}
      scheduledPosts={calendarPosts}
      analytics={{
        totals: analyticsTotals,
        posts: analyticsPosts,
      }}
      recentActivity={activities.slice(0, 10)}
      processingItems={processingItems}
      setupStatus={setupStatus}
      marketingStatuses={marketingStatuses}
      usage={usage}
    />
  )
}
