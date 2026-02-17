import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContentStudioClient from './ContentStudioClient'

export const dynamic = 'force-dynamic'

export default async function ContentStudio() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch marketing jobs for all user listings (wrapped in try/catch for resilience)
  let marketingJobs: any[] | null = null
  try {
    const { data } = await supabase
      .from('marketing_jobs')
      .select('listing_id, status, description_status, captions_status, property_site_status, scheduled_posts_status')
      .eq('user_id', user.id)
    marketingJobs = data
  } catch { /* marketing_jobs query failed — degrade gracefully */ }

  // Build marketing status map
  const marketingStatuses: Record<string, {
    status: string
    hasDescription: boolean
    hasCaptions: boolean
    hasSite: boolean
    hasScheduledPosts: boolean
  }> = {}
  if (marketingJobs) {
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
  }

  const listingsWithPhotos = await Promise.all(
    (listings || []).map(async (listing: any) => {
      const photos = listing.photos || []
      const enhancedPhotos = photos.filter((p: any) => p.processed_url || p.raw_url)
      
      let thumbnailUrl = null
      const firstPhoto = enhancedPhotos[0] || photos[0]
      if (firstPhoto) {
        const photoPath = firstPhoto.processed_url || firstPhoto.raw_url
        if (photoPath && !photoPath.startsWith('http')) {
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(photoPath, 3600)
          thumbnailUrl = data?.signedUrl
        } else {
          thumbnailUrl = photoPath
        }
      }
      
      return {
        id: listing.id,
        title: listing.title || listing.address || 'Untitled',
        photoCount: photos.length,
        enhancedCount: enhancedPhotos.length,
        thumbnail: thumbnailUrl
      }
    })
  )

  return (
    <ContentStudioClient
      initialListings={listingsWithPhotos}
      credits={profile?.credits || 0}
      marketingStatuses={marketingStatuses}
    />
  )
}