export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanLimits, normalizeTier } from '@/lib/content/limits';
import { printMaterialsSchema, parseBody } from '@/lib/validation/schemas';
import { renderToBuffer } from '@react-pdf/renderer';
import { FlyerDocument } from '@/lib/print/flyer-template';
import { FeatureSheetDocument } from '@/lib/print/feature-sheet-template';
import { fetchImageAsBase64, generateQrCodeDataUri } from '@/lib/print/pdf-utils';
import type { PrintMaterialsInput, PrintBrandData, PrintPhotoData, PrintListingData } from '@/lib/print/types';

import { logger } from '@/lib/logger';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com';

interface ListingRow {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type: string | null;
  year_built: number | null;
  lot_size: string | null;
  parking: string | null;
  features: string[] | null;
  mls_number: string | null;
  hoa_fees: number | null;
  hero_photo_id: string | null;
  user_id: string;
}

interface PhotoRow {
  id: string;
  processed_url: string;
  variant: string | null;
  display_order: number | null;
}

interface BrandRow {
  business_name: string | null;
  logo_url: string | null;
  brokerage_logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  brokerage_name: string | null;
  license_number: string | null;
  tagline: string | null;
}

interface MarketingJobRow {
  description_result: Record<string, unknown> | null;
}

interface PropertySiteRow {
  slug: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse + validate
    const body: unknown = await request.json();
    const parsed = parseBody(printMaterialsSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error, details: parsed.details }, { status: 400 });
    }
    const { listingId, type } = parsed.data;

    // 2. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Billing check — starter+ (canAccessContentStudio)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = normalizeTier(profile?.subscription_tier);
    const limits = getPlanLimits(tier);
    if (!limits.canAccessContentStudio) {
      return NextResponse.json({ error: 'Upgrade to access print materials' }, { status: 403 });
    }

    // 4. Fetch listing data (with ownership check)
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, address, city, state, postal_code, price, bedrooms, bathrooms, square_feet, property_type, year_built, lot_size, parking, features, mls_number, hoa_fees, hero_photo_id, user_id')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const typedListing = listing as ListingRow;

    // 5. Fetch marketing job description (latest for this listing)
    const { data: marketingJob } = await supabase
      .from('marketing_jobs')
      .select('description_result')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const typedJob = marketingJob as MarketingJobRow | null;
    const aiDescription = typedJob?.description_result
      ? (typeof typedJob.description_result === 'object' && 'description' in typedJob.description_result
        ? String(typedJob.description_result.description)
        : null)
      : null;

    // 6. Fetch processed photos
    const { data: photos } = await supabase
      .from('photos')
      .select('id, processed_url, variant, display_order')
      .eq('listing_id', listingId)
      .eq('status', 'completed')
      .not('processed_url', 'is', null)
      .order('display_order', { ascending: true });

    const typedPhotos = (photos || []) as PhotoRow[];
    const maxPhotos = type === 'flyer' ? 5 : 12;
    const photosToFetch = typedPhotos.slice(0, maxPhotos);

    // 7. Fetch brand profile
    const { data: brandProfile } = await supabase
      .from('brand_profiles')
      .select('business_name, logo_url, brokerage_logo_url, primary_color, secondary_color, phone, email, website, brokerage_name, license_number, tagline')
      .eq('user_id', user.id)
      .maybeSingle();

    const typedBrand = brandProfile as BrandRow | null;

    // 8. Fetch property site slug (for QR code URL)
    const { data: propertySite } = await supabase
      .from('property_sites')
      .select('slug')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const typedSite = propertySite as PropertySiteRow | null;

    // 9. Fetch photos as base64 in parallel using signed URLs
    const photoPromises = photosToFetch.map(async (photo): Promise<PrintPhotoData | null> => {
      try {
        const { data: signedUrl } = await supabase.storage
          .from('raw-images')
          .createSignedUrl(photo.processed_url, 120);

        if (!signedUrl?.signedUrl) return null;

        const base64 = await fetchImageAsBase64(signedUrl.signedUrl);
        if (!base64) return null;

        return {
          id: photo.id,
          base64DataUri: base64,
          isHero: photo.id === typedListing.hero_photo_id,
        };
      } catch {
        return null;
      }
    });

    const photoResults = await Promise.allSettled(photoPromises);
    const resolvedPhotos: PrintPhotoData[] = photoResults
      .filter((r): r is PromiseFulfilledResult<PrintPhotoData | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((p): p is PrintPhotoData => p !== null);

    // 10. Fetch logo images as base64
    const [logoBase64, brokerageLogoBase64] = await Promise.all([
      typedBrand?.logo_url ? fetchImageAsBase64(typedBrand.logo_url) : Promise.resolve(null),
      typedBrand?.brokerage_logo_url ? fetchImageAsBase64(typedBrand.brokerage_logo_url) : Promise.resolve(null),
    ]);

    // 11. Generate QR code
    const propertySiteUrl = typedSite?.slug ? `${BASE_URL}/p/${typedSite.slug}` : null;
    const qrCodeDataUri = propertySiteUrl
      ? await generateQrCodeDataUri(propertySiteUrl)
      : null;

    // 12. Assemble input
    const printListing: PrintListingData = {
      id: typedListing.id,
      title: typedListing.title,
      address: typedListing.address,
      city: typedListing.city,
      state: typedListing.state,
      postal_code: typedListing.postal_code,
      price: typedListing.price,
      bedrooms: typedListing.bedrooms,
      bathrooms: typedListing.bathrooms,
      square_feet: typedListing.square_feet,
      property_type: typedListing.property_type,
      year_built: typedListing.year_built,
      lot_size: typedListing.lot_size,
      parking: typedListing.parking,
      features: typedListing.features || [],
      mls_number: typedListing.mls_number,
      hoa_fees: typedListing.hoa_fees,
      description: aiDescription,
    };

    const printBrand: PrintBrandData = {
      business_name: typedBrand?.business_name ?? null,
      logo_base64: logoBase64,
      brokerage_logo_base64: brokerageLogoBase64,
      primary_color: typedBrand?.primary_color || '#D4AF37',
      secondary_color: typedBrand?.secondary_color || '#1A1A1A',
      phone: typedBrand?.phone ?? null,
      email: typedBrand?.email ?? null,
      website: typedBrand?.website ?? null,
      brokerage_name: typedBrand?.brokerage_name ?? null,
      license_number: typedBrand?.license_number ?? null,
      tagline: typedBrand?.tagline ?? null,
    };

    const printInput: PrintMaterialsInput = {
      listing: printListing,
      brand: printBrand,
      photos: resolvedPhotos,
      qrCodeDataUri,
      propertySiteUrl,
      generatedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    // 13. Render PDF
    const pdfElement = type === 'flyer'
      ? FlyerDocument(printInput)
      : FeatureSheetDocument(printInput);

    const pdfBuffer = await renderToBuffer(pdfElement);

    // 14. Return PDF binary
    const safeName = (typedListing.address || 'property')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}-${type}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Print materials generation error:', message);
    return NextResponse.json({ error: 'Failed to generate print materials' }, { status: 500 });
  }
}
