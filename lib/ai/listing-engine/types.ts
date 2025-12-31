/**
 * SnapR AI Engine V2 - Type Definitions
 * =====================================
 * Core types for the listing-level AI engine
 */

import { ToolId } from '../router';

// ============================================
// PHOTO ANALYSIS TYPES
// ============================================

export type PhotoType =
  | 'exterior_front'
  | 'exterior_back'
  | 'exterior_side'
  | 'interior_living'
  | 'interior_kitchen'
  | 'interior_bedroom'
  | 'interior_bathroom'
  | 'interior_dining'
  | 'interior_office'
  | 'interior_other'
  | 'drone'
  | 'detail'
  | 'unknown';

export type SkyQuality = 'clear_blue' | 'overcast' | 'blown_out' | 'ugly' | 'good' | 'none';

export type LawnQuality = 'lush_green' | 'patchy' | 'brown' | 'dead' | 'none';

export type LightingQuality = 'well_lit' | 'dark' | 'overexposed' | 'mixed' | 'flash_harsh';

export type ClutterLevel = 'none' | 'light' | 'moderate' | 'heavy';

export type CompositionQuality = 'excellent' | 'good' | 'average' | 'poor';

export type SharpnessQuality = 'sharp' | 'acceptable' | 'soft' | 'blurry';

export type Priority = 'critical' | 'recommended' | 'optional' | 'none';

export interface PhotoAnalysis {
  photoId: string;
  photoUrl: string;
  
  // Classification
  photoType: PhotoType;
  
  // Sky Analysis (exteriors)
  hasSky: boolean;
  skyVisible: number; // 0-100 percentage
  skyQuality: SkyQuality;
  
  // Twilight Candidacy (exteriors)
  twilightCandidate: boolean;
  twilightScore: number; // 0-100
  hasVisibleWindows: boolean;
  
  // Lawn Analysis (exteriors)
  hasLawn: boolean;
  lawnVisible: number; // 0-100 percentage
  lawnQuality: LawnQuality;
  
  // Lighting Analysis (all)
  lighting: LightingQuality;
  needsHDR: boolean;
  
  // Interior Specific
  hasClutter: boolean;
  clutterLevel: ClutterLevel;
  roomEmpty: boolean;
  hasFireplace: boolean;
  hasPool: boolean;
  hasTV: boolean;
  
  // Quality Metrics
  composition: CompositionQuality;
  sharpness: SharpnessQuality;
  verticalAlignment: boolean;
  
  // Hero Candidacy
  heroScore: number; // 0-100
  heroReason: string;
  
  // Recommendations
  suggestedTools: ToolId[];
  priority: Priority;
  confidence: number; // 0-100
  
  // Metadata
  analyzedAt: string;
  analysisVersion: string;
}

// ============================================
// STRATEGY TYPES
// ============================================

export interface PhotoStrategy {
  photoId: string;
  photoUrl: string;
  tools: ToolId[];
  toolOrder: ToolId[]; // Ordered execution sequence
  priority: Priority;
  confidence: number;
  isHeroCandidate: boolean;
  isTwilightTarget: boolean;
  estimatedProcessingTime: number; // seconds
}

export interface ListingStrategy {
  listingId: string;
  heroPhotoId: string | null;
  twilightPhotoIds: string[];
  shouldReplaceSky: boolean;
  shouldEnhanceLawns: boolean;
  photoStrategies: PhotoStrategy[];
  totalPhotos: number;
  photosRequiringWork: number;
  estimatedTotalTime: number; // seconds
  overallConfidence: number; // 0-100
  createdAt: string;
}

// ============================================
// PROCESSING TYPES
// ============================================

export type ProcessingStatus = 
  | 'pending'
  | 'analyzing'
  | 'strategizing'
  | 'processing'
  | 'consistency_pass'
  | 'validating'
  | 'completed'
  | 'needs_review'
  | 'failed';

export interface PhotoProcessingResult {
  photoId: string;
  originalUrl: string;
  enhancedUrl: string | null;
  toolsApplied: ToolId[];
  success: boolean;
  error?: string;
  confidence: number;
  processingTime: number; // ms
  needsReview: boolean;
  reviewReason?: string;
}

export interface ListingProcessingResult {
  listingId: string;
  status: ProcessingStatus;
  heroPhotoId: string | null;
  photoResults: PhotoProcessingResult[];
  totalPhotos: number;
  successfulPhotos: number;
  failedPhotos: number;
  photosNeedingReview: number;
  overallConfidence: number;
  totalProcessingTime: number; // ms
  startedAt: string;
  completedAt: string | null;
  error?: string;
}

// ============================================
// PROGRESS TRACKING
// ============================================

export interface ProcessingProgress {
  listingId: string;
  status: ProcessingStatus;
  currentPhase: string;
  totalPhotos: number;
  analyzedPhotos: number;
  processedPhotos: number;
  currentPhotoId?: string;
  currentTool?: ToolId;
  estimatedTimeRemaining: number; // seconds
  startedAt: string;
  messages: string[];
}

// ============================================
// CONSISTENCY TYPES
// ============================================

export interface ConsistencyMetrics {
  averageBrightness: number;
  averageContrast: number;
  averageWarmth: number;
  averageSaturation: number;
}

export interface ConsistencyAdjustment {
  photoId: string;
  brightness: number; // -100 to +100
  contrast: number;
  warmth: number;
  saturation: number;
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationResult {
  photoId: string;
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  needsReview: boolean;
}

export interface ValidationIssue {
  type: 'artifact' | 'distortion' | 'color_shift' | 'blur' | 'inconsistency' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string; // e.g., "top-left", "sky area"
}

// ============================================
// API TYPES
// ============================================

export interface PrepareListingRequest {
  listingId: string;
  options?: {
    skipTwilight?: boolean;
    skipStaging?: boolean;
    prioritizeSpeed?: boolean;
    maxConcurrency?: number;
  };
}

export interface PrepareListingResponse {
  success: boolean;
  listingId: string;
  status: ProcessingStatus;
  message: string;
  estimatedTime?: number; // seconds
  error?: string;
}

export interface ListingStatusResponse {
  listingId: string;
  status: ProcessingStatus;
  heroPhotoId: string | null;
  preparedAt: string | null;
  totalPhotos: number;
  enhancedPhotos: number;
  photosNeedingReview: number;
  overallConfidence: number;
  canExport: boolean;
  canShare: boolean;
}
