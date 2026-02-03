/**
 * SnapR AI Enhancement Router
 * ============================
 * 23 tools: 15 original + 4 seasonal + 4 fix
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
        enhancedUrl = await skyReplacement(imageUrl, options.prompt, options.preset);
        break;

      case 'virtual-twilight':
        enhancedUrl = await virtualTwilight(imageUrl, options.prompt, options.preset);
        break;

      case 'lawn-repair':
        enhancedUrl = await lawnRepair(imageUrl, options.prompt, options.preset, {
          useMask: true,
          requireMask: true,
        });
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

      // ========================================
      // SEASONAL TOOLS (4) - NEW - one-click
      // ========================================

      case 'snow-removal':
        enhancedUrl = await snowRemoval(imageUrl);
        break;

      case 'seasonal-spring':
        enhancedUrl = await seasonalSpring(imageUrl);
        break;

      case 'seasonal-summer':
        enhancedUrl = await seasonalSummer(imageUrl);
        break;

      case 'seasonal-fall':
        enhancedUrl = await seasonalFall(imageUrl);
        break;

      // ========================================
      // FIX TOOLS (4) - NEW - one-click
      // ========================================

      case 'reflection-removal':
        enhancedUrl = await reflectionRemoval(imageUrl);
        break;

      case 'power-line-removal':
        enhancedUrl = await powerLineRemoval(imageUrl);
        break;

      case 'object-removal':
        enhancedUrl = await objectRemoval(imageUrl, options.prompt);
        break;

      case 'flash-fix':
        enhancedUrl = await flashFix(imageUrl);
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
