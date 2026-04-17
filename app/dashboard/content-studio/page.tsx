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
  interface MarketingJobRow {
    listing_id: string
    status: string
    description_status: string | null
    description_result: Record<string, unknown> | string | null
    captions_status: string | null
    captions_result: Record<string, unknown> | null
    property_site_status: string | null
    property_site_result: Record<string, unknown> | null
    scheduled_posts_status: string | null
  }
  let marketingJobs: MarketingJobRow[] | null = null
  try {
    const { data } = await supabase
      .from('marketing_jobs')
      .select('listing_id, status, description_status, description_result, captions_status, captions_result, property_site_status, property_site_result, scheduled_posts_status')
      .eq('user_id', user.id)
    marketingJobs = data as MarketingJobRow[] | null
  } catch { /* marketing_jobs query failed — degrade gracefully */ }

  // Build marketing status map with content previews
  const marketingStatuses: Record<string, {
    status: string
    hasDescription: boolean
    hasCaptions: boolean
    hasSite: boolean
    hasScheduledPosts: boolean
    descriptionPreview: string | null
    captionPlatforms: string[]
    propertySiteSlug: string | null
  }> = {}
  if (marketingJobs) {
    for (const job of marketingJobs) {
      if (!marketingStatuses[job.listing_id]) {
        // Extract description preview
        let descriptionPreview: string | null = null
        if (job.description_status === 'completed' && job.description_result) {
          const descResult = job.description_result
          if (typeof descResult === 'string') {
            descriptionPreview = descResult.slice(0, 200)
          } else if (typeof descResult === 'object' && descResult !== null) {
            const desc = (descResult as Record<string, unknown>).description ?? (descResult as Record<string, unknown>).text
            if (typeof desc === 'string') descriptionPreview = desc.slice(0, 200)
          }
        }

        // Extract caption platforms
        const captionPlatforms: string[] = []
        if (job.captions_status === 'completed' && job.captions_result && typeof job.captions_result === 'object') {
          for (const key of Object.keys(job.captions_result)) {
            if (['instagram', 'facebook', 'linkedin'].includes(key)) {
              captionPlatforms.push(key)
            }
          }
        }

        // Extract property site slug
        let propertySiteSlug: string | null = null
        if (job.property_site_status === 'completed' && job.property_site_result && typeof job.property_site_result === 'object') {
          const slug = (job.property_site_result as Record<string, unknown>).slug
          if (typeof slug === 'string') propertySiteSlug = slug
        }

        marketingStatuses[job.listing_id] = {
          status: job.status,
          hasDescription: job.description_status === 'completed',
          hasCaptions: job.captions_status === 'completed',
          hasSite: job.property_site_status === 'completed',
          hasScheduledPosts: job.scheduled_posts_status === 'completed',
          descriptionPreview,
          captionPlatforms,
          propertySiteSlug,
        }
      }
    }
  }

  const listingsWithPhotos = await Promise.all(
    (listings || []).map(async (listing: { id: string; title: string | null; address: string | null; photos: Array<{ id: string; raw_url: string | null; processed_url: string | null; status: string }> }) => {
      const photos = listing.photos || []
      const enhancedPhotos = photos.filter((p: { processed_url: string | null; raw_url: string | null }) => p.processed_url || p.raw_url)
      
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
        thumbnail: thumbnailUrl ?? null
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
