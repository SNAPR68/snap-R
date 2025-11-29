import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { skyReplacement, virtualTwilight, lawnRepair, hdrEnhance, perspectiveFix, upscale, declutter } from '@/lib/ai/tools';

const TOOLS: Record<string, (url: string, opts?: any) => Promise<any>> = {
  'sky-replacement': skyReplacement,
  'virtual-twilight': virtualTwilight,
  'lawn-repair': lawnRepair,
  'grass-repair': lawnRepair,
  'hdr': hdrEnhance,
  'hdr-enhance': hdrEnhance,
  'perspective-fix': perspectiveFix,
  'upscale': upscale,
  'declutter': declutter,
  'auto-enhance': hdrEnhance,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageId, toolId, options = {} } = await request.json();
    console.log(`[ENHANCE] Tool: ${toolId}, Image: ${imageId}`);

    const toolFn = TOOLS[toolId];
    if (!toolFn) return NextResponse.json({ error: `Unknown tool: ${toolId}` }, { status: 400 });

    const { data: photo } = await supabase.from('photos').select('*').eq('id', imageId).single();
    if (!photo) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    let imageUrl = photo.raw_url;
    if (!imageUrl.startsWith('http')) {
      const { data: signedData } = await supabase.storage.from('raw-images').createSignedUrl(imageUrl, 3600);
      imageUrl = signedData?.signedUrl || imageUrl;
    }

    const result = await toolFn(imageUrl, options);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    const enhancedRes = await fetch(result.enhancedUrl);
    const enhancedBuffer = await enhancedRes.arrayBuffer();
    const storagePath = `enhanced/${user.id}/${photo.listing_id}/${Date.now()}-${toolId}.jpg`;

    await supabase.storage.from('raw-images').upload(storagePath, enhancedBuffer, { contentType: 'image/jpeg', upsert: true });
    const { data: savedUrl } = await supabase.storage.from('raw-images').createSignedUrl(storagePath, 3600);

    await supabase.from('photos').update({ processed_url: storagePath, status: 'completed', variant: toolId }).eq('id', imageId);

    return NextResponse.json({ success: true, enhancedUrl: savedUrl?.signedUrl, storagePath, toolId });
  } catch (error: any) {
    console.error('[ENHANCE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
