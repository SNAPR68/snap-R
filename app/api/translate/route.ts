import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const LANGUAGES: Record<string, string> = {
  es: 'Spanish', fr: 'French', zh: 'Chinese (Simplified)', de: 'German',
  pt: 'Portuguese', it: 'Italian', ja: 'Japanese', ko: 'Korean',
  ar: 'Arabic', hi: 'Hindi', ru: 'Russian', vi: 'Vietnamese'
}

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json()
    if (!text || !targetLanguage) return NextResponse.json({ error: 'Text and target language required' }, { status: 400 })

    const languageName = LANGUAGES[targetLanguage] || targetLanguage

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Translate this real estate caption to ${languageName}. Keep hashtags in English. Only return translated text.` },
        { role: 'user', content: text }
      ],
      max_tokens: 500, temperature: 0.3
    })

    return NextResponse.json({ translatedText: response.choices[0]?.message?.content?.trim() || '', language: languageName, languageCode: targetLanguage })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Failed to translate' }, { status: 500 })
  }
}
