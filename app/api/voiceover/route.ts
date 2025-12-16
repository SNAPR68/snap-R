export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  generateVoiceover, 
  generateScript,
  VOICE_OPTIONS, 
  SCRIPT_STYLES,
  VOICEOVER_PRICING 
} from '@/lib/video/voiceover-service';

// POST - Generate voiceover
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      listingId,
      propertyDetails,
      style = 'professional',
      voiceId = 'professional-male',
      duration = 60,
      includeCallToAction = true,
      agentName,
      agentPhone,
      customScript,
      scriptOnly = false, // If true, only generate script without audio
    } = body;

    // Validate inputs
    if (!SCRIPT_STYLES[style as keyof typeof SCRIPT_STYLES]) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
    }

    if (!VOICE_OPTIONS[voiceId as keyof typeof VOICE_OPTIONS]) {
      return NextResponse.json({ error: 'Invalid voice' }, { status: 400 });
    }

    // Get pricing
    const pricing = VOICEOVER_PRICING[duration.toString() as keyof typeof VOICEOVER_PRICING] 
      || VOICEOVER_PRICING['60'];

    // If script only, just generate the script
    if (scriptOnly) {
      const script = await generateScript(
        propertyDetails || {},
        style as any,
        duration,
        includeCallToAction,
        agentName,
        agentPhone
      );

      return NextResponse.json({
        success: true,
        script,
        pricing,
      });
    }

    // Generate full voiceover
    const result = await generateVoiceover({
      propertyDetails: propertyDetails || {},
      style: style as any,
      voiceId: voiceId as any,
      duration,
      includeCallToAction,
      agentName,
      agentPhone,
      customScript,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log to api_costs
    const { error: costError } = await supabase
      .from('api_costs')
      .insert({
        user_id: user.id,
        provider: 'elevenlabs',
        model: 'eleven_monolingual_v1',
        operation: 'voiceover',
        input_tokens: result.scriptText?.length || 0,
        output_tokens: 0,
        estimated_cost: pricing.price * 0.1, // Rough API cost estimate
        metadata: {
          listing_id: listingId,
          voice_id: voiceId,
          style,
          duration: result.duration,
        },
      });

    if (costError) {
      console.error('Failed to log cost:', costError);
    }

    return NextResponse.json({
      success: true,
      script: result.scriptText,
      audioUrl: result.audioUrl,
      duration: result.duration,
      pricing,
    });

  } catch (error: any) {
    console.error('Voiceover API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get available voices and styles
export async function GET(request: NextRequest) {
  return NextResponse.json({
    voices: Object.values(VOICE_OPTIONS),
    styles: Object.values(SCRIPT_STYLES),
    pricing: VOICEOVER_PRICING,
  });
}
