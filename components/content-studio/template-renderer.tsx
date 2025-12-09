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
  business_name?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  phone?: string
  tagline?: string
}

interface TemplateRendererProps {
  templateId: string
  photoUrl: string
  property: PropertyData
  brand: BrandData
  headline?: string
}

// Format price with K/M suffix
function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  }
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`
  }
  return `$${price.toLocaleString()}`
}

export const TemplateRenderer = forwardRef<HTMLDivElement, TemplateRendererProps>(
  ({ templateId, photoUrl, property, brand, headline = 'JUST LISTED' }, ref) => {
    const primaryColor = brand.primary_color || '#D4AF37'
    const secondaryColor = brand.secondary_color || '#1A1A1A'

    // Modern Clean Template
    if (templateId === 'just-listed-modern') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          {/* Background Photo */}
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
          
          {/* Top Banner */}
          <div 
            className="absolute top-0 left-0 right-0 py-6 text-center"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-2xl font-bold tracking-[0.3em]" style={{ color: secondaryColor }}>
              {headline}
            </span>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            {/* Price */}
            {property.price && (
              <div className="text-6xl font-bold mb-4" style={{ color: primaryColor }}>
                {formatPrice(property.price)}
              </div>
            )}
            
            {/* Address */}
            <div className="text-3xl font-semibold mb-2">
              {property.address || '123 Main Street'}
            </div>
            <div className="text-xl text-white/80 mb-6">
              {property.city}{property.city && property.state ? ', ' : ''}{property.state}
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-8">
              {property.bedrooms && (
                <div className="text-center">
                  <div className="text-3xl font-bold">{property.bedrooms}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Beds</div>
                </div>
              )}
              {property.bathrooms && (
                <div className="text-center">
                  <div className="text-3xl font-bold">{property.bathrooms}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Baths</div>
                </div>
              )}
              {property.squareFeet && (
                <div className="text-center">
                  <div className="text-3xl font-bold">{property.squareFeet.toLocaleString()}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">Sq Ft</div>
                </div>
              )}
            </div>

            {/* Agent Info */}
            <div className="flex items-center gap-4 pt-6 border-t border-white/20">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt="" className="w-16 h-16 rounded-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: primaryColor, color: secondaryColor }}
                >
                  {brand.business_name?.[0] || 'A'}
                </div>
              )}
              <div>
                <div className="text-xl font-semibold">{brand.business_name || 'Your Name'}</div>
                {brand.phone && <div className="text-white/70">{brand.phone}</div>}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Luxury Gold Template
    if (templateId === 'just-listed-luxury') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          {/* Background */}
          <div className="absolute inset-0 bg-black">
            <img src={photoUrl} alt="" className="w-full h-full object-cover opacity-90" crossOrigin="anonymous" />
          </div>
          
          {/* Gold Frame */}
          <div className="absolute inset-6 border-2" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-8 border" style={{ borderColor: `${primaryColor}50` }} />

          {/* Top Badge */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2">
            <div 
              className="px-12 py-4 text-xl tracking-[0.4em] font-semibold"
              style={{ backgroundColor: primaryColor, color: secondaryColor }}
            >
              {headline}
            </div>
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-0 left-0 right-0 p-16 text-center text-white">
            <div 
              className="absolute inset-0" 
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)' }} 
            />
            
            <div className="relative">
              {property.price && (
                <div className="text-7xl font-bold mb-4" style={{ color: primaryColor }}>
                  {formatPrice(property.price)}
                </div>
              )}
              
              <div className="text-3xl mb-2 font-light">
                {property.address || '123 Main Street'}
              </div>
              <div className="text-lg text-white/70 mb-8 tracking-wider">
                {property.city}{property.city && property.state ? ', ' : ''}{property.state}
              </div>

              {/* Stats in gold boxes */}
              <div className="flex justify-center gap-4 mb-10">
                {property.bedrooms && (
                  <div className="px-6 py-3 border" style={{ borderColor: primaryColor }}>
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>{property.bedrooms}</span>
                    <span className="text-sm ml-2 text-white/70">BEDS</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="px-6 py-3 border" style={{ borderColor: primaryColor }}>
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>{property.bathrooms}</span>
                    <span className="text-sm ml-2 text-white/70">BATHS</span>
                  </div>
                )}
                {property.squareFeet && (
                  <div className="px-6 py-3 border" style={{ borderColor: primaryColor }}>
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>{property.squareFeet.toLocaleString()}</span>
                    <span className="text-sm ml-2 text-white/70">SQ FT</span>
                  </div>
                )}
              </div>

              {/* Agent */}
              <div className="flex items-center justify-center gap-4">
                {brand.logo_url && (
                  <img src={brand.logo_url} alt="" className="w-14 h-14 rounded-full object-cover" crossOrigin="anonymous" />
                )}
                <div className="text-left">
                  <div className="text-lg font-semibold" style={{ color: primaryColor }}>{brand.business_name}</div>
                  {brand.phone && <div className="text-sm text-white/60">{brand.phone}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Minimal White Template
    if (templateId === 'just-listed-minimal') {
      return (
        <div ref={ref} className="relative bg-white" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          {/* Photo - takes 70% */}
          <div className="absolute top-0 left-0 right-0" style={{ height: '70%' }}>
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            {/* Just Listed badge */}
            <div 
              className="absolute top-8 left-8 px-6 py-2 text-sm font-bold tracking-widest"
              style={{ backgroundColor: primaryColor, color: secondaryColor }}
            >
              {headline}
            </div>
          </div>

          {/* White Content Area */}
          <div className="absolute bottom-0 left-0 right-0 bg-white p-10" style={{ height: '30%' }}>
            <div className="flex justify-between items-start h-full">
              {/* Left - Property Info */}
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {property.address || '123 Main Street'}
                </div>
                <div className="text-lg text-gray-500 mb-4">
                  {property.city}{property.city && property.state ? ', ' : ''}{property.state}
                </div>
                <div className="flex gap-6 text-gray-700">
                  {property.bedrooms && <span><strong>{property.bedrooms}</strong> Beds</span>}
                  {property.bathrooms && <span><strong>{property.bathrooms}</strong> Baths</span>}
                  {property.squareFeet && <span><strong>{property.squareFeet.toLocaleString()}</strong> Sq Ft</span>}
                </div>
              </div>

              {/* Right - Price & Agent */}
              <div className="text-right">
                {property.price && (
                  <div className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
                    {formatPrice(property.price)}
                  </div>
                )}
                <div className="flex items-center gap-3 justify-end">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt="" className="w-12 h-12 rounded-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: primaryColor, color: secondaryColor }}
                    >
                      {brand.business_name?.[0] || 'A'}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{brand.business_name}</div>
                    {brand.phone && <div className="text-sm text-gray-500">{brand.phone}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Bold Impact Template
    if (templateId === 'just-listed-bold') {
      return (
        <div ref={ref} className="relative overflow-hidden" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          {/* Photo */}
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Large angled banner */}
          <div 
            className="absolute -left-20 top-32 w-[140%] py-6 text-center transform -rotate-6"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-4xl font-black tracking-wider" style={{ color: secondaryColor }}>
              {headline}
            </span>
          </div>

          {/* Price - Big and Bold */}
          {property.price && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-9xl font-black text-white drop-shadow-2xl">
                {formatPrice(property.price)}
              </div>
            </div>
          )}

          {/* Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-8">
            <div className="flex justify-between items-center">
              <div className="text-white">
                <div className="text-2xl font-bold">{property.address}</div>
                <div className="text-white/70">{property.city}, {property.state}</div>
              </div>
              <div className="flex gap-6 text-white">
                {property.bedrooms && (
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: primaryColor }}>{property.bedrooms}</div>
                    <div className="text-xs uppercase">Beds</div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: primaryColor }}>{property.bathrooms}</div>
                    <div className="text-xs uppercase">Baths</div>
                  </div>
                )}
                {property.squareFeet && (
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: primaryColor }}>{property.squareFeet.toLocaleString()}</div>
                    <div className="text-xs uppercase">Sq Ft</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {brand.logo_url && (
                  <img src={brand.logo_url} alt="" className="w-14 h-14 rounded-lg object-cover" crossOrigin="anonymous" />
                )}
                <div className="text-right text-white">
                  <div className="font-bold">{brand.business_name}</div>
                  <div className="text-sm text-white/60">{brand.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Elegant Dark Template
    if (templateId === 'just-listed-elegant') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif', backgroundColor: '#0a0a0a' }}>
          {/* Photo with vignette */}
          <div className="absolute inset-12 rounded-lg overflow-hidden">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)' }} />
          </div>

          {/* Top Left Corner Accent */}
          <div className="absolute top-0 left-0 w-32 h-32">
            <div className="absolute top-6 left-6 w-16 h-[2px]" style={{ backgroundColor: primaryColor }} />
            <div className="absolute top-6 left-6 w-[2px] h-16" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Bottom Right Corner Accent */}
          <div className="absolute bottom-0 right-0 w-32 h-32">
            <div className="absolute bottom-6 right-6 w-16 h-[2px]" style={{ backgroundColor: primaryColor }} />
            <div className="absolute bottom-6 right-6 w-[2px] h-16" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Headline */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2">
            <div 
              className="text-sm tracking-[0.5em] font-normal"
              style={{ color: primaryColor }}
            >
              {headline}
            </div>
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-12 left-12 right-12">
            <div className="bg-black/90 p-8 rounded-lg backdrop-blur">
              <div className="flex justify-between items-end">
                <div>
                  {property.price && (
                    <div className="text-5xl font-light mb-2" style={{ color: primaryColor }}>
                      {formatPrice(property.price)}
                    </div>
                  )}
                  <div className="text-2xl text-white font-light">{property.address}</div>
                  <div className="text-lg text-white/50">{property.city}, {property.state}</div>
                  
                  <div className="flex gap-6 mt-4 text-white/70">
                    {property.bedrooms && <span>{property.bedrooms} Bedrooms</span>}
                    {property.bathrooms && <span>{property.bathrooms} Bathrooms</span>}
                    {property.squareFeet && <span>{property.squareFeet.toLocaleString()} Sq Ft</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: primaryColor }} crossOrigin="anonymous" />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-serif"
                      style={{ backgroundColor: primaryColor, color: secondaryColor }}
                    >
                      {brand.business_name?.[0] || 'A'}
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-white font-medium">{brand.business_name}</div>
                    <div className="text-sm" style={{ color: primaryColor }}>{brand.phone}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Default fallback
    return (
      <div ref={ref} className="relative bg-gray-900" style={{ width: 1080, height: 1080 }}>
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Template not found: {templateId}
        </div>
      </div>
    )
  }
)

TemplateRenderer.displayName = 'TemplateRenderer'

// Facebook Templates (1200 x 630)
export const FacebookTemplateRenderer = forwardRef<HTMLDivElement, TemplateRendererProps>(
  ({ templateId, photoUrl, property, brand, headline = 'JUST LISTED' }, ref) => {
    const primaryColor = brand.primary_color || '#D4AF37'
    const secondaryColor = brand.secondary_color || '#1A1A1A'

    // Format price
    const formatPrice = (price: number): string => {
      if (price >= 1000000) return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
      if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`
      return `$${price.toLocaleString()}`
    }

    // FB Modern
    if (templateId === 'fb-just-listed-modern') {
      return (
        <div ref={ref} className="relative" style={{ width: 1200, height: 630, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          </div>
          
          <div className="absolute top-0 left-0 bottom-0 w-1/2 p-10 flex flex-col justify-center">
            <div className="px-4 py-2 text-sm font-bold tracking-widest mb-4 inline-block" style={{ backgroundColor: primaryColor, color: secondaryColor, width: 'fit-content' }}>
              {headline}
            </div>
            {property.price && (
              <div className="text-5xl font-bold text-white mb-3">{formatPrice(property.price as number)}</div>
            )}
            <div className="text-2xl text-white font-semibold mb-1">{property.address || '123 Main Street'}</div>
            <div className="text-lg text-white/70 mb-6">{property.city}{property.city && property.state ? ', ' : ''}{property.state}</div>
            
            <div className="flex gap-6 mb-8">
              {property.bedrooms && <div className="text-white"><span className="text-2xl font-bold">{property.bedrooms}</span> <span className="text-white/60">Beds</span></div>}
              {property.bathrooms && <div className="text-white"><span className="text-2xl font-bold">{property.bathrooms}</span> <span className="text-white/60">Baths</span></div>}
              {property.squareFeet && <div className="text-white"><span className="text-2xl font-bold">{(property.squareFeet as number).toLocaleString()}</span> <span className="text-white/60">Sq Ft</span></div>}
            </div>

            <div className="flex items-center gap-3">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt="" className="w-12 h-12 rounded-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
                  {brand.business_name?.[0] || 'A'}
                </div>
              )}
              <div>
                <div className="text-white font-semibold">{brand.business_name || 'Agent Name'}</div>
                {brand.phone && <div className="text-white/60 text-sm">{brand.phone}</div>}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // FB Luxury
    if (templateId === 'fb-just-listed-luxury') {
      return (
        <div ref={ref} className="relative" style={{ width: 1200, height: 630, fontFamily: 'Georgia, serif', backgroundColor: '#000' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover opacity-80" crossOrigin="anonymous" />
          </div>
          <div className="absolute inset-4 border" style={{ borderColor: primaryColor }} />
          
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-8 py-2 text-sm tracking-[0.3em]" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
            {headline}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 text-center" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
            {property.price && <div className="text-5xl font-bold mb-2" style={{ color: primaryColor }}>{formatPrice(property.price as number)}</div>}
            <div className="text-2xl text-white mb-1">{property.address}</div>
            <div className="text-white/60 mb-4">{property.city}, {property.state}</div>
            <div className="flex justify-center gap-8 mb-4">
              {property.bedrooms && <span className="text-white"><span style={{ color: primaryColor }}>{property.bedrooms}</span> Beds</span>}
              {property.bathrooms && <span className="text-white"><span style={{ color: primaryColor }}>{property.bathrooms}</span> Baths</span>}
              {property.squareFeet && <span className="text-white"><span style={{ color: primaryColor }}>{(property.squareFeet as number).toLocaleString()}</span> Sq Ft</span>}
            </div>
            <div className="flex items-center justify-center gap-3">
              {brand.logo_url && <img src={brand.logo_url} alt="" className="w-10 h-10 rounded-full" crossOrigin="anonymous" />}
              <span className="text-white">{brand.business_name}</span>
              {brand.phone && <span className="text-white/60">| {brand.phone}</span>}
            </div>
          </div>
        </div>
      )
    }

    // FB Bold
    if (templateId === 'fb-just-listed-bold') {
      return (
        <div ref={ref} className="relative" style={{ width: 1200, height: 630, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          
          <div className="absolute -left-10 top-20 w-[120%] py-4 text-center transform -rotate-3" style={{ backgroundColor: primaryColor }}>
            <span className="text-3xl font-black tracking-wider" style={{ color: secondaryColor }}>{headline}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-6">
            <div className="flex items-center justify-between">
              <div>
                {property.price && <div className="text-4xl font-black text-white mb-1">{formatPrice(property.price as number)}</div>}
                <div className="text-xl text-white">{property.address}, {property.city}, {property.state}</div>
              </div>
              <div className="flex gap-4">
                {property.bedrooms && <div className="text-center"><div className="text-2xl font-bold" style={{ color: primaryColor }}>{property.bedrooms}</div><div className="text-xs text-white/60">BEDS</div></div>}
                {property.bathrooms && <div className="text-center"><div className="text-2xl font-bold" style={{ color: primaryColor }}>{property.bathrooms}</div><div className="text-xs text-white/60">BATHS</div></div>}
                {property.squareFeet && <div className="text-center"><div className="text-2xl font-bold" style={{ color: primaryColor }}>{(property.squareFeet as number).toLocaleString()}</div><div className="text-xs text-white/60">SQ FT</div></div>}
              </div>
              <div className="flex items-center gap-3">
                {brand.logo_url && <img src={brand.logo_url} alt="" className="w-12 h-12 rounded" crossOrigin="anonymous" />}
                <div className="text-right text-white">
                  <div className="font-bold">{brand.business_name}</div>
                  <div className="text-sm text-white/60">{brand.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // FB Minimal
    if (templateId === 'fb-just-listed-minimal') {
      return (
        <div ref={ref} className="relative bg-white" style={{ width: 1200, height: 630, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute left-0 top-0 bottom-0" style={{ width: '55%' }}>
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute top-4 left-4 px-4 py-1 text-xs font-bold tracking-widest" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
              {headline}
            </div>
          </div>
          
          <div className="absolute right-0 top-0 bottom-0 p-8 flex flex-col justify-center" style={{ width: '45%' }}>
            {property.price && <div className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>{formatPrice(property.price as number)}</div>}
            <div className="text-2xl font-semibold text-gray-900 mb-1">{property.address}</div>
            <div className="text-gray-500 mb-6">{property.city}, {property.state}</div>
            
            <div className="flex gap-6 mb-6 text-gray-700">
              {property.bedrooms && <span><strong>{property.bedrooms}</strong> Beds</span>}
              {property.bathrooms && <span><strong>{property.bathrooms}</strong> Baths</span>}
              {property.squareFeet && <span><strong>{(property.squareFeet as number).toLocaleString()}</strong> Sq Ft</span>}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt="" className="w-10 h-10 rounded-full" crossOrigin="anonymous" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
                  {brand.business_name?.[0] || 'A'}
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">{brand.business_name}</div>
                <div className="text-sm text-gray-500">{brand.phone}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // FB Elegant
    if (templateId === 'fb-just-listed-elegant') {
      return (
        <div ref={ref} className="relative" style={{ width: 1200, height: 630, fontFamily: 'Georgia, serif', backgroundColor: '#0a0a0a' }}>
          <div className="absolute inset-6 rounded overflow-hidden">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          
          <div className="absolute top-2 left-2 w-20 h-20">
            <div className="absolute top-4 left-4 w-12 h-[1px]" style={{ backgroundColor: primaryColor }} />
            <div className="absolute top-4 left-4 w-[1px] h-12" style={{ backgroundColor: primaryColor }} />
          </div>
          <div className="absolute bottom-2 right-2 w-20 h-20">
            <div className="absolute bottom-4 right-4 w-12 h-[1px]" style={{ backgroundColor: primaryColor }} />
            <div className="absolute bottom-4 right-4 w-[1px] h-12" style={{ backgroundColor: primaryColor }} />
          </div>

          <div className="absolute bottom-6 left-6 right-6 bg-black/90 backdrop-blur p-6 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs tracking-[0.3em] mb-2" style={{ color: primaryColor }}>{headline}</div>
                {property.price && <div className="text-4xl font-light mb-1" style={{ color: primaryColor }}>{formatPrice(property.price as number)}</div>}
                <div className="text-xl text-white">{property.address}</div>
                <div className="text-white/50">{property.city}, {property.state}</div>
              </div>
              <div className="flex gap-8 text-white/70">
                {property.bedrooms && <span>{property.bedrooms} Beds</span>}
                {property.bathrooms && <span>{property.bathrooms} Baths</span>}
                {property.squareFeet && <span>{(property.squareFeet as number).toLocaleString()} Sq Ft</span>}
              </div>
              <div className="flex items-center gap-3">
                {brand.logo_url && <img src={brand.logo_url} alt="" className="w-12 h-12 rounded-full border" style={{ borderColor: primaryColor }} crossOrigin="anonymous" />}
                <div className="text-right">
                  <div className="text-white">{brand.business_name}</div>
                  <div className="text-sm" style={{ color: primaryColor }}>{brand.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // LinkedIn Templates (1200 x 627)
    
    // LI Professional
    if (templateId === 'li-just-listed-professional') {
      return (
        <div ref={ref} className="relative bg-white" style={{ width: 1200, height: 627, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute left-0 top-0 bottom-0" style={{ width: '50%' }}>
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          
          <div className="absolute right-0 top-0 bottom-0 p-10 flex flex-col justify-center" style={{ width: '50%', backgroundColor: '#0a66c2' }}>
            <div className="text-white/80 text-sm tracking-widest mb-2">{headline}</div>
            {property.price && <div className="text-5xl font-bold text-white mb-4">{formatPrice(property.price as number)}</div>}
            <div className="text-2xl text-white font-semibold mb-1">{property.address}</div>
            <div className="text-white/70 mb-6">{property.city}, {property.state}</div>
            
            <div className="flex gap-6 mb-8">
              {property.bedrooms && <div className="bg-white/10 px-4 py-2 rounded"><span className="text-xl font-bold text-white">{property.bedrooms}</span><span className="text-white/70 ml-2">Beds</span></div>}
              {property.bathrooms && <div className="bg-white/10 px-4 py-2 rounded"><span className="text-xl font-bold text-white">{property.bathrooms}</span><span className="text-white/70 ml-2">Baths</span></div>}
              {property.squareFeet && <div className="bg-white/10 px-4 py-2 rounded"><span className="text-xl font-bold text-white">{(property.squareFeet as number).toLocaleString()}</span><span className="text-white/70 ml-2">Sq Ft</span></div>}
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-white/20">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt="" className="w-14 h-14 rounded-full bg-white p-1" crossOrigin="anonymous" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl font-bold" style={{ color: '#0a66c2' }}>
                  {brand.business_name?.[0] || 'A'}
                </div>
              )}
              <div>
                <div className="text-white font-semibold text-lg">{brand.business_name}</div>
                {brand.phone && <div className="text-white/70">{brand.phone}</div>}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // LI Corporate
    if (templateId === 'li-just-listed-corporate') {
      return (
        <div ref={ref} className="relative" style={{ width: 1200, height: 627, fontFamily: 'system-ui, sans-serif', backgroundColor: '#1a1a2e' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover opacity-40" crossOrigin="anonymous" />
          </div>
          
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-10">
            <div className="text-sm tracking-[0.4em] text-white/60 mb-4">{headline}</div>
            {property.price && <div className="text-6xl font-bold text-white mb-4">{formatPrice(property.price as number)}</div>}
            <div className="text-3xl text-white mb-2">{property.address}</div>
            <div className="text-xl text-white/60 mb-8">{property.city}, {property.state}</div>
            
            <div className="flex gap-8 mb-10">
              {property.bedrooms && <div className="text-center"><div className="text-3xl font-bold text-white">{property.bedrooms}</div><div className="text-white/50 text-sm">BEDROOMS</div></div>}
              {property.bathrooms && <div className="text-center"><div className="text-3xl font-bold text-white">{property.bathrooms}</div><div className="text-white/50 text-sm">BATHROOMS</div></div>}
              {property.squareFeet && <div className="text-center"><div className="text-3xl font-bold text-white">{(property.squareFeet as number).toLocaleString()}</div><div className="text-white/50 text-sm">SQ FT</div></div>}
            </div>

            <div className="flex items-center gap-4">
              {brand.logo_url && <img src={brand.logo_url} alt="" className="w-12 h-12 rounded-full" crossOrigin="anonymous" />}
              <div className="text-white font-medium">{brand.business_name}</div>
              {brand.phone && <div className="text-white/60">| {brand.phone}</div>}
            </div>
          </div>
        </div>
      )
    }

    // LI Elegant
    if (templateId === 'li-just-listed-elegant') {
      return (
        <div ref={ref} className="relative" style={{ width: 1200, height: 627, fontFamily: 'Georgia, serif', backgroundColor: '#000' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>
          
          <div className="absolute top-6 left-6 text-xs tracking-[0.4em]" style={{ color: primaryColor }}>{headline}</div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-end justify-between">
              <div>
                {property.price && <div className="text-5xl font-light mb-2" style={{ color: primaryColor }}>{formatPrice(property.price as number)}</div>}
                <div className="text-2xl text-white">{property.address}</div>
                <div className="text-white/60">{property.city}, {property.state}</div>
                <div className="flex gap-6 mt-4 text-white/70">
                  {property.bedrooms && <span>{property.bedrooms} Beds</span>}
                  {property.bathrooms && <span>{property.bathrooms} Baths</span>}
                  {property.squareFeet && <span>{(property.squareFeet as number).toLocaleString()} Sq Ft</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {brand.logo_url && <img src={brand.logo_url} alt="" className="w-14 h-14 rounded-full border-2" style={{ borderColor: primaryColor }} crossOrigin="anonymous" />}
                <div className="text-right">
                  <div className="text-white font-medium">{brand.business_name}</div>
                  <div style={{ color: primaryColor }}>{brand.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className="relative bg-gray-900" style={{ width: 1200, height: 630 }}>
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Template not found: {templateId}
        </div>
      </div>
    )
  }
)

FacebookTemplateRenderer.displayName = 'FacebookTemplateRenderer'

// Vertical Templates (1080 x 1920) - Instagram Stories & TikTok
export const VerticalTemplateRenderer = forwardRef<HTMLDivElement, TemplateRendererProps>(
  ({ templateId, photoUrl, property, brand, headline = 'JUST LISTED' }, ref) => {
    const primaryColor = brand.primary_color || '#D4AF37'
    const secondaryColor = brand.secondary_color || '#1A1A1A'

    const formatPrice = (price: number): string => {
      if (price >= 1000000) return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
      if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`
      return `$${price.toLocaleString()}`
    }

    // Vertical Modern
    if (templateId === 'vertical-modern') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1920, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </div>
          
          {/* Top Banner */}
          <div className="absolute top-16 left-0 right-0 text-center">
            <div className="inline-block px-8 py-3 text-2xl font-bold tracking-[0.3em]" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
              {headline}
            </div>
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-0 left-0 right-0 p-10">
            {property.price && (
              <div className="text-7xl font-bold mb-4" style={{ color: primaryColor }}>
                {formatPrice(property.price as number)}
              </div>
            )}
            
            <div className="text-4xl text-white font-semibold mb-2">{property.address || '123 Main Street'}</div>
            <div className="text-2xl text-white/70 mb-8">{property.city}{property.city && property.state ? ', ' : ''}{property.state}</div>

            {/* Stats Row */}
            <div className="flex gap-8 mb-10">
              {property.bedrooms && (
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{property.bedrooms}</div>
                  <div className="text-lg text-white/60 uppercase tracking-wider">Beds</div>
                </div>
              )}
              {property.bathrooms && (
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{property.bathrooms}</div>
                  <div className="text-lg text-white/60 uppercase tracking-wider">Baths</div>
                </div>
              )}
              {property.squareFeet && (
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{(property.squareFeet as number).toLocaleString()}</div>
                  <div className="text-lg text-white/60 uppercase tracking-wider">Sq Ft</div>
                </div>
              )}
            </div>

            {/* Agent Info */}
            <div className="flex items-center gap-4 pt-8 border-t border-white/20">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt="" className="w-20 h-20 rounded-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
                  {brand.business_name?.[0] || 'A'}
                </div>
              )}
              <div>
                <div className="text-2xl text-white font-semibold">{brand.business_name || 'Agent Name'}</div>
                {brand.phone && <div className="text-xl text-white/70">{brand.phone}</div>}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Vertical Luxury
    if (templateId === 'vertical-luxury') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1920, fontFamily: 'Georgia, serif', backgroundColor: '#000' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover opacity-90" crossOrigin="anonymous" />
          </div>
          
          {/* Gold Frame */}
          <div className="absolute inset-6 border-2" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-10 border" style={{ borderColor: `${primaryColor}50` }} />

          {/* Top Badge */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2">
            <div className="px-10 py-4 text-xl tracking-[0.4em] font-semibold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
              {headline}
            </div>
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-0 left-0 right-0 p-12 text-center" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)' }}>
            {property.price && (
              <div className="text-8xl font-bold mb-6" style={{ color: primaryColor }}>
                {formatPrice(property.price as number)}
              </div>
            )}
            
            <div className="text-4xl text-white mb-2 font-light">{property.address}</div>
            <div className="text-2xl text-white/60 mb-10 tracking-wider">{property.city}, {property.state}</div>

            {/* Stats in gold boxes */}
            <div className="flex justify-center gap-6 mb-12">
              {property.bedrooms && (
                <div className="px-8 py-4 border" style={{ borderColor: primaryColor }}>
                  <span className="text-4xl font-bold" style={{ color: primaryColor }}>{property.bedrooms}</span>
                  <span className="text-xl ml-3 text-white/70">BEDS</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="px-8 py-4 border" style={{ borderColor: primaryColor }}>
                  <span className="text-4xl font-bold" style={{ color: primaryColor }}>{property.bathrooms}</span>
                  <span className="text-xl ml-3 text-white/70">BATHS</span>
                </div>
              )}
            </div>
            {property.squareFeet && (
              <div className="text-2xl text-white/70 mb-10">{(property.squareFeet as number).toLocaleString()} Square Feet</div>
            )}

            {/* Agent */}
            <div className="flex items-center justify-center gap-4">
              {brand.logo_url && (
                <img src={brand.logo_url} alt="" className="w-16 h-16 rounded-full border-2" style={{ borderColor: primaryColor }} crossOrigin="anonymous" />
              )}
              <div className="text-left">
                <div className="text-2xl font-semibold" style={{ color: primaryColor }}>{brand.business_name}</div>
                {brand.phone && <div className="text-lg text-white/60">{brand.phone}</div>}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Vertical Bold
    if (templateId === 'vertical-bold') {
      return (
        <div ref={ref} className="relative overflow-hidden" style={{ width: 1080, height: 1920, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Large angled banner at top */}
          <div className="absolute -left-20 top-40 w-[140%] py-8 text-center transform -rotate-6" style={{ backgroundColor: primaryColor }}>
            <span className="text-5xl font-black tracking-wider" style={{ color: secondaryColor }}>{headline}</span>
          </div>

          {/* Price - Big and Bold in center */}
          {property.price && (
            <div className="absolute top-1/3 left-0 right-0 text-center">
              <div className="text-[140px] font-black text-white drop-shadow-2xl leading-none">
                {formatPrice(property.price as number)}
              </div>
            </div>
          )}

          {/* Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-8">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-white mb-2">{property.address}</div>
              <div className="text-xl text-white/70">{property.city}, {property.state}</div>
            </div>
            
            <div className="flex justify-center gap-10 mb-8">
              {property.bedrooms && (
                <div className="text-center">
                  <div className="text-5xl font-bold" style={{ color: primaryColor }}>{property.bedrooms}</div>
                  <div className="text-sm text-white/60 uppercase">Beds</div>
                </div>
              )}
              {property.bathrooms && (
                <div className="text-center">
                  <div className="text-5xl font-bold" style={{ color: primaryColor }}>{property.bathrooms}</div>
                  <div className="text-sm text-white/60 uppercase">Baths</div>
                </div>
              )}
              {property.squareFeet && (
                <div className="text-center">
                  <div className="text-5xl font-bold" style={{ color: primaryColor }}>{(property.squareFeet as number).toLocaleString()}</div>
                  <div className="text-sm text-white/60 uppercase">Sq Ft</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              {brand.logo_url && <img src={brand.logo_url} alt="" className="w-14 h-14 rounded-lg" crossOrigin="anonymous" />}
              <div className="text-white">
                <div className="font-bold text-xl">{brand.business_name}</div>
                <div className="text-white/60">{brand.phone}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Vertical Minimal
    if (templateId === 'vertical-minimal') {
      return (
        <div ref={ref} className="relative bg-white" style={{ width: 1080, height: 1920, fontFamily: 'system-ui, sans-serif' }}>
          {/* Photo - takes top 60% */}
          <div className="absolute top-0 left-0 right-0" style={{ height: '60%' }}>
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute top-8 left-8 px-6 py-3 text-lg font-bold tracking-widest" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
              {headline}
            </div>
          </div>

          {/* White Content Area */}
          <div className="absolute bottom-0 left-0 right-0 bg-white p-10" style={{ height: '40%' }}>
            <div className="h-full flex flex-col justify-between">
              <div>
                {property.price && (
                  <div className="text-6xl font-bold mb-3" style={{ color: primaryColor }}>
                    {formatPrice(property.price as number)}
                  </div>
                )}
                <div className="text-4xl font-semibold text-gray-900 mb-2">{property.address}</div>
                <div className="text-2xl text-gray-500 mb-6">{property.city}, {property.state}</div>
                
                <div className="flex gap-8 text-gray-700 text-xl">
                  {property.bedrooms && <span><strong>{property.bedrooms}</strong> Beds</span>}
                  {property.bathrooms && <span><strong>{property.bathrooms}</strong> Baths</span>}
                  {property.squareFeet && <span><strong>{(property.squareFeet as number).toLocaleString()}</strong> Sq Ft</span>}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt="" className="w-16 h-16 rounded-full" crossOrigin="anonymous" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
                    {brand.business_name?.[0] || 'A'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900 text-xl">{brand.business_name}</div>
                  <div className="text-gray-500 text-lg">{brand.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Vertical Elegant
    if (templateId === 'vertical-elegant') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1920, fontFamily: 'Georgia, serif', backgroundColor: '#0a0a0a' }}>
          {/* Photo with padding */}
          <div className="absolute inset-8 rounded-lg overflow-hidden">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.6)' }} />
          </div>

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-40 h-40">
            <div className="absolute top-8 left-8 w-20 h-[2px]" style={{ backgroundColor: primaryColor }} />
            <div className="absolute top-8 left-8 w-[2px] h-20" style={{ backgroundColor: primaryColor }} />
          </div>
          <div className="absolute bottom-0 right-0 w-40 h-40">
            <div className="absolute bottom-8 right-8 w-20 h-[2px]" style={{ backgroundColor: primaryColor }} />
            <div className="absolute bottom-8 right-8 w-[2px] h-20" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Top Headline */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2">
            <div className="text-lg tracking-[0.5em] font-normal" style={{ color: primaryColor }}>{headline}</div>
          </div>

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-8 left-8 right-8 bg-black/90 p-10 rounded-lg backdrop-blur">
            {property.price && (
              <div className="text-6xl font-light mb-4" style={{ color: primaryColor }}>
                {formatPrice(property.price as number)}
              </div>
            )}
            <div className="text-3xl text-white font-light mb-2">{property.address}</div>
            <div className="text-xl text-white/50 mb-6">{property.city}, {property.state}</div>
            
            <div className="flex gap-8 mb-8 text-white/70 text-lg">
              {property.bedrooms && <span>{property.bedrooms} Bedrooms</span>}
              {property.bathrooms && <span>{property.bathrooms} Bathrooms</span>}
              {property.squareFeet && <span>{(property.squareFeet as number).toLocaleString()} Sq Ft</span>}
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-white/20">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt="" className="w-16 h-16 rounded-full border-2" style={{ borderColor: primaryColor }} crossOrigin="anonymous" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-serif" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
                  {brand.business_name?.[0] || 'A'}
                </div>
              )}
              <div>
                <div className="text-white font-medium text-xl">{brand.business_name}</div>
                <div className="text-lg" style={{ color: primaryColor }}>{brand.phone}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className="relative bg-gray-900" style={{ width: 1080, height: 1920 }}>
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Template not found: {templateId}
        </div>
      </div>
    )
  }
)

VerticalTemplateRenderer.displayName = 'VerticalTemplateRenderer'
