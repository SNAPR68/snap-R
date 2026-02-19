export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { renderMediaOnLambda } from '@remotion/lambda/client';
import type { AwsRegion } from '@remotion/lambda';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { generateVideoSchema } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

interface ListingWithPhotos {
  id: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  photos: Array<{ processed_url: string }>;
}

interface RenderResponse {
  renderId: string;
  bucketName: string;
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

    // Fetch listing with photos
    const admin = adminSupabase();
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, address, price, beds, baths, photos(processed_url)')
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

    // Trigger Lambda render
    const processedPhotos = listing.photos
      .map((p) => p.processed_url)
      .filter(Boolean);

    const renderResponse = await renderMediaOnLambda({
      region: process.env.REMOTION_AWS_REGION as AwsRegion,
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
      serveUrl: process.env.REMOTION_LAMBDA_SERVE_URL!,
      composition: 'TestVideo',
      inputProps: {
        listing: {
          address: listing.address,
          price: listing.price,
          beds: listing.beds,
          baths: listing.baths,
          photos: processedPhotos,
        },
        aspectRatio: validatedInput.aspectRatio,
      },
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
      // Don't fail the request - render is already triggered
      // Just log the error and continue
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
