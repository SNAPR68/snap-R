/**
 * Listings Service Layer
 * ======================
 * Shared business logic for listings, used by both internal routes and v1 API.
 * All functions take a Supabase client + userId (decoupled from auth method).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

function sanitize(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const LISTING_SELECT = 'id, title, address, city, state, postal_code, description, preparation_status, marketing_status, created_at'

export interface ListingData {
  title?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  description?: string | null
  marketingStatus?: string
}

export interface ListingsQueryOptions {
  page?: number
  perPage?: number
  withPhotos?: boolean
}

export async function getListings(
  supabase: SupabaseClient,
  userId: string,
  options: ListingsQueryOptions = {}
) {
  const { page = 1, perPage = 50 } = options
  const offset = (page - 1) * perPage

  // Get total count
  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { data, error } = await supabase
    .from('listings')
    .select(`${LISTING_SELECT}, photos!photos_listing_id_fkey(count)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) {
    throw new Error(`Failed to fetch listings: ${error.message}`)
  }

  interface ListingRow {
    id: string
    title: string | null
    address: string | null
    city: string | null
    state: string | null
    postal_code: string | null
    description: string | null
    preparation_status: string | null
    marketing_status: string | null
    created_at: string
    photos: { count: number }[]
  }

  const listings = (data ?? []).map((listing: ListingRow) => {
    const countRow = listing.photos?.[0] as { count: number } | undefined
    const photoCount = countRow?.count ?? 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photos: _photos, ...rest } = listing
    return { ...rest, photo_count: photoCount }
  })

  return {
    listings,
    meta: { page, per_page: perPage, total: count ?? 0 },
  }
}

export async function getListing(
  supabase: SupabaseClient,
  userId: string,
  listingId: string
) {
  const { data: listing, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', listingId)
    .eq('user_id', userId)
    .single()

  if (error || !listing) {
    return null
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from('photos')
    .select('id, raw_url, processed_url, variant, status, created_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true })

  return { listing, photos: photos ?? [] }
}

export async function createListing(
  supabase: SupabaseClient,
  userId: string,
  input: ListingData
) {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: userId,
      title: sanitize(input.title),
      address: sanitize(input.address),
      city: sanitize(input.city),
      state: sanitize(input.state),
      postal_code: sanitize(input.postal_code),
      description: sanitize(input.description),
      marketing_status: 'Coming Soon',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create listing: ${error.message}`)
  }

  return data
}

export async function updateListing(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
  input: ListingData
) {
  const updates: Record<string, unknown> = {}
  if (input.title !== undefined) updates.title = sanitize(input.title)
  if (input.address !== undefined) updates.address = sanitize(input.address)
  if (input.city !== undefined) updates.city = sanitize(input.city)
  if (input.state !== undefined) updates.state = sanitize(input.state)
  if (input.postal_code !== undefined) updates.postal_code = sanitize(input.postal_code)
  if (input.description !== undefined) updates.description = sanitize(input.description)
  if (input.marketingStatus !== undefined) updates.marketing_status = input.marketingStatus

  const { data, error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', listingId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update listing: ${error.message}`)
  }

  return data
}

export async function deleteListing(
  supabase: SupabaseClient,
  userId: string,
  listingId: string
) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete listing: ${error.message}`)
  }

  return { success: true }
}
