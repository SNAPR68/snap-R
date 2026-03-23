'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Grid } from 'lucide-react'
import { useState } from 'react'

interface PropertyGalleryProps {
  photos: string[]
  currentPhoto: number
  isOpen: boolean
  onClose: () => void
  onPrevPhoto: () => void
  onNextPhoto: () => void
  onPhotoSelect: (index: number) => void
}

export function PropertyGallery({
  photos,
  currentPhoto,
  isOpen,
  onClose,
  onPrevPhoto,
  onNextPhoto,
  onPhotoSelect,
}: PropertyGalleryProps) {
  const [showThumbnails, setShowThumbnails] = useState(true)

  if (!isOpen) return null

  const photo = photos[currentPhoto]

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="text-white">
          <p className="font-medium">{currentPhoto + 1} / {photos.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Grid className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={`Photo ${currentPhoto + 1}`}
          className="max-w-full max-h-full object-contain"
        />

        {/* Navigation */}
        {photos.length > 1 && (
          <>
            <button
              onClick={onPrevPhoto}
              disabled={currentPhoto === 0}
              className="absolute left-4 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={onNextPhoto}
              disabled={currentPhoto === photos.length - 1}
              className="absolute right-4 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && (
        <div className="flex-shrink-0 p-4 bg-black/80 backdrop-blur-sm border-t border-white/10">
          <div className="flex gap-2 overflow-x-auto justify-center">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => onPhotoSelect(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentPhoto ? 'border-amber-400' : 'border-white/20 hover:border-white/40'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard hint */}
      <div className="flex-shrink-0 p-3 bg-black/60 text-center text-xs text-white/50">
        Arrow keys to navigate • ESC to close
      </div>
    </div>
  )
}
