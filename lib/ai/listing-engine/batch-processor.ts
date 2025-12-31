/**
 * SnapR AI Engine V2 - Batch Processor
 * =====================================
 * Executes enhancements in parallel with rate limiting
 */

import { 
  PhotoStrategy, 
  ListingStrategy,
  PhotoProcessingResult,
  ProcessingProgress 
} from './types';
import { ToolId, processEnhancement } from '../router';
import { createClient } from '@/lib/supabase/server';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Maximum concurrent photo processing
  maxConcurrency: 3,
  
  // Maximum concurrent tools per photo
  maxToolsConcurrent: 1, // Sequential per photo for consistency
  
  // Retry configuration
  maxRetries: 2,
  retryDelayMs: 2000,
  
  // Timeout per tool
  toolTimeoutMs: 120000, // 2 minutes
  
  // Delay between batches to avoid rate limits
  batchDelayMs: 500,
};

// ============================================
// TYPES
// ============================================

interface ProcessingContext {
  listingId: string;
  userId: string;
  onProgress?: (progress: ProcessingProgress) => void;
}

// ============================================
// MAIN BATCH PROCESSOR
// ============================================

export async function processListingBatch(
  strategy: ListingStrategy,
  context: ProcessingContext
): Promise<PhotoProcessingResult[]> {
  console.log(`[BatchProcessor] Starting batch for listing ${strategy.listingId}`);
  console.log(`[BatchProcessor] ${strategy.photoStrategies.length} photos, concurrency: ${CONFIG.maxConcurrency}`);
  
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
      processPhotoWithTools(photo, context, supabase)
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
  console.log(`[BatchProcessor] Complete: ${results.length} photos in ${(duration / 1000).toFixed(1)}s`);
  
  return results;
}

// ============================================
// SINGLE PHOTO PROCESSOR
// ============================================

async function processPhotoWithTools(
  photo: PhotoStrategy & { signedUrl: string },
  context: ProcessingContext,
  supabase: any
): Promise<PhotoProcessingResult> {
  const startTime = Date.now();
  let currentUrl = photo.signedUrl;
  const appliedTools: ToolId[] = [];
  let lastError: string | undefined;
  
  console.log(`[BatchProcessor] Processing photo ${photo.photoId} with tools:`, photo.toolOrder);
  
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
      
      // Apply enhancement with retry
      const result = await applyToolWithRetry(currentUrl, tool);
      
      if (result.success && result.enhancedUrl) {
        currentUrl = result.enhancedUrl;
        appliedTools.push(tool);
        console.log(`[BatchProcessor] ✓ ${tool} applied to ${photo.photoId}`);
      } else {
        console.warn(`[BatchProcessor] ✗ ${tool} failed for ${photo.photoId}: ${result.error}`);
        lastError = result.error;
        // Continue with other tools even if one fails
      }
    } catch (error: any) {
      console.error(`[BatchProcessor] Error applying ${tool}:`, error.message);
      lastError = error.message;
      // Continue with other tools
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
      // Use the direct URL if save fails
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
// TOOL APPLICATION WITH RETRY
// ============================================

async function applyToolWithRetry(
  imageUrl: string,
  tool: ToolId,
  attempt = 1
): Promise<{ success: boolean; enhancedUrl?: string; error?: string }> {
  try {
    const result = await withTimeout(
      processEnhancement(tool, imageUrl, {}),
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
      return applyToolWithRetry(imageUrl, tool, attempt + 1);
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
    // The photoUrl should already be the storage path
    const { data } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(strategy.photoUrl, 3600);
    
    if (data?.signedUrl) {
      results.push({ ...strategy, signedUrl: data.signedUrl });
    } else {
      // Try using photoUrl directly if it's already a full URL
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
  // Fetch the enhanced image
  const response = await fetch(enhancedUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch enhanced image');
  }
  
  const buffer = await response.arrayBuffer();
  const storagePath = `enhanced/${userId}/${listingId}/${photoId}-prepared.jpg`;
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('raw-images')
    .upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  
  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }
  
  // Update photo record
  await supabase
    .from('photos')
    .update({
      processed_url: storagePath,
      status: 'completed',
      variant: 'prepared',
      updated_at: new Date().toISOString(),
    })
    .eq('id', photoId);
  
  // Get signed URL for the saved photo
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
    // Hero candidates first
    if (a.isHeroCandidate && !b.isHeroCandidate) return -1;
    if (!a.isHeroCandidate && b.isHeroCandidate) return 1;
    
    // Then by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by number of tools (more work = earlier)
    return b.tools.length - a.tools.length;
  });
}
