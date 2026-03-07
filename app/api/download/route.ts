// Download API
// Supports two modes:
//   ?url=xxx&filename=yyy — CORS proxy for external images (existing behavior)
//   ?photoId=xxx          — Watermarked download for enhanced photos

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addWatermark, requiresWatermark, getWatermarkText } from '@/lib/compliance/watermark';

import { logger } from '@/lib/logger';
type WatermarkPosition = 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-left' | 'top-right';

const VALID_POSITIONS = new Set(['bottom-left', 'bottom-right', 'bottom-center', 'top-left', 'top-right']);

function isValidPosition(pos: string | null | undefined): pos is WatermarkPosition {
  return pos !== null && pos !== undefined && VALID_POSITIONS.has(pos);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');

  // Route to watermarked download if photoId is provided
  if (photoId) {
    return handleWatermarkedDownload(photoId);
  }

  // Otherwise, use existing CORS proxy behavior
  return handleProxyDownload(searchParams);
}

// ── Watermarked photo download ──────────────────────────────────

async function handleWatermarkedDownload(photoId: string): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch photo with ownership check via listing join
    const { data: photo } = await supabase
      .from('photos')
      .select('id, processed_url, raw_url, variant, tools_applied, listing_id, listings!photos_listing_id_fkey(user_id)')
      .eq('id', photoId)
      .single();

    const listings = photo?.listings as { user_id: string }[] | null;
    if (!photo || !listings || listings.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const listingOwner = listings[0].user_id;
    if (listingOwner !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const imagePath = photo.processed_url || photo.raw_url;
    if (!imagePath) {
      return NextResponse.json({ error: 'No image available' }, { status: 404 });
    }

    // Fetch user's watermark settings
    const { data: wmSettings } = await supabase
      .from('user_settings')
      .select('watermark_enabled, watermark_text, watermark_position, watermark_opacity')
      .eq('user_id', user.id)
      .single();

    const wmEnabled = wmSettings?.watermark_enabled ?? false;
    const wmText = wmSettings?.watermark_text as string | null;
    const wmPosition = wmSettings?.watermark_position as string | null;
    const wmOpacity = (wmSettings?.watermark_opacity as number | null) ?? 50;

    // Check if any watermark is needed
    const toolsApplied = (photo.tools_applied || []) as string[];
    const complianceTool = toolsApplied.find((t: string) => requiresWatermark(t));
    const needsWatermark = !!complianceTool || (wmEnabled && wmText);

    // Resolve image URL
    let imageUrl: string;
    if (imagePath.startsWith('http')) {
      imageUrl = imagePath;
    } else {
      const { data: signed } = await supabase.storage
        .from('raw-images')
        .createSignedUrl(imagePath, 60);
      if (!signed?.signedUrl) {
        return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
      }
      imageUrl = signed.signedUrl;
    }

    // If no watermark needed, redirect for fast path
    if (!needsWatermark) {
      return NextResponse.redirect(imageUrl);
    }

    // Fetch and watermark
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    let buffer: Buffer | Uint8Array = Buffer.from(await response.arrayBuffer());

    // MLS compliance watermark — always applied if tool requires it
    if (complianceTool) {
      buffer = await addWatermark(buffer, {
        text: getWatermarkText(complianceTool),
        position: 'bottom-left',
        opacity: 0.85,
      });
    }

    // User custom watermark
    if (wmEnabled && wmText) {
      buffer = await addWatermark(buffer, {
        text: wmText,
        position: isValidPosition(wmPosition) ? wmPosition : 'bottom-right',
        opacity: wmOpacity / 100,
      });
    }

    const filename = `enhanced-${photo.variant || 'photo'}-${photo.id.slice(0, 8)}.jpg`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Download failed';
    logger.error('Watermarked download error:', message);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

// ── CORS proxy download (existing behavior) ─────────────────────

async function handleProxyDownload(searchParams: URLSearchParams): Promise<NextResponse> {
  try {
    const imageUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download.png';

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    const allowedDomains = [
      'replicate.delivery',
      'replicate.com',
      'pbxt.replicate.delivery',
      'supabase.co',
      'supabase.in',
      'r2.cloudflarestorage.com',
      'runware.ai',
    ];

    const urlObj = new URL(imageUrl);
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': blob.type || 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Download failed';
    logger.error('Download proxy error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
