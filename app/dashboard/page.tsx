import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHome from '@/components/dashboard-home'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Parallel queries for dashboard metrics
  const [
    listingsResult,
    scheduledResult,
    publishedResult,
    marketingResult,
    processingResult,
  ] = await Promise.all([
    // Active listings
    supabase
      .from('listings')
      .select('id, title, preparation_status, marketing_status, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10),

    // Scheduled posts (pending)
    supabase
      .from('scheduled_posts')
      .select('id, platform, content, scheduled_for, status', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true })
      .limit(5),

    // Published posts with metrics
    supabase
      .from('published_posts')
      .select('id, platform, impressions, reach, published_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('published_at', { ascending: false })
      .limit(20),

    // Recent marketing completions
    supabase
      .from('marketing_jobs')
      .select('id, listing_id, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5),

    // Currently processing listings
    supabase
      .from('listings')
      .select('id, title, preparation_status, marketing_status')
      .eq('user_id', user.id)
      .or('preparation_status.eq.preparing,marketing_status.eq.processing'),
  ])

  const listings = listingsResult.data || []
  const scheduledPosts = scheduledResult.data || []
  const publishedPosts = publishedResult.data || []
  const marketingJobs = marketingResult.data || []
  const processingListings = processingResult.data || []

  // Calculate metrics
  const totalImpressions = publishedPosts.reduce((sum, p) => sum + ((p.impressions as number) || 0), 0)

  const metrics = {
    activeListings: listings.length,
    scheduledPosts: scheduledResult.count || scheduledPosts.length,
    publishedPosts: publishedResult.count || publishedPosts.length,
    totalImpressions,
  }

  // Build recent activity feed (combine + sort by timestamp)
  type ActivityItem = {
    type: 'listing_prepared' | 'marketing_completed' | 'post_scheduled' | 'post_published'
    title: string
    subtitle: string
    timestamp: string
    href: string
    icon: 'listing' | 'marketing' | 'calendar' | 'analytics'
  }

  const activities: ActivityItem[] = []

  // Recent prepared listings
  listings
    .filter(l => l.preparation_status === 'prepared')
    .slice(0, 3)
    .forEach(l => {
      activities.push({
        type: 'listing_prepared',
        title: l.title || 'Untitled Listing',
        subtitle: 'Photos enhanced and ready',
        timestamp: l.updated_at,
        href: `/dashboard/studio?id=${l.id}`,
        icon: 'listing',
      })
    })

  // Recent marketing completions
  marketingJobs.slice(0, 3).forEach(j => {
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
  scheduledPosts.slice(0, 3).forEach(p => {
    activities.push({
      type: 'post_scheduled',
      title: `${(p.platform || 'social').charAt(0).toUpperCase() + (p.platform || 'social').slice(1)} post scheduled`,
      subtitle: p.content ? (p.content as string).slice(0, 60) + '...' : 'Scheduled for publishing',
      timestamp: p.scheduled_for as string,
      href: '/dashboard/calendar',
      icon: 'calendar',
    })
  })

  // Sort all activities by timestamp (most recent first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Processing items
  const processingItems = processingListings.map(l => ({
    id: l.id,
    title: l.title || 'Untitled',
    status: (l.preparation_status === 'preparing' ? 'preparing' : 'processing') as 'preparing' | 'processing',
  }))

  return (
    <DashboardHome
      metrics={metrics}
      recentActivity={activities.slice(0, 8)}
      processingItems={processingItems}
    />
  )
}
