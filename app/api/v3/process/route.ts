/**
 * SnapR V3 Processing API
 * ========================
 * 
 * POST /api/v3/process
 * Body: { listingId, photos, execute?: boolean }
 * 
 * If execute=true, actually runs the tools.
 * If execute=false (default), just returns the strategy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PipelineOrchestrator } from '@/lib/ai/pipeline-orchestrator';
import { ImageMetadata } from '@/lib/ai/input-router';
import { buildListingStrategy, getStrategySummary } from '@/lib/ai/v3-strategy-builder';
import { executeListingStrategy, PhotoExecutionResult } from '@/lib/ai/v3-tool-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, photos, execute = false } = body;

    if (!listingId || !photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { error: 'Missing listingId or photos array' },
        { status: 400 }
      );
    }

    console.log(`[V3 API] Processing listing ${listingId} with ${photos.length} photos (execute=${execute})`);

    // Convert to ImageMetadata
    const images: ImageMetadata[] = photos.map((photo: { id: string; url: string; filename?: string }) => ({
      filename: photo.filename || photo.id,
      filepath: photo.url,
    }));

    // Run pipeline to get strategy
    const orchestrator = new PipelineOrchestrator({
      useImagenAI: !!process.env.IMAGEN_API_KEY,
      imagenApiKey: process.env.IMAGEN_API_KEY,
      toneMapping: 'natural',
    });

    const pipelineResult = await orchestrator.process(listingId, images);
    const strategy = pipelineResult.strategy;

    console.log(getStrategySummary(strategy));

    // If not executing, just return strategy
    if (!execute) {
      return NextResponse.json({
        success: true,
        listingId,
        mode: pipelineResult.mode,
        totalImages: photos.length,
        strategy: {
          heroPhotoId: strategy.heroPhotoId,
          twilightPhotoId: strategy.twilightPhotoId,
          heroCount: strategy.heroCount,
          supportingCount: strategy.supportingCount,
          utilityCount: strategy.utilityCount,
          confidenceScore: strategy.confidenceScore,
          estimatedCost: strategy.estimatedCost,
          estimatedTime: strategy.estimatedTime,
          caps: strategy.caps,
          capsUsage: strategy.capsUsage,
          lockedPresets: strategy.lockedPresets,
          photoStrategies: strategy.photoStrategies.map(ps => ({
            photoId: ps.photoId,
            role: ps.role,
            tools: ps.toolOrder,
            confidence: ps.confidence,
            skipReason: ps.skipReason,
          })),
        },
        executeUrl: `/api/v3/process?execute=true`,
      });
    }

    // Execute the strategy
    console.log(`[V3 API] Executing strategy...`);
    
    // Create URL lookup from photos array
    const photoUrlMap = new Map(photos.map((p: { id: string; url: string }) => [p.id, p.url]));
    const filenameUrlMap = new Map(photos.map((p: { id: string; url: string; filename?: string }) => [p.filename || p.id, p.url]));
    
    const executionResults = await executeListingStrategy(
      strategy.photoStrategies,
      (photoId) => filenameUrlMap.get(photoId) || photoUrlMap.get(photoId) || '',
      {
        concurrency: 3,
        onPhotoComplete: (result) => {
          console.log(`[V3 API] Photo ${result.photoId}: ${result.success ? 'OK' : 'FAILED'} ($${result.totalCost.toFixed(2)})`);
        },
      }
    );

    const totalCost = executionResults.reduce((sum, r) => sum + r.totalCost, 0);
    const successCount = executionResults.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      listingId,
      mode: pipelineResult.mode,
      totalImages: photos.length,
      executed: true,
      successCount,
      failureCount: photos.length - successCount,
      totalCost,
      strategy: {
        heroPhotoId: strategy.heroPhotoId,
        twilightPhotoId: strategy.twilightPhotoId,
        confidenceScore: strategy.confidenceScore,
      },
      results: executionResults.map(r => ({
        photoId: r.photoId,
        success: r.success,
        finalUrl: r.finalUrl,
        toolsApplied: r.toolResults.map(tr => ({
          tool: tr.tool,
          success: tr.success,
          timeMs: tr.timeMs,
          cost: tr.cost,
        })),
        totalCost: r.totalCost,
        error: r.error,
      })),
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
      'POST (execute=false)': 'Get strategy without executing',
      'POST (execute=true)': 'Execute tools on photos',
    }
  });
}
