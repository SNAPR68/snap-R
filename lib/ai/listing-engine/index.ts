/**
 * SnapR AI Engine V2 - Listing Engine (Premium)
 * =============================================
 * Main orchestrator for listing-level photo preparation
 * 
 * PREMIUM FEATURES:
 * - GPT-4 Vision scene analysis
 * - Locked presets for consistency across listing
 * - Multi-pass twilight with window glow
 * - Window balancing for interiors
 * - Quality validation
 */

import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { analyzePhotos } from './photo-intelligence';
import { buildListingStrategy, getStrategySummary } from './strategy-builder';
import { processListingBatch, orderByPriority } from './batch-processor';
import { analyzeConsistency, getConsistencyReport } from './consistency';
import { validateResults, getValidationReport, quickValidate } from './quality-validator';
import { determineLockedPresets, LockedPresets } from './preset-locker';
import { COST_ESTIMATES } from '@/lib/cost-logger';
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
  maxPhotos: 50,
  totalTimeoutMs: 600000, // 10 minutes
  enableFullValidation: false,
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
  const phaseTimingsMs = {
    fetchMs: 0,
    analysisMs: 0,
    presetsMs: 0,
    strategyMs: 0,
    processingMs: 0,
    consistencyMs: 0,
    validationMs: 0,
    finalizeMs: 0,
    totalMs: 0,
  };
  
  console.log(`\n[ListingEngine] ========================================`);
  console.log(`[ListingEngine] PREPARE LISTING (PREMIUM): ${listingId}`);
  console.log(`[ListingEngine] ========================================\n`);
  
  const supabase = options.admin ? adminSupabase() : await createClient();
  
  try {
    // Update listing status to 'preparing'
    await updateListingStatus(supabase, listingId, 'preparing');

    // Fetch plan tier for provider routing
    let planTier = 'free';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, plan')
        .eq('id', userId)
        .single();
      planTier = (profile?.subscription_tier || profile?.plan || 'free') as string;
    } catch (error) {
      console.warn('[ListingEngine] Failed to read plan tier, defaulting to free');
    }
    
    // ========================================
    // PHASE 1: FETCH PHOTOS
    // ========================================
    reportProgress(onProgress, listingId, 'analyzing', 'Fetching photos...', startTime);
    
    const fetchStart = Date.now();
    const photos = await fetchListingPhotos(supabase, listingId);
    phaseTimingsMs.fetchMs = Date.now() - fetchStart;
    
    if (photos.length === 0) {
      throw new Error('No photos found for this listing');
    }
    
    if (photos.length > CONFIG.maxPhotos) {
      console.warn(`[ListingEngine] Limiting to ${CONFIG.maxPhotos} photos`);
      photos.splice(CONFIG.maxPhotos);
    }
    
    console.log(`[ListingEngine] Found ${photos.length} photos`);
    
    // ========================================
    // PHASE 2: ANALYZE PHOTOS (GPT-4 Vision)
    // ========================================
    reportProgress(onProgress, listingId, 'analyzing', `Analyzing ${photos.length} photos with AI vision...`, startTime);
    
    const analysisConcurrency = Number(process.env.ANALYSIS_CONCURRENCY || (options.prioritizeSpeed ? 4 : 2));
    const analysisBatchDelayMs = Number(process.env.ANALYSIS_BATCH_DELAY_MS || (options.prioritizeSpeed ? 900 : 1500));
    const analysisStart = Date.now();
    const analyses = await analyzePhotos(photos, {
      maxConcurrency: analysisConcurrency,
      batchDelayMs: analysisBatchDelayMs,
    });
    phaseTimingsMs.analysisMs = Date.now() - analysisStart;
    
    console.log(`[ListingEngine] Analysis complete`);
    
    // ========================================
    // PHASE 3: DETERMINE LOCKED PRESETS
    // ========================================
    reportProgress(onProgress, listingId, 'strategizing', 'Locking presets for consistency...', startTime);
    
    const presetsStart = Date.now();
    const lockedPresets = determineLockedPresets(analyses);
    phaseTimingsMs.presetsMs = Date.now() - presetsStart;
    
    console.log(`[ListingEngine] Presets locked:`, {
      sky: lockedPresets.skyPreset,
      twilight: lockedPresets.twilightPreset,
      staging: lockedPresets.stagingStyle,
      colorTemp: lockedPresets.colorTemp,
    });
    
    // ========================================
    // PHASE 4: BUILD STRATEGY
    // ========================================
    reportProgress(onProgress, listingId, 'strategizing', 'Building enhancement strategy...', startTime);
    
    const strategyStart = Date.now();
    const strategy = buildListingStrategy(listingId, analyses);
    phaseTimingsMs.strategyMs = Date.now() - strategyStart;
    
    console.log(`\n${getStrategySummary(strategy)}\n`);
    
    // ========================================
    // PHASE 5: PROCESS PHOTOS (PREMIUM)
    // ========================================
    reportProgress(onProgress, listingId, 'processing', 'Enhancing photos with premium engine...', startTime);
    
    // Order by priority (hero first, then critical, etc.)
    strategy.photoStrategies = orderByPriority(strategy.photoStrategies);
    
    const processingStart = Date.now();
    const results = await processListingBatch(strategy, {
      listingId,
      userId,
      lockedPresets, // Pass locked presets for consistency
      planTier,
      onProgress,
      supabase,
    });
    phaseTimingsMs.processingMs = Date.now() - processingStart;
    
    console.log(`[ListingEngine] Processing complete: ${results.filter(r => r.success).length}/${results.length} successful`);
    
    // ========================================
    // PHASE 6: CONSISTENCY PASS
    // ========================================
    if (CONFIG.enableConsistencyPass) {
      reportProgress(onProgress, listingId, 'consistency_pass', 'Verifying consistency...', startTime);
      
      const consistencyStart = Date.now();
      const consistency = await analyzeConsistency(results);
      phaseTimingsMs.consistencyMs = Date.now() - consistencyStart;
      console.log(`\n${getConsistencyReport(consistency.metrics, consistency.adjustments, consistency.consistencyScore)}\n`);
    }
    
    // ========================================
    // PHASE 7: VALIDATION
    // ========================================
    reportProgress(onProgress, listingId, 'validating', 'Validating results...', startTime);
    
    const validationStart = Date.now();
    let validations;
    if (CONFIG.enableFullValidation) {
      validations = await validateResults(results);
    } else {
      validations = results.map(r => quickValidate(r));
    }
    phaseTimingsMs.validationMs = Date.now() - validationStart;
    
    console.log(`\n${getValidationReport(validations)}\n`);
    
    // ========================================
    // PHASE 8: FINALIZE
    // ========================================
    const successfulPhotos = results.filter(r => r.success).length;
    const failedPhotos = results.filter(r => !r.success).length;
    const photosNeedingReview = validations.filter(v => v.needsReview).length;
    
    const overallConfidence = Math.round(
      validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length
    );

    const validationByPhotoId = new Map(validations.map(v => [v.photoId, v]));
    const photoAudit = results.reduce<Record<string, any>>((acc, result) => {
      const validation = validationByPhotoId.get(result.photoId);
      acc[result.photoId] = {
        toolsApplied: result.toolsApplied,
        toolsSkipped: result.toolsSkipped,
        toolResults: result.toolResults,
        postProcessing: result.postProcessing,
        success: result.success,
        processingTime: result.processingTime,
        needsReview: result.needsReview,
        reviewReason: result.reviewReason,
        validation: validation ? {
          needsReview: validation.needsReview,
          recommendation: validation.recommendation,
          confidence: validation.confidence,
          issues: validation.issues,
        } : undefined,
      };
      return acc;
    }, {});

    const analysisByPhotoId = new Map(analyses.map((analysis) => [analysis.photoId, analysis]));
    const decisionAudit = strategy.photoStrategies.reduce<Record<string, any>>((acc, strategyItem) => {
      const analysis = analysisByPhotoId.get(strategyItem.photoId);
      if (!analysis) return acc;
      acc[strategyItem.photoId] = {
        photoType: analysis.photoType,
        heroScore: analysis.heroScore,
        lighting: analysis.lighting,
        needsHDR: analysis.needsHDR,
        verticalAlignment: analysis.verticalAlignment,
        hasSky: analysis.hasSky,
        skyVisible: analysis.skyVisible,
        skyQuality: analysis.skyQuality,
        skyNeedsReplacement: analysis.skyNeedsReplacement,
        hasLawn: analysis.hasLawn,
        lawnVisible: analysis.lawnVisible,
        lawnQuality: analysis.lawnQuality,
        lawnNeedsRepair: analysis.lawnNeedsRepair,
        hasPool: analysis.hasPool,
        poolNeedsEnhancement: analysis.poolNeedsEnhancement,
        hasVisibleWindows: analysis.hasVisibleWindows,
        windowExposureIssue: analysis.windowExposureIssue,
        clutterLevel: analysis.clutterLevel,
        roomEmpty: analysis.roomEmpty,
        isTwilightTarget: strategyItem.isTwilightTarget,
        toolsSelected: strategyItem.tools,
        toolReasons: analysis.toolReasons || {},
        notSuggested: analysis.notSuggested || {},
        confidence: analysis.confidence,
      };
      return acc;
    }, {});

    const costBreakdownCents = computeCostBreakdown(results);
    const analysisCostCents = (COST_ESTIMATES.openai?.['image-analysis'] ?? COST_ESTIMATES.openai?.default ?? 0) * analyses.length;
    costBreakdownCents.openai = (costBreakdownCents.openai || 0) + analysisCostCents;
    const totalCostUsd = Object.values(costBreakdownCents).reduce((sum, cents) => sum + cents, 0) / 100;
    
    // Determine final status
    let finalStatus: ProcessingStatus = 'completed';
    if (failedPhotos > results.length * 0.3) {
      finalStatus = 'failed';
    } else if (photosNeedingReview > 0 || overallConfidence < 70) {
      finalStatus = 'needs_review';
    }
    
    // Update listing in database
    const finalizeStart = Date.now();
    await finalizeListing(supabase, listingId, {
      status: finalStatus === 'completed' ? 'prepared' : finalStatus,
      heroPhotoId: strategy.heroPhotoId,
      confidence: overallConfidence,
      toolsApplied: countToolsApplied(results),
      lockedPresets: {
        sky: lockedPresets.skyPreset,
        twilight: lockedPresets.twilightPreset,
        staging: lockedPresets.stagingStyle,
      },
      photoAudit,
      decisionAudit,
      validationSummary: {
        total: validations.length,
        passed: validations.filter(v => v.isValid).length,
        failed: validations.filter(v => !v.isValid).length,
        needsReview: validations.filter(v => v.needsReview).length,
      },
      costBreakdown: toCostBreakdownUsd(costBreakdownCents),
      totalCostUsd,
      phaseTimingsMs,
    });
    phaseTimingsMs.finalizeMs = Date.now() - finalizeStart;
    
    const totalTime = Date.now() - startTime;
    phaseTimingsMs.totalMs = totalTime;
    
    console.log(`\n[ListingEngine] ========================================`);
    console.log(`[ListingEngine] COMPLETE: ${finalStatus.toUpperCase()}`);
    console.log(`[ListingEngine] Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`[ListingEngine] Success: ${successfulPhotos}/${results.length}`);
    console.log(`[ListingEngine] Confidence: ${overallConfidence}%`);
    console.log(`[ListingEngine] Presets used: sky=${lockedPresets.skyPreset}, twilight=${lockedPresets.twilightPreset}`);
    console.log(`[ListingEngine] ========================================\n`);
    
    return {
      listingId,
      status: finalStatus,
      heroPhotoId: strategy.heroPhotoId,
      photoResults: results,
      totalPhotos: results.length,
      validPhotos: strategy.validPhotos,
      skippedPhotos: strategy.skippedPhotos,
      successfulPhotos,
      failedPhotos,
      photosNeedingReview,
      overallConfidence,
      consistencyScore: 85,
      totalProcessingTime: totalTime,
      totalCost: totalCostUsd,
      phaseTimingsMs,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
    };
    
  } catch (error: any) {
    console.error(`[ListingEngine] FAILED:`, error.message);
    
    await updateListingStatus(supabase, listingId, 'failed');
    
    return {
      listingId,
      status: 'failed',
      heroPhotoId: null,
      photoResults: [],
      totalPhotos: 0,
      validPhotos: 0,
      skippedPhotos: 0,
      successfulPhotos: 0,
      failedPhotos: 0,
      photosNeedingReview: 0,
      overallConfidence: 0,
      consistencyScore: 0,
      totalProcessingTime: Date.now() - startTime,
      totalCost: 0,
      phaseTimingsMs: {
        ...phaseTimingsMs,
        totalMs: Date.now() - startTime,
      },
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
  
  const photosWithUrls: Array<{ id: string; url: string }> = [];
  
  const resolved = await Promise.all(
    photos.map(async (photo) => {
      if (photo.raw_url.startsWith('http://') || photo.raw_url.startsWith('https://')) {
        return { id: photo.id, url: photo.raw_url };
      }

      const { data } = await supabase.storage
        .from('raw-images')
        .createSignedUrl(photo.raw_url, 3600);

      return data?.signedUrl ? { id: photo.id, url: data.signedUrl } : null;
    })
  );

  for (const item of resolved) {
    if (item) photosWithUrls.push(item);
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
    lockedPresets: { sky: string; twilight: string; staging: string };
    photoAudit?: Record<string, any>;
    decisionAudit?: Record<string, any>;
    phaseTimingsMs?: ListingProcessingResult['phaseTimingsMs'];
    validationSummary?: {
      total: number;
      passed: number;
      failed: number;
      needsReview: number;
    };
    costBreakdown?: Record<string, number>;
    totalCostUsd?: number;
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
        lockedPresets: data.lockedPresets,
        validationSummary: data.validationSummary,
        photoAudit: data.photoAudit,
        decisionAudit: data.decisionAudit,
        costBreakdown: data.costBreakdown,
        totalCostUsd: data.totalCostUsd,
        phaseTimingsMs: data.phaseTimingsMs,
        preparedAt: new Date().toISOString(),
        engineVersion: '2.0.0-premium',
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

function mapProviderToCostProvider(provider?: string): keyof typeof COST_ESTIMATES | 'sharp' {
  if (!provider) return 'replicate';
  if (provider === 'autoenhance') return 'autoenhance';
  if (provider === 'sharp') return 'sharp';
  return 'replicate';
}

function computeCostBreakdown(results: ListingProcessingResult['photoResults']): Record<string, number> {
  const breakdown: Record<string, number> = {};

  for (const result of results) {
    const toolResults = result.toolResults || {};
    for (const [toolId, detail] of Object.entries(toolResults)) {
      if (!detail || !detail.success) continue;
      const costProvider = mapProviderToCostProvider(detail.provider);
      if (costProvider === 'sharp') continue;
      const providerCosts = COST_ESTIMATES[costProvider] || {};
      const costCents =
        providerCosts[toolId] ??
        providerCosts.default ??
        0;
      breakdown[costProvider] = (breakdown[costProvider] || 0) + costCents;
    }
  }

  return breakdown;
}

function toCostBreakdownUsd(costCents: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(costCents).map(([key, value]) => [key, Number((value / 100).toFixed(4))])
  );
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
      validatedPhotos: 0,
      skippedPhotos: 0,
      estimatedTimeRemaining: 0,
      percentComplete: 0,
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
      message = `Successfully prepared ${result.successfulPhotos} photos with premium engine`;
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
    totalProcessingTimeMs: result.totalProcessingTime,
    phaseTimingsMs: result.phaseTimingsMs,
  };
}

// ============================================
// EXPORTS
// ============================================

export * from './types';
export { analyzePhoto, analyzePhotos } from './photo-intelligence';
export { buildListingStrategy, getStrategySummary } from './strategy-builder';
export { validateResult, validateResults } from './quality-validator';
export { determineLockedPresets } from './preset-locker';
export { multiPassTwilight } from './multi-pass-twilight';
export { balanceWindowExposure, detectWindows } from './window-masking';
