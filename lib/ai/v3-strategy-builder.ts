/**
 * SnapR V3 - Strategy Builder (Decision Engine Implementation)
 * =============================================================
 * 
 * This file implements the Decision Engine specification from:
 * - decision-engine.spec.md
 * - pseudo.md v1.1
 * - types.ts v1.2
 * 
 * CORE PRINCIPLES (from spec):
 * 1. NOT ALL PHOTOS ARE ENHANCED
 * 2. NOT ALL DEFICIENCIES ARE FIXED
 * 3. CONSISTENCY > MAXIMIZATION
 * 4. HERO PHOTOS GET PRIORITY
 * 5. LISTING-LEVEL CAPS APPLY
 * 
 * Status: V3 Implementation
 */

import {
  PhotoRole,
  PhotoType,
  PhotoSubType,
  PhotoAnalysis,
  PhotoStrategy,
  ListingStrategy,
  ListingCaps,
  CapsUsage,
  LockedPresets,
  EnhancementDecision,
  DecisionPriority,
  DecisionEngineConfig,
  DEFAULT_CONFIG,
  ToolId,
  TOOL_METADATA,
  AUTO_ELIGIBLE_TOOLS,
  calculateCaps,
  createEmptyCapsUsage,
  sortByPriority,
  getToolCost,
  getToolTime,
  SkyPreset,
  TwilightPreset,
  LawnPreset,
  StagingPreset,
} from './decision-engine/types';

// ============================================
// CONFIGURATION
// ============================================

const SEVERITY_LABELS = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 40,
  LOW: 20,
} as const;

// Tool execution order (from spec)
const TOOL_EXECUTION_ORDER: ToolId[] = [
  // Structural (first)
  'perspective-correction',
  'virtual-twilight',
  'sky-replacement',
  'virtual-staging',
  
  // Content
  'declutter',
  'lawn-repair',
  'pool-enhance',
  'fire-fireplace',
  
  // Polish (last)
  'hdr',
  'auto-enhance',
  'window-masking',
  'flash-fix',
  'lights-on',
];

// ============================================
// PHASE 1: CLASSIFY PHOTO ROLES
// ============================================

/**
 * Assign roles to photos: hero (15%), supporting (65%), utility (20%)
 */
function classifyPhotoRoles(
  photos: PhotoAnalysis[],
  config: DecisionEngineConfig
): PhotoAnalysis[] {
  console.log(`[V3 Strategy] Phase 1: Classifying ${photos.length} photos`);
  
  const totalPhotos = photos.length;
  const heroCount = Math.ceil(totalPhotos * config.heroPercentage);
  const utilityCount = Math.ceil(totalPhotos * config.utilityPercentage);
  
  // Sort by heroScore DESCENDING
  const sorted = [...photos].sort((a, b) => b.heroScore - a.heroScore);
  
  // Assign roles
  for (let i = 0; i < sorted.length; i++) {
    if (i < heroCount) {
      sorted[i].role = 'hero';
    } else if (i >= totalPhotos - utilityCount) {
      sorted[i].role = 'utility';
    } else {
      sorted[i].role = 'supporting';
    }
  }
  
  const counts = {
    hero: sorted.filter(p => p.role === 'hero').length,
    supporting: sorted.filter(p => p.role === 'supporting').length,
    utility: sorted.filter(p => p.role === 'utility').length,
  };
  
  console.log(`[V3 Strategy] Roles assigned:`, counts);
  
  return sorted;
}

// ============================================
// PHASE 2: CALCULATE CAPS
// ============================================

/**
 * Calculate listing-level caps based on photo count
 */
function calculateListingCaps(photos: PhotoAnalysis[]): ListingCaps {
  const totalPhotos = photos.length;
  const interiorPhotos = photos.filter(p => p.photoType === 'interior').length;
  const poolPhotos = photos.filter(p => p.hasPool).length;
  
  const caps = calculateCaps(totalPhotos, interiorPhotos, poolPhotos);
  
  console.log(`[V3 Strategy] Phase 2: Caps calculated:`, caps);
  
  return caps;
}

// ============================================
// PHASE 3: SELECT HERO & TWILIGHT
// ============================================

/**
 * Select hero photo (highest heroScore)
 * Select twilight photo (highest heroScore EXTERIOR, only 1)
 */
function selectKeyPhotos(
  photos: PhotoAnalysis[]
): { heroPhotoId: string; twilightPhotoId: string | null } {
  // Hero = highest heroScore overall
  const heroPhoto = [...photos].sort((a, b) => b.heroScore - a.heroScore)[0];
  const heroPhotoId = heroPhoto?.photoId || photos[0]?.photoId;
  
  // Twilight = highest heroScore EXTERIOR (only 1)
  const exteriors = photos.filter(p => p.photoType === 'exterior');
  const twilightCandidate = exteriors
    .filter(p => p.hasWindows) // Must have visible windows
    .sort((a, b) => b.heroScore - a.heroScore)[0];
  
  const twilightPhotoId = twilightCandidate?.photoId || null;
  
  console.log(`[V3 Strategy] Phase 3: Hero=${heroPhotoId}, Twilight=${twilightPhotoId}`);
  
  return { heroPhotoId, twilightPhotoId };
}

// ============================================
// PHASE 4: BUILD PHOTO STRATEGIES
// ============================================

/**
 * Apply severity downgrade if confidence is low
 * Per spec: If confidence < 0.6, downgrade severity by one level
 */
function getEffectiveSeverity(
  severity: number,
  confidence: number,
  config: DecisionEngineConfig
): number {
  if (confidence < config.minConfidence) {
    // Downgrade by ~20 points (one level)
    return Math.max(0, severity - 20);
  }
  return severity;
}

/**
 * Check if tool should be applied based on role, severity, and caps
 */
function shouldApplyTool(
  tool: ToolId,
  photo: PhotoAnalysis,
  severity: number,
  coverage: number,
  caps: ListingCaps,
  capsUsage: CapsUsage,
  config: DecisionEngineConfig
): { apply: boolean; reason: string; priority: DecisionPriority } {
  const role = photo.role!;
  const metadata = TOOL_METADATA[tool];
  
  // Check if tool is auto-eligible
  if (!AUTO_ELIGIBLE_TOOLS.includes(tool)) {
    return { apply: false, reason: 'Tool not auto-eligible', priority: 'low' };
  }
  
  // Check required feature
  if (metadata.requiresFeature) {
    const featureKey = metadata.requiresFeature as keyof PhotoAnalysis;
    if (!photo[featureKey]) {
      return { apply: false, reason: `Missing required feature: ${featureKey}`, priority: 'low' };
    }
  }
  
  // Check caps
  if (metadata.capKey) {
    const capKey = metadata.capKey as keyof ListingCaps;
    if (capsUsage[capKey] >= caps[capKey]) {
      return { apply: false, reason: `Cap reached for ${tool}`, priority: 'low' };
    }
  }
  
  // Tool-specific logic from Decision Engine spec
  switch (tool) {
    case 'sky-replacement': {
      // ✅ Apply if: role === 'hero' AND sky.severity >= 60 AND sky.coverage >= 20%
      // ❌ Never apply to: utility photos
      if (role === 'utility') {
        return { apply: false, reason: 'Never apply sky to utility', priority: 'low' };
      }
      if (role === 'hero' && severity >= SEVERITY_LABELS.HIGH && coverage >= 20) {
        return { apply: true, reason: `Hero exterior, sky severity ${severity}, coverage ${coverage}%`, priority: 'critical' };
      }
      if (role === 'supporting' && severity >= SEVERITY_LABELS.CRITICAL) {
        return { apply: true, reason: `Supporting with critical sky (${severity})`, priority: 'high' };
      }
      return { apply: false, reason: `Severity ${severity} below threshold`, priority: 'low' };
    }
    
    case 'lawn-repair': {
      // ✅ Apply if: role !== 'utility' AND lawn.severity >= 40 AND lawn.coverage >= 15%
      if (role === 'utility') {
        return { apply: false, reason: 'Never apply lawn to utility', priority: 'low' };
      }
      if (severity >= SEVERITY_LABELS.MEDIUM && coverage >= 15) {
        const priority: DecisionPriority = role === 'hero' ? 'high' : 'medium';
        return { apply: true, reason: `Lawn severity ${severity}, coverage ${coverage}%`, priority };
      }
      return { apply: false, reason: `Severity ${severity} or coverage ${coverage}% below threshold`, priority: 'low' };
    }
    
    case 'virtual-twilight': {
      // ✅ Apply to: ONE exterior photo ONLY (highest heroScore)
      // This is handled at listing level, not photo level
      // The twilightPhotoId is pre-selected
      return { apply: false, reason: 'Twilight selection handled at listing level', priority: 'low' };
    }
    
    case 'declutter': {
      // ✅ Apply if: role !== 'utility' AND clutter.severity >= 50
      // ❌ Skip personal spaces (bathrooms with toiletries)
      if (role === 'utility') {
        return { apply: false, reason: 'Never declutter utility', priority: 'low' };
      }
      if (photo.subType === 'bathroom') {
        return { apply: false, reason: 'Skip declutter for bathrooms', priority: 'low' };
      }
      if (severity >= 50) {
        const priority: DecisionPriority = role === 'hero' ? 'high' : 'medium';
        return { apply: true, reason: `Clutter severity ${severity}`, priority };
      }
      return { apply: false, reason: `Clutter severity ${severity} below threshold`, priority: 'low' };
    }
    
    case 'virtual-staging': {
      // ✅ Apply if: room is empty AND role === 'hero'
      if (!photo.isEmpty) {
        return { apply: false, reason: 'Room not empty', priority: 'low' };
      }
      if (role !== 'hero') {
        return { apply: false, reason: 'Only stage hero rooms', priority: 'low' };
      }
      return { apply: true, reason: 'Empty hero room - stage it', priority: 'critical' };
    }
    
    case 'fire-fireplace': {
      // ✅ Apply if: hasFireplace === true AND role !== 'utility'
      if (role === 'utility') {
        return { apply: false, reason: 'Never add fire to utility', priority: 'low' };
      }
      if (photo.hasFireplace) {
        return { apply: true, reason: 'Has fireplace', priority: 'low' };
      }
      return { apply: false, reason: 'No fireplace detected', priority: 'low' };
    }
    
    case 'pool-enhance': {
      // Apply to pool photos
      if (!photo.hasPool) {
        return { apply: false, reason: 'No pool detected', priority: 'low' };
      }
      if (severity >= SEVERITY_LABELS.MEDIUM) {
        return { apply: true, reason: `Pool needs enhancement (severity ${severity})`, priority: 'medium' };
      }
      return { apply: false, reason: 'Pool quality acceptable', priority: 'low' };
    }
    
    case 'hdr': {
      // ✅ Apply broadly to supporting and utility (light touch)
      if (photo.scores.lighting < 60) {
        return { apply: true, reason: 'Lighting needs improvement', priority: 'low' };
      }
      return { apply: false, reason: 'Lighting acceptable', priority: 'low' };
    }
    
    case 'perspective-correction': {
      // Apply if perspective issues detected
      if (severity >= SEVERITY_LABELS.MEDIUM) {
        const priority: DecisionPriority = role === 'hero' ? 'high' : 'medium';
        return { apply: true, reason: `Perspective issue severity ${severity}`, priority };
      }
      return { apply: false, reason: 'Perspective acceptable', priority: 'low' };
    }
    
    default:
      return { apply: false, reason: `No rule defined for ${tool}`, priority: 'low' };
  }
}

/**
 * Build strategy for a single photo
 */
function buildPhotoStrategy(
  photo: PhotoAnalysis,
  twilightPhotoId: string | null,
  caps: ListingCaps,
  capsUsage: CapsUsage,
  lockedPresets: LockedPresets,
  config: DecisionEngineConfig
): { strategy: PhotoStrategy; capsUsage: CapsUsage } {
  const decisions: EnhancementDecision[] = [];
  const role = photo.role!;
  
  // Special case: Twilight photo
  if (photo.photoId === twilightPhotoId && capsUsage.twilight < caps.twilight) {
    decisions.push({
      tool: 'virtual-twilight',
      preset: lockedPresets.twilightTone,
      reason: 'Selected as twilight candidate',
      priority: 'critical',
    });
    capsUsage.twilight++;
    
    // Twilight replaces sky, so skip sky replacement
  }
  
  // Check each auto-eligible tool
  const toolsToCheck: Array<{ tool: ToolId; severity: number; coverage: number }> = [];
  
  // Sky replacement
  if (photo.photoType === 'exterior' && photo.hasSky && photo.photoId !== twilightPhotoId) {
    const skySeverity = getEffectiveSeverity(
      photo.deficiencies.sky?.severity ?? 0,
      photo.analysisConfidence,
      config
    );
    const skyCoverage = photo.deficiencies.sky?.coverage ?? 0;
    toolsToCheck.push({ tool: 'sky-replacement', severity: skySeverity, coverage: skyCoverage });
  }
  
  // Lawn repair
  if (photo.photoType === 'exterior' && photo.hasLawn) {
    const lawnSeverity = getEffectiveSeverity(
      photo.deficiencies.lawn?.severity ?? 0,
      photo.analysisConfidence,
      config
    );
    const lawnCoverage = photo.deficiencies.lawn?.coverage ?? 0;
    toolsToCheck.push({ tool: 'lawn-repair', severity: lawnSeverity, coverage: lawnCoverage });
  }
  
  // Pool enhance
  if (photo.hasPool) {
    const poolSeverity = getEffectiveSeverity(
      photo.deficiencies.pool?.severity ?? 0,
      photo.analysisConfidence,
      config
    );
    toolsToCheck.push({ tool: 'pool-enhance', severity: poolSeverity, coverage: 100 });
  }
  
  // Declutter
  if (photo.photoType === 'interior') {
    const clutterSeverity = getEffectiveSeverity(
      photo.deficiencies.clutter?.severity ?? 0,
      photo.analysisConfidence,
      config
    );
    toolsToCheck.push({ tool: 'declutter', severity: clutterSeverity, coverage: 100 });
  }
  
  // Virtual staging
  if (photo.isEmpty) {
    toolsToCheck.push({ tool: 'virtual-staging', severity: 100, coverage: 100 });
  }
  
  // Fireplace
  if (photo.hasFireplace) {
    toolsToCheck.push({ tool: 'fire-fireplace', severity: 50, coverage: 100 });
  }
  
  // Perspective
  const perspectiveSeverity = getEffectiveSeverity(
    photo.deficiencies.perspective?.severity ?? 0,
    photo.analysisConfidence,
    config
  );
  if (perspectiveSeverity > 0) {
    toolsToCheck.push({ tool: 'perspective-correction', severity: perspectiveSeverity, coverage: 100 });
  }
  
  // HDR/Lighting
  const lightingSeverity = getEffectiveSeverity(
    photo.deficiencies.lighting?.severity ?? 0,
    photo.analysisConfidence,
    config
  );
  if (lightingSeverity > 0) {
    toolsToCheck.push({ tool: 'hdr', severity: lightingSeverity, coverage: 100 });
  }
  
  // Evaluate each tool
  for (const { tool, severity, coverage } of toolsToCheck) {
    const result = shouldApplyTool(tool, photo, severity, coverage, caps, capsUsage, config);
    
    if (result.apply) {
      decisions.push({
        tool,
        preset: getPresetForTool(tool, lockedPresets),
        reason: result.reason,
        priority: result.priority,
      });
      
      // Update caps usage
      const metadata = TOOL_METADATA[tool];
      if (metadata.capKey) {
        const capKey = metadata.capKey as keyof CapsUsage;
        capsUsage[capKey]++;
      }
    }
  }
  
  // Sort decisions by priority
  const sortedDecisions = sortByPriority(decisions);
  
  // Generate tool order
  const toolOrder = orderTools(sortedDecisions.map(d => d.tool));
  
  // Calculate confidence
  const confidence = calculateStrategyConfidence(photo, sortedDecisions);
  
  const strategy: PhotoStrategy = {
    photoId: photo.photoId,
    photoUrl: photo.photoUrl,
    role,
    decisions: sortedDecisions,
    toolOrder,
    confidence,
    skipReason: sortedDecisions.length === 0 ? getSkipReason(photo) : undefined,
  };
  
  return { strategy, capsUsage };
}

/**
 * Get preset for a tool based on locked presets
 */
function getPresetForTool(tool: ToolId, presets: LockedPresets): string | undefined {
  switch (tool) {
    case 'sky-replacement': return presets.skyType;
    case 'virtual-twilight': return presets.twilightTone;
    case 'lawn-repair': return presets.lawnGreen;
    case 'virtual-staging': return presets.stagingStyle;
    case 'hdr': return presets.hdrStrength;
    default: return undefined;
  }
}

/**
 * Order tools according to execution order
 */
function orderTools(tools: ToolId[]): ToolId[] {
  return [...tools].sort((a, b) => {
    const indexA = TOOL_EXECUTION_ORDER.indexOf(a);
    const indexB = TOOL_EXECUTION_ORDER.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

/**
 * Calculate confidence for a photo strategy
 */
function calculateStrategyConfidence(
  photo: PhotoAnalysis,
  decisions: EnhancementDecision[]
): number {
  // Start with analysis confidence
  let confidence = photo.analysisConfidence * 100;
  
  // Adjust based on decisions
  if (decisions.length === 0 && photo.role === 'hero') {
    // Hero with no enhancements - might be already perfect or missed issues
    confidence = Math.min(confidence, 85);
  }
  
  // High-risk tools reduce confidence
  const highRiskCount = decisions.filter(d => 
    TOOL_METADATA[d.tool]?.riskLevel === 'high'
  ).length;
  confidence -= highRiskCount * 5;
  
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Get reason why a photo was skipped
 */
function getSkipReason(photo: PhotoAnalysis): string {
  if (photo.role === 'utility') {
    return 'Utility photo - minimal enhancement needed';
  }
  if (photo.scores.composition >= 80 && photo.scores.lighting >= 80) {
    return 'Already high quality - no enhancement needed';
  }
  return 'No applicable enhancements identified';
}

// ============================================
// PHASE 5: DETERMINE LOCKED PRESETS
// ============================================

/**
 * Determine locked presets for consistency across listing
 */
function determineLockedPresets(photos: PhotoAnalysis[]): LockedPresets {
  // Analyze exteriors for sky/twilight presets
  const exteriors = photos.filter(p => p.photoType === 'exterior');
  
  // Sky preset based on existing sky quality
  let skyType: SkyPreset = 'soft-blue';
  const hasDramaticExterior = exteriors.some(p => p.heroScore > 85);
  if (hasDramaticExterior) {
    skyType = 'dramatic-clouds';
  }
  
  // Twilight preset
  const twilightTone: TwilightPreset = 'blue-hour'; // Most universally appealing
  
  // Lawn preset
  const lawnGreen: LawnPreset = 'natural';
  
  // Staging style based on interior analysis
  const stagingStyle: StagingPreset = 'modern';
  
  const presets: LockedPresets = {
    skyType,
    twilightTone,
    lawnGreen,
    hdrStrength: 'balanced',
    stagingStyle,
    colorTemp: 'neutral',
  };
  
  console.log(`[V3 Strategy] Phase 5: Locked presets:`, presets);
  
  return presets;
}

// ============================================
// PHASE 6: CALCULATE ESTIMATES
// ============================================

/**
 * Calculate time and cost estimates
 */
function calculateEstimates(
  photoStrategies: PhotoStrategy[]
): { estimatedTime: number; estimatedCost: number } {
  let totalTime = 0;
  let totalCost = 0;
  
  for (const strategy of photoStrategies) {
    for (const tool of strategy.toolOrder) {
      totalTime += getToolTime(tool);
      totalCost += getToolCost(tool);
    }
  }
  
  return { estimatedTime: totalTime, estimatedCost: totalCost };
}

// ============================================
// PHASE 7: CALCULATE CONFIDENCE SCORE
// ============================================

/**
 * Calculate overall listing confidence score
 */
function calculateListingConfidence(
  photoStrategies: PhotoStrategy[],
  caps: ListingCaps,
  capsUsage: CapsUsage
): number {
  // Weight: 40% photo strategies, 30% hero coverage, 30% cap utilization
  
  // Average photo confidence
  const avgPhotoConfidence = photoStrategies.reduce((sum, s) => sum + s.confidence, 0) / 
    photoStrategies.length;
  
  // Hero coverage (were heroes enhanced?)
  const heroStrategies = photoStrategies.filter(s => s.role === 'hero');
  const heroesEnhanced = heroStrategies.filter(s => s.decisions.length > 0).length;
  const heroCoverage = heroStrategies.length > 0 
    ? (heroesEnhanced / heroStrategies.length) * 100 
    : 100;
  
  // Cap utilization (did we use available budget?)
  const totalCap = Object.values(caps).reduce((sum, v) => sum + v, 0);
  const totalUsed = Object.values(capsUsage).reduce((sum, v) => sum + v, 0);
  const capUtilization = totalCap > 0 ? Math.min((totalUsed / totalCap) * 150, 100) : 100;
  
  const score = (avgPhotoConfidence * 0.4) + (heroCoverage * 0.3) + (capUtilization * 0.3);
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Build a complete listing strategy
 * 
 * This is the main entry point that implements the Decision Engine spec.
 */
export function buildListingStrategy(
  listingId: string,
  photoAnalyses: PhotoAnalysis[],
  config: DecisionEngineConfig = DEFAULT_CONFIG
): ListingStrategy {
  console.log(`\n[V3 Strategy] ========================================`);
  console.log(`[V3 Strategy] Building strategy for listing: ${listingId}`);
  console.log(`[V3 Strategy] Photos: ${photoAnalyses.length}`);
  console.log(`[V3 Strategy] ========================================\n`);
  
  // PHASE 1: Classify photo roles
  const classifiedPhotos = classifyPhotoRoles(photoAnalyses, config);
  
  // PHASE 2: Calculate caps
  const caps = calculateListingCaps(classifiedPhotos);
  let capsUsage = createEmptyCapsUsage();
  
  // PHASE 3: Select hero and twilight
  const { heroPhotoId, twilightPhotoId } = selectKeyPhotos(classifiedPhotos);
  
  // PHASE 5: Determine locked presets (before phase 4)
  const lockedPresets = determineLockedPresets(classifiedPhotos);
  
  // PHASE 4: Build photo strategies
  const photoStrategies: PhotoStrategy[] = [];
  
  // Process hero photos first (priority)
  const sortedByRole = [...classifiedPhotos].sort((a, b) => {
    const roleOrder = { hero: 0, supporting: 1, utility: 2 };
    return roleOrder[a.role!] - roleOrder[b.role!];
  });
  
  for (const photo of sortedByRole) {
    const result = buildPhotoStrategy(
      photo,
      twilightPhotoId,
      caps,
      capsUsage,
      lockedPresets,
      config
    );
    photoStrategies.push(result.strategy);
    capsUsage = result.capsUsage;
  }
  
  // PHASE 6: Calculate estimates
  const { estimatedTime, estimatedCost } = calculateEstimates(photoStrategies);
  
  // PHASE 7: Calculate confidence
  const confidenceScore = calculateListingConfidence(photoStrategies, caps, capsUsage);
  
  // Build final strategy
  const strategy: ListingStrategy = {
    listingId,
    totalPhotos: photoAnalyses.length,
    heroCount: classifiedPhotos.filter(p => p.role === 'hero').length,
    supportingCount: classifiedPhotos.filter(p => p.role === 'supporting').length,
    utilityCount: classifiedPhotos.filter(p => p.role === 'utility').length,
    photoStrategies,
    lockedPresets,
    caps,
    capsUsage,
    heroPhotoId,
    twilightPhotoId,
    estimatedTime,
    estimatedCost,
    confidenceScore,
  };
  
  // Log summary
  console.log(`\n[V3 Strategy] ========================================`);
  console.log(`[V3 Strategy] Strategy Complete:`);
  console.log(`[V3 Strategy]   Hero: ${strategy.heroCount}, Supporting: ${strategy.supportingCount}, Utility: ${strategy.utilityCount}`);
  console.log(`[V3 Strategy]   Photos with enhancements: ${photoStrategies.filter(s => s.decisions.length > 0).length}`);
  console.log(`[V3 Strategy]   Estimated time: ${Math.round(estimatedTime / 60)} minutes`);
  console.log(`[V3 Strategy]   Estimated cost: $${estimatedCost.toFixed(2)}`);
  console.log(`[V3 Strategy]   Confidence: ${confidenceScore}%`);
  console.log(`[V3 Strategy] ========================================\n`);
  
  return strategy;
}

// ============================================
// STRATEGY SUMMARY (for display)
// ============================================

export function getStrategySummary(strategy: ListingStrategy): string {
  const lines: string[] = [];
  
  lines.push(`📊 V3 Strategy Summary`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Total Photos: ${strategy.totalPhotos}`);
  lines.push(`  - Hero: ${strategy.heroCount}`);
  lines.push(`  - Supporting: ${strategy.supportingCount}`);
  lines.push(`  - Utility: ${strategy.utilityCount}`);
  lines.push(``);
  lines.push(`Photos Requiring Work: ${strategy.photoStrategies.filter(s => s.decisions.length > 0).length}`);
  lines.push(`Photos Skipped: ${strategy.photoStrategies.filter(s => s.decisions.length === 0).length}`);
  lines.push(``);
  lines.push(`Hero Photo: ${strategy.heroPhotoId}`);
  lines.push(`Twilight Photo: ${strategy.twilightPhotoId || 'None'}`);
  lines.push(``);
  lines.push(`Estimated Time: ${Math.round(strategy.estimatedTime / 60)} minutes`);
  lines.push(`Estimated Cost: $${strategy.estimatedCost.toFixed(2)}`);
  lines.push(`Confidence: ${strategy.confidenceScore}%`);
  lines.push(``);
  
  // Caps usage
  lines.push(`📉 Caps Usage:`);
  const capsKeys = Object.keys(strategy.caps) as (keyof ListingCaps)[];
  for (const key of capsKeys) {
    lines.push(`   ${key}: ${strategy.capsUsage[key]}/${strategy.caps[key]}`);
  }
  lines.push(``);
  
  // Tool breakdown
  const toolCounts: Record<string, number> = {};
  strategy.photoStrategies.forEach(ps => {
    ps.toolOrder.forEach(tool => {
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

// ============================================
// EXPORTS
// ============================================

export default {
  buildListingStrategy,
  getStrategySummary,
};
