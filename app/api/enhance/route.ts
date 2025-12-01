import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { processEnhancement, ToolId, TOOL_CREDITS } from '@/lib/ai/router';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { imageId, toolId, options = {} } = await request.json();

    console.log(`\n[API] ========== ENHANCE ==========`);    
    console.log(`[API] Tool: ${toolId}, Image: ${imageId}`);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!TOOL_CREDITS[toolId as ToolId]) {
      return NextResponse.json({ error: `Unknown tool: ${toolId}` }, { status: 400 });
    }

    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', imageId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const { data: signedUrlData } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(photo.raw_url, 3600);

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Could not get image URL' }, { status: 500 });
    }

    console.log('[API] Processing...');
    const result = await processEnhancement(toolId as ToolId, signedUrlData.signedUrl, options);

    if (!result.success || !result.enhancedUrl) {
      return NextResponse.json({ error: result.error || 'Enhancement failed' }, { status: 500 });
    }

    let finalUrl = result.enhancedUrl;
    let storagePath: string | null = null;

    try {
      const enhancedResponse = await fetch(result.enhancedUrl);
      if (enhancedResponse.ok) {
        const enhancedBuffer = await enhancedResponse.arrayBuffer();
        storagePath = `enhanced/${user.id}/${photo.listing_id}/${Date.now()}-${toolId}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('raw-images')
          .upload(storagePath, enhancedBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: enhancedSignedUrl } = await supabase.storage
            .from('raw-images')
            .createSignedUrl(storagePath, 3600);

          if (enhancedSignedUrl?.signedUrl) {
            finalUrl = enhancedSignedUrl.signedUrl;
          }

          await supabase
            .from('photos')
            .update({
              processed_url: storagePath,
              status: 'completed',
              variant: toolId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', imageId);
        }
      }
    } catch (saveError: any) {
      console.warn('[API] Save error:', saveError.message);
    }

    const duration = Date.now() - startTime;
    console.log(`[API] ✅ Complete in ${(duration / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      enhancedUrl: finalUrl,
      storagePath,
      toolId,
      credits: TOOL_CREDITS[toolId as ToolId],
      processingTime: duration,
    });
  } catch (error: any) {
    console.error('[API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
