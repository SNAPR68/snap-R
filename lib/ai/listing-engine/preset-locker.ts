/**
 * SnapR AI Engine V2 - Preset Locker
 * ===================================
 * Ensures consistent presets across entire listing
 * THIS IS THE FOTELLO KILLER FEATURE
 */

import { PhotoAnalysis } from './types';

export interface LockedPresets {
  // Sky preset locked for all exteriors
  skyPreset: 'clear-blue' | 'sunset' | 'dramatic-clouds' | 'twilight';
  skyPrompt: string;
  
  // Twilight preset locked for all twilight photos
  twilightPreset: 'dusk' | 'blue-hour' | 'golden-hour' | 'night';
  twilightPrompt: string;
  
  // Lawn preset locked for all lawn repairs
  lawnPreset: 'lush-green' | 'natural-green';
  lawnPrompt: string;
  
  // Staging style locked for all rooms
  stagingStyle: 'modern' | 'traditional' | 'scandinavian' | 'luxury';
  stagingPrompt: string;
  
  // Color temperature for entire listing
  colorTemp: 'warm' | 'neutral' | 'cool';
  
  // Declutter level
  declutterLevel: 'light' | 'moderate' | 'full';
  declutterPrompt: string;
}

/**
 * Analyze all photos and determine optimal locked presets
 * These presets will be applied consistently across the entire listing
 */
export function determineLockedPresets(analyses: PhotoAnalysis[]): LockedPresets {
  console.log('[PresetLocker] Analyzing listing for optimal presets...');
  
  // Analyze exterior photos to determine sky strategy
  const exteriors = analyses.filter(a => a.photoType.startsWith('exterior') || a.photoType === 'drone');
  const hasGoodSky = exteriors.some(a => a.skyQuality === 'clear_blue' || a.skyQuality === 'good');
  const hasBadSky = exteriors.some(a => a.skyQuality === 'blown_out' || a.skyQuality === 'ugly' || a.skyQuality === 'overcast');
  
  // Determine best sky preset (favor clean, natural sky with no clouds)
  let skyPreset: LockedPresets['skyPreset'] = 'clear-blue';
  if (hasBadSky && !hasGoodSky) {
    skyPreset = 'clear-blue';
  }
  
  // Determine twilight preset - force warm, natural dusk/golden (no blue-hour by default)
  const twilightCandidates = analyses.filter(a => a.twilightCandidate && a.twilightScore > 75);
  let twilightPreset: LockedPresets['twilightPreset'] = 'dusk';
  
  if (twilightCandidates.length > 0) {
    // Prefer warm golden for best natural results
    twilightPreset = 'golden-hour';
  }
  
  // Determine staging style based on interior analysis
  const interiors = analyses.filter(a => a.photoType.startsWith('interior'));
  const emptyRooms = interiors.filter(a => a.roomEmpty);
  let stagingStyle: LockedPresets['stagingStyle'] = 'modern'; // Default modern
  
  // Analyze overall composition quality to infer property style
  const avgComposition = interiors.filter(a => a.composition === 'excellent' || a.composition === 'good').length / Math.max(interiors.length, 1);
  if (avgComposition > 0.7) {
    stagingStyle = 'luxury'; // High quality photos suggest luxury property
  }
  
  // Determine color temperature
  const darkRooms = analyses.filter(a => a.lighting === 'dark').length;
  const colorTemp: LockedPresets['colorTemp'] = darkRooms > analyses.length * 0.3 ? 'warm' : 'neutral';
  
  // Determine declutter level
  const heavyClutter = analyses.filter(a => a.clutterLevel === 'heavy' || a.clutterLevel === 'moderate').length;
  let declutterLevel: LockedPresets['declutterLevel'] = 'light';
  if (heavyClutter > interiors.length * 0.5) {
    declutterLevel = 'moderate';
  }
  
  const presets: LockedPresets = {
    skyPreset,
    skyPrompt: SKY_PROMPTS[skyPreset],
    twilightPreset,
    twilightPrompt: TWILIGHT_PROMPTS[twilightPreset],
    lawnPreset: 'lush-green',
    lawnPrompt: 'Transform into perfectly manicured vibrant emerald green grass like a golf course',
    stagingStyle,
    stagingPrompt: STAGING_PROMPTS[stagingStyle],
    colorTemp,
    declutterLevel,
    declutterPrompt: DECLUTTER_PROMPTS[declutterLevel],
  };
  
  console.log('[PresetLocker] Locked presets:', {
    sky: skyPreset,
    twilight: twilightPreset,
    staging: stagingStyle,
    colorTemp,
    declutter: declutterLevel,
  });
  
  return presets;
}

// ============================================
// PRESET PROMPT DEFINITIONS
// ============================================

const SKY_PROMPTS: Record<LockedPresets['skyPreset'], string> = {
  'clear-blue': 'Replace ONLY the sky with a clean, natural blue sky with NO clouds. Crisp, realistic real estate photography look. Do NOT change the house, trees, lawn, or anything else.',
  'sunset': 'Replace ONLY the sky with a clean golden sunset gradient - warm orange and pink near the horizon fading to soft blue above, NO clouds. Do NOT change the house, trees, lawn, or anything else.',
  'dramatic-clouds': 'Replace ONLY the sky with a clean, natural blue sky with NO clouds. Do NOT change the house, trees, lawn, or anything else.',
  'twilight': 'Replace ONLY the sky with a clean twilight gradient - deep blue at top transitioning to warm purple-orange at the horizon, NO clouds. Do NOT change the house or anything else.',
};

const TWILIGHT_PROMPTS: Record<LockedPresets['twilightPreset'], string> = {
  'dusk': 'Transform into BRIGHT early dusk. Sky should have a soft purple-to-warm-orange gradient with NO clouds. Keep the house well-lit and clearly visible. Add warm glow in windows. Do NOT darken the scene.',
  'blue-hour': 'Transform into BLUE HOUR but keep it BRIGHT. Sky should be rich blue with NO clouds, house clearly visible, and windows glowing warm yellow light. Avoid night darkness.',
  'golden-hour': 'Transform into GOLDEN HOUR twilight. Sky should show warm orange/pink sunset colors with NO clouds. Keep the house bright and visible. Add warm yellow glow from every window.',
  'night': 'Transform into a NIGHT scene but keep the house BRIGHTLY lit and fully visible. Deep blue-black sky with NO clouds. All windows glowing warm yellow-orange.',
};

const STAGING_PROMPTS: Record<LockedPresets['stagingStyle'], string> = {
  'modern': 'Stage with modern contemporary furniture - clean lines, neutral gray and white tones, minimal decor, sleek design. Professional real estate staging.',
  'traditional': 'Stage with traditional elegant furniture - warm wood tones, rich fabrics, classic timeless style. Comfortable and inviting.',
  'scandinavian': 'Stage with Scandinavian style - light natural wood, white and beige palette, cozy minimal aesthetic, hygge atmosphere.',
  'luxury': 'Stage with luxury high-end furniture - velvet textures, gold accents, marble surfaces, glamorous and sophisticated design.',
};

const DECLUTTER_PROMPTS: Record<LockedPresets['declutterLevel'], string> = {
  'light': 'Remove only small clutter like papers, cups, remotes, and small personal items from surfaces. Keep furniture and decor.',
  'moderate': 'Remove clutter, personal items, and excess decorations from all surfaces, counters, and floors. Keep furniture but create a cleaner, more spacious look.',
  'full': 'Remove ALL loose items, decorations, and personal belongings. Create a minimalist, model-home appearance. Keep only essential furniture.',
};

/**
 * Get the prompt for a specific tool based on locked presets
 */
export function getLockedPrompt(
  toolId: string,
  presets: LockedPresets
): string | undefined {
  switch (toolId) {
    case 'sky-replacement':
      return presets.skyPrompt;
    case 'virtual-twilight':
      return presets.twilightPrompt;
    case 'lawn-repair':
      return presets.lawnPrompt;
    case 'virtual-staging':
      return presets.stagingPrompt;
    case 'declutter':
      return presets.declutterPrompt;
    default:
      return undefined;
  }
}
