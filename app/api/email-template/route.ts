import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/logger';
import { emailTemplateSchema, parseBody } from '@/lib/validation/schemas'
function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = parseBody(emailTemplateSchema, body)
    if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }) }
    const { property, postType, agentInfo, tone } = validated.data

    const openai = getOpenAIClient()

    const toneGuide: Record<string, string> = {
      professional: 'formal and polished',
      friendly: 'warm and approachable',
      luxury: 'sophisticated and exclusive',
      urgent: 'compelling with urgency'
    }

    const prompt = `Generate a real estate marketing email for a ${postType?.replace('-', ' ')} announcement.

Property: ${property.address}, ${property.city}, ${property.state}
Price: $${property.price?.toLocaleString()}
Beds: ${property.bedrooms} | Baths: ${property.bathrooms} | Sqft: ${property.sqft?.toLocaleString()}

Agent: ${agentInfo?.name || 'Agent'}
Phone: ${agentInfo?.phone || ''}
Email: ${agentInfo?.email || ''}

Tone: ${toneGuide[tone || 'professional'] || 'professional'}

Generate:
1. Subject line (compelling, under 60 chars)
2. Preview text (under 100 chars)
3. Email body (HTML formatted, 150-200 words)
4. Call-to-action button text

Return as JSON: { subject, preview, body, ctaText }`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a real estate email marketing expert. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7
    })

    const content = response.choices[0]?.message?.content || '{}'
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    const emailData = JSON.parse(cleaned)

    return NextResponse.json({ email: emailData })
  } catch (error: unknown) {
    logger.error('Email generation error:', error)
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 })
  }
}
