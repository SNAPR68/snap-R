import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PropertySiteClient from './PropertySiteClient'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// Use service role to bypass RLS for public property pages
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabase()
  
  // Extract UUID from slug - full UUID at the end
  const uuidMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
  if (!uuidMatch) return { title: 'Property Not Found' }
  
  const listingId = uuidMatch[1]
  
  const { data: listing } = await supabase
    .from('listings')
    .select('title, address, city, state, price, bedrooms, bathrooms, square_feet, description')
    .eq('id', listingId)
    .single()
  
  if (!listing) return { title: 'Property Not Found' }
  
  const title = listing.title || listing.address || 'Property For Sale'
  const description = listing.description?.slice(0, 160) ||
    `${listing.bedrooms || ''}bd ${listing.bathrooms || ''}ba ${listing.square_feet ? listing.square_feet.toLocaleString() + ' sqft' : ''} - ${[listing.address, listing.city, listing.state].filter(Boolean).join(', ')}`
  
  return {
    title: `${title} | Property Details`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PropertySitePage({ params }: Props) {
  const { slug } = await params
  const supabase = getSupabase()
  
  // Extract full UUID from slug
  const uuidMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
  if (!uuidMatch) {
    console.log('[PropertySite] No UUID found in slug:', slug)
    notFound()
  }
  
  const listingId = uuidMatch[1]
  console.log('[PropertySite] Looking for listing:', listingId)
  
  // Fetch listing with photos
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, photos(id, raw_url, processed_url, status, display_order)')
    .eq('id', listingId)
    .single()
  
  if (error || !listing) {
    console.error('[PropertySite] Error:', error)
    notFound()
  }
  
  // Fetch profile separately if user_id exists
  let profile = null
  let brandProfile = null
  
  if (listing.user_id) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email, phone, avatar_url, company, title')
      .eq('id', listing.user_id)
      .single()
    profile = profileData
    
    // Fetch brand profile for agent branding
    const { data: brandData } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', listing.user_id)
      .single()
    brandProfile = brandData
  }
  
  // Fetch any existing video for this listing
  let videoUrl = null
  const { data: videoData } = await supabase
    .from('listing_videos')
    .select('video_url')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (videoData?.video_url) {
    videoUrl = videoData.video_url
  }
  
  // Sort photos by display order
  const sortedPhotos = (listing.photos || []).sort((a: any, b: any) =>
    (a.display_order || 0) - (b.display_order || 0)
  )
  
  // Get signed URLs for photos
  const photos = await Promise.all(
    sortedPhotos.map(async (photo: any) => {
      const path = photo.processed_url || photo.raw_url
      if (!path) return null
      
      // If already a full URL, return as-is
      if (path.startsWith('http')) return path
      
      const { data } = await supabase.storage
        .from('raw-images')
        .createSignedUrl(path, 86400) // 24 hours
      return data?.signedUrl
    })
  )
  
  const validPhotos = photos.filter(Boolean) as string[]
  
  // Build listing data object
  const listingData = {
    id: listing.id,
    title: listing.title,
    address: listing.address,
    city: listing.city,
    state: listing.state,
    postal_code: listing.zip || listing.postal_code,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    square_feet: listing.sqft || listing.square_feet,
    description: listing.description,
    property_type: listing.property_type,
    year_built: listing.year_built,
    lot_size: listing.lot_size,
    parking: listing.parking,
    features: listing.features || [],
    status: listing.marketing_status ?? listing.status,
    mls_number: listing.mls_number,
    hoa_fees: listing.hoa_fees,
    latitude: listing.latitude,
    longitude: listing.longitude,
  }
  
  // Build agent data object
  const agentData = profile ? {
    name: profile.full_name || 'Agent',
    email: profile.email,
    phone: profile.phone,
    avatar: profile.avatar_url,
    company: profile.company,
    title: profile.title,
  } : null
  
  // Build brand data object
  const brandData = brandProfile ? {
    logo: brandProfile.logo_url,
    primaryColor: brandProfile.primary_color || '#D4A017',
    secondaryColor: brandProfile.secondary_color || '#1A1A1A',
    website: brandProfile.website,
    tagline: brandProfile.tagline,
  } : null
  
  return (
    <PropertySiteClient
      listing={listingData}
      photos={validPhotos}
      agent={agentData}
      brand={brandData}
      videoUrl={videoUrl}
      slug={slug}
    />
  )
}
