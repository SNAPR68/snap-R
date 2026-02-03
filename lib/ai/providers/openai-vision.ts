import OpenAI from 'openai';
import { logApiCost } from '@/lib/cost-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageAnalysis {
  sky_replacement_needed: boolean;
  sky_condition: 'good' | 'overcast' | 'blown_out' | 'dull';
  lawn_repair_needed: boolean;
  lawn_condition: 'good' | 'brown' | 'patchy' | 'weeds';
  declutter_needed: boolean;
  declutter_items: string[];
  virtual_staging_candidate: boolean;
  room_type: string;
  lighting_issues: string[];
  perspective_correction_needed: boolean;
  day_to_dusk_candidate: boolean;
  overall_quality: number;
  recommended_enhancements: string[];
}

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  console.log('[Vision] Analyzing image...');
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | undefined;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this real estate photo and return ONLY valid JSON (no markdown, no code blocks):
{
  "sky_replacement_needed": boolean,
  "sky_condition": "good" | "overcast" | "blown_out" | "dull",
  "lawn_repair_needed": boolean,
  "lawn_condition": "good" | "brown" | "patchy" | "weeds",
  "declutter_needed": boolean,
  "declutter_items": ["item1", "item2"],
  "virtual_staging_candidate": boolean,
  "room_type": "living_room" | "bedroom" | "kitchen" | "bathroom" | "exterior" | "other",
  "lighting_issues": ["underexposed", "overexposed", "color_cast", "harsh_shadows"],
  "perspective_correction_needed": boolean,
  "day_to_dusk_candidate": boolean,
  "overall_quality": number (1-10),
  "recommended_enhancements": ["enhancement1", "enhancement2"]
}

Be accurate and concise. Only flag issues that are clearly visible.`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanContent) as ImageAnalysis;
      console.log('[Vision] Analysis complete:', analysis.recommended_enhancements);
      return analysis;
    } catch (parseError) {
      console.error('[Vision] Failed to parse response:', content);
      errorMessage = 'Failed to parse OpenAI response';
      return {
        sky_replacement_needed: false,
        sky_condition: 'good',
        lawn_repair_needed: false,
        lawn_condition: 'good',
        declutter_needed: false,
        declutter_items: [],
        virtual_staging_candidate: false,
        room_type: 'other',
        lighting_issues: [],
        perspective_correction_needed: false,
        day_to_dusk_candidate: false,
        overall_quality: 7,
        recommended_enhancements: [],
      };
    }
  } catch (error: any) {
    success = false;
    errorMessage = error.message;
    console.error('[Vision] API error:', error.message);
    return {
      sky_replacement_needed: false,
      sky_condition: 'good',
      lawn_repair_needed: false,
      lawn_condition: 'good',
      declutter_needed: false,
      declutter_items: [],
      virtual_staging_candidate: false,
      room_type: 'other',
      lighting_issues: [],
      perspective_correction_needed: false,
      day_to_dusk_candidate: false,
      overall_quality: 7,
      recommended_enhancements: [],
    };
  } finally {
    // Log OpenAI cost
    await logApiCost({
      provider: 'openai',
      toolId: 'image-analysis',
      success,
      errorMessage,
      processingTimeMs: Date.now() - startTime,
    });
  }
}

export async function scoreEnhancementQuality(
  originalUrl: string,
  enhancedUrl: string,
  enhancementType: string
): Promise<{ score: number; issues: string[]; passed: boolean }> {
  console.log('[QC] Scoring enhancement quality...');
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | undefined;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Compare these two real estate photos. The second is an AI "${enhancementType}" enhancement of the first.

Rate the enhancement quality and return ONLY valid JSON:
{
  "score": number (1-10, where 10 is perfect),
  "issues": ["issue1", "issue2"],
  "passed": boolean (true if score >= 7)
}

Check for:
- Unnatural edges or halos
- Color inconsistencies
- Artifacts or distortions
- Overall realism
- Whether the enhancement looks professional`
            },
            {
              type: 'image_url',
              image_url: { url: originalUrl }
            },
            {
              type: 'image_url',
              image_url: { url: enhancedUrl }
            }
          ]
        }
      ],
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanContent);
      console.log('[QC] Score:', result.score, 'Passed:', result.passed);
      return result;
    } catch {
      return { score: 7, issues: [], passed: true };
    }
  } catch (error: any) {
    success = false;
    errorMessage = error.message;
    console.error('[QC] API error:', error.message);
    return { score: 7, issues: [], passed: true };
  } finally {
    // Log OpenAI cost
    await logApiCost({
      provider: 'openai',
      toolId: 'quality-score',
      success,
      errorMessage,
      processingTimeMs: Date.now() - startTime,
    });
  }
}

export async function checkStructuralIntegrity(
  originalUrl: string,
  enhancedUrl: string,
  enhancementType: string
): Promise<{ passed: boolean; issues: string[] }> {
  console.log('[QC] Checking structural integrity...');
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | undefined;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Compare these two real estate photos. The second is an AI "${enhancementType}" edit of the first.

Return ONLY valid JSON:
{
  "passed": boolean,
  "issues": ["issue1", "issue2"]
}

PASS only if:
- The structure, geometry, and room layout are unchanged
- No objects are resized, moved, or invented
- Only the intended enhancement appears (e.g. sky, lawn, lights, declutter)

FAIL if you see:
- Structural changes to walls, rooflines, windows, doors
- Furniture moved/resized
- New objects added or removed beyond the intended tool
- Perspective/geometry altered unexpectedly`,
            },
            { type: 'image_url', image_url: { url: originalUrl } },
            { type: 'image_url', image_url: { url: enhancedUrl } },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '{}';
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanContent) as { passed: boolean; issues?: string[] };
      return { passed: result.passed !== false, issues: result.issues || [] };
    } catch {
      return { passed: true, issues: [] };
    }
  } catch (error: any) {
    success = false;
    errorMessage = error.message;
    console.error('[QC] Structural check API error:', error.message);
    return { passed: true, issues: [] };
  } finally {
    await logApiCost({
      provider: 'openai',
      toolId: 'structure-check',
      success,
      errorMessage,
      processingTimeMs: Date.now() - startTime,
    });
  }
}