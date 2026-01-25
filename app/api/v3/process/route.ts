/**
 * SnapR V3 Processing API
 */

import { NextRequest, NextResponse } from 'next/server';
import { PipelineOrchestrator } from '@/lib/ai/pipeline-orchestrator';
import { ImageMetadata } from '@/lib/ai/input-router';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, photos } = body;

    if (!listingId || !photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { error: 'Missing listingId or photos array' },
        { status: 400 }
      );
    }

    console.log(`[V3 API] Processing listing ${listingId} with ${photos.length} photos`);

    const images: ImageMetadata[] = photos.map((photo: { id: string; url: string; filename?: string }) => ({
      filename: photo.filename || photo.id,
      filepath: photo.url,
    }));

    const orchestrator = new PipelineOrchestrator({
      useImagenAI: !!process.env.IMAGEN_API_KEY,
      imagenApiKey: process.env.IMAGEN_API_KEY,
      toneMapping: 'natural',
    });

    const result = await orchestrator.process(listingId, images);

    return NextResponse.json({
      success: result.success,
      listingId: result.listingId,
      mode: result.mode,
      totalImages: result.totalImages,
      successCount: result.successCount,
      failureCount: result.failureCount,
      totalCost: result.totalCost,
      strategy: {
        heroPhotoId: result.strategy.heroPhotoId,
        twilightPhotoId: result.strategy.twilightPhotoId,
        confidenceScore: result.strategy.confidenceScore,
      },
      errors: result.errors,
    });

  } catch (error) {
    console.error('[V3 API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'V3 API Ready',
    version: '3.0.0',
    endpoints: {
      POST: 'Process photos with V3 pipeline',
    }
  });
}
