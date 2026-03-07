import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import JSZip from 'jszip';
import { addWatermark, requiresWatermark, getWatermarkText } from '@/lib/compliance/watermark';

import { logger } from '@/lib/logger';
interface WatermarkSettings {
  watermark_enabled: boolean;
  watermark_text: string | null;
  watermark_position: string | null;
  watermark_opacity: number | null;
}

type WatermarkPosition = 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-left' | 'top-right';

const VALID_POSITIONS = new Set(['bottom-left', 'bottom-right', 'bottom-center', 'top-left', 'top-right']);

function isValidPosition(pos: string | null): pos is WatermarkPosition {
  return pos !== null && VALID_POSITIONS.has(pos);
}

export async function POST(req: NextRequest) {
  try {
    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('title')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found or access denied' }, { status: 404 });
    }

    // Fetch photos with tools_applied for MLS compliance watermarks
    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, processed_url, variant, tools_applied')
      .eq('listing_id', listingId)
      .eq('status', 'completed')
      .not('processed_url', 'is', null)
      .order('display_order', { ascending: true });

    if (error || !photos || photos.length === 0) {
      return NextResponse.json({ error: 'No enhanced photos found' }, { status: 404 });
    }

    // Fetch user's watermark settings
    const { data: wmSettings } = await supabase
      .from('user_settings')
      .select('watermark_enabled, watermark_text, watermark_position, watermark_opacity')
      .eq('user_id', user.id)
      .single();

    const settings: WatermarkSettings = wmSettings ?? {
      watermark_enabled: false,
      watermark_text: null,
      watermark_position: 'bottom-right',
      watermark_opacity: 50,
    };

    const zip = new JSZip();

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const { data: signedUrl } = await supabase.storage
        .from('raw-images')
        .createSignedUrl(photo.processed_url, 60);

      if (signedUrl?.signedUrl) {
        try {
          const response = await fetch(signedUrl.signedUrl, { signal: AbortSignal.timeout(15000) });
          let buffer: Buffer | Uint8Array = Buffer.from(await response.arrayBuffer());

          // MLS compliance watermark — always applied if tool requires it
          const toolsApplied = (photo.tools_applied || []) as string[];
          const complianceTool = toolsApplied.find((t: string) => requiresWatermark(t));
          if (complianceTool) {
            buffer = await addWatermark(buffer, {
              text: getWatermarkText(complianceTool),
              position: 'bottom-left',
              opacity: 0.85,
            });
          }

          // User custom watermark — applied on top if enabled
          if (settings.watermark_enabled && settings.watermark_text) {
            buffer = await addWatermark(buffer, {
              text: settings.watermark_text,
              position: isValidPosition(settings.watermark_position) ? settings.watermark_position : 'bottom-right',
              opacity: (settings.watermark_opacity ?? 50) / 100,
            });
          }

          const fileName = `${String(i + 1).padStart(2, '0')}-${photo.variant || 'enhanced'}.jpg`;
          zip.file(fileName, buffer);
        } catch {
          logger.error(`Failed to fetch photo ${photo.id}`);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const safeName = (listing?.title || 'listing').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}-enhanced.zip"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create ZIP';
    logger.error('Download all error:', message);
    return NextResponse.json({ error: 'Failed to create ZIP' }, { status: 500 });
  }
}
