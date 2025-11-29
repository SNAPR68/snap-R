import { autoEnhanceClient } from '../providers/autoenhance';
import { runwareClient } from '../providers/runware';
import { replicateUpscale } from '../providers/replicate';

export async function skyReplacement(imageUrl: string, options: any = {}) {
  try {
    const enhancedUrl = await autoEnhanceClient.processImage(imageUrl, { sky_replacement: true, cloud_type: 'LOW_CLOUD' });
    return { success: true, enhancedUrl };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function virtualTwilight(imageUrl: string) {
  try {
    const enhancedUrl = await runwareClient.processImage(imageUrl, 'twilight dusk, deep blue purple sky, golden sunset glow, warm window lights', 0.65);
    return { success: true, enhancedUrl };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function lawnRepair(imageUrl: string) {
  try {
    const enhancedUrl = await runwareClient.processImage(imageUrl, 'lush green healthy grass lawn, manicured kentucky bluegrass', 0.5);
    return { success: true, enhancedUrl };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function hdrEnhance(imageUrl: string) {
  try {
    const enhancedUrl = await autoEnhanceClient.processImage(imageUrl, { enhance: true, vertical_correction: true });
    return { success: true, enhancedUrl };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function perspectiveFix(imageUrl: string) {
  try {
    const enhancedUrl = await autoEnhanceClient.processImage(imageUrl, { vertical_correction: true, lens_correction: true });
    return { success: true, enhancedUrl };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function upscale(imageUrl: string, options: any = {}) {
  try {
    const enhancedUrl = await replicateUpscale(imageUrl, options.scale || 2);
    return { success: true, enhancedUrl };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function declutter(imageUrl: string, options: any = {}) {
  try {
    const enhancedUrl = await runwareClient.processImage(imageUrl, 'clean empty room, no clutter, photorealistic interior', 0.6);
    return { success: true, enhancedUrl };
  } catch (error: any) { return { success: false, error: error.message }; }
}
