// app/api/video/voiceover/route.ts
// AI Voiceover Generation API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

// Voice mappings to ElevenLabs voice IDs
const VOICE_MAP: Record<string, { elevenLabsId: string; openAIVoice: string }> = {
  'professional-male': { elevenLabsId: 'VR6AewLTigWG4xSOukaG', openAIVoice: 'onyx' },
  'professional-female': { elevenLabsId: 'EXAVITQu4vr4xnSDxMaL', openAIVoice: 'nova' },
  'luxury-male': { elevenLabsId: 'onwK4e9ZLuTAKqWW03F9', openAIVoice: 'echo' },
  'luxury-female': { elevenLabsId: 'jBpfuIE2acCO8z3wKNLl', openAIVoice: 'shimmer' },
  'friendly-male': { elevenLabsId: 'TxGEqnHWrfWFTfGW9XjX', openAIVoice: 'fable' },
  'friendly-female': { elevenLabsId: 'XB0fDUnXU5powFXDhCwa', openAIVoice: 'alloy' },
}

// Script style prompts
const STYLE_PROMPTS: Record<string, string> = {
  professional: 'Write in a professional, confident tone suitable for high-end real estate marketing. Use sophisticated vocabulary but remain accessible.',
  luxury: 'Write in an elegant, sophisticated tone for luxury properties. Emphasize exclusivity, premium features, and lifestyle. Use refined language.',
  friendly: 'Write in a warm, friendly, and approachable tone. Make viewers feel welcome and excited about the property. Use conversational language.',
  firstTimeBuyer: 'Write for first-time home buyers. Be helpful, informative, and reassuring. Highlight practical features and value.',
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'generate-script') {
      return handleGenerateScript(body)
    } else if (action === 'generate-audio') {
      return handleGenerateAudio(body)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Voiceover API error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

async function handleGenerateScript(body: any) {
  const { propertyDetails, style, duration } = body

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.professional
  const targetWordCount = Math.round((duration / 60) * 130) // ~130 words per minute for narration

  const prompt = `Write a compelling real estate video narration script for this property:

Property Details:
${propertyDetails.address ? `- Address: ${propertyDetails.address}` : ''}
${propertyDetails.price ? `- Price: ${propertyDetails.price}` : ''}
${propertyDetails.bedrooms ? `- Bedrooms: ${propertyDetails.bedrooms}` : ''}
${propertyDetails.bathrooms ? `- Bathrooms: ${propertyDetails.bathrooms}` : ''}
${propertyDetails.sqft ? `- Square Feet: ${propertyDetails.sqft.toLocaleString()}` : ''}
${propertyDetails.neighborhood ? `- Location: ${propertyDetails.neighborhood}` : ''}
${propertyDetails.features?.length ? `- Features: ${propertyDetails.features.join(', ')}` : ''}

Requirements:
- Target length: approximately ${targetWordCount} words (${duration} second video)
- Style: ${style}
- Include a call to action at the end
- Write as continuous narration, no scene directions or brackets
- Start with an engaging hook about the property
- End with a compelling call to action

Write the script now:`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert real estate copywriter who creates compelling video narration scripts. ${stylePrompt}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const script = data.choices[0]?.message?.content || ''

    return NextResponse.json({ script })
  } catch (error: any) {
    console.error('Script generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleGenerateAudio(body: any) {
  const { script, voiceId } = body

  if (!script) {
    return NextResponse.json({ error: 'Script is required' }, { status: 400 })
  }

  const voiceConfig = VOICE_MAP[voiceId] || VOICE_MAP['professional-female']

  // Try ElevenLabs first
  if (ELEVENLABS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.elevenLabsId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: script,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
            },
          }),
        }
      )

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const wordCount = script.split(/\s+/).length
        const estimatedDuration = Math.round((wordCount / 130) * 60)

        return NextResponse.json({
          audioUrl: `data:audio/mpeg;base64,${base64}`,
          duration: estimatedDuration,
          provider: 'elevenlabs',
        })
      }
      
      console.log('ElevenLabs failed, falling back to OpenAI TTS')
    } catch (e) {
      console.log('ElevenLabs error, falling back to OpenAI TTS:', e)
    }
  }

  // Fallback to OpenAI TTS
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'No TTS API keys configured' }, { status: 500 })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: script,
        voice: voiceConfig.openAIVoice,
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      throw new Error('OpenAI TTS API error')
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const wordCount = script.split(/\s+/).length
    const estimatedDuration = Math.round((wordCount / 130) * 60)

    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${base64}`,
      duration: estimatedDuration,
      provider: 'openai',
    })
  } catch (error: any) {
    console.error('OpenAI TTS error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
