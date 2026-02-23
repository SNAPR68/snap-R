/**
 * AI Director - On-device Composition Scorer
 * Scores photo composition using rule-of-thirds, horizon, and symmetry heuristics.
 * These are lightweight on-device checks — no ML model needed.
 */

import type { CompositionScore } from '../../types/shared';

interface FrameDimensions {
  width: number;
  height: number;
}

/**
 * Score composition based on device orientation and framing heuristics.
 *
 * @param dims - Frame dimensions
 * @param isLandscape - Whether device is in landscape orientation
 * @param gyroTilt - Tilt angle in degrees from gyroscope (0 = perfectly level)
 */
export function scoreComposition(
  dims: FrameDimensions,
  isLandscape: boolean,
  gyroTilt: number
): CompositionScore {
  const ruleOfThirds = scoreRuleOfThirds(dims, isLandscape);
  const horizonLevel = scoreHorizonLevel(gyroTilt);
  const symmetry = scoreSymmetry(dims, isLandscape);

  const overall = Math.round(
    ruleOfThirds * 0.35 + horizonLevel * 0.40 + symmetry * 0.25
  );

  return { ruleOfThirds, horizonLevel, symmetry, overall };
}

/**
 * Rule of thirds: Landscape orientation is preferred for real estate.
 * Portrait is acceptable for tall buildings and vertical features.
 */
function scoreRuleOfThirds(dims: FrameDimensions, isLandscape: boolean): number {
  const aspectRatio = dims.width / dims.height;

  if (isLandscape) {
    // Ideal aspect ratio for real estate is between 3:2 and 16:9
    if (aspectRatio >= 1.33 && aspectRatio <= 1.78) return 95;
    if (aspectRatio >= 1.2 && aspectRatio <= 2.0) return 80;
    return 65;
  }

  // Portrait mode — acceptable but not ideal for most shots
  if (aspectRatio >= 0.56 && aspectRatio <= 0.75) return 70;
  return 55;
}

/**
 * Horizon level: Penalize tilted photos.
 * Real estate photos must have straight verticals/horizontals.
 *
 * @param tiltDegrees - Absolute tilt angle from level (0 = perfect)
 */
function scoreHorizonLevel(tiltDegrees: number): number {
  const absTilt = Math.abs(tiltDegrees);

  if (absTilt <= 0.5) return 100;
  if (absTilt <= 1.0) return 95;
  if (absTilt <= 2.0) return 85;
  if (absTilt <= 3.0) return 70;
  if (absTilt <= 5.0) return 50;
  if (absTilt <= 8.0) return 30;
  return 10;
}

/**
 * Symmetry heuristic: Landscape mode generally yields better symmetry
 * for interiors (centered hallways, room views).
 */
function scoreSymmetry(_dims: FrameDimensions, isLandscape: boolean): number {
  // Without actual pixel analysis, we give a base score that
  // favors landscape (more natural for room symmetry)
  return isLandscape ? 80 : 65;
}

/**
 * Generate human-readable composition tips based on scores
 */
export function getCompositionTips(score: CompositionScore, isLandscape: boolean): string[] {
  const tips: string[] = [];

  if (score.horizonLevel < 70) {
    tips.push('Level the camera — the photo looks tilted');
  } else if (score.horizonLevel < 85) {
    tips.push('Almost level — tilt slightly to straighten');
  }

  if (!isLandscape) {
    tips.push('Try landscape mode for a wider room view');
  }

  if (score.overall >= 85) {
    tips.push('Great composition!');
  }

  return tips;
}
