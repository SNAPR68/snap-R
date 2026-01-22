/**
 * SnapR AI Engine V3 - Strategy Builder
 * ======================================
 * Smart tool selection with strict validation
 */

import { 
  PhotoAnalysis, 
  PhotoStrategy, 
  ListingStrategy,
  LockedPresets,
  Priority,
} from './types';
import { ToolId } from '../router';
import { isExterior, isInterior } from './photo-intelligence';
import { getProviderForTool, estimateProcessingTime, estimateCost } from './provider-router';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  maxTwilightPhotos: 2,
  minTwilightScore: 80,
  minHeroScore: 70,
  minSkyVisiblePercent: 15,
  minLawnVisiblePercent: 20,
  badSkyRatioThreshold: 0.5,
  strategyVersion: '3.0.0',
  
  toolOrder: [
    'perspective-correction', 'lens-correction',
    'declutter', 'object-removal', 'virtual-staging',
    'sky-replacement', 'virtual-twilight', 'lawn-repair',
    'snow-removal', 'seasonal-spring', 'seasonal-summer', 'seasonal-fall',
    'pool-enhance', 'fire-fireplace', 'tv-screen', 'lights-on', 'window-masking',
    'flash-fix', 'reflection-removal', 'power-line-removal',
    'hdr', 'auto-enhance', 'color-balance',
  ] as ToolId[],
};

// ============================================
// PRESET PROMPTS
// ============================================
const SKY_PROMPTS = {
  'clear-blue': 'Replace the sky with a clear blue sky with minimal clouds. Keep everything else exactly the same.',
  'sunset': 'Replace the sky with a warm sunset. Keep everything else exactly the same.',
  'dramatic-clouds': 'Replace the sky with dramatic white clouds against blue sky. Keep everything else exactly the same.',
};

const TWILIGHT_PROMPTS = {
  'blue-hour': 'Transform into blue hour twilight with deep blue sky and warm window glow.',
  'golden-hour': 'Transform into golden hour with warm orange-pink sky and glowing windows.',
  'dusk': 'Transform into early dusk with soft twilight colors.',
  'night': 'Transform into night scene with dark sky and bright window glow.',
};

const STAGING_PROMPTS = {
  'modern': 'Stage with modern furniture - clean lines, neutral colors, minimalist.',
  'traditional': 'Stage with traditional furniture - warm wood, classic style.',
  'luxury': 'Stage with luxury furniture - premium materials, elegant design.',
  'scandinavian': 'Stage with Scandinavian style - light wood, white tones, minimal.',
};

// ============================================
// MAIN ENTRY POINT
// ============================================
export function buildListingStrategy(
  listingId: string,
  analyses: PhotoAnalysis[]
): ListingStrategy {
  console.log(`[StrategyBuilder V3] Building strategy for ${analyses.length} photos`);
  
  // Separate valid and invalid
  const validAnalyses = analyses.filter(a => !a.skipEnhancement);
  const skippedAnalyses = analyses.filter(a => a.skipEnhancement);
  
  if (skippedAnalyses.length > 0) {
    console.log(`[StrategyBuilder V3] Skipping ${skippedAnalyses.length} invalid photos`);
  }
  
  // Make decisions
  const listingDecisions = makeListingDecisions(validAnalyses);
  const lockedPresets = determineLockedPresets(validAnalyses, listingDecisions);
  const heroPhotoId = selectHeroPhoto(validAnalyses);
  const twilightPhotoIds = selectTwilightPhotos(validAnalyses);
  
  // Build strategies
  const photoStrategies = analyses.map(analysis => {
    if (analysis.skipEnhancement) {
      return buildSkipStrategy(analysis);
    }
    return buildPhotoStrategy(analysis, listingDecisions, twilightPhotoIds, lockedPresets);
  });
  
  // Order by priority
  const ordered = orderByPriority(photoStrategies, heroPhotoId);
  
  // Calculate totals
  const validStrategies = ordered.filter(s => !s.skip);
  const allTools = validStrategies.flatMap(s => s.tools);
  
  return {
    listingId,
    heroPhotoId,
    twilightPhotoIds,
    shouldReplaceSky: listingDecisions.shouldReplaceSky,
    shouldEnhanceLawns: listingDecisions.shouldEnhanceLawns,
    photoStrategies: ordered,
    totalPhotos: analyses.length,
    validPhotos: validAnalyses.length,
    skippedPhotos: skippedAnalyses.length,
    photosRequiringWork: validStrategies.filter(s => s.tools.length > 0).length,
    estimatedTotalTime: estimateProcessingTime(allTools),
    estimatedTotalCost: estimateCost(allTools),
    overallConfidence: validAnalyses.length > 0
      ? Math.round(validAnalyses.reduce((sum, a) => sum + a.confidence, 0) / validAnalyses.length)
      : 0,
    createdAt: new Date().toISOString(),
    strategyVersion: CONFIG.strategyVersion,
  };
}

// ============================================
// LISTING DECISIONS
// ============================================
interface ListingDecisions {
  shouldReplaceSky: boolean;
  shouldEnhanceLawns: boolean;
  dominantLighting: 'bright' | 'dark' | 'mixed';
  propertyStyle: 'modern' | 'traditional' | 'luxury' | 'standard';
}

function makeListingDecisions(analyses: PhotoAnalysis[]): ListingDecisions {
  if (analyses.length === 0) {
    return { shouldReplaceSky: false, shouldEnhanceLawns: false, dominantLighting: 'mixed', propertyStyle: 'standard' };
  }
  
  // Sky analysis
  const exteriorsWithSky = analyses.filter(a => 
    isExterior(a.photoType) && a.hasSky && a.skyVisible >= CONFIG.minSkyVisiblePercent
  );
  const badSkyRatio = exteriorsWithSky.length > 0
    ? exteriorsWithSky.filter(a => a.skyQuality === 'blown_out' || a.skyQuality === 'ugly').length / exteriorsWithSky.length
    : 0;
  
  // Lawn analysis
  const exteriorsWithLawn = analyses.filter(a =>
    isExterior(a.photoType) && a.hasLawn && a.lawnVisible >= CONFIG.minLawnVisiblePercent
  );
  const badLawnRatio = exteriorsWithLawn.length > 0
    ? exteriorsWithLawn.filter(a => ['patchy', 'brown', 'dead'].includes(a.lawnQuality)).length / exteriorsWithLawn.length
    : 0;
  
  // Lighting
  const darkCount = analyses.filter(a => a.lighting === 'dark').length;
  const brightCount = analyses.filter(a => a.lighting === 'well_lit').length;
  let dominantLighting: ListingDecisions['dominantLighting'] = 'mixed';
  if (darkCount > analyses.length * 0.6) dominantLighting = 'dark';
  else if (brightCount > analyses.length * 0.6) dominantLighting = 'bright';
  
  // Property style
  const avgHeroScore = analyses.reduce((sum, a) => sum + a.heroScore, 0) / analyses.length;
  let propertyStyle: ListingDecisions['propertyStyle'] = 'standard';
  if (avgHeroScore > 80) propertyStyle = 'luxury';
  else if (avgHeroScore > 65) propertyStyle = 'modern';
  
  return {
    shouldReplaceSky: badSkyRatio >= CONFIG.badSkyRatioThreshold,
    shouldEnhanceLawns: badLawnRatio >= 0.5,
    dominantLighting,
    propertyStyle,
  };
}

// ============================================
// PRESET LOCKING
// ============================================
function determineLockedPresets(analyses: PhotoAnalysis[], decisions: ListingDecisions): LockedPresets {
  const skyPreset = decisions.propertyStyle === 'luxury' ? 'dramatic-clouds' : 'clear-blue';
  const twilightPreset = decisions.propertyStyle === 'luxury' ? 'golden-hour' : 'blue-hour';
  const stagingStyle = decisions.propertyStyle === 'luxury' ? 'luxury' : 'modern';
  
  return {
    skyPreset: skyPreset as LockedPresets['skyPreset'],
    skyPrompt: SKY_PROMPTS[skyPreset],
    twilightPreset: twilightPreset as LockedPresets['twilightPreset'],
    twilightPrompt: TWILIGHT_PROMPTS[twilightPreset],
    lawnPreset: 'lush-green',
    lawnPrompt: 'Transform lawn into healthy green grass. Keep everything else exactly the same.',
    stagingStyle: stagingStyle as LockedPresets['stagingStyle'],
    stagingPrompt: STAGING_PROMPTS[stagingStyle],
    colorTemp: decisions.dominantLighting === 'dark' ? 'warm' : 'neutral',
    declutterLevel: 'moderate',
    declutterPrompt: 'Remove clutter from surfaces. Keep furniture. Do not add anything new.',
  };
}

// ============================================
// HERO SELECTION
// ============================================
function selectHeroPhoto(analyses: PhotoAnalysis[]): string | null {
  // Priority: front exterior > any exterior > highest score
  const frontExteriors = analyses
    .filter(a => a.photoType === 'exterior_front' && a.heroScore >= CONFIG.minHeroScore)
    .sort((a, b) => b.heroScore - a.heroScore);
  if (frontExteriors.length > 0) return frontExteriors[0].photoId;
  
  const exteriors = analyses
    .filter(a => isExterior(a.photoType) && a.heroScore >= 60)
    .sort((a, b) => b.heroScore - a.heroScore);
  if (exteriors.length > 0) return exteriors[0].photoId;
  
  const sorted = [...analyses].sort((a, b) => b.heroScore - a.heroScore);
  return sorted[0]?.photoId || null;
}

// ============================================
// TWILIGHT SELECTION
// ============================================
function selectTwilightPhotos(analyses: PhotoAnalysis[]): string[] {
  return analyses
    .filter(a => 
      isExterior(a.photoType) &&
      a.twilightCandidate &&
      a.twilightScore >= CONFIG.minTwilightScore &&
      a.hasVisibleWindows
    )
    .sort((a, b) => b.twilightScore - a.twilightScore)
    .slice(0, CONFIG.maxTwilightPhotos)
    .map(a => a.photoId);
}

// ============================================
// SKIP STRATEGY
// ============================================
function buildSkipStrategy(analysis: PhotoAnalysis): PhotoStrategy {
  return {
    photoId: analysis.photoId,
    photoUrl: analysis.photoUrl,
    tools: [],
    toolOrder: [],
    priority: 'none',
    confidence: analysis.confidence,
    isHeroCandidate: false,
    isTwilightTarget: false,
    estimatedProcessingTime: 0,
    skip: true,
    skipReason: analysis.skipReason || 'Invalid photo',
  };
}

// ============================================
// PHOTO STRATEGY (with validation)
// ============================================
function buildPhotoStrategy(
  analysis: PhotoAnalysis,
  decisions: ListingDecisions,
  twilightPhotoIds: string[],
  presets: LockedPresets
): PhotoStrategy {
  const isTwilightTarget = twilightPhotoIds.includes(analysis.photoId);
  const tools: ToolId[] = [];
  
  // Validate each GPT suggestion
  for (const tool of analysis.suggestedTools) {
    if (validateToolForPhoto(tool, analysis, isTwilightTarget, decisions)) {
      tools.push(tool);
      console.log(`[Strategy] ${analysis.photoId}: ✓ ${tool}`);
    } else {
      console.log(`[Strategy] ${analysis.photoId}: ✗ ${tool} (validation failed)`);
    }
  }
  
  // Add twilight if selected
  if (isTwilightTarget && !tools.includes('virtual-twilight')) {
    tools.push('virtual-twilight');
    // Remove sky-replacement (twilight handles sky)
    const idx = tools.indexOf('sky-replacement');
    if (idx !== -1) tools.splice(idx, 1);
  }
  
  // Default to auto-enhance if nothing else
  if (tools.length === 0) {
    tools.push('auto-enhance');
  }
  
  const orderedTools = orderTools(tools);
  
  return {
    photoId: analysis.photoId,
    photoUrl: analysis.photoUrl,
    tools: orderedTools,
    toolOrder: orderedTools,
    priority: analysis.priority,
    confidence: analysis.confidence,
    isHeroCandidate: analysis.heroScore >= CONFIG.minHeroScore,
    isTwilightTarget,
    estimatedProcessingTime: estimateProcessingTime(orderedTools),
    skip: false,
  };
}

// ============================================
// TOOL VALIDATION (THE CRITICAL FIX)
// ============================================
function validateToolForPhoto(
  tool: ToolId,
  analysis: PhotoAnalysis,
  isTwilightTarget: boolean,
  decisions: ListingDecisions
): boolean {
  switch (tool) {
    // === SKY ===
    case 'sky-replacement':
      if (!analysis.hasSky || analysis.skyVisible < CONFIG.minSkyVisiblePercent) return false;
      if (isTwilightTarget) return false; // Twilight handles sky
      if (analysis.skyQuality === 'blown_out' || analysis.skyQuality === 'ugly') return true;
      return decisions.shouldReplaceSky; // Consistency override
      
    case 'virtual-twilight':
      return isTwilightTarget; // Only if explicitly selected
      
    // === LAWN ===
    case 'lawn-repair':
      if (!analysis.hasLawn || analysis.lawnVisible < CONFIG.minLawnVisiblePercent) return false;
      return ['patchy', 'brown', 'dead'].includes(analysis.lawnQuality);
      
    // === POOL ===
    case 'pool-enhance':
      return analysis.hasPool && analysis.poolNeedsEnhancement === true;
      
    // === INTERIOR ===
    case 'declutter':
      return ['moderate', 'heavy'].includes(analysis.clutterLevel);
      
    case 'virtual-staging':
      return analysis.roomEmpty === true;
      
    // === FIREPLACE (FIXED) ===
    case 'fire-fireplace':
      return analysis.hasFireplace && analysis.fireplaceNeedsFire === true;
      
    // === TV (CRITICAL FIX) ===
    case 'tv-screen':
      if (!analysis.hasTV) return false;
      if (analysis.tvNeedsReplacement !== true) {
        console.log(`[Validation] TV screen BLOCKED - content is acceptable`);
        return false;
      }
      return true;
      
    // === LIGHTING ===
    case 'lights-on':
      return analysis.lighting === 'dark';
      
    case 'flash-fix':
      return analysis.lighting === 'flash_harsh';
      
    case 'hdr':
      return analysis.needsHDR || analysis.lighting === 'mixed' || analysis.lighting === 'dark';
      
    // === STRUCTURAL ===
    case 'perspective-correction':
      return analysis.verticalAlignment === false;
      
    // === ALWAYS SAFE ===
    case 'auto-enhance':
    case 'color-balance':
      return true;
      
    default:
      return true; // Allow other tools
  }
}

// ============================================
// TOOL ORDERING
// ============================================
function orderTools(tools: ToolId[]): ToolId[] {
  return [...tools].sort((a, b) => {
    const idxA = CONFIG.toolOrder.indexOf(a);
    const idxB = CONFIG.toolOrder.indexOf(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
}

// ============================================
// PRIORITY ORDERING
// ============================================
function orderByPriority(strategies: PhotoStrategy[], heroId: string | null): PhotoStrategy[] {
  const priorityOrder = { critical: 0, recommended: 1, optional: 2, none: 3 };
  
  return [...strategies].sort((a, b) => {
    // Hero first
    if (a.photoId === heroId) return -1;
    if (b.photoId === heroId) return 1;
    
    // Then by priority
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    
    // Then by tool count
    return b.tools.length - a.tools.length;
  });
}

// ============================================
// SUMMARY
// ============================================
export function getStrategySummary(strategy: ListingStrategy): string {
  const lines: string[] = [];
  
  lines.push(`📊 Strategy Summary (V3)`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Total: ${strategy.totalPhotos} | Valid: ${strategy.validPhotos} | Skip: ${strategy.skippedPhotos}`);
  lines.push(`Hero: ${strategy.heroPhotoId || 'None'}`);
  lines.push(`Twilight: ${strategy.twilightPhotoIds.length} photos`);
  lines.push(`Work needed: ${strategy.photosRequiringWork} photos`);
  lines.push(`Est. time: ${Math.round(strategy.estimatedTotalTime / 60)} min`);
  lines.push(`Est. cost: $${strategy.estimatedTotalCost.toFixed(2)}`);
  lines.push(`Confidence: ${strategy.overallConfidence}%`);
  
  // Tool counts
  const toolCounts: Record<string, number> = {};
  strategy.photoStrategies.filter(s => !s.skip).forEach(s => {
    s.tools.forEach(t => { toolCounts[t] = (toolCounts[t] || 0) + 1; });
  });
  
  if (Object.keys(toolCounts).length > 0) {
    lines.push(``);
    lines.push(`🔧 Tools:`);
    Object.entries(toolCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tool, count]) => {
        lines.push(`   ${tool}: ${count}`);
      });
  }
  
  return lines.join('\n');
}
