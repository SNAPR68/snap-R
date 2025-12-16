import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type DescriptionTone = 'professional' | 'luxury' | 'casual' | 'first_time_buyer';
export type DescriptionLength = 'short' | 'medium' | 'full';

export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  yearBuilt?: number;
  propertyType?: string;
  style?: string;
  // Detected from photos
  hasPool?: boolean;
  hasGarage?: boolean;
  hasFireplace?: boolean;
  hasView?: boolean;
  viewType?: string;
  kitchenStyle?: string;
  flooringType?: string;
  outdoorFeatures?: string[];
  interiorFeatures?: string[];
  condition?: string;
}

export interface GeneratedDescription {
  headline: string;
  description: string;
  seoKeywords: string[];
  detectedFeatures: PropertyFeatures;
  photoAnalysis: PhotoAnalysisSummary[];
  characterCount: number;
  wordCount: number;
}

export interface PhotoAnalysisSummary {
  photoIndex: number;
  roomType: string;
  keyFeatures: string[];
  atmosphere: string;
}

const TONE_INSTRUCTIONS: Record<DescriptionTone, string> = {
  professional: `Write in a professional, agent-quality tone. Focus on facts, features, and value propositions. Use industry-standard terminology. Be confident but not exaggerated.`,
  
  luxury: `Write in an upscale, sophisticated tone befitting a luxury property. Use evocative language that appeals to discerning buyers. Emphasize exclusivity, craftsmanship, and lifestyle. Words like "exquisite," "prestigious," "unparalleled," and "bespoke" are appropriate.`,
  
  casual: `Write in a warm, friendly, conversational tone. Make it feel welcoming and approachable. Use language like "you'll love" and "imagine yourself." Appeal to emotions and lifestyle rather than just features.`,
  
  first_time_buyer: `Write for first-time home buyers. Explain features in accessible terms (avoid jargon). Emphasize value, potential, and the joy of homeownership. Be encouraging and highlight move-in ready aspects or easy improvements.`,
};

const LENGTH_TARGETS: Record<DescriptionLength, { min: number; max: number; wordTarget: number }> = {
  short: { min: 100, max: 200, wordTarget: 30 },
  medium: { min: 400, max: 600, wordTarget: 100 },
  full: { min: 1500, max: 2500, wordTarget: 400 },
};

const PHOTO_ANALYSIS_PROMPT = `Analyze these real estate listing photos and identify:

1. ROOM TYPES: What rooms/spaces are shown?
2. KEY FEATURES: Notable features visible (pool, fireplace, high ceilings, hardwood floors, granite counters, stainless appliances, etc.)
3. STYLE: Property style (modern, traditional, farmhouse, contemporary, mediterranean, colonial, etc.)
4. CONDITION: Overall condition (move-in ready, well-maintained, needs updating, etc.)
5. ATMOSPHERE: The feeling/vibe (bright, cozy, spacious, elegant, family-friendly, etc.)
6. OUTDOOR: Any outdoor features (pool, deck, patio, landscaping, views, etc.)
7. SPECIAL ELEMENTS: Anything unique or noteworthy

RESPOND IN THIS EXACT JSON FORMAT:
{
  "propertyStyle": "modern farmhouse",
  "condition": "move-in ready",
  "atmosphere": "bright and welcoming",
  "detectedFeatures": {
    "hasPool": false,
    "hasGarage": true,
    "hasFireplace": true,
    "hasView": true,
    "viewType": "mountain",
    "kitchenStyle": "open concept with island",
    "flooringType": "hardwood and tile",
    "outdoorFeatures": ["covered patio", "landscaped yard"],
    "interiorFeatures": ["high ceilings", "crown molding", "recessed lighting"]
  },
  "roomAnalysis": [
    {"roomType": "exterior-front", "keyFeatures": ["curb appeal", "mature trees"], "atmosphere": "welcoming"},
    {"roomType": "kitchen", "keyFeatures": ["granite counters", "stainless appliances", "island"], "atmosphere": "modern and functional"},
    {"roomType": "living-room", "keyFeatures": ["fireplace", "large windows", "high ceilings"], "atmosphere": "spacious and bright"}
  ]
}`;

export async function analyzePhotosForDescription(photoUrls: string[]): Promise<{
  features: PropertyFeatures;
  analysis: PhotoAnalysisSummary[];
  style: string;
  condition: string;
  atmosphere: string;
}> {
  if (!photoUrls.length) {
    return {
      features: {},
      analysis: [],
      style: 'residential',
      condition: 'well-maintained',
      atmosphere: 'inviting',
    };
  }

  // Analyze up to 10 photos for description generation
  const photosToAnalyze = photoUrls.slice(0, 10);
  
  try {
    const imageContent = photosToAnalyze.map(url => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'low' as const } // Use low detail for faster/cheaper analysis
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PHOTO_ANALYSIS_PROMPT },
          ...imageContent
        ]
      }],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    let jsonStr = content.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr);

    return {
      features: result.detectedFeatures || {},
      analysis: (result.roomAnalysis || []).map((r: any, i: number) => ({
        photoIndex: i,
        roomType: r.roomType || 'unknown',
        keyFeatures: r.keyFeatures || [],
        atmosphere: r.atmosphere || '',
      })),
      style: result.propertyStyle || 'residential',
      condition: result.condition || 'well-maintained',
      atmosphere: result.atmosphere || 'inviting',
    };
  } catch (error: any) {
    console.error('[Description Generator] Photo analysis error:', error.message);
    return {
      features: {},
      analysis: [],
      style: 'residential',
      condition: 'well-maintained',
      atmosphere: 'inviting',
    };
  }
}

export async function generateListingDescription(
  photoUrls: string[],
  listingData: {
    title?: string;
    address?: string;
    city?: string;
    state?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
    price?: number;
    propertyType?: string;
  },
  tone: DescriptionTone = 'professional',
  length: DescriptionLength = 'medium'
): Promise<GeneratedDescription> {
  console.log(`[Description Generator] Generating ${tone} ${length} description...`);
  
  // First, analyze photos
  const photoAnalysis = await analyzePhotosForDescription(photoUrls);
  
  // Merge listing data with detected features
  const features: PropertyFeatures = {
    bedrooms: listingData.beds,
    bathrooms: listingData.baths,
    sqft: listingData.sqft,
    propertyType: listingData.propertyType || 'Single Family Home',
    style: photoAnalysis.style,
    condition: photoAnalysis.condition,
    ...photoAnalysis.features,
  };

  const lengthSpec = LENGTH_TARGETS[length];
  
  const descriptionPrompt = `You are an expert real estate copywriter who writes compelling MLS listing descriptions that SELL homes.

PROPERTY DETAILS:
- Address: ${listingData.address || 'Not specified'}, ${listingData.city || ''}, ${listingData.state || ''}
- Bedrooms: ${listingData.beds || 'Not specified'}
- Bathrooms: ${listingData.baths || 'Not specified'}
- Square Feet: ${listingData.sqft ? listingData.sqft.toLocaleString() : 'Not specified'}
- Property Type: ${features.propertyType}
- Style: ${photoAnalysis.style}
- Condition: ${photoAnalysis.condition}

FEATURES DETECTED FROM PHOTOS:
${JSON.stringify(photoAnalysis.features, null, 2)}

ROOM ANALYSIS:
${photoAnalysis.analysis.map(r => `- ${r.roomType}: ${r.keyFeatures.join(', ')} (${r.atmosphere})`).join('\n')}

OVERALL ATMOSPHERE: ${photoAnalysis.atmosphere}

WRITING INSTRUCTIONS:
${TONE_INSTRUCTIONS[tone]}

LENGTH REQUIREMENT: Write approximately ${lengthSpec.wordTarget} words (${lengthSpec.min}-${lengthSpec.max} characters).

IMPORTANT RULES:
1. DO NOT make up specific details not provided (no fake addresses, prices, or square footage)
2. Focus on what you can SEE in the photos
3. Use active, engaging language
4. Include a compelling opening hook
5. End with a call-to-action
6. Make it MLS-ready (no ALL CAPS, proper punctuation)

RESPOND IN THIS EXACT JSON FORMAT:
{
  "headline": "A short, catchy headline (under 10 words)",
  "description": "The full property description...",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: descriptionPrompt
      }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON
    let jsonStr = content.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr);

    const description = result.description || '';
    
    console.log(`[Description Generator] Generated ${description.length} chars, ${description.split(/\s+/).length} words`);

    return {
      headline: result.headline || 'Beautiful Home Awaits',
      description,
      seoKeywords: result.seoKeywords || [],
      detectedFeatures: features,
      photoAnalysis: photoAnalysis.analysis,
      characterCount: description.length,
      wordCount: description.split(/\s+/).filter(Boolean).length,
    };
  } catch (error: any) {
    console.error('[Description Generator] Generation error:', error.message);
    throw new Error(`Failed to generate description: ${error.message}`);
  }
}

export function calculateDescriptionCost(photoCount: number): number {
  // Photo analysis: ~$0.01 per photo (low detail)
  // Description generation: ~$0.02
  const photoAnalysisCost = Math.min(photoCount, 10) * 0.01;
  const generationCost = 0.02;
  return photoAnalysisCost + generationCost;
}

// Regenerate with different tone/length without re-analyzing photos
export async function regenerateDescription(
  cachedAnalysis: {
    features: PropertyFeatures;
    analysis: PhotoAnalysisSummary[];
    style: string;
    condition: string;
    atmosphere: string;
  },
  listingData: {
    title?: string;
    address?: string;
    city?: string;
    state?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
    price?: number;
    propertyType?: string;
  },
  tone: DescriptionTone = 'professional',
  length: DescriptionLength = 'medium'
): Promise<GeneratedDescription> {
  const features: PropertyFeatures = {
    bedrooms: listingData.beds,
    bathrooms: listingData.baths,
    sqft: listingData.sqft,
    propertyType: listingData.propertyType || 'Single Family Home',
    style: cachedAnalysis.style,
    condition: cachedAnalysis.condition,
    ...cachedAnalysis.features,
  };

  const lengthSpec = LENGTH_TARGETS[length];

  const descriptionPrompt = `You are an expert real estate copywriter who writes compelling MLS listing descriptions that SELL homes.

PROPERTY DETAILS:
- Address: ${listingData.address || 'Not specified'}, ${listingData.city || ''}, ${listingData.state || ''}
- Bedrooms: ${listingData.beds || 'Not specified'}
- Bathrooms: ${listingData.baths || 'Not specified'}
- Square Feet: ${listingData.sqft ? listingData.sqft.toLocaleString() : 'Not specified'}
- Property Type: ${features.propertyType}
- Style: ${cachedAnalysis.style}
- Condition: ${cachedAnalysis.condition}

FEATURES DETECTED FROM PHOTOS:
${JSON.stringify(cachedAnalysis.features, null, 2)}

ROOM ANALYSIS:
${cachedAnalysis.analysis.map(r => `- ${r.roomType}: ${r.keyFeatures.join(', ')} (${r.atmosphere})`).join('\n')}

OVERALL ATMOSPHERE: ${cachedAnalysis.atmosphere}

WRITING INSTRUCTIONS:
${TONE_INSTRUCTIONS[tone]}

LENGTH REQUIREMENT: Write approximately ${lengthSpec.wordTarget} words (${lengthSpec.min}-${lengthSpec.max} characters).

RESPOND IN THIS EXACT JSON FORMAT:
{
  "headline": "A short, catchy headline (under 10 words)",
  "description": "The full property description...",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: descriptionPrompt }],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || '';
  
  let jsonStr = content.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
  }

  const result = JSON.parse(jsonStr);
  const description = result.description || '';

  return {
    headline: result.headline || 'Beautiful Home Awaits',
    description,
    seoKeywords: result.seoKeywords || [],
    detectedFeatures: features,
    photoAnalysis: cachedAnalysis.analysis,
    characterCount: description.length,
    wordCount: description.split(/\s+/).filter(Boolean).length,
  };
}
