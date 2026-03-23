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

interface InstagramRendererProps {
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

export const InstagramRenderer = forwardRef<HTMLDivElement, InstagramRendererProps>(
  ({ templateId, photoUrl, property, brand, headline = 'JUST LISTED' }, ref) => {
    const primaryColor = brand.primary_color || '#D4AF37'
    const secondaryColor = brand.secondary_color || '#1A1A1A'

    return (
      <div
        ref={ref}
        className="w-full h-full relative overflow-hidden bg-black"
        style={{ aspectRatio: '1 / 1', backgroundColor: secondaryColor }}
      >
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="property"
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          {/* Top Badge */}
          <div
            className="inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{
              backgroundColor: primaryColor,
              color: secondaryColor,
            }}
          >
            {headline}
          </div>

          {/* Bottom Info */}
          <div>
            {property.price && (
              <div
                className="text-4xl font-bold mb-3"
                style={{ color: primaryColor }}
              >
                {formatPrice(property.price)}
              </div>
            )}

            {property.address && (
              <div className="text-white text-sm mb-4 font-semibold">
                {property.address}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-4 text-xs text-white/90">
              {property.bedrooms && <span>{property.bedrooms} Bed</span>}
              {property.bathrooms && <span>{property.bathrooms} Bath</span>}
              {property.squareFeet && (
                <span>{(property.squareFeet / 1000).toFixed(1)}K SqFt</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

InstagramRenderer.displayName = 'InstagramRenderer'
