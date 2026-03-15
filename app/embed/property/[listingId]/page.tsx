'use client'

import { useState, useEffect } from 'react'

interface PropertyData {
  title: string
  address: string
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  sqft: number | null
  hero_url: string | null
  property_site_url: string | null
}

export default function PropertyEmbed({ params }: { params: Promise<{ listingId: string }> }) {
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolvedId, setResolvedId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setResolvedId(p.listingId))
  }, [params])

  useEffect(() => {
    if (!resolvedId) return
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/embed/property?listingId=${resolvedId}`, { signal: AbortSignal.timeout(15000) })
        if (res.ok) {
          const data = await res.json()
          setProperty(data.property)
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [resolvedId])

  useEffect(() => {
    const sendHeight = () => {
      window.parent.postMessage({ type: 'snapr-resize', height: document.body.scrollHeight, listingId: resolvedId }, '*')
    }
    sendHeight()
    const observer = new ResizeObserver(sendHeight)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [resolvedId, property])

  if (loading) {
    return <div className="flex items-center justify-center h-48 bg-[#0A0A0A] text-gray-500">Loading...</div>
  }

  if (!property) {
    return <div className="flex items-center justify-center h-48 bg-[#0A0A0A] text-gray-500">Property not available</div>
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)

  return (
    <div className="bg-[#0A0A0A] p-2">
      <a
        href={property.property_site_url ?? 'https://snap-r.com'}
        target="_blank"
        rel="noopener noreferrer"
        className="block glass-luxury rounded-xl overflow-hidden hover:ring-1 hover:ring-[#D4A017]/30 transition-all group"
      >
        {/* Hero image */}
        {property.hero_url && (
          <div className="relative w-full aspect-[16/9] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={property.hero_url}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {/* Details */}
        <div className="p-4">
          {property.price && (
            <p className="text-[#D4A017] text-xl font-bold mb-1">{formatPrice(property.price)}</p>
          )}
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{property.title}</h3>
          <p className="text-gray-400 text-xs mb-3 line-clamp-1">{property.address}</p>

          {/* Specs */}
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            {property.bedrooms != null && (
              <span><strong className="text-white">{property.bedrooms}</strong> Beds</span>
            )}
            {property.bathrooms != null && (
              <span><strong className="text-white">{property.bathrooms}</strong> Baths</span>
            )}
            {property.sqft != null && (
              <span><strong className="text-white">{property.sqft.toLocaleString()}</strong> SqFt</span>
            )}
          </div>
        </div>
      </a>

      <div className="text-center mt-2">
        <span className="text-gray-600 text-[10px]">
          Powered by <a href="https://snap-r.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">SnapR</a>
        </span>
      </div>
    </div>
  )
}
