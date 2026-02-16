import { NextRequest, NextResponse } from 'next/server';
import { autoEnhance } from '@/lib/ai/providers/sharp-enhance';
import { adminSupabase } from '@/lib/supabase/admin';

/**
 * POST /api/enhance-quick
 *
 * Lightweight Sharp.js enhancement endpoint.
 * Called by the Cloudflare Worker for `auto-enhance` tool instead of
 * routing through Replicate/Flux Kontext (~25-30s → ~1-2s).
 *
 * Auth: x-admin-key header checked against WORKER_ADMIN_KEY env var.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // --- Auth ---
  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.WORKER_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Parse body ---
  let body: { imageUrl: string; photoId: string; listingId: string; userId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { imageUrl, photoId, listingId, userId } = body;
  if (!imageUrl || !photoId || !listingId || !userId) {
    return NextResponse.json(
      { error: 'Missing required fields: imageUrl, photoId, listingId, userId' },
      { status: 400 }
    );
  }

  try {
    // --- Download image ---
    const downloadStart = Date.now();
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const downloadMs = Date.now() - downloadStart;

    // --- Enhance with Sharp.js ---
    const enhanceStart = Date.now();
    const result = await autoEnhance(inputBuffer);
    const enhanceMs = Date.now() - enhanceStart;

    // --- Upload to Supabase Storage ---
    const uploadStart = Date.now();
    const supabase = adminSupabase();
    const storagePath = `enhanced/v3/${listingId}/${photoId}_enhanced.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(storagePath, result.buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // --- Get signed URL (1 hour) ---
    const { data: urlData } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(storagePath, 3600);

    const uploadMs = Date.now() - uploadStart;
    const totalMs = Date.now() - startTime;

    console.log(
      `[enhance-quick] ${photoId}: ${result.preset.name} preset, ` +
      `download=${downloadMs}ms enhance=${enhanceMs}ms upload=${uploadMs}ms total=${totalMs}ms`
    );

    return NextResponse.json({
      signedUrl: urlData?.signedUrl || '',
      storagePath,
      preset: result.preset.name,
      stats: {
        brightness: Math.round(result.stats.brightness),
        contrast: Math.round(result.stats.contrast),
        isInterior: result.stats.isInterior,
        isDark: result.stats.isDark,
      },
      timings: { downloadMs, enhanceMs, uploadMs, totalMs },
    });
  } catch (error: any) {
    console.error(`[enhance-quick] Error for ${photoId}:`, error?.message);
    return NextResponse.json(
      { error: error?.message || 'Enhancement failed' },
      { status: 500 }
    );
  }
}
