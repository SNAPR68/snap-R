/**
 * V3 Imagen Test Endpoint
 * POST /api/v3/test-imagen
 * 
 * Tests Imagen AI connection and processing
 */

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
    console.log('[Imagen Test] API Key present:', !!apiKey);

    // Download image
    const imgResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    const base64Image = buffer.toString('base64');

    console.log('[Imagen Test] Image downloaded, size:', buffer.length);

    // Call Imagen API (Google's image enhancement)
    const startTime = Date.now();
    
    const response = await fetch('https://us-central1-aiplatform.googleapis.com/v1/projects/your-project/locations/us-central1/publishers/google/models/imagegeneration:predict', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{
          image: { bytesBase64Encoded: base64Image },
          prompt: 'Enhance this real estate photo with better lighting, color balance, and HDR-like dynamic range'
        }],
        parameters: {
          sampleCount: 1,
        }
      }),
    });

    const processingTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Imagen Test] API Error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Imagen API error: ${response.status}`,
        details: errorText,
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('[Imagen Test] Processing complete in', processingTimeMs, 'ms');

    return NextResponse.json({
      success: true,
      processingTimeMs,
      hasOutput: !!result.predictions?.[0],
    });

  } catch (error: any) {
    console.error('[Imagen Test] Error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v3/test-imagen',
    method: 'POST',
    body: { imageUrl: 'https://example.com/photo.jpg' },
    description: 'Tests Imagen AI on a single image',
    imagenKeyPresent: !!process.env.IMAGEN_API_KEY,
    keyFirstChars: process.env.IMAGEN_API_KEY?.substring(0, 8) + '...',
  });
}
