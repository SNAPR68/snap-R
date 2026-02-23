/**
 * @snapr/shared - Shared TypeScript types
 * ========================================
 * Extracted from web app for use by both web and mobile apps.
 * Source: lib/types.ts, lib/ai/listing-engine/types.ts, lib/ai/router.ts
 */

// ============================================
// CORE DATABASE TYPES
// ============================================

export interface Job {
  id: string;
  user_id: string | null;
  listing_id: string | null;
  variant?: string | null;
  error?: string | null;
  completed_at?: string | null;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string | null;
}

export interface Photo {
  id: string;
  listing_id: string | null;
  job_id: string | null;
  raw_url: string | null;
  processed_url: string | null;
  processed_at?: string | null;
  variant?: string | null;
  error?: string | null;
  status: string;
  room_type: string | null;
  quality_score: number | null;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string | null;
  title: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ListingWithPhotos extends Listing {
  thumbnail?: string;
  count: number;
}

export interface ListingPayload {
  title: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  description?: string;
}

// ============================================
// AI ENGINE TYPES
// ============================================

export type ToolId =
  // EXTERIOR (4)
  | 'sky-replacement'
  | 'virtual-twilight'
  | 'lawn-repair'
  | 'pool-enhance'
  // SEASONAL (4)
  | 'snow-removal'
  | 'seasonal-spring'
  | 'seasonal-summer'
  | 'seasonal-fall'
  // INTERIOR (6)
  | 'declutter'
  | 'virtual-staging'
  | 'fire-fireplace'
  | 'tv-screen'
  | 'lights-on'
  | 'window-masking'
  // ENHANCE (5)
  | 'hdr'
  | 'auto-enhance'
  | 'perspective-correction'
  | 'lens-correction'
  | 'color-balance'
  // FIX (4)
  | 'reflection-removal'
  | 'power-line-removal'
  | 'object-removal'
  | 'flash-fix';

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

export interface PhotoAnalysis {
  photoId: string;
  photoUrl: string;

  // Validity
  isValidPropertyPhoto: boolean;
  skipEnhancement: boolean;
  skipReason: string | null;

  // Classification
  photoType: PhotoType;

  // Sky
  hasSky: boolean;
  skyVisible: number;
  skyQuality: SkyQuality;
  skyNeedsReplacement: boolean;

  // Twilight
  twilightCandidate: boolean;
  twilightScore: number;
  hasVisibleWindows: boolean;
  windowCount: number;
  windowExposureIssue: boolean;

  // Lawn
  hasLawn: boolean;
  lawnVisible: number;
  lawnQuality: LawnQuality;
  lawnNeedsRepair: boolean;

  // Lighting
  lighting: LightingQuality;
  needsHDR: boolean;

  // Interior
  hasClutter: boolean;
  clutterLevel: ClutterLevel;
  roomEmpty: boolean;

  // Special features
  hasFireplace: boolean;
  fireplaceNeedsFire: boolean;
  hasPool: boolean;
  poolNeedsEnhancement: boolean;
  hasTV: boolean;
  tvNeedsReplacement: boolean;

  // Quality
  composition: 'excellent' | 'good' | 'average' | 'poor';
  sharpness: 'sharp' | 'acceptable' | 'soft' | 'blurry';
  verticalAlignment: boolean;

  // Hero
  heroScore: number;
  heroReason: string;

  // Recommendations
  suggestedTools: ToolId[];
  toolReasons: Record<string, string>;
  notSuggested: Record<string, string>;
  priority: Priority;
  confidence: number;
  confidenceReason: string;

  // Metadata
  analyzedAt: string;
  analysisVersion: string;
}

// ============================================
// MARKETING TYPES
// ============================================

export type MarketingStepStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface MarketingJob {
  id: string;
  listing_id: string;
  user_id: string;
  status: string;
  description_status: MarketingStepStatus;
  description_result: string | null;
  captions_status: MarketingStepStatus;
  captions_result: Record<string, unknown> | null;
  mls_status: MarketingStepStatus;
  mls_result: Record<string, unknown> | null;
  property_site_status: MarketingStepStatus;
  property_site_result: Record<string, unknown> | null;
  scheduled_posts_status: MarketingStepStatus;
  scheduled_posts_result: Record<string, unknown> | null;
  total_cost_cents: number;
  cost_breakdown: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

// ============================================
// SOCIAL & PUBLISHING TYPES
// ============================================

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'twitter';

export interface SocialConnection {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  is_active: boolean;
  platform_username: string | null;
  connected_at: string;
}

export interface ScheduledPost {
  id: string;
  listing_id: string;
  user_id: string;
  platform: SocialPlatform;
  post_type: string;
  content: string;
  scheduled_for: string;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  created_at: string;
}

export interface PublishedPost {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  post_type: string;
  caption: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagement_rate: number;
  last_synced_at: string | null;
}

// ============================================
// MOBILE-SPECIFIC TYPES
// ============================================

/** Room checklist item for AI Director camera */
export interface RoomChecklistItem {
  roomType: PhotoType;
  label: string;
  required: boolean;
  captured: boolean;
  photoId?: string;
  score?: number;
}

/** Property type determines default room checklist */
export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'commercial';

/** Lightweight frame analysis result from server (GPT-4o Vision) */
export interface FrameAnalysis {
  roomType: PhotoType;
  roomConfidence: number;
  compositionScore: number;
  lightingScore: number;
  overallScore: number;
  tips: string[];
  captureRecommended: boolean;
}

/** On-device composition scoring result */
export interface CompositionScore {
  ruleOfThirds: number;
  horizonLevel: number;
  symmetry: number;
  overall: number;
}

/** Photo captured during AI Director session before upload */
export interface CapturedPhoto {
  localUri: string;
  roomType: PhotoType;
  score: number;
  timestamp: string;
  width: number;
  height: number;
  exif?: Record<string, unknown>;
}
