import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PropertySiteClient from './PropertySiteClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Extract UUID from slug - full UUID at the end
  const uuidMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
  if (!uuidMatch) return { title: 'Property Not Found' }
  
  const listingId = uuidMatch[1]
  
  const { data: listing } = await supabase
    .from('listings')
    .select('title, address, city, state, price')
    .eq('id', listingId)
    .single()
  
  if (!listing) return { title: 'Property Not Found' }
  
  return {
    title: listing.title || listing.address || 'Property',
    description: [listing.address, listing.city, listing.state].filter(Boolean).join(', ') + (listing.price ? ' - $' + listing.price.toLocaleString() : ''),
  }
}

export default async function PropertySitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Extract full UUID from slug
  const uuidMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
  if (!uuidMatch) {
    console.log('[PropertySite] No UUID found in slug:', slug)
    notFound()
  }
  
  const listingId = uuidMatch[1]
  console.log('[PropertySite] Looking for listing:', listingId)
  
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
  if (listing.user_id) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', listing.user_id)
      .single()
    profile = profileData
  }
  
  const sortedPhotos = (listing.photos || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
  
  const photos = await Promise.all(
    sortedPhotos.map(async (photo: any) => {
      const path = photo.processed_url || photo.raw_url
      if (!path) return null
      const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
      return data?.signedUrl
    })
  )
  
  return (
    <PropertySiteClient
      listing={{
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
        features: listing.features,
      }}
      photos={photos.filter(Boolean) as string[]}
      agent={profile ? {
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
      } : null}
    />
  )
}
