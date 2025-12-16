// Additional Enhancement Tools Configuration
// Snow removal, seasonal changes, reflection fix, power lines

export const SEASONAL_TOOLS = {
  'snow-removal': {
    id: 'snow-removal',
    name: 'Snow Removal',
    description: 'Remove snow from exterior photos - show the property in spring/summer',
    icon: 'Snowflake',
    category: 'SEASONAL',
    credits: 2,
    price: 4,
    prompt: 'Remove all snow from this real estate photo. Replace snowy ground with green grass lawn. Replace snow on roof with clean roof. Replace bare winter trees with full green leafy trees. Keep the house and all structures exactly the same. Make it look like a beautiful spring or summer day. Maintain photorealistic quality.',
    negativePrompt: 'snow, ice, winter, frost, bare trees, dead grass, brown lawn',
    beforeLabel: 'Winter',
    afterLabel: 'Spring/Summer',
  },
  'seasonal-spring': {
    id: 'seasonal-spring',
    name: 'Convert to Spring',
    description: 'Transform fall/winter scenes into vibrant spring',
    icon: 'Flower2',
    category: 'SEASONAL',
    credits: 2,
    price: 4,
    prompt: 'Transform this real estate exterior photo to spring season. Add blooming flowers, fresh green grass, green leafy trees, clear blue sky. Remove any dead leaves, brown grass, or winter elements. Keep the house exactly the same. Make colors vibrant and fresh. Photorealistic quality.',
    negativePrompt: 'fall leaves, autumn colors, brown, orange leaves, snow, winter, dead plants',
    beforeLabel: 'Current',
    afterLabel: 'Spring',
  },
  'seasonal-summer': {
    id: 'seasonal-summer',
    name: 'Convert to Summer',
    description: 'Transform any season into lush summer',
    icon: 'Sun',
    category: 'SEASONAL',
    credits: 2,
    price: 4,
    prompt: 'Transform this real estate exterior photo to peak summer. Lush green grass, full green trees, vibrant landscaping, bright sunny day with blue sky and white clouds. Remove any seasonal elements that are not summer. Keep the house exactly the same. Professional real estate photography quality.',
    negativePrompt: 'fall, autumn, winter, snow, dead grass, brown leaves, bare trees',
    beforeLabel: 'Current',
    afterLabel: 'Summer',
  },
  'seasonal-fall': {
    id: 'seasonal-fall',
    name: 'Convert to Fall',
    description: 'Add beautiful autumn colors to the scene',
    icon: 'Leaf',
    category: 'SEASONAL',
    credits: 2,
    price: 4,
    prompt: 'Transform this real estate exterior photo to beautiful autumn/fall season. Add gorgeous fall foliage with red, orange, and golden yellow leaves on trees. Warm autumn lighting. Some fallen leaves on green lawn. Keep the house exactly the same. Cozy, inviting fall atmosphere. Professional quality.',
    negativePrompt: 'snow, winter, summer green, spring flowers',
    beforeLabel: 'Current',
    afterLabel: 'Fall',
  },
  'reflection-removal': {
    id: 'reflection-removal',
    name: 'Window Reflection Fix',
    description: 'Remove unwanted reflections from windows and glass',
    icon: 'Square',
    category: 'FIX',
    credits: 2,
    price: 4,
    prompt: 'Remove all unwanted reflections from windows and glass surfaces in this real estate photo. Make windows clear and show what is behind them or make them appear clean and reflection-free. Remove photographer reflections, camera reflections, flash reflections, and any other unwanted reflections. Keep everything else exactly the same. Professional quality.',
    negativePrompt: 'reflection, glare, photographer visible, camera visible, flash reflection',
    beforeLabel: 'With Reflections',
    afterLabel: 'Clean Windows',
  },
  'power-line-removal': {
    id: 'power-line-removal',
    name: 'Power Line Removal',
    description: 'Remove power lines and utility wires from exterior shots',
    icon: 'Zap',
    category: 'FIX',
    credits: 2,
    price: 4,
    prompt: 'Remove all power lines, electrical wires, utility cables, telephone wires, and utility poles from this real estate exterior photo. Fill in the sky naturally where wires were removed. Keep the house and all other elements exactly the same. Clean, professional result.',
    negativePrompt: 'power lines, wires, cables, utility poles, electrical lines',
    beforeLabel: 'With Power Lines',
    afterLabel: 'Clean Sky',
  },
  'object-removal': {
    id: 'object-removal',
    name: 'Object Removal',
    description: 'Remove cars, trash bins, signs, and other distracting objects',
    icon: 'Eraser',
    category: 'FIX',
    credits: 2,
    price: 4,
    prompt: 'Remove distracting objects from this real estate photo including: parked cars in driveway, trash bins, garbage cans, for sale signs, construction materials, garden hoses, and any other items that distract from the property. Fill in naturally with appropriate ground, grass, or driveway. Keep the house exactly the same.',
    negativePrompt: 'cars, vehicles, trash bins, garbage, signs, clutter, hoses',
    beforeLabel: 'With Objects',
    afterLabel: 'Clean',
  },
  'flash-fix': {
    id: 'flash-fix',
    name: 'Flash Hotspot Fix',
    description: 'Fix harsh flash reflections and hotspots on surfaces',
    icon: 'Lightbulb',
    category: 'FIX',
    credits: 1,
    price: 2,
    prompt: 'Fix all flash hotspots and harsh flash reflections in this interior real estate photo. Remove bright white spots on walls, ceilings, floors, and surfaces caused by camera flash. Even out the lighting to look natural. Keep all furniture and room details exactly the same. Professional quality.',
    negativePrompt: 'flash hotspot, bright spot, overexposed, harsh lighting, white blob',
    beforeLabel: 'Flash Hotspots',
    afterLabel: 'Natural Lighting',
  },
  'lens-distortion-fix': {
    id: 'lens-distortion-fix',
    name: 'Lens Distortion Fix',
    description: 'Correct wide-angle lens distortion and barrel effect',
    icon: 'Aperture',
    category: 'FIX',
    credits: 1,
    price: 2,
    prompt: 'Correct lens distortion in this real estate photo. Fix barrel distortion, straighten curved lines, make vertical lines truly vertical, fix perspective issues. Walls should be straight, not curved. Maintain all details and quality.',
    negativePrompt: 'curved walls, barrel distortion, fisheye, bent lines',
    beforeLabel: 'Distorted',
    afterLabel: 'Corrected',
  },
} as const;

// Combine with existing tools for the enhance API
export const ALL_NEW_TOOLS = Object.keys(SEASONAL_TOOLS);

export type SeasonalToolId = keyof typeof SEASONAL_TOOLS;

// Helper to get tool config
export function getSeasonalTool(toolId: string) {
  return SEASONAL_TOOLS[toolId as SeasonalToolId];
}

// Build prompt for AI
export function buildSeasonalPrompt(toolId: string, customInstructions?: string): string {
  const tool = getSeasonalTool(toolId);
  if (!tool) return '';
  
  let prompt = tool.prompt;
  if (customInstructions) {
    prompt += ` Additional instructions: ${customInstructions}`;
  }
  return prompt;
}
