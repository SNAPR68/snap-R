'use client'

import { useState, useEffect } from 'react'

interface Photo {
  id: string
  processed_url: string
  variant: string | null
}

export default function GalleryEmbed({ params }: { params: Promise<{ listingId: string }> }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resolvedId, setResolvedId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setResolvedId(p.listingId))
  }, [params])

  useEffect(() => {
    if (!resolvedId) return
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`/api/embed/photos?listingId=${resolvedId}`, { signal: AbortSignal.timeout(15000) })
        if (res.ok) {
          const data = await res.json()
          setPhotos(data.photos?.filter((p: Photo) => p.processed_url) ?? [])
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchPhotos()
  }, [resolvedId])

  useEffect(() => {
    const sendHeight = () => {
      window.parent.postMessage({ type: 'snapr-resize', height: document.body.scrollHeight, listingId: resolvedId }, '*')
    }
    sendHeight()
    const observer = new ResizeObserver(sendHeight)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [resolvedId, photos])

  if (loading) {
    return <div className="flex items-center justify-center h-64 bg-[#0A0A0A] text-gray-500">Loading...</div>
  }

  if (photos.length === 0) {
    return <div className="flex items-center justify-center h-64 bg-[#0A0A0A] text-gray-500">No photos available</div>
  }

  const photo = photos[current]

  return (
    <div className="bg-[#0A0A0A] p-2">
      {/* Main image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.processed_url}
          alt={`Photo ${current + 1} of ${photos.length}`}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Counter badge */}
        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {current + 1} / {photos.length}
        </span>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(prev => (prev - 1 + photos.length) % photos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrent(prev => (prev + 1) % photos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors ${
                i === current ? 'border-[#D4A017]' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.processed_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="text-center mt-2">
        <a href="https://snap-r.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-[10px] hover:text-gray-400">
          Powered by SnapR
        </a>
      </div>
    </div>
  )
}
