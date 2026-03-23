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

interface FacebookRendererProps {
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

export const FacebookRenderer = forwardRef<HTMLDivElement, FacebookRendererProps>(
  ({ templateId, photoUrl, property, brand, headline = 'JUST LISTED' }, ref) => {
    const primaryColor = brand.primary_color || '#D4AF37'
    const secondaryColor = brand.secondary_color || '#1A1A1A'

    return (
      <div
        ref={ref}
        className="w-full h-full relative overflow-hidden bg-black"
        style={{ backgroundColor: secondaryColor }}
      >
        {/* Facebook (1200x630) */}
        <div className="w-full h-full flex">
          {/* Image Side (2/3) */}
          <div className="w-2/3 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="property"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info Side (1/3) */}
          <div
            className="w-1/3 p-6 flex flex-col justify-between"
            style={{ backgroundColor: secondaryColor }}
          >
            <div>
              <div
                className="text-lg font-bold mb-2 uppercase tracking-wider"
                style={{ color: primaryColor }}
              >
                {headline}
              </div>
              {property.price && (
                <div className="text-3xl font-bold text-white mb-4">
                  {formatPrice(property.price)}
                </div>
              )}
              {property.address && (
                <div className="text-xs text-white/80 mb-4 line-clamp-2">
                  {property.address}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                {property.bedrooms && (
                  <span className="text-white">{property.bedrooms} Bed</span>
                )}
                {property.bathrooms && (
                  <span className="text-white">{property.bathrooms} Bath</span>
                )}
                {property.squareFeet && (
                  <span className="text-white">{(property.squareFeet / 1000).toFixed(1)}K SqFt</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

FacebookRenderer.displayName = 'FacebookRenderer'
