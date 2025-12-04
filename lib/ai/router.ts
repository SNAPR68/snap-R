/**
 * SnapR AI Enhancement Router
 * ============================
 * 15 tools: 10 with presets, 5 without (one-click)
 */

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
} from './providers/replicate';

export type ToolId =
  // EXTERIOR (4)
  | 'sky-replacement'
  | 'virtual-twilight'
  | 'lawn-repair'
  | 'pool-enhance'
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
  | 'color-balance';

export const TOOL_CREDITS: Record<ToolId, number> = {
  // EXTERIOR
  'sky-replacement': 1,
  'virtual-twilight': 2,
  'lawn-repair': 1,
  'pool-enhance': 1,
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
};

export interface EnhancementResult {
  success: boolean;
  enhancedUrl?: string;
  error?: string;
  provider?: string;
  model?: string;
  duration?: number;
}

export async function processEnhancement(
  toolId: ToolId,
  imageUrl: string,
  options: {
    preset?: string;
    prompt?: string;
  } = {},
): Promise<EnhancementResult> {
  const startTime = Date.now();

  console.log('[Router] ===================================');
  console.log('[Router] Tool:', toolId);
  console.log('[Router] Preset:', options.preset || 'none');
  console.log('[Router] Custom Prompt:', options.prompt ? 'YES' : 'NO');
  console.log('[Router] ===================================');

  try {
    let enhancedUrl: string;

    switch (toolId) {
      // ========================================
      // TOOLS WITH PRESETS (10) - pass prompt
      // ========================================
      
      case 'sky-replacement':
        enhancedUrl = await skyReplacement(imageUrl, options.prompt);
        break;

      case 'virtual-twilight':
        enhancedUrl = await virtualTwilight(imageUrl, options.prompt);
        break;

      case 'lawn-repair':
        enhancedUrl = await lawnRepair(imageUrl, options.prompt);
        break;

      case 'declutter':
        enhancedUrl = await declutter(imageUrl, options.prompt);
        break;

      case 'virtual-staging':
        enhancedUrl = await virtualStaging(imageUrl, options.prompt);
        break;

      case 'fire-fireplace':
        enhancedUrl = await fireFireplace(imageUrl, options.prompt);
        break;

      case 'tv-screen':
        enhancedUrl = await tvScreen(imageUrl, options.prompt);
        break;

      case 'lights-on':
        enhancedUrl = await lightsOn(imageUrl, options.prompt);
        break;

      case 'window-masking':
        enhancedUrl = await windowMasking(imageUrl, options.prompt);
        break;

      case 'color-balance':
        enhancedUrl = await colorBalance(imageUrl, options.prompt);
        break;

      // ========================================
      // TOOLS WITHOUT PRESETS (5) - one-click
      // ========================================

      case 'pool-enhance':
        enhancedUrl = await poolEnhance(imageUrl);
        break;

      case 'hdr':
        enhancedUrl = await hdr(imageUrl);
        break;

      case 'auto-enhance':
        enhancedUrl = await autoEnhance(imageUrl);
        break;

      case 'perspective-correction':
        enhancedUrl = await perspectiveCorrection(imageUrl);
        break;

      case 'lens-correction':
        enhancedUrl = await lensCorrection(imageUrl);
        break;

      default:
        throw new Error(`Unknown tool: ${toolId}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Router] ✅ SUCCESS in ${(duration / 1000).toFixed(1)}s`);

    return {
      success: true,
      enhancedUrl,
      provider: 'replicate',
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Router] ❌ FAILED after ${(duration / 1000).toFixed(1)}s:`, error.message);

    return {
      success: false,
      error: error.message || 'Enhancement failed',
      duration,
    };
  }
}