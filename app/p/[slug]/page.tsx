import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PropertySiteClient from './PropertySiteClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const idMatch = params.slug.match(/([a-f0-9]{8})$/i)
  if (!idMatch) return { title: 'Property Not Found' }
  
  const { data: listings } = await supabase
    .from('listings')
    .select('title, address, city, state, price')
    .ilike('id', idMatch[1] + '%')
    .limit(1)
  
  const listing = listings?.[0]
  if (!listing) return { title: 'Property Not Found' }
  
  return {
    title: listing.title || listing.address || 'Property',
    description: [listing.address, listing.city, listing.state].filter(Boolean).join(', ') + (listing.price ? ' - $' + listing.price.toLocaleString() : ''),
    openGraph: {
      title: listing.title || listing.address || 'Property',
      description: [listing.address, listing.city, listing.state].filter(Boolean).join(', ')
    }
  }
}

export default async function PropertySitePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  const idMatch = params.slug.match(/([a-f0-9]{8})$/i)
  if (!idMatch) notFound()
  
  const listingId = idMatch[1]
  
  const { data: listings } = await supabase
    .from('listings')
    .select('*, photos(id, raw_url, processed_url, status, display_order), profiles(full_name, email, phone)')
    .ilike('id', listingId + '%')
    .limit(1)
  
  const listing = listings?.[0]
  if (!listing) notFound()

  const sortedPhotos = (listing.photos || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
  
  const photos = await Promise.all(
    sortedPhotos.map(async (photo: any) => {
      const path = photo.processed_url || photo.raw_url
      if (!path) return null
      if (path.startsWith('http')) return path
      const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 86400)
      return data?.signedUrl || null
    })
  )

  const agent = listing.profiles ? {
    name: listing.profiles.full_name || 'Agent',
    email: listing.profiles.email,
    phone: listing.profiles.phone
  } : null

  return (
    <PropertySiteClient 
      photos={photos.filter(Boolean) as string[]}
      listing={{
        title: listing.title || listing.address || 'Property',
        address: listing.address,
        city: listing.city,
        state: listing.state,
        postal_code: listing.postal_code,
        price: listing.price,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        square_feet: listing.square_feet,
        description: listing.description,
        property_type: listing.property_type,
        year_built: listing.year_built,
        lot_size: listing.lot_size,
        parking: listing.parking,
        features: listing.features
      }}
      agent={agent}
    />
  )
}
