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

interface TikTokRendererProps {
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

export const TikTokRenderer = forwardRef<HTMLDivElement, TikTokRendererProps>(
  ({ templateId, photoUrl, property, brand, headline = 'JUST LISTED' }, ref) => {
    const primaryColor = brand.primary_color || '#D4AF37'
    const secondaryColor = brand.secondary_color || '#1A1A1A'

    return (
      <div
        ref={ref}
        className="w-full h-full relative overflow-hidden bg-black flex flex-col justify-end"
        style={{ aspectRatio: '9 / 16', backgroundColor: secondaryColor }}
      >
        {/* Background Image with Blur */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="property"
          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40"
        />

        {/* Main Image */}
        <div className="absolute top-0 left-0 right-0 h-2/3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="property"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />

        {/* Bottom Info */}
        <div className="relative z-10 p-6 space-y-3">
          <div
            className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: primaryColor,
              color: secondaryColor,
            }}
          >
            {headline}
          </div>

          {property.price && (
            <div
              className="text-3xl font-black"
              style={{ color: primaryColor }}
            >
              {formatPrice(property.price)}
            </div>
          )}

          {property.address && (
            <div className="text-white text-sm font-semibold line-clamp-2">
              {property.address}
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex gap-3 text-xs text-white font-medium">
            {property.bedrooms && (
              <span
                className="px-2 py-1 rounded"
                style={{ backgroundColor: `${primaryColor}40` }}
              >
                {property.bedrooms} Beds
              </span>
            )}
            {property.bathrooms && (
              <span
                className="px-2 py-1 rounded"
                style={{ backgroundColor: `${primaryColor}40` }}
              >
                {property.bathrooms} Baths
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }
)

TikTokRenderer.displayName = 'TikTokRenderer'
