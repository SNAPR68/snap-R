/**
 * SnapR AI Enhancement Router
 * ============================
 * 23 tools: 15 original + 4 seasonal + 4 fix
 */

import { logger } from '@/lib/logger';
import {
  skyReplacement,
  virtualTwilight,
  lawnRepair,
  declutter,
  virtualStaging,
  fireFireplace,
  tvScreen,
  lightsOn,
  windowMasking,
  colorBalance,
  poolEnhance,
  hdr,
  perspectiveCorrection,
  lensCorrection,
  autoEnhance,
  // NEW: Seasonal tools
  snowRemoval,
  seasonalSpring,
  seasonalSummer,
  seasonalFall,
  // NEW: Fix tools
  reflectionRemoval,
  powerLineRemoval,
  objectRemoval,
  flashFix,
} from './providers/replicate';

export type ToolId =
  // EXTERIOR (4)
  | 'sky-replacement'
  | 'virtual-twilight'
  | 'lawn-repair'
  | 'pool-enhance'
  // SEASONAL (4) - NEW
  | 'snow-removal'
  | 'seasonal-spring'
  | 'seasonal-summer'
  | 'seasonal-fall'
  // INTERIOR (6)
  | 'declutter'
  | 'virtual-staging'
  | 'fire-fireplace'
  | 'tv-screen'
  | 'lights-on'
  | 'window-masking'
  // ENHANCE (5)
  | 'hdr'
  | 'auto-enhance'
  | 'perspective-correction'
  | 'lens-correction'
  | 'color-balance'
  // FIX (4) - NEW
  | 'reflection-removal'
  | 'power-line-removal'
  | 'object-removal'
  | 'flash-fix';

export const TOOL_CREDITS: Record<ToolId, number> = {
  // EXTERIOR
  'sky-replacement': 1,
  'virtual-twilight': 2,
  'lawn-repair': 1,
  'pool-enhance': 1,
  // SEASONAL - NEW
  'snow-removal': 2,
  'seasonal-spring': 2,
  'seasonal-summer': 2,
  'seasonal-fall': 2,
  // INTERIOR
  'declutter': 2,
  'virtual-staging': 3,
  'fire-fireplace': 1,
  'tv-screen': 1,
  'lights-on': 1,
  'window-masking': 2,
  // ENHANCE
  'hdr': 1,
  'auto-enhance': 1,
  'perspective-correction': 1,
  'lens-correction': 1,
  'color-balance': 1,
  // FIX - NEW
  'reflection-removal': 2,
  'power-line-removal': 2,
  'object-removal': 2,
  'flash-fix': 1,
};

export interface EnhancementResult {
  success: boolean;
  enhancedUrl?: string;
  error?: string;
  provider?: string;
  model?: string;
  duration?: number;
  retryCount?: number;
  timing?: {
    primaryAttemptMs?: number;
    fallbackAttemptMs?: number;
    totalMs: number;
  };
}

// ---------------------------------------------------------------------------
// Tool categories — drives fallback strategy
// ---------------------------------------------------------------------------

type ToolCategory = 'creative' | 'technical' | 'enhance';

const TOOL_CATEGORY: Record<ToolId, ToolCategory> = {
  // Creative tools: support guidance reduction on retry
  'sky-replacement': 'creative',
  'virtual-twilight': 'creative',
  'lawn-repair': 'creative',
  'pool-enhance': 'creative',
  'snow-removal': 'creative',
  'seasonal-spring': 'creative',
  'seasonal-summer': 'creative',
  'seasonal-fall': 'creative',
  'declutter': 'creative',
  'virtual-staging': 'creative',
  'fire-fireplace': 'creative',
  'tv-screen': 'creative',
  'lights-on': 'creative',
  'window-masking': 'creative',
  'color-balance': 'creative',
  'reflection-removal': 'creative',
  'power-line-removal': 'creative',
  'object-removal': 'creative',
  'flash-fix': 'creative',
  // Technical tools: retry once, then fail
  'hdr': 'technical',
  'perspective-correction': 'technical',
  'lens-correction': 'technical',
  // Enhance tools: retry once, then auto-enhance fallback as last resort
  'auto-enhance': 'enhance',
};

// ---------------------------------------------------------------------------
// Transient error detection
// ---------------------------------------------------------------------------

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('429') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('socket hang up') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('gateway')
  );
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff
// ---------------------------------------------------------------------------

const MAX_RETRY_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<{ result: T; attempts: number }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await fn();
      return { result, attempts: attempt };
    } catch (error: unknown) {
      lastError = error;
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (!isTransientError(error) || attempt === MAX_RETRY_ATTEMPTS) {
        logger.error(`[Router] ${label} attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed (non-retryable): ${message}`);
        throw error;
      }

      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      logger.warn(`[Router] ${label} attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed (transient), retrying in ${delayMs}ms: ${message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Should never reach here, but satisfy TypeScript
  throw lastError;
}

// ---------------------------------------------------------------------------
// Execute a single tool call (no retry — that wraps around this)
// ---------------------------------------------------------------------------

function executeTool(
  toolId: ToolId,
  imageUrl: string,
  options: { preset?: string; prompt?: string; guidanceOverride?: number },
): Promise<string> {
  const guidanceOpt = options.guidanceOverride !== undefined
    ? { guidance: options.guidanceOverride }
    : undefined;

  switch (toolId) {
    // ========================================
    // TOOLS WITH PRESETS (10) - pass prompt
    // ========================================

    case 'sky-replacement':
      return skyReplacement(imageUrl, options.prompt, options.preset, guidanceOpt);

    case 'virtual-twilight':
      return virtualTwilight(imageUrl, options.prompt, options.preset, guidanceOpt);

    case 'lawn-repair':
      return lawnRepair(imageUrl, options.prompt, options.preset, {
        useMask: true,
        requireMask: false,
        ...guidanceOpt,
      });

    case 'declutter':
      return declutter(imageUrl, options.prompt, guidanceOpt);

    case 'virtual-staging':
      return virtualStaging(imageUrl, options.prompt, guidanceOpt);

    case 'fire-fireplace':
      return fireFireplace(imageUrl, options.prompt, guidanceOpt);

    case 'tv-screen':
      return tvScreen(imageUrl, options.prompt, guidanceOpt);

    case 'lights-on':
      return lightsOn(imageUrl, options.prompt, guidanceOpt);

    case 'window-masking':
      return windowMasking(imageUrl, options.prompt, guidanceOpt);

    case 'color-balance':
      return colorBalance(imageUrl, options.prompt, guidanceOpt);

    // ========================================
    // TOOLS WITHOUT PRESETS (5) - one-click
    // ========================================

    case 'pool-enhance':
      return poolEnhance(imageUrl, guidanceOpt);

    case 'hdr':
      return hdr(imageUrl, guidanceOpt);

    case 'auto-enhance':
      return autoEnhance(imageUrl, guidanceOpt);

    case 'perspective-correction':
      return perspectiveCorrection(imageUrl, guidanceOpt);

    case 'lens-correction':
      return lensCorrection(imageUrl, guidanceOpt);

    // ========================================
    // SEASONAL TOOLS (4) - one-click
    // ========================================

    case 'snow-removal':
      return snowRemoval(imageUrl);

    case 'seasonal-spring':
      return seasonalSpring(imageUrl);

    case 'seasonal-summer':
      return seasonalSummer(imageUrl);

    case 'seasonal-fall':
      return seasonalFall(imageUrl);

    // ========================================
    // FIX TOOLS (4)
    // ========================================

    case 'reflection-removal':
      return reflectionRemoval(imageUrl, guidanceOpt);

    case 'power-line-removal':
      return powerLineRemoval(imageUrl, guidanceOpt);

    case 'object-removal':
      return objectRemoval(imageUrl, options.prompt, guidanceOpt);

    case 'flash-fix':
      return flashFix(imageUrl, guidanceOpt);

    default:
      throw new Error(`Unknown tool: ${toolId}`);
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function processEnhancement(
  toolId: ToolId,
  imageUrl: string,
  options: {
    preset?: string;
    prompt?: string;
  } = {},
): Promise<EnhancementResult> {
  const startTime = Date.now();
  const category = TOOL_CATEGORY[toolId];

  logger.info('[Router] ===================================');
  logger.info('[Router] Tool:', toolId);
  logger.info('[Router] Category:', category);
  logger.info('[Router] Preset:', options.preset || 'none');
  logger.info('[Router] Custom Prompt:', options.prompt ? 'YES' : 'NO');
  logger.info('[Router] ===================================');

  // ------------------------------------------------------------------
  // Step 1: Primary attempt with exponential backoff on transient errors
  // ------------------------------------------------------------------

  let primaryAttemptMs: number | undefined;

  try {
    const { result: enhancedUrl, attempts } = await retryWithBackoff(
      () => executeTool(toolId, imageUrl, options),
      `${toolId}/primary`,
    );

    const duration = Date.now() - startTime;
    logger.info(`[Router] SUCCESS in ${(duration / 1000).toFixed(1)}s (${attempts} attempt(s))`);

    return {
      success: true,
      enhancedUrl,
      provider: 'replicate',
      model: 'flux-kontext-pro',
      retryCount: attempts - 1,
      duration,
      timing: { primaryAttemptMs: duration, totalMs: duration },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    primaryAttemptMs = Date.now() - startTime;
    logger.error(`[Router] Primary failed after ${(primaryAttemptMs / 1000).toFixed(1)}s:`, message);

    // ------------------------------------------------------------------
    // Step 2: Category-specific fallback
    // ------------------------------------------------------------------

    if (category === 'creative') {
      // Creative tools: retry the SAME tool with reduced guidance (1.5)
      // Lower guidance = more conservative edit = less likely to produce artifacts
      try {
        const REDUCED_GUIDANCE = 1.5;
        logger.warn(`[Router] Creative fallback: retrying ${toolId} with guidance=${REDUCED_GUIDANCE}`);
        const fallbackStart = Date.now();

        const { result: fallbackUrl, attempts } = await retryWithBackoff(
          () => executeTool(toolId, imageUrl, {
            ...options,
            guidanceOverride: REDUCED_GUIDANCE,
          }),
          `${toolId}/creative-fallback`,
        );

        const fallbackMs = Date.now() - fallbackStart;
        const totalMs = Date.now() - startTime;
        logger.info(`[Router] Creative fallback succeeded in ${(fallbackMs / 1000).toFixed(1)}s`);

        return {
          success: true,
          enhancedUrl: fallbackUrl,
          provider: 'replicate',
          model: 'flux-kontext-pro',
          retryCount: (MAX_RETRY_ATTEMPTS) + (attempts - 1), // primary retries + fallback retries
          duration: totalMs,
          timing: { primaryAttemptMs, fallbackAttemptMs: fallbackMs, totalMs },
        };
      } catch (fallbackError: unknown) {
        const fbMsg = fallbackError instanceof Error ? fallbackError.message : 'Fallback failed';
        logger.error(`[Router] Creative fallback also failed:`, fbMsg);
      }
    } else if (category === 'technical') {
      // Technical tools: retry the same tool once more (no guidance change)
      try {
        logger.warn(`[Router] Technical fallback: retrying ${toolId} once`);
        const fallbackStart = Date.now();
        const enhancedUrl = await executeTool(toolId, imageUrl, options);
        const fallbackMs = Date.now() - fallbackStart;
        const totalMs = Date.now() - startTime;

        logger.info(`[Router] Technical retry succeeded in ${(fallbackMs / 1000).toFixed(1)}s`);
        return {
          success: true,
          enhancedUrl,
          provider: 'replicate',
          model: 'flux-kontext-pro',
          retryCount: MAX_RETRY_ATTEMPTS + 1,
          duration: totalMs,
          timing: { primaryAttemptMs, fallbackAttemptMs: fallbackMs, totalMs },
        };
      } catch (retryError: unknown) {
        const retryMsg = retryError instanceof Error ? retryError.message : 'Retry failed';
        logger.error(`[Router] Technical retry also failed:`, retryMsg);
      }
    } else if (category === 'enhance' && toolId !== 'auto-enhance') {
      // Enhance-category tools (not auto-enhance itself): last resort auto-enhance
      try {
        logger.warn(`[Router] Enhance fallback: trying auto-enhance as last resort for ${toolId}`);
        const fallbackStart = Date.now();

        const { result: fallbackUrl, attempts } = await retryWithBackoff(
          () => autoEnhance(imageUrl),
          `${toolId}/auto-enhance-fallback`,
        );

        const fallbackMs = Date.now() - fallbackStart;
        const totalMs = Date.now() - startTime;
        logger.info(`[Router] Auto-enhance fallback succeeded in ${(fallbackMs / 1000).toFixed(1)}s`);

        return {
          success: true,
          enhancedUrl: fallbackUrl,
          provider: 'replicate',
          model: 'flux-kontext-pro/auto-enhance-fallback',
          retryCount: MAX_RETRY_ATTEMPTS + (attempts - 1),
          duration: totalMs,
          timing: { primaryAttemptMs, fallbackAttemptMs: fallbackMs, totalMs },
        };
      } catch (fallbackError: unknown) {
        const fbMsg = fallbackError instanceof Error ? fallbackError.message : 'Auto-enhance fallback failed';
        logger.error(`[Router] Auto-enhance fallback also failed:`, fbMsg);
      }
    }

    // ------------------------------------------------------------------
    // Step 3: All attempts exhausted
    // ------------------------------------------------------------------

    const totalMs = Date.now() - startTime;
    return {
      success: false,
      error: message,
      provider: 'replicate',
      model: 'flux-kontext-pro',
      duration: totalMs,
      timing: { primaryAttemptMs, totalMs },
    };
  }
}
