/**
 * SnapR AI Engine V2 - Photo Intelligence
 * ========================================
 * Uses GPT-4 Vision to analyze photos and classify them
 */

import OpenAI from 'openai';
import { PhotoAnalysis, PhotoType, SkyQuality, LawnQuality, LightingQuality, ClutterLevel, Priority } from './types';
import { ToolId } from '../router';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ANALYSIS_VERSION = '2.0.0';

// ============================================
// ANALYSIS PROMPT
// ============================================

const ANALYSIS_PROMPT = `You are a professional real estate photo analyst. Analyze this property photo and determine what enhancements it needs.

ANALYZE THE FOLLOWING:

1. PHOTO TYPE - Classify as one of:
   - exterior_front (front of house)
   - exterior_back (backyard view)
   - exterior_side (side of house)
   - interior_living (living room, family room)
   - interior_kitchen
   - interior_bedroom
   - interior_bathroom
   - interior_dining
   - interior_office
   - interior_other
   - drone (aerial shot)
   - detail (close-up of feature)

2. SKY ANALYSIS (if exterior/drone):
   - Is sky visible? Estimate percentage of image (0-100)
   - Sky quality: clear_blue, overcast, blown_out (white/washed out), ugly (stormy/bad), good, none

3. TWILIGHT POTENTIAL (if exterior):
   - Would this look good as a twilight/dusk photo?
   - Are windows visible that could glow with interior light?
   - Score 0-100 for twilight conversion potential
   - Best candidates: front exteriors with visible windows, taken during day

4. LAWN ANALYSIS (if visible):
   - Is lawn/grass visible? Estimate percentage (0-100)
   - Lawn quality: lush_green, patchy, brown, dead, none

5. LIGHTING:
   - Overall: well_lit, dark, overexposed, mixed, flash_harsh
   - Does it need HDR enhancement to balance exposure?

6. INTERIOR ISSUES (if interior):
   - Is there clutter? Level: none, light, moderate, heavy
   - Is the room empty/unfurnished (staging candidate)?
   - Special features visible: fireplace, pool, TV?

7. QUALITY ASSESSMENT:
   - Composition: excellent, good, average, poor
   - Sharpness: sharp, acceptable, soft, blurry
   - Are vertical lines straight or tilted?

8. HERO POTENTIAL:
   - Score 0-100 for listing cover photo potential
   - Best heroes: front exterior, well-composed, good lighting

9. RECOMMENDED ENHANCEMENTS:
   Choose from: sky-replacement, virtual-twilight, lawn-repair, pool-enhance, declutter, virtual-staging, fire-fireplace, tv-screen, lights-on, hdr, auto-enhance, perspective-correction, flash-fix
   
   Priority: critical (major issues), recommended (would improve), optional (minor), none

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "photoType": "exterior_front",
  "hasSky": true,
  "skyVisible": 35,
  "skyQuality": "blown_out",
  "twilightCandidate": true,
  "twilightScore": 85,
  "hasVisibleWindows": true,
  "hasLawn": true,
  "lawnVisible": 25,
  "lawnQuality": "patchy",
  "lighting": "well_lit",
  "needsHDR": false,
  "hasClutter": false,
  "clutterLevel": "none",
  "roomEmpty": false,
  "hasFireplace": false,
  "hasPool": false,
  "hasTV": false,
  "composition": "good",
  "sharpness": "sharp",
  "verticalAlignment": true,
  "heroScore": 82,
  "heroReason": "Strong front exterior with good composition, needs sky fix",
  "suggestedTools": ["sky-replacement", "lawn-repair"],
  "priority": "critical",
  "confidence": 90
}`;

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

export async function analyzePhoto(
  photoId: string,
  photoUrl: string
): Promise<PhotoAnalysis> {
  console.log(`[PhotoIntelligence] Analyzing photo: ${photoId}`);
  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: photoUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent analysis
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4 Vision');
    }

    // Parse the JSON response
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const analysis = JSON.parse(cleanContent);
    
    const duration = Date.now() - startTime;
    console.log(`[PhotoIntelligence] Analysis complete in ${duration}ms`);

    // Validate and normalize the response
    return normalizeAnalysis(photoId, photoUrl, analysis);
  } catch (error: any) {
    console.error(`[PhotoIntelligence] Analysis failed:`, error.message);
    
    // Return a safe default analysis on failure
    return getDefaultAnalysis(photoId, photoUrl, error.message);
  }
}

// ============================================
// BATCH ANALYSIS
// ============================================

export async function analyzePhotos(
  photos: Array<{ id: string; url: string }>,
  options: { maxConcurrency?: number } = {}
): Promise<PhotoAnalysis[]> {
  const { maxConcurrency = 5 } = options;
  const results: PhotoAnalysis[] = [];
  
  console.log(`[PhotoIntelligence] Analyzing ${photos.length} photos (concurrency: ${maxConcurrency})`);
  const startTime = Date.now();

  // Process in batches for rate limiting
  for (let i = 0; i < photos.length; i += maxConcurrency) {
    const batch = photos.slice(i, i + maxConcurrency);
    const batchPromises = batch.map(photo => analyzePhoto(photo.id, photo.url));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`[PhotoIntelligence] Progress: ${results.length}/${photos.length}`);
    
    // Small delay between batches to avoid rate limits
    if (i + maxConcurrency < photos.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[PhotoIntelligence] All ${photos.length} photos analyzed in ${(duration / 1000).toFixed(1)}s`);

  return results;
}

// ============================================
// NORMALIZATION & VALIDATION
// ============================================

function normalizeAnalysis(
  photoId: string,
  photoUrl: string,
  raw: any
): PhotoAnalysis {
  return {
    photoId,
    photoUrl,
    
    // Classification
    photoType: validatePhotoType(raw.photoType),
    
    // Sky
    hasSky: Boolean(raw.hasSky),
    skyVisible: clamp(raw.skyVisible || 0, 0, 100),
    skyQuality: validateSkyQuality(raw.skyQuality),
    
    // Twilight
    twilightCandidate: Boolean(raw.twilightCandidate),
    twilightScore: clamp(raw.twilightScore || 0, 0, 100),
    hasVisibleWindows: Boolean(raw.hasVisibleWindows),
    
    // Lawn
    hasLawn: Boolean(raw.hasLawn),
    lawnVisible: clamp(raw.lawnVisible || 0, 0, 100),
    lawnQuality: validateLawnQuality(raw.lawnQuality),
    
    // Lighting
    lighting: validateLighting(raw.lighting),
    needsHDR: Boolean(raw.needsHDR),
    
    // Interior
    hasClutter: Boolean(raw.hasClutter),
    clutterLevel: validateClutterLevel(raw.clutterLevel),
    roomEmpty: Boolean(raw.roomEmpty),
    hasFireplace: Boolean(raw.hasFireplace),
    hasPool: Boolean(raw.hasPool),
    hasTV: Boolean(raw.hasTV),
    
    // Quality
    composition: validateComposition(raw.composition),
    sharpness: validateSharpness(raw.sharpness),
    verticalAlignment: raw.verticalAlignment !== false,
    
    // Hero
    heroScore: clamp(raw.heroScore || 50, 0, 100),
    heroReason: raw.heroReason || '',
    
    // Recommendations
    suggestedTools: validateTools(raw.suggestedTools),
    priority: validatePriority(raw.priority),
    confidence: clamp(raw.confidence || 70, 0, 100),
    
    // Metadata
    analyzedAt: new Date().toISOString(),
    analysisVersion: ANALYSIS_VERSION,
  };
}

function getDefaultAnalysis(
  photoId: string,
  photoUrl: string,
  errorReason: string
): PhotoAnalysis {
  return {
    photoId,
    photoUrl,
    photoType: 'unknown',
    hasSky: false,
    skyVisible: 0,
    skyQuality: 'none',
    twilightCandidate: false,
    twilightScore: 0,
    hasVisibleWindows: false,
    hasLawn: false,
    lawnVisible: 0,
    lawnQuality: 'none',
    lighting: 'well_lit',
    needsHDR: true, // Default to HDR as safe enhancement
    hasClutter: false,
    clutterLevel: 'none',
    roomEmpty: false,
    hasFireplace: false,
    hasPool: false,
    hasTV: false,
    composition: 'average',
    sharpness: 'acceptable',
    verticalAlignment: true,
    heroScore: 50,
    heroReason: `Analysis failed: ${errorReason}`,
    suggestedTools: ['auto-enhance'], // Safe default
    priority: 'optional',
    confidence: 30, // Low confidence due to failure
    analyzedAt: new Date().toISOString(),
    analysisVersion: ANALYSIS_VERSION,
  };
}

// ============================================
// VALIDATORS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function validatePhotoType(value: any): PhotoType {
  const valid: PhotoType[] = [
    'exterior_front', 'exterior_back', 'exterior_side',
    'interior_living', 'interior_kitchen', 'interior_bedroom',
    'interior_bathroom', 'interior_dining', 'interior_office', 'interior_other',
    'drone', 'detail', 'unknown'
  ];
  return valid.includes(value) ? value : 'unknown';
}

function validateSkyQuality(value: any): SkyQuality {
  const valid: SkyQuality[] = ['clear_blue', 'overcast', 'blown_out', 'ugly', 'good', 'none'];
  return valid.includes(value) ? value : 'none';
}

function validateLawnQuality(value: any): LawnQuality {
  const valid: LawnQuality[] = ['lush_green', 'patchy', 'brown', 'dead', 'none'];
  return valid.includes(value) ? value : 'none';
}

function validateLighting(value: any): LightingQuality {
  const valid: LightingQuality[] = ['well_lit', 'dark', 'overexposed', 'mixed', 'flash_harsh'];
  return valid.includes(value) ? value : 'well_lit';
}

function validateClutterLevel(value: any): ClutterLevel {
  const valid: ClutterLevel[] = ['none', 'light', 'moderate', 'heavy'];
  return valid.includes(value) ? value : 'none';
}

function validateComposition(value: any): 'excellent' | 'good' | 'average' | 'poor' {
  const valid = ['excellent', 'good', 'average', 'poor'];
  return valid.includes(value) ? value : 'average';
}

function validateSharpness(value: any): 'sharp' | 'acceptable' | 'soft' | 'blurry' {
  const valid = ['sharp', 'acceptable', 'soft', 'blurry'];
  return valid.includes(value) ? value : 'acceptable';
}

function validatePriority(value: any): Priority {
  const valid: Priority[] = ['critical', 'recommended', 'optional', 'none'];
  return valid.includes(value) ? value : 'optional';
}

function validateTools(value: any): ToolId[] {
  if (!Array.isArray(value)) return ['auto-enhance'];
  
  const validTools: ToolId[] = [
    'sky-replacement', 'virtual-twilight', 'lawn-repair', 'pool-enhance',
    'declutter', 'virtual-staging', 'fire-fireplace', 'tv-screen', 'lights-on',
    'window-masking', 'color-balance', 'hdr', 'auto-enhance',
    'perspective-correction', 'lens-correction', 'flash-fix',
    'snow-removal', 'seasonal-spring', 'seasonal-summer', 'seasonal-fall',
    'reflection-removal', 'power-line-removal', 'object-removal'
  ];
  
  return value.filter((tool: any) => validTools.includes(tool));
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function isExterior(photoType: PhotoType): boolean {
  return photoType.startsWith('exterior') || photoType === 'drone';
}

export function isInterior(photoType: PhotoType): boolean {
  return photoType.startsWith('interior');
}

export function getPhotoTypeLabel(photoType: PhotoType): string {
  const labels: Record<PhotoType, string> = {
    exterior_front: 'Front Exterior',
    exterior_back: 'Back Exterior',
    exterior_side: 'Side Exterior',
    interior_living: 'Living Room',
    interior_kitchen: 'Kitchen',
    interior_bedroom: 'Bedroom',
    interior_bathroom: 'Bathroom',
    interior_dining: 'Dining Room',
    interior_office: 'Office',
    interior_other: 'Interior',
    drone: 'Aerial View',
    detail: 'Detail Shot',
    unknown: 'Photo',
  };
  return labels[photoType] || 'Photo';
}
