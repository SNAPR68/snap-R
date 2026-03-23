'use client'

import { MapPin, AlertCircle } from 'lucide-react'

interface PropertyMapProps {
  address: string
  latitude?: number | null
  longitude?: number | null
  mapsApiKey?: string | null
  primaryColor?: string
}

export function PropertyMap({
  address,
  latitude,
  longitude,
  mapsApiKey,
  primaryColor = '#D4A017',
}: PropertyMapProps) {
  const hasCoordinates = latitude && longitude

  if (!mapsApiKey || !hasCoordinates) {
    return (
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Map unavailable</p>
            <p className="text-white/60 text-sm mt-1">
              Maps are not configured for this listing. Contact the agent for directions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${latitude},${longitude}`

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
        <h3 className="text-lg font-semibold text-white">Location</h3>
      </div>
      <div className="rounded-lg overflow-hidden border border-white/10 h-96">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          title="Property location map"
        />
      </div>
      <p className="text-white/70">{address}</p>
    </div>
  )
}
