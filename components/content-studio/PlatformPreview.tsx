'use client'

import { forwardRef } from 'react'
import { TemplateRenderer, FacebookTemplateRenderer, VerticalTemplateRenderer } from './template-renderer'
import { TemplateDefinition } from '@/lib/content/templates'

interface PlatformPreviewProps {
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'story'
  templateId: string
  photoUrl: string
  headline: string
  property: {
    address: string
    city: string
    state: string
    price: number | null
    bedrooms: number | null
    bathrooms: number | null
    squareFeet: number | null
  }
  currentTemplate: TemplateDefinition
}

export const PlatformPreview = forwardRef<HTMLDivElement, PlatformPreviewProps>(
  ({ platform, photoUrl, headline, property, currentTemplate }, ref) => {
    const getDims = (p: string) => {
      switch (p) {
        case 'instagram':
          return { w: 1080, h: 1080 }
        case 'facebook':
          return { w: 1200, h: 630 }
        case 'linkedin':
          return { w: 1200, h: 627 }
        default:
          return { w: 1080, h: 1920 }
      }
    }

    const dims = getDims(platform)

    return (
      <div
        ref={ref}
        className="relative bg-black rounded-lg overflow-hidden mx-auto"
        style={{
          width: `${Math.min(dims.w, 400)}px`,
          aspectRatio: `${dims.w} / ${dims.h}`,
        }}
      >
        {platform === 'facebook' && (
          <FacebookTemplateRenderer
            templateId={currentTemplate.id}
            photoUrl={photoUrl || ''}
            property={{
              ...property,
              price: property.price ?? undefined,
              bedrooms: property.bedrooms ?? undefined,
              bathrooms: property.bathrooms ?? undefined,
              squareFeet: property.squareFeet ?? undefined,
            }}
            brand={{
              primary_color: '#D4AF37',
              secondary_color: '#1A1A1A',
            }}
            headline={headline}
          />
        )}

        {(platform === 'story' || platform === 'tiktok') && (
          <VerticalTemplateRenderer
            templateId={currentTemplate.id}
            photoUrl={photoUrl || ''}
            property={{
              ...property,
              price: property.price ?? undefined,
              bedrooms: property.bedrooms ?? undefined,
              bathrooms: property.bathrooms ?? undefined,
              squareFeet: property.squareFeet ?? undefined,
            }}
            brand={{
              primary_color: '#D4AF37',
              secondary_color: '#1A1A1A',
            }}
            headline={headline}
          />
        )}

        {(platform === 'instagram' || platform === 'linkedin') && (
          <TemplateRenderer
            templateId={currentTemplate.id}
            photoUrl={photoUrl || ''}
            property={{
              ...property,
              price: property.price ?? undefined,
              bedrooms: property.bedrooms ?? undefined,
              bathrooms: property.bathrooms ?? undefined,
              squareFeet: property.squareFeet ?? undefined,
            }}
            brand={{
              primary_color: '#D4AF37',
              secondary_color: '#1A1A1A',
            }}
            headline={headline}
          />
        )}
      </div>
    )
  }
)

PlatformPreview.displayName = 'PlatformPreview'
