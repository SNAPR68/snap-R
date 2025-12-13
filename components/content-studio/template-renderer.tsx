'use client'
import { FacebookTemplateRenderer } from './facebook-renderer'
import { VerticalTemplateRenderer } from './vertical-renderer'
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
  openHouseDate?: string
  openHouseTime?: string
  previousPrice?: number
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

// ============================================
// INSTAGRAM TEMPLATE RENDERER (1080x1080)
// ============================================

export const TemplateRenderer = forwardRef<HTMLDivElement, TemplateRendererProps>(
  ({ templateId, photoUrl, property, brand, headline = 'JUST LISTED', openHouseDate, openHouseTime, previousPrice }, ref) => {
    const primaryColor = brand.primary_color || '#D4AF37'
    const secondaryColor = brand.secondary_color || '#1A1A1A'

    // ========== JUST LISTED TEMPLATES ==========

    // JL-1: Modern Clean
    if (templateId === 'jl-modern-clean' || templateId === 'just-listed-modern') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
          <div className="absolute top-0 left-0 right-0 py-6 text-center" style={{ backgroundColor: primaryColor }}>
            <span className="text-2xl font-bold tracking-[0.3em]" style={{ color: secondaryColor }}>{headline}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            {property.price && <div className="text-6xl font-bold mb-4" style={{ color: primaryColor }}>{formatPrice(property.price)}</div>}
            <div className="text-3xl font-semibold mb-2">{property.address || '123 Main Street'}</div>
            <div className="text-xl text-white/80 mb-6">{property.city}{property.city && property.state ? ', ' : ''}{property.state}</div>
            <div className="flex gap-8 mb-8">
              {property.bedrooms && <div className="text-center"><div className="text-3xl font-bold">{property.bedrooms}</div><div className="text-sm text-white/60 uppercase tracking-wider">Beds</div></div>}
              {property.bathrooms && <div className="text-center"><div className="text-3xl font-bold">{property.bathrooms}</div><div className="text-sm text-white/60 uppercase tracking-wider">Baths</div></div>}
              {property.squareFeet && <div className="text-center"><div className="text-3xl font-bold">{property.squareFeet.toLocaleString()}</div><div className="text-sm text-white/60 uppercase tracking-wider">Sq Ft</div></div>}
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{brand.business_name?.[0] || 'A'}</div>
              <div><div className="font-semibold text-lg">{brand.business_name || 'Agent Name'}</div>{brand.phone && <div className="text-white/60">{brand.phone}</div>}</div>
            </div>
          </div>
        </div>
      )
    }

    // JL-2: Luxury Gold
    if (templateId === 'jl-luxury-gold' || templateId === 'just-listed-luxury') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          {/* Gold Frame */}
          <div className="absolute inset-8 border-4" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-12 border" style={{ borderColor: primaryColor, opacity: 0.5 }} />
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-16">
            <div className="text-lg tracking-[0.5em] mb-4" style={{ color: primaryColor }}>{headline}</div>
            <div className="w-24 h-0.5 mb-8" style={{ backgroundColor: primaryColor }} />
            {property.price && <div className="text-7xl font-light mb-6" style={{ color: primaryColor }}>{formatPrice(property.price)}</div>}
            <div className="text-3xl mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-8">{property.city}, {property.state}</div>
            <div className="flex gap-12 mb-8">
              {property.bedrooms && <div><span className="text-4xl font-light">{property.bedrooms}</span><span className="text-lg text-white/60 ml-2">Beds</span></div>}
              {property.bathrooms && <div><span className="text-4xl font-light">{property.bathrooms}</span><span className="text-lg text-white/60 ml-2">Baths</span></div>}
              {property.squareFeet && <div><span className="text-4xl font-light">{property.squareFeet.toLocaleString()}</span><span className="text-lg text-white/60 ml-2">Sq Ft</span></div>}
            </div>
            <div className="w-24 h-0.5 mb-6" style={{ backgroundColor: primaryColor }} />
            <div className="text-xl">{brand.business_name}</div>
            {brand.phone && <div className="text-white/60">{brand.phone}</div>}
          </div>
        </div>
      )
    }

    // JL-3: Minimal White
    if (templateId === 'jl-minimal-white' || templateId === 'just-listed-minimal') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          {/* White Card Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-white p-12">
            <div className="text-sm font-bold tracking-[0.3em] mb-4" style={{ color: primaryColor }}>{headline}</div>
            <div className="text-4xl font-bold text-gray-900 mb-2">{formatPrice(property.price || 0)}</div>
            <div className="text-xl text-gray-700 mb-1">{property.address}</div>
            <div className="text-gray-500 mb-4">{property.city}, {property.state}</div>
            <div className="flex gap-6 text-gray-600 mb-6">
              {property.bedrooms && <span>{property.bedrooms} Beds</span>}
              {property.bathrooms && <span>{property.bathrooms} Baths</span>}
              {property.squareFeet && <span>{property.squareFeet.toLocaleString()} Sq Ft</span>}
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>{brand.business_name?.[0] || 'A'}</div>
              <div><div className="font-semibold text-gray-900">{brand.business_name}</div><div className="text-sm text-gray-500">{brand.phone}</div></div>
            </div>
          </div>
        </div>
      )
    }

    // JL-4: Bold Impact
    if (templateId === 'jl-bold-impact' || templateId === 'just-listed-bold') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/50 to-transparent" />
          </div>
          {/* Bold Typography */}
          <div className="absolute top-12 left-12 right-12">
            <div className="text-8xl font-black text-white leading-none mb-4">{headline}</div>
            <div className="text-6xl font-black" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          {/* Bottom Info */}
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="text-3xl font-bold mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-6">{property.city}, {property.state}</div>
            <div className="flex gap-8">
              <div className="px-6 py-3 rounded-full" style={{ backgroundColor: primaryColor }}>
                <span className="font-bold text-black">{property.bedrooms} BD</span>
              </div>
              <div className="px-6 py-3 rounded-full" style={{ backgroundColor: primaryColor }}>
                <span className="font-bold text-black">{property.bathrooms} BA</span>
              </div>
              <div className="px-6 py-3 rounded-full" style={{ backgroundColor: primaryColor }}>
                <span className="font-bold text-black">{property.squareFeet?.toLocaleString()} SF</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // JL-5: Editorial Magazine
    if (templateId === 'jl-editorial') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0 grid grid-cols-2">
            <div className="bg-white p-12 flex flex-col justify-between">
              <div>
                <div className="text-sm tracking-[0.3em] mb-8" style={{ color: primaryColor }}>{headline}</div>
                <div className="text-6xl font-light text-gray-900 mb-4" style={{ lineHeight: 1.1 }}>{property.address}</div>
                <div className="text-xl text-gray-500">{property.city}, {property.state}</div>
              </div>
              <div>
                <div className="text-5xl font-light mb-6" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
                <div className="flex gap-8 text-gray-600 mb-8">
                  <div><span className="text-2xl font-light">{property.bedrooms}</span> beds</div>
                  <div><span className="text-2xl font-light">{property.bathrooms}</span> baths</div>
                  <div><span className="text-2xl font-light">{property.squareFeet?.toLocaleString()}</span> sqft</div>
                </div>
                <div className="pt-6 border-t border-gray-200">
                  <div className="font-semibold">{brand.business_name}</div>
                  <div className="text-gray-500">{brand.phone}</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
          </div>
        </div>
      )
    }

    // JL-6: Glass Card
    if (templateId === 'jl-glass-card' || templateId === 'just-listed-elegant') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          {/* Glass Card */}
          <div className="absolute inset-12 flex items-end">
            <div className="w-full p-10 rounded-3xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="text-sm font-bold tracking-[0.3em] text-white/80 mb-4">{headline}</div>
              <div className="text-5xl font-bold text-white mb-2">{formatPrice(property.price || 0)}</div>
              <div className="text-2xl text-white mb-1">{property.address}</div>
              <div className="text-white/70 mb-6">{property.city}, {property.state}</div>
              <div className="flex gap-6 text-white mb-6">
                <span className="px-4 py-2 rounded-full bg-white/20">{property.bedrooms} Beds</span>
                <span className="px-4 py-2 rounded-full bg-white/20">{property.bathrooms} Baths</span>
                <span className="px-4 py-2 rounded-full bg-white/20">{property.squareFeet?.toLocaleString()} Sq Ft</span>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/20">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{brand.business_name?.[0] || 'A'}</div>
                <div className="text-white"><div className="font-semibold">{brand.business_name}</div><div className="text-white/60 text-sm">{brand.phone}</div></div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // ========== COMING SOON TEMPLATES ==========

    // CS-1: Mystery Blur
    if (templateId === 'cs-mystery-blur') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(15px)' }} crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
            <div className="text-2xl tracking-[0.5em] mb-4">👀</div>
            <div className="text-6xl font-bold mb-4">{headline || 'COMING SOON'}</div>
            <div className="w-32 h-1 mb-8" style={{ backgroundColor: primaryColor }} />
            <div className="text-2xl text-white/80 mb-2">{property.city}, {property.state}</div>
            <div className="text-4xl font-bold mt-4" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="mt-12 px-8 py-4 rounded-full border-2" style={{ borderColor: primaryColor }}>
              <span className="text-lg tracking-wider">BE THE FIRST TO KNOW</span>
            </div>
            <div className="absolute bottom-12 text-lg">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // CS-2: Countdown
    if (templateId === 'cs-countdown') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(8px) brightness(0.5)' }} crossOrigin="anonymous" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-xl tracking-[0.5em] mb-6" style={{ color: primaryColor }}>LAUNCHING SOON</div>
            <div className="flex gap-6 mb-8">
              {['03', '12', '45', '22'].map((num, i) => (
                <div key={i} className="text-center">
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{num}</div>
                  <div className="text-sm mt-2 text-white/60">{['DAYS', 'HRS', 'MIN', 'SEC'][i]}</div>
                </div>
              ))}
            </div>
            <div className="text-4xl font-bold mb-4">{property.address || 'Exclusive Property'}</div>
            <div className="text-xl text-white/70 mb-4">{property.city}, {property.state}</div>
            <div className="text-5xl font-bold" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="absolute bottom-12 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{brand.business_name?.[0]}</div>
              <div><div className="font-semibold">{brand.business_name}</div><div className="text-white/60">{brand.phone}</div></div>
            </div>
          </div>
        </div>
      )
    }

    // CS-3: Sneak Peek
    if (templateId === 'cs-sneak-peek') {
      return (
        <div ref={ref} className="relative overflow-hidden" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          {/* Curtain Effect */}
          <div className="absolute inset-y-0 left-0 w-1/2 bg-black flex items-center justify-end pr-12">
            <div className="text-right text-white">
              <div className="text-lg tracking-[0.3em] mb-4" style={{ color: primaryColor }}>SNEAK PEEK</div>
              <div className="text-5xl font-bold mb-4">{headline || 'COMING SOON'}</div>
              <div className="text-xl text-white/70 mb-6">{property.city}, {property.state}</div>
              <div className="text-4xl font-bold mb-8" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
              <div className="flex gap-4 justify-end">
                <span className="px-4 py-2 bg-white/10 rounded">{property.bedrooms} Beds</span>
                <span className="px-4 py-2 bg-white/10 rounded">{property.bathrooms} Baths</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-8 flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{brand.business_name?.[0]}</div>
            <div className="text-sm"><div>{brand.business_name}</div><div className="text-white/60">{brand.phone}</div></div>
          </div>
        </div>
      )
    }

    // CS-4: Exclusive Preview
    if (templateId === 'cs-exclusive') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          {/* VIP Badge */}
          <div className="absolute top-12 right-12 px-6 py-3 rounded-full" style={{ backgroundColor: primaryColor }}>
            <span className="text-lg font-bold tracking-wider" style={{ color: secondaryColor }}>EXCLUSIVE</span>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-16">
            <div className="text-lg tracking-[0.5em] mb-4 text-white/60">PRIVATE PREVIEW</div>
            <div className="text-6xl font-light mb-2">{headline || 'COMING SOON'}</div>
            <div className="w-32 h-0.5 my-8" style={{ backgroundColor: primaryColor }} />
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-xl text-white/60 mb-8">{property.city}, {property.state}</div>
            <div className="text-5xl" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 text-center text-white">
            <div className="text-lg">{brand.business_name}</div>
            <div className="text-white/60">{brand.phone}</div>
          </div>
        </div>
      )
    }

    // CS-5: Dark Teaser
    if (templateId === 'cs-dark-teaser') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif', backgroundColor: '#0a0a0a' }}>
          <div className="absolute inset-0 opacity-30">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(100%)' }} crossOrigin="anonymous" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
            <div className="text-9xl font-thin mb-4">?</div>
            <div className="text-4xl font-bold tracking-wider mb-4">{headline || 'COMING SOON'}</div>
            <div className="w-24 h-0.5 mb-8" style={{ backgroundColor: primaryColor }} />
            <div className="text-xl text-white/50">{property.city}, {property.state}</div>
            <div className="mt-8 text-3xl" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <div className="text-white/40 text-sm tracking-wider">DETAILS DROPPING SOON</div>
            <div className="text-white mt-4">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // CS-6: Get Notified
    if (templateId === 'cs-notification') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(5px)' }} crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-16">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8" style={{ backgroundColor: primaryColor }}>
              <span className="text-5xl">🔔</span>
            </div>
            <div className="text-5xl font-bold mb-4">{headline || 'COMING SOON'}</div>
            <div className="text-xl text-white/70 mb-8">{property.city}, {property.state} • {formatPrice(property.price || 0)}</div>
            <div className="px-12 py-4 rounded-full text-xl font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
              GET NOTIFIED FIRST
            </div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 text-center text-white">
            <div>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }


    // ========== OPEN HOUSE TEMPLATES ==========

    // OH-1: Elegant Invitation
    if (templateId === 'oh-invitation') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="absolute inset-12 border-2 border-white/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-20">
            <div className="text-lg tracking-[0.5em] mb-2 text-white/60">YOU'RE INVITED</div>
            <div className="text-5xl font-light mb-6">{headline || 'OPEN HOUSE'}</div>
            <div className="w-32 h-0.5 mb-8" style={{ backgroundColor: primaryColor }} />
            <div className="text-6xl font-bold mb-2" style={{ color: primaryColor }}>{openHouseDate || 'SAT & SUN'}</div>
            <div className="text-2xl mb-8">{openHouseTime || '1:00 PM - 4:00 PM'}</div>
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-lg text-white/70 mb-6">{property.city}, {property.state}</div>
            <div className="text-3xl" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center text-white">
            <div>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // OH-2: Calendar Date
    if (templateId === 'oh-calendar') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>
          {/* Calendar Card */}
          <div className="absolute top-12 right-12 w-48 bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="py-3 text-center text-white font-bold" style={{ backgroundColor: primaryColor }}>
              {openHouseDate?.split(' ')[0] || 'SATURDAY'}
            </div>
            <div className="py-6 text-center">
              <div className="text-6xl font-bold text-gray-900">{openHouseDate?.split(' ')[1] || '15'}</div>
              <div className="text-gray-500">{openHouseTime || '1PM - 4PM'}</div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="text-2xl font-bold tracking-wider mb-4" style={{ color: primaryColor }}>{headline || 'OPEN HOUSE'}</div>
            <div className="text-4xl font-bold mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-4">{property.city}, {property.state}</div>
            <div className="flex gap-6 mb-6">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.squareFeet?.toLocaleString()} Sq Ft</span>
            </div>
            <div className="text-4xl font-bold" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{brand.business_name?.[0]}</div>
              <div><div className="font-semibold">{brand.business_name}</div><div className="text-white/60">{brand.phone}</div></div>
            </div>
          </div>
        </div>
      )
    }

    // OH-3: Welcome Home
    if (templateId === 'oh-welcome') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </div>
          <div className="absolute top-12 left-0 right-0 text-center">
            <div className="inline-block px-8 py-4 rounded-full" style={{ backgroundColor: primaryColor }}>
              <span className="text-2xl font-bold tracking-wider" style={{ color: secondaryColor }}>🚪 {headline || 'OPEN HOUSE'}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white text-center">
            <div className="text-5xl font-light mb-4">Welcome Home</div>
            <div className="w-24 h-0.5 mx-auto mb-6" style={{ backgroundColor: primaryColor }} />
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-white/70 mb-4">{property.city}, {property.state}</div>
            <div className="text-3xl font-bold mb-6" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="inline-block px-8 py-3 bg-white/10 rounded-full backdrop-blur">
              <span className="text-xl">{openHouseDate || 'Saturday'} • {openHouseTime || '1PM - 4PM'}</span>
            </div>
            <div className="mt-8">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // OH-4: Weekend Special
    if (templateId === 'oh-weekend') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          {/* Bold Banner */}
          <div className="absolute top-0 left-0 right-0 py-8" style={{ backgroundColor: primaryColor }}>
            <div className="text-center">
              <div className="text-4xl font-black tracking-wider" style={{ color: secondaryColor }}>🏠 WEEKEND {headline || 'OPEN HOUSE'}</div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12" style={{ backgroundColor: secondaryColor }}>
            <div className="flex justify-between items-end text-white">
              <div>
                <div className="text-3xl font-bold mb-2">{property.address}</div>
                <div className="text-white/70 mb-4">{property.city}, {property.state}</div>
                <div className="flex gap-4">
                  <span className="px-4 py-2 rounded" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{property.bedrooms} BD</span>
                  <span className="px-4 py-2 rounded" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{property.bathrooms} BA</span>
                  <span className="px-4 py-2 rounded" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{property.squareFeet?.toLocaleString()} SF</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
                <div className="text-xl mt-2">{openHouseDate || 'SAT & SUN'}</div>
                <div className="text-white/60">{openHouseTime || '1PM - 4PM'}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // OH-5: Luxury Event
    if (templateId === 'oh-luxury-event') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="absolute inset-8 border" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-20">
            <div className="text-lg tracking-[0.5em] mb-4" style={{ color: primaryColor }}>EXCLUSIVE VIEWING</div>
            <div className="text-6xl font-light mb-8">{headline || 'OPEN HOUSE'}</div>
            <div className="flex items-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: primaryColor }}>{openHouseDate || 'SAT 15'}</div>
                <div className="text-sm text-white/60">DATE</div>
              </div>
              <div className="w-px h-16 bg-white/30" />
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: primaryColor }}>{openHouseTime || '2-5 PM'}</div>
                <div className="text-sm text-white/60">TIME</div>
              </div>
            </div>
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-white/60 mb-6">{property.city}, {property.state}</div>
            <div className="text-5xl font-light" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center text-white/60">
            <div>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // OH-6: RSVP Style
    if (templateId === 'oh-rsvp') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="text-xl tracking-wider mb-2" style={{ color: primaryColor }}>{headline || 'OPEN HOUSE'}</div>
            <div className="text-4xl font-bold mb-4">{property.address}</div>
            <div className="text-xl text-white/70 mb-6">{property.city}, {property.state} • {formatPrice(property.price || 0)}</div>
            <div className="flex gap-4 mb-8">
              <div className="flex-1 p-4 bg-white/10 rounded-xl text-center backdrop-blur">
                <div className="text-2xl font-bold">{openHouseDate || 'SAT 15'}</div>
                <div className="text-white/60">Date</div>
              </div>
              <div className="flex-1 p-4 bg-white/10 rounded-xl text-center backdrop-blur">
                <div className="text-2xl font-bold">{openHouseTime || '1-4 PM'}</div>
                <div className="text-white/60">Time</div>
              </div>
            </div>
            <div className="w-full py-4 rounded-full text-center text-xl font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>
              RSVP NOW
            </div>
            <div className="mt-6 text-center text-white/60">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // ========== PRICE REDUCED TEMPLATES ==========

    // PR-1: Price Strike
    if (templateId === 'pr-strikethrough') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
          </div>
          {/* Red Banner */}
          <div className="absolute top-12 left-0 right-0">
            <div className="mx-12 py-4 text-center" style={{ backgroundColor: '#DC2626' }}>
              <span className="text-3xl font-black text-white tracking-wider">🔥 {headline || 'PRICE REDUCED'}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="mb-4">
              <span className="text-3xl text-white/50 line-through">{formatPrice(previousPrice || (property.price || 0) * 1.1)}</span>
            </div>
            <div className="text-7xl font-black mb-4" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="inline-block px-4 py-2 bg-green-500 rounded-full text-lg font-bold mb-6">
              SAVE {formatPrice(((previousPrice || (property.price || 0) * 1.1) - (property.price || 0)))}
            </div>
            <div className="text-3xl font-bold mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-4">{property.city}, {property.state}</div>
            <div className="flex gap-6">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.squareFeet?.toLocaleString()} Sq Ft</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{brand.business_name?.[0]}</div>
              <div><div className="font-semibold">{brand.business_name}</div><div className="text-white/60">{brand.phone}</div></div>
            </div>
          </div>
        </div>
      )
    }

    // PR-2: Savings Badge
    if (templateId === 'pr-savings-badge') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          {/* Savings Badge */}
          <div className="absolute top-12 right-12 w-48 h-48 rounded-full flex flex-col items-center justify-center" style={{ backgroundColor: '#DC2626' }}>
            <div className="text-white text-lg">SAVE</div>
            <div className="text-white text-4xl font-black">{formatPrice(((previousPrice || (property.price || 0) * 1.1) - (property.price || 0)))}</div>
          </div>
          <div className="absolute top-12 left-12 px-6 py-3 rounded-full" style={{ backgroundColor: primaryColor }}>
            <span className="text-xl font-bold" style={{ color: secondaryColor }}>{headline || 'PRICE REDUCED'}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="text-2xl text-white/50 line-through mb-2">{formatPrice(previousPrice || (property.price || 0) * 1.1)}</div>
            <div className="text-6xl font-bold mb-4" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="text-3xl font-bold mb-2">{property.address}</div>
            <div className="text-xl text-white/70">{property.city}, {property.state}</div>
            <div className="mt-6">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // PR-3: New Price
    if (templateId === 'pr-new-price') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          {/* Clean White Card */}
          <div className="absolute bottom-0 left-0 right-0 bg-white p-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-4 py-2 bg-green-500 text-white font-bold rounded">{headline || 'NEW PRICE'}</span>
              <span className="text-gray-400 line-through text-xl">{formatPrice(previousPrice || (property.price || 0) * 1.1)}</span>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-4">{formatPrice(property.price || 0)}</div>
            <div className="text-2xl text-gray-700 mb-1">{property.address}</div>
            <div className="text-gray-500 mb-4">{property.city}, {property.state}</div>
            <div className="flex gap-6 text-gray-600">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.squareFeet?.toLocaleString()} Sq Ft</span>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>{brand.business_name?.[0]}</div>
              <div><div className="font-semibold text-gray-900">{brand.business_name}</div><div className="text-gray-500 text-sm">{brand.phone}</div></div>
            </div>
          </div>
        </div>
      )
    }

    // PR-4: Opportunity
    if (templateId === 'pr-opportunity') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-16">
            <div className="text-lg tracking-[0.5em] mb-4" style={{ color: primaryColor }}>RARE OPPORTUNITY</div>
            <div className="text-5xl font-light mb-8">{headline || 'PRICE IMPROVED'}</div>
            <div className="text-2xl text-white/50 line-through mb-2">{formatPrice(previousPrice || (property.price || 0) * 1.1)}</div>
            <div className="text-7xl font-light mb-8" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="w-32 h-0.5 mb-8" style={{ backgroundColor: primaryColor }} />
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-white/60 mb-6">{property.city}, {property.state}</div>
            <div className="flex gap-8">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.squareFeet?.toLocaleString()} Sq Ft</span>
            </div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center text-white/60">
            <div>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // PR-5: Motivated Seller
    if (templateId === 'pr-motivated') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/30" />
          </div>
          <div className="absolute top-12 left-12 right-12">
            <div className="inline-block px-6 py-3 rounded" style={{ backgroundColor: '#DC2626' }}>
              <span className="text-xl font-bold text-white">⚡ MOTIVATED SELLER</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="text-lg tracking-wider mb-2" style={{ color: primaryColor }}>{headline || 'PRICE REDUCED'}</div>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-3xl text-white/40 line-through">{formatPrice(previousPrice || (property.price || 0) * 1.1)}</span>
              <span className="text-6xl font-bold" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</span>
            </div>
            <div className="text-3xl font-bold mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-4">{property.city}, {property.state}</div>
            <div className="flex gap-4 mb-6">
              <span className="px-4 py-2 bg-white/10 rounded">{property.bedrooms} Beds</span>
              <span className="px-4 py-2 bg-white/10 rounded">{property.bathrooms} Baths</span>
              <span className="px-4 py-2 bg-white/10 rounded">{property.squareFeet?.toLocaleString()} Sq Ft</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{brand.business_name?.[0]}</div>
              <div><div className="font-semibold">{brand.business_name}</div><div className="text-white/60">{brand.phone}</div></div>
            </div>
          </div>
        </div>
      )
    }

    // PR-6: Deal Alert
    if (templateId === 'pr-deal-alert') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          {/* Alert Banner */}
          <div className="absolute top-0 left-0 right-0 py-6" style={{ backgroundColor: '#DC2626' }}>
            <div className="text-center text-white">
              <span className="text-3xl font-black">🚨 {headline || 'PRICE DROP ALERT'} 🚨</span>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center pt-16">
            <div className="text-2xl text-white/50 line-through">{formatPrice(previousPrice || (property.price || 0) * 1.1)}</div>
            <div className="text-8xl font-black my-4" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="text-3xl mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-6">{property.city}, {property.state}</div>
            <div className="flex gap-6 text-xl">
              <span>{property.bedrooms} BD</span>
              <span>•</span>
              <span>{property.bathrooms} BA</span>
              <span>•</span>
              <span>{property.squareFeet?.toLocaleString()} SF</span>
            </div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center text-white">
            <div className="text-lg">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // ========== UNDER CONTRACT TEMPLATES ==========

    // UC-1: Pending Banner
    if (templateId === 'uc-pending-banner') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          {/* Diagonal Banner */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[150%] py-8 text-center transform -rotate-45" style={{ backgroundColor: primaryColor }}>
              <span className="text-5xl font-black tracking-wider" style={{ color: secondaryColor }}>📝 {headline || 'PENDING'}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white bg-gradient-to-t from-black/90 to-transparent">
            <div className="text-4xl font-bold mb-2">{formatPrice(property.price || 0)}</div>
            <div className="text-2xl mb-1">{property.address}</div>
            <div className="text-white/70">{property.city}, {property.state}</div>
            <div className="mt-4">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // UC-2: Offer Accepted
    if (templateId === 'uc-offer-accepted') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-16">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-5xl font-light mb-4">{headline || 'OFFER ACCEPTED'}</div>
            <div className="w-32 h-0.5 mb-8" style={{ backgroundColor: primaryColor }} />
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-white/60 mb-6">{property.city}, {property.state}</div>
            <div className="text-4xl" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="mt-12 text-lg text-white/60">
              Looking to buy or sell? Let's talk!
            </div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center text-white">
            <div>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // UC-3: Moving Fast
    if (templateId === 'uc-moving-fast') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/70" />
          </div>
          <div className="absolute top-12 left-12 right-12">
            <div className="inline-block px-6 py-3 rounded-full" style={{ backgroundColor: '#DC2626' }}>
              <span className="text-2xl font-bold text-white">⚡ MOVING FAST</span>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center pt-12">
            <div className="text-6xl font-black mb-4">{headline || 'UNDER CONTRACT'}</div>
            <div className="text-xl text-white/60 mb-8">IN JUST {Math.floor(Math.random() * 5) + 1} DAYS!</div>
            <div className="text-4xl mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-6">{property.city}, {property.state}</div>
            <div className="text-5xl font-bold" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <div className="text-xl text-white mb-2">Want results like this?</div>
            <div className="text-lg" style={{ color: primaryColor }}>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // UC-4: Success Check
    if (templateId === 'uc-success-check') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          {/* Success Check Badge */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-64 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22C55E' }}>
              <span className="text-9xl text-white">✓</span>
            </div>
          </div>
          <div className="absolute top-12 left-0 right-0 text-center">
            <span className="text-4xl font-bold text-white">{headline || 'UNDER CONTRACT'}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white text-center bg-gradient-to-t from-black to-transparent">
            <div className="text-3xl font-bold mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-4">{property.city}, {property.state} • {formatPrice(property.price || 0)}</div>
            <div>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // UC-5: Contract Signed
    if (templateId === 'uc-contract-signed') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="absolute inset-8 border-2" style={{ borderColor: primaryColor }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-20">
            <div className="text-lg tracking-[0.5em] mb-4 text-white/60">CONTRACT</div>
            <div className="text-6xl font-light mb-4">{headline || 'SIGNED'}</div>
            <div className="w-32 h-0.5 mb-8" style={{ backgroundColor: primaryColor }} />
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-white/60 mb-6">{property.city}, {property.state}</div>
            <div className="text-4xl" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="mt-12 flex gap-8 text-white/60">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.squareFeet?.toLocaleString()} Sq Ft</span>
            </div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center text-white/60">
            <div>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // UC-6: Buyers Found
    if (templateId === 'uc-buyers-found') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/40" />
          </div>
          <div className="absolute top-12 left-12 right-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full" style={{ backgroundColor: primaryColor }}>
              <span className="text-3xl">🏠</span>
              <span className="text-xl font-bold" style={{ color: secondaryColor }}>{headline || 'BUYERS FOUND!'}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="text-4xl font-bold mb-4">New Homeowners!</div>
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-white/70 mb-4">{property.city}, {property.state}</div>
            <div className="text-3xl font-bold mb-8" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur">
              <div className="text-lg mb-2">Looking to buy your dream home?</div>
              <div className="font-bold">{brand.business_name} • {brand.phone}</div>
            </div>
          </div>
        </div>
      )
    }


    // ========== JUST SOLD TEMPLATES ==========

    // JS-1: SOLD Banner
    if (templateId === 'js-sold-banner') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[150%] py-10 text-center transform -rotate-45" style={{ backgroundColor: '#DC2626' }}>
              <span className="text-7xl font-black text-white tracking-wider">🎉 SOLD!</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white bg-gradient-to-t from-black/90 to-transparent">
            <div className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="text-2xl mb-1">{property.address}</div>
            <div className="text-white/70">{property.city}, {property.state}</div>
            <div className="mt-4">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // JS-2: Celebration
    if (templateId === 'js-celebration') {
      return (
        <div ref={ref} className="relative overflow-hidden" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-6xl font-black mb-4">{headline || 'JUST SOLD!'}</div>
            <div className="w-32 h-1 mb-8" style={{ backgroundColor: primaryColor }} />
            <div className="text-3xl mb-2">{property.address}</div>
            <div className="text-xl text-white/70 mb-6">{property.city}, {property.state}</div>
            <div className="text-5xl font-bold" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center text-white">
            <div className="text-lg">Congratulations to the new homeowners!</div>
            <div className="mt-2">{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // JS-3: Gold Success
    if (templateId === 'js-gold-success') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'Georgia, serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="absolute inset-8 border-4" style={{ borderColor: primaryColor }} />
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
            <div className="px-12 py-4 rounded-full" style={{ backgroundColor: primaryColor }}>
              <span className="text-3xl font-bold tracking-wider" style={{ color: secondaryColor }}>✨ SOLD ✨</span>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-20 pt-32">
            <div className="text-5xl font-light mb-4">{property.address}</div>
            <div className="text-xl text-white/60 mb-8">{property.city}, {property.state}</div>
            <div className="text-6xl font-light" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 text-center text-white">
            <div>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // JS-4: Achievement
    if (templateId === 'js-achievement') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/70" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
            <div className="text-9xl mb-4">🏆</div>
            <div className="text-4xl font-bold tracking-wider mb-2" style={{ color: primaryColor }}>ANOTHER ONE</div>
            <div className="text-7xl font-black mb-6">{headline || 'SOLD!'}</div>
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-white/60 mb-6">{property.city}, {property.state}</div>
            <div className="text-5xl font-bold" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <div className="inline-block px-8 py-4 rounded-full" style={{ backgroundColor: primaryColor }}>
              <span className="text-xl font-bold" style={{ color: secondaryColor }}>Ready to be next? Call {brand.phone}</span>
            </div>
          </div>
        </div>
      )
    }

    // JS-5: Record Sale
    if (templateId === 'js-record-sale') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="absolute top-0 left-0 right-0 py-6" style={{ backgroundColor: '#DC2626' }}>
            <div className="text-center text-white">
              <span className="text-2xl font-bold tracking-wider">🔥 RECORD SALE 🔥</span>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center pt-12">
            <div className="text-6xl font-black mb-4">{headline || 'JUST SOLD'}</div>
            <div className="text-7xl font-black my-4" style={{ color: primaryColor }}>{formatPrice(property.price || 0)}</div>
            <div className="text-2xl mb-2">{property.address}</div>
            <div className="text-white/60">{property.city}, {property.state}</div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 text-center text-white">
            <div style={{ color: primaryColor }}>{brand.business_name} • {brand.phone}</div>
          </div>
        </div>
      )
    }

    // JS-6: Minimal Sold
    if (templateId === 'js-minimal-sold') {
      return (
        <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
          <div className="absolute inset-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-white p-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="px-4 py-2 rounded font-bold text-white" style={{ backgroundColor: '#22C55E' }}>SOLD</div>
              <div className="text-3xl font-bold text-gray-900">{formatPrice(property.price || 0)}</div>
            </div>
            <div className="text-2xl text-gray-800 mb-1">{property.address}</div>
            <div className="text-gray-500 mb-4">{property.city}, {property.state}</div>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>{brand.business_name?.[0]}</div>
              <div>
                <div className="font-semibold text-gray-900">{brand.business_name}</div>
                <div className="text-sm text-gray-500">{brand.phone}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // ========== FALLBACK (Default Template) ==========
    return (
      <div ref={ref} className="relative" style={{ width: 1080, height: 1080, fontFamily: 'system-ui, sans-serif' }}>
        <div className="absolute inset-0">
          <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        <div className="absolute top-0 left-0 right-0 py-6 text-center" style={{ backgroundColor: primaryColor }}>
          <span className="text-2xl font-bold tracking-[0.3em]" style={{ color: secondaryColor }}>{headline}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          {property.price && <div className="text-6xl font-bold mb-4" style={{ color: primaryColor }}>{formatPrice(property.price)}</div>}
          <div className="text-3xl font-semibold mb-2">{property.address || '123 Main Street'}</div>
          <div className="text-xl text-white/80 mb-6">{property.city}{property.city && property.state ? ', ' : ''}{property.state}</div>
          <div className="flex gap-8 mb-8">
            {property.bedrooms && <div className="text-center"><div className="text-3xl font-bold">{property.bedrooms}</div><div className="text-sm text-white/60 uppercase">Beds</div></div>}
            {property.bathrooms && <div className="text-center"><div className="text-3xl font-bold">{property.bathrooms}</div><div className="text-sm text-white/60 uppercase">Baths</div></div>}
            {property.squareFeet && <div className="text-center"><div className="text-3xl font-bold">{property.squareFeet.toLocaleString()}</div><div className="text-sm text-white/60 uppercase">Sq Ft</div></div>}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: primaryColor, color: secondaryColor }}>{brand.business_name?.[0] || 'A'}</div>
            <div><div className="font-semibold text-lg">{brand.business_name || 'Agent Name'}</div>{brand.phone && <div className="text-white/60">{brand.phone}</div>}</div>
          </div>
        </div>
      </div>
    )
  }
)

TemplateRenderer.displayName = 'TemplateRenderer'

// ============================================
// FACEBOOK TEMPLATE RENDERER (1200x630)
// ============================================

// FacebookTemplateRenderer moved to facebook-renderer.tsx

// ============================================
// VERTICAL TEMPLATE RENDERER (1080x1920)
// ============================================

// VerticalTemplateRenderer moved to vertical-renderer.tsx



export { FacebookTemplateRenderer } from './facebook-renderer'
export { VerticalTemplateRenderer } from './vertical-renderer'

