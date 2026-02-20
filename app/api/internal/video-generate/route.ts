/**
 * Internal Video Generate API
 * ============================
 * Called by the Cloudflare Worker (marketing handler) to trigger video generation
 * as Step 6 of the marketing pipeline.
 *
 * Auth: Bearer CRON_SECRET (same pattern as cron jobs)
 * This bypasses Supabase user auth since the Worker has no user session.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { renderMediaOnLambda } from '@remotion/lambda/client';
import type { AwsRegion } from '@remotion/lambda';
import { adminSupabase } from '@/lib/supabase/admin';
import { orderPhotosForWalkthrough } from '@/lib/video/photo-ordering';

const CRON_SECRET = process.env.CRON_SECRET;

interface InternalGenerateBody {
  listingId: string;
  userId: string;
  template?: string;
  aspectRatio?: string;
  previousPrice?: number;
  daysOnMarket?: number;
}

interface ListingWithPhotos {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  preparation_metadata: Record<string, unknown> | null;
  photos: Array<{ id: string; processed_url: string | null }>;
}

interface BrandProfile {
  business_name: string | null;
  logo_url: string | null;
  brokerage_logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  phone: string | null;
  website: string | null;
  tagline: string | null;
}

interface RenderResponse {
  renderId: string;
  bucketName: string;
}

function getCompositionId(template: string, aspectRatio: string): string {
  const ratioKey = aspectRatio.replace(':', 'x');
  switch (template) {
    case 'property-showcase':
      return `PropertyShowcase-${ratioKey}`;
    case 'just-listed':
      return `JustListed-${ratioKey}`;
    case 'open-house':
      return `OpenHouse-${ratioKey}`;
    case 'price-drop':
      return `PriceDrop-${ratioKey}`;
    case 'sold':
      return `Sold-${ratioKey}`;
    default:
      return `PropertyShowcase-${ratioKey}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth: same pattern as cron jobs
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as InternalGenerateBody;
    const { listingId, userId } = body;
    const template = body.template || 'property-showcase';
    const aspectRatio = body.aspectRatio || '9:16';

    if (!listingId || !userId) {
      return NextResponse.json(
        { error: 'listingId and userId are required' },
        { status: 400 }
      );
    }

    // Fetch listing with photos using admin client (no user session)
    const admin = adminSupabase();
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, title, address, city, state, description, price, bedrooms, bathrooms, square_feet, preparation_metadata, photos!photos_listing_id_fkey(id, processed_url)')
      .eq('id', listingId)
      .eq('user_id', userId)
      .single<ListingWithPhotos>();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (!listing.photos || listing.photos.length === 0) {
      return NextResponse.json(
        { error: 'Listing has no photos' },
        { status: 400 }
      );
    }

    // Check Remotion env vars
    const requiredEnvVars = [
      'REMOTION_AWS_REGION',
      'REMOTION_AWS_ACCESS_KEY_ID',
      'REMOTION_AWS_SECRET_ACCESS_KEY',
      'REMOTION_LAMBDA_FUNCTION_NAME',
      'REMOTION_S3_BUCKET_NAME',
      'REMOTION_LAMBDA_SERVE_URL',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingEnvVars.length > 0) {
      console.error('[internal/video-generate] Missing env vars:', missingEnvVars);
      return NextResponse.json(
        { error: 'Video rendering not configured' },
        { status: 503 }
      );
    }

    // Order photos using AI room classification
    const orderedPhotoUrls = orderPhotosForWalkthrough(
      listing.photos,
      listing.preparation_metadata
    );

    if (orderedPhotoUrls.length === 0) {
      return NextResponse.json(
        { error: 'No processed photos available' },
        { status: 400 }
      );
    }

    // Fetch agent brand profile (optional — videos work without branding)
    const { data: brandProfile } = await admin
      .from('brand_profiles')
      .select('business_name, logo_url, brokerage_logo_url, primary_color, secondary_color, phone, website, tagline')
      .eq('user_id', userId)
      .maybeSingle<BrandProfile>();

    // Resolve composition ID
    const compositionId = getCompositionId(template, aspectRatio);

    // Build input props
    const listingProps: Record<string, unknown> = {
      address: listing.address,
      title: listing.title ?? undefined,
      city: listing.city ?? undefined,
      state: listing.state ?? undefined,
      description: listing.description ?? undefined,
      price: listing.price ?? undefined,
      beds: listing.bedrooms ?? undefined,
      baths: listing.bathrooms ?? undefined,
      sqft: listing.square_feet ?? undefined,
      photos: orderedPhotoUrls,
    };

    // PriceDrop needs previousPrice
    if (template === 'price-drop' && body.previousPrice) {
      listingProps.previousPrice = body.previousPrice;
    }

    // Sold needs daysOnMarket
    if (template === 'sold' && body.daysOnMarket !== undefined) {
      listingProps.daysOnMarket = body.daysOnMarket;
    }

    const inputProps: Record<string, unknown> = {
      listing: listingProps,
      aspectRatio,
    };

    // Inject brand data if agent has a brand profile
    if (brandProfile) {
      inputProps.brand = {
        businessName: brandProfile.business_name ?? undefined,
        logoUrl: brandProfile.logo_url ?? undefined,
        brokerageLogoUrl: brandProfile.brokerage_logo_url ?? undefined,
        primaryColor: brandProfile.primary_color || '#D4AF37',
        secondaryColor: brandProfile.secondary_color || '#1A1A1A',
        phone: brandProfile.phone ?? undefined,
        website: brandProfile.website ?? undefined,
        tagline: brandProfile.tagline ?? undefined,
      };
    }

    // Trigger Lambda render
    const renderResponse = await renderMediaOnLambda({
      region: process.env.REMOTION_AWS_REGION as AwsRegion,
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
      serveUrl: process.env.REMOTION_LAMBDA_SERVE_URL!,
      composition: compositionId,
      inputProps,
      codec: 'h264',
      imageFormat: 'jpeg',
      maxRetries: 3,
      privacy: 'public',
      framesPerLambda: 20000,
      timeoutInMilliseconds: 900000,
      outName: `${listingId}-${aspectRatio.replace(':', 'x')}-${Date.now()}.mp4`,
    }) as RenderResponse;

    // Store render job in database
    const { error: insertError } = await admin
      .from('video_render_jobs')
      .insert({
        user_id: userId,
        listing_id: listingId,
        render_id: renderResponse.renderId,
        bucket_name: renderResponse.bucketName,
        status: 'rendering',
        input_props: {
          listingId,
          aspectRatio,
          template,
          source: 'marketing-pipeline',
        },
      });

    if (insertError) {
      console.error('[internal/video-generate] Database insert failed:', insertError);
    }

    console.log(`[internal/video-generate] Render triggered: ${renderResponse.renderId} for listing ${listingId}`);

    return NextResponse.json({
      renderId: renderResponse.renderId,
      bucketName: renderResponse.bucketName,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const awsMeta = (error as Record<string, unknown>)?.$metadata as Record<string, unknown> | undefined;
    console.error('[internal/video-generate] Full error:', {
      name: error instanceof Error ? error.name : typeof error,
      message,
      awsHttpStatus: awsMeta?.httpStatusCode,
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10).join('\n') : undefined,
    });
    return NextResponse.json(
      { error: message, code: 'INTERNAL_RENDER_FAILED' },
      { status: 500 }
    );
  }
}
