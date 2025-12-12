'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react'
import { PostType, POST_TYPES, ToneType, TONE_TYPES } from './post-type-selector'

// ============================================
// TYPES
// ============================================

export interface PropertyDetails {
  address: string
  city: string
  state: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFeet: number
  features?: string[]
  neighborhood?: string
  yearBuilt?: number
}

export interface CaptionRequest {
  property: PropertyDetails
  postType: PostType
  tone: ToneType
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok'
  includeEmojis?: boolean
  includeCallToAction?: boolean
  agentName?: string
  agentPhone?: string
  openHouseDate?: string
  previousPrice?: number
}

export interface GeneratedCaption {
  caption: string
  characterCount: number
  platform: string
}

// ============================================
// PROMPT BUILDER
// ============================================

function buildCaptionPrompt(request: CaptionRequest): string {
  const { property, postType, tone, platform, agentName, agentPhone, openHouseDate, previousPrice } = request
  
  const postTypeConfig = POST_TYPES.find(p => p.id === postType)
  const toneConfig = TONE_TYPES.find(t => t.id === tone)
  
  const platformGuidelines: Record<string, string> = {
    instagram: 'Keep it engaging with line breaks. Use emojis strategically. Max 2200 chars but optimal is 125-150 for feed visibility. Include a clear CTA.',
    facebook: 'Can be longer and more detailed. Use a conversational tone. Include property link mention. Optimal length 40-80 words.',
    linkedin: 'Professional and polished. Focus on investment value and market insights. Avoid excessive emojis. Keep it business-appropriate.',
    tiktok: 'Super casual and trendy. Use current slang appropriately. Keep it short and punchy. Hook in the first line.'
  }
  
  const features = property.features?.length 
    ? `Key features: ${property.features.join(', ')}`
    : ''
  
  let postTypeAdditions = ''
  if (postType === 'open_house' && openHouseDate) {
    postTypeAdditions = `Open house is on ${openHouseDate}. Emphasize the date and time. Create urgency to attend.`
  } else if (postType === 'price_improvement' && previousPrice) {
    const savings = previousPrice - property.price
    postTypeAdditions = `Price reduced from $${previousPrice.toLocaleString()} to $${property.price.toLocaleString()} (savings of $${savings.toLocaleString()}). Emphasize the value opportunity.`
  } else if (postType === 'just_sold') {
    postTypeAdditions = `This is a celebration post. Congratulate the buyers/sellers. Use this as social proof of your success.`
  } else if (postType === 'under_contract') {
    postTypeAdditions = `Create FOMO - this one got snatched up fast. Position yourself as someone who gets results.`
  }
  
  const prompt = `
You are an expert real estate social media copywriter. Generate a ${platform} caption for this property listing.

PROPERTY DETAILS:
- Address: ${property.address}, ${property.city}, ${property.state}
- Price: $${property.price.toLocaleString()}
- Bedrooms: ${property.bedrooms} | Bathrooms: ${property.bathrooms}
- Square Feet: ${property.squareFeet.toLocaleString()}
${property.neighborhood ? `- Neighborhood: ${property.neighborhood}` : ''}
${property.yearBuilt ? `- Year Built: ${property.yearBuilt}` : ''}
${features}

POST TYPE: ${postTypeConfig?.name || postType}
${postTypeConfig?.captionPrefix ? `Start with or include: "${postTypeConfig.captionPrefix}"` : ''}
${postTypeAdditions}

TONE: ${toneConfig?.name}
${toneConfig?.promptModifier}

PLATFORM GUIDELINES: ${platformGuidelines[platform]}

${agentName ? `AGENT: ${agentName}` : ''}
${agentPhone ? `CONTACT: ${agentPhone}` : ''}

REQUIREMENTS:
1. Do NOT include hashtags (they will be added separately)
2. Include a clear call-to-action (DM, call, link in bio, etc.)
3. Make the first line attention-grabbing
4. ${request.includeEmojis !== false ? 'Use emojis strategically to enhance, not overwhelm' : 'Avoid emojis'}
5. Match the tone exactly - this is crucial for the agent's brand

Generate ONLY the caption text. No explanations or alternatives.
`

  return prompt
}

// ============================================
// CAPTION GENERATOR FUNCTION
// ============================================

export async function generateCaption(request: CaptionRequest): Promise<GeneratedCaption> {
  const prompt = buildCaptionPrompt(request)
  
  try {
    const response = await fetch('/api/ai/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, platform: request.platform })
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate caption')
    }
    
    const data = await response.json()
    
    return {
      caption: data.caption,
      characterCount: data.caption.length,
      platform: request.platform
    }
  } catch (error) {
    console.error('Caption generation error:', error)
    throw error
  }
}

// ============================================
// CAPTION PREVIEW COMPONENT
// ============================================

interface CaptionPreviewProps {
  caption: string
  platform: string
  loading?: boolean
  onRegenerate?: () => void
  onEdit?: (caption: string) => void
}

export function CaptionPreview({ 
  caption, 
  platform, 
  loading = false,
  onRegenerate,
  onEdit
}: CaptionPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedCaption, setEditedCaption] = useState(caption)
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleSaveEdit = () => {
    onEdit?.(editedCaption)
    setIsEditing(false)
  }
  
  const platformLimits: Record<string, number> = {
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000,
    tiktok: 2200
  }
  
  const limit = platformLimits[platform] || 2200
  const isOverLimit = caption.length > limit
  
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm font-medium text-white">Generated Caption</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isOverLimit ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'}`}>
            {caption.length}/{limit}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition text-xs"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      
      {/* Caption Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          <span className="ml-2 text-white/50 text-sm">Generating caption...</span>
        </div>
      ) : isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editedCaption}
            onChange={(e) => setEditedCaption(e.target.value)}
            className="w-full h-40 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white text-sm resize-none focus:outline-none focus:border-[#D4AF37]/50"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditedCaption(caption)
                setIsEditing(false)
              }}
              className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 rounded-lg bg-[#D4AF37] text-black text-xs font-medium"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => onEdit && setIsEditing(true)}
          className={`text-sm text-white/80 leading-relaxed whitespace-pre-wrap ${onEdit ? 'cursor-text hover:bg-white/5 rounded-lg p-2 -m-2 transition' : ''}`}
        >
          {caption || 'No caption generated yet'}
        </div>
      )}
      
      {/* Edit Hint */}
      {!isEditing && onEdit && caption && (
        <p className="text-[10px] text-white/30 text-center">
          Click caption to edit
        </p>
      )}
    </div>
  )
}

// ============================================
// EXAMPLE CAPTIONS (for fallback/demo)
// ============================================

export const EXAMPLE_CAPTIONS: Record<PostType, Record<ToneType, string>> = {
  just_listed: {
    professional: `🏡 JUST LISTED

This exceptional residence offers refined living space in a prime location.

✓ Modern finishes throughout
✓ Open concept living
✓ Prime location

📱 Contact me for a private showing`,
    warm: `🏡 JUST LISTED & I'm so excited about this one!

Imagine coming home to this beautiful gem. From the moment you walk in, you'll feel the warmth and character that makes a house a home.

DM me to schedule your private tour! 💛`,
    luxury: `JUST LISTED | A Rare Offering

An extraordinary residence encompassing uncompromising luxury.

Every detail has been carefully curated to create an atmosphere of refined elegance.

Private viewings available by appointment.`,
    urgent: `🚨 JUST LISTED - WON'T LAST! 🚨

Just hit the market and in this market, it's going to move FAST!

⏰ Serious buyers: DM me NOW to get in before everyone else!`
  },
  coming_soon: {
    professional: `👀 COMING SOON

Exceptional residence launching soon.

Priority showings available. Contact me to join the waitlist.`,
    warm: `Something special is coming... 👀

I'm getting ready to list a gorgeous home and I wanted to give my network the first look!

DM me now to get on the early access list. More details dropping soon! 🏡`,
    luxury: `COMING SOON | Exclusive Preview

A distinguished residence in the most coveted enclave.

Select viewings by invitation. Contact for privileged access.`,
    urgent: `🔥 SNEAK PEEK - COMING THIS WEEK! 🔥

🚨 Get on the list NOW - properties like this are getting multiple offers on day ONE.

DM "INTERESTED" for early access!`
  },
  open_house: {
    professional: `🚪 OPEN HOUSE

Tour this exceptional property and discover everything it has to offer.

Contact me for details.`,
    warm: `You're invited! 🏡

Join me for an open house you won't forget. This beauty is waiting to meet its new family.

Bring your coffee, bring your dreams, and let's find out if this is THE ONE.

See you there!`,
    luxury: `PRIVATE VIEWING

Experience this residence. An opportunity to envision your future in one of the finest properties.

RSVP required.`,
    urgent: `🚨 OPEN HOUSE THIS WEEKEND! 🚨

This one is HOT and I'm expecting a packed house. Come early to beat the crowd!

See you there? 👋`
  },
  price_improvement: {
    professional: `📉 PRICE IMPROVEMENT

This exceptional property now offers even greater value. Schedule your showing today.`,
    warm: `Great news for buyers! 🎉

This gorgeous home just got even more attainable. The sellers are motivated and ready to make a deal.

If you've been on the fence, now's the time to jump! DM me for details.`,
    luxury: `EXCEPTIONAL VALUE | Price Refined

A rare opportunity to acquire a property of this caliber at a compelling value.`,
    urgent: `🚨 PRICE DROP ALERT! 🚨

At this price, it's not going to last. I'm scheduling showings all weekend.

Who's ready to make a move? 📱 DM me NOW!`
  },
  under_contract: {
    professional: `📝 UNDER CONTRACT

This residence has found its new owners.

Looking for your perfect home? Let's find it together.`,
    warm: `Another dream come true! 🏡💕

So thrilled to announce this beautiful home is officially UNDER CONTRACT!

Congrats to my amazing clients on finding their perfect match.

Thinking about making your next move? Let's chat about what's possible.`,
    luxury: `UNDER CONTRACT

This distinguished residence has been secured by a discerning buyer.

For access to exclusive off-market opportunities, I invite you to connect with me directly.`,
    urgent: `⚡ AND JUST LIKE THAT... UNDER CONTRACT! ⚡

Multiple offers. This is what happens when you have the right strategy and the right agent.

Ready to be my next success story? Let's go! 📱`
  },
  just_sold: {
    professional: `🎉 JUST SOLD

Another successful closing! Congratulations to all parties.

Ready to start your real estate journey?`,
    warm: `SOLD! 🏠🎉

I'm so happy for my wonderful clients who just got the keys to their dream home!

The journey to homeownership is one of the most rewarding things I get to be part of. Here's to new beginnings and making memories!

Thinking about buying or selling? Let's make your dreams happen too. 💛`,
    luxury: `SOLD

Another exceptional property has transitioned to its distinguished new owners.

For discreet representation in your next acquisition, I welcome your inquiry.`,
    urgent: `🔥 ANOTHER ONE SOLD! 🔥

✅ CLOSED
Multiple offers received

My clients trusted the process and WON.

Sellers: Let's get you SOLD. Buyers: Let's get you IN.

Who's next? 📱`
  }
}

export default CaptionPreview
