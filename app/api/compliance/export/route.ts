export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateMlsExportPackage,
  getMlsOptions,
  type ExportPhoto,
} from '@/lib/compliance';

export const maxDuration = 120;

/**
 * GET /api/compliance/export
 * Get available MLS options
 */
export async function GET() {
  const options = getMlsOptions();
  return NextResponse.json({ mlsOptions: options });
}

/**
 * POST /api/compliance/export
 * Generate MLS export package (ZIP)
 */
export async function POST(request: NextRequest) {
  try {
    const {
      mlsId,
      photos,
      listingAddress,
      mlsNumber,
      agentName,
      brokerageName,
    } = await request.json();

    if (!mlsId || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'mlsId and photos array are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[MLS Export] Starting for', mlsId, '-', photos.length, 'photos');

    const result = await generateMlsExportPackage({
      mlsId,
      photos: photos as ExportPhoto[],
      listingAddress,
      mlsNumber,
      agentName,
      brokerageName,
      includeXmpSidecars: true,
    });

    if (!result.success || !result.zipBuffer) {
      return NextResponse.json(
        { error: 'Export failed', details: result.errors },
        { status: 500 }
      );
    }

    // Save ZIP to storage
    const zipFilename = `exports/${user.id}/${Date.now()}-mls-export.zip`;
    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(zipFilename, result.zipBuffer, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to save export package' },
        { status: 500 }
      );
    }

    // Get signed URL for download
    const { data: signedUrlData } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(zipFilename, 3600);

    console.log('[MLS Export] Complete -', result.manifest?.processedPhotos, 'photos processed');

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrlData?.signedUrl,
      manifest: result.manifest,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('[MLS Export] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
