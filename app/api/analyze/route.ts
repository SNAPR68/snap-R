export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeImage } from '@/lib/ai/providers/openai-vision';

/** Block private/internal IPs to prevent SSRF */
function isUnsafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return true;
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.startsWith('192.168.') ||
      hostname === '169.254.169.254' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) return true;
    return false;
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    if (isUnsafeUrl(imageUrl)) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
