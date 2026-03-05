import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { adminSupabase } from '@/lib/supabase/admin'
import CheckInForm from './CheckInForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = adminSupabase()

  const { data: event } = await supabase
    .from('open_house_events')
    .select('title, event_date, listing_id')
    .eq('event_slug', slug)
    .eq('is_published', true)
    .single()

  if (!event) return { title: 'Open House Not Found' }

  const { data: listing } = await supabase
    .from('listings')
    .select('address, city, state')
    .eq('id', event.listing_id)
    .single()

  const address = listing
    ? [listing.address, listing.city, listing.state].filter(Boolean).join(', ')
    : ''

  return {
    title: `${event.title} | Open House Check-In`,
    description: `Open house at ${address}. Check in to register your attendance.`,
    openGraph: { title: event.title, description: `Open house at ${address}`, type: 'website' },
  }
}

export default async function OpenHouseCheckInPage({ params }: Props) {
  const { slug } = await params
  const supabase = adminSupabase()

  const { data: event, error: eventError } = await supabase
    .from('open_house_events')
    .select('id, title, event_date, start_time, end_time, description, checkin_count, max_attendees, is_published, listing_id, status')
    .eq('event_slug', slug)
    .single()

  if (eventError || !event) {
    notFound()
  }

  if (!event.is_published) {
    notFound()
  }

  // Fetch listing details
  const { data: listing } = await supabase
    .from('listings')
    .select('address, city, state, hero_photo_id')
    .eq('id', event.listing_id)
    .single()

  // Fetch hero photo URL
  let heroPhotoUrl: string | null = null

  if (listing?.hero_photo_id) {
    const { data: photo } = await supabase
      .from('photos')
      .select('raw_url, processed_url')
      .eq('id', listing.hero_photo_id)
      .single()

    if (photo) {
      const path = photo.processed_url || photo.raw_url
      if (path?.startsWith('http')) {
        heroPhotoUrl = path
      } else if (path) {
        const { data: signed } = await supabase.storage
          .from('raw-images')
          .createSignedUrl(path, 86400)
        heroPhotoUrl = signed?.signedUrl ?? null
      }
    }
  }

  // Fallback: first completed photo
  if (!heroPhotoUrl) {
    const { data: firstPhoto } = await supabase
      .from('photos')
      .select('raw_url, processed_url')
      .eq('listing_id', event.listing_id)
      .eq('status', 'completed')
      .order('display_order', { ascending: true })
      .limit(1)
      .single()

    if (firstPhoto) {
      const path = firstPhoto.processed_url || firstPhoto.raw_url
      if (path?.startsWith('http')) {
        heroPhotoUrl = path
      } else if (path) {
        const { data: signed } = await supabase.storage
          .from('raw-images')
          .createSignedUrl(path, 86400)
        heroPhotoUrl = signed?.signedUrl ?? null
      }
    }
  }

  return (
    <CheckInForm
      event={{
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        description: event.description ?? null,
        checkin_count: event.checkin_count ?? 0,
        max_attendees: event.max_attendees ?? null,
      }}
      listing={{
        address: listing?.address ?? null,
        city: listing?.city ?? null,
        state: listing?.state ?? null,
        hero_photo_url: heroPhotoUrl,
      }}
    />
  )
}
