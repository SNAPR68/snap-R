// ============================================
// SNAPR WORLD-CLASS TEMPLATE LIBRARY
// 36 Unique Templates (6 per Post Type)
// ============================================

export interface TemplateDefinition {
  id: string
  name: string
  category: 'just-listed' | 'coming-soon' | 'open-house' | 'price-reduced' | 'under-contract' | 'just-sold'
  platform: 'instagram' | 'facebook' | 'linkedin' | 'story'
  style: 'modern' | 'luxury' | 'minimal' | 'bold' | 'elegant' | 'editorial'
  thumbnail: string
  dimensions: { width: number; height: number }
  description?: string
}

// ============================================
// TEMPLATE CATEGORIES (Updated with all 6)
// ============================================

export const TEMPLATE_CATEGORIES = [
  { id: 'just-listed', name: 'Just Listed', icon: '🏠' },
  { id: 'coming-soon', name: 'Coming Soon', icon: '��' },
  { id: 'open-house', name: 'Open House', icon: '🚪' },
  { id: 'price-reduced', name: 'Price Reduced', icon: '💰' },
  { id: 'under-contract', name: 'Under Contract', icon: '📝' },
  { id: 'just-sold', name: 'Just Sold', icon: '🎉' }
]

// ============================================
// INSTAGRAM TEMPLATES (1080 x 1080)
// 6 templates per category = 36 total
// ============================================

export const INSTAGRAM_POST_TEMPLATES: TemplateDefinition[] = [
  // ========== JUST LISTED (6) ==========
  {
    id: 'jl-modern-clean',
    name: 'Modern Clean',
    category: 'just-listed',
    platform: 'instagram',
    style: 'modern',
    thumbnail: '/templates/jl-modern.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Clean lines with gold accent banner'
  },
  {
    id: 'jl-luxury-gold',
    name: 'Luxury Gold',
    category: 'just-listed',
    platform: 'instagram',
    style: 'luxury',
    thumbnail: '/templates/jl-luxury.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Premium gold frame with elegant typography'
  },
  {
    id: 'jl-minimal-white',
    name: 'Minimal White',
    category: 'just-listed',
    platform: 'instagram',
    style: 'minimal',
    thumbnail: '/templates/jl-minimal.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Clean white overlay with subtle details'
  },
  {
    id: 'jl-bold-impact',
    name: 'Bold Impact',
    category: 'just-listed',
    platform: 'instagram',
    style: 'bold',
    thumbnail: '/templates/jl-bold.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'High contrast with bold typography'
  },
  {
    id: 'jl-editorial',
    name: 'Editorial Magazine',
    category: 'just-listed',
    platform: 'instagram',
    style: 'editorial',
    thumbnail: '/templates/jl-editorial.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Magazine-style layout with feature text'
  },
  {
    id: 'jl-glass-card',
    name: 'Glass Card',
    category: 'just-listed',
    platform: 'instagram',
    style: 'elegant',
    thumbnail: '/templates/jl-glass.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Frosted glass card overlay effect'
  },

  // ========== COMING SOON (6) ==========
  {
    id: 'cs-mystery-blur',
    name: 'Mystery Blur',
    category: 'coming-soon',
    platform: 'instagram',
    style: 'modern',
    thumbnail: '/templates/cs-blur.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Blurred preview with teaser text'
  },
  {
    id: 'cs-countdown',
    name: 'Countdown',
    category: 'coming-soon',
    platform: 'instagram',
    style: 'bold',
    thumbnail: '/templates/cs-countdown.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Countdown timer style reveal'
  },
  {
    id: 'cs-sneak-peek',
    name: 'Sneak Peek',
    category: 'coming-soon',
    platform: 'instagram',
    style: 'elegant',
    thumbnail: '/templates/cs-peek.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Partial reveal with curtain effect'
  },
  {
    id: 'cs-exclusive',
    name: 'Exclusive Preview',
    category: 'coming-soon',
    platform: 'instagram',
    style: 'luxury',
    thumbnail: '/templates/cs-exclusive.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'VIP exclusive access styling'
  },
  {
    id: 'cs-dark-teaser',
    name: 'Dark Teaser',
    category: 'coming-soon',
    platform: 'instagram',
    style: 'minimal',
    thumbnail: '/templates/cs-dark.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Dark moody teaser aesthetic'
  },
  {
    id: 'cs-notification',
    name: 'Get Notified',
    category: 'coming-soon',
    platform: 'instagram',
    style: 'editorial',
    thumbnail: '/templates/cs-notify.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Bell notification CTA style'
  },

  // ========== OPEN HOUSE (6) ==========
  {
    id: 'oh-invitation',
    name: 'Elegant Invitation',
    category: 'open-house',
    platform: 'instagram',
    style: 'elegant',
    thumbnail: '/templates/oh-invite.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Formal invitation card style'
  },
  {
    id: 'oh-calendar',
    name: 'Calendar Date',
    category: 'open-house',
    platform: 'instagram',
    style: 'modern',
    thumbnail: '/templates/oh-calendar.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Bold calendar date display'
  },
  {
    id: 'oh-welcome',
    name: 'Welcome Home',
    category: 'open-house',
    platform: 'instagram',
    style: 'minimal',
    thumbnail: '/templates/oh-welcome.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Warm welcoming door theme'
  },
  {
    id: 'oh-weekend',
    name: 'Weekend Special',
    category: 'open-house',
    platform: 'instagram',
    style: 'bold',
    thumbnail: '/templates/oh-weekend.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Weekend open house banner'
  },
  {
    id: 'oh-luxury-event',
    name: 'Luxury Event',
    category: 'open-house',
    platform: 'instagram',
    style: 'luxury',
    thumbnail: '/templates/oh-luxury.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'High-end event invitation'
  },
  {
    id: 'oh-rsvp',
    name: 'RSVP Style',
    category: 'open-house',
    platform: 'instagram',
    style: 'editorial',
    thumbnail: '/templates/oh-rsvp.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'RSVP call-to-action focused'
  },

  // ========== PRICE REDUCED (6) ==========
  {
    id: 'pr-strikethrough',
    name: 'Price Strike',
    category: 'price-reduced',
    platform: 'instagram',
    style: 'bold',
    thumbnail: '/templates/pr-strike.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Strikethrough old price effect'
  },
  {
    id: 'pr-savings-badge',
    name: 'Savings Badge',
    category: 'price-reduced',
    platform: 'instagram',
    style: 'modern',
    thumbnail: '/templates/pr-badge.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Savings amount highlighted'
  },
  {
    id: 'pr-new-price',
    name: 'New Price',
    category: 'price-reduced',
    platform: 'instagram',
    style: 'minimal',
    thumbnail: '/templates/pr-new.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Clean new price focus'
  },
  {
    id: 'pr-opportunity',
    name: 'Opportunity',
    category: 'price-reduced',
    platform: 'instagram',
    style: 'elegant',
    thumbnail: '/templates/pr-opportunity.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Value opportunity messaging'
  },
  {
    id: 'pr-motivated',
    name: 'Motivated Seller',
    category: 'price-reduced',
    platform: 'instagram',
    style: 'luxury',
    thumbnail: '/templates/pr-motivated.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Urgency with class'
  },
  {
    id: 'pr-deal-alert',
    name: 'Deal Alert',
    category: 'price-reduced',
    platform: 'instagram',
    style: 'editorial',
    thumbnail: '/templates/pr-deal.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Alert notification style'
  },

  // ========== UNDER CONTRACT (6) ==========
  {
    id: 'uc-pending-banner',
    name: 'Pending Banner',
    category: 'under-contract',
    platform: 'instagram',
    style: 'modern',
    thumbnail: '/templates/uc-pending.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Diagonal pending banner'
  },
  {
    id: 'uc-offer-accepted',
    name: 'Offer Accepted',
    category: 'under-contract',
    platform: 'instagram',
    style: 'elegant',
    thumbnail: '/templates/uc-accepted.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Celebratory offer accepted'
  },
  {
    id: 'uc-moving-fast',
    name: 'Moving Fast',
    category: 'under-contract',
    platform: 'instagram',
    style: 'bold',
    thumbnail: '/templates/uc-fast.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Speed/urgency messaging'
  },
  {
    id: 'uc-success-check',
    name: 'Success Check',
    category: 'under-contract',
    platform: 'instagram',
    style: 'minimal',
    thumbnail: '/templates/uc-check.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Checkmark success indicator'
  },
  {
    id: 'uc-contract-signed',
    name: 'Contract Signed',
    category: 'under-contract',
    platform: 'instagram',
    style: 'luxury',
    thumbnail: '/templates/uc-signed.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Formal contract signed style'
  },
  {
    id: 'uc-buyers-found',
    name: 'Buyers Found',
    category: 'under-contract',
    platform: 'instagram',
    style: 'editorial',
    thumbnail: '/templates/uc-buyers.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Happy buyers messaging'
  },

  // ========== JUST SOLD (6) ==========
  {
    id: 'js-sold-banner',
    name: 'SOLD Banner',
    category: 'just-sold',
    platform: 'instagram',
    style: 'bold',
    thumbnail: '/templates/js-banner.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Bold SOLD diagonal banner'
  },
  {
    id: 'js-celebration',
    name: 'Celebration',
    category: 'just-sold',
    platform: 'instagram',
    style: 'modern',
    thumbnail: '/templates/js-celebrate.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Confetti celebration style'
  },
  {
    id: 'js-gold-success',
    name: 'Gold Success',
    category: 'just-sold',
    platform: 'instagram',
    style: 'luxury',
    thumbnail: '/templates/js-gold.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Premium gold sold badge'
  },
  {
    id: 'js-achievement',
    name: 'Achievement',
    category: 'just-sold',
    platform: 'instagram',
    style: 'elegant',
    thumbnail: '/templates/js-achieve.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Trophy/achievement style'
  },
  {
    id: 'js-record-sale',
    name: 'Record Sale',
    category: 'just-sold',
    platform: 'instagram',
    style: 'editorial',
    thumbnail: '/templates/js-record.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Record breaking sale highlight'
  },
  {
    id: 'js-minimal-sold',
    name: 'Minimal Sold',
    category: 'just-sold',
    platform: 'instagram',
    style: 'minimal',
    thumbnail: '/templates/js-minimal.jpg',
    dimensions: { width: 1080, height: 1080 },
    description: 'Clean understated sold'
  }
]

// ============================================
// FACEBOOK TEMPLATES (1200 x 630)
// ============================================

export const FACEBOOK_POST_TEMPLATES: TemplateDefinition[] = [
  // Just Listed
  { id: 'fb-jl-modern', name: 'Modern', category: 'just-listed', platform: 'facebook', style: 'modern', thumbnail: '/templates/fb-jl-modern.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-jl-luxury', name: 'Luxury', category: 'just-listed', platform: 'facebook', style: 'luxury', thumbnail: '/templates/fb-jl-luxury.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-jl-minimal', name: 'Minimal', category: 'just-listed', platform: 'facebook', style: 'minimal', thumbnail: '/templates/fb-jl-minimal.jpg', dimensions: { width: 1200, height: 630 } },
  // Coming Soon
  { id: 'fb-cs-blur', name: 'Mystery Blur', category: 'coming-soon', platform: 'facebook', style: 'modern', thumbnail: '/templates/fb-cs-blur.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-cs-exclusive', name: 'Exclusive', category: 'coming-soon', platform: 'facebook', style: 'luxury', thumbnail: '/templates/fb-cs-exclusive.jpg', dimensions: { width: 1200, height: 630 } },
  // Open House
  { id: 'fb-oh-invite', name: 'Invitation', category: 'open-house', platform: 'facebook', style: 'elegant', thumbnail: '/templates/fb-oh-invite.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-oh-calendar', name: 'Calendar', category: 'open-house', platform: 'facebook', style: 'modern', thumbnail: '/templates/fb-oh-calendar.jpg', dimensions: { width: 1200, height: 630 } },
  // Price Reduced
  { id: 'fb-pr-strike', name: 'Price Strike', category: 'price-reduced', platform: 'facebook', style: 'bold', thumbnail: '/templates/fb-pr-strike.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-pr-savings', name: 'Savings', category: 'price-reduced', platform: 'facebook', style: 'modern', thumbnail: '/templates/fb-pr-savings.jpg', dimensions: { width: 1200, height: 630 } },
  // Under Contract
  { id: 'fb-uc-pending', name: 'Pending', category: 'under-contract', platform: 'facebook', style: 'modern', thumbnail: '/templates/fb-uc-pending.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-uc-accepted', name: 'Accepted', category: 'under-contract', platform: 'facebook', style: 'elegant', thumbnail: '/templates/fb-uc-accepted.jpg', dimensions: { width: 1200, height: 630 } },
  // Just Sold
  { id: 'fb-js-banner', name: 'SOLD Banner', category: 'just-sold', platform: 'facebook', style: 'bold', thumbnail: '/templates/fb-js-banner.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-js-celebrate', name: 'Celebration', category: 'just-sold', platform: 'facebook', style: 'modern', thumbnail: '/templates/fb-js-celebrate.jpg', dimensions: { width: 1200, height: 630 } }
]

// ============================================
// LINKEDIN TEMPLATES (1200 x 627)
// ============================================

export const LINKEDIN_POST_TEMPLATES: TemplateDefinition[] = [
  { id: 'li-jl-professional', name: 'Professional', category: 'just-listed', platform: 'linkedin', style: 'modern', thumbnail: '/templates/li-jl-pro.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-jl-corporate', name: 'Corporate', category: 'just-listed', platform: 'linkedin', style: 'minimal', thumbnail: '/templates/li-jl-corp.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-cs-coming', name: 'Coming Soon', category: 'coming-soon', platform: 'linkedin', style: 'elegant', thumbnail: '/templates/li-cs.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-oh-event', name: 'Open House Event', category: 'open-house', platform: 'linkedin', style: 'modern', thumbnail: '/templates/li-oh.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-pr-value', name: 'Value Update', category: 'price-reduced', platform: 'linkedin', style: 'minimal', thumbnail: '/templates/li-pr.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-uc-pending', name: 'Under Contract', category: 'under-contract', platform: 'linkedin', style: 'modern', thumbnail: '/templates/li-uc.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-js-sold', name: 'Just Sold', category: 'just-sold', platform: 'linkedin', style: 'elegant', thumbnail: '/templates/li-js.jpg', dimensions: { width: 1200, height: 627 } }
]

// ============================================
// VERTICAL TEMPLATES (1080 x 1920) - Stories/TikTok
// ============================================

export const VERTICAL_TEMPLATES: TemplateDefinition[] = [
  // Just Listed
  { id: 'v-jl-modern', name: 'Modern', category: 'just-listed', platform: 'story', style: 'modern', thumbnail: '/templates/v-jl-modern.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-jl-luxury', name: 'Luxury', category: 'just-listed', platform: 'story', style: 'luxury', thumbnail: '/templates/v-jl-luxury.jpg', dimensions: { width: 1080, height: 1920 } },
  // Coming Soon
  { id: 'v-cs-blur', name: 'Mystery', category: 'coming-soon', platform: 'story', style: 'modern', thumbnail: '/templates/v-cs-blur.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-cs-exclusive', name: 'Exclusive', category: 'coming-soon', platform: 'story', style: 'luxury', thumbnail: '/templates/v-cs-exclusive.jpg', dimensions: { width: 1080, height: 1920 } },
  // Open House
  { id: 'v-oh-invite', name: 'Invitation', category: 'open-house', platform: 'story', style: 'elegant', thumbnail: '/templates/v-oh-invite.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-oh-swipe', name: 'Swipe Up', category: 'open-house', platform: 'story', style: 'bold', thumbnail: '/templates/v-oh-swipe.jpg', dimensions: { width: 1080, height: 1920 } },
  // Price Reduced
  { id: 'v-pr-alert', name: 'Price Alert', category: 'price-reduced', platform: 'story', style: 'bold', thumbnail: '/templates/v-pr-alert.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-pr-savings', name: 'Savings', category: 'price-reduced', platform: 'story', style: 'modern', thumbnail: '/templates/v-pr-savings.jpg', dimensions: { width: 1080, height: 1920 } },
  // Under Contract
  { id: 'v-uc-pending', name: 'Pending', category: 'under-contract', platform: 'story', style: 'modern', thumbnail: '/templates/v-uc-pending.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-uc-fast', name: 'Moving Fast', category: 'under-contract', platform: 'story', style: 'bold', thumbnail: '/templates/v-uc-fast.jpg', dimensions: { width: 1080, height: 1920 } },
  // Just Sold
  { id: 'v-js-sold', name: 'SOLD', category: 'just-sold', platform: 'story', style: 'bold', thumbnail: '/templates/v-js-sold.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-js-celebrate', name: 'Celebration', category: 'just-sold', platform: 'story', style: 'modern', thumbnail: '/templates/v-js-celebrate.jpg', dimensions: { width: 1080, height: 1920 } }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTemplateById(id: string): TemplateDefinition | undefined {
  const allTemplates = [
    ...INSTAGRAM_POST_TEMPLATES,
    ...FACEBOOK_POST_TEMPLATES,
    ...LINKEDIN_POST_TEMPLATES,
    ...VERTICAL_TEMPLATES
  ]
  return allTemplates.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): TemplateDefinition[] {
  return INSTAGRAM_POST_TEMPLATES.filter(t => t.category === category)
}

export function getFacebookTemplates(): TemplateDefinition[] {
  return FACEBOOK_POST_TEMPLATES
}

export function getLinkedInTemplates(): TemplateDefinition[] {
  return LINKEDIN_POST_TEMPLATES
}

export function getVerticalTemplates(): TemplateDefinition[] {
  return VERTICAL_TEMPLATES
}

export function getFacebookTemplatesByCategory(category: string): TemplateDefinition[] {
  return FACEBOOK_POST_TEMPLATES.filter(t => t.category === category)
}

export function getLinkedInTemplatesByCategory(category: string): TemplateDefinition[] {
  return LINKEDIN_POST_TEMPLATES.filter(t => t.category === category)
}

export function getVerticalTemplatesByCategory(category: string): TemplateDefinition[] {
  return VERTICAL_TEMPLATES.filter(t => t.category === category)
}


// ============================================
// ADDITIONAL TEMPLATES (6 per category per platform)
// ============================================

// Facebook additions
FACEBOOK_POST_TEMPLATES.push(
  { id: 'fb-cs-countdown', name: 'Countdown', category: 'coming-soon', platform: 'facebook', style: 'bold', thumbnail: '/templates/fb-cs-countdown.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-cs-sneak', name: 'Sneak Peek', category: 'coming-soon', platform: 'facebook', style: 'elegant', thumbnail: '/templates/fb-cs-sneak.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-cs-dark', name: 'Dark Teaser', category: 'coming-soon', platform: 'facebook', style: 'minimal', thumbnail: '/templates/fb-cs-dark.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-cs-notify', name: 'Get Notified', category: 'coming-soon', platform: 'facebook', style: 'editorial', thumbnail: '/templates/fb-cs-notify.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-jl-bold', name: 'Bold Impact', category: 'just-listed', platform: 'facebook', style: 'bold', thumbnail: '/templates/fb-jl-bold.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-jl-editorial', name: 'Editorial', category: 'just-listed', platform: 'facebook', style: 'editorial', thumbnail: '/templates/fb-jl-editorial.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-jl-glass', name: 'Glass Card', category: 'just-listed', platform: 'facebook', style: 'elegant', thumbnail: '/templates/fb-jl-glass.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-oh-welcome', name: 'Welcome Home', category: 'open-house', platform: 'facebook', style: 'minimal', thumbnail: '/templates/fb-oh-welcome.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-oh-weekend', name: 'Weekend Special', category: 'open-house', platform: 'facebook', style: 'bold', thumbnail: '/templates/fb-oh-weekend.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-oh-luxury', name: 'Luxury Event', category: 'open-house', platform: 'facebook', style: 'luxury', thumbnail: '/templates/fb-oh-luxury.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-oh-rsvp', name: 'RSVP Style', category: 'open-house', platform: 'facebook', style: 'editorial', thumbnail: '/templates/fb-oh-rsvp.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-pr-new', name: 'New Price', category: 'price-reduced', platform: 'facebook', style: 'minimal', thumbnail: '/templates/fb-pr-new.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-pr-opportunity', name: 'Opportunity', category: 'price-reduced', platform: 'facebook', style: 'elegant', thumbnail: '/templates/fb-pr-opportunity.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-pr-motivated', name: 'Motivated Seller', category: 'price-reduced', platform: 'facebook', style: 'luxury', thumbnail: '/templates/fb-pr-motivated.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-pr-deal', name: 'Deal Alert', category: 'price-reduced', platform: 'facebook', style: 'editorial', thumbnail: '/templates/fb-pr-deal.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-uc-fast', name: 'Moving Fast', category: 'under-contract', platform: 'facebook', style: 'bold', thumbnail: '/templates/fb-uc-fast.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-uc-check', name: 'Success Check', category: 'under-contract', platform: 'facebook', style: 'minimal', thumbnail: '/templates/fb-uc-check.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-uc-signed', name: 'Contract Signed', category: 'under-contract', platform: 'facebook', style: 'luxury', thumbnail: '/templates/fb-uc-signed.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-uc-buyers', name: 'Buyers Found', category: 'under-contract', platform: 'facebook', style: 'editorial', thumbnail: '/templates/fb-uc-buyers.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-js-gold', name: 'Gold Success', category: 'just-sold', platform: 'facebook', style: 'luxury', thumbnail: '/templates/fb-js-gold.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-js-achieve', name: 'Achievement', category: 'just-sold', platform: 'facebook', style: 'elegant', thumbnail: '/templates/fb-js-achieve.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-js-record', name: 'Record Sale', category: 'just-sold', platform: 'facebook', style: 'editorial', thumbnail: '/templates/fb-js-record.jpg', dimensions: { width: 1200, height: 630 } },
  { id: 'fb-js-minimal', name: 'Minimal Sold', category: 'just-sold', platform: 'facebook', style: 'minimal', thumbnail: '/templates/fb-js-minimal.jpg', dimensions: { width: 1200, height: 630 } }
);

// LinkedIn additions
LINKEDIN_POST_TEMPLATES.push(
  { id: 'li-jl-luxury', name: 'Luxury', category: 'just-listed', platform: 'linkedin', style: 'luxury', thumbnail: '/templates/li-jl-luxury.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-jl-bold', name: 'Bold Impact', category: 'just-listed', platform: 'linkedin', style: 'bold', thumbnail: '/templates/li-jl-bold.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-jl-editorial', name: 'Editorial', category: 'just-listed', platform: 'linkedin', style: 'editorial', thumbnail: '/templates/li-jl-editorial.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-jl-elegant', name: 'Elegant', category: 'just-listed', platform: 'linkedin', style: 'elegant', thumbnail: '/templates/li-jl-elegant.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-cs-blur', name: 'Mystery Blur', category: 'coming-soon', platform: 'linkedin', style: 'modern', thumbnail: '/templates/li-cs-blur.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-cs-countdown', name: 'Countdown', category: 'coming-soon', platform: 'linkedin', style: 'bold', thumbnail: '/templates/li-cs-countdown.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-cs-exclusive', name: 'Exclusive', category: 'coming-soon', platform: 'linkedin', style: 'luxury', thumbnail: '/templates/li-cs-exclusive.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-cs-dark', name: 'Dark Teaser', category: 'coming-soon', platform: 'linkedin', style: 'minimal', thumbnail: '/templates/li-cs-dark.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-cs-notify', name: 'Get Notified', category: 'coming-soon', platform: 'linkedin', style: 'editorial', thumbnail: '/templates/li-cs-notify.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-oh-invite', name: 'Invitation', category: 'open-house', platform: 'linkedin', style: 'elegant', thumbnail: '/templates/li-oh-invite.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-oh-calendar', name: 'Calendar', category: 'open-house', platform: 'linkedin', style: 'bold', thumbnail: '/templates/li-oh-calendar.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-oh-welcome', name: 'Welcome', category: 'open-house', platform: 'linkedin', style: 'minimal', thumbnail: '/templates/li-oh-welcome.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-oh-luxury', name: 'Luxury Event', category: 'open-house', platform: 'linkedin', style: 'luxury', thumbnail: '/templates/li-oh-luxury.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-oh-rsvp', name: 'RSVP', category: 'open-house', platform: 'linkedin', style: 'editorial', thumbnail: '/templates/li-oh-rsvp.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-pr-strike', name: 'Price Strike', category: 'price-reduced', platform: 'linkedin', style: 'bold', thumbnail: '/templates/li-pr-strike.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-pr-savings', name: 'Savings', category: 'price-reduced', platform: 'linkedin', style: 'modern', thumbnail: '/templates/li-pr-savings.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-pr-opportunity', name: 'Opportunity', category: 'price-reduced', platform: 'linkedin', style: 'elegant', thumbnail: '/templates/li-pr-opportunity.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-pr-motivated', name: 'Motivated', category: 'price-reduced', platform: 'linkedin', style: 'luxury', thumbnail: '/templates/li-pr-motivated.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-pr-deal', name: 'Deal Alert', category: 'price-reduced', platform: 'linkedin', style: 'editorial', thumbnail: '/templates/li-pr-deal.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-uc-accepted', name: 'Offer Accepted', category: 'under-contract', platform: 'linkedin', style: 'elegant', thumbnail: '/templates/li-uc-accepted.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-uc-fast', name: 'Moving Fast', category: 'under-contract', platform: 'linkedin', style: 'bold', thumbnail: '/templates/li-uc-fast.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-uc-check', name: 'Success', category: 'under-contract', platform: 'linkedin', style: 'minimal', thumbnail: '/templates/li-uc-check.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-uc-signed', name: 'Contract Signed', category: 'under-contract', platform: 'linkedin', style: 'luxury', thumbnail: '/templates/li-uc-signed.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-uc-buyers', name: 'Buyers Found', category: 'under-contract', platform: 'linkedin', style: 'editorial', thumbnail: '/templates/li-uc-buyers.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-js-banner', name: 'SOLD Banner', category: 'just-sold', platform: 'linkedin', style: 'bold', thumbnail: '/templates/li-js-banner.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-js-celebrate', name: 'Celebration', category: 'just-sold', platform: 'linkedin', style: 'modern', thumbnail: '/templates/li-js-celebrate.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-js-gold', name: 'Gold Success', category: 'just-sold', platform: 'linkedin', style: 'luxury', thumbnail: '/templates/li-js-gold.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-js-achieve', name: 'Achievement', category: 'just-sold', platform: 'linkedin', style: 'editorial', thumbnail: '/templates/li-js-achieve.jpg', dimensions: { width: 1200, height: 627 } },
  { id: 'li-js-minimal', name: 'Minimal', category: 'just-sold', platform: 'linkedin', style: 'minimal', thumbnail: '/templates/li-js-minimal.jpg', dimensions: { width: 1200, height: 627 } }
);

// Vertical additions
VERTICAL_TEMPLATES.push(
  { id: 'v-jl-minimal', name: 'Minimal', category: 'just-listed', platform: 'story', style: 'minimal', thumbnail: '/templates/v-jl-minimal.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-jl-bold', name: 'Bold Impact', category: 'just-listed', platform: 'story', style: 'bold', thumbnail: '/templates/v-jl-bold.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-jl-editorial', name: 'Editorial', category: 'just-listed', platform: 'story', style: 'editorial', thumbnail: '/templates/v-jl-editorial.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-jl-elegant', name: 'Elegant', category: 'just-listed', platform: 'story', style: 'elegant', thumbnail: '/templates/v-jl-elegant.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-cs-countdown', name: 'Countdown', category: 'coming-soon', platform: 'story', style: 'bold', thumbnail: '/templates/v-cs-countdown.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-cs-sneak', name: 'Sneak Peek', category: 'coming-soon', platform: 'story', style: 'elegant', thumbnail: '/templates/v-cs-sneak.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-cs-dark', name: 'Dark Teaser', category: 'coming-soon', platform: 'story', style: 'minimal', thumbnail: '/templates/v-cs-dark.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-cs-notify', name: 'Get Notified', category: 'coming-soon', platform: 'story', style: 'editorial', thumbnail: '/templates/v-cs-notify.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-oh-calendar', name: 'Calendar', category: 'open-house', platform: 'story', style: 'modern', thumbnail: '/templates/v-oh-calendar.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-oh-welcome', name: 'Welcome', category: 'open-house', platform: 'story', style: 'minimal', thumbnail: '/templates/v-oh-welcome.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-oh-luxury', name: 'Luxury Event', category: 'open-house', platform: 'story', style: 'luxury', thumbnail: '/templates/v-oh-luxury.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-oh-rsvp', name: 'RSVP', category: 'open-house', platform: 'story', style: 'editorial', thumbnail: '/templates/v-oh-rsvp.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-pr-strike', name: 'Price Strike', category: 'price-reduced', platform: 'story', style: 'elegant', thumbnail: '/templates/v-pr-strike.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-pr-new', name: 'New Price', category: 'price-reduced', platform: 'story', style: 'minimal', thumbnail: '/templates/v-pr-new.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-pr-opportunity', name: 'Opportunity', category: 'price-reduced', platform: 'story', style: 'luxury', thumbnail: '/templates/v-pr-opportunity.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-pr-deal', name: 'Deal Alert', category: 'price-reduced', platform: 'story', style: 'editorial', thumbnail: '/templates/v-pr-deal.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-uc-accepted', name: 'Offer Accepted', category: 'under-contract', platform: 'story', style: 'elegant', thumbnail: '/templates/v-uc-accepted.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-uc-check', name: 'Success Check', category: 'under-contract', platform: 'story', style: 'minimal', thumbnail: '/templates/v-uc-check.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-uc-signed', name: 'Contract Signed', category: 'under-contract', platform: 'story', style: 'luxury', thumbnail: '/templates/v-uc-signed.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-uc-buyers', name: 'Buyers Found', category: 'under-contract', platform: 'story', style: 'editorial', thumbnail: '/templates/v-uc-buyers.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-js-gold', name: 'Gold Success', category: 'just-sold', platform: 'story', style: 'luxury', thumbnail: '/templates/v-js-gold.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-js-achieve', name: 'Achievement', category: 'just-sold', platform: 'story', style: 'elegant', thumbnail: '/templates/v-js-achieve.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-js-record', name: 'Record Sale', category: 'just-sold', platform: 'story', style: 'editorial', thumbnail: '/templates/v-js-record.jpg', dimensions: { width: 1080, height: 1920 } },
  { id: 'v-js-minimal', name: 'Minimal', category: 'just-sold', platform: 'story', style: 'minimal', thumbnail: '/templates/v-js-minimal.jpg', dimensions: { width: 1080, height: 1920 } }
);
