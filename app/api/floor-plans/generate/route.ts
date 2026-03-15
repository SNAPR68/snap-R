import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFloorPlan } from '@/lib/floorplans/service';
import { z } from 'zod';

const generateSchema = z.object({
  listingId: z.string().uuid(),
  planType: z.enum(['2d-basic', '2d-branded', '3d-isometric', 'interactive']).default('2d-basic'),
  style: z.enum(['modern', 'classic', 'minimal', 'detailed']).default('modern'),
  colorScheme: z.enum(['color', 'grayscale', 'blueprint']).default('color'),
  options: z.object({
    showDimensions: z.boolean().default(true),
    showFurniture: z.boolean().default(false),
    showRoomNames: z.boolean().default(true),
    showSqft: z.boolean().default(true),
    includeBranding: z.boolean().default(false),
    brandLogoUrl: z.string().url().optional(),
  }).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { listingId, planType, style, colorScheme, options } = parsed.data;

    // Verify listing belongs to user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, address, bedrooms, bathrooms, square_feet')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get listing photos for AI analysis
    const { data: photos } = await supabase
      .from('photos')
      .select('id, raw_url, processed_url, status')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });

    // Build photo URLs for the service
    const photoUrls: string[] = [];
    for (const photo of photos || []) {
      const url = photo.processed_url || photo.raw_url;
      if (url) {
        if (url.startsWith('http')) {
          photoUrls.push(url);
        } else {
          const { data: signedData } = await supabase.storage
            .from('raw-images')
            .createSignedUrl(url, 3600);
          if (signedData?.signedUrl) {
            photoUrls.push(signedData.signedUrl);
          }
        }
      }
    }

    // Generate floor plan
    const result = await generateFloorPlan({
      listingId,
      planType,
      style,
      colorScheme,
      sourcePhotos: photoUrls,
      propertyDetails: {
        address: listing.address ?? undefined,
        sqft: listing.square_feet ?? undefined,
        bedrooms: listing.bedrooms ?? undefined,
        bathrooms: listing.bathrooms ?? undefined,
      },
      options,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Floor plan generation failed' },
        { status: 422 }
      );
    }

    // Save floor plan record
    const { data: floorPlan, error: insertError } = await supabase
      .from('floor_plans')
      .insert({
        user_id: user.id,
        listing_id: listingId,
        name: `${listing.title || listing.address || 'Property'} Floor Plan`,
        plan_type: planType,
        style,
        color_scheme: colorScheme,
        total_sqft: listing.square_feet,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        image_url: result.imageUrl,
        pdf_url: result.pdfUrl ?? null,
        rooms: result.rooms ?? [],
        source_photos: photoUrls.slice(0, 10),
        show_dimensions: options.showDimensions,
        show_furniture: options.showFurniture,
        show_room_names: options.showRoomNames,
        show_sqft: options.showSqft,
        include_branding: options.includeBranding,
        brand_logo_url: options.brandLogoUrl ?? null,
        status: 'completed',
        processing_method: result.processingMethod,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to save floor plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      floorPlan,
      rooms: result.rooms,
      processingMethod: result.processingMethod,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
