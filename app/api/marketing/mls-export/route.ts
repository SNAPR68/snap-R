/**
 * SnapR API - MLS Export (On-Demand ZIP)
 * =======================================
 * GET: Generate and stream MLS-compliant ZIP package
 *
 * This runs on Vercel (not Worker) because it requires
 * sharp (image processing) and archiver (ZIP creation).
 *
 * Reads the MLS manifest from marketing_jobs, then generates
 * the actual ZIP with compliant photos, disclosure, and CSV.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // ZIP generation may take time

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify listing and get address
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, address, title, user_id')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get marketing job with MLS manifest
    const { data: marketingJob } = await supabase
      .from('marketing_jobs')
      .select('id, mls_status, mls_result')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .eq('mls_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!marketingJob || !marketingJob.mls_result) {
      return NextResponse.json(
        { error: 'MLS manifest not available. Marketing job must complete first.' },
        { status: 404 }
      );
    }

    const manifest = marketingJob.mls_result as {
      photoCount: number;
      manifest: Array<{
        photoId: string;
        processedUrl: string;
        filename: string;
        order: number;
      }>;
    };

    if (!manifest.manifest || manifest.manifest.length === 0) {
      return NextResponse.json({ error: 'No photos in MLS manifest' }, { status: 404 });
    }

    // Use the existing MLS export package generator
    const { generateMlsExportPackage } = await import('@/lib/compliance/mls-export');

    const exportPhotos = manifest.manifest.map(item => ({
      url: item.processedUrl,
      toolId: 'enhanced',
      filename: item.filename,
    }));

    const result = await generateMlsExportPackage({
      mlsId: 'generic', // Default MLS spec
      photos: exportPhotos,
      listingAddress: listing.address || undefined,
      agentName: user.user_metadata?.full_name || undefined,
    });

    if (!result.success || !result.zipBuffer) {
      return NextResponse.json(
        { error: 'Failed to generate MLS export', details: result.errors },
        { status: 500 }
      );
    }

    // Stream ZIP as download
    const filename = `${(listing.address || 'listing').replace(/[^a-z0-9]/gi, '_').slice(0, 40)}_mls_export.zip`;

    return new Response(result.zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(result.zipBuffer.length),
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[MLS Export API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
