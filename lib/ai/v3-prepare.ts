/**
 * SnapR V3 - Prepare Listing
 * ==========================
 * 
 * V3 version of prepareListing that uses the new Decision Engine.
 */

import { createClient } from '@/lib/supabase/server';
import { PipelineOrchestrator } from './pipeline-orchestrator';
import { buildListingStrategy, getStrategySummary } from './v3-strategy-builder';
import { executeListingStrategy } from './v3-tool-executor';
import { ImageMetadata } from './input-router';

export interface V3PrepareOptions {
  listingId: string;
  options?: {
    useV3?: boolean;
    dryRun?: boolean; // Strategy only, no execution
  };
}

export interface V3PrepareResult {
  success: boolean;
  status: 'completed' | 'failed' | 'partial';
  listingId: string;
  heroPhotoId: string | null;
  twilightPhotoId: string | null;
  totalPhotos: number;
  successfulPhotos: number;
  failedPhotos: number;
  photosNeedingReview: number;
  overallConfidence: number;
  totalCost: number;
  processingTimeMs: number;
  strategy: any;
  results: any[];
  errors: string[];
}

export async function prepareListingV3(
  { listingId, options = {} }: V3PrepareOptions,
  userId: string
): Promise<V3PrepareResult> {
  const startTime = Date.now();
  console.log(`\n[V3 Prepare] ========================================`);
  console.log(`[V3 Prepare] Listing: ${listingId}`);
  console.log(`[V3 Prepare] User: ${userId}`);
  console.log(`[V3 Prepare] ========================================\n`);

  const supabase = await createClient();

  try {
    // Update listing status
    await supabase
      .from('listings')
      .update({ status: 'preparing' })
      .eq('id', listingId);

    // Get photos for this listing
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, raw_url, status')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });

    console.log('[V3 Prepare] Photos query result:', { photosError, photosCount: photos?.length });
    if (photosError) {
      console.log('[V3 Prepare] Photos error:', photosError);
      throw new Error('Failed to fetch photos: ' + photosError.message);
    }
    if (!photos || photos.length === 0) {
      console.log('[V3 Prepare] No photos in database for listing:', listingId);
      throw new Error('No photos found for this listing');
    }

    console.log(`[V3 Prepare] Found ${photos.length} photos`);

    // Get signed URLs for photos
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const { data } = await supabase.storage
          .from('raw-images')
          .createSignedUrl(photo.raw_url, 3600);
        return {
          id: photo.id,
          url: data?.signedUrl || '',
          filename: photo.id, // Use id as filename since no filename column
        };
      })
    );

    // Filter out photos without URLs
    const validPhotos = photosWithUrls.filter(p => p.url);
    console.log(`[V3 Prepare] ${validPhotos.length} photos with valid URLs`);

    // Convert to ImageMetadata format
    const images: ImageMetadata[] = validPhotos.map(p => ({
      filename: p.filename,
      filepath: p.url,
    }));

    // Create orchestrator and run
    const orchestrator = new PipelineOrchestrator({
      useImagenAI: !!process.env.IMAGEN_API_KEY,
      imagenApiKey: process.env.IMAGEN_API_KEY,
      toneMapping: 'natural',
    });

    const pipelineResult = await orchestrator.process(listingId, images);
    const strategy = pipelineResult.strategy;

    console.log(getStrategySummary(strategy));

    // If dry run, skip execution
    if (options.dryRun) {
      await supabase
        .from('listings')
        .update({ status: 'draft' })
        .eq('id', listingId);

      return {
        success: true,
        status: 'completed',
        listingId,
        heroPhotoId: strategy.heroPhotoId,
        twilightPhotoId: strategy.twilightPhotoId,
        totalPhotos: validPhotos.length,
        successfulPhotos: 0,
        failedPhotos: 0,
        photosNeedingReview: 0,
        overallConfidence: strategy.confidenceScore,
        totalCost: 0,
        processingTimeMs: Date.now() - startTime,
        strategy,
        results: [],
        errors: [],
      };
    }

    // Create photo ID to URL map
    const photoUrlMap = new Map(validPhotos.map(p => [p.filename, p.url]));
    const photoIdMap = new Map(validPhotos.map(p => [p.filename, p.id]));

    // Execute strategy
    console.log(`[V3 Prepare] Executing strategy...`);
    const executionResults = await executeListingStrategy(
      strategy.photoStrategies,
      (photoId) => photoUrlMap.get(photoId) || '',
      {
        concurrency: 2, // Lower concurrency to avoid rate limits
        onPhotoComplete: (result) => {
          console.log(`[V3 Prepare] Photo ${result.photoId}: ${result.success ? 'OK' : 'FAILED'} ($${result.totalCost.toFixed(2)})`);
        },
      }
    );

    // Update photos in database with results
    let successCount = 0;
    let failCount = 0;

    for (const result of executionResults) {
      const photoId = photoIdMap.get(result.photoId);
      if (!photoId) continue;

      if (result.success && result.finalUrl && typeof result.finalUrl === 'string') {
        // Extract storage path from signed URL or use the URL directly
        const processedUrl = (result.finalUrl || '').includes('supabase.co') 
          ? result.finalUrl.split('/raw-images/')[1]?.split('?')[0] || result.finalUrl
          : result.finalUrl;

        await supabase
          .from('photos')
          .update({
            processed_url: processedUrl,
            status: 'completed',
            variant: 'prepared',
            updated_at: new Date().toISOString(),
          })
          .eq('id', photoId);

        successCount++;
      } else {
        await supabase
          .from('photos')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', photoId);

        failCount++;
      }
    }

    // Update listing with hero photo
    const heroPhotoId = photoIdMap.get(strategy.heroPhotoId);
    await supabase
      .from('listings')
      .update({
        status: failCount === 0 ? 'completed' : 'partial',
        hero_photo_id: heroPhotoId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    const totalCost = executionResults.reduce((sum, r) => sum + r.totalCost, 0);
    const processingTimeMs = Date.now() - startTime;

    console.log(`\n[V3 Prepare] ========================================`);
    console.log(`[V3 Prepare] COMPLETE`);
    console.log(`[V3 Prepare] Success: ${successCount}/${validPhotos.length}`);
    console.log(`[V3 Prepare] Failed: ${failCount}`);
    console.log(`[V3 Prepare] Cost: $${totalCost.toFixed(2)}`);
    console.log(`[V3 Prepare] Time: ${(processingTimeMs / 1000).toFixed(1)}s`);
    console.log(`[V3 Prepare] ========================================\n`);

    return {
      success: failCount === 0,
      status: failCount === 0 ? 'completed' : 'partial',
      listingId,
      heroPhotoId: heroPhotoId || null,
      twilightPhotoId: strategy.twilightPhotoId ? photoIdMap.get(strategy.twilightPhotoId) || null : null,
      totalPhotos: validPhotos.length,
      successfulPhotos: successCount,
      failedPhotos: failCount,
      photosNeedingReview: 0,
      overallConfidence: strategy.confidenceScore,
      totalCost,
      processingTimeMs,
      strategy,
      results: executionResults,
      errors: executionResults.filter(r => !r.success).map(r => r.error || 'Unknown error'),
    };

  } catch (error: any) {
    console.error(`[V3 Prepare] ERROR:`, error.message);

    await supabase
      .from('listings')
      .update({ status: 'failed' })
      .eq('id', listingId);

    return {
      success: false,
      status: 'failed',
      listingId,
      heroPhotoId: null,
      twilightPhotoId: null,
      totalPhotos: 0,
      successfulPhotos: 0,
      failedPhotos: 0,
      photosNeedingReview: 0,
      overallConfidence: 0,
      totalCost: 0,
      processingTimeMs: Date.now() - startTime,
      strategy: null,
      results: [],
      errors: [error.message],
    };
  }
}

export function buildV3PrepareResponse(result: V3PrepareResult) {
  return {
    success: result.status !== 'failed', // partial is still success
    status: result.status,
    listingId: result.listingId,
    heroPhotoId: result.heroPhotoId,
    stats: {
      totalPhotos: result.totalPhotos,
      successfulPhotos: result.successfulPhotos,
      failedPhotos: result.failedPhotos,
      photosNeedingReview: result.photosNeedingReview,
      overallConfidence: result.overallConfidence,
      totalCost: result.totalCost,
    },
    errors: result.errors,
  };
}
