import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, platform } = await request.json()
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }
    
    // Platform-specific max lengths for the model to target
    const targetLengths: Record<string, string> = {
      instagram: 'Target 150-300 words. Use line breaks for readability.',
      facebook: 'Target 100-200 words. Conversational and engaging.',
      linkedin: 'Target 100-150 words. Professional and concise.',
      tiktok: 'Target 50-100 words. Short, punchy, and trendy.'
    }
    
    const systemPrompt = `You are an expert real estate social media copywriter with 10+ years of experience creating high-converting content for top agents. You understand the psychology of home buyers and know exactly how to craft captions that generate leads.

${targetLengths[platform] || targetLengths.instagram}

IMPORTANT RULES:
1. Never include hashtags - they are added separately
2. Always include a clear call-to-action
3. Make the first line attention-grabbing (it's what people see in the feed)
4. Match the requested tone exactly
5. Use line breaks strategically for readability
6. Be specific about property features when mentioned
7. Create emotional connection while remaining professional`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 500,
    })
    
    const caption = completion.choices[0]?.message?.content?.trim() || ''
    
    // Track usage for billing
    const usage = {
      prompt_tokens: completion.usage?.prompt_tokens || 0,
      completion_tokens: completion.usage?.completion_tokens || 0,
      total_tokens: completion.usage?.total_tokens || 0,
    }
    
    return NextResponse.json({
      caption,
      usage,
      platform
    })
    
  } catch (error: any) {
    console.error('Caption generation error:', error)
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'API quota exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    )
  }
}
