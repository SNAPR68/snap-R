/**
 * SnapR AI Engine V2 - Batch Processor (Premium)
 * ===============================================
 * Executes enhancements with:
 * - Locked presets for consistency
 * - Multi-pass twilight for superior quality
 * - Window balancing for interiors
 */

import { 
  PhotoStrategy, 
  ListingStrategy,
  PhotoProcessingResult,
  ProcessingProgress 
} from './types';
import { ToolId, processEnhancement } from '../router';
import { LockedPresets, getLockedPrompt } from './preset-locker';
import { multiPassTwilight } from './multi-pass-twilight';
import { balanceWindowExposure } from './window-masking';
import { createClient } from '@/lib/supabase/server';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  maxConcurrency: 3,
  maxRetries: 2,
  retryDelayMs: 2000,
  toolTimeoutMs: 120000,
  batchDelayMs: 500,
  
  // Premium features
  useMultiPassTwilight: true,
  useWindowBalancing: true,
};

// ============================================
// TYPES
// ============================================

interface ProcessingContext {
  listingId: string;
  userId: string;
  lockedPresets: LockedPresets;
  onProgress?: (progress: ProcessingProgress) => void;
}

// ============================================
// MAIN BATCH PROCESSOR
// ============================================

export async function processListingBatch(
  strategy: ListingStrategy,
  context: ProcessingContext
): Promise<PhotoProcessingResult[]> {
  console.log(`[BatchProcessor] Starting PREMIUM batch for listing ${strategy.listingId}`);
  console.log(`[BatchProcessor] ${strategy.photoStrategies.length} photos, concurrency: ${CONFIG.maxConcurrency}`);
  console.log(`[BatchProcessor] Multi-pass twilight: ${CONFIG.useMultiPassTwilight}`);
  console.log(`[BatchProcessor] Window balancing: ${CONFIG.useWindowBalancing}`);
  console.log(`[BatchProcessor] Locked presets:`, {
    sky: context.lockedPresets.skyPreset,
    twilight: context.lockedPresets.twilightPreset,
    staging: context.lockedPresets.stagingStyle,
  });
  
  const startTime = Date.now();
  const results: PhotoProcessingResult[] = [];
  const supabase = await createClient();
  
  // Get signed URLs for all photos
  const photosWithUrls = await getSignedUrls(strategy.photoStrategies, supabase);
  
  // Process in batches
  for (let i = 0; i < photosWithUrls.length; i += CONFIG.maxConcurrency) {
    const batch = photosWithUrls.slice(i, i + CONFIG.maxConcurrency);
    
    // Report progress
    if (context.onProgress) {
      context.onProgress({
        listingId: context.listingId,
        status: 'processing',
        currentPhase: 'Enhancing photos',
        totalPhotos: strategy.totalPhotos,
        analyzedPhotos: strategy.totalPhotos,
        processedPhotos: results.length,
        estimatedTimeRemaining: estimateRemainingTime(strategy, results.length),
        startedAt: new Date(startTime).toISOString(),
        messages: [`Processing photos ${i + 1} to ${Math.min(i + CONFIG.maxConcurrency, photosWithUrls.length)}`],
      });
    }
    
    // Process batch in parallel
    const batchPromises = batch.map(photo => 
      processPhotoWithPresets(photo, context, supabase)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`[BatchProcessor] Progress: ${results.length}/${strategy.totalPhotos}`);
    
    // Delay between batches
    if (i + CONFIG.maxConcurrency < photosWithUrls.length) {
      await delay(CONFIG.batchDelayMs);
    }
  }
  
  const duration = Date.now() - startTime;
  console.log(`[BatchProcessor] Complete: ${results.filter(r => r.success).length}/${results.length} successful in ${(duration / 1000).toFixed(1)}s`);
  
  return results;
}

// ============================================
// SINGLE PHOTO PROCESSOR (WITH PRESETS)
// ============================================

async function processPhotoWithPresets(
  photo: PhotoStrategy & { signedUrl: string },
  context: ProcessingContext,
  supabase: any
): Promise<PhotoProcessingResult> {
  const startTime = Date.now();
  let currentUrl = photo.signedUrl;
  const appliedTools: ToolId[] = [];
  let lastError: string | undefined;
  
  console.log(`[BatchProcessor] Processing photo ${photo.photoId}`);
  console.log(`[BatchProcessor] Tools to apply:`, photo.toolOrder);
  console.log(`[BatchProcessor] Is twilight target:`, photo.isTwilightTarget);
  
  // Process tools sequentially for this photo
  for (const tool of photo.toolOrder) {
    try {
      // Report current tool
      if (context.onProgress) {
        context.onProgress({
          listingId: context.listingId,
          status: 'processing',
          currentPhase: 'Enhancing photos',
          totalPhotos: 0,
          analyzedPhotos: 0,
          processedPhotos: 0,
          currentPhotoId: photo.photoId,
          currentTool: tool,
          estimatedTimeRemaining: 0,
          startedAt: new Date().toISOString(),
          messages: [`Applying ${tool} to photo`],
        });
      }
      
      let result: { success: boolean; enhancedUrl?: string; error?: string };
      
      // ========================================
      // SPECIAL HANDLING: Multi-Pass Twilight
      // ========================================
      if (tool === 'virtual-twilight' && CONFIG.useMultiPassTwilight && photo.isTwilightTarget) {
        console.log(`[BatchProcessor] Using MULTI-PASS twilight for ${photo.photoId}`);
        
        try {
          const twilightResult = await multiPassTwilight(currentUrl, {
            preset: context.lockedPresets.twilightPreset,
            enhanceWindowGlow: true,
            glowIntensity: 'medium',
          });
          
          result = {
            success: twilightResult.success,
            enhancedUrl: twilightResult.url,
          };
          
          console.log(`[BatchProcessor] Multi-pass twilight complete (${twilightResult.passes} passes)`);
        } catch (error: any) {
          console.error(`[BatchProcessor] Multi-pass twilight failed, falling back to single pass`);
          // Fallback to regular twilight
          result = await applyToolWithPresets(currentUrl, tool, context.lockedPresets);
        }
      }
      // ========================================
      // SPECIAL HANDLING: Window Balancing
      // ========================================
      else if (tool === 'window-masking' && CONFIG.useWindowBalancing) {
        console.log(`[BatchProcessor] Using window balancing for ${photo.photoId}`);
        
        try {
          const balanceResult = await balanceWindowExposure(currentUrl, {
            showOutdoorView: true,
            viewType: 'sky',
          });
          
          result = {
            success: balanceResult.balanced,
            enhancedUrl: balanceResult.url,
          };
        } catch (error: any) {
          result = { success: false, error: error.message };
        }
      }
      // ========================================
      // STANDARD TOOLS WITH LOCKED PRESETS
      // ========================================
      else {
        result = await applyToolWithPresets(currentUrl, tool, context.lockedPresets);
      }
      
      if (result.success && result.enhancedUrl) {
        currentUrl = result.enhancedUrl;
        appliedTools.push(tool);
        console.log(`[BatchProcessor] ✓ ${tool} applied to ${photo.photoId}`);
      } else {
        console.warn(`[BatchProcessor] ✗ ${tool} failed for ${photo.photoId}: ${result.error}`);
        lastError = result.error;
      }
    } catch (error: any) {
      console.error(`[BatchProcessor] Error applying ${tool}:`, error.message);
      lastError = error.message;
    }
  }
  
  const processingTime = Date.now() - startTime;
  const success = appliedTools.length > 0;
  
  // Save enhanced photo to storage if successful
  let finalUrl = currentUrl;
  if (success && currentUrl !== photo.signedUrl) {
    try {
      finalUrl = await saveEnhancedPhoto(
        currentUrl,
        photo.photoId,
        context.listingId,
        context.userId,
        supabase
      );
    } catch (error: any) {
      console.error(`[BatchProcessor] Error saving enhanced photo:`, error.message);
    }
  }
  
  return {
    photoId: photo.photoId,
    originalUrl: photo.signedUrl,
    enhancedUrl: success ? finalUrl : null,
    toolsApplied: appliedTools,
    success,
    error: success ? undefined : lastError,
    confidence: success ? photo.confidence : Math.max(photo.confidence - 30, 0),
    processingTime,
    needsReview: !success || appliedTools.length < photo.tools.length,
    reviewReason: !success 
      ? `Enhancement failed: ${lastError}` 
      : appliedTools.length < photo.tools.length 
        ? `Only ${appliedTools.length}/${photo.tools.length} tools applied`
        : undefined,
  };
}

// ============================================
// APPLY TOOL WITH LOCKED PRESETS
// ============================================

async function applyToolWithPresets(
  imageUrl: string,
  tool: ToolId,
  presets: LockedPresets,
  attempt = 1
): Promise<{ success: boolean; enhancedUrl?: string; error?: string }> {
  try {
    // Get the locked prompt for this tool (ensures consistency)
    const lockedPrompt = getLockedPrompt(tool, presets);
    
    console.log(`[BatchProcessor] Applying ${tool} with ${lockedPrompt ? 'LOCKED' : 'default'} preset`);
    
    const result = await withTimeout(
      processEnhancement(tool, imageUrl, { prompt: lockedPrompt }),
      CONFIG.toolTimeoutMs,
      `${tool} timeout`
    );
    
    return {
      success: result.success,
      enhancedUrl: result.enhancedUrl,
      error: result.error,
    };
  } catch (error: any) {
    if (attempt < CONFIG.maxRetries) {
      console.log(`[BatchProcessor] Retrying ${tool} (attempt ${attempt + 1})`);
      await delay(CONFIG.retryDelayMs);
      return applyToolWithPresets(imageUrl, tool, presets, attempt + 1);
    }
    
    return {
      success: false,
      error: error.message || 'Enhancement failed after retries',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getSignedUrls(
  strategies: PhotoStrategy[],
  supabase: any
): Promise<(PhotoStrategy & { signedUrl: string })[]> {
  const results: (PhotoStrategy & { signedUrl: string })[] = [];
  
  for (const strategy of strategies) {
    const { data } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(strategy.photoUrl, 3600);
    
    if (data?.signedUrl) {
      results.push({ ...strategy, signedUrl: data.signedUrl });
    } else {
      results.push({ ...strategy, signedUrl: strategy.photoUrl });
    }
  }
  
  return results;
}

async function saveEnhancedPhoto(
  enhancedUrl: string,
  photoId: string,
  listingId: string,
  userId: string,
  supabase: any
): Promise<string> {
  const response = await fetch(enhancedUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch enhanced image');
  }
  
  const buffer = await response.arrayBuffer();
  const storagePath = `enhanced/${userId}/${listingId}/${photoId}-prepared.jpg`;
  
  const { error: uploadError } = await supabase.storage
    .from('raw-images')
    .upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  
  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }
  
  await supabase
    .from('photos')
    .update({
      processed_url: storagePath,
      status: 'completed',
      variant: 'prepared',
      updated_at: new Date().toISOString(),
    })
    .eq('id', photoId);
  
  const { data } = await supabase.storage
    .from('raw-images')
    .createSignedUrl(storagePath, 3600);
  
  return data?.signedUrl || enhancedUrl;
}

function estimateRemainingTime(
  strategy: ListingStrategy,
  processedCount: number
): number {
  const remaining = strategy.totalPhotos - processedCount;
  const avgTimePerPhoto = strategy.estimatedTotalTime / strategy.totalPhotos;
  return Math.round(remaining * avgTimePerPhoto);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// ============================================
// PRIORITY ORDERING
// ============================================

export function orderByPriority(strategies: PhotoStrategy[]): PhotoStrategy[] {
  const priorityOrder = { critical: 0, recommended: 1, optional: 2, none: 3 };
  
  return [...strategies].sort((a, b) => {
    if (a.isHeroCandidate && !b.isHeroCandidate) return -1;
    if (!a.isHeroCandidate && b.isHeroCandidate) return 1;
    
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return b.tools.length - a.tools.length;
  });
}
