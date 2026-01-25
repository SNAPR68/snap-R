/**
 * SnapR V3 - Sharp.js Enhancement Provider
 * =========================================
 * 
 * Replaces AutoEnhance.ai for basic photo enhancement.
 * Cost: FREE (local processing)
 * 
 * What it does:
 * - Brightness correction
 * - Contrast adjustment
 * - Saturation boost
 * - Sharpening
 * - Color temperature
 * 
 * This handles what AutoEnhance was charging $0.29/image for.
 */

import sharp from 'sharp';

// ============================================
// TYPES
// ============================================

export interface EnhancementPreset {
  name: string;
  brightness: number;      // -0.5 to 0.5 (0 = no change)
  contrast: number;        // 0.5 to 2.0 (1 = no change)
  saturation: number;      // 0.5 to 2.0 (1 = no change)
  gamma: number;           // 0.5 to 3.0 (1 = no change, <1 = brighter shadows)
  sharpness: number;       // 0 to 3 (0 = no sharpening)
  warmth: number;          // -0.3 to 0.3 (0 = neutral)
}

export interface ImageStats {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  isInterior: boolean;
  isDark: boolean;
  isOverexposed: boolean;
  needsWarmth: boolean;
}

export interface EnhanceResult {
  buffer: Buffer;
  preset: EnhancementPreset;
  stats: ImageStats;
  processingTimeMs: number;
}

// ============================================
// PRESETS
// ============================================

export const PRESETS: Record<string, EnhancementPreset> = {
  realEstate: {
    name: 'Real Estate Standard',
    brightness: 0.05,
    contrast: 1.1,
    saturation: 1.1,
    gamma: 0.95,
    sharpness: 0.8,
    warmth: 0.05,
  },
  brightAiry: {
    name: 'Bright & Airy',
    brightness: 0.12,
    contrast: 0.95,
    saturation: 0.95,
    gamma: 0.85,
    sharpness: 0.5,
    warmth: 0,
  },
  warmInviting: {
    name: 'Warm & Inviting',
    brightness: 0.05,
    contrast: 1.05,
    saturation: 1.15,
    gamma: 0.9,
    sharpness: 0.8,
    warmth: 0.15,
  },
  exterior: {
    name: 'Exterior',
    brightness: 0.03,
    contrast: 1.15,
    saturation: 1.12,
    gamma: 1.0,
    sharpness: 1.0,
    warmth: 0,
  },
  minimal: {
    name: 'Minimal Touch',
    brightness: 0,
    contrast: 1.02,
    saturation: 1.02,
    gamma: 1.0,
    sharpness: 0.3,
    warmth: 0,
  },
  darkRoom: {
    name: 'Dark Room Fix',
    brightness: 0.15,
    contrast: 1.1,
    saturation: 1.05,
    gamma: 0.75,
    sharpness: 0.6,
    warmth: 0.1,
  },
};

// ============================================
// IMAGE ANALYSIS
// ============================================

export async function analyzeImage(buffer: Buffer): Promise<ImageStats> {
  const { data, info } = await sharp(buffer)
    .resize(256, 256, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = info.width * info.height;
  let rSum = 0, gSum = 0, bSum = 0;
  let rSqSum = 0, gSqSum = 0, bSqSum = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rSum += r; gSum += g; bSum += b;
    rSqSum += r * r; gSqSum += g * g; bSqSum += b * b;
  }

  const rMean = rSum / pixels;
  const gMean = gSum / pixels;
  const bMean = bSum / pixels;

  const brightness = (rMean + gMean + bMean) / 3;
  const rStd = Math.sqrt(rSqSum / pixels - rMean * rMean);
  const gStd = Math.sqrt(gSqSum / pixels - gMean * gMean);
  const bStd = Math.sqrt(bSqSum / pixels - bMean * bMean);
  const contrast = (rStd + gStd + bStd) / 3;

  const maxChannel = Math.max(rMean, gMean, bMean);
  const minChannel = Math.min(rMean, gMean, bMean);
  const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;

  const isInterior = brightness < 140 && contrast < 50;
  const isDark = brightness < 80;
  const isOverexposed = brightness > 220;
  const needsWarmth = bMean > rMean + 10;

  return {
    brightness,
    contrast,
    saturation,
    sharpness: contrast / 3,
    isInterior,
    isDark,
    isOverexposed,
    needsWarmth,
  };
}

// ============================================
// PRESET SELECTION
// ============================================

export function selectPreset(stats: ImageStats): EnhancementPreset {
  if (stats.isDark && stats.isInterior) {
    return PRESETS.darkRoom;
  }
  if (stats.isOverexposed) {
    return PRESETS.minimal;
  }
  if (stats.needsWarmth && stats.isInterior) {
    return PRESETS.warmInviting;
  }
  if (!stats.isInterior && stats.saturation > 0.4) {
    return PRESETS.exterior;
  }
  if (stats.contrast < 40) {
    return PRESETS.realEstate;
  }
  return PRESETS.realEstate;
}

// ============================================
// ENHANCEMENT APPLICATION
// ============================================

export async function applyEnhancement(
  buffer: Buffer,
  preset: EnhancementPreset
): Promise<Buffer> {
  let pipeline = sharp(buffer);

  // Gamma (shadow lift)
  if (preset.gamma !== 1.0) {
    pipeline = pipeline.gamma(preset.gamma);
  }

  // Brightness and saturation
  pipeline = pipeline.modulate({
    brightness: 1 + preset.brightness,
    saturation: preset.saturation,
  });

  // Contrast
  if (preset.contrast !== 1.0) {
    pipeline = pipeline.linear(preset.contrast, 128 * (1 - preset.contrast));
  }

  // Warmth via tint
  if (preset.warmth !== 0) {
    const tintR = preset.warmth > 0 ? Math.min(preset.warmth * 100, 30) : 0;
    const tintB = preset.warmth < 0 ? Math.min(Math.abs(preset.warmth) * 100, 30) : 0;
    pipeline = pipeline.tint({ r: 255 + tintR, g: 255, b: 255 - tintR + tintB });
  }

  // Sharpening
  if (preset.sharpness > 0) {
    pipeline = pipeline.sharpen({
      sigma: preset.sharpness * 0.5,
      m1: preset.sharpness * 0.3,
      m2: preset.sharpness * 0.2,
    });
  }

  return pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Auto-enhance an image with intelligent preset selection
 */
export async function autoEnhance(
  buffer: Buffer,
  options?: { preset?: string; analyzeFirst?: boolean }
): Promise<EnhanceResult> {
  const startTime = Date.now();
  
  const stats = await analyzeImage(buffer);

  let preset: EnhancementPreset;
  if (options?.preset && PRESETS[options.preset]) {
    preset = PRESETS[options.preset];
  } else {
    preset = selectPreset(stats);
  }

  const enhanced = await applyEnhancement(buffer, preset);

  return {
    buffer: enhanced,
    preset,
    stats,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Enhance with a specific preset
 */
export async function enhanceWithPreset(
  buffer: Buffer,
  presetName: string
): Promise<Buffer> {
  const preset = PRESETS[presetName] || PRESETS.realEstate;
  return applyEnhancement(buffer, preset);
}

/**
 * Quick enhance for batch processing
 */
export async function quickEnhance(buffer: Buffer): Promise<Buffer> {
  return applyEnhancement(buffer, PRESETS.realEstate);
}

export default {
  autoEnhance,
  enhanceWithPreset,
  quickEnhance,
  analyzeImage,
  selectPreset,
  applyEnhancement,
  PRESETS,
};
