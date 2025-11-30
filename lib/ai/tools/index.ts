import { autoEnhance } from '../providers/autoenhance';
import { runwareEnhance } from '../providers/runware';
import { upscale as replicateUpscale } from '../providers/replicate';
import { virtualStaging, StagingStyle } from './virtual-staging';
import { withRetry } from '../utils/retry';

export interface EnhanceOptions {
  style?: StagingStyle;
  roomType?: string;
  prompt?: string;
  strength?: number;
}

export async function skyReplacement(imageUrl: string): Promise<string> {
  console.log('[Tool] Sky Replacement starting...');
  return withRetry(() => autoEnhance(imageUrl, {
    sky_replacement: true,
    cloud_type: 'CLEAR_SKY',
  }), { maxRetries: 2 });
}

export async function virtualTwilight(imageUrl: string): Promise<string> {
  console.log('[Tool] Virtual Twilight starting...');
  return withRetry(() => runwareEnhance(imageUrl, {
    prompt: 'twilight dusk scene, deep blue purple sky, golden sunset glow on horizon, warm yellow interior lights glowing through windows, professional real estate photography',
    strength: 0.65,
  }), { maxRetries: 2 });
}

export async function lawnRepair(imageUrl: string): Promise<string> {
  console.log('[Tool] Lawn Repair starting...');
  return withRetry(() => runwareEnhance(imageUrl, {
    prompt: 'lush green healthy manicured lawn, vibrant kentucky bluegrass, professional landscaping, no brown patches',
    strength: 0.5,
  }), { maxRetries: 2 });
}

export async function declutter(imageUrl: string): Promise<string> {
  console.log('[Tool] Declutter starting...');
  return withRetry(() => runwareEnhance(imageUrl, {
    prompt: 'clean empty room, no clutter, no personal items, no cords, pristine interior, photorealistic',
    strength: 0.6,
  }), { maxRetries: 2 });
}

export async function hdrEnhance(imageUrl: string): Promise<string> {
  console.log('[Tool] HDR Enhancement starting...');
  return withRetry(() => autoEnhance(imageUrl, {
    enhance: true,
    hdr: true,
  }), { maxRetries: 2 });
}

export async function perspectiveFix(imageUrl: string): Promise<string> {
  console.log('[Tool] Perspective Fix starting...');
  return withRetry(() => autoEnhance(imageUrl, {
    vertical_correction: true,
    lens_correction: true,
  }), { maxRetries: 2 });
}

export async function upscale(imageUrl: string, scale: number = 2): Promise<string> {
  console.log('[Tool] Upscale starting...');
  return withRetry(() => replicateUpscale(imageUrl, scale), { maxRetries: 2 });
}

export async function autoEnhanceImage(imageUrl: string): Promise<string> {
  console.log('[Tool] Auto Enhance starting...');
  return withRetry(() => autoEnhance(imageUrl, {
    enhance: true,
  }), { maxRetries: 2 });
}

export async function virtualStagingTool(imageUrl: string, options: EnhanceOptions = {}): Promise<string> {
  console.log('[Tool] Virtual Staging starting...');
  return withRetry(() => virtualStaging(imageUrl, {
    style: options.style || 'modern',
    roomType: options.roomType || 'living room',
    prompt: options.prompt,
  }), { maxRetries: 2 });
}

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
