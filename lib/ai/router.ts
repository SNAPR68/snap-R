/**
 * SnapR AI Enhancement Router
 * ============================
 * Exports: processEnhancement, ToolId, TOOL_CREDITS
 */

import {
  skyReplacement,
  virtualTwilight,
  lawnRepair,
  declutter,
  hdr,
  virtualStaging,
  upscale,
} from './providers/replicate';

export type ToolId =
  | 'sky-replacement'
  | 'virtual-twilight'
  | 'lawn-repair'
  | 'declutter'
  | 'hdr'
  | 'virtual-staging'
  | 'upscale'
  | 'auto-enhance';

export const TOOL_CREDITS: Record<ToolId, number> = {
  'sky-replacement': 1,
  'virtual-twilight': 2,
  'lawn-repair': 1,
  'declutter': 2,
  'hdr': 1,
  'virtual-staging': 3,
  'upscale': 2,
  'auto-enhance': 1,
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
    skyType?: 'sunny' | 'sunset' | 'dramatic' | 'cloudy';
    roomType?: string;
    style?: string;
    scale?: number;
    maskUrl?: string;
  } = {},
): Promise<EnhancementResult> {
  const startTime = Date.now();

  console.log('[Router] ===================================');
  console.log('[Router] Tool:', toolId);
  console.log('[Router] ===================================');

  try {
    let enhancedUrl: string;

    switch (toolId) {
      case 'sky-replacement':
        enhancedUrl = await skyReplacement(imageUrl, options.skyType || 'sunny');
        break;

      case 'virtual-twilight':
        enhancedUrl = await virtualTwilight(imageUrl);
        break;

      case 'lawn-repair':
        enhancedUrl = await lawnRepair(imageUrl);
        break;

      case 'declutter':
        enhancedUrl = await declutter(imageUrl);
        break;

      case 'hdr':
        enhancedUrl = await hdr(imageUrl);
        break;

      case 'virtual-staging':
        enhancedUrl = await virtualStaging(
          imageUrl,
          options.roomType || 'living_room',
          options.style || 'modern',
        );
        break;

      case 'upscale':
        enhancedUrl = await upscale(imageUrl, options.scale || 2);
        break;

      case 'auto-enhance':
        enhancedUrl = await hdr(imageUrl);
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

