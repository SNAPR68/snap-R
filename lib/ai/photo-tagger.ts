import OpenAI from 'openai';
import { logApiCost } from '@/lib/cost-logger';
import { logger } from '@/lib/logger';

export interface PhotoTagResult {
  roomType: string;
  features: string[];
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  style: string;
  atmosphere: string;
  confidence: number;
  resoFeatures: Record<string, string[]>;
}

export interface PhotoTagInput {
  id: string;
  url: string;
}

const ROOM_TYPES = [
  'living_room', 'kitchen', 'bedroom', 'bathroom', 'dining_room',
  'home_office', 'basement', 'attic', 'garage', 'laundry_room',
  'entryway', 'hallway', 'closet', 'pantry', 'mudroom',
  'front_exterior', 'rear_exterior', 'side_exterior', 'aerial',
  'pool', 'patio', 'deck', 'garden', 'driveway',
  'gym', 'theater', 'wine_cellar', 'game_room', 'other',
] as const;

const RESO_MAPPING: Record<string, string> = {
  hardwood_floors: 'InteriorFeatures',
  granite_countertops: 'InteriorFeatures',
  stainless_appliances: 'InteriorFeatures',
  crown_molding: 'InteriorFeatures',
  fireplace: 'InteriorFeatures',
  vaulted_ceiling: 'InteriorFeatures',
  built_in_shelving: 'InteriorFeatures',
  island_kitchen: 'InteriorFeatures',
  walk_in_closet: 'InteriorFeatures',
  recessed_lighting: 'InteriorFeatures',
  open_floor_plan: 'InteriorFeatures',
  smart_home: 'InteriorFeatures',
  wet_bar: 'InteriorFeatures',
  skylight: 'InteriorFeatures',
  pool: 'ExteriorFeatures',
  hot_tub: 'ExteriorFeatures',
  outdoor_kitchen: 'ExteriorFeatures',
  deck: 'ExteriorFeatures',
  patio: 'ExteriorFeatures',
  fenced_yard: 'ExteriorFeatures',
  landscaped: 'ExteriorFeatures',
  sprinkler_system: 'ExteriorFeatures',
  covered_porch: 'ExteriorFeatures',
  solar_panels: 'GreenFeatures',
  energy_efficient_windows: 'GreenFeatures',
  ev_charger: 'GreenFeatures',
  water_view: 'View',
  mountain_view: 'View',
  city_view: 'View',
};

export async function tagPhoto(photo: PhotoTagInput): Promise<PhotoTagResult> {
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | undefined;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a real estate photo analyst. Analyze the property photo and return JSON with:
- roomType: one of ${ROOM_TYPES.join(', ')}
- features: array of detected features (e.g., hardwood_floors, granite_countertops, pool, fireplace)
- condition: one of excellent, good, fair, poor
- style: one word (modern, traditional, contemporary, farmhouse, colonial, craftsman, mediterranean, industrial, minimalist, luxury)
- atmosphere: one word (bright, cozy, spacious, elegant, warm, airy, dramatic, inviting)
- confidence: 0.0-1.0 how confident you are in the analysis

Return ONLY valid JSON, no markdown.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: photo.url, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }, { signal: AbortSignal.timeout(15000) });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from vision model');

    const raw = JSON.parse(content) as Record<string, unknown>;

    // Validate and normalize model output
    const VALID_CONDITIONS = ['excellent', 'good', 'fair', 'poor'];
    const parsed: PhotoTagResult = {
      roomType: typeof raw.roomType === 'string' ? raw.roomType : 'other',
      features: Array.isArray(raw.features) ? raw.features.filter((f): f is string => typeof f === 'string') : [],
      condition: typeof raw.condition === 'string' && VALID_CONDITIONS.includes(raw.condition) ? raw.condition as 'excellent' | 'good' | 'fair' | 'poor' : 'good',
      style: typeof raw.style === 'string' ? raw.style : 'unknown',
      atmosphere: typeof raw.atmosphere === 'string' ? raw.atmosphere : 'unknown',
      confidence: typeof raw.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0.5,
      resoFeatures: {},
    };
    parsed.resoFeatures = mapToResoFeatures(parsed.features);
    return parsed;
  } catch (error: unknown) {
    success = false;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    errorMessage = msg;
    logger.error('[PhotoTagger] Error:', msg);
    return {
      roomType: 'other',
      features: [],
      condition: 'good',
      style: 'unknown',
      atmosphere: 'unknown',
      confidence: 0,
      resoFeatures: {},
    };
  } finally {
    await logApiCost({
      provider: 'openai',
      toolId: 'photo-tagger',
      success,
      errorMessage,
      actualCost: 0.77, // GPT-4o vision low detail
      processingTimeMs: Date.now() - startTime,
    });
  }
}

export async function tagPhotoBatch(
  photos: PhotoTagInput[]
): Promise<Map<string, PhotoTagResult>> {
  const results = new Map<string, PhotoTagResult>();
  const batchSize = 5;

  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(tagPhoto));
    batch.forEach((photo, idx) => {
      results.set(photo.id, batchResults[idx]);
    });
  }

  return results;
}

export function aggregateListingFeatures(
  tags: PhotoTagResult[]
): {
  detectedFeatures: Record<string, string[]>;
  detectedStyle: string;
  detectedCondition: string;
} {
  const featureCounts = new Map<string, number>();
  const styleCounts = new Map<string, number>();
  const conditionCounts = new Map<string, number>();

  for (const tag of tags) {
    for (const feature of tag.features) {
      featureCounts.set(feature, (featureCounts.get(feature) ?? 0) + 1);
    }
    styleCounts.set(tag.style, (styleCounts.get(tag.style) ?? 0) + 1);
    conditionCounts.set(tag.condition, (conditionCounts.get(tag.condition) ?? 0) + 1);
  }

  // Group features by RESO category
  const grouped: Record<string, string[]> = {};
  for (const [feature] of featureCounts) {
    const category = RESO_MAPPING[feature] ?? 'OtherFeatures';
    if (!grouped[category]) grouped[category] = [];
    if (!grouped[category].includes(feature)) {
      grouped[category].push(feature);
    }
  }

  // Most common style and condition
  const topStyle = [...styleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
  const topCondition = [...conditionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'good';

  return {
    detectedFeatures: grouped,
    detectedStyle: topStyle,
    detectedCondition: topCondition,
  };
}

export function mapToResoFeatures(features: string[]): Record<string, string[]> {
  const reso: Record<string, string[]> = {};
  for (const feature of features) {
    const category = RESO_MAPPING[feature] ?? 'OtherFeatures';
    if (!reso[category]) reso[category] = [];
    if (!reso[category].includes(feature)) {
      reso[category].push(feature);
    }
  }
  return reso;
}
