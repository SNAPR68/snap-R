/**
 * SnapR Decision Engine - Types
 * ==============================
 * 
 * NOTE: This is a placeholder. Copy the actual types from:
 * lib/ai/decision-engine/types.ts in your main project.
 * 
 * The V3 strategy builder depends on these types being present.
 */

// Re-export from the actual location in your project
// When integrating, update this to point to your actual types file

export type PhotoRole = 'hero' | 'supporting' | 'utility';

export interface Deficiency {
  severity: number;
  coverage?: number;
}

export interface DeficiencyMap {
  sky?: Deficiency;
  lawn?: Deficiency;
  lighting?: Deficiency;
  clutter?: Deficiency;
  perspective?: Deficiency;
  color?: Deficiency;
  pool?: Deficiency;
}

export type PhotoType = 'exterior' | 'interior' | 'drone' | 'detail';

export type PhotoSubType = 
  | 'front' | 'back' | 'side' | 'aerial'
  | 'kitchen' | 'living' | 'dining' | 'bedroom' | 'bathroom' | 'office'
  | 'garage' | 'laundry' | 'storage' | 'basement' | 'attic'
  | 'pool' | 'patio' | 'balcony' | 'garden' | 'other';

export interface PhotoScores {
  composition: number;
  lighting: number;
  sharpness: number;
}

export interface PhotoAnalysis {
  photoId: string;
  photoUrl: string;
  photoType: PhotoType;
  subType: PhotoSubType;
  scores: PhotoScores;
  deficiencies: DeficiencyMap;
  heroScore: number;
  heroReason?: string;
  hasSky: boolean;
  hasLawn: boolean;
  hasPool: boolean;
  hasFireplace: boolean;
  hasWindows: boolean;
  isEmpty: boolean;
  analysisConfidence: number;
  role?: PhotoRole;
}

export type ToolId = 
  | 'sky-replacement' | 'virtual-twilight' | 'lawn-repair' | 'pool-enhance'
  | 'declutter' | 'virtual-staging' | 'fire-fireplace' | 'tv-screen' | 'lights-on'
  | 'hdr' | 'auto-enhance' | 'perspective-correction' | 'window-masking' | 'flash-fix';

export const AUTO_ELIGIBLE_TOOLS: ToolId[] = [
  'sky-replacement', 'virtual-twilight', 'lawn-repair', 'pool-enhance',
  'declutter', 'virtual-staging', 'fire-fireplace', 'hdr', 'perspective-correction',
];

export const MANUAL_ONLY_TOOLS: ToolId[] = ['tv-screen', 'window-masking'];
export const QC_RETRY_TOOLS: ToolId[] = ['auto-enhance', 'flash-fix'];
export const FALLBACK_TOOLS: ToolId[] = ['lights-on'];

export type DecisionPriority = 'critical' | 'high' | 'medium' | 'low';

export const PRIORITY_WEIGHT: Record<DecisionPriority, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

export function sortByPriority<T extends { priority: DecisionPriority }>(decisions: T[]): T[] {
  return [...decisions].sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
}

export interface EnhancementDecision {
  tool: ToolId;
  preset?: string;
  reason: string;
  priority: DecisionPriority;
}

export interface PhotoStrategy {
  photoId: string;
  photoUrl: string;
  role: PhotoRole;
  decisions: EnhancementDecision[];
  toolOrder: ToolId[];
  confidence: number;
  skipReason?: string;
}

export interface ListingCaps {
  skyReplacement: number;
  lawnRepair: number;
  declutter: number;
  virtualStaging: number;
  twilight: number;
  fireFireplace: number;
  poolEnhance: number;
}

export interface CapsUsage {
  skyReplacement: number;
  lawnRepair: number;
  declutter: number;
  virtualStaging: number;
  twilight: number;
  fireFireplace: number;
  poolEnhance: number;
}

export function calculateCaps(totalPhotos: number, interiorPhotos: number, poolPhotos: number): ListingCaps {
  return {
    skyReplacement: Math.min(3, Math.ceil(totalPhotos * 0.15)),
    lawnRepair: Math.min(4, Math.ceil(totalPhotos * 0.20)),
    declutter: Math.ceil(interiorPhotos * 0.30),
    virtualStaging: 2,
    twilight: 1,
    fireFireplace: 1,
    poolEnhance: Math.min(2, poolPhotos),
  };
}

export function createEmptyCapsUsage(): CapsUsage {
  return { skyReplacement: 0, lawnRepair: 0, declutter: 0, virtualStaging: 0, twilight: 0, fireFireplace: 0, poolEnhance: 0 };
}

export type SkyPreset = 'soft-blue' | 'dramatic-clouds' | 'sunset' | 'clear';
export type TwilightPreset = 'blue-hour' | 'golden-hour' | 'dusk';
export type LawnPreset = 'natural' | 'vibrant' | 'golf-course';
export type HdrPreset = 'light' | 'balanced' | 'dramatic';
export type StagingPreset = 'modern' | 'traditional' | 'minimalist' | 'contemporary';
export type ColorTempPreset = 'warm' | 'neutral' | 'cool';

export interface LockedPresets {
  skyType?: SkyPreset;
  twilightTone?: TwilightPreset;
  lawnGreen?: LawnPreset;
  hdrStrength?: HdrPreset;
  stagingStyle?: StagingPreset;
  colorTemp?: ColorTempPreset;
}

export interface ListingStrategy {
  listingId: string;
  totalPhotos: number;
  heroCount: number;
  supportingCount: number;
  utilityCount: number;
  photoStrategies: PhotoStrategy[];
  lockedPresets: LockedPresets;
  caps: ListingCaps;
  capsUsage: CapsUsage;
  heroPhotoId: string;
  twilightPhotoId: string | null;
  estimatedTime: number;
  estimatedCost: number;
  confidenceScore: number;
}

export const CONFIDENCE_THRESHOLDS = { PREPARED: 85, PREPARED_MINOR: 70, NEEDS_REVIEW: 0 } as const;

export type ListingStatus = 'prepared' | 'needs_review' | 'processing' | 'failed';

export function getListingStatus(confidenceScore: number): ListingStatus {
  return confidenceScore >= CONFIDENCE_THRESHOLDS.PREPARED_MINOR ? 'prepared' : 'needs_review';
}

export interface SafetyOverrides {
  maxEnhancementsPerListing?: number;
  conservativeMode?: boolean;
  disabledTools?: ToolId[];
  costCap?: number;
}

export interface DecisionEngineConfig {
  heroPercentage: number;
  utilityPercentage: number;
  criticalThreshold: number;
  highThreshold: number;
  mediumThreshold: number;
  lowThreshold: number;
  minConfidence: number;
  propertyType: 'residential' | 'luxury' | 'rental' | 'commercial';
  overrides?: SafetyOverrides;
}

export const DEFAULT_CONFIG: DecisionEngineConfig = {
  heroPercentage: 0.15,
  utilityPercentage: 0.20,
  criticalThreshold: 80,
  highThreshold: 60,
  mediumThreshold: 40,
  lowThreshold: 20,
  minConfidence: 0.6,
  propertyType: 'residential',
};

export type ExecutionGroup = 'structural' | 'content' | 'polish';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface ToolMetadata {
  id: ToolId;
  name: string;
  category: 'exterior' | 'interior' | 'enhance';
  estimatedTime: number;
  estimatedCost: number;
  requiresFeature?: string;
  capKey?: keyof ListingCaps;
  autoEligible: boolean;
  executionGroup: ExecutionGroup;
  riskLevel: RiskLevel;
}

export const TOOL_METADATA: Record<ToolId, ToolMetadata> = {
  'sky-replacement': { id: 'sky-replacement', name: 'Sky Replacement', category: 'exterior', estimatedTime: 8, estimatedCost: 0.05, requiresFeature: 'hasSky', capKey: 'skyReplacement', autoEligible: true, executionGroup: 'structural', riskLevel: 'medium' },
  'virtual-twilight': { id: 'virtual-twilight', name: 'Virtual Twilight', category: 'exterior', estimatedTime: 12, estimatedCost: 0.08, capKey: 'twilight', autoEligible: true, executionGroup: 'structural', riskLevel: 'high' },
  'lawn-repair': { id: 'lawn-repair', name: 'Lawn Repair', category: 'exterior', estimatedTime: 6, estimatedCost: 0.05, requiresFeature: 'hasLawn', capKey: 'lawnRepair', autoEligible: true, executionGroup: 'content', riskLevel: 'low' },
  'pool-enhance': { id: 'pool-enhance', name: 'Pool Enhancement', category: 'exterior', estimatedTime: 6, estimatedCost: 0.05, requiresFeature: 'hasPool', capKey: 'poolEnhance', autoEligible: true, executionGroup: 'content', riskLevel: 'low' },
  'declutter': { id: 'declutter', name: 'Declutter', category: 'interior', estimatedTime: 8, estimatedCost: 0.06, capKey: 'declutter', autoEligible: true, executionGroup: 'content', riskLevel: 'medium' },
  'virtual-staging': { id: 'virtual-staging', name: 'Virtual Staging', category: 'interior', estimatedTime: 15, estimatedCost: 0.10, requiresFeature: 'isEmpty', capKey: 'virtualStaging', autoEligible: true, executionGroup: 'structural', riskLevel: 'high' },
  'fire-fireplace': { id: 'fire-fireplace', name: 'Fire in Fireplace', category: 'interior', estimatedTime: 5, estimatedCost: 0.04, requiresFeature: 'hasFireplace', capKey: 'fireFireplace', autoEligible: true, executionGroup: 'content', riskLevel: 'low' },
  'tv-screen': { id: 'tv-screen', name: 'TV Screen Replace', category: 'interior', estimatedTime: 5, estimatedCost: 0.04, autoEligible: false, executionGroup: 'content', riskLevel: 'high' },
  'lights-on': { id: 'lights-on', name: 'Lights On', category: 'interior', estimatedTime: 5, estimatedCost: 0.04, autoEligible: false, executionGroup: 'content', riskLevel: 'medium' },
  'hdr': { id: 'hdr', name: 'HDR Enhancement', category: 'enhance', estimatedTime: 4, estimatedCost: 0.03, autoEligible: true, executionGroup: 'polish', riskLevel: 'low' },
  'auto-enhance': { id: 'auto-enhance', name: 'Auto Enhance', category: 'enhance', estimatedTime: 4, estimatedCost: 0.10, autoEligible: false, executionGroup: 'polish', riskLevel: 'low' },
  'perspective-correction': { id: 'perspective-correction', name: 'Perspective Correction', category: 'enhance', estimatedTime: 5, estimatedCost: 0.04, autoEligible: true, executionGroup: 'polish', riskLevel: 'medium' },
  'window-masking': { id: 'window-masking', name: 'Window Masking', category: 'interior', estimatedTime: 10, estimatedCost: 0.06, requiresFeature: 'hasWindows', autoEligible: false, executionGroup: 'content', riskLevel: 'medium' },
  'flash-fix': { id: 'flash-fix', name: 'Flash Fix', category: 'enhance', estimatedTime: 4, estimatedCost: 0.03, autoEligible: false, executionGroup: 'polish', riskLevel: 'low' },
};

export function getToolCost(toolId: ToolId): number {
  return TOOL_METADATA[toolId]?.estimatedCost ?? 0.05;
}

export function getToolTime(toolId: ToolId): number {
  return TOOL_METADATA[toolId]?.estimatedTime ?? 5;
}

export function calculateToolsCost(tools: ToolId[]): number {
  return tools.reduce((sum, tool) => sum + getToolCost(tool), 0);
}

export function calculateToolsTime(tools: ToolId[]): number {
  return tools.reduce((sum, tool) => sum + getToolTime(tool), 0);
}
