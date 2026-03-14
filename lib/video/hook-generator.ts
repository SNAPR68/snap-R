import OpenAI from 'openai';
import { logApiCost } from '@/lib/cost-logger';
import { logger } from '@/lib/logger';

type ShortFormTemplate = 'teaser' | 'reminder' | 'alert' | 'celebration' | 'highlight';

interface ListingData {
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  features?: string[];
  description?: string;
}

const TEMPLATE_PROMPTS: Record<ShortFormTemplate, string> = {
  teaser: 'Generate a curiosity-driven hook that makes viewers want to see the property. Examples: "Wait till you see the kitchen", "This backyard is unreal", "You won\'t believe this view"',
  reminder: 'Generate an urgency-driven hook for an open house event. Examples: "This Saturday only", "Don\'t miss this open house", "Last chance to see this gem"',
  alert: 'Generate a scarcity-driven hook for a price reduction. Examples: "Price just dropped", "New price alert", "Reduced and ready"',
  celebration: 'Generate a social-proof hook for a sold property. Examples: "Sold in just 5 days", "Another one off the market", "This one went fast"',
  highlight: 'Generate a feature-focused hook highlighting the best aspect. Examples: "This kitchen though", "Pool goals", "Dream master suite"',
};

export async function generateHookText(
  listing: ListingData,
  template: ShortFormTemplate
): Promise<string> {
  logger.info('[HookGenerator] Generating hook for template:', template);
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | undefined;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const propertyContext = [
      listing.address && `Address: ${listing.address}`,
      listing.price && `Price: $${listing.price.toLocaleString()}`,
      listing.beds && `Bedrooms: ${listing.beds}`,
      listing.baths && `Bathrooms: ${listing.baths}`,
      listing.sqft && `Square feet: ${listing.sqft.toLocaleString()}`,
      listing.features?.length && `Features: ${listing.features.join(', ')}`,
    ].filter(Boolean).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a real estate social media expert creating hook text for short-form property videos (TikTok, Reels, Shorts). Generate ONE short, punchy hook line (max 8 words). No quotes, no hashtags, no emojis. Just the hook text.`,
        },
        {
          role: 'user',
          content: `${TEMPLATE_PROMPTS[template]}\n\nProperty details:\n${propertyContext}\n\nGenerate one hook line:`,
        },
      ],
      max_tokens: 30,
      temperature: 0.8,
    }, { signal: AbortSignal.timeout(15000) });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const hook = sanitizeHook(raw, template);
    logger.info('[HookGenerator] Generated:', hook);
    return hook;
  } catch (error: unknown) {
    success = false;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    errorMessage = msg;
    logger.error('[HookGenerator] Error:', msg);
    return getFallbackHook(template);
  } finally {
    await logApiCost({
      provider: 'openai',
      toolId: 'hook-generator',
      success,
      errorMessage,
      actualCost: 0.1, // GPT-4o-mini is very cheap
      processingTimeMs: Date.now() - startTime,
    });
  }
}

function sanitizeHook(raw: string, template: ShortFormTemplate): string {
  let cleaned = raw
    .replace(/^["']+|["']+$/g, '')       // strip surrounding quotes
    .replace(/#\w+/g, '')                 // remove hashtags
    .replace(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // remove emojis
    .replace(/\s+/g, ' ')                // collapse whitespace
    .trim();

  const words = cleaned.split(' ').filter(Boolean);
  if (words.length === 0 || words.length > 8) {
    return getFallbackHook(template);
  }
  return cleaned;
}

function getFallbackHook(template: ShortFormTemplate): string {
  const fallbacks: Record<ShortFormTemplate, string> = {
    teaser: 'Wait till you see this',
    reminder: 'Open house this weekend',
    alert: 'Price just dropped',
    celebration: 'Another one sold',
    highlight: 'This one is special',
  };
  return fallbacks[template];
}
