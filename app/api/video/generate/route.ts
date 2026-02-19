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
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number | null;
  features: string[] | null;
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
      .select('id, address, price, beds, baths, sqft, features, preparation_metadata, photos(id, processed_url)')
      .eq('id', validatedInput.listingId)
      .eq('user_id', user.id)
      .single<ListingWithPhotos>();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
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
          details: `Missing: ${missingEnvVars.join(', ')}`,
        },
        { status: 503 }
      );
    }

    // Order photos using AI room classification (zero additional cost)
    const orderedPhotoUrls = orderPhotosForWalkthrough(
      listing.photos,
      listing.preparation_metadata as Record<string, unknown> | null
    );

    if (orderedPhotoUrls.length === 0) {
      return NextResponse.json(
        { error: 'No processed photos available' },
        { status: 400 }
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
      price: listing.price,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft ?? undefined,
      photos: orderedPhotoUrls,
    };

    // JustListed needs features
    if (validatedInput.template === 'just-listed' && listing.features) {
      listingProps.features = listing.features;
    }

    const inputProps: Record<string, unknown> = {
      listing: listingProps,
      aspectRatio: validatedInput.aspectRatio,
    };

    // OpenHouse needs date
    if (validatedInput.template === 'open-house' && validatedInput.openHouseDate) {
      inputProps.openHouseDate = validatedInput.openHouseDate;
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[video/generate]', error);

    return NextResponse.json(
      {
        error: message,
        code: 'RENDER_TRIGGER_FAILED',
      },
      { status: 500 }
    );
  }
}
