export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  addWatermark,
  requiresWatermark,
  getWatermarkText,
  generateResoMetadata,
  embedMetadata,
} from '@/lib/compliance';

export const maxDuration = 60;

/**
 * POST /api/compliance/apply
 * Apply watermark and metadata to an image
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, toolId, options = {} } = await request.json();

    if (!imageUrl || !toolId) {
      return NextResponse.json(
        { error: 'imageUrl and toolId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    let processedBuffer: Buffer = Buffer.from(arrayBuffer);

    // Apply watermark if required (or forced)
    const shouldWatermark = options.forceWatermark || requiresWatermark(toolId);
    if (shouldWatermark) {
      const watermarkText = options.watermarkText || getWatermarkText(toolId);
      processedBuffer = await addWatermark(processedBuffer, {
        text: watermarkText,
        position: options.watermarkPosition || 'bottom-left',
        opacity: options.watermarkOpacity || 0.85,
      });
    }

    // Embed metadata
    const metadata = generateResoMetadata(toolId);
    processedBuffer = await embedMetadata(processedBuffer, metadata);

    // Upload to Supabase storage
    const filename = `compliant/${user.id}/${Date.now()}-${toolId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(filename, processedBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to save compliant image' },
        { status: 500 }
      );
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(filename, 3600);

    return NextResponse.json({
      success: true,
      compliantUrl: signedUrlData?.signedUrl,
      storagePath: filename,
      watermarkApplied: shouldWatermark,
      metadata: {
        enhancementType: metadata.imageEnhancementType,
        disclosureRequired: metadata.disclosureRequired,
      },
    });
  } catch (error: any) {
    console.error('[Compliance Apply] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
