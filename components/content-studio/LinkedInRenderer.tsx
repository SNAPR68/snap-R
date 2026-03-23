'use client'

import { forwardRef } from 'react'

interface PropertyData {
  address?: string
  city?: string
  state?: string
  price?: number
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
}

interface BrandData {
  primary_color?: string
  secondary_color?: string
}

interface LinkedInRendererProps {
  templateId: string
  photoUrl: string
  property: PropertyData
  brand: BrandData
  headline?: string
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  }
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`
  }
  return `$${price.toLocaleString()}`
}

export const LinkedInRenderer = forwardRef<HTMLDivElement, LinkedInRendererProps>(
  ({ templateId, photoUrl, property, brand, headline = 'JUST LISTED' }, ref) => {
    const primaryColor = brand.primary_color || '#D4AF37'
    const secondaryColor = brand.secondary_color || '#1A1A1A'

    return (
      <div
        ref={ref}
        className="w-full h-full relative overflow-hidden bg-white"
        style={{ aspectRatio: '1200 / 627' }}
      >
        {/* Layout: 60% image, 40% content */}
        <div className="flex h-full">
          {/* Image Section */}
          <div className="w-3/5 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="property"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content Section */}
          <div
            className="w-2/5 p-8 flex flex-col justify-between"
            style={{ backgroundColor: secondaryColor }}
          >
            <div>
              <div
                className="text-sm font-bold uppercase tracking-widest mb-3"
                style={{ color: primaryColor }}
              >
                {headline}
              </div>

              {property.price && (
                <div className="text-4xl font-bold text-white mb-4">
                  {formatPrice(property.price)}
                </div>
              )}

              {property.address && (
                <div className="text-white text-sm mb-6 leading-tight">
                  {property.address}
                  {property.city && `, ${property.city}`}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-white text-xs border-t" style={{ borderColor: `${primaryColor}40` }}>
                <span className="pt-2">Beds: {property.bedrooms || '—'}</span>
                <span className="pt-2">Baths: {property.bathrooms || '—'}</span>
              </div>
              {property.squareFeet && (
                <div className="text-white text-xs pt-2">
                  {(property.squareFeet / 1000).toFixed(1)}K SqFt
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

LinkedInRenderer.displayName = 'LinkedInRenderer'
