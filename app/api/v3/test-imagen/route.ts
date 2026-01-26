import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
    }

    const apiKey = process.env.IMAGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IMAGEN_API_KEY not set' }, { status: 500 });
    }

    console.log('[Imagen Test] Testing with image:', imageUrl);

    const imgResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    console.log('[Imagen Test] Image downloaded, size:', buffer.length);

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
    formData.append('image', blob, 'test.jpg');
    formData.append('enhance', 'true');

    const startTime = Date.now();

    const response = await fetch('https://api.imagen-ai.com/v1/enhance', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      body: formData,
    });

    const processingTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ success: false, error: response.status, details: errorText }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, processingTimeMs, result });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const apiKey = process.env.IMAGEN_API_KEY;
  return NextResponse.json({
    endpoint: '/api/v3/test-imagen',
    apiKeyPresent: !!apiKey,
    keyPreview: apiKey ? apiKey.substring(0, 8) + '...' : null,
  });
}
