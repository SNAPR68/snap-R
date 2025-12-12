'use client'

import { useState } from 'react'
import { 
  Megaphone, 
  Clock, 
  CalendarDays, 
  TrendingDown, 
  FileCheck, 
  PartyPopper,
  Briefcase,
  Heart,
  Crown,
  Zap
} from 'lucide-react'

// ============================================
// POST TYPES
// ============================================

export type PostType = 
  | 'just_listed' 
  | 'coming_soon' 
  | 'open_house' 
  | 'price_improvement' 
  | 'under_contract' 
  | 'just_sold'

export interface PostTypeConfig {
  id: PostType
  name: string
  icon: any
  description: string
  color: string
  bgColor: string
  captionPrefix: string
  hashtagSuffix: string[]
}

export const POST_TYPES: PostTypeConfig[] = [
  {
    id: 'just_listed',
    name: 'Just Listed',
    icon: Megaphone,
    description: 'Announce a new listing',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
    captionPrefix: '🏡 JUST LISTED',
    hashtagSuffix: ['JustListed', 'NewListing', 'ForSale']
  },
  {
    id: 'coming_soon',
    name: 'Coming Soon',
    icon: Clock,
    description: 'Teaser before listing goes live',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/30',
    captionPrefix: '👀 COMING SOON',
    hashtagSuffix: ['ComingSoon', 'SneakPeek', 'OffMarket']
  },
  {
    id: 'open_house',
    name: 'Open House',
    icon: CalendarDays,
    description: 'Promote an open house event',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    captionPrefix: '🚪 OPEN HOUSE',
    hashtagSuffix: ['OpenHouse', 'OpenHouseWeekend', 'HouseTour']
  },
  {
    id: 'price_improvement',
    name: 'Price Improvement',
    icon: TrendingDown,
    description: 'Highlight a price reduction',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30',
    captionPrefix: '📉 PRICE IMPROVEMENT',
    hashtagSuffix: ['PriceReduced', 'PriceDrop', 'MotivatedSeller']
  },
  {
    id: 'under_contract',
    name: 'Under Contract',
    icon: FileCheck,
    description: 'Show property is pending',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20 border-yellow-500/30',
    captionPrefix: '📝 UNDER CONTRACT',
    hashtagSuffix: ['UnderContract', 'Pending', 'OfferAccepted']
  },
  {
    id: 'just_sold',
    name: 'Just Sold',
    icon: PartyPopper,
    description: 'Celebrate a closed deal',
    color: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/20 border-[#D4AF37]/30',
    captionPrefix: '🎉 JUST SOLD',
    hashtagSuffix: ['JustSold', 'Sold', 'ClosedDeal', 'AnotherOneSOLD']
  }
]

// ============================================
// TONE TYPES
// ============================================

export type ToneType = 'professional' | 'warm' | 'luxury' | 'urgent'

export interface ToneConfig {
  id: ToneType
  name: string
  icon: any
  description: string
  color: string
  bgColor: string
  promptModifier: string
  examplePhrase: string
}

export const TONE_TYPES: ToneConfig[] = [
  {
    id: 'professional',
    name: 'Professional',
    icon: Briefcase,
    description: 'Formal, business-focused',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    promptModifier: 'professional, formal, business-appropriate tone. Use proper real estate terminology. Be concise and informative.',
    examplePhrase: 'This exceptional property offers...'
  },
  {
    id: 'warm',
    name: 'Warm',
    icon: Heart,
    description: 'Friendly, inviting, story-driven',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20 border-pink-500/30',
    promptModifier: 'warm, friendly, and inviting tone. Paint a picture of lifestyle. Use emotional language that helps buyers envision living there.',
    examplePhrase: 'Imagine Sunday mornings in this sun-filled kitchen...'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    icon: Crown,
    description: 'Exclusive, sophisticated',
    color: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/20 border-[#D4AF37]/30',
    promptModifier: 'luxurious, sophisticated, and exclusive tone. Use elevated vocabulary. Emphasize prestige, craftsmanship, and exclusivity. Avoid common phrases.',
    examplePhrase: 'A rare offering of unparalleled elegance...'
  },
  {
    id: 'urgent',
    name: 'Urgent',
    icon: Zap,
    description: 'FOMO, limited opportunity',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    promptModifier: 'urgent, exciting tone that creates FOMO (fear of missing out). Emphasize scarcity, demand, and limited opportunity. Use action words.',
    examplePhrase: "Don't miss this one! In this market, it won't last..."
  }
]

// ============================================
// POST TYPE SELECTOR COMPONENT
// ============================================

interface PostTypeSelectorProps {
  selected: PostType
  onChange: (type: PostType) => void
}

export function PostTypeSelector({ selected, onChange }: PostTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] text-white/40 uppercase tracking-wide block">
        Post Type
      </label>
      <div className="grid grid-cols-3 gap-2">
        {POST_TYPES.map(type => {
          const isSelected = selected === type.id
          const Icon = type.icon
          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-lg border transition-all
                ${isSelected 
                  ? `${type.bgColor} border-current ${type.color}` 
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-medium text-center leading-tight">
                {type.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// TONE SELECTOR COMPONENT
// ============================================

interface ToneSelectorProps {
  selected: ToneType
  onChange: (tone: ToneType) => void
}

export function ToneSelector({ selected, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] text-white/40 uppercase tracking-wide block">
        Caption Tone
      </label>
      <div className="grid grid-cols-2 gap-2">
        {TONE_TYPES.map(tone => {
          const isSelected = selected === tone.id
          const Icon = tone.icon
          return (
            <button
              key={tone.id}
              onClick={() => onChange(tone.id)}
              className={`
                flex items-center gap-2 p-2 rounded-lg border transition-all
                ${isSelected 
                  ? `${tone.bgColor} border-current ${tone.color}` 
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <span className="text-[10px] font-medium block">
                  {tone.name}
                </span>
                <span className="text-[8px] opacity-70">
                  {tone.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// COMBINED SELECTOR (for compact UI)
// ============================================

interface ContentOptionsProps {
  postType: PostType
  tone: ToneType
  onPostTypeChange: (type: PostType) => void
  onToneChange: (tone: ToneType) => void
}

export function ContentOptions({ 
  postType, 
  tone, 
  onPostTypeChange, 
  onToneChange 
}: ContentOptionsProps) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-4">
      <PostTypeSelector selected={postType} onChange={onPostTypeChange} />
      <div className="border-t border-white/10" />
      <ToneSelector selected={tone} onChange={onToneChange} />
    </div>
  )
}

export default ContentOptions
