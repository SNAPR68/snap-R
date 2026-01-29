/**
 * SnapR AI Engine V3 - Photo Intelligence
 * ========================================
 * Production-grade GPT-4o Vision analysis
 * 
 * KEY IMPROVEMENTS:
 * 1. Validates if photo is a real property photo
 * 2. Only suggests tools that will FIX actual problems
 * 3. Detects TV content quality (not just presence)
 * 4. Detects if fireplace needs fire (not just presence)
 * 5. Better prompting for accurate analysis
 * 6. Confidence scoring with reasons
 */

import OpenAI from 'openai';
import { 
  PhotoAnalysis, 
  PhotoType, 
  SkyQuality, 
  LawnQuality, 
  LightingQuality, 
  ClutterLevel, 
  Priority 
} from './types';
import { ToolId } from '../router';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ANALYSIS_VERSION = '3.0.0';

// ============================================
// ENHANCED ANALYSIS PROMPT
// ============================================
const ANALYSIS_PROMPT = `You are an expert real estate photo analyst. Your job is to analyze property photos and determine EXACTLY what enhancements are needed - no more, no less.

CRITICAL RULES:
1. Only suggest tools that will FIX an actual PROBLEM
2. Do NOT suggest tools just because an object exists
3. If something looks GOOD, leave it alone
4. Be conservative - when in doubt, don't suggest a tool

═══════════════════════════════════════════════════════════════
STEP 1: VALIDATE THE PHOTO
═══════════════════════════════════════════════════════════════

First, determine if this is a VALID real estate property photo:

✓ VALID: House exterior, interior room, aerial/drone view, backyard, pool area, specific room feature (fireplace, kitchen island, etc.)

✗ INVALID: 
- Texture/material close-ups (wood grain, marble, fabric)
- Documents, floorplans, screenshots
- People, pets, personal photos
- Non-property images (cars, furniture only, abstract)
- Blurry/unusable photos

If INVALID → set "isValidPropertyPhoto": false and "skipEnhancement": true

═══════════════════════════════════════════════════════════════
STEP 2: CLASSIFY THE PHOTO
═══════════════════════════════════════════════════════════════

Photo Type (choose ONE):
- exterior_front: Front of house, main facade
- exterior_back: Backyard, rear view
- exterior_side: Side of house
- interior_living: Living room, family room, great room
- interior_kitchen: Kitchen
- interior_bedroom: Bedroom, master suite
- interior_bathroom: Bathroom
- interior_dining: Dining room
- interior_office: Office, study
- interior_other: Hallway, laundry, closet, garage
- drone: Aerial view
- detail: Close-up of specific feature
- unknown: Cannot determine

═══════════════════════════════════════════════════════════════
STEP 3: ANALYZE ISSUES (Be specific!)
═══════════════════════════════════════════════════════════════

SKY (exteriors only):
- skyQuality: What's the actual sky quality?
  - "clear_blue" = Beautiful blue sky, no issues
  - "good" = Acceptable sky, minor clouds
  - "overcast" = Gray but even, not necessarily bad
  - "blown_out" = WHITE, washed out, no detail ← NEEDS FIX
  - "ugly" = Stormy, dark, unappealing ← NEEDS FIX
  - "none" = No sky visible

TWILIGHT POTENTIAL (exteriors with windows):
- Would this specific photo benefit from twilight conversion?
- Are MULTIPLE windows clearly visible that could glow?
- Is it currently a DAYTIME photo? (nighttime photos can't be converted)
- twilightScore: 0-100 (only 80+ should be converted)

LAWN (exteriors only):
- lawnQuality: What's the actual lawn quality?
  - "lush_green" = Healthy, green ← NO FIX NEEDED
  - "patchy" = Some brown/bare spots ← NEEDS FIX
  - "brown" = Mostly brown/dead ← NEEDS FIX
  - "dead" = Completely dead ← NEEDS FIX
  - "none" = No lawn visible

INTERIOR ISSUES:
- clutterLevel: "none" | "light" | "moderate" | "heavy"
  - Only "moderate" or "heavy" should trigger declutter
- roomEmpty: Is the room COMPLETELY unfurnished? (for staging)
  - A room with even one piece of furniture is NOT empty

SPECIAL FEATURES - IMPORTANT: Detect if action is NEEDED, not just present:

TV Analysis:
- hasTV: Is there a TV/monitor visible?
- tvNeedsReplacement: Does the TV show DISTRACTING content?
  - TRUE if: news, sports, bright commercial, static, dated show, black screen with reflection
  - FALSE if: turned off (dark), nature scene, neutral image, screen not clearly visible
  - When in doubt: FALSE (don't replace what isn't broken)

Fireplace Analysis:
- hasFireplace: Is there a fireplace visible?
- fireplaceNeedsFire: Would adding fire IMPROVE this photo?
  - TRUE if: fireplace is clearly empty/unlit AND it's a cozy room
  - FALSE if: already has fire, gas fireplace (no logs), modern electric, or not a focal point
  - When in doubt: FALSE

Pool Analysis:
- hasPool: Is there a pool visible?
- poolNeedsEnhancement: Is the pool water problematic?
  - TRUE if: green, murky, dirty, debris visible
  - FALSE if: already crystal clear blue water

LIGHTING:
- lighting: "well_lit" | "dark" | "overexposed" | "mixed" | "flash_harsh"
- needsHDR: Are there exposure problems that HDR would fix?

COMPOSITION:
- verticalAlignment: Are vertical lines (walls, doors) straight? (true/false)

═══════════════════════════════════════════════════════════════
STEP 4: SUGGEST TOOLS (ONLY if needed!)
═══════════════════════════════════════════════════════════════

Available tools and WHEN to use them:

EXTERIOR TOOLS:
- "sky-replacement": ONLY if skyQuality is "blown_out" or "ugly"
- "virtual-twilight": ONLY if twilightScore >= 80 AND hasVisibleWindows AND daytime photo
- "lawn-repair": ONLY if lawnQuality is "patchy", "brown", or "dead"
- "pool-enhance": ONLY if poolNeedsEnhancement is true

INTERIOR TOOLS:
- "declutter": ONLY if clutterLevel is "moderate" or "heavy"
- "virtual-staging": ONLY if roomEmpty is true (completely empty)
- "fire-fireplace": ONLY if fireplaceNeedsFire is true
- "tv-screen": ONLY if tvNeedsReplacement is true
- "lights-on": ONLY if lighting is "dark"
- "window-masking": ONLY if interior has blown-out white windows

ENHANCEMENT TOOLS:
- "hdr": ONLY if needsHDR is true OR lighting is "mixed"
- "perspective-correction": ONLY if verticalAlignment is false
- "auto-enhance": Safe baseline if no other tools needed
- "flash-fix": ONLY if lighting is "flash_harsh"

HERO SCORE (0-100):
- 90-100: Perfect hero photo (front exterior, excellent composition, good lighting)
- 70-89: Good candidate (clear exterior, good angle)
- 50-69: Acceptable (decent composition)
- 0-49: Not hero material (interior, poor quality, wrong angle)

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON (no markdown, no explanation):

{
  "isValidPropertyPhoto": true,
  "skipEnhancement": false,
  "skipReason": null,
  
  "photoType": "exterior_front",
  
  "hasSky": true,
  "skyVisible": 35,
  "skyQuality": "blown_out",
  
  "twilightCandidate": true,
  "twilightScore": 85,
  "hasVisibleWindows": true,
  "windowCount": 6,
  
  "hasLawn": true,
  "lawnVisible": 25,
  "lawnQuality": "patchy",
  
  "lighting": "well_lit",
  "needsHDR": false,
  
  "hasClutter": false,
  "clutterLevel": "none",
  "roomEmpty": false,
  
  "hasFireplace": false,
  "fireplaceNeedsFire": false,
  
  "hasPool": false,
  "poolNeedsEnhancement": false,
  
  "hasTV": false,
  "tvNeedsReplacement": false,
  
  "composition": "good",
  "sharpness": "sharp",
  "verticalAlignment": true,
  
  "heroScore": 82,
  "heroReason": "Strong front exterior, good composition, needs sky fix",
  
  "suggestedTools": ["sky-replacement", "lawn-repair"],
  "toolReasons": {
    "sky-replacement": "Sky is blown out (white/washed out)",
    "lawn-repair": "Lawn has brown patches"
  },
  
  "notSuggested": {
    "virtual-twilight": "Will be evaluated at listing level for top candidates",
    "declutter": "No clutter present",
    "tv-screen": "No TV visible"
  },
  
  "priority": "critical",
  "confidence": 92,
  "confidenceReason": "Clear exterior photo with obvious issues identified"
}`;

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================
export async function analyzePhoto(
  photoId: string,
  photoUrl: string,
  apiKey?: string
): Promise<PhotoAnalysis> {
  console.log(`[PhotoIntelligence V3] Analyzing photo: ${photoId}`);
  const startTime = Date.now();

  try {
    // Use provided apiKey or fall back to global openai client
    const client = apiKey ? new OpenAI({ apiKey }) : openai;
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate photo analyst. Be precise and conservative - only suggest enhancements for actual problems.'
        },
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
      max_tokens: 2000,
      temperature: 0.1, // Very low for consistent analysis
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
    
    let analysis;
    try {
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[PhotoIntelligence V3] JSON parse error:', cleanContent.substring(0, 200));
      throw new Error('Failed to parse GPT-4 response as JSON');
    }
    
    const duration = Date.now() - startTime;
    console.log(`[PhotoIntelligence V3] Analysis complete in ${duration}ms`);
    console.log(`[PhotoIntelligence V3] Type: ${analysis.photoType}`);
    console.log(`[PhotoIntelligence V3] Valid: ${analysis.isValidPropertyPhoto}`);
    console.log(`[PhotoIntelligence V3] Tools: ${analysis.suggestedTools?.join(', ') || 'none'}`);
    console.log(`[PhotoIntelligence V3] Confidence: ${analysis.confidence}%`);

    // Validate and normalize the response
    return normalizeAnalysis(photoId, photoUrl, analysis);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[PhotoIntelligence V3] Analysis failed after ${duration}ms:`, error.message);
    
    // Return a conservative default analysis on failure
    return getDefaultAnalysis(photoId, photoUrl, error.message);
  }
}

// ============================================
// BATCH ANALYSIS WITH PROGRESS
// ============================================
export async function analyzePhotos(
  photos: Array<{ id: string; url: string }>,
  options: { 
    maxConcurrency?: number;
    apiKey?: string;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<PhotoAnalysis[]> {
  const { maxConcurrency = 5, onProgress, apiKey: providedApiKey } = options;
  const apiKey = providedApiKey || process.env.OPENAI_API_KEY;
  const results: PhotoAnalysis[] = [];
  
  console.log(`[PhotoIntelligence V3] ═══════════════════════════════════════`);
  console.log(`[PhotoIntelligence V3] Analyzing ${photos.length} photos`);
  console.log(`[PhotoIntelligence V3] Concurrency: ${maxConcurrency}`);
  console.log(`[PhotoIntelligence V3] ═══════════════════════════════════════`);
  
  const startTime = Date.now();

  // Process in batches for rate limiting
  for (let i = 0; i < photos.length; i += maxConcurrency) {
    const batch = photos.slice(i, i + maxConcurrency);
    const batchPromises = batch.map(photo => analyzePhoto(photo.id, photo.url, apiKey));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Report progress
    if (onProgress) {
      onProgress(results.length, photos.length);
    }
    
    console.log(`[PhotoIntelligence V3] Progress: ${results.length}/${photos.length}`);
    
    // Small delay between batches to avoid rate limits
    if (i + maxConcurrency < photos.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const duration = Date.now() - startTime;
  
  // Log summary
  const validPhotos = results.filter(r => r.isValidPropertyPhoto !== false).length;
  const skippedPhotos = results.filter(r => r.skipEnhancement).length;
  const avgConfidence = Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length);
  
  console.log(`[PhotoIntelligence V3] ═══════════════════════════════════════`);
  console.log(`[PhotoIntelligence V3] ANALYSIS COMPLETE`);
  console.log(`[PhotoIntelligence V3] Time: ${(duration / 1000).toFixed(1)}s`);
  console.log(`[PhotoIntelligence V3] Valid photos: ${validPhotos}/${photos.length}`);
  console.log(`[PhotoIntelligence V3] To skip: ${skippedPhotos}`);
  console.log(`[PhotoIntelligence V3] Avg confidence: ${avgConfidence}%`);
  console.log(`[PhotoIntelligence V3] ═══════════════════════════════════════`);

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
  // Check if photo should be skipped
  const isValid = raw.isValidPropertyPhoto !== false;
  const shouldSkip = raw.skipEnhancement === true || !isValid;
  
  // Validate suggested tools against our rules
  const validatedTools = shouldSkip ? [] : validateSuggestedTools(raw);
  
  return {
    photoId,
    photoUrl,
    
    // Validity flags
    isValidPropertyPhoto: isValid,
    skipEnhancement: shouldSkip,
    skipReason: raw.skipReason || (shouldSkip && !isValid ? 'Not a valid property photo' : null),
    
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
    windowCount: raw.windowCount || 0,
    
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
    
    // Special features with "needs" flags
    hasFireplace: Boolean(raw.hasFireplace),
    fireplaceNeedsFire: Boolean(raw.fireplaceNeedsFire),
    hasPool: Boolean(raw.hasPool),
    poolNeedsEnhancement: Boolean(raw.poolNeedsEnhancement),
    hasTV: Boolean(raw.hasTV),
    tvNeedsReplacement: Boolean(raw.tvNeedsReplacement),
    
    // Quality
    composition: validateComposition(raw.composition),
    sharpness: validateSharpness(raw.sharpness),
    verticalAlignment: raw.verticalAlignment !== false,
    
    // Hero
    heroScore: clamp(raw.heroScore || 50, 0, 100),
    heroReason: raw.heroReason || '',
    
    // Recommendations (validated)
    suggestedTools: validatedTools,
    toolReasons: raw.toolReasons || {},
    notSuggested: raw.notSuggested || {},
    priority: shouldSkip ? 'none' : validatePriority(raw.priority),
    confidence: clamp(raw.confidence || 70, 0, 100),
    confidenceReason: raw.confidenceReason || '',
    
    // Metadata
    analyzedAt: new Date().toISOString(),
    analysisVersion: ANALYSIS_VERSION,
  };
}

/**
 * Validate that suggested tools make sense given the analysis
 */
function validateSuggestedTools(raw: any): ToolId[] {
  const suggested = raw.suggestedTools || [];
  if (!Array.isArray(suggested)) return ['auto-enhance'];
  
  const validated: ToolId[] = [];
  
  for (const tool of suggested) {
    let isValid = false;
    
    switch (tool) {
      case 'sky-replacement':
        // Only if sky is bad
        isValid = raw.skyQuality === 'blown_out' || raw.skyQuality === 'ugly';
        break;
        
      case 'virtual-twilight':
        // Only if high twilight score and has windows
        isValid = raw.twilightScore >= 75 && raw.hasVisibleWindows;
        break;
        
      case 'lawn-repair':
        // Only if lawn is bad
        isValid = ['patchy', 'brown', 'dead'].includes(raw.lawnQuality);
        break;
        
      case 'pool-enhance':
        // Only if pool needs it
        isValid = raw.poolNeedsEnhancement === true;
        break;
        
      case 'declutter':
        // Only if moderate or heavy clutter
        isValid = ['moderate', 'heavy'].includes(raw.clutterLevel);
        break;
        
      case 'virtual-staging':
        // Only if room is empty
        isValid = raw.roomEmpty === true;
        break;
        
      case 'fire-fireplace':
        // Only if fireplace needs fire
        isValid = raw.fireplaceNeedsFire === true;
        break;
        
      case 'tv-screen':
        // Only if TV needs replacement
        isValid = raw.tvNeedsReplacement === true;
        break;
        
      case 'lights-on':
        // Only if dark
        isValid = raw.lighting === 'dark';
        break;
        
      case 'window-masking':
        // Interior with potential blown windows
        isValid = raw.photoType?.startsWith('interior') && raw.lighting === 'mixed';
        break;
        
      case 'hdr':
        isValid = raw.needsHDR === true || raw.lighting === 'mixed' || raw.lighting === 'dark';
        break;
        
      case 'perspective-correction':
        isValid = raw.verticalAlignment === false;
        break;
        
      case 'flash-fix':
        isValid = raw.lighting === 'flash_harsh';
        break;
        
      case 'auto-enhance':
        // Always valid as fallback
        isValid = true;
        break;
        
      default:
        // Allow other valid tools
        isValid = isValidTool(tool);
    }
    
    if (isValid) {
      validated.push(tool as ToolId);
    } else {
      console.log(`[PhotoIntelligence V3] Rejected invalid tool suggestion: ${tool}`);
    }
  }
  
  return validated.length > 0 ? validated : ['auto-enhance'];
}

function isValidTool(tool: string): boolean {
  const validTools: string[] = [
    'sky-replacement', 'virtual-twilight', 'lawn-repair', 'pool-enhance',
    'declutter', 'virtual-staging', 'fire-fireplace', 'tv-screen', 'lights-on',
    'window-masking', 'color-balance', 'hdr', 'auto-enhance',
    'perspective-correction', 'lens-correction', 'flash-fix',
    'snow-removal', 'seasonal-spring', 'seasonal-summer', 'seasonal-fall',
    'reflection-removal', 'power-line-removal', 'object-removal'
  ];
  return validTools.includes(tool);
}

function getDefaultAnalysis(
  photoId: string,
  photoUrl: string,
  errorReason: string
): PhotoAnalysis {
  return {
    photoId,
    photoUrl,
    
    // Default to valid but low confidence - don't skip on error
    isValidPropertyPhoto: true,
    skipEnhancement: false,
    skipReason: null,
    
    photoType: 'unknown',
    hasSky: false,
    skyVisible: 0,
    skyQuality: 'none',
    twilightCandidate: false,
    twilightScore: 0,
    hasVisibleWindows: false,
    windowCount: 0,
    hasLawn: false,
    lawnVisible: 0,
    lawnQuality: 'none',
    lighting: 'well_lit',
    needsHDR: false,
    hasClutter: false,
    clutterLevel: 'none',
    roomEmpty: false,
    hasFireplace: false,
    fireplaceNeedsFire: false,
    hasPool: false,
    poolNeedsEnhancement: false,
    hasTV: false,
    tvNeedsReplacement: false,
    composition: 'average',
    sharpness: 'acceptable',
    verticalAlignment: true,
    heroScore: 50,
    heroReason: `Analysis failed: ${errorReason}`,
    suggestedTools: ['auto-enhance'], // Safe conservative default
    toolReasons: { 'auto-enhance': 'Default enhancement due to analysis failure' },
    notSuggested: {},
    priority: 'optional',
    confidence: 30,
    confidenceReason: `Low confidence due to analysis failure: ${errorReason}`,
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

/**
 * Get a summary of what was analyzed
 */
export function getAnalysisSummary(analyses: PhotoAnalysis[]): string {
  const lines: string[] = [];
  
  const valid = analyses.filter(a => a.isValidPropertyPhoto !== false);
  const skipped = analyses.filter(a => a.skipEnhancement);
  const exteriors = valid.filter(a => isExterior(a.photoType));
  const interiors = valid.filter(a => isInterior(a.photoType));
  const twilightCandidates = valid.filter(a => a.twilightScore >= 75);
  const heroCandidates = valid.filter(a => a.heroScore >= 70);
  
  lines.push(`📊 Analysis Summary`);
  lines.push(`━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Total photos: ${analyses.length}`);
  lines.push(`Valid: ${valid.length} | Skipped: ${skipped.length}`);
  lines.push(`Exteriors: ${exteriors.length} | Interiors: ${interiors.length}`);
  lines.push(`Twilight candidates: ${twilightCandidates.length}`);
  lines.push(`Hero candidates: ${heroCandidates.length}`);
  lines.push(``);
  
  // Tool summary
  const toolCounts: Record<string, number> = {};
  for (const analysis of valid) {
    for (const tool of analysis.suggestedTools) {
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    }
  }
  
  lines.push(`🔧 Tools Needed:`);
  Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tool, count]) => {
      lines.push(`   ${tool}: ${count} photos`);
    });
  
  return lines.join('\n');
}
