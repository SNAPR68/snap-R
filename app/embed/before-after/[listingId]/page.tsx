'use client'

import { useState, useEffect, useRef } from 'react'

interface Photo {
  raw_url: string | null
  processed_url: string | null
}

export default function BeforeAfterEmbed({ params }: { params: Promise<{ listingId: string }> }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [current, setCurrent] = useState(0)
  const [sliderPos, setSliderPos] = useState(50)
  const [loading, setLoading] = useState(true)
  const [resolvedId, setResolvedId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

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
          setPhotos(data.photos ?? [])
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchPhotos()
  }, [resolvedId])

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !dragging.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }

  const photo = photos[current]

  useEffect(() => {
    // Send height to parent for auto-resize
    const sendHeight = () => {
      window.parent.postMessage({ type: 'snapr-resize', height: document.body.scrollHeight, listingId: resolvedId }, '*')
    }
    sendHeight()
    const observer = new ResizeObserver(sendHeight)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [resolvedId, photos])

  if (loading) {
    return <div className="flex items-center justify-center h-64 bg-surface text-gray-500">Loading...</div>
  }

  if (photos.length === 0 || !photo) {
    return <div className="flex items-center justify-center h-64 bg-surface text-gray-500">No enhanced photos available</div>
  }

  const beforeUrl = photo.raw_url
  const afterUrl = photo.processed_url

  if (!beforeUrl || !afterUrl) {
    return <div className="flex items-center justify-center h-64 bg-surface text-gray-500">Photo not available</div>
  }

  return (
    <div className="bg-surface p-2">
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] overflow-hidden rounded-lg cursor-col-resize select-none"
        onMouseDown={() => { dragging.current = true }}
        onMouseUp={() => { dragging.current = false }}
        onMouseLeave={() => { dragging.current = false }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onTouchStart={() => { dragging.current = true }}
        onTouchEnd={() => { dragging.current = false }}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        role="slider"
        aria-label="Before and after comparison"
        aria-valuenow={Math.round(sliderPos)}
        tabIndex={0}
      >
        {/* After (full) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt="After enhancement" className="absolute inset-0 w-full h-full object-cover" />

        {/* Before (clipped) */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeUrl} alt="Before enhancement" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }} />
        </div>

        {/* Slider line */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-black text-xs font-bold">↔</span>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Before</span>
        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">After</span>
      </div>

      {/* Navigation dots */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setSliderPos(50) }}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-accent-gold' : 'bg-gray-600'}`}
              aria-label={`Photo ${i + 1}`}
            />
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
