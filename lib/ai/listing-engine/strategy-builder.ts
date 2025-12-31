/**
 * SnapR AI Engine V2 - Strategy Builder
 * ======================================
 * Decides what enhancements to apply to each photo
 */

import { 
  PhotoAnalysis, 
  PhotoStrategy, 
  ListingStrategy,
  Priority 
} from './types';
import { ToolId } from '../router';
import { isExterior, isInterior } from './photo-intelligence';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Maximum twilight photos per listing
  maxTwilightPhotos: 2,
  
  // Minimum scores for various decisions
  minTwilightScore: 75,
  minHeroScore: 70,
  minSkyVisiblePercent: 15,
  minLawnVisiblePercent: 20,
  
  // Threshold for "most photos have bad sky" decision
  badSkyRatioThreshold: 0.3,
  
  // Tool execution order (dependencies)
  toolOrder: [
    // First: Structural fixes
    'perspective-correction',
    'lens-correction',
    
    // Second: Content changes
    'declutter',
    'virtual-staging',
    'object-removal',
    
    // Third: Environmental changes
    'sky-replacement',
    'virtual-twilight',
    'lawn-repair',
    'snow-removal',
    'seasonal-spring',
    'seasonal-summer', 
    'seasonal-fall',
    'pool-enhance',
    
    // Fourth: Feature additions
    'fire-fireplace',
    'tv-screen',
    'lights-on',
    'window-masking',
    
    // Fifth: Lighting & color
    'flash-fix',
    'reflection-removal',
    'power-line-removal',
    'hdr',
    'auto-enhance',
    'color-balance',
  ] as ToolId[],
  
  // Estimated processing time per tool (seconds)
  toolTimes: {
    'sky-replacement': 25,
    'virtual-twilight': 30,
    'lawn-repair': 25,
    'pool-enhance': 20,
    'declutter': 30,
    'virtual-staging': 35,
    'fire-fireplace': 20,
    'tv-screen': 20,
    'lights-on': 20,
    'window-masking': 20,
    'color-balance': 15,
    'hdr': 15,
    'auto-enhance': 15,
    'perspective-correction': 20,
    'lens-correction': 20,
    'snow-removal': 25,
    'seasonal-spring': 25,
    'seasonal-summer': 25,
    'seasonal-fall': 25,
    'reflection-removal': 20,
    'power-line-removal': 20,
    'object-removal': 25,
    'flash-fix': 15,
  } as Record<ToolId, number>,
};

// ============================================
// MAIN STRATEGY BUILDER
// ============================================

export function buildListingStrategy(
  listingId: string,
  analyses: PhotoAnalysis[]
): ListingStrategy {
  console.log(`[StrategyBuilder] Building strategy for ${analyses.length} photos`);
  
  // Step 1: Make listing-level decisions
  const listingDecisions = makeListingDecisions(analyses);
  
  // Step 2: Select hero photo
  const heroPhotoId = selectHeroPhoto(analyses);
  
  // Step 3: Select twilight photos (max 2)
  const twilightPhotoIds = selectTwilightPhotos(analyses, listingDecisions);
  
  // Step 4: Build individual photo strategies
  const photoStrategies = analyses.map(analysis => 
    buildPhotoStrategy(analysis, listingDecisions, twilightPhotoIds)
  );
  
  // Step 5: Calculate totals
  const photosRequiringWork = photoStrategies.filter(s => s.tools.length > 0).length;
  const estimatedTotalTime = photoStrategies.reduce((sum, s) => sum + s.estimatedProcessingTime, 0);
  const overallConfidence = Math.round(
    analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
  );
  
  const strategy: ListingStrategy = {
    listingId,
    heroPhotoId,
    twilightPhotoIds,
    shouldReplaceSky: listingDecisions.shouldReplaceSky,
    shouldEnhanceLawns: listingDecisions.shouldEnhanceLawns,
    photoStrategies,
    totalPhotos: analyses.length,
    photosRequiringWork,
    estimatedTotalTime,
    overallConfidence,
    createdAt: new Date().toISOString(),
  };
  
  console.log(`[StrategyBuilder] Strategy complete:`, {
    heroPhotoId,
    twilightCount: twilightPhotoIds.length,
    photosRequiringWork,
    estimatedTime: `${Math.round(estimatedTotalTime / 60)}min`,
  });
  
  return strategy;
}

// ============================================
// LISTING-LEVEL DECISIONS
// ============================================

interface ListingDecisions {
  shouldReplaceSky: boolean;
  shouldEnhanceLawns: boolean;
  dominantLighting: 'bright' | 'dark' | 'mixed';
}

function makeListingDecisions(analyses: PhotoAnalysis[]): ListingDecisions {
  // Analyze sky quality across all exteriors
  const exteriorsWithSky = analyses.filter(a => 
    isExterior(a.photoType) && a.hasSky && a.skyVisible >= CONFIG.minSkyVisiblePercent
  );
  
  const badSkyCount = exteriorsWithSky.filter(a => 
    a.skyQuality === 'blown_out' || a.skyQuality === 'ugly'
  ).length;
  
  const badSkyRatio = exteriorsWithSky.length > 0 
    ? badSkyCount / exteriorsWithSky.length 
    : 0;
  
  // If more than 30% have bad sky, replace all exterior skies for consistency
  const shouldReplaceSky = badSkyRatio >= CONFIG.badSkyRatioThreshold;
  
  // Analyze lawn quality
  const exteriorsWithLawn = analyses.filter(a =>
    isExterior(a.photoType) && a.hasLawn && a.lawnVisible >= CONFIG.minLawnVisiblePercent
  );
  
  const badLawnCount = exteriorsWithLawn.filter(a =>
    a.lawnQuality === 'brown' || a.lawnQuality === 'dead' || a.lawnQuality === 'patchy'
  ).length;
  
  const badLawnRatio = exteriorsWithLawn.length > 0
    ? badLawnCount / exteriorsWithLawn.length
    : 0;
  
  const shouldEnhanceLawns = badLawnRatio >= 0.5;
  
  // Analyze dominant lighting
  const darkCount = analyses.filter(a => a.lighting === 'dark').length;
  const brightCount = analyses.filter(a => a.lighting === 'well_lit' || a.lighting === 'overexposed').length;
  
  let dominantLighting: 'bright' | 'dark' | 'mixed' = 'mixed';
  if (darkCount > analyses.length * 0.6) dominantLighting = 'dark';
  else if (brightCount > analyses.length * 0.6) dominantLighting = 'bright';
  
  console.log(`[StrategyBuilder] Listing decisions:`, {
    shouldReplaceSky,
    badSkyRatio: `${Math.round(badSkyRatio * 100)}%`,
    shouldEnhanceLawns,
    dominantLighting,
  });
  
  return { shouldReplaceSky, shouldEnhanceLawns, dominantLighting };
}

// ============================================
// HERO PHOTO SELECTION
// ============================================

function selectHeroPhoto(analyses: PhotoAnalysis[]): string | null {
  // Prefer front exteriors with high hero scores
  const candidates = analyses
    .filter(a => a.photoType === 'exterior_front' && a.heroScore >= CONFIG.minHeroScore)
    .sort((a, b) => b.heroScore - a.heroScore);
  
  if (candidates.length > 0) {
    return candidates[0].photoId;
  }
  
  // Fallback: any exterior with high score
  const exteriorCandidates = analyses
    .filter(a => isExterior(a.photoType) && a.heroScore >= 60)
    .sort((a, b) => b.heroScore - a.heroScore);
  
  if (exteriorCandidates.length > 0) {
    return exteriorCandidates[0].photoId;
  }
  
  // Last resort: highest scored photo
  const sorted = [...analyses].sort((a, b) => b.heroScore - a.heroScore);
  return sorted[0]?.photoId || null;
}

// ============================================
// TWILIGHT SELECTION
// ============================================

function selectTwilightPhotos(
  analyses: PhotoAnalysis[],
  decisions: ListingDecisions
): string[] {
  // Only select twilight candidates from exteriors with windows
  const candidates = analyses
    .filter(a => 
      a.twilightCandidate &&
      a.twilightScore >= CONFIG.minTwilightScore &&
      a.hasVisibleWindows &&
      isExterior(a.photoType)
    )
    .sort((a, b) => b.twilightScore - a.twilightScore)
    .slice(0, CONFIG.maxTwilightPhotos);
  
  return candidates.map(c => c.photoId);
}

// ============================================
// INDIVIDUAL PHOTO STRATEGY
// ============================================

function buildPhotoStrategy(
  analysis: PhotoAnalysis,
  listingDecisions: ListingDecisions,
  twilightPhotoIds: string[]
): PhotoStrategy {
  const tools: ToolId[] = [];
  const isTwilightTarget = twilightPhotoIds.includes(analysis.photoId);
  
  // === STRUCTURAL FIXES (always first) ===
  if (!analysis.verticalAlignment) {
    tools.push('perspective-correction');
  }
  
  // === EXTERIOR LOGIC ===
  if (isExterior(analysis.photoType)) {
    
    // TWILIGHT (if selected for this photo)
    if (isTwilightTarget) {
      tools.push('virtual-twilight');
      // Skip sky replacement if doing twilight (twilight replaces sky)
    } 
    // SKY REPLACEMENT
    else if (analysis.hasSky && analysis.skyVisible >= CONFIG.minSkyVisiblePercent) {
      if (analysis.skyQuality === 'blown_out' || analysis.skyQuality === 'ugly') {
        tools.push('sky-replacement');
      } else if (listingDecisions.shouldReplaceSky && analysis.skyQuality !== 'clear_blue') {
        // Replace for consistency across listing
        tools.push('sky-replacement');
      }
    }
    
    // LAWN REPAIR
    if (analysis.hasLawn && analysis.lawnVisible >= CONFIG.minLawnVisiblePercent) {
      if (analysis.lawnQuality === 'brown' || analysis.lawnQuality === 'dead') {
        tools.push('lawn-repair');
      } else if (analysis.lawnQuality === 'patchy' && listingDecisions.shouldEnhanceLawns) {
        tools.push('lawn-repair');
      }
    }
    
    // POOL
    if (analysis.hasPool) {
      tools.push('pool-enhance');
    }
  }
  
  // === INTERIOR LOGIC ===
  if (isInterior(analysis.photoType)) {
    
    // DECLUTTER
    if (analysis.hasClutter && (analysis.clutterLevel === 'heavy' || analysis.clutterLevel === 'moderate')) {
      tools.push('declutter');
    }
    
    // VIRTUAL STAGING (empty rooms)
    if (analysis.roomEmpty) {
      tools.push('virtual-staging');
    }
    
    // FIREPLACE
    if (analysis.hasFireplace) {
      tools.push('fire-fireplace');
    }
    
    // TV SCREEN
    if (analysis.hasTV) {
      tools.push('tv-screen');
    }
    
    // DARK ROOMS
    if (analysis.lighting === 'dark') {
      tools.push('lights-on');
    }
  }
  
  // === UNIVERSAL ENHANCEMENTS ===
  
  // FLASH FIX
  if (analysis.lighting === 'flash_harsh') {
    tools.push('flash-fix');
  }
  
  // HDR for exposure issues
  if (analysis.needsHDR || analysis.lighting === 'mixed' || analysis.lighting === 'dark') {
    if (!tools.includes('auto-enhance')) {
      tools.push('hdr');
    }
  }
  
  // BASE ENHANCEMENT (if no other enhancement applied)
  if (tools.length === 0 || (!tools.includes('hdr') && !tools.includes('virtual-twilight'))) {
    tools.push('auto-enhance');
  }
  
  // Remove duplicates and order correctly
  const uniqueTools = [...new Set(tools)];
  const orderedTools = orderTools(uniqueTools);
  
  // Calculate processing time
  const estimatedTime = orderedTools.reduce((sum, tool) => 
    sum + (CONFIG.toolTimes[tool] || 20), 0
  );
  
  return {
    photoId: analysis.photoId,
    photoUrl: analysis.photoUrl,
    tools: orderedTools,
    toolOrder: orderedTools,
    priority: analysis.priority,
    confidence: analysis.confidence,
    isHeroCandidate: analysis.heroScore >= CONFIG.minHeroScore,
    isTwilightTarget,
    estimatedProcessingTime: estimatedTime,
  };
}

// ============================================
// TOOL ORDERING
// ============================================

function orderTools(tools: ToolId[]): ToolId[] {
  return tools.sort((a, b) => {
    const indexA = CONFIG.toolOrder.indexOf(a);
    const indexB = CONFIG.toolOrder.indexOf(b);
    
    // Unknown tools go last
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}

// ============================================
// STRATEGY SUMMARY
// ============================================

export function getStrategySummary(strategy: ListingStrategy): string {
  const lines: string[] = [];
  
  lines.push(`📊 Listing Strategy Summary`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Total Photos: ${strategy.totalPhotos}`);
  lines.push(`Photos Requiring Work: ${strategy.photosRequiringWork}`);
  lines.push(`Hero Photo: ${strategy.heroPhotoId || 'None selected'}`);
  lines.push(`Twilight Photos: ${strategy.twilightPhotoIds.length}`);
  lines.push(`Estimated Time: ${Math.round(strategy.estimatedTotalTime / 60)} minutes`);
  lines.push(`Overall Confidence: ${strategy.overallConfidence}%`);
  lines.push(``);
  
  // Tool breakdown
  const toolCounts: Record<string, number> = {};
  strategy.photoStrategies.forEach(ps => {
    ps.tools.forEach(tool => {
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    });
  });
  
  lines.push(`🔧 Tools to Apply:`);
  Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tool, count]) => {
      lines.push(`   ${tool}: ${count} photos`);
    });
  
  return lines.join('\n');
}
