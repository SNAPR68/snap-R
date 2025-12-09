import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface PropertyDetails {
  address?: string
  city?: string
  state?: string
  price?: number
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  propertyType?: string
  features?: string[] | string
}

export interface CaptionOptions {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin'
  tone: 'professional' | 'casual' | 'luxury' | 'excited'
  includeEmojis?: boolean
  includeCallToAction?: boolean
  maxLength?: number
}

export interface GenerationResult {
  text: string
  tokensUsed: number
  model: string
}

export async function generateCaption(
  property: PropertyDetails,
  options: CaptionOptions
): Promise<GenerationResult> {
  const { platform, tone, includeEmojis = true, includeCallToAction = true, maxLength = 300 } = options

  const featuresText = Array.isArray(property.features) 
    ? property.features.join(', ')
    : (property.features || '')

  const platformGuidelines: Record<string, string> = {
    instagram: 'Keep it engaging and visual. Use line breaks for readability. Hashtags will be added separately.',
    facebook: 'More conversational and detailed. Can be slightly longer.',
    tiktok: 'Short, punchy, and trendy. Use casual language.',
    linkedin: 'Professional and polished. Focus on investment value and market insights.'
  }

  const toneGuidelines: Record<string, string> = {
    professional: 'Maintain a polished, trustworthy tone. Use industry terminology appropriately.',
    casual: 'Friendly and approachable. Like talking to a neighbor.',
    luxury: 'Elegant and sophisticated. Emphasize exclusivity and premium features.',
    excited: 'Energetic and enthusiastic. Create urgency and excitement.'
  }

  const prompt = `You are an expert real estate social media copywriter. Write a ${platform} caption for this property listing.

Property Details:
- Address: ${property.address || 'Beautiful property'}
- Location: ${property.city || ''}, ${property.state || ''}
- Price: ${property.price ? `$${property.price.toLocaleString()}` : 'Contact for price'}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Square Feet: ${property.squareFeet ? property.squareFeet.toLocaleString() : 'N/A'}
- Property Type: ${property.propertyType || 'Residential'}
- Key Features: ${featuresText || 'Modern finishes'}

Guidelines:
- Platform: ${platformGuidelines[platform]}
- Tone: ${toneGuidelines[tone]}
- ${includeEmojis ? 'Include relevant emojis throughout' : 'Do not use emojis'}
- ${includeCallToAction ? 'End with a clear call-to-action (e.g., "DM for details", "Link in bio", "Schedule a tour")' : 'No call-to-action needed'}
- Maximum length: ${maxLength} characters
- Do NOT include hashtags (they will be added separately)

Write only the caption, nothing else.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7
  })

  return {
    text: response.choices[0]?.message?.content?.trim() || '',
    tokensUsed: response.usage?.total_tokens || 0,
    model: 'gpt-4o-mini'
  }
}

export async function generateHashtags(
  property: PropertyDetails,
  platform: string = 'instagram',
  count: number = 20
): Promise<GenerationResult> {
  const featuresText = Array.isArray(property.features) 
    ? property.features.join(', ')
    : (property.features || '')

  const prompt = `Generate ${count} relevant hashtags for a real estate listing on ${platform}.

Property Details:
- Location: ${property.city || ''}, ${property.state || ''}
- Property Type: ${property.propertyType || 'House'}
- Key Features: ${featuresText || 'Modern home'}

Requirements:
- Mix of popular real estate hashtags and location-specific ones
- Include trending hashtags for ${platform}
- Format: #hashtag (each on same line, space-separated)
- No numbering or explanations
- Just the hashtags

Generate exactly ${count} hashtags.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.8
  })

  return {
    text: response.choices[0]?.message?.content?.trim() || '',
    tokensUsed: response.usage?.total_tokens || 0,
    model: 'gpt-4o-mini'
  }
}

export interface DescriptionOptions {
  style: 'mls' | 'website' | 'brochure'
  maxWords?: number
}

export async function generateDescription(
  property: PropertyDetails,
  options: DescriptionOptions
): Promise<GenerationResult> {
  const { style, maxWords = 300 } = options

  const featuresText = Array.isArray(property.features) 
    ? property.features.join(', ')
    : (property.features || '')

  const styleGuidelines: Record<string, string> = {
    mls: 'Concise, factual, uses standard MLS abbreviations (BR, BA, SF). Focus on key selling points.',
    website: 'Engaging and descriptive. Paint a picture of the lifestyle. Use flowing prose.',
    brochure: 'Elegant and detailed. Premium feel. Emphasize luxury features and craftsmanship.'
  }

  const prompt = `Write a ${style} property description for this listing.

Property Details:
- Address: ${property.address || 'Beautiful property'}
- Location: ${property.city || ''}, ${property.state || ''}
- Price: ${property.price ? `$${property.price.toLocaleString()}` : 'Contact for price'}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Square Feet: ${property.squareFeet ? property.squareFeet.toLocaleString() : 'N/A'}
- Property Type: ${property.propertyType || 'Residential'}
- Key Features: ${featuresText || 'Modern finishes, updated kitchen'}

Style Guidelines: ${styleGuidelines[style]}
Maximum Words: ${maxWords}

Write only the description, nothing else.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.6
  })

  return {
    text: response.choices[0]?.message?.content?.trim() || '',
    tokensUsed: response.usage?.total_tokens || 0,
    model: 'gpt-4o-mini'
  }
}
