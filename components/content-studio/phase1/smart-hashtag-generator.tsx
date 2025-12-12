'use client'

import { useState } from 'react'
import { Hash, MapPin, Home, Sparkles, TrendingUp, Copy, Check, RefreshCw, X } from 'lucide-react'
import { PostType, POST_TYPES } from './post-type-selector'

// ============================================
// HASHTAG CATEGORIES & DATA
// ============================================

// US States with common city hashtag patterns
const STATE_HASHTAGS: Record<string, string[]> = {
  'CA': ['California', 'CaliforniaRealEstate', 'CaliLiving', 'SoCalHomes', 'NorCalRealEstate'],
  'TX': ['Texas', 'TexasRealEstate', 'TexasHomes', 'DFWRealEstate', 'ATXRealEstate'],
  'FL': ['Florida', 'FloridaRealEstate', 'FloridaHomes', 'SunshineState', 'FloridaLiving'],
  'NY': ['NewYork', 'NYRealEstate', 'NYCHomes', 'NewYorkHomes', 'NYLiving'],
  'AZ': ['Arizona', 'ArizonaRealEstate', 'AZHomes', 'PhoenixRealEstate', 'ArizonaLiving'],
  'NV': ['Nevada', 'NevadaRealEstate', 'LasVegasHomes', 'VegasRealEstate', 'NevadaHomes'],
  'WA': ['Washington', 'WashingtonRealEstate', 'SeattleHomes', 'PNWRealEstate', 'SeattleLiving'],
  'CO': ['Colorado', 'ColoradoRealEstate', 'DenverHomes', 'ColoradoLiving', 'MileHighCity'],
  'GA': ['Georgia', 'GeorgiaRealEstate', 'AtlantaHomes', 'ATLRealEstate', 'GeorgiaLiving'],
  'NC': ['NorthCarolina', 'NCRealEstate', 'CharlotteHomes', 'RaleighRealEstate', 'NCLiving'],
  'IL': ['Illinois', 'IllinoisRealEstate', 'ChicagoHomes', 'ChicagoRealEstate', 'WindyCity'],
  'PA': ['Pennsylvania', 'PARealEstate', 'PhillyHomes', 'PittsburghRealEstate', 'PALiving'],
  'OH': ['Ohio', 'OhioRealEstate', 'OhioHomes', 'ClevelandRealEstate', 'ColumbusHomes'],
  'MI': ['Michigan', 'MichiganRealEstate', 'DetroitHomes', 'PureMichigan', 'MichiganLiving'],
  'MA': ['Massachusetts', 'MARealEstate', 'BostonHomes', 'BostonRealEstate', 'NewEnglandHomes'],
}

// Property Type Hashtags
const PROPERTY_TYPE_HASHTAGS = {
  luxury: ['LuxuryRealEstate', 'LuxuryHomes', 'LuxuryListing', 'MillionDollarListing', 'LuxuryProperty', 'PrestigeHomes'],
  condo: ['CondoLife', 'CondoLiving', 'CondoForSale', 'UrbanLiving', 'CityLiving', 'DowntownLiving'],
  family: ['FamilyHome', 'DreamHome', 'FamilyLiving', 'SuburbanLiving', 'NeighborhoodVibes', 'BackyardGoals'],
  investment: ['InvestmentProperty', 'RealEstateInvesting', 'PassiveIncome', 'CashFlow', 'RentalProperty', 'REI'],
  new_construction: ['NewConstruction', 'NewBuild', 'BrandNew', 'NeverLivedIn', 'NewHome', 'JustBuilt'],
  historic: ['HistoricHome', 'VintageHome', 'CharacterHome', 'OldHouseCharm', 'HistoricProperty', 'Heritage'],
  waterfront: ['WaterfrontLiving', 'LakeLife', 'BeachHouse', 'WaterfrontHome', 'OceanView', 'Waterfront'],
  golf: ['GolfCourse', 'GolfCommunity', 'GolfLiving', 'GolfHome', 'CountryClub', 'GolfersParadise'],
}

// Engagement/Trending Hashtags
const ENGAGEMENT_HASHTAGS = [
  'RealEstate', 'Realtor', 'Home', 'House', 'Property', 'HomeForSale',
  'DreamHome', 'HouseHunting', 'HomeSweetHome', 'NewHome', 'FirstTimeHomeBuyer',
  'RealEstateAgent', 'RealEstateLife', 'RealtorLife', 'HomeOwnership', 'Homeowner',
  'HomeBuyer', 'HomeSeller', 'PropertyForSale', 'HouseGoals', 'InteriorDesign',
  'HomeDesign', 'Architecture', 'ModernHome', 'HomeInspiration', 'HomeDecor'
]

// Seasonal/Trending (rotate based on time of year)
const SEASONAL_HASHTAGS = {
  spring: ['SpringMarket', 'SpringSelling', 'SpringHome', 'FreshStart', 'SpringVibes'],
  summer: ['SummerHome', 'SummerLiving', 'PoolSeason', 'SummerMarket', 'OutdoorLiving'],
  fall: ['FallMarket', 'FallHome', 'CozyHome', 'HarvestSeason', 'FallVibes'],
  winter: ['WinterHome', 'HolidayHome', 'CozyLiving', 'WinterMarket', 'WarmAndCozy'],
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCurrentSeason(): keyof typeof SEASONAL_HASHTAGS {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

function formatCityHashtag(city: string): string {
  return city.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, '')
}

function inferPropertyType(price: number, bedrooms: number, sqft: number): string {
  if (price >= 2000000) return 'luxury'
  if (bedrooms <= 2 && sqft <= 1500) return 'condo'
  if (bedrooms >= 4 && sqft >= 2500) return 'family'
  return 'family' // default
}

// ============================================
// SMART HASHTAG GENERATOR
// ============================================

export interface HashtagGeneratorProps {
  city: string
  state: string
  price: number
  bedrooms: number
  sqft: number
  postType: PostType
  customHashtags?: string[]
  onHashtagsGenerated?: (hashtags: string[]) => void
}

export interface GeneratedHashtags {
  location: string[]
  property: string[]
  postType: string[]
  engagement: string[]
  seasonal: string[]
  custom: string[]
}

export function generateSmartHashtags({
  city,
  state,
  price,
  bedrooms,
  sqft,
  postType,
  customHashtags = []
}: HashtagGeneratorProps): GeneratedHashtags {
  
  // Location hashtags
  const locationTags: string[] = []
  
  // City-specific
  if (city) {
    const cityTag = formatCityHashtag(city)
    locationTags.push(`${cityTag}RealEstate`)
    locationTags.push(`${cityTag}Homes`)
    locationTags.push(`${cityTag}Living`)
  }
  
  // State-specific
  if (state && STATE_HASHTAGS[state]) {
    locationTags.push(...STATE_HASHTAGS[state].slice(0, 3))
  }
  
  // Property type hashtags
  const propertyType = inferPropertyType(price, bedrooms, sqft)
  const propertyTags = PROPERTY_TYPE_HASHTAGS[propertyType as keyof typeof PROPERTY_TYPE_HASHTAGS] || PROPERTY_TYPE_HASHTAGS.family
  
  // Post type hashtags
  const postTypeConfig = POST_TYPES.find(p => p.id === postType)
  const postTypeTags = postTypeConfig?.hashtagSuffix || []
  
  // Engagement hashtags (pick random 5)
  const shuffledEngagement = [...ENGAGEMENT_HASHTAGS].sort(() => Math.random() - 0.5)
  const engagementTags = shuffledEngagement.slice(0, 5)
  
  // Seasonal
  const season = getCurrentSeason()
  const seasonalTags = SEASONAL_HASHTAGS[season].slice(0, 2)
  
  return {
    location: locationTags.slice(0, 5),
    property: propertyTags.slice(0, 4),
    postType: postTypeTags,
    engagement: engagementTags,
    seasonal: seasonalTags,
    custom: customHashtags
  }
}

export function hashtagsToString(hashtags: GeneratedHashtags, maxCount: number = 30): string {
  const all = [
    ...hashtags.postType,
    ...hashtags.location,
    ...hashtags.property,
    ...hashtags.engagement,
    ...hashtags.seasonal,
    ...hashtags.custom
  ]
  
  // Remove duplicates and limit
  const unique = [...new Set(all)].slice(0, maxCount)
  
  return unique.map(tag => `#${tag}`).join(' ')
}

// ============================================
// HASHTAG DISPLAY COMPONENT
// ============================================

interface HashtagDisplayProps {
  hashtags: GeneratedHashtags
  onRemove?: (category: keyof GeneratedHashtags, tag: string) => void
  onAddCustom?: (tag: string) => void
  onRegenerate?: () => void
}

export function HashtagDisplay({ 
  hashtags, 
  onRemove, 
  onAddCustom,
  onRegenerate 
}: HashtagDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [customInput, setCustomInput] = useState('')
  
  const allHashtags = hashtagsToString(hashtags)
  const hashtagCount = allHashtags.split(' ').filter(Boolean).length
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(allHashtags)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleAddCustom = () => {
    if (customInput.trim() && onAddCustom) {
      const tag = customInput.replace(/^#/, '').replace(/\s+/g, '')
      onAddCustom(tag)
      setCustomInput('')
    }
  }
  
  const categories: { key: keyof GeneratedHashtags; label: string; icon: any; color: string }[] = [
    { key: 'postType', label: 'Post Type', icon: Sparkles, color: 'text-[#D4AF37]' },
    { key: 'location', label: 'Location', icon: MapPin, color: 'text-blue-400' },
    { key: 'property', label: 'Property', icon: Home, color: 'text-green-400' },
    { key: 'engagement', label: 'Engagement', icon: TrendingUp, color: 'text-pink-400' },
    { key: 'seasonal', label: 'Seasonal', icon: Sparkles, color: 'text-orange-400' },
  ]
  
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm font-medium text-white">Smart Hashtags</span>
          <span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
            {hashtagCount}/30
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition text-xs"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy All'}
          </button>
        </div>
      </div>
      
      {/* Categories */}
      <div className="space-y-2">
        {categories.map(({ key, label, icon: Icon, color }) => {
          const tags = hashtags[key]
          if (!tags || tags.length === 0) return null
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3 h-3 ${color}`} />
                <span className="text-[9px] text-white/40 uppercase tracking-wide">{label}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                      bg-white/10 text-white/80 hover:bg-white/15 transition
                      ${onRemove ? 'cursor-pointer group' : ''}
                    `}
                    onClick={() => onRemove?.(key, tag)}
                  >
                    #{tag}
                    {onRemove && (
                      <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        
        {/* Custom hashtags */}
        {hashtags.custom && hashtags.custom.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] text-white/40 uppercase tracking-wide">Custom</span>
            <div className="flex flex-wrap gap-1">
              {hashtags.custom.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] group cursor-pointer"
                  onClick={() => onRemove?.('custom', tag)}
                >
                  #{tag}
                  <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Add Custom */}
      {onAddCustom && (
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder="Add custom hashtag..."
            className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
          />
          <button
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}
      
      {/* Preview */}
      <div className="pt-2 border-t border-white/10">
        <p className="text-[10px] text-white/40 mb-1">Preview:</p>
        <p className="text-[10px] text-white/60 leading-relaxed break-words">
          {allHashtags}
        </p>
      </div>
    </div>
  )
}

export default HashtagDisplay
