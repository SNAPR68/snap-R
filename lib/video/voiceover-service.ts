// AI Video Voiceover Service
// Generates professional narration for property videos using AI

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Voice options for narration
export const VOICE_OPTIONS = {
  'professional-male': {
    id: 'professional-male',
    name: 'James (Professional)',
    description: 'Confident, professional male voice',
    elevenLabsId: 'VR6AewLTigWG4xSOukaG', // Josh
    gender: 'male',
    style: 'professional',
    preview: '/voices/james-preview.mp3',
  },
  'professional-female': {
    id: 'professional-female', 
    name: 'Sarah (Professional)',
    description: 'Warm, professional female voice',
    elevenLabsId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    gender: 'female',
    style: 'professional',
    preview: '/voices/sarah-preview.mp3',
  },
  'luxury-male': {
    id: 'luxury-male',
    name: 'Richard (Luxury)',
    description: 'Sophisticated, upscale male voice',
    elevenLabsId: 'onwK4e9ZLuTAKqWW03F9', // Daniel
    gender: 'male',
    style: 'luxury',
    preview: '/voices/richard-preview.mp3',
  },
  'luxury-female': {
    id: 'luxury-female',
    name: 'Victoria (Luxury)',
    description: 'Elegant, refined female voice',
    elevenLabsId: 'jBpfuIE2acCO8z3wKNLl', // Emily
    gender: 'female',
    style: 'luxury',
    preview: '/voices/victoria-preview.mp3',
  },
  'friendly-male': {
    id: 'friendly-male',
    name: 'Mike (Friendly)',
    description: 'Warm, approachable male voice',
    elevenLabsId: 'TxGEqnHWrfWFTfGW9XjX', // Josh
    gender: 'male',
    style: 'friendly',
    preview: '/voices/mike-preview.mp3',
  },
  'friendly-female': {
    id: 'friendly-female',
    name: 'Emma (Friendly)',
    description: 'Cheerful, welcoming female voice',
    elevenLabsId: 'XB0fDUnXU5powFXDhCwa', // Charlotte
    gender: 'female',
    style: 'friendly',
    preview: '/voices/emma-preview.mp3',
  },
} as const;

export type VoiceId = keyof typeof VOICE_OPTIONS;

// Script styles
export const SCRIPT_STYLES = {
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Formal, business-like tone',
    systemPrompt: 'Write in a professional, confident tone suitable for high-end real estate marketing. Use sophisticated vocabulary but remain accessible.',
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury',
    description: 'Upscale, exclusive tone',
    systemPrompt: 'Write in an elegant, sophisticated tone for luxury properties. Emphasize exclusivity, premium features, and lifestyle. Use refined language.',
  },
  friendly: {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, welcoming tone',
    systemPrompt: 'Write in a warm, friendly, and approachable tone. Make viewers feel welcome and excited about the property. Use conversational language.',
  },
  firstTimeBuyer: {
    id: 'firstTimeBuyer',
    name: 'First-Time Buyer',
    description: 'Helpful, informative tone',
    systemPrompt: 'Write for first-time home buyers. Be helpful, informative, and reassuring. Highlight practical features and value.',
  },
} as const;

export type ScriptStyle = keyof typeof SCRIPT_STYLES;

interface PropertyDetails {
  address?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  features?: string[];
  highlights?: string[];
  neighborhood?: string;
  yearBuilt?: number;
}

interface VoiceoverRequest {
  propertyDetails: PropertyDetails;
  style: ScriptStyle;
  voiceId: VoiceId;
  duration?: number; // Target duration in seconds (30, 60, 90, 120)
  includeCallToAction?: boolean;
  agentName?: string;
  agentPhone?: string;
  customScript?: string; // User can provide their own script
}

interface VoiceoverResult {
  success: boolean;
  scriptText?: string;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

// Generate script using GPT-4
export async function generateScript(
  propertyDetails: PropertyDetails,
  style: ScriptStyle,
  targetDuration: number = 60,
  includeCallToAction: boolean = true,
  agentName?: string,
  agentPhone?: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const styleConfig = SCRIPT_STYLES[style];
  
  // Calculate word count based on duration (avg 150 words per minute for narration)
  const targetWordCount = Math.round((targetDuration / 60) * 130); // Slightly slower for real estate
  
  const prompt = `Write a compelling real estate video narration script for this property:

Property Details:
${propertyDetails.address ? `- Address: ${propertyDetails.address}` : ''}
${propertyDetails.price ? `- Price: ${propertyDetails.price}` : ''}
${propertyDetails.bedrooms ? `- Bedrooms: ${propertyDetails.bedrooms}` : ''}
${propertyDetails.bathrooms ? `- Bathrooms: ${propertyDetails.bathrooms}` : ''}
${propertyDetails.sqft ? `- Square Feet: ${propertyDetails.sqft.toLocaleString()}` : ''}
${propertyDetails.yearBuilt ? `- Year Built: ${propertyDetails.yearBuilt}` : ''}
${propertyDetails.neighborhood ? `- Neighborhood: ${propertyDetails.neighborhood}` : ''}
${propertyDetails.features?.length ? `- Features: ${propertyDetails.features.join(', ')}` : ''}
${propertyDetails.highlights?.length ? `- Highlights: ${propertyDetails.highlights.join(', ')}` : ''}

Requirements:
- Target length: approximately ${targetWordCount} words (${targetDuration} second video)
- Style: ${styleConfig.name}
${includeCallToAction ? `- Include call to action at the end` : ''}
${agentName ? `- Agent name for CTA: ${agentName}` : ''}
${agentPhone ? `- Contact phone: ${agentPhone}` : ''}

Write the script as continuous narration, no scene directions or brackets. Start with an engaging hook about the property. End with a compelling call to action.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert real estate copywriter who creates compelling video narration scripts. ${styleConfig.systemPrompt}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate script');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Generate audio using ElevenLabs
export async function generateAudio(
  script: string,
  voiceId: VoiceId
): Promise<{ audioBuffer: Buffer; duration: number }> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voice = VOICE_OPTIONS[voiceId];
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.elevenLabsId}`,
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
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  
  // Estimate duration based on script length (rough estimate)
  const wordCount = script.split(/\s+/).length;
  const estimatedDuration = Math.round((wordCount / 130) * 60);

  return { audioBuffer, duration: estimatedDuration };
}

// Generate audio using OpenAI TTS (backup option)
export async function generateAudioOpenAI(
  script: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'onyx'
): Promise<{ audioBuffer: Buffer; duration: number }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: script,
      voice: voice,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate audio');
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  
  const wordCount = script.split(/\s+/).length;
  const estimatedDuration = Math.round((wordCount / 130) * 60);

  return { audioBuffer, duration: estimatedDuration };
}

// Main function to generate voiceover
export async function generateVoiceover(request: VoiceoverRequest): Promise<VoiceoverResult> {
  try {
    // Use custom script or generate one
    let script = request.customScript;
    
    if (!script) {
      script = await generateScript(
        request.propertyDetails,
        request.style,
        request.duration || 60,
        request.includeCallToAction ?? true,
        request.agentName,
        request.agentPhone
      );
    }

    // Try ElevenLabs first, fall back to OpenAI TTS
    let audioBuffer: Buffer;
    let duration: number;

    try {
      const result = await generateAudio(script, request.voiceId);
      audioBuffer = result.audioBuffer;
      duration = result.duration;
    } catch (elevenLabsError) {
      console.log('ElevenLabs failed, falling back to OpenAI TTS');
      // Map voice to OpenAI equivalent
      const openAIVoice = request.voiceId.includes('female') ? 'nova' : 'onyx';
      const result = await generateAudioOpenAI(script, openAIVoice);
      audioBuffer = result.audioBuffer;
      duration = result.duration;
    }

    // In production, upload audioBuffer to storage and return URL
    // For now, return as base64
    const audioBase64 = audioBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return {
      success: true,
      scriptText: script,
      audioUrl,
      duration,
    };
  } catch (error: any) {
    console.error('Voiceover generation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Pricing
export const VOICEOVER_PRICING = {
  '30': { seconds: 30, price: 5, credits: 2 },
  '60': { seconds: 60, price: 8, credits: 3 },
  '90': { seconds: 90, price: 12, credits: 5 },
  '120': { seconds: 120, price: 15, credits: 6 },
} as const;
