/**
 * SnapR AI Engine V3 - Batch Processor
 * =====================================
 * Smart routing to optimal providers
 */

import { 
  PhotoStrategy, 
  ListingStrategy,
  PhotoProcessingResult,
  ProcessingProgress,
  LockedPresets,
} from './types';
import { ToolId } from '../router';
import { 
  getProviderForTool, 
  shouldUseAutoEnhance,
  shouldUseMultiPass,
  isAutoEnhanceConfigured,
  Provider,
} from './provider-router';
import { multiPassTwilight } from './multi-pass-twilight';
import { balanceWindowExposure } from './window-masking';
import { createClient } from '@/lib/supabase/server';

// Import providers
import { autoEnhance as runAutoEnhance } from '../providers/autoenhance';
import * as replicate from '../providers/replicate';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  maxConcurrency: 3,
  maxRetries: 2,
  retryDelayMs: 2000,
  toolTimeoutMs: 120000,
  batchDelayMs: 500,
};

// ============================================
// MAIN PROCESSOR
// ============================================
export async function processListingBatch(
  strategy: ListingStrategy,
  context: {
    listingId: string;
    userId: string;
    lockedPresets: LockedPresets;
    onProgress?: (progress: ProcessingProgress) => void;
  }
): Promise<PhotoProcessingResult[]> {
  console.log(`[BatchProcessor V3] ═══════════════════════════════════════`);
  console.log(`[BatchProcessor V3] Processing ${strategy.photoStrategies.length} photos`);
  console.log(`[BatchProcessor V3] AutoEnhance configured: ${isAutoEnhanceConfigured()}`);
  console.log(`[BatchProcessor V3] ═══════════════════════════════════════`);
  
  const startTime = Date.now();
  const results: PhotoProcessingResult[] = [];
  const supabase = await createClient();
  
  // Get signed URLs
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
        validatedPhotos: 0,
        skippedPhotos: strategy.skippedPhotos,
        estimatedTimeRemaining: estimateRemaining(strategy, results.length),
        percentComplete: Math.round((results.length / strategy.totalPhotos) * 100),
        startedAt: new Date(startTime).toISOString(),
        messages: [`Processing ${i + 1} to ${Math.min(i + CONFIG.maxConcurrency, photosWithUrls.length)}`],
      });
    }
    
    // Process batch
    const batchPromises = batch.map(photo => 
      processPhoto(photo, context, supabase)
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`[BatchProcessor V3] Progress: ${results.length}/${strategy.totalPhotos}`);
    
    // Delay between batches
    if (i + CONFIG.maxConcurrency < photosWithUrls.length) {
      await delay(CONFIG.batchDelayMs);
    }
  }
  
  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  
  console.log(`[BatchProcessor V3] ═══════════════════════════════════════`);
  console.log(`[BatchProcessor V3] COMPLETE: ${successCount}/${results.length} in ${(duration / 1000).toFixed(1)}s`);
  console.log(`[BatchProcessor V3] ═══════════════════════════════════════`);
  
  return results;
}

// ============================================
// SINGLE PHOTO PROCESSOR
// ============================================
async function processPhoto(
  photo: PhotoStrategy & { signedUrl: string },
  context: { listingId: string; userId: string; lockedPresets: LockedPresets },
  supabase: any
): Promise<PhotoProcessingResult> {
  const startTime = Date.now();
  
  // Handle skipped photos
  if (photo.skip) {
    return {
      photoId: photo.photoId,
      originalUrl: photo.signedUrl,
      enhancedUrl: null,
      toolsApplied: [],
      toolsSkipped: [],
      toolResults: {},
      success: false,
      confidence: photo.confidence,
      processingTime: 0,
      needsReview: false,
      skipped: true,
      skipReason: photo.skipReason,
    };
  }
  
  let currentUrl = photo.signedUrl;
  const toolsApplied: ToolId[] = [];
  const toolsSkipped: ToolId[] = [];
  const toolResults: PhotoProcessingResult['toolResults'] = {};
  let lastError: string | undefined;
  
  console.log(`[BatchProcessor V3] Photo ${photo.photoId}: ${photo.tools.join(' → ')}`);
  
  // Process each tool
  for (const tool of photo.toolOrder) {
    const toolStart = Date.now();
    const config = getProviderForTool(tool);
    
    try {
      const result = await processToolWithRouting(
        currentUrl,
        tool,
        config.provider,
        context.lockedPresets,
        photo.isTwilightTarget
      );
      
      if (result.success && result.enhancedUrl) {
        currentUrl = result.enhancedUrl;
        toolsApplied.push(tool);
        toolResults[tool] = {
          success: true,
          provider: config.provider,
          duration: Date.now() - toolStart,
        };
        console.log(`[BatchProcessor V3] ✓ ${tool} (${config.provider})`);
      } else {
        toolsSkipped.push(tool);
        toolResults[tool] = {
          success: false,
          provider: config.provider,
          duration: Date.now() - toolStart,
          error: result.error,
        };
        lastError = result.error;
        console.log(`[BatchProcessor V3] ✗ ${tool}: ${result.error}`);
      }
    } catch (error: any) {
      toolsSkipped.push(tool);
      toolResults[tool] = {
        success: false,
        provider: config.provider,
        duration: Date.now() - toolStart,
        error: error.message,
      };
      lastError = error.message;
      console.error(`[BatchProcessor V3] ✗ ${tool} error:`, error.message);
    }
  }
  
  const success = toolsApplied.length > 0;
  const processingTime = Date.now() - startTime;
  
  // Save if successful
  let finalUrl = currentUrl;
  if (success && currentUrl !== photo.signedUrl) {
    try {
      finalUrl = await saveEnhancedPhoto(currentUrl, photo.photoId, context.listingId, context.userId, supabase);
    } catch (error: any) {
      console.error(`[BatchProcessor V3] Save error:`, error.message);
    }
  }
  
  return {
    photoId: photo.photoId,
    originalUrl: photo.signedUrl,
    enhancedUrl: success ? finalUrl : null,
    toolsApplied,
    toolsSkipped,
    toolResults,
    success,
    error: success ? undefined : lastError,
    confidence: success ? photo.confidence : Math.max(photo.confidence - 30, 0),
    processingTime,
    needsReview: !success || toolsApplied.length < photo.tools.length,
    reviewReason: !success 
      ? `Failed: ${lastError}` 
      : toolsApplied.length < photo.tools.length 
        ? `Only ${toolsApplied.length}/${photo.tools.length} tools applied`
        : undefined,
    skipped: false,
  };
}

// ============================================
// SMART ROUTING
// ============================================
async function processToolWithRouting(
  imageUrl: string,
  tool: ToolId,
  provider: Provider,
  presets: LockedPresets,
  isTwilightTarget: boolean
): Promise<{ success: boolean; enhancedUrl?: string; error?: string }> {
  
  // Special handling for multi-pass twilight
  if (tool === 'virtual-twilight' && isTwilightTarget) {
    try {
      const result = await multiPassTwilight(imageUrl, {
        preset: presets.twilightPreset as any,
        enhanceWindowGlow: true,
        glowIntensity: 'medium',
      });
      return { success: result.success, enhancedUrl: result.url };
    } catch (error: any) {
      // Fallback to single-pass
      console.log('[BatchProcessor V3] Multi-pass failed, trying single-pass');
    }
  }
  
  // Special handling for window masking
  if (tool === 'window-masking') {
    try {
      const result = await balanceWindowExposure(imageUrl, { showOutdoorView: true });
      return { success: result.balanced, enhancedUrl: result.url };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  // Route to provider
  switch (provider) {
    case 'autoenhance':
      if (!isAutoEnhanceConfigured()) {
        console.log('[BatchProcessor V3] AutoEnhance not configured, using FLUX');
        return runFluxTool(imageUrl, tool, presets);
      }
      return runAutoEnhanceTool(imageUrl, tool);
      
    case 'sdxl-lightning':
      return runSDXLTool(imageUrl, tool);
      
    default:
      return runFluxTool(imageUrl, tool, presets);
  }
}

// ============================================
// PROVIDER IMPLEMENTATIONS
// ============================================

async function runAutoEnhanceTool(
  imageUrl: string,
  tool: ToolId
): Promise<{ success: boolean; enhancedUrl?: string; error?: string }> {
  try {
    // AutoEnhance.ai single-image API options
    // Note: hdr=true requires HDR bracket workflow with orders, not for single images
    const options: Record<string, any> = {};
    
    switch (tool) {
      case 'hdr':
      case 'auto-enhance':
        // For single images, use enhance without hdr flag
        // HDR flag is only for multi-bracket HDR workflows
        options.enhance = true;
        options.contrast_boost = 'MEDIUM';
        options.saturation = 1.1;
        break;
      case 'perspective-correction':
        options.vertical_correction = true;
        break;
      case 'lens-correction':
        options.lens_correction = true;
        break;
    }
    
    const enhancedUrl = await runAutoEnhance(imageUrl, options);
    return { success: true, enhancedUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function runFluxTool(
  imageUrl: string,
  tool: ToolId,
  presets: LockedPresets
): Promise<{ success: boolean; enhancedUrl?: string; error?: string }> {
  try {
    let enhancedUrl: string;
    
    // Get preset prompt if available
    const prompt = getPresetPrompt(tool, presets);
    
    switch (tool) {
      case 'sky-replacement':
        enhancedUrl = await replicate.skyReplacement(imageUrl, prompt);
        break;
      case 'virtual-twilight':
        enhancedUrl = await replicate.virtualTwilight(imageUrl, prompt);
        break;
      case 'lawn-repair':
        enhancedUrl = await replicate.lawnRepair(imageUrl, prompt);
        break;
      case 'declutter':
        enhancedUrl = await replicate.declutter(imageUrl, prompt);
        break;
      case 'virtual-staging':
        enhancedUrl = await replicate.virtualStaging(imageUrl, prompt);
        break;
      case 'fire-fireplace':
        enhancedUrl = await replicate.fireFireplace(imageUrl);
        break;
      case 'tv-screen':
        enhancedUrl = await replicate.tvScreen(imageUrl);
        break;
      case 'lights-on':
        enhancedUrl = await replicate.lightsOn(imageUrl);
        break;
      case 'pool-enhance':
        enhancedUrl = await replicate.poolEnhance(imageUrl);
        break;
      case 'hdr':
        enhancedUrl = await replicate.hdr(imageUrl);
        break;
      case 'auto-enhance':
        enhancedUrl = await replicate.autoEnhance(imageUrl);
        break;
      case 'perspective-correction':
        enhancedUrl = await replicate.perspectiveCorrection(imageUrl);
        break;
      case 'flash-fix':
        enhancedUrl = await replicate.flashFix(imageUrl);
        break;
      case 'color-balance':
        enhancedUrl = await replicate.colorBalance(imageUrl);
        break;
      case 'power-line-removal':
        enhancedUrl = await replicate.powerLineRemoval(imageUrl);
        break;
      case 'reflection-removal':
        enhancedUrl = await replicate.reflectionRemoval(imageUrl);
        break;
      case 'object-removal':
        enhancedUrl = await replicate.objectRemoval(imageUrl);
        break;
      default:
        enhancedUrl = await replicate.autoEnhance(imageUrl);
    }
    
    return { success: true, enhancedUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function runSDXLTool(
  imageUrl: string,
  tool: ToolId
): Promise<{ success: boolean; enhancedUrl?: string; error?: string }> {
  try {
    let enhancedUrl: string;
    
    switch (tool) {
      case 'snow-removal':
        enhancedUrl = await replicate.snowRemoval(imageUrl);
        break;
      case 'seasonal-spring':
        enhancedUrl = await replicate.seasonalSpring(imageUrl);
        break;
      case 'seasonal-summer':
        enhancedUrl = await replicate.seasonalSummer(imageUrl);
        break;
      case 'seasonal-fall':
        enhancedUrl = await replicate.seasonalFall(imageUrl);
        break;
      default:
        return { success: false, error: 'Unknown SDXL tool' };
    }
    
    return { success: true, enhancedUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// HELPERS
// ============================================

function getPresetPrompt(tool: ToolId, presets: LockedPresets): string | undefined {
  switch (tool) {
    case 'sky-replacement': return presets.skyPrompt;
    case 'virtual-twilight': return presets.twilightPrompt;
    case 'lawn-repair': return presets.lawnPrompt;
    case 'virtual-staging': return presets.stagingPrompt;
    case 'declutter': return presets.declutterPrompt;
    default: return undefined;
  }
}

async function getSignedUrls(
  strategies: PhotoStrategy[],
  supabase: any
): Promise<(PhotoStrategy & { signedUrl: string })[]> {
  const results: (PhotoStrategy & { signedUrl: string })[] = [];
  
  for (const strategy of strategies) {
    const { data } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(strategy.photoUrl, 3600);
    
    results.push({ 
      ...strategy, 
      signedUrl: data?.signedUrl || strategy.photoUrl 
    });
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
  if (!response.ok) throw new Error('Failed to fetch enhanced image');
  
  const buffer = await response.arrayBuffer();
  const storagePath = `enhanced/${userId}/${listingId}/${photoId}-prepared.jpg`;
  
  const { error } = await supabase.storage
    .from('raw-images')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
  
  if (error) throw new Error(`Upload failed: ${error.message}`);
  
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

function estimateRemaining(strategy: ListingStrategy, processed: number): number {
  const remaining = strategy.totalPhotos - processed;
  const avgTime = strategy.estimatedTotalTime / strategy.totalPhotos;
  return Math.round(remaining * avgTime);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// PRIORITY ORDERING
// ============================================
export function orderByPriority(strategies: PhotoStrategy[]): PhotoStrategy[] {
  const priorityOrder = { critical: 0, recommended: 1, optional: 2, none: 3 };
  
  return [...strategies].sort((a, b) => {
    if (a.isHeroCandidate && !b.isHeroCandidate) return -1;
    if (!a.isHeroCandidate && b.isHeroCandidate) return 1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
