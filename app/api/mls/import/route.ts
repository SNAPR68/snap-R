export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMLSProvider } from '@/lib/mls/provider';
import { mlsImportSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = mlsImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mlsNumber, provider: providerName } = parsed.data;

    const provider = getMLSProvider(providerName);
    const mlsData = await provider.fetchListing(mlsNumber);

    if (!mlsData) {
      return NextResponse.json(
        { error: 'No listing found for that MLS number' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        title: mlsData.address,
        address: mlsData.address,
        city: mlsData.city,
        state: mlsData.state,
        postal_code: mlsData.postalCode,
        price: mlsData.price,
        bedrooms: mlsData.bedrooms,
        bathrooms: mlsData.bathrooms,
        square_feet: mlsData.squareFeet,
        year_built: mlsData.yearBuilt,
        lot_size: mlsData.lotSize,
        property_type: mlsData.propertyType,
        description: mlsData.description,
        parking: mlsData.parking,
        features: mlsData.features,
        hoa_fees: mlsData.hoaFees,
        latitude: mlsData.latitude,
        longitude: mlsData.longitude,
        virtual_tour_url: mlsData.virtualTourUrl,
        mls_number: mlsData.mlsNumber,
        listing_status: mlsData.listingStatus,
        photos: mlsData.photos,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[MLS Import] Error:', message);
    return NextResponse.json(
      { error: 'Failed to import from MLS' },
      { status: 500 }
    );
  }
}
