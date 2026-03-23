'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, Heart, Share2 } from 'lucide-react'

interface PropertyHeroProps {
  photos: string[]
  currentPhoto: number
  heroImageIndex: number
  saved: boolean
  onPrevPhoto: () => void
  onNextPhoto: () => void
  onOpenLightbox: () => void
  onToggleSave: () => void
  onShare: () => void
  primaryColor?: string
}

export function PropertyHero({
  photos,
  currentPhoto,
  heroImageIndex,
  saved,
  onPrevPhoto,
  onNextPhoto,
  onOpenLightbox,
  onToggleSave,
  onShare,
  primaryColor = '#D4A017',
}: PropertyHeroProps) {
  if (photos.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-900 flex items-center justify-center">
        <p className="text-white/50">No photos available</p>
      </div>
    )
  }

  const heroPhoto = photos[heroImageIndex % photos.length]

  return (
    <div className="relative w-full bg-black overflow-hidden">
      {/* Hero Image with Ken Burns Effect */}
      <div className="relative w-full aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroPhoto}
          alt="Property hero"
          className="w-full h-full object-cover"
          style={{
            animation: 'kenBurns 6s ease-in-out forwards',
          }}
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 flex flex-col justify-between p-4">
          {/* Top Controls */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onToggleSave}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur transition-colors"
            >
              <Heart
                className="w-5 h-5 text-white"
                fill={saved ? 'currentColor' : 'none'}
              />
            </button>
            <button
              onClick={onShare}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur transition-colors"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between">
            {photos.length > 1 && (
              <>
                <button
                  onClick={onPrevPhoto}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <button
                  onClick={onOpenLightbox}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur transition-colors text-white text-sm font-medium"
                >
                  {currentPhoto + 1} / {photos.length}
                </button>

                <button
                  onClick={onNextPhoto}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kenBurns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}
