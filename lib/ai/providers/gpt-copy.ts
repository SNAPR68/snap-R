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
  contentType?: string
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
  const { platform, tone, includeEmojis = true, includeCallToAction = true, maxLength = 2000, contentType } = options

  const featuresText = Array.isArray(property.features) 
    ? property.features.join(', ')
    : (property.features || '')

  const contentLabel = contentType?.replace(/_/g, ' ') || 'just listed'
  const capitalizedContentLabel = contentLabel.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')

  const contentExamples: Record<string, string> = {
    'just_listed': `Example format:
✨ JUST LISTED in [Neighborhood]! ✨

This stunning ${property.bedrooms || 3}bed/${property.bathrooms || 2}bath home is everything you've been looking for. 🏡

[Highlight key features like updated kitchen, spacious backyard, hardwood floors, natural light]

📍 ${property.city || 'Location'}, ${property.state || 'State'}
💰 Listed at ${property.price ? '$' + Number(property.price).toLocaleString() : 'Contact for price'}
📐 ${property.squareFeet ? Number(property.squareFeet).toLocaleString() + ' sq ft' : ''} | 🛏️ ${property.bedrooms || ''} | 🛁 ${property.bathrooms || ''}

Don't miss this incredible opportunity! Contact me today for a private showing. 🔑`,

    'open_house': `Example format:
🏠 OPEN HOUSE THIS WEEKEND! 🎉

You're invited to tour this beautiful ${property.bedrooms || 3}bed/${property.bathrooms || 2}bath home in ${property.city || 'the area'}!

📅 [Day], [Date]
🕐 [Time] - [Time]
📍 ${property.address || 'Address'}

[Highlight what makes this home special - renovated kitchen, large backyard, great school district]

💰 Offered at ${property.price ? '$' + Number(property.price).toLocaleString() : 'Contact for price'}

Bring your family and envision your future here! See you there! 👋`,

    'price_reduced': `Example format:
🚨 PRICE REDUCED! 🚨

Great news for buyers! This stunning ${property.bedrooms || 3}bed/${property.bathrooms || 2}bath home just got even better! 

💰 NOW ${property.price ? '$' + Number(property.price).toLocaleString() : 'Contact for price'}

[Highlight the value proposition - below market, motivated seller, investment opportunity]

📍 ${property.city || 'Location'}, ${property.state || 'State'}
📐 ${property.squareFeet ? Number(property.squareFeet).toLocaleString() + ' sq ft' : ''} 

This won't last long at this price! Schedule your showing today! 📞`,

    'just_sold': `Example format:
🎉 JUST SOLD! 🎉

Congratulations to my amazing clients on the purchase of their dream home in ${property.city || 'the area'}! 🏡🔑

This beautiful ${property.bedrooms || 3}bed/${property.bathrooms || 2}bath home is now SOLD!

[Thank buyers/sellers, mention smooth transaction, celebrate the milestone]

💰 Sold for ${property.price ? '$' + Number(property.price).toLocaleString() : 'asking price'}

Thinking of buying or selling? Let's make your real estate dreams come true! DM me to get started. ✨`,

    'coming_soon': `Example format:
👀 COMING SOON! 👀

Get ready! A stunning new listing is about to hit the market in ${property.city || 'the area'}! 🏡

${property.bedrooms || 3} Beds | ${property.bathrooms || 2} Baths | ${property.squareFeet ? Number(property.squareFeet).toLocaleString() + ' sq ft' : 'Spacious'}

[Tease key features without revealing everything - hint at special amenities, location perks]

💰 Expected at ${property.price ? '$' + Number(property.price).toLocaleString() : 'Contact for preview'}

Want early access before it goes live? DM me NOW to schedule a private preview! 🔑`,

    'under_contract': `Example format:
📝 UNDER CONTRACT! 📝

This gorgeous ${property.bedrooms || 3}bed/${property.bathrooms || 2}bath home in ${property.city || 'the area'} is officially under contract! 🎊

[Congratulate the parties involved, highlight why this one moved fast]

💰 Listed at ${property.price ? '$' + Number(property.price).toLocaleString() : 'asking price'}

Missed out on this one? Don't worry! Contact me to be first in line for similar properties. More coming soon! 📞`
  }

  const selectedExample = contentExamples[contentType || 'just_listed'] || contentExamples['just_listed']

  const prompt = `You are an expert US real estate social media copywriter specializing in high-converting property marketing. Write a professional ${capitalizedContentLabel} ${platform} caption for this property listing.

CONTENT TYPE: ${capitalizedContentLabel}
PLATFORM: ${platform}
TONE: ${tone}

PROPERTY DETAILS:
- Address: ${property.address || 'Beautiful home'}
- City: ${property.city || ''}, ${property.state || ''}
- Price: ${property.price ? '$' + Number(property.price).toLocaleString() : 'Contact for price'}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Square Feet: ${property.squareFeet ? Number(property.squareFeet).toLocaleString() + ' sq ft' : 'N/A'}
- Property Type: ${property.propertyType || 'Home'}

${selectedExample}

STRICT REQUIREMENTS:
1. Write 4-6 sentences MINIMUM - NO one-liners
2. Start with an attention-grabbing headline with emojis for ${capitalizedContentLabel}
3. Include specific property details (beds, baths, sqft, price)
4. Highlight 2-3 compelling features or benefits
5. Use line breaks between sections for readability
6. End with a strong call-to-action appropriate for ${capitalizedContentLabel}
${includeEmojis ? '7. Use 4-6 relevant emojis: 🏡 🔑 ✨ 📍 💰 🏠 🛏️ 🛁 📐 🎉 📝 👀 🚨 📞 📅 🕐' : '7. Do NOT use any emojis'}
8. Follow ${platform} best practices (Instagram: hashtags, Facebook: conversational, LinkedIn: professional)
9. Sound professional, warm, and create urgency
10. This MUST clearly be a ${capitalizedContentLabel} post - make it obvious!

Generate the caption now:`

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
