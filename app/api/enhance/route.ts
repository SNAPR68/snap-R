export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processEnhancement, ToolId } from '@/lib/ai/router';
import { logApiCost } from '@/lib/cost-logger';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { imageId, toolId, options = {} } = await request.json();
    console.log('\n[API] ========== ENHANCE ==========');    
    console.log('[API] Tool:', toolId, 'Image:', imageId);
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user profile for subscription tier (optional - proceed even if missing)
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, listings_limit, listings_used_this_month")
      .eq("id", user.id)
      .single();
    
    // If no profile, use defaults (free tier behavior)
    const userTier = profile?.subscription_tier || "free";
    
    // NEW MODEL: AI enhancements are FREE for all tiers
    // The limit is on LISTINGS per month, not enhancements
    // Just verify user has access to the photo's listing
    
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*, listings(id, title, user_id)')
      .eq('id', imageId)
      .single();
      
    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    
    // Verify user owns this listing
    if (photo.listings?.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const { data: signedUrlData } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(photo.raw_url, 3600);
      
    if (!signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Could not get image URL' }, { status: 500 });
    }
    
    console.log('[API] Processing with tier:', profile?.subscription_tier || 'free');
    const result = await processEnhancement(toolId as ToolId, signedUrlData.signedUrl, options);
    
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
    
    // Upload enhanced image
    const enhancedResponse = await fetch(result.enhancedUrl);
    const enhancedBlob = await enhancedResponse.blob();
    const enhancedPath = `${user.id}/${photo.listing_id}/${imageId}_${toolId}_${Date.now()}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(enhancedPath, enhancedBlob, { contentType: 'image/jpeg', upsert: true });
      
    if (uploadError) {
      console.error('[API] Upload error:', uploadError);
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
      console.error('[API] Update error:', updateError);
    }
    
    // Get signed URL for the enhanced image
    const { data: enhancedSignedUrl } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(enhancedPath, 3600);
    
    console.log('[API] Enhancement complete in', processingTime, 'ms');
    
    return NextResponse.json({
      success: true,
      enhancedUrl: enhancedSignedUrl?.signedUrl || result.enhancedUrl,
      processedPath: enhancedPath,
      processingTime,
      // No credits info in new model
    });
    
  } catch (error) {
    console.error('[API] Enhancement error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Enhancement failed' 
    }, { status: 500 });
  }
}
