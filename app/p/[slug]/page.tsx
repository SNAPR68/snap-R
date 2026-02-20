import { notFound } from 'next/navigation'
import PropertySiteClient from './PropertySiteClient'
import { Metadata } from 'next'
import { adminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = adminSupabase()

  // Look up property site by slug, then fetch listing via listing_id
  const { data: site, error: siteError } = await supabase
    .from('property_sites')
    .select('listing_id')
    .eq('slug', slug)
    .single()

  if (siteError) {
    console.error('[PropertySite] Metadata site lookup error:', siteError)
  }

  if (!site?.listing_id) return { title: 'Property Not Found' }
  const listingId = site.listing_id

  const { data: listing } = await supabase
    .from('listings')
    .select('title, address, city, state, description, price, bedrooms, bathrooms, square_feet')
    .eq('id', listingId)
    .single()

  if (!listing) return { title: 'Property Not Found' }

  const title = listing.title || listing.address || 'Property For Sale'
  const priceStr = listing.price ? ` | $${Number(listing.price).toLocaleString()}` : ''
  const specs = [
    listing.bedrooms ? `${listing.bedrooms} bed` : null,
    listing.bathrooms ? `${listing.bathrooms} bath` : null,
    listing.square_feet ? `${Number(listing.square_feet).toLocaleString()} sqft` : null,
  ].filter(Boolean).join(', ')
  const description = listing.description?.slice(0, 160) ||
    [specs, listing.address, listing.city, listing.state].filter(Boolean).join(' | ') + priceStr

  // Fetch hero photo for OG image
  const { data: heroPhoto } = await supabase
    .from('photos')
    .select('raw_url, processed_url')
    .eq('listing_id', listingId)
    .eq('status', 'completed')
    .order('display_order', { ascending: true })
    .limit(1)
    .single()

  let ogImageUrl: string | undefined
  if (heroPhoto) {
    const path = heroPhoto.processed_url || heroPhoto.raw_url
    if (path?.startsWith('http')) {
      ogImageUrl = path
    } else if (path) {
      const { data: signed } = await supabase.storage
        .from('raw-images')
        .createSignedUrl(path, 86400)
      ogImageUrl = signed?.signedUrl
    }
  }

  return {
    title: `${title} | Property Details`,
    description,
    alternates: {
      canonical: `https://snap-r.com/p/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  }
}

export default async function PropertySitePage({ params }: Props) {
  const { slug } = await params
  const supabase = adminSupabase()
  
  // Look up property site by slug, then fetch listing via listing_id
  const { data: site, error: siteError } = await supabase
    .from('property_sites')
    .select('listing_id, slug')
    .eq('slug', slug)
    .single()

  if (siteError) {
    console.error('[PropertySite] Site lookup error:', {
      error: siteError.message,
      code: siteError.code,
      slug,
    })
  }

  // Fallback: if slug lookup fails, try treating slug as a listing_id
  let resolvedSite = site
  if (!resolvedSite?.listing_id) {
    const { data: fallbackSite } = await supabase
      .from('property_sites')
      .select('listing_id, slug')
      .eq('listing_id', slug)
      .limit(1)
      .single()

    if (fallbackSite) {
      console.log('[PropertySite] Resolved via listing_id fallback:', slug)
      resolvedSite = fallbackSite
    }
  }

  if (!resolvedSite?.listing_id) {
    console.error('[PropertySite] No property site found for slug:', slug)
    notFound()
  }

  const listingId = resolvedSite.listing_id

  // Fetch listing with photos
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status, display_order)')
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
  
  // Fetch any existing completed video for this listing
  let videoUrl = null
  const { data: videoData } = await supabase
    .from('video_render_jobs')
    .select('video_url')
    .eq('listing_id', listingId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (videoData?.video_url) {
    videoUrl = videoData.video_url
  }
  
  // Sort photos by display order
  interface ListingPhoto {
    id: string
    raw_url: string | null
    processed_url: string | null
    status: string
    display_order: number | null
  }

  const sortedPhotos = (listing.photos as ListingPhoto[] || []).sort(
    (a: ListingPhoto, b: ListingPhoto) =>
      (a.display_order || 0) - (b.display_order || 0)
  )

  // Get signed URLs for photos
  const photos = await Promise.all(
    sortedPhotos.map(async (photo: ListingPhoto) => {
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
  
  // Build JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listingData.title || listingData.address || 'Property Listing',
    description: listingData.description?.slice(0, 300),
    url: `https://snap-r.com/p/${slug}`,
    ...(listingData.price && {
      offers: {
        '@type': 'Offer',
        price: listingData.price,
        priceCurrency: 'USD',
      },
    }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: listingData.address,
      addressLocality: listingData.city,
      addressRegion: listingData.state,
      postalCode: listingData.postal_code,
    },
    ...(validPhotos.length > 0 && { image: validPhotos.slice(0, 5) }),
    ...(listingData.latitude && listingData.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listingData.latitude,
        longitude: listingData.longitude,
      },
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertySiteClient
        listing={listingData}
        photos={validPhotos}
        agent={agentData}
        brand={brandData}
        videoUrl={videoUrl}
        slug={slug}
        mapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? null}
      />
    </>
  )
}
