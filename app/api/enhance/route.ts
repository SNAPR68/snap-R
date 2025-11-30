import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TOOLS } from '@/lib/ai/tools';
import { scoreEnhancementQuality } from '@/lib/ai/providers/openai-vision';

export async function POST(request: NextRequest) {
  try {
    const { imageId, toolId, options = {} } = await request.json();
    
    console.log(`[ENHANCE] Tool: ${toolId}, Image: ${imageId}`);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tool = TOOLS[toolId];
    if (!tool) {
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

    const rawImageUrl = signedUrlData.signedUrl;
    console.log('[ENHANCE] Processing image...');

    const enhancedUrl = await tool(rawImageUrl, options);

    if (!enhancedUrl) {
      return NextResponse.json({ error: 'Enhancement returned no result' }, { status: 500 });
    }

    console.log('[ENHANCE] Enhancement complete, running QC...');

    let qcResult = { score: 8, issues: [], passed: true };
    if (process.env.ENABLE_QC_SCORING === 'true') {
      try {
        qcResult = await scoreEnhancementQuality(rawImageUrl, enhancedUrl, toolId);
      } catch (qcError) {
        console.warn('[ENHANCE] QC scoring failed, continuing:', qcError);
      }
    }

    const enhancedResponse = await fetch(enhancedUrl);
    const enhancedBuffer = await enhancedResponse.arrayBuffer();
    
    const storagePath = `enhanced/${user.id}/${photo.listing_id}/${Date.now()}-${toolId}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(storagePath, enhancedBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[ENHANCE] Upload error:', uploadError);
      return NextResponse.json({
        success: true,
        enhancedUrl,
        qcScore: qcResult.score,
        qcPassed: qcResult.passed,
        qcIssues: qcResult.issues,
        toolId,
      });
    }

    const { data: enhancedSignedUrl } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(storagePath, 3600);

    await supabase
      .from('photos')
      .update({
        processed_url: storagePath,
        status: 'enhanced',
        variant: toolId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', imageId);

    console.log('[ENHANCE] Complete!');

    return NextResponse.json({
      success: true,
      enhancedUrl: enhancedSignedUrl?.signedUrl || enhancedUrl,
      storagePath,
      toolId,
      qcScore: qcResult.score,
      qcPassed: qcResult.passed,
      qcIssues: qcResult.issues,
    });

  } catch (error: any) {
    console.error('[ENHANCE] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Enhancement failed' 
    }, { status: 500 });
  }
}
