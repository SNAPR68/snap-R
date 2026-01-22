/**
 * SnapR AI Engine V3 - Types
 * ==========================
 * Complete type definitions for production engine
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
export type Priority = 'critical' | 'recommended' | 'optional' | 'none';

export interface PhotoAnalysis {
  photoId: string;
  photoUrl: string;
  
  // ═══════════════════════════════════════════
  // VALIDITY FLAGS
  // ═══════════════════════════════════════════
  isValidPropertyPhoto: boolean;   // Is this actually a property photo?
  skipEnhancement: boolean;        // Should we skip processing?
  skipReason: string | null;       // Why are we skipping?
  
  // ═══════════════════════════════════════════
  // CLASSIFICATION
  // ═══════════════════════════════════════════
  photoType: PhotoType;
  
  // ═══════════════════════════════════════════
  // SKY ANALYSIS
  // ═══════════════════════════════════════════
  hasSky: boolean;
  skyVisible: number;              // 0-100 percentage
  skyQuality: SkyQuality;
  
  // ═══════════════════════════════════════════
  // TWILIGHT POTENTIAL
  // ═══════════════════════════════════════════
  twilightCandidate: boolean;
  twilightScore: number;           // 0-100
  hasVisibleWindows: boolean;
  windowCount: number;             // Number of windows visible
  
  // ═══════════════════════════════════════════
  // LAWN ANALYSIS
  // ═══════════════════════════════════════════
  hasLawn: boolean;
  lawnVisible: number;             // 0-100 percentage
  lawnQuality: LawnQuality;
  
  // ═══════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════
  lighting: LightingQuality;
  needsHDR: boolean;
  
  // ═══════════════════════════════════════════
  // INTERIOR FEATURES
  // ═══════════════════════════════════════════
  hasClutter: boolean;
  clutterLevel: ClutterLevel;
  roomEmpty: boolean;              // Completely unfurnished?
  
  // ═══════════════════════════════════════════
  // SPECIAL FEATURES (with "needs" flags)
  // ═══════════════════════════════════════════
  hasFireplace: boolean;
  fireplaceNeedsFire: boolean;     // Is it unlit and would benefit?
  
  hasPool: boolean;
  poolNeedsEnhancement: boolean;   // Is water dirty/murky?
  
  hasTV: boolean;
  tvNeedsReplacement: boolean;     // Does it show distracting content?
  
  // ═══════════════════════════════════════════
  // QUALITY ASSESSMENT
  // ═══════════════════════════════════════════
  composition: 'excellent' | 'good' | 'average' | 'poor';
  sharpness: 'sharp' | 'acceptable' | 'soft' | 'blurry';
  verticalAlignment: boolean;      // Are verticals straight?
  
  // ═══════════════════════════════════════════
  // HERO POTENTIAL
  // ═══════════════════════════════════════════
  heroScore: number;               // 0-100
  heroReason: string;
  
  // ═══════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════
  suggestedTools: ToolId[];
  toolReasons: Record<string, string>;    // Why each tool was suggested
  notSuggested: Record<string, string>;   // Why tools were NOT suggested
  priority: Priority;
  confidence: number;              // 0-100
  confidenceReason: string;
  
  // ═══════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════
  analyzedAt: string;
  analysisVersion: string;
}

// ============================================
// STRATEGY TYPES
// ============================================

export interface PhotoStrategy {
  photoId: string;
  photoUrl: string;
  
  // Tools to apply
  tools: ToolId[];
  toolOrder: ToolId[];             // Execution order
  
  // Classification
  priority: Priority;
  confidence: number;
  isHeroCandidate: boolean;
  isTwilightTarget: boolean;
  
  // Timing
  estimatedProcessingTime: number;
  
  // Skip handling
  skip: boolean;
  skipReason?: string;
  
  // Provider routing
  providerRouting?: Record<ToolId, string>;
}

export interface ListingStrategy {
  listingId: string;
  
  // Photo selection
  heroPhotoId: string | null;
  twilightPhotoIds: string[];
  
  // Listing-wide decisions
  shouldReplaceSky: boolean;
  shouldEnhanceLawns: boolean;
  
  // Individual strategies
  photoStrategies: PhotoStrategy[];
  
  // Counts
  totalPhotos: number;
  validPhotos: number;
  skippedPhotos: number;
  photosRequiringWork: number;
  
  // Estimates
  estimatedTotalTime: number;
  estimatedTotalCost: number;
  overallConfidence: number;
  
  // Metadata
  createdAt: string;
  strategyVersion: string;
}

// ============================================
// LOCKED PRESETS (for consistency)
// ============================================

export interface LockedPresets {
  // Sky preset for all exteriors
  skyPreset: 'clear-blue' | 'sunset' | 'dramatic-clouds' | 'twilight';
  skyPrompt: string;
  
  // Twilight preset for all twilight photos
  twilightPreset: 'dusk' | 'blue-hour' | 'golden-hour' | 'night';
  twilightPrompt: string;
  
  // Lawn preset for all lawn repairs
  lawnPreset: 'lush-green' | 'natural-green';
  lawnPrompt: string;
  
  // Staging style for all rooms
  stagingStyle: 'modern' | 'traditional' | 'scandinavian' | 'luxury';
  stagingPrompt: string;
  
  // Color temperature for entire listing
  colorTemp: 'warm' | 'neutral' | 'cool';
  
  // Declutter level
  declutterLevel: 'light' | 'moderate' | 'full';
  declutterPrompt: string;
}

// ============================================
// PROCESSING TYPES
// ============================================

export interface PhotoProcessingResult {
  photoId: string;
  originalUrl: string;
  enhancedUrl: string | null;
  
  // Tools
  toolsApplied: ToolId[];
  toolsSkipped: ToolId[];
  toolResults: Partial<Record<ToolId, {
    success: boolean;
    provider: string;
    duration: number;
    error?: string;
    retryCount?: number;
  }>>;
  
  // Status
  success: boolean;
  error?: string;
  
  // Quality
  confidence: number;
  processingTime: number;
  
  // Review flags
  needsReview: boolean;
  reviewReason?: string;
  
  // Skip info
  skipped: boolean;
  skipReason?: string;
}

export interface ListingProcessingResult {
  listingId: string;
  status: ProcessingStatus;
  
  // Photo selection
  heroPhotoId: string | null;
  
  // Results
  photoResults: PhotoProcessingResult[];
  
  // Counts
  totalPhotos: number;
  validPhotos: number;
  skippedPhotos: number;
  successfulPhotos: number;
  failedPhotos: number;
  photosNeedingReview: number;
  
  // Quality
  overallConfidence: number;
  consistencyScore: number;
  
  // Timing & Cost
  totalProcessingTime: number;
  totalCost: number;
  
  // Timestamps
  startedAt: string;
  completedAt: string;
  
  // Error
  error?: string;
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationIssue {
  type: 'artifact' | 'distortion' | 'color_shift' | 'blur' | 'inconsistency' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
}

export interface ValidationResult {
  photoId: string;
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  needsReview: boolean;
  recommendation?: 'approve' | 'review' | 'reject' | 'retry';
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
  brightness: number;      // -20 to +20
  contrast: number;        // -15 to +15
  warmth: number;          // -15 to +15
  saturation: number;      // -15 to +15
}

// ============================================
// PROGRESS TYPES
// ============================================

export type ProcessingStatus =
  | 'pending'
  | 'analyzing'
  | 'strategizing'
  | 'processing'
  | 'validating'
  | 'consistency_pass'
  | 'completed'
  | 'needs_review'
  | 'failed';

export interface ProcessingProgress {
  listingId: string;
  status: ProcessingStatus;
  currentPhase: string;
  
  // Counts
  totalPhotos: number;
  analyzedPhotos: number;
  processedPhotos: number;
  validatedPhotos: number;
  skippedPhotos: number;
  
  // Current work
  currentPhotoId?: string;
  currentTool?: string;
  currentProvider?: string;
  
  // Estimates
  estimatedTimeRemaining: number;
  percentComplete: number;
  
  // Timestamps
  startedAt: string;
  
  // Messages
  messages: string[];
}

// ============================================
// API TYPES
// ============================================

export interface PrepareListingRequest {
  listingId: string;
  options?: {
    prioritizeSpeed?: boolean;      // Reduce quality for speed
    prioritizeQuality?: boolean;    // Max quality, slower
    skipTwilight?: boolean;         // Don't do twilight
    skipStaging?: boolean;          // Don't do staging
    forceReprocess?: boolean;       // Reprocess even if done
    maxBudget?: number;             // Cost limit in USD
  };
}

export interface PrepareListingResponse {
  success: boolean;
  listingId: string;
  status: ProcessingStatus;
  message: string;
  
  // Results (if completed)
  heroPhotoId?: string;
  totalPhotos?: number;
  successfulPhotos?: number;
  photosNeedingReview?: number;
  
  // Estimates (if processing)
  estimatedTime?: number;
  estimatedCost?: number;
  
  // Error
  error?: string;
}

// ============================================
// RETRY TYPES
// ============================================

export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
}

export interface RetryState {
  photoId: string;
  toolId: ToolId;
  attempts: number;
  lastError?: string;
  lastProvider?: string;
  nextProvider?: string;
}
