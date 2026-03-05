/**
 * SnapR API - RESO JSON Export
 * ============================
 * GET /api/marketing/reso-export?listingId=<id>
 *
 * Returns a RESO Web API-compatible JSON payload for the listing,
 * including all property fields mapped to RESO Data Dictionary 2.0 keys.
 * Agents can copy-paste this into any RESO-compliant MLS system.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ListingRow {
  id: string
  title: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  lot_size: number | null
  year_built: number | null
  property_type: string | null
  parking: string | null
  hoa_fees: number | null
  mls_number: string | null
  description: string | null
  features: string[] | null
  created_at: string
}

interface PhotoRow {
  id: string
  processed_url: string | null
  raw_url: string | null
  display_order: number | null
  variant: string | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, title, address, city, state, zip, price, bedrooms, bathrooms, square_feet, lot_size, year_built, property_type, parking, hoa_fees, mls_number, description, features, created_at')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const l = listing as ListingRow

    // Fetch photos
    const { data: photos } = await supabase
      .from('photos')
      .select('id, processed_url, raw_url, display_order, variant')
      .eq('listing_id', listingId)
      .in('status', ['completed', 'ready'])
      .order('display_order', { ascending: true })

    const photoRows = (photos ?? []) as PhotoRow[]

    // Generate signed URLs for storage paths
    const photoUrls: string[] = []
    for (const p of photoRows) {
      const path = p.processed_url || p.raw_url
      if (!path) continue
      if (path.startsWith('http')) {
        photoUrls.push(path)
      } else {
        const { data: signed } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
        if (signed?.signedUrl) photoUrls.push(signed.signedUrl)
      }
    }

    // Map to RESO Data Dictionary 2.0 field names
    const resoPayload = {
      '@odata.context': 'https://snap-r.com/api/marketing/reso-export/$metadata#Property',
      '@odata.count': 1,
      value: [
        {
          // RESO standard identifiers
          ListingKey: l.id,
          ListingId: l.mls_number ?? l.id,
          ModificationTimestamp: l.created_at,

          // Address
          UnparsedAddress: l.address ?? undefined,
          City: l.city ?? undefined,
          StateOrProvince: l.state ?? undefined,
          PostalCode: l.zip ?? undefined,
          CountrySubdivisionCode: l.state ?? undefined,

          // Price
          ListPrice: l.price ?? undefined,
          ListPriceLow: l.price ?? undefined,

          // Property details
          PropertyType: mapPropertyType(l.property_type),
          PropertySubType: l.property_type ?? undefined,
          BedroomsTotal: l.bedrooms ?? undefined,
          BathroomsTotalInteger: l.bathrooms ? Math.floor(l.bathrooms) : undefined,
          BathroomsHalf: l.bathrooms ? Math.round((l.bathrooms % 1) * 10) : undefined,
          LivingArea: l.square_feet ?? undefined,
          LivingAreaUnits: 'Square Feet',
          LotSizeArea: l.lot_size ?? undefined,
          LotSizeUnits: 'Square Feet',
          YearBuilt: l.year_built ?? undefined,
          ParkingFeatures: l.parking ? [l.parking] : undefined,
          AssociationFee: l.hoa_fees ?? undefined,
          AssociationFeeFrequency: l.hoa_fees ? 'Monthly' : undefined,

          // Description
          PublicRemarks: l.description ?? undefined,
          PrivateRemarks: undefined,
          SyndicationRemarks: l.description ?? undefined,

          // Features
          InteriorFeatures: l.features ?? undefined,
          ExteriorFeatures: undefined,

          // Status
          StandardStatus: 'Active',
          MlsStatus: 'Active',

          // Media
          Media: photoUrls.map((url, i) => ({
            Order: i + 1,
            MediaURL: url,
            MediaType: 'image/jpeg',
            MediaCategory: 'Photo',
          })),

          // Agent/source info
          ListAgentKey: user.id,
          OriginatingSystemName: 'SnapR',
          SourceSystemName: 'SnapR',
        },
      ],
    }

    return NextResponse.json(resoPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="reso-${l.mls_number ?? l.id}.json"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function mapPropertyType(type: string | null): string {
  const map: Record<string, string> = {
    single_family: 'Residential',
    condo: 'Residential',
    townhouse: 'Residential',
    multi_family: 'ResidentialIncome',
    land: 'Land',
    commercial: 'CommercialSale',
    rental: 'ResidentialLease',
  }
  return type ? (map[type] ?? 'Residential') : 'Residential'
}
