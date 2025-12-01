/**
 * SnapR AI Tools
 * 
 * Provider mapping:
 * - AutoEnhance.ai: Sky replacement, HDR, Perspective, Auto-enhance (purpose-built for real estate)
 * - Replicate: Virtual twilight, Lawn repair, Declutter, Virtual staging (FLUX Kontext), Upscale (Real-ESRGAN)
 */

import { autoEnhance } from '../providers/autoenhance';
import { runwareSkyReplacement } from '../providers/runware';
import { 
  upscale as replicateUpscale, 
  virtualTwilight as replicateVirtualTwilight,
  lawnRepair as replicateLawnRepair,
  declutter as replicateDeclutter,
  virtualStaging as replicateVirtualStaging,
} from '../providers/replicate';
import { withRetry } from '../utils/retry';

export interface EnhanceOptions {
  style?: string;
  roomType?: string;
  prompt?: string;
  strength?: number;
  scale?: number;
}

// ============================================
// AutoEnhance.ai Tools (Real Estate Optimized)
// ============================================

/**
 * Sky Replacement - Replace overcast skies with beautiful blue skies
 * Provider: Runware (faster than AutoEnhance, ~30s vs 180s)
 */
export async function skyReplacement(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] Sky Replacement starting via Runware...');
  return withRetry(
    () => runwareSkyReplacement(imageUrl, 'sunny'),
    { maxRetries: 2 }
  );
}

/**
 * HDR Enhancement - Improve dynamic range and exposure
 * Provider: AutoEnhance.ai
 */
export async function hdrEnhance(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] HDR Enhancement starting...');
  return withRetry(
    () => autoEnhance(imageUrl, {
      enhance: true,
    }),
    { maxRetries: 2 }
  );
}

/**
 * Perspective Fix - Correct vertical lines and lens distortion
 * Provider: AutoEnhance.ai
 */
export async function perspectiveFix(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] Perspective Fix starting...');
  return withRetry(
    () => autoEnhance(imageUrl, {
      vertical_correction: true,
      lens_correction: true,
    }),
    { maxRetries: 2 }
  );
}

/**
 * Auto Enhance - General image enhancement
 * Provider: AutoEnhance.ai
 */
export async function autoEnhanceImage(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] Auto Enhance starting...');
  return withRetry(
    () => autoEnhance(imageUrl, {
      enhance: true,
      vertical_correction: true,
      lens_correction: true,
    }),
    { maxRetries: 2 }
  );
}

// ============================================
// Replicate Tools (AI Image Editing)
// ============================================

/**
 * Virtual Twilight - Convert day photos to dusk/twilight
 * Provider: Replicate (FLUX Kontext)
 */
export async function virtualTwilight(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] Virtual Twilight starting...');
  return withRetry(
    () => replicateVirtualTwilight(imageUrl),
    { maxRetries: 2 }
  );
}

/**
 * Lawn Repair - Fix brown/dead grass to green
 * Provider: Replicate (FLUX Kontext)
 */
export async function lawnRepair(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] Lawn Repair starting...');
  return withRetry(
    () => replicateLawnRepair(imageUrl),
    { maxRetries: 2 }
  );
}

/**
 * Declutter - Remove clutter from interior photos
 * Provider: Replicate (FLUX Kontext)
 */
export async function declutter(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] Declutter starting...');
  return withRetry(
    () => replicateDeclutter(imageUrl),
    { maxRetries: 2 }
  );
}

/**
 * Virtual Staging - Add furniture to empty rooms
 * Provider: Replicate (FLUX Kontext)
 */
export async function virtualStagingTool(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] Virtual Staging starting...');
  return withRetry(
    () => replicateVirtualStaging(
      imageUrl,
      options?.roomType || 'living room',
      options?.style || 'modern'
    ),
    { maxRetries: 2 }
  );
}

/**
 * Upscale - Increase image resolution 2x
 * Provider: Replicate (Real-ESRGAN)
 */
export async function upscale(imageUrl: string, options?: EnhanceOptions): Promise<string> {
  console.log('[Tool] Upscale starting...');
  return withRetry(
    () => replicateUpscale(imageUrl, options?.scale ?? 2),
    { maxRetries: 2 }
  );
}

// ============================================
// Tool Registry
// ============================================

export const TOOLS: Record<string, (imageUrl: string, options?: EnhanceOptions) => Promise<string>> = {
  'sky-replacement': skyReplacement,
  'virtual-twilight': virtualTwilight,
  'lawn-repair': lawnRepair,
  'declutter': declutter,
  'hdr': hdrEnhance,
  'perspective-fix': perspectiveFix,
  'upscale': upscale,
  'auto-enhance': autoEnhanceImage,
  'virtual-staging': virtualStagingTool,
};
