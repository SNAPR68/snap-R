// lib/campaigns/content-generator.ts
// Generates actual content for campaign queue items

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ListingData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  description?: string;
  features?: string[];
  photos: { url: string; enhanced_url?: string }[];
}

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  image_url: string;
  template_id?: string;
}

// Status-specific messaging
const STATUS_MESSAGING = {
  just_listed: {
    hooks: [
      '🏠 Just Listed!',
      '✨ New on the Market!',
      '🔑 Fresh Listing Alert!',
      '📍 Now Available!',
    ],
    ctas: [
      'Schedule your private showing today!',
      'DM for details or click link in bio.',
      'Contact me for more information!',
      "Don't miss this opportunity!",
    ],
  },
  coming_soon: {
    hooks: [
      '👀 Coming Soon...',
      '🔜 Sneak Peek!',
      '⏰ Get Ready...',
      '🌟 Exclusive Preview',
    ],
    ctas: [
      'Be the first to know when it hits the market!',
      'Join my VIP list for early access.',
      'Stay tuned for more details!',
      'Message me to get on the list.',
    ],
  },
  open_house: {
    hooks: [
      '🏡 Open House This Weekend!',
      '📅 Mark Your Calendar!',
      '🚪 Doors Open!',
      '👋 Come See Us!',
    ],
    ctas: [
      'Stop by and see for yourself!',
      'No appointment needed!',
      'Bring your buyers!',
      'See you there!',
    ],
  },
  price_drop: {
    hooks: [
      '💰 Price Improved!',
      '📉 New Price Alert!',
      '🎯 Better Value!',
      '⬇️ Price Reduction!',
    ],
    ctas: [
      "Now's the time to make your move!",
      "Don't wait - this won't last!",
      'Schedule a showing today!',
      'Incredible value at this price!',
    ],
  },
  under_contract: {
    hooks: [
      '🎉 Under Contract!',
      '✅ Accepted Offer!',
      '🤝 In Escrow!',
      '📝 Contract Pending!',
    ],
    ctas: [
      'Looking to buy or sell? Let me help you next!',
      'Thinking of selling? The market is HOT!',
      'Congratulations to my clients!',
      'Another one moving forward!',
    ],
  },
  sold: {
    hooks: [
      '🔑 SOLD!',
      '🎊 Closed & Recorded!',
      '✨ Another Happy Homeowner!',
      '🏆 Successfully Sold!',
    ],
    ctas: [
      'Ready to be my next success story?',
      'Want results like this? Contact me!',
      'Your home could be next!',
      'Let me help you achieve your real estate goals!',
    ],
  },
};

// Platform-specific adjustments
const PLATFORM_LIMITS = {
  instagram: { maxChars: 2200, maxHashtags: 30 },
  facebook: { maxChars: 63206, maxHashtags: 10 },
  linkedin: { maxChars: 3000, maxHashtags: 5 },
  twitter: { maxChars: 280, maxHashtags: 3 },
  tiktok: { maxChars: 2200, maxHashtags: 10 },
};

// Generate social post content
export async function generateSocialContent(
  listing: ListingData,
  platform: string,
  status: string,
  style: string = 'announcement',
  tone: string = 'professional'
): Promise<GeneratedContent> {
  const messaging = STATUS_MESSAGING[status as keyof typeof STATUS_MESSAGING] || STATUS_MESSAGING.just_listed;
  const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS] || PLATFORM_LIMITS.instagram;

  // Use AI to generate caption if OpenAI is available
  if (OPENAI_API_KEY) {
    try {
      const aiContent = await generateWithAI(listing, platform, status, style, tone, limits);
      if (aiContent) return aiContent;
    } catch (error) {
      console.error('AI generation failed, using template:', error);
    }
  }

  // Fallback to template-based generation
  return generateFromTemplate(listing, platform, status, style, messaging, limits);
}

async function generateWithAI(
  listing: ListingData,
  platform: string,
  status: string,
  style: string,
  tone: string,
  limits: { maxChars: number; maxHashtags: number }
): Promise<GeneratedContent | null> {
  const prompt = `Generate a ${platform} real estate post for a ${status.replace('_', ' ')} listing.

Property Details:
- Address: ${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}
- Price: $${listing.price?.toLocaleString()}
- Beds: ${listing.bedrooms} | Baths: ${listing.bathrooms} | SqFt: ${listing.sqft?.toLocaleString()}
${listing.features?.length ? `- Features: ${listing.features.join(', ')}` : ''}

Style: ${style}
Tone: ${tone}
Platform: ${platform}
Max characters: ${limits.maxChars}
Max hashtags: ${limits.maxHashtags}

Requirements:
1. Start with an attention-grabbing hook appropriate for "${status.replace('_', ' ')}"
2. Highlight 2-3 key features
3. Include a clear call-to-action
4. Add relevant hashtags (include location-based ones)
5. Use emojis strategically but professionally
6. For ${tone} tone, ${tone === 'luxury' ? 'use sophisticated language' : tone === 'warm' ? 'be friendly and approachable' : tone === 'urgent' ? 'create FOMO' : 'be clear and informative'}

Respond in JSON format:
{
  "caption": "The full caption text",
  "hashtags": ["hashtag1", "hashtag2", ...]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert real estate social media marketer. Generate engaging, platform-optimized content.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);

  // Get best photo
  const imageUrl = listing.photos?.[0]?.enhanced_url || listing.photos?.[0]?.url || '';

  return {
    caption: content.caption,
    hashtags: content.hashtags.slice(0, limits.maxHashtags),
    image_url: imageUrl,
  };
}

function generateFromTemplate(
  listing: ListingData,
  platform: string,
  status: string,
  style: string,
  messaging: { hooks: string[]; ctas: string[] },
  limits: { maxChars: number; maxHashtags: number }
): GeneratedContent {
  const hook = messaging.hooks[Math.floor(Math.random() * messaging.hooks.length)];
  const cta = messaging.ctas[Math.floor(Math.random() * messaging.ctas.length)];

  const priceFormatted = listing.price ? `$${listing.price.toLocaleString()}` : '';
  const specs = `${listing.bedrooms} BD | ${listing.bathrooms} BA | ${listing.sqft?.toLocaleString()} SF`;

  let caption = `${hook}\n\n`;
  caption += `📍 ${listing.address}, ${listing.city}, ${listing.state}\n`;
  caption += `💵 ${priceFormatted}\n`;
  caption += `🏠 ${specs}\n\n`;
  caption += `${cta}`;

  // Generate hashtags
  const hashtags = generateHashtags(listing, status, limits.maxHashtags);

  // Add hashtags to caption for Instagram
  if (platform === 'instagram') {
    caption += '\n\n' + hashtags.map(h => `#${h}`).join(' ');
  }

  const imageUrl = listing.photos?.[0]?.enhanced_url || listing.photos?.[0]?.url || '';

  return {
    caption,
    hashtags,
    image_url: imageUrl,
  };
}

function generateHashtags(listing: ListingData, status: string, maxHashtags: number): string[] {
  const hashtags: string[] = [];

  // Status-based
  const statusTags: Record<string, string[]> = {
    just_listed: ['JustListed', 'NewListing', 'ForSale', 'HomesForSale'],
    coming_soon: ['ComingSoon', 'OffMarket', 'SneakPeek', 'ExclusiveListing'],
    open_house: ['OpenHouse', 'OpenHouseWeekend', 'HouseTour', 'HomeShowing'],
    price_drop: ['PriceReduced', 'PriceImprovement', 'NewPrice', 'GreatDeal'],
    under_contract: ['UnderContract', 'Pending', 'InEscrow', 'OfferAccepted'],
    sold: ['JustSold', 'Sold', 'Closed', 'AnotherOneSold'],
  };

  hashtags.push(...(statusTags[status] || statusTags.just_listed).slice(0, 3));

  // Location-based
  if (listing.city) {
    hashtags.push(`${listing.city.replace(/\s+/g, '')}RealEstate`);
    hashtags.push(`${listing.city.replace(/\s+/g, '')}Homes`);
  }
  if (listing.state) {
    hashtags.push(`${listing.state}RealEstate`);
  }

  // Property-based
  if (listing.bedrooms >= 4) hashtags.push('LargeHome');
  if (listing.sqft && listing.sqft > 3000) hashtags.push('LuxuryHome');
  if (listing.price && listing.price > 1000000) hashtags.push('MillionDollarListing');

  // General real estate
  hashtags.push('RealEstate', 'Realtor', 'HomeForSale', 'DreamHome');

  return hashtags.slice(0, maxHashtags);
}

// Generate email content
export async function generateEmailContent(
  listing: ListingData,
  status: string,
  subjectTemplate?: string
): Promise<{ subject: string; body: string }> {
  const messaging = STATUS_MESSAGING[status as keyof typeof STATUS_MESSAGING] || STATUS_MESSAGING.just_listed;

  // Subject line
  let subject = subjectTemplate || `${messaging.hooks[0]} ${listing.address}`;
  subject = subject
    .replace('{{address}}', listing.address)
    .replace('{{price}}', `$${listing.price?.toLocaleString()}`)
    .replace('{{city}}', listing.city);

  // Email body
  const body = `
<h2>${messaging.hooks[0]}</h2>
<p><strong>${listing.address}</strong><br>
${listing.city}, ${listing.state} ${listing.zip}</p>

<p style="font-size: 24px; color: #B8860B;"><strong>$${listing.price?.toLocaleString()}</strong></p>

<p>
<strong>${listing.bedrooms}</strong> Bedrooms | 
<strong>${listing.bathrooms}</strong> Bathrooms | 
<strong>${listing.sqft?.toLocaleString()}</strong> Sq Ft
</p>

${listing.description ? `<p>${listing.description}</p>` : ''}

<p><strong>${messaging.ctas[0]}</strong></p>

<p>Click below to view more photos and details:</p>
`.trim();

  return { subject, body };
}

// Process queue item - generate actual content
export async function processQueueItem(queueItemId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get queue item with listing data
  const { data: queueItem, error: fetchError } = await supabase
    .from('campaign_queue')
    .select(`
      *,
      listings (
        id, address, city, state, zip, price, bedrooms, bathrooms, sqft, description,
        photos (url, enhanced_url)
      )
    `)
    .eq('id', queueItemId)
    .single();

  if (fetchError || !queueItem) {
    return { success: false, error: 'Queue item not found' };
  }

  const listing = queueItem.listings as ListingData;
  const contentData = queueItem.content_data || {};

  try {
    let generatedContent: any = {};

    switch (queueItem.content_type) {
      case 'social_post':
        const socialContent = await generateSocialContent(
          listing,
          queueItem.platform,
          contentData.listing_status || 'just_listed',
          contentData.template_style || 'announcement',
          contentData.tone || 'professional'
        );
        generatedContent = {
          ...contentData,
          caption: socialContent.caption,
          hashtags: socialContent.hashtags,
          image_url: socialContent.image_url,
          generated: true,
        };
        break;

      case 'email':
        const emailContent = await generateEmailContent(
          listing,
          contentData.listing_status || 'just_listed',
          contentData.subject_template
        );
        generatedContent = {
          ...contentData,
          subject: emailContent.subject,
          body: emailContent.body,
          generated: true,
        };
        break;

      case 'property_site_update':
        generatedContent = {
          ...contentData,
          update_type: 'status_change',
          new_banner: contentData.new_status?.replace('_', ' ').toUpperCase(),
          generated: true,
        };
        break;

      case 'video':
        // Video generation would connect to existing video creator
        generatedContent = {
          ...contentData,
          script: `${listing.address} - ${contentData.listing_status?.replace('_', ' ')}`,
          generated: true,
        };
        break;
    }

    // Update queue item with generated content
    await supabase
      .from('campaign_queue')
      .update({
        content_data: generatedContent,
        preview_image_url: generatedContent.image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);

    return { success: true };
  } catch (error) {
    console.error('Content generation error:', error);
    return { success: false, error: 'Failed to generate content' };
  }
}

// Batch process all pending items for a campaign
export async function processCampaignContent(campaignId: string): Promise<{ success: boolean; processed: number; errors: number }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: queueItems } = await supabase
    .from('campaign_queue')
    .select('id')
    .eq('campaign_id', campaignId)
    .is('content_data->generated', null);

  let processed = 0;
  let errors = 0;

  for (const item of queueItems || []) {
    const result = await processQueueItem(item.id);
    if (result.success) {
      processed++;
    } else {
      errors++;
    }
  }

  return { success: true, processed, errors };
}
