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
