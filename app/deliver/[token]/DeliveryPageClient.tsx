'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Download, Grid3X3, Maximize2, X, ChevronLeft, ChevronRight, Package } from 'lucide-react'

interface Photo {
  id: string
  url: string
  downloadUrl: string
  variant: string | null
  order: number
}

interface ListingMeta {
  bedrooms: number | null
  bathrooms: number | null
  squareFeet: number | null
  price: number | null
}

interface Props {
  deliveryId: string
  listingId: string
  clientName: string
  photographerName: string
  studioName: string
  primaryColor: string
  logoUrl: string | null
  propertyLabel: string
  message: string | null
  allowDownload: boolean
  expiresAt: string | null
  photos: Photo[]
  listing: ListingMeta | null
}

export default function DeliveryPageClient({
  deliveryId,
  listingId,
  clientName,
  photographerName,
  studioName,
  primaryColor,
  logoUrl,
  propertyLabel,
  message,
  allowDownload,
  expiresAt,
  photos,
  listing,
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadingSingle, setDownloadingSingle] = useState<string | null>(null)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    // Record view event
    fetch('/api/deliver/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryId, listingId, eventType: 'viewed' }),
    }).catch(() => { /* fire and forget */ })
  }, [deliveryId, listingId])

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const prevPhoto = useCallback(() => {
    setLightboxIndex(i => (i === null || i === 0) ? photos.length - 1 : i - 1)
  }, [photos.length])

  const nextPhoto = useCallback(() => {
    setLightboxIndex(i => (i === null) ? 0 : (i + 1) % photos.length)
  }, [photos.length])

  const downloadSingle = useCallback(async (photo: Photo) => {
    if (!allowDownload) return
    setDownloadingSingle(photo.id)
    try {
      const response = await fetch(photo.downloadUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `photo-${photo.order + 1}.jpg`
      a.click()
      URL.revokeObjectURL(url)

      // Record event
      fetch('/api/deliver/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, listingId, eventType: 'downloaded_single' }),
      }).catch(() => { /* fire and forget */ })
    } catch {
      // download failed silently
    } finally {
      setDownloadingSingle(null)
    }
  }, [allowDownload, deliveryId, listingId])

  const downloadAll = useCallback(async () => {
    if (!allowDownload) return
    setDownloading(true)
    try {
      // Record event
      await fetch('/api/deliver/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, listingId, eventType: 'downloaded' }),
      })

      // Download each photo sequentially to avoid browser limits
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const response = await fetch(photo.downloadUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `photo-${String(i + 1).padStart(2, '0')}.jpg`
        a.click()
        URL.revokeObjectURL(url)
        // Small delay between downloads
        await new Promise(r => setTimeout(r, 300))
      }
    } catch {
      // download failed silently
    } finally {
      setDownloading(false)
    }
  }, [allowDownload, deliveryId, listingId, photos])

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const specs = listing ? [
    listing.bedrooms ? `${listing.bedrooms} bed` : null,
    listing.bathrooms ? `${listing.bathrooms} bath` : null,
    listing.squareFeet ? `${Number(listing.squareFeet).toLocaleString()} sqft` : null,
  ].filter(Boolean) : []

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #1A1A1A', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
        <div>
          {logoUrl ? (
            <Image src={logoUrl} alt={studioName} width={160} height={44} style={{ maxHeight: 44, maxWidth: 160, objectFit: 'contain' }} unoptimized />
          ) : (
            <span style={{ fontSize: 20, fontWeight: 700, color: primaryColor }}>{studioName}</span>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Delivered by</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{photographerName}</p>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome block */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>
            Hi {clientName}, your photos are ready!
          </h1>
          <p style={{ fontSize: 16, color: '#888', margin: '0 0 4px' }}>{propertyLabel}</p>
          {specs.length > 0 && (
            <p style={{ fontSize: 14, color: '#555', margin: 0 }}>{specs.join(' · ')}</p>
          )}
        </div>

        {/* Message from photographer */}
        {message && (
          <div style={{ background: '#141414', border: `1px solid #222`, borderLeft: `3px solid ${primaryColor}`, borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Message from {photographerName}</p>
            <p style={{ fontSize: 15, color: '#ddd', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{message}</p>
          </div>
        )}

        {/* Stats + Download bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: primaryColor }}>{photos.length}</p>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Photos</p>
            </div>
            {expiryLabel && (
              <div>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 2px' }}>Link expires</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{expiryLabel}</p>
              </div>
            )}
          </div>

          {allowDownload && photos.length > 0 && (
            <button
              onClick={downloadAll}
              disabled={downloading}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: primaryColor, color: '#000',
                padding: '13px 28px', borderRadius: 10,
                border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
                fontSize: 15, fontWeight: 700, opacity: downloading ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Package size={18} />
              {downloading ? 'Downloading...' : `Download All ${photos.length} Photos`}
            </button>
          )}
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: '#111', borderRadius: 16, border: '1px solid #1A1A1A' }}>
            <Grid3X3 size={48} style={{ color: '#333', margin: '0 auto 16px' }} />
            <p style={{ color: '#555', fontSize: 16, margin: 0 }}>No photos available yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', background: '#111', cursor: 'pointer', border: '1px solid #1A1A1A' }}
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  fill
                  style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                />
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0)',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                  padding: 10,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                  className="photo-hover-overlay"
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 8, padding: '8px 10px', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                      onClick={e => { e.stopPropagation(); openLightbox(index) }}
                      aria-label="Expand photo"
                    >
                      <Maximize2 size={16} />
                    </button>
                    {allowDownload && (
                      <button
                        style={{ background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 8, padding: '8px 10px', color: '#fff', cursor: downloadingSingle === photo.id ? 'not-allowed' : 'pointer', backdropFilter: 'blur(8px)' }}
                        onClick={e => { e.stopPropagation(); downloadSingle(photo) }}
                        aria-label="Download photo"
                        disabled={downloadingSingle === photo.id}
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Photo number */}
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px', fontSize: 12, color: '#fff', backdropFilter: 'blur(8px)' }}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {allowDownload && photos.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 48, padding: '32px 24px', background: '#111', borderRadius: 16, border: '1px solid #1A1A1A' }}>
            <p style={{ color: '#888', marginBottom: 20, fontSize: 15 }}>
              All {photos.length} photos are ready for download
            </p>
            <button
              onClick={downloadAll}
              disabled={downloading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: primaryColor, color: '#000',
                padding: '14px 32px', borderRadius: 10,
                border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
                fontSize: 16, fontWeight: 700, opacity: downloading ? 0.7 : 1,
              }}
            >
              <Download size={18} />
              {downloading ? 'Downloading...' : 'Download All Photos'}
            </button>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #1A1A1A', textAlign: 'center' }}>
          <p style={{ color: '#333', fontSize: 13 }}>
            Photos delivered by <span style={{ color: '#555' }}>{photographerName}</span>
          </p>
        </footer>
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
          }}
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: 10, color: '#fff', cursor: 'pointer', zIndex: 10 }}
            aria-label="Close"
          >
            <X size={22} />
          </button>

          {/* Counter */}
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '6px 16px', color: '#fff', fontSize: 14 }}>
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prevPhoto() }}
              style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: 12, color: '#fff', cursor: 'pointer', zIndex: 10 }}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', width: '100%', height: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].url}
              alt={`Photo ${lightboxIndex + 1}`}
              fill
              style={{ objectFit: 'contain' }}
              sizes="90vw"
              unoptimized
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); nextPhoto() }}
              style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: 12, color: '#fff', cursor: 'pointer', zIndex: 10 }}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Download button in lightbox */}
          {allowDownload && (
            <button
              onClick={e => { e.stopPropagation(); downloadSingle(photos[lightboxIndex]) }}
              disabled={downloadingSingle === photos[lightboxIndex].id}
              style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', alignItems: 'center', gap: 8,
                background: primaryColor, color: '#000',
                padding: '10px 24px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                opacity: downloadingSingle === photos[lightboxIndex].id ? 0.7 : 1,
              }}
            >
              <Download size={16} />
              Download Photo
            </button>
          )}
        </div>
      )}

      <style>{`
        .photo-hover-overlay { opacity: 0 !important; }
        div:hover > .photo-hover-overlay { opacity: 1 !important; background: rgba(0,0,0,0.4) !important; }
      `}</style>
    </div>
  )
}
