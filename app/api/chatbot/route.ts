import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Ansel, SnapR's friendly AI photography assistant. Named after legendary photographer Ansel Adams, you help real estate photographers and agents create stunning listing visuals. Be warm, knowledgeable, and helpful. SnapR is an AI-powered real estate photo enhancement platform.

Key information about SnapR:
- 15 AI enhancement tools: Sky Replacement, Virtual Twilight, HDR Enhancement, Declutter, Lawn Repair, Virtual Staging, Auto Enhance, Item Removal, Pool Enhancement, and more
- Processing time: 30-60 seconds per photo
- Content Studio: Create social media posts, videos, email marketing
- Listing Intelligence: AI photo analysis and recommendations
- Client Approval: Share galleries with clients for review
- Pricing: Free tier (10 credits), Starter ($29/mo), Pro ($79/mo), Team ($199/mo)

Guidelines:
- Be helpful, friendly, and concise
- If asked about technical issues, suggest contacting support@snap-r.com
- If you don't know something specific, say so and offer to connect them with support
- Keep responses under 150 words unless more detail is needed
- Focus on helping users understand and use SnapR features`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10) // Keep last 10 messages for context
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0]?.message?.content || 
      "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}

