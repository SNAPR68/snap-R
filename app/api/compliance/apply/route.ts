export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
  addWatermark,
  requiresWatermark,
  getWatermarkText,
  generateResoMetadata,
  embedMetadata,
} from '@/lib/compliance';
import { complianceApplyExtendedSchema, parseBody } from '@/lib/validation/schemas';

export const maxDuration = 60;

/**
 * POST /api/compliance/apply
 * Apply watermark and metadata to an image
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = parseBody(complianceApplyExtendedSchema, body);
    if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); }
    const { imageUrl, toolId, options } = validated.data;
    const opts = options || {};

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch original image
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    let processedBuffer: Buffer = Buffer.from(arrayBuffer);

    // Apply watermark if required (or forced)
    const shouldWatermark = opts.forceWatermark || requiresWatermark(toolId);
    if (shouldWatermark) {
      const watermarkText = opts.watermarkText || getWatermarkText(toolId);
      processedBuffer = await addWatermark(processedBuffer, {
        text: watermarkText,
        position: opts.watermarkPosition || 'bottom-left',
        opacity: opts.watermarkOpacity || 0.85,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('[Compliance Apply] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
