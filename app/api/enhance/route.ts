export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processEnhancement, ToolId, TOOL_CREDITS } from '@/lib/ai/router';
import { logApiCost } from '@/lib/cost-logger';
import { enhanceSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/utils/client-ip';
import { checkRateLimitAsync } from '@/lib/rate-limit';

const VALID_TOOL_IDS = new Set(Object.keys(TOOL_CREDITS));

export const maxDuration = 180;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Rate limit: 10 req/min per IP (uses Upstash Redis in production)
    const ip = getClientIp(request.headers);
    const { success: withinLimit } = await checkRateLimitAsync(`enhance:${ip}`, 10, 60_000);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await request.json(); const validated = parseBody(enhanceSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); } const { imageId, toolId, options = {} } = body;

    // Validate toolId before processing
    if (!toolId || !VALID_TOOL_IDS.has(toolId)) {
      return NextResponse.json({ error: `Invalid tool: ${toolId}` }, { status: 400 });
    }
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user profile for subscription tier (optional - proceed even if missing)
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, plan")
      .eq("id", user.id)
      .single();

    // If no profile, use defaults (free tier behavior)
    const rawTier = profile?.subscription_tier || profile?.plan || "free";
    const _tier = rawTier === "free" && profile?.plan && profile.plan !== "free" ? profile.plan : rawTier;
    void _tier; // Reserved for future tier-based enhancement limits
    
    // NEW MODEL: AI enhancements are FREE for all tiers
    // The limit is on LISTINGS per month, not enhancements
    // Just verify user has access to the photo's listing
    
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*, listings!photos_listing_id_fkey(id, title, user_id)')
      .eq('id', imageId)
      .single();
      
    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    
    // Verify user owns this listing
    if (photo.listings?.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    let sourceUrl = photo.raw_url;
    if (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) {
      const { data: signedUrlData } = await supabase.storage
        .from('raw-images')
        .createSignedUrl(photo.raw_url, 3600);

      if (!signedUrlData?.signedUrl) {
        return NextResponse.json({ error: 'Could not get image URL' }, { status: 500 });
      }
      sourceUrl = signedUrlData.signedUrl;
    }
    
    logger.info('[API] Processing with tier:', profile?.subscription_tier || 'free');
    const result = await Promise.race([
      processEnhancement(toolId as ToolId, sourceUrl, options),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Enhancement timed out after 120s')), 120000)
      ),
    ]);
    
    const processingTime = Date.now() - startTime;
    
    // Log API cost for analytics (no credits charged in new model)
    await logApiCost({
      userId: user.id,
      provider: 'replicate',
      toolId,
      success: result.success || false,
      errorMessage: result.error,
      processingTimeMs: processingTime,
      creditsCharged: 0, // FREE in new model
      requestMetadata: {
        imageId,
        options,
        userEmail: user.email,
        subscriptionTier: profile?.subscription_tier || 'free',
      },
    });
    
    if (!result.success || !result.enhancedUrl) {
      return NextResponse.json({ error: result.error || 'Enhancement failed' }, { status: 500 });
    }
    
    // Upload enhanced image (15s timeout — just downloading, not processing)
    const enhancedResponse = await fetch(result.enhancedUrl, {
      signal: AbortSignal.timeout(15000),
    });
    const enhancedBlob = await enhancedResponse.blob();
    const enhancedPath = `${user.id}/${photo.listing_id}/${imageId}_${toolId}_${Date.now()}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(enhancedPath, enhancedBlob, { contentType: 'image/jpeg', upsert: true });
      
    if (uploadError) {
      logger.error('[API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to save enhanced image' }, { status: 500 });
    }
    
    // Update photo record
    const { error: updateError } = await supabase
      .from('photos')
      .update({
        processed_url: enhancedPath,
        variant: toolId,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', imageId);
      
    if (updateError) {
      logger.error('[API] Update error:', updateError);
    }
    
    // Get signed URL for the enhanced image
    const { data: enhancedSignedUrl } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(enhancedPath, 3600);
    
    logger.info('[API] Enhancement complete in', processingTime, 'ms');
    
    return NextResponse.json({
      success: true,
      enhancedUrl: enhancedSignedUrl?.signedUrl || result.enhancedUrl,
      storagePath: enhancedPath,
      processedPath: enhancedPath, // Legacy alias
      processingTime,
    });
    
  } catch (error: unknown) {
    logger.error('[API] Enhancement error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Enhancement failed' 
    }, { status: 500 });
  }
}
