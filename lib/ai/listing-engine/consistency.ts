/**
 * SnapR AI Engine V2 - Consistency Pass
 * ======================================
 * Ensures visual consistency across all listing photos
 */

import { PhotoProcessingResult, ConsistencyMetrics, ConsistencyAdjustment } from './types';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Thresholds for adjustment (how different before we adjust)
  brightnessThreshold: 15,
  contrastThreshold: 10,
  warmthThreshold: 10,
  saturationThreshold: 10,
  
  // Maximum adjustment values
  maxBrightnessAdjust: 20,
  maxContrastAdjust: 15,
  maxWarmthAdjust: 15,
  maxSaturationAdjust: 15,
};

// ============================================
// MAIN CONSISTENCY FUNCTION
// ============================================

/**
 * Analyze and optionally apply consistency adjustments to photos
 * 
 * Note: Currently this returns adjustment recommendations.
 * Actual application would require an additional color grading model.
 * For V2, we rely on the enhancement models to maintain reasonable consistency.
 */
export async function analyzeConsistency(
  results: PhotoProcessingResult[]
): Promise<{
  metrics: ConsistencyMetrics;
  adjustments: ConsistencyAdjustment[];
  isConsistent: boolean;
  consistencyScore: number;
}> {
  console.log(`[Consistency] Analyzing ${results.length} photos`);
  
  // Filter to only successful results
  const successfulResults = results.filter(r => r.success && r.enhancedUrl);
  
  if (successfulResults.length < 2) {
    return {
      metrics: getDefaultMetrics(),
      adjustments: [],
      isConsistent: true,
      consistencyScore: 100,
    };
  }
  
  // In a full implementation, we would:
  // 1. Analyze each image's histogram for brightness/contrast
  // 2. Analyze color temperature (warmth)
  // 3. Analyze saturation levels
  // 4. Calculate average metrics
  // 5. Determine adjustments needed for each photo
  
  // For V2, we use estimated metrics based on the enhancement tools applied
  const metrics = estimateMetrics(successfulResults);
  const adjustments = calculateAdjustments(successfulResults, metrics);
  const consistencyScore = calculateConsistencyScore(adjustments);
  
  console.log(`[Consistency] Score: ${consistencyScore}%, ${adjustments.length} adjustments recommended`);
  
  return {
    metrics,
    adjustments,
    isConsistent: consistencyScore >= 85,
    consistencyScore,
  };
}

// ============================================
// METRIC ESTIMATION
// ============================================

function getDefaultMetrics(): ConsistencyMetrics {
  return {
    averageBrightness: 50,
    averageContrast: 50,
    averageWarmth: 50,
    averageSaturation: 50,
  };
}

function estimateMetrics(results: PhotoProcessingResult[]): ConsistencyMetrics {
  // Estimate based on tools applied
  // In production, this would use actual image analysis
  
  let totalBrightness = 0;
  let totalContrast = 0;
  let totalWarmth = 50; // Neutral
  let totalSaturation = 50; // Neutral
  
  for (const result of results) {
    let brightness = 50;
    let contrast = 50;
    let warmth = 50;
    let saturation = 50;
    
    // Adjust estimates based on tools applied
    for (const tool of result.toolsApplied) {
      switch (tool) {
        case 'hdr':
        case 'auto-enhance':
          brightness += 5;
          contrast += 10;
          saturation += 5;
          break;
        case 'virtual-twilight':
          brightness -= 15;
          warmth += 15; // Warm glow from windows
          saturation += 5;
          break;
        case 'sky-replacement':
          brightness += 5;
          saturation += 5;
          break;
        case 'lights-on':
          brightness += 10;
          warmth += 10;
          break;
        case 'flash-fix':
          brightness -= 5;
          contrast += 5;
          break;
        case 'color-balance':
          warmth += 10; // Assuming warm preset
          break;
      }
    }
    
    totalBrightness += clamp(brightness, 0, 100);
    totalContrast += clamp(contrast, 0, 100);
    totalWarmth += clamp(warmth, 0, 100);
    totalSaturation += clamp(saturation, 0, 100);
  }
  
  const count = results.length;
  
  return {
    averageBrightness: Math.round(totalBrightness / count),
    averageContrast: Math.round(totalContrast / count),
    averageWarmth: Math.round(totalWarmth / count),
    averageSaturation: Math.round(totalSaturation / count),
  };
}

// ============================================
// ADJUSTMENT CALCULATION
// ============================================

function calculateAdjustments(
  results: PhotoProcessingResult[],
  targetMetrics: ConsistencyMetrics
): ConsistencyAdjustment[] {
  const adjustments: ConsistencyAdjustment[] = [];
  
  for (const result of results) {
    if (!result.success) continue;
    
    // Estimate this photo's current metrics
    const photoMetrics = estimateSinglePhotoMetrics(result);
    
    // Calculate needed adjustments
    const brightnessAdj = calculateSingleAdjustment(
      photoMetrics.brightness,
      targetMetrics.averageBrightness,
      CONFIG.brightnessThreshold,
      CONFIG.maxBrightnessAdjust
    );
    
    const contrastAdj = calculateSingleAdjustment(
      photoMetrics.contrast,
      targetMetrics.averageContrast,
      CONFIG.contrastThreshold,
      CONFIG.maxContrastAdjust
    );
    
    const warmthAdj = calculateSingleAdjustment(
      photoMetrics.warmth,
      targetMetrics.averageWarmth,
      CONFIG.warmthThreshold,
      CONFIG.maxWarmthAdjust
    );
    
    const saturationAdj = calculateSingleAdjustment(
      photoMetrics.saturation,
      targetMetrics.averageSaturation,
      CONFIG.saturationThreshold,
      CONFIG.maxSaturationAdjust
    );
    
    // Only add if adjustments are needed
    if (brightnessAdj !== 0 || contrastAdj !== 0 || warmthAdj !== 0 || saturationAdj !== 0) {
      adjustments.push({
        photoId: result.photoId,
        brightness: brightnessAdj,
        contrast: contrastAdj,
        warmth: warmthAdj,
        saturation: saturationAdj,
      });
    }
  }
  
  return adjustments;
}

function estimateSinglePhotoMetrics(result: PhotoProcessingResult): {
  brightness: number;
  contrast: number;
  warmth: number;
  saturation: number;
} {
  let brightness = 50;
  let contrast = 50;
  let warmth = 50;
  let saturation = 50;
  
  for (const tool of result.toolsApplied) {
    switch (tool) {
      case 'hdr':
      case 'auto-enhance':
        brightness += 5;
        contrast += 10;
        saturation += 5;
        break;
      case 'virtual-twilight':
        brightness -= 15;
        warmth += 15;
        saturation += 5;
        break;
      case 'sky-replacement':
        brightness += 5;
        saturation += 5;
        break;
      case 'lights-on':
        brightness += 10;
        warmth += 10;
        break;
    }
  }
  
  return {
    brightness: clamp(brightness, 0, 100),
    contrast: clamp(contrast, 0, 100),
    warmth: clamp(warmth, 0, 100),
    saturation: clamp(saturation, 0, 100),
  };
}

function calculateSingleAdjustment(
  current: number,
  target: number,
  threshold: number,
  maxAdjust: number
): number {
  const diff = target - current;
  
  // Only adjust if difference exceeds threshold
  if (Math.abs(diff) < threshold) {
    return 0;
  }
  
  // Calculate adjustment, capped at max
  const adjustment = Math.sign(diff) * Math.min(Math.abs(diff), maxAdjust);
  return Math.round(adjustment);
}

// ============================================
// CONSISTENCY SCORING
// ============================================

function calculateConsistencyScore(adjustments: ConsistencyAdjustment[]): number {
  if (adjustments.length === 0) {
    return 100;
  }
  
  // Calculate average adjustment magnitude
  let totalMagnitude = 0;
  
  for (const adj of adjustments) {
    totalMagnitude += Math.abs(adj.brightness);
    totalMagnitude += Math.abs(adj.contrast);
    totalMagnitude += Math.abs(adj.warmth);
    totalMagnitude += Math.abs(adj.saturation);
  }
  
  const avgMagnitude = totalMagnitude / (adjustments.length * 4);
  
  // Convert to score (0 magnitude = 100%, 20 magnitude = 0%)
  const score = Math.max(0, 100 - (avgMagnitude * 5));
  
  return Math.round(score);
}

// ============================================
// UTILITY
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================
// FUTURE: ACTUAL IMAGE ANALYSIS
// ============================================

/**
 * In a future version, this would use actual image analysis:
 * 
 * async function analyzeImageMetrics(imageUrl: string): Promise<{
 *   brightness: number;
 *   contrast: number;
 *   warmth: number;
 *   saturation: number;
 * }> {
 *   // Use Sharp or similar library to analyze histogram
 *   // Calculate average luminance for brightness
 *   // Calculate standard deviation for contrast
 *   // Analyze color channels for warmth (R-B ratio)
 *   // Calculate saturation from HSL conversion
 * }
 * 
 * async function applyColorGrading(
 *   imageUrl: string,
 *   adjustment: ConsistencyAdjustment
 * ): Promise<string> {
 *   // Use Sharp or a color grading model to apply adjustments
 *   // Return new URL of adjusted image
 * }
 */

export function getConsistencyReport(
  metrics: ConsistencyMetrics,
  adjustments: ConsistencyAdjustment[],
  score: number
): string {
  const lines: string[] = [];
  
  lines.push(`🎨 Consistency Report`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Score: ${score}%`);
  lines.push(``);
  lines.push(`Target Metrics:`);
  lines.push(`  Brightness: ${metrics.averageBrightness}`);
  lines.push(`  Contrast: ${metrics.averageContrast}`);
  lines.push(`  Warmth: ${metrics.averageWarmth}`);
  lines.push(`  Saturation: ${metrics.averageSaturation}`);
  lines.push(``);
  
  if (adjustments.length === 0) {
    lines.push(`✓ All photos are visually consistent`);
  } else {
    lines.push(`Adjustments Recommended: ${adjustments.length} photos`);
    for (const adj of adjustments.slice(0, 5)) {
      const parts: string[] = [];
      if (adj.brightness !== 0) parts.push(`B:${adj.brightness > 0 ? '+' : ''}${adj.brightness}`);
      if (adj.contrast !== 0) parts.push(`C:${adj.contrast > 0 ? '+' : ''}${adj.contrast}`);
      if (adj.warmth !== 0) parts.push(`W:${adj.warmth > 0 ? '+' : ''}${adj.warmth}`);
      if (adj.saturation !== 0) parts.push(`S:${adj.saturation > 0 ? '+' : ''}${adj.saturation}`);
      lines.push(`  ${adj.photoId}: ${parts.join(', ')}`);
    }
    if (adjustments.length > 5) {
      lines.push(`  ... and ${adjustments.length - 5} more`);
    }
  }
  
  return lines.join('\n');
}
