export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processEnhancement, ToolId, TOOL_CREDITS } from '@/lib/ai/router';
import { Resend } from 'resend';
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
    
    const creditsRequired = TOOL_CREDITS[toolId as ToolId];
    if (!creditsRequired) {
      return NextResponse.json({ error: `Unknown tool: ${toolId}` }, { status: 400 });
    }
    
    // Check user's credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not fetch user profile' }, { status: 500 });
    }
    
    if ((profile.credits || 0) < creditsRequired) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        creditsRequired,
        creditsAvailable: profile.credits || 0
      }, { status: 402 });
    }
    
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*, listings(title)')
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
    
    // Log API cost
    await logApiCost({
      userId: user.id,
      provider: 'replicate',
      toolId,
      success: result.success || false,
      errorMessage: result.error,
    });

    if (!result.success || !result.enhancedUrl) {
      return NextResponse.json({ error: result.error || 'Enhancement failed' }, { status: 500 });
    }
    
    // Deduct credits after successful enhancement
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: (profile.credits || 0) - creditsRequired })
      .eq('id', user.id);
      
    if (deductError) {
      console.error('[API] Credit deduction failed:', deductError);
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
    
    // Send processing complete email (non-blocking)
    const listingTitle = (photo as any).listings?.title || 'Your property';
    sendProcessingAlert(user.email || '', listingTitle).catch(() => {});
    
    const duration = Date.now() - startTime;
    console.log('[API] ✅ Complete in', (duration / 1000).toFixed(1), 's');
    
    return NextResponse.json({
      success: true,
      enhancedUrl: finalUrl,
      storagePath,
      toolId,
      creditsUsed: creditsRequired,
      creditsRemaining: (profile.credits || 0) - creditsRequired,
      processingTime: duration,
    });
  } catch (error: any) {
    console.error('[API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendProcessingAlert(userEmail: string, listingTitle: string) {
  if (!userEmail || !process.env.RESEND_API_KEY) return;
  
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'SnapR <onboarding@resend.dev>',
      to: userEmail,
      subject: '✨ Your photo enhancement is ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4A017;">Your Photo is Ready!</h2>
          <p>Great news! Your photo enhancement for <strong>${listingTitle}</strong> has been completed.</p>
          <p><a href="https://snap-r.com/dashboard" style="display: inline-block; background: linear-gradient(to right, #D4A017, #B8860B); color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Your Photos →</a></p>
          <p style="color: #666; margin-top: 20px;">- The SnapR Team</p>
        </div>
      `,
    });
    console.log('[API] Processing alert sent to', userEmail);
  } catch (e) {
    console.error('[API] Processing alert email error:', e);
  }
}
