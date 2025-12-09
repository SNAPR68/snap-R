// Instagram Post Template Definitions
// 5 "Just Listed" templates with different styles

export interface TemplateDefinition {
  id: string
  name: string
  category: 'just-listed' | 'open-house' | 'price-reduced' | 'just-sold'
  platform: 'instagram' | 'facebook' | 'linkedin' | 'story'
  style: 'modern' | 'luxury' | 'minimal' | 'bold' | 'elegant'
  thumbnail: string
  dimensions: { width: number; height: number }
}

export const INSTAGRAM_POST_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'just-listed-modern',
    name: 'Modern Clean',
    category: 'just-listed',
    platform: 'instagram',
    style: 'modern',
    thumbnail: '/templates/modern-thumb.jpg',
    dimensions: { width: 1080, height: 1080 }
  },
  {
    id: 'just-listed-luxury',
    name: 'Luxury Gold',
    category: 'just-listed',
    platform: 'instagram',
    style: 'luxury',
    thumbnail: '/templates/luxury-thumb.jpg',
    dimensions: { width: 1080, height: 1080 }
  },
  {
    id: 'just-listed-minimal',
    name: 'Minimal White',
    category: 'just-listed',
    platform: 'instagram',
    style: 'minimal',
    thumbnail: '/templates/minimal-thumb.jpg',
    dimensions: { width: 1080, height: 1080 }
  },
  {
    id: 'just-listed-bold',
    name: 'Bold Impact',
    category: 'just-listed',
    platform: 'instagram',
    style: 'bold',
    thumbnail: '/templates/bold-thumb.jpg',
    dimensions: { width: 1080, height: 1080 }
  },
  {
    id: 'just-listed-elegant',
    name: 'Elegant Dark',
    category: 'just-listed',
    platform: 'instagram',
    style: 'elegant',
    thumbnail: '/templates/elegant-thumb.jpg',
    dimensions: { width: 1080, height: 1080 }
  }
]

export const TEMPLATE_CATEGORIES = [
  { id: 'just-listed', name: 'Just Listed', icon: '🏠' },
  { id: 'open-house', name: 'Open House', icon: '🚪' },
  { id: 'price-reduced', name: 'Price Reduced', icon: '💰' },
  { id: 'just-sold', name: 'Just Sold', icon: '🎉' }
]

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return INSTAGRAM_POST_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): TemplateDefinition[] {
  return INSTAGRAM_POST_TEMPLATES.filter(t => t.category === category)
}

// Facebook Post Templates (1200 x 630)
export const FACEBOOK_POST_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'fb-just-listed-modern',
    name: 'Modern',
    category: 'just-listed',
    platform: 'facebook',
    style: 'modern',
    thumbnail: '/templates/fb-modern.jpg',
    dimensions: { width: 1200, height: 630 }
  },
  {
    id: 'fb-just-listed-luxury',
    name: 'Luxury',
    category: 'just-listed',
    platform: 'facebook',
    style: 'luxury',
    thumbnail: '/templates/fb-luxury.jpg',
    dimensions: { width: 1200, height: 630 }
  },
  {
    id: 'fb-just-listed-bold',
    name: 'Bold',
    category: 'just-listed',
    platform: 'facebook',
    style: 'bold',
    thumbnail: '/templates/fb-bold.jpg',
    dimensions: { width: 1200, height: 630 }
  },
  {
    id: 'fb-just-listed-minimal',
    name: 'Minimal',
    category: 'just-listed',
    platform: 'facebook',
    style: 'minimal',
    thumbnail: '/templates/fb-minimal.jpg',
    dimensions: { width: 1200, height: 630 }
  },
  {
    id: 'fb-just-listed-elegant',
    name: 'Elegant',
    category: 'just-listed',
    platform: 'facebook',
    style: 'elegant',
    thumbnail: '/templates/fb-elegant.jpg',
    dimensions: { width: 1200, height: 630 }
  }
]

// LinkedIn Post Templates (1200 x 627)
export const LINKEDIN_POST_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'li-just-listed-professional',
    name: 'Professional',
    category: 'just-listed',
    platform: 'linkedin',
    style: 'modern',
    thumbnail: '/templates/li-professional.jpg',
    dimensions: { width: 1200, height: 627 }
  },
  {
    id: 'li-just-listed-corporate',
    name: 'Corporate',
    category: 'just-listed',
    platform: 'linkedin',
    style: 'minimal',
    thumbnail: '/templates/li-corporate.jpg',
    dimensions: { width: 1200, height: 627 }
  },
  {
    id: 'li-just-listed-elegant',
    name: 'Elegant',
    category: 'just-listed',
    platform: 'linkedin',
    style: 'elegant',
    thumbnail: '/templates/li-elegant.jpg',
    dimensions: { width: 1200, height: 627 }
  }
]

export function getFacebookTemplates(): TemplateDefinition[] {
  return FACEBOOK_POST_TEMPLATES
}

export function getLinkedInTemplates(): TemplateDefinition[] {
  return LINKEDIN_POST_TEMPLATES
}

// Vertical Templates (1080 x 1920) - Instagram Stories & TikTok
export const VERTICAL_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'vertical-modern',
    name: 'Modern',
    category: 'just-listed',
    platform: 'story',
    style: 'modern',
    thumbnail: '/templates/story-modern.jpg',
    dimensions: { width: 1080, height: 1920 }
  },
  {
    id: 'vertical-luxury',
    name: 'Luxury',
    category: 'just-listed',
    platform: 'story',
    style: 'luxury',
    thumbnail: '/templates/story-luxury.jpg',
    dimensions: { width: 1080, height: 1920 }
  },
  {
    id: 'vertical-bold',
    name: 'Bold',
    category: 'just-listed',
    platform: 'story',
    style: 'bold',
    thumbnail: '/templates/story-bold.jpg',
    dimensions: { width: 1080, height: 1920 }
  },
  {
    id: 'vertical-minimal',
    name: 'Minimal',
    category: 'just-listed',
    platform: 'story',
    style: 'minimal',
    thumbnail: '/templates/story-minimal.jpg',
    dimensions: { width: 1080, height: 1920 }
  },
  {
    id: 'vertical-elegant',
    name: 'Elegant',
    category: 'just-listed',
    platform: 'story',
    style: 'elegant',
    thumbnail: '/templates/story-elegant.jpg',
    dimensions: { width: 1080, height: 1920 }
  }
]

export function getVerticalTemplates(): TemplateDefinition[] {
  return VERTICAL_TEMPLATES
}
