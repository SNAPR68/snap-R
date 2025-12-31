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
  
  // Determine best sky preset based on listing quality
  let skyPreset: LockedPresets['skyPreset'] = 'dramatic-clouds';
  const heroCandidate = analyses.find(a => a.heroScore > 80 && a.photoType === 'exterior_front');
  
  if (heroCandidate && heroCandidate.twilightCandidate && heroCandidate.twilightScore > 85) {
    // Premium listing - dramatic clouds work best
    skyPreset = 'dramatic-clouds';
  } else if (hasBadSky && !hasGoodSky) {
    // All bad sky - use clear blue for clean look
    skyPreset = 'clear-blue';
  } else {
    // Mixed - dramatic clouds for visual impact
    skyPreset = 'dramatic-clouds';
  }
  
  // Determine twilight preset - blue hour is most universally appealing
  const twilightCandidates = analyses.filter(a => a.twilightCandidate && a.twilightScore > 75);
  let twilightPreset: LockedPresets['twilightPreset'] = 'blue-hour';
  
  if (twilightCandidates.length > 0) {
    // Check if listing is luxury (high hero scores)
    const avgHeroScore = analyses.reduce((sum, a) => sum + a.heroScore, 0) / analyses.length;
    if (avgHeroScore > 75) {
      twilightPreset = 'golden-hour'; // Luxury gets warm golden
    }
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
  'clear-blue': 'Replace ONLY the sky with a perfectly clear bright blue sky with minimal clouds. Crisp, clean real estate photography look. Do NOT change the house, trees, lawn, or anything else.',
  'sunset': 'Replace ONLY the sky with a beautiful golden sunset - warm orange and pink colors at the horizon fading to soft blue above. Do NOT change the house, trees, lawn, or anything else.',
  'dramatic-clouds': 'Replace ONLY the sky with dramatic white fluffy cumulus clouds against a deep vivid blue sky. Eye-catching real estate photography. Do NOT change the house, trees, lawn, or anything else.',
  'twilight': 'Replace ONLY the sky with a twilight gradient - deep blue at top transitioning to warm purple-orange at the horizon. Dusk atmosphere. Do NOT change the house or anything else.',
};

const TWILIGHT_PROMPTS: Record<LockedPresets['twilightPreset'], string> = {
  'dusk': 'Transform into early dusk with purple-orange sky at horizon, soft twilight beginning, warm glow starting in windows. Keep house structure exactly the same.',
  'blue-hour': 'Transform into BLUE HOUR. Make the sky a rich DEEP BLUE color - no orange, no pink, just beautiful deep blue twilight. All windows should glow with bright warm YELLOW light creating contrast against the blue sky. Cool blue atmosphere with warm window glow.',
  'golden-hour': 'Transform into GOLDEN HOUR twilight. The sky should show warm ORANGE and PINK sunset colors with golden light. Add bright warm yellow light glowing from every window. The scene should feel cozy and inviting with golden warm tones.',
  'night': 'Transform into a NIGHT scene. Make the sky completely DARK - deep black-blue with visible stars. Turn on ALL lights in the house with BRIGHT warm yellow-orange glow from every window. Strong contrast between dark sky and bright windows.',
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
