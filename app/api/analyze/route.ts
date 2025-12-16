export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeImage } from '@/lib/ai/providers/openai-vision';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API/Analyze] Starting analysis...');
    const analysis = await analyzeImage(imageUrl);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('[API/Analyze] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Analysis failed' 
    }, { status: 500 });
  }
}
