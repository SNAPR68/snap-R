/**
 * SnapR AI Engine V2 - Listing Engine
 * ====================================
 * Main orchestrator for listing-level photo preparation
 * 
 * This is the entry point that coordinates:
 * 1. Photo Intelligence (analysis)
 * 2. Strategy Building (decisions)
 * 3. Batch Processing (execution)
 * 4. Consistency Pass (normalization)
 * 5. Quality Validation (QC)
 */

import { createClient } from '@/lib/supabase/server';
import { analyzePhotos } from './photo-intelligence';
import { buildListingStrategy, getStrategySummary } from './strategy-builder';
import { processListingBatch, orderByPriority } from './batch-processor';
import { analyzeConsistency, getConsistencyReport } from './consistency';
import { validateResults, getValidationReport, quickValidate } from './quality-validator';
import {
  ListingProcessingResult,
  ProcessingProgress,
  ProcessingStatus,
  PrepareListingRequest,
  PrepareListingResponse,
} from './types';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Maximum photos per listing
  maxPhotos: 50,
  
  // Timeout for entire preparation (ms)
  totalTimeoutMs: 600000, // 10 minutes
  
  // Whether to run full validation (uses API credits)
  enableFullValidation: false, // Start with quick validation
  
  // Whether to apply consistency pass
  enableConsistencyPass: true,
};

// ============================================
// MAIN ENTRY POINT
// ============================================

export async function prepareListing(
  request: PrepareListingRequest,
  userId: string,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<ListingProcessingResult> {
  const { listingId, options = {} } = request;
  const startTime = Date.now();
  
  console.log(`\n[ListingEngine] ========================================`);
  console.log(`[ListingEngine] PREPARE LISTING: ${listingId}`);
  console.log(`[ListingEngine] ========================================\n`);
  
  const supabase = await createClient();
  
  try {
    // Update listing status to 'preparing'
    await updateListingStatus(supabase, listingId, 'preparing');
    
    // ========================================
    // PHASE 1: FETCH PHOTOS
    // ========================================
    reportProgress(onProgress, listingId, 'analyzing', 'Fetching photos...', startTime);
    
    const photos = await fetchListingPhotos(supabase, listingId);
    
    if (photos.length === 0) {
      throw new Error('No photos found for this listing');
    }
    
    if (photos.length > CONFIG.maxPhotos) {
      console.warn(`[ListingEngine] Limiting to ${CONFIG.maxPhotos} photos`);
      photos.splice(CONFIG.maxPhotos);
    }
    
    console.log(`[ListingEngine] Found ${photos.length} photos`);
    
    // ========================================
    // PHASE 2: ANALYZE PHOTOS
    // ========================================
    reportProgress(onProgress, listingId, 'analyzing', `Analyzing ${photos.length} photos...`, startTime);
    
    const analyses = await analyzePhotos(photos, {
      maxConcurrency: options.prioritizeSpeed ? 8 : 5,
    });
    
    console.log(`[ListingEngine] Analysis complete`);
    
    // ========================================
    // PHASE 3: BUILD STRATEGY
    // ========================================
    reportProgress(onProgress, listingId, 'strategizing', 'Building enhancement strategy...', startTime);
    
    const strategy = buildListingStrategy(listingId, analyses);
    
    console.log(`\n${getStrategySummary(strategy)}\n`);
    
    // ========================================
    // PHASE 4: PROCESS PHOTOS
    // ========================================
    reportProgress(onProgress, listingId, 'processing', 'Enhancing photos...', startTime);
    
    // Order by priority (hero first, then critical, etc.)
    strategy.photoStrategies = orderByPriority(strategy.photoStrategies);
    
    const results = await processListingBatch(strategy, {
      listingId,
      userId,
      onProgress,
    });
    
    console.log(`[ListingEngine] Processing complete: ${results.filter(r => r.success).length}/${results.length} successful`);
    
    // ========================================
    // PHASE 5: CONSISTENCY PASS
    // ========================================
    if (CONFIG.enableConsistencyPass) {
      reportProgress(onProgress, listingId, 'consistency_pass', 'Checking consistency...', startTime);
      
      const consistency = await analyzeConsistency(results);
      console.log(`\n${getConsistencyReport(consistency.metrics, consistency.adjustments, consistency.consistencyScore)}\n`);
      
      // Note: Actual color grading would be applied here in future versions
    }
    
    // ========================================
    // PHASE 6: VALIDATION
    // ========================================
    reportProgress(onProgress, listingId, 'validating', 'Validating results...', startTime);
    
    let validations;
    if (CONFIG.enableFullValidation) {
      validations = await validateResults(results);
    } else {
      validations = results.map(r => quickValidate(r));
    }
    
    console.log(`\n${getValidationReport(validations)}\n`);
    
    // ========================================
    // PHASE 7: FINALIZE
    // ========================================
    const successfulPhotos = results.filter(r => r.success).length;
    const failedPhotos = results.filter(r => !r.success).length;
    const photosNeedingReview = validations.filter(v => v.needsReview).length;
    
    const overallConfidence = Math.round(
      validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length
    );
    
    // Determine final status
    let finalStatus: ProcessingStatus = 'completed';
    if (failedPhotos > results.length * 0.3) {
      finalStatus = 'failed';
    } else if (photosNeedingReview > 0 || overallConfidence < 70) {
      finalStatus = 'needs_review';
    }
    
    // Update listing in database
    await finalizeListing(supabase, listingId, {
      status: finalStatus === 'completed' ? 'prepared' : finalStatus,
      heroPhotoId: strategy.heroPhotoId,
      confidence: overallConfidence,
      toolsApplied: countToolsApplied(results),
    });
    
    const totalTime = Date.now() - startTime;
    
    console.log(`\n[ListingEngine] ========================================`);
    console.log(`[ListingEngine] COMPLETE: ${finalStatus.toUpperCase()}`);
    console.log(`[ListingEngine] Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`[ListingEngine] Success: ${successfulPhotos}/${results.length}`);
    console.log(`[ListingEngine] Confidence: ${overallConfidence}%`);
    console.log(`[ListingEngine] ========================================\n`);
    
    return {
      listingId,
      status: finalStatus,
      heroPhotoId: strategy.heroPhotoId,
      photoResults: results,
      totalPhotos: results.length,
      successfulPhotos,
      failedPhotos,
      photosNeedingReview,
      overallConfidence,
      totalProcessingTime: totalTime,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
    };
    
  } catch (error: any) {
    console.error(`[ListingEngine] FAILED:`, error.message);
    
    // Update listing status to failed
    await updateListingStatus(supabase, listingId, 'failed');
    
    return {
      listingId,
      status: 'failed',
      heroPhotoId: null,
      photoResults: [],
      totalPhotos: 0,
      successfulPhotos: 0,
      failedPhotos: 0,
      photosNeedingReview: 0,
      overallConfidence: 0,
      totalProcessingTime: Date.now() - startTime,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function fetchListingPhotos(
  supabase: any,
  listingId: string
): Promise<Array<{ id: string; url: string }>> {
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, raw_url')
    .eq('listing_id', listingId)
    .order('display_order', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to fetch photos: ${error.message}`);
  }
  
  if (!photos || photos.length === 0) {
    return [];
  }
  
  // Get signed URLs for all photos
  const photosWithUrls: Array<{ id: string; url: string }> = [];
  
  for (const photo of photos) {
    const { data } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(photo.raw_url, 3600);
    
    if (data?.signedUrl) {
      photosWithUrls.push({
        id: photo.id,
        url: data.signedUrl,
      });
    }
  }
  
  return photosWithUrls;
}

async function updateListingStatus(
  supabase: any,
  listingId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId);
  
  if (error) {
    console.error(`[ListingEngine] Failed to update status:`, error.message);
  }
}

async function finalizeListing(
  supabase: any,
  listingId: string,
  data: {
    status: string;
    heroPhotoId: string | null;
    confidence: number;
    toolsApplied: Record<string, number>;
  }
): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({
      status: data.status,
      hero_photo_id: data.heroPhotoId,
      prepared_at: data.status === 'prepared' ? new Date().toISOString() : null,
      preparation_metadata: {
        confidence: data.confidence,
        toolsApplied: data.toolsApplied,
        preparedAt: new Date().toISOString(),
        engineVersion: '2.0.0',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId);
  
  if (error) {
    console.error(`[ListingEngine] Failed to finalize listing:`, error.message);
  }
}

function countToolsApplied(
  results: Array<{ toolsApplied: string[] }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const result of results) {
    for (const tool of result.toolsApplied) {
      counts[tool] = (counts[tool] || 0) + 1;
    }
  }
  
  return counts;
}

function reportProgress(
  onProgress: ((progress: ProcessingProgress) => void) | undefined,
  listingId: string,
  status: ProcessingStatus,
  message: string,
  startTime: number
): void {
  if (onProgress) {
    onProgress({
      listingId,
      status,
      currentPhase: message,
      totalPhotos: 0,
      analyzedPhotos: 0,
      processedPhotos: 0,
      estimatedTimeRemaining: 0,
      startedAt: new Date(startTime).toISOString(),
      messages: [message],
    });
  }
  
  console.log(`[ListingEngine] ${message}`);
}

// ============================================
// API RESPONSE BUILDER
// ============================================

export function buildPrepareResponse(
  result: ListingProcessingResult
): PrepareListingResponse {
  if (result.status === 'failed') {
    return {
      success: false,
      listingId: result.listingId,
      status: result.status,
      message: result.error || 'Preparation failed',
      error: result.error,
    };
  }
  
  let message: string;
  switch (result.status) {
    case 'completed':
      message = `Successfully prepared ${result.successfulPhotos} photos`;
      break;
    case 'needs_review':
      message = `Preparation complete, ${result.photosNeedingReview} photos need review`;
      break;
    default:
      message = `Preparation ${result.status}`;
  }
  
  return {
    success: true,
    listingId: result.listingId,
    status: result.status,
    message,
    estimatedTime: Math.round(result.totalProcessingTime / 1000),
  };
}

// ============================================
// EXPORTS
// ============================================

export * from './types';
export { analyzePhoto, analyzePhotos } from './photo-intelligence';
export { buildListingStrategy, getStrategySummary } from './strategy-builder';
export { validateResult, validateResults } from './quality-validator';
