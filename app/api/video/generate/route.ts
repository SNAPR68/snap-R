export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { renderMediaOnLambda } from '@remotion/lambda/client';
import type { AwsRegion } from '@remotion/lambda';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { generateVideoSchema } from '@/lib/validation/schemas';
import { orderPhotosForWalkthrough } from '@/lib/video/photo-ordering';
import { ZodError } from 'zod';

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

interface RenderResponse {
  renderId: string;
  bucketName: string;
}

// Map template + aspectRatio to Remotion composition ID
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
      return 'TestVideo';
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate input with Zod
    let validatedInput;
    try {
      validatedInput = generateVideoSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid request body',
            details: error.flatten(),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Fetch listing with photos + preparation metadata for smart ordering
    const admin = adminSupabase();
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, title, address, city, state, description, price, bedrooms, bathrooms, square_feet, preparation_metadata, photos!photos_listing_id_fkey(id, processed_url)')
      .eq('id', validatedInput.listingId)
      .eq('user_id', user.id)
      .single<ListingWithPhotos>();

    if (listingError || !listing) {
      console.error('[video/generate] Listing query failed:', {
        listingId: validatedInput.listingId,
        userId: user.id,
        error: listingError?.message,
        code: listingError?.code,
      });
      return NextResponse.json(
        { error: 'Listing not found', details: listingError?.message },
        { status: 404 }
      );
    }

    // Validate listing has photos
    if (!listing.photos || listing.photos.length === 0) {
      return NextResponse.json(
        { error: 'Listing has no photos' },
        { status: 400 }
      );
    }

    // Check Remotion environment variables
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
      console.error('[video/generate] Missing env vars:', missingEnvVars);
      return NextResponse.json(
        {
          error: 'Video rendering not configured',
          code: 'MISSING_ENV',
          missingVars: missingEnvVars,
          hint: 'Set REMOTION_* vars in Vercel Environment Variables',
        },
        { status: 503 }
      );
    }

    // Fetch brand profile for video closing card
    const { data: brandProfile } = await admin
      .from('brand_profiles')
      .select('business_name, logo_url, primary_color, secondary_color, phone, email, website, tagline, brokerage_name')
      .eq('user_id', user.id)
      .maybeSingle()

    // Order photos using AI room classification (zero additional cost)
    const orderedStoragePaths = orderPhotosForWalkthrough(
      listing.photos,
      listing.preparation_metadata as Record<string, unknown> | null
    );

    if (orderedStoragePaths.length === 0) {
      return NextResponse.json(
        { error: 'No processed photos available' },
        { status: 400 }
      );
    }

    // Resolve storage paths to signed URLs accessible by Lambda
    const orderedPhotoUrls = await Promise.all(
      orderedStoragePaths.map(async (path) => {
        if (path.startsWith('http')) return path;
        const { data } = await admin.storage
          .from('raw-images')
          .createSignedUrl(path, 7200);
        return data?.signedUrl ?? null;
      })
    );
    const validPhotoUrls = orderedPhotoUrls.filter(Boolean) as string[];

    if (validPhotoUrls.length === 0) {
      return NextResponse.json(
        { error: 'Could not resolve photo URLs' },
        { status: 500 }
      );
    }

    // Resolve composition ID from template + aspect ratio
    const compositionId = getCompositionId(
      validatedInput.template,
      validatedInput.aspectRatio
    );

    // Build template-specific input props
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
      photos: validPhotoUrls,
    };

    const inputProps: Record<string, unknown> = {
      listing: listingProps,
      aspectRatio: validatedInput.aspectRatio,
      brand: brandProfile ? {
        agentName: brandProfile.business_name ?? undefined,
        brokerageName: brandProfile.brokerage_name ?? undefined,
        phone: brandProfile.phone ?? undefined,
        email: brandProfile.email ?? undefined,
        website: brandProfile.website ?? undefined,
        logoUrl: brandProfile.logo_url ?? undefined,
        primaryColor: brandProfile.primary_color ?? undefined,
        tagline: brandProfile.tagline ?? undefined,
      } : undefined,
    };

    // OpenHouse needs date
    if (validatedInput.template === 'open-house' && validatedInput.openHouseDate) {
      inputProps.openHouseDate = validatedInput.openHouseDate;
    }

    // PriceDrop needs previousPrice
    if (validatedInput.template === 'price-drop' && validatedInput.previousPrice) {
      listingProps.previousPrice = validatedInput.previousPrice;
    }

    // Sold needs daysOnMarket
    if (validatedInput.template === 'sold' && validatedInput.daysOnMarket !== undefined) {
      listingProps.daysOnMarket = validatedInput.daysOnMarket;
    }

    // Audio params (UI sends 0-100, compositions expect 0-1)
    if (validatedInput.audio) {
      inputProps.audio = {
        musicTrack: validatedInput.audio.musicTrack,
        musicVolume: (validatedInput.audio.musicVolume ?? 30) / 100,
        voiceoverUrl: validatedInput.audio.voiceoverUrl,
        voiceoverVolume: (validatedInput.audio.voiceoverVolume ?? 100) / 100,
      };
    }

    // Log pre-render diagnostics
    console.log('[video/generate] Pre-render:', {
      compositionId,
      photoCount: validPhotoUrls.length,
      hasAudio: !!validatedInput.audio,
      region: process.env.REMOTION_AWS_REGION,
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME,
      serveUrlPrefix: process.env.REMOTION_LAMBDA_SERVE_URL?.substring(0, 50),
    });

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
      outName: `${validatedInput.listingId}-${validatedInput.aspectRatio.replace(':', 'x')}-${Date.now()}.mp4`,
    }) as RenderResponse;

    // Store render job in database
    const { error: insertError } = await admin
      .from('video_render_jobs')
      .insert({
        user_id: user.id,
        listing_id: validatedInput.listingId,
        render_id: renderResponse.renderId,
        bucket_name: renderResponse.bucketName,
        status: 'rendering',
        input_props: validatedInput,
      });

    if (insertError) {
      console.error('[video/generate] Database insert failed:', insertError);
    }

    // Return success response
    return NextResponse.json(
      {
        renderId: renderResponse.renderId,
        bucketName: renderResponse.bucketName,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorObj = error as Record<string, unknown> | undefined;
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : typeof error;

    // Extract AWS SDK metadata (httpStatusCode, requestId, etc.)
    const awsMeta = errorObj?.$metadata as Record<string, unknown> | undefined;
    const httpStatusCode = awsMeta?.httpStatusCode as number | undefined;
    const requestId = (awsMeta?.requestId ?? errorObj?.requestId) as string | undefined;

    // Check for wrapped cause (e.g. AWS SDK wraps inner errors)
    const causeMsg = error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : undefined;
    const displayMessage = causeMsg ? `${message} — ${causeMsg}` : message;

    console.error('[video/generate] Full error:', {
      name: errorName,
      message: displayMessage,
      awsHttpStatus: httpStatusCode,
      requestId,
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME,
      hasAccessKey: !!process.env.REMOTION_AWS_ACCESS_KEY_ID,
      accessKeyPrefix: process.env.REMOTION_AWS_ACCESS_KEY_ID?.substring(0, 8),
      stack: stack?.split('\n').slice(0, 10).join('\n'),
    });

    return NextResponse.json(
      {
        error: displayMessage,
        code: 'RENDER_TRIGGER_FAILED',
        errorName,
        awsHttpStatus: httpStatusCode,
        requestId,
      },
      { status: 500 }
    );
  }
}
