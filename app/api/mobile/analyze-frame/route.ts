/**
 * POST /api/mobile/analyze-frame
 * Lightweight GPT-4o Vision analysis for mobile camera frames.
 * Returns room type, composition score, lighting score, tips, and capture recommendation.
 *
 * Used by the AI Director camera for on-demand server-side analysis
 * when the user taps "Analyze" or holds steady before capture.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

import { logger } from '@/lib/logger';
const FRAME_ANALYSIS_PROMPT = `You are a real estate photography AI assistant analyzing a live camera frame.
Your job is to give quick, actionable feedback to help the user take a better photo.

Analyze this camera frame and return ONLY valid JSON (no markdown):

{
  "roomType": "exterior_front|exterior_back|exterior_side|interior_living|interior_kitchen|interior_bedroom|interior_bathroom|interior_dining|interior_office|interior_other|drone|detail|unknown",
  "roomConfidence": 0-100,
  "compositionScore": 0-100,
  "lightingScore": 0-100,
  "overallScore": 0-100,
  "tips": ["tip1", "tip2"],
  "captureRecommended": true/false
}

SCORING GUIDE:
- compositionScore: Rule of thirds, straight verticals, good framing, no obstructions
- lightingScore: Even lighting, no harsh shadows, not too dark, not blown out
- overallScore: Weighted average (composition 40%, lighting 40%, sharpness 20%)
- captureRecommended: true if overallScore >= 70

TIPS (max 3, short actionable phrases):
- "Move camera left for better framing"
- "Tilt up slightly to show more ceiling"
- "Turn on all room lights"
- "Step back for a wider shot"
- "Hold steady — great angle!"
- "Try landscape orientation"
- "Open curtains for natural light"`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const imageFile = formData.get('image');

  if (!imageFile || !(imageFile instanceof Blob)) {
    return NextResponse.json({ error: 'Image file required' }, { status: 400 });
  }

  // Convert to base64
  const arrayBuffer = await imageFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = imageFile.type || 'image/jpeg';

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: FRAME_ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'low', // Low detail for speed — this is real-time guidance
              },
            },
          ],
        },
      ],
    }, {
      signal: AbortSignal.timeout(15000),
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No analysis returned' }, { status: 500 });
    }

    // Parse JSON from response (strip any markdown wrapping)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(jsonStr) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      analysis: {
        roomType: analysis.roomType ?? 'unknown',
        roomConfidence: Number(analysis.roomConfidence) || 0,
        compositionScore: Number(analysis.compositionScore) || 0,
        lightingScore: Number(analysis.lightingScore) || 0,
        overallScore: Number(analysis.overallScore) || 0,
        tips: Array.isArray(analysis.tips) ? analysis.tips.slice(0, 3) : [],
        captureRecommended: Boolean(analysis.captureRecommended),
      },
    });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : 'Analysis failed';
    logger.error('[analyze-frame] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
