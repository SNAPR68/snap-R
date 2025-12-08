// GPT-4 Copy Generation Provider
// Generates property descriptions, social captions, and hashtags

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface PropertyDetails {
  address?: string
  city?: string
  state?: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  price?: number
  propertyType?: string // 'house', 'condo', 'townhouse', 'land'
  features?: string[] // 'pool', 'view', 'renovated', etc.
  style?: string // 'luxury', 'modern', 'cozy', 'family'
}

export interface CaptionOptions {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin'
  tone: 'professional' | 'casual' | 'luxury' | 'excited'
  includeEmojis: boolean
  includeCallToAction: boolean
  maxLength?: number
}

export interface GeneratedCopy {
  text: string
  tokensUsed: number
  model: string
}

// Generate Instagram/Facebook/TikTok caption
export async function generateCaption(
  property: PropertyDetails,
  options: CaptionOptions
): Promise<GeneratedCopy> {
  const platformGuidelines = {
    instagram: 'Instagram caption (max 2200 chars, optimized for engagement, line breaks for readability)',
    facebook: 'Facebook post (conversational, can be longer, community-focused)',
    tiktok: 'TikTok caption (short, punchy, trending style, max 150 chars)',
    linkedin: 'LinkedIn post (professional, business-focused, networking tone)'
  }

  const toneGuidelines = {
    professional: 'Professional and polished, focused on value and features',
    casual: 'Friendly and approachable, like talking to a neighbor',
    luxury: 'Sophisticated and exclusive, emphasizing prestige and quality',
    excited: 'Enthusiastic and energetic, creating urgency and excitement'
  }

  const prompt = `Generate a ${platformGuidelines[options.platform]} for this real estate listing.

Property Details:
- Location: ${property.address || 'Beautiful location'}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Square Feet: ${property.squareFeet?.toLocaleString() || 'N/A'}
- Price: ${property.price ? `$${property.price.toLocaleString()}` : 'Contact for price'}
- Property Type: ${property.propertyType || 'Residential'}
- Key Features: ${property.features?.join(', ') || 'Beautiful home'}

Tone: ${toneGuidelines[options.tone]}
${options.includeEmojis ? 'Include relevant emojis throughout.' : 'Do not use emojis.'}
${options.includeCallToAction ? 'End with a clear call-to-action (DM, link in bio, call, etc.)' : ''}
${options.maxLength ? `Keep under ${options.maxLength} characters.` : ''}

Write ONLY the caption, no explanations or quotation marks.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert real estate social media copywriter. You write engaging, platform-optimized captions that drive engagement and leads. Never use quotation marks around your response.'
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.7
  })

  return {
    text: response.choices[0]?.message?.content?.trim() || '',
    tokensUsed: response.usage?.total_tokens || 0,
    model: 'gpt-4o-mini'
  }
}

// Generate property description for MLS/listing
export async function generateDescription(
  property: PropertyDetails,
  style: 'mls' | 'website' | 'brochure' = 'mls'
): Promise<GeneratedCopy> {
  const styleGuidelines = {
    mls: 'MLS listing description (factual, feature-focused, 250-500 words, no excessive adjectives)',
    website: 'Website listing (engaging, storytelling, highlights lifestyle, 300-600 words)',
    brochure: 'Print brochure (elegant, concise, luxury feel, 150-300 words)'
  }

  const prompt = `Write a ${styleGuidelines[style]} for this property.

Property Details:
- Location: ${property.address || 'Prime location'}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Square Feet: ${property.squareFeet?.toLocaleString() || 'N/A'}
- Price: ${property.price ? `$${property.price.toLocaleString()}` : 'Contact for price'}
- Property Type: ${property.propertyType || 'Residential'}
- Key Features: ${property.features?.join(', ') || 'Move-in ready'}
- Style: ${property.style || 'Well-maintained'}

Write ONLY the description, no titles or explanations.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert real estate copywriter specializing in property descriptions. You write compelling, accurate descriptions that highlight key features and appeal to buyers. Never use quotation marks around your response.'
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.6
  })

  return {
    text: response.choices[0]?.message?.content?.trim() || '',
    tokensUsed: response.usage?.total_tokens || 0,
    model: 'gpt-4o-mini'
  }
}

// Generate hashtags
export async function generateHashtags(
  property: PropertyDetails,
  platform: 'instagram' | 'tiktok' | 'general' = 'instagram',
  count: number = 20
): Promise<GeneratedCopy> {
  const prompt = `Generate ${count} relevant hashtags for a real estate ${platform} post.

Property: ${property.propertyType || 'home'} in ${property.city || 'the area'}${property.state ? `, ${property.state}` : ''}
Features: ${property.features?.join(', ') || 'beautiful property'}
Price Range: ${property.price ? (property.price > 1000000 ? 'luxury' : property.price > 500000 ? 'mid-range' : 'affordable') : 'various'}

Include a mix of:
- Location-specific hashtags
- Property type hashtags
- Real estate industry hashtags
- Lifestyle hashtags
- Trending real estate hashtags

Return ONLY hashtags separated by spaces, starting with #. No explanations.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a social media expert specializing in real estate hashtag strategy. Return only hashtags, no other text.'
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 200,
    temperature: 0.8
  })

  return {
    text: response.choices[0]?.message?.content?.trim() || '',
    tokensUsed: response.usage?.total_tokens || 0,
    model: 'gpt-4o-mini'
  }
}
