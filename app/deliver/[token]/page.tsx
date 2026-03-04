/**
 * /deliver/[token] — Photographer-branded client delivery page
 *
 * Public page — no auth required. The token acts as the credential.
 * Shows photographer's org branding (logo, name, color) — zero SnapR branding.
 * Clients can view and download their property photos here.
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { adminSupabase } from '@/lib/supabase/admin'
import DeliveryPageClient from './DeliveryPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ token: string }>
}

interface DeliveryLinkRow {
  id: string
  token: string
  listing_id: string
  client_name: string
  client_email: string
  allow_download: boolean
  expires_at: string | null
  status: string
  message: string | null
  viewed_at: string | null
  photographer_id: string
  organization_id: string | null
}

interface OrgRow {
  id: string
  name: string
  platform_name: string | null
  logo_url: string | null
  primary_color: string | null
}

interface ListingRow {
  id: string
  address: string | null
  city: string | null
  state: string | null
  title: string | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  price: number | null
}

interface PhotoRow {
  id: string
  raw_url: string | null
  processed_url: string | null
  display_order: number | null
  variant: string | null
}

interface ProfileRow {
  full_name: string | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const admin = adminSupabase()

  const { data: link } = await admin
    .from('delivery_links')
    .select('client_name, organization_id, listing_id')
    .eq('token', token)
    .eq('status', 'active')
    .single()

  if (!link) return { title: 'Photo Delivery' }

  let studioName = 'Your Photographer'
  if (link.organization_id) {
    const { data: org } = await admin
      .from('organizations')
      .select('platform_name, name')
      .eq('id', link.organization_id)
      .single()
    if (org) studioName = org.platform_name ?? org.name ?? studioName
  }

  return {
    title: `${link.client_name}'s Photos | ${studioName}`,
    description: 'Your professional property photos are ready to view and download.',
    robots: { index: false, follow: false },
  }
}

export default async function DeliveryPage({ params }: Props) {
  const { token } = await params
  const admin = adminSupabase()

  // Fetch the delivery link
  const { data: link } = await admin
    .from('delivery_links')
    .select('id, token, listing_id, client_name, client_email, allow_download, expires_at, status, message, viewed_at, photographer_id, organization_id')
    .eq('token', token)
    .single()

  if (!link) notFound()

  const linkData = link as DeliveryLinkRow

  // Check expiry
  if (linkData.status === 'revoked') notFound()
  if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
    // Mark expired
    await admin.from('delivery_links').update({ status: 'expired' }).eq('id', linkData.id)
    notFound()
  }
  if (linkData.status === 'expired') notFound()

  // Record first view
  if (!linkData.viewed_at) {
    await admin
      .from('delivery_links')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', linkData.id)

    await admin.from('delivery_events').insert({
      delivery_link_id: linkData.id,
      listing_id: linkData.listing_id,
      event_type: 'viewed',
    })
  }

  // Fetch org branding
  let org: OrgRow | null = null
  if (linkData.organization_id) {
    const { data } = await admin
      .from('organizations')
      .select('id, name, platform_name, logo_url, primary_color')
      .eq('id', linkData.organization_id)
      .single()
    org = data as OrgRow | null
  }

  // Fetch photographer name
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', linkData.photographer_id)
    .single()

  const profileData = profile as ProfileRow | null
  const photographerName = profileData?.full_name ?? org?.platform_name ?? 'Your Photographer'
  const studioName = org?.platform_name ?? org?.name ?? photographerName
  const primaryColor = org?.primary_color ?? '#D4A017'
  const logoUrl = org?.logo_url ?? null

  // Fetch listing details
  const { data: listing } = await admin
    .from('listings')
    .select('id, address, city, state, title, bedrooms, bathrooms, square_feet, price')
    .eq('id', linkData.listing_id)
    .single()

  const listingData = listing as ListingRow | null

  // Fetch photos for this listing
  const { data: photos } = await admin
    .from('photos')
    .select('id, raw_url, processed_url, display_order, variant')
    .eq('listing_id', linkData.listing_id)
    .in('status', ['completed', 'ready'])
    .order('display_order', { ascending: true })

  const rawPhotos = (photos ?? []) as PhotoRow[]

  // Generate signed URLs for all photos
  const photoUrls = await Promise.all(
    rawPhotos.map(async (photo) => {
      const path = photo.processed_url || photo.raw_url
      if (!path) return null

      if (path.startsWith('http')) {
        return {
          id: photo.id,
          url: path,
          downloadUrl: path,
          variant: photo.variant ?? null,
          order: photo.display_order ?? 0,
        }
      }

      // Generate signed URL for storage paths (valid 24h)
      const { data: signed } = await admin.storage
        .from('raw-images')
        .createSignedUrl(path, 86400)

      if (!signed?.signedUrl) return null

      return {
        id: photo.id,
        url: signed.signedUrl,
        downloadUrl: signed.signedUrl,
        variant: photo.variant ?? null,
        order: photo.display_order ?? 0,
      }
    })
  )

  const resolvedPhotos = photoUrls.filter(Boolean) as Array<{
    id: string
    url: string
    downloadUrl: string
    variant: string | null
    order: number
  }>

  const propertyLabel = listingData
    ? [listingData.address, listingData.city, listingData.state].filter(Boolean).join(', ')
      || listingData.title
      || 'Your Property'
    : 'Your Property'

  return (
    <DeliveryPageClient
      deliveryId={linkData.id}
      listingId={linkData.listing_id}
      clientName={linkData.client_name}
      photographerName={photographerName}
      studioName={studioName}
      primaryColor={primaryColor}
      logoUrl={logoUrl}
      propertyLabel={propertyLabel}
      message={linkData.message}
      allowDownload={linkData.allow_download}
      expiresAt={linkData.expires_at}
      photos={resolvedPhotos}
      listing={listingData ? {
        bedrooms: listingData.bedrooms,
        bathrooms: listingData.bathrooms,
        squareFeet: listingData.square_feet,
        price: listingData.price,
      } : null}
    />
  )
}
