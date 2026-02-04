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
import { scoreEnhancementQuality, checkStructuralIntegrity } from '../providers/openai-vision';
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
import { SAMMasksClient, MaskType } from '../providers/sam-masks';
import { autoEnhance as sharpAutoEnhance, analyzeImage } from '../providers/sharp-enhance';

// Import providers
import { autoEnhance as runAutoEnhance } from '../providers/autoenhance';
import * as replicate from '../providers/replicate';
import type { FluxOptions } from '../providers/replicate';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  maxConcurrency: Number(process.env.BATCH_MAX_CONCURRENCY || 4),
  maxRetries: 2,
  retryDelayMs: 2000,
  toolTimeoutMs: 120000,
  batchDelayMs: Number(process.env.BATCH_DELAY_MS || 350),
};

const PROGRESS_RANGE = {
  processingStart: Number(process.env.AI_PROGRESS_PROCESSING_START || 40),
  processingEnd: Number(process.env.AI_PROGRESS_PROCESSING_END || 90),
};

const HERO_UPSCALE = {
  enabled: process.env.AI_HERO_UPSCALE !== 'false',
  scale: Number(process.env.AI_HERO_UPSCALE_SCALE || 2),
};

const BASE_ENHANCE = {
  enabled: process.env.AI_BASE_ENHANCE !== 'false',
  preset: process.env.AI_BASE_ENHANCE_PRESET,
};

const INPAINT = {
  provider: process.env.AI_INPAINT_PROVIDER || '',
  enabled: Boolean(process.env.AI_INPAINT_PROVIDER),
  minMaskArea: Number(process.env.AI_INPAINT_MIN_MASK_AREA || 1),
  requireMask: process.env.AI_REQUIRE_MASK_FOR_INPAINT !== 'false',
};
const ENFORCE_MASKED_TOOLS = process.env.AI_ENFORCE_MASKED_TOOLS !== 'false';

const QUALITY_GATE = {
  enabled: process.env.AI_QUALITY_GATE === 'true',
  minScore: Number(process.env.AI_QUALITY_GATE_MIN_SCORE || 8),
  failOpen: process.env.AI_QC_FAIL_OPEN === 'true',
};

const BRIGHTNESS_GUARD = {
  enabled: process.env.AI_BRIGHTNESS_GUARD !== 'false',
  minBrightness: Number(process.env.AI_BRIGHTNESS_MIN || 75),
  maxDrop: Number(process.env.AI_BRIGHTNESS_DROP || 15),
};

const TOOL_QUALITY_THRESHOLDS: Partial<Record<ToolId, number>> = {
  'sky-replacement': 9,
  'virtual-twilight': 8,
  'lawn-repair': 8,
  'pool-enhance': 8,
  'window-masking': 7,
  'declutter': 7,
  'virtual-staging': 8,
  'fire-fireplace': 8,
  'tv-screen': 8,
  'object-removal': 8,
  'reflection-removal': 8,
  'power-line-removal': 8,
};

const QUALITY_SENSITIVE_TOOLS = new Set<ToolId>([
  'sky-replacement',
  'virtual-twilight',
  'lawn-repair',
  'declutter',
  'virtual-staging',
  'fire-fireplace',
  'tv-screen',
  'window-masking',
  'object-removal',
  'reflection-removal',
  'power-line-removal',
]);

const DARKNESS_SENSITIVE_TOOLS = new Set<ToolId>([
  'sky-replacement',
  'virtual-twilight',
  'lawn-repair',
  'pool-enhance',
  'window-masking',
  'hdr',
  'auto-enhance',
]);

const RETRYABLE_FLUX_TOOLS = new Set<ToolId>([
  'sky-replacement',
  'virtual-twilight',
  'lawn-repair',
  'declutter',
  'virtual-staging',
  'fire-fireplace',
  'tv-screen',
  'lights-on',
  'pool-enhance',
  'hdr',
  'auto-enhance',
  'perspective-correction',
  'flash-fix',
  'color-balance',
  'power-line-removal',
  'reflection-removal',
  'object-removal',
]);

// ============================================
// MAIN PROCESSOR
// ============================================
export async function processListingBatch(
  strategy: ListingStrategy,
  context: {
    listingId: string;
    userId: string;
    lockedPresets: LockedPresets;
    planTier?: string;
    onProgress?: (progress: ProcessingProgress) => void;
    supabase?: any;
  }
): Promise<PhotoProcessingResult[]> {
  console.log(`[BatchProcessor V3] ═══════════════════════════════════════`);
  console.log(`[BatchProcessor V3] Processing ${strategy.photoStrategies.length} photos`);
  console.log(`[BatchProcessor V3] AutoEnhance configured: ${isAutoEnhanceConfigured()}`);
  console.log(`[BatchProcessor V3] ═══════════════════════════════════════`);
  
  const startTime = Date.now();
  const results: PhotoProcessingResult[] = [];
  const supabase = context.supabase || await createClient();
  
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
        percentComplete: Math.round(
          PROGRESS_RANGE.processingStart +
            (results.length / strategy.totalPhotos) * (PROGRESS_RANGE.processingEnd - PROGRESS_RANGE.processingStart)
        ),
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
  context: { listingId: string; userId: string; lockedPresets: LockedPresets; planTier?: string },
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
      success: true,
      confidence: photo.confidence,
      processingTime: 0,
      needsReview: false,
      skipped: true,
      skipReason: photo.skipReason,
    };
  }
  
  let currentUrl = normalizeUrl(photo.signedUrl);
  const toolsApplied: ToolId[] = [];
  const toolsSkipped: ToolId[] = [];
  const toolResults: PhotoProcessingResult['toolResults'] = {};
  const postProcessing: string[] = [];
  let lastError: string | undefined;
  
  if (photo.tools.length === 0) {
    return {
      photoId: photo.photoId,
      originalUrl: photo.signedUrl,
      enhancedUrl: currentUrl,
      toolsApplied,
      toolsSkipped,
      toolResults,
      postProcessing,
      success: true,
      confidence: photo.confidence,
      processingTime: 0,
      needsReview: false,
      skipped: false,
    };
  }
  
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
        photo.isTwilightTarget,
        context.planTier,
        photo.isHeroCandidate
      );

      const providerUsed = result.providerUsed || config.provider;
      const modelUsed = result.modelUsed;
      
      if (result.success && result.enhancedUrl) {
        let nextUrl = normalizeUrl(result.enhancedUrl);
        let qualityPassed = true;
        let qualityScore = 10;
        let structurePassed = true;
        let structureIssues: string[] = [];

        if (QUALITY_GATE.enabled && QUALITY_SENSITIVE_TOOLS.has(tool)) {
          try {
            const qc = await scoreEnhancementQuality(currentUrl, nextUrl, tool);
            const minScore = TOOL_QUALITY_THRESHOLDS[tool] ?? QUALITY_GATE.minScore;
            qualityPassed = qc.passed && qc.score >= minScore;
            qualityScore = qc.score;
            if (!qualityPassed) {
              console.warn(`[BatchProcessor V3] ⚠ Quality gate failed for ${tool} (score ${qc.score})`);
            }
          } catch (qcError: any) {
            console.warn(`[BatchProcessor V3] ⚠ Quality gate error for ${tool}: ${qcError?.message || qcError}`);
            if (!QUALITY_GATE.failOpen) {
              qualityPassed = false;
            }
          }

          try {
            const structural = await checkStructuralIntegrity(currentUrl, nextUrl, tool);
            structurePassed = structural.passed;
            structureIssues = structural.issues || [];
            if (!structurePassed) {
              console.warn(`[BatchProcessor V3] ⚠ Structure check failed for ${tool}`);
            }
          } catch (structError: any) {
            console.warn(`[BatchProcessor V3] ⚠ Structure check error for ${tool}: ${structError?.message || structError}`);
            if (!QUALITY_GATE.failOpen) {
              structurePassed = false;
              structureIssues = ['Structure check failed to run'];
            }
          }
        }

        if (BRIGHTNESS_GUARD.enabled && DARKNESS_SENSITIVE_TOOLS.has(tool)) {
          try {
            const [origStats, enhancedStats] = await fetchBrightnessStats(currentUrl, nextUrl);
            const minAllowed = Math.max(BRIGHTNESS_GUARD.minBrightness, origStats.brightness - BRIGHTNESS_GUARD.maxDrop);
            if (enhancedStats.brightness < minAllowed) {
              if (tool === 'virtual-twilight') {
                try {
                  const recoveredUrl = await recoverTwilightBrightness(nextUrl);
                  if (recoveredUrl) {
                    const [origStats2, recoveredStats] = await fetchBrightnessStats(currentUrl, recoveredUrl);
                    const recoveredMin = Math.max(BRIGHTNESS_GUARD.minBrightness, origStats2.brightness - BRIGHTNESS_GUARD.maxDrop);
                    if (recoveredStats.brightness >= recoveredMin) {
                      nextUrl = recoveredUrl;
                      if (QUALITY_GATE.enabled && QUALITY_SENSITIVE_TOOLS.has(tool)) {
                        const qcRecovered = await scoreEnhancementQuality(currentUrl, nextUrl, tool);
                        const minScore = TOOL_QUALITY_THRESHOLDS[tool] ?? QUALITY_GATE.minScore;
                        qualityPassed = qcRecovered.passed && qcRecovered.score >= minScore;
                        qualityScore = qcRecovered.score;
                        const structuralRecovered = await checkStructuralIntegrity(currentUrl, nextUrl, tool);
                        structurePassed = structuralRecovered.passed;
                        structureIssues = structuralRecovered.issues || [];
                      }
                      console.warn(`[BatchProcessor V3] ⚠ Brightness recovered for ${tool}`);
                    } else {
                      qualityPassed = false;
                      console.warn(
                        `[BatchProcessor V3] ⚠ Brightness guard failed for ${tool} after recovery (orig ${origStats2.brightness.toFixed(1)} → ${recoveredStats.brightness.toFixed(1)})`
                      );
                    }
                  } else {
                    qualityPassed = false;
                    console.warn(`[BatchProcessor V3] ⚠ Brightness recovery failed for ${tool}`);
                  }
                } catch (recoveryError: any) {
                  qualityPassed = false;
                  console.warn(`[BatchProcessor V3] ⚠ Brightness recovery error for ${tool}: ${recoveryError?.message || recoveryError}`);
                }
              } else {
                qualityPassed = false;
                console.warn(
                  `[BatchProcessor V3] ⚠ Brightness guard failed for ${tool} (orig ${origStats.brightness.toFixed(1)} → ${enhancedStats.brightness.toFixed(1)})`
                );
              }
            }
          } catch (brightnessError: any) {
            console.warn(`[BatchProcessor V3] ⚠ Brightness guard error for ${tool}: ${brightnessError?.message || brightnessError}`);
            if (!QUALITY_GATE.failOpen) {
              qualityPassed = false;
            }
          }
        }

        if ((!qualityPassed || !structurePassed) && RETRYABLE_FLUX_TOOLS.has(tool)) {
          try {
            const retry = await runFluxTool(currentUrl, tool, context.lockedPresets, getLowerGuidanceOptions(tool));
            if (retry.success && retry.enhancedUrl) {
              nextUrl = normalizeUrl(retry.enhancedUrl);
              qualityPassed = true;
              structurePassed = true;

              if (QUALITY_GATE.enabled && QUALITY_SENSITIVE_TOOLS.has(tool)) {
                const qcRetry = await scoreEnhancementQuality(currentUrl, nextUrl, tool);
                const minScore = TOOL_QUALITY_THRESHOLDS[tool] ?? QUALITY_GATE.minScore;
                qualityPassed = qcRetry.passed && qcRetry.score >= minScore;
                qualityScore = qcRetry.score;
                const structuralRetry = await checkStructuralIntegrity(currentUrl, nextUrl, tool);
                structurePassed = structuralRetry.passed;
                structureIssues = structuralRetry.issues || [];
              }
              if (BRIGHTNESS_GUARD.enabled && DARKNESS_SENSITIVE_TOOLS.has(tool)) {
                const [origStats, enhancedStats] = await fetchBrightnessStats(currentUrl, nextUrl);
                const minAllowed = Math.max(BRIGHTNESS_GUARD.minBrightness, origStats.brightness - BRIGHTNESS_GUARD.maxDrop);
                if (enhancedStats.brightness < minAllowed) {
                  qualityPassed = false;
                  console.warn(
                    `[BatchProcessor V3] ⚠ Brightness guard failed after retry for ${tool} (orig ${origStats.brightness.toFixed(1)} → ${enhancedStats.brightness.toFixed(1)})`
                  );
                }
              }
            }
          } catch (retryError: any) {
            console.warn(`[BatchProcessor V3] ⚠ Retry failed for ${tool}: ${retryError?.message || retryError}`);
          }
        }

        if (!qualityPassed || !structurePassed) {
          toolsSkipped.push(tool);
          const issues = !structurePassed && structureIssues.length
            ? `Structure: ${structureIssues.join(', ')}`
            : `Quality gate failed (score ${qualityScore})`;
          toolResults[tool] = {
            success: false,
            provider: providerUsed,
            duration: Date.now() - toolStart,
            model: modelUsed,
            error: issues,
          };
          lastError = issues;
        } else {
          currentUrl = nextUrl;
        toolsApplied.push(tool);
        toolResults[tool] = {
          success: true,
            provider: providerUsed,
          duration: Date.now() - toolStart,
            model: modelUsed,
        };
        console.log(`[BatchProcessor V3] ✓ ${tool} (${config.provider})`);
        }
      } else {
        toolsSkipped.push(tool);
        toolResults[tool] = {
          success: false,
          provider: providerUsed,
          duration: Date.now() - toolStart,
          model: modelUsed,
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

  // Hero finishing: upscale hero shots for premium tiers
  if (success && photo.isHeroCandidate && HERO_UPSCALE.enabled && shouldUpscaleHero(context.planTier)) {
    try {
      const upscaled = await replicate.upscale(currentUrl, { scale: HERO_UPSCALE.scale });
      currentUrl = upscaled;
      postProcessing.push(`upscale-${HERO_UPSCALE.scale}x`);
      console.log(`[BatchProcessor V3] ✓ hero upscale (${HERO_UPSCALE.scale}x)`);
    } catch (error: any) {
      console.warn(`[BatchProcessor V3] ⚠ hero upscale failed: ${error?.message || error}`);
    }
  }
  
  // Save if successful
  let finalUrl = currentUrl;
  if (success && currentUrl !== photo.signedUrl) {
    try {
      let baseBuffer: Buffer | undefined;
      if (BASE_ENHANCE.enabled) {
        try {
          const response = await fetch(currentUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const enhanced = await sharpAutoEnhance(Buffer.from(arrayBuffer), {
              preset: BASE_ENHANCE.preset,
            });
            baseBuffer = enhanced.buffer;
            postProcessing.push('base-normalize');
          }
        } catch (error: any) {
          console.warn(`[BatchProcessor V3] ⚠ base enhance failed: ${error?.message || error}`);
        }
      }

      finalUrl = await saveEnhancedPhoto(
        currentUrl,
        photo.photoId,
        context.listingId,
        context.userId,
        supabase,
        baseBuffer
      );
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
    postProcessing: postProcessing.length ? postProcessing : undefined,
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
  isTwilightTarget: boolean,
  planTier?: string,
  isHeroCandidate?: boolean
): Promise<{ success: boolean; enhancedUrl?: string; error?: string; providerUsed?: Provider; modelUsed?: string }> {
  
  // Special handling for multi-pass twilight
  if (tool === 'virtual-twilight' && isTwilightTarget) {
    try {
      const result = await multiPassTwilight(imageUrl, {
        preset: presets.twilightPreset as any,
        enhanceWindowGlow: true,
        glowIntensity: 'medium',
      });
      return { success: result.success, enhancedUrl: result.url, providerUsed: 'flux-multipass', modelUsed: 'black-forest-labs/flux-kontext-dev' };
    } catch (error: any) {
      // Fallback to single-pass
      console.log('[BatchProcessor V3] Multi-pass failed, trying single-pass');
    }
  }
  
  // Special handling for window masking
  if (tool === 'window-masking') {
    try {
      const result = await balanceWindowExposure(imageUrl, { showOutdoorView: true });
      return { success: result.balanced, enhancedUrl: result.url, providerUsed: 'sam-flux', modelUsed: 'sam2+black-forest-labs/flux-kontext-dev' };
    } catch (error: any) {
      return { success: false, error: error.message, providerUsed: 'sam-flux', modelUsed: 'sam2+black-forest-labs/flux-kontext-dev' };
    }
  }
  
  // Route to provider
  switch (provider) {
    case 'autoenhance':
      if (!isAutoEnhanceConfigured()) {
        console.log('[BatchProcessor V3] AutoEnhance not configured, using FLUX');
        return runFluxTool(imageUrl, tool, presets);
      }
      if (!canUseAutoEnhance(planTier, tool, isHeroCandidate)) {
        console.log('[BatchProcessor V3] AutoEnhance blocked by plan, using FLUX');
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
): Promise<{ success: boolean; enhancedUrl?: string; error?: string; providerUsed?: Provider; modelUsed?: string }> {
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
    return { success: true, enhancedUrl, providerUsed: 'autoenhance', modelUsed: 'autoenhance' };
  } catch (error: any) {
    return { success: false, error: error.message, providerUsed: 'autoenhance', modelUsed: 'autoenhance' };
  }
}

function getLowerGuidanceOptions(tool: ToolId): FluxOptions {
  switch (tool) {
    case 'virtual-twilight':
      return { guidance: 2.8, steps: 24 };
    case 'sky-replacement':
      return { guidance: 2.1, steps: 22 };
    case 'lawn-repair':
      return { guidance: 2.2, steps: 22 };
    case 'declutter':
      return { guidance: 2.4, steps: 22 };
    case 'virtual-staging':
      return { guidance: 2.8, steps: 24 };
    case 'fire-fireplace':
      return { guidance: 1.8, steps: 20 };
    case 'tv-screen':
    case 'lights-on':
      return { guidance: 2.0, steps: 20 };
    default:
      return { guidance: 2.0, steps: 20 };
  }
}

function normalizePlanTier(planTier?: string): string {
  return (planTier || 'free').toLowerCase();
}

function shouldUpscaleHero(planTier?: string): boolean {
  const tier = normalizePlanTier(planTier);
  return tier === 'platinum' || tier === 'team' || tier === 'enterprise';
}

function canUseAutoEnhance(
  planTier: string | undefined,
  tool: ToolId,
  isHeroCandidate?: boolean
): boolean {
  const tier = normalizePlanTier(planTier);

  if (tier === 'platinum' || tier === 'team' || tier === 'enterprise') {
    return tool === 'hdr' || tool === 'auto-enhance' || tool === 'perspective-correction' || tool === 'lens-correction';
  }

  if (tier === 'gold') {
    const allowed = tool === 'hdr' || tool === 'perspective-correction' || tool === 'lens-correction';
    return Boolean(allowed && isHeroCandidate);
  }

  return false;
}

async function runFluxTool(
  imageUrl: string,
  tool: ToolId,
  presets: LockedPresets,
  options?: FluxOptions
): Promise<{ success: boolean; enhancedUrl?: string; error?: string; providerUsed?: Provider; modelUsed?: string }> {
  try {
    let enhancedUrl: string;
    
    // Get preset prompt if available
    const prompt = getPresetPrompt(tool, presets);
    const presetId = getPresetId(tool, presets);

    if (ENFORCE_MASKED_TOOLS && shouldUseInpaint(tool) && !INPAINT.enabled) {
      return {
        success: false,
        error: 'Mask provider not configured for masked tool',
        providerUsed: 'flux-fill',
        modelUsed: INPAINT.provider || 'none',
      };
    }

    if (INPAINT.enabled && shouldUseInpaint(tool)) {
      const inpaintResult = await runInpaintTool(imageUrl, tool, prompt);
      if (inpaintResult?.success && inpaintResult.enhancedUrl) {
        return inpaintResult;
      }
      if (inpaintResult?.error) {
        console.warn(`[BatchProcessor V3] Inpaint fallback: ${inpaintResult.error}`);
        if (INPAINT.requireMask || ENFORCE_MASKED_TOOLS) {
          return { success: false, error: `Mask required: ${inpaintResult.error}`, providerUsed: 'flux-fill', modelUsed: INPAINT.provider };
        }
      }
    }
    
    switch (tool) {
      case 'sky-replacement':
        if (ENFORCE_MASKED_TOOLS) {
          return { success: false, error: 'Mask required: sky replacement skipped', providerUsed: 'flux-fill', modelUsed: INPAINT.provider };
        }
        enhancedUrl = await replicate.skyReplacement(imageUrl, prompt, presetId, options);
        break;
      case 'virtual-twilight':
        enhancedUrl = await replicate.virtualTwilight(imageUrl, prompt, presetId, options);
        break;
      case 'lawn-repair':
        if (ENFORCE_MASKED_TOOLS) {
          return { success: false, error: 'Mask required: lawn repair skipped', providerUsed: 'flux-fill', modelUsed: INPAINT.provider };
        }
        enhancedUrl = await replicate.lawnRepair(imageUrl, prompt, presetId, { ...options, useMask: true, requireMask: true });
        break;
      case 'declutter':
        enhancedUrl = await replicate.declutter(imageUrl, prompt, options);
        break;
      case 'virtual-staging':
        enhancedUrl = await replicate.virtualStaging(imageUrl, prompt, options);
        break;
      case 'fire-fireplace':
        enhancedUrl = await replicate.fireFireplace(imageUrl, undefined, options);
        break;
      case 'tv-screen':
        enhancedUrl = await replicate.tvScreen(imageUrl, undefined, options);
        break;
      case 'lights-on':
        enhancedUrl = await replicate.lightsOn(imageUrl, undefined, options);
        break;
      case 'pool-enhance':
        enhancedUrl = await replicate.poolEnhance(imageUrl, options);
        break;
      case 'hdr':
        enhancedUrl = await replicate.hdr(imageUrl, options);
        break;
      case 'auto-enhance':
        enhancedUrl = await replicate.autoEnhance(imageUrl, options);
        break;
      case 'perspective-correction':
        enhancedUrl = await replicate.perspectiveCorrection(imageUrl, options);
        break;
      case 'flash-fix':
        enhancedUrl = await replicate.flashFix(imageUrl, options);
        break;
      case 'color-balance':
        enhancedUrl = await replicate.colorBalance(imageUrl, undefined, options);
        break;
      case 'power-line-removal':
        enhancedUrl = await replicate.powerLineRemoval(imageUrl, options);
        break;
      case 'reflection-removal':
        enhancedUrl = await replicate.reflectionRemoval(imageUrl, options);
        break;
      case 'object-removal':
        enhancedUrl = await replicate.objectRemoval(imageUrl, undefined, options);
        break;
      default:
        enhancedUrl = await replicate.autoEnhance(imageUrl, options);
    }
    
    return { success: true, enhancedUrl, providerUsed: 'flux-kontext', modelUsed: 'black-forest-labs/flux-kontext-dev' };
  } catch (error: any) {
    return { success: false, error: error.message, providerUsed: 'flux-kontext', modelUsed: 'black-forest-labs/flux-kontext-dev' };
  }
}

function shouldUseInpaint(tool: ToolId): boolean {
  return tool === 'sky-replacement' || tool === 'lawn-repair';
}

function getMaskTypeForTool(tool: ToolId): MaskType | null {
  if (tool === 'sky-replacement') return 'sky';
  if (tool === 'lawn-repair') return 'lawn';
  return null;
}

async function fetchBrightnessStats(originalUrl: string, enhancedUrl: string) {
  const [origResponse, enhancedResponse] = await Promise.all([
    fetch(originalUrl),
    fetch(enhancedUrl),
  ]);
  if (!origResponse.ok || !enhancedResponse.ok) {
    throw new Error('Failed to fetch image data for brightness check');
  }
  const [origBuffer, enhancedBuffer] = await Promise.all([
    origResponse.arrayBuffer(),
    enhancedResponse.arrayBuffer(),
  ]);
  const [origStats, enhancedStats] = await Promise.all([
    analyzeImage(Buffer.from(origBuffer)),
    analyzeImage(Buffer.from(enhancedBuffer)),
  ]);
  return [origStats, enhancedStats] as const;
}

async function runInpaintTool(
  imageUrl: string,
  tool: ToolId,
  prompt?: string
): Promise<{ success: boolean; enhancedUrl?: string; error?: string; providerUsed?: Provider; modelUsed?: string }> {
  const maskType = getMaskTypeForTool(tool);
  if (!maskType) {
    return { success: false, error: 'No inpaint mask strategy available', providerUsed: 'flux-fill', modelUsed: INPAINT.provider };
  }

  const samClient = new SAMMasksClient();
  const maskResult = await samClient.generateMask({ imageUrl, maskType });
  if (!maskResult.success || !maskResult.maskUrl) {
    return { success: false, error: 'Mask generation failed', providerUsed: 'flux-fill', modelUsed: INPAINT.provider };
  }
  if (maskResult.area < INPAINT.minMaskArea) {
    return { success: false, error: 'Mask too small for inpainting', providerUsed: 'flux-fill', modelUsed: INPAINT.provider };
  }

  const inpaintPrompt = prompt || `Refine the ${tool.replace(/-/g, ' ')} region only. Preserve everything else.`;
  const enhancedUrl = await replicate.fluxFillInpaint(imageUrl, maskResult.maskUrl, inpaintPrompt, {
    model: INPAINT.provider,
  });

  return {
    success: true,
    enhancedUrl,
    providerUsed: 'flux-fill',
    modelUsed: INPAINT.provider,
  };
}

async function recoverTwilightBrightness(imageUrl: string): Promise<string | null> {
  try {
    const prompt = 'Slightly brighten the overall exposure (about 10-15%) while preserving the twilight sky colors and window glow. Do NOT change any structures, trees, lawn, or composition.';
    return await replicate.colorBalance(imageUrl, prompt, { guidance: 1.6, steps: 16 });
  } catch (error: any) {
    console.warn('[BatchProcessor V3] Twilight brightness recovery failed:', error?.message || error);
    return null;
  }
}

async function runSDXLTool(
  imageUrl: string,
  tool: ToolId
): Promise<{ success: boolean; enhancedUrl?: string; error?: string; providerUsed?: Provider; modelUsed?: string }> {
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
    
    return { success: true, enhancedUrl, providerUsed: 'sdxl-lightning', modelUsed: 'bytedance/sdxl-lightning-4step' };
  } catch (error: any) {
    return { success: false, error: error.message, providerUsed: 'sdxl-lightning', modelUsed: 'bytedance/sdxl-lightning-4step' };
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

function getPresetId(tool: ToolId, presets: LockedPresets): string | undefined {
  switch (tool) {
    case 'sky-replacement': return presets.skyPreset;
    case 'virtual-twilight': return presets.twilightPreset;
    case 'lawn-repair': return presets.lawnPreset;
    case 'virtual-staging': return presets.stagingStyle;
    case 'declutter': return presets.declutterLevel;
    default: return undefined;
  }
}

async function getSignedUrls(
  strategies: PhotoStrategy[],
  supabase: any
): Promise<(PhotoStrategy & { signedUrl: string })[]> {
  return Promise.all(
    strategies.map(async (strategy) => {
      if (/^https?:\/\//i.test(strategy.photoUrl)) {
        return { ...strategy, signedUrl: strategy.photoUrl };
      }

    const { data } = await supabase.storage
      .from('raw-images')
      .createSignedUrl(strategy.photoUrl, 3600);
    
      return {
      ...strategy, 
        signedUrl: data?.signedUrl || strategy.photoUrl,
      };
    })
  );
}

async function saveEnhancedPhoto(
  enhancedUrl: string,
  photoId: string,
  listingId: string,
  userId: string,
  supabase: any,
  bufferOverride?: Buffer
): Promise<string> {
  let buffer: ArrayBuffer;
  if (bufferOverride) {
    buffer = Uint8Array.from(bufferOverride).buffer;
  } else {
  const response = await fetch(enhancedUrl);
  if (!response.ok) throw new Error('Failed to fetch enhanced image');
    buffer = await response.arrayBuffer();
  }
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

function normalizeUrl(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof (value as any).url === 'function') return (value as any).url();
  return String(value);
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
