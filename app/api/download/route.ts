// Download Proxy API
// Proxies external image downloads to avoid CORS restrictions

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download.png';

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Validate URL is from allowed domains
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

    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Return with download headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': blob.type || 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    );
  }
}
