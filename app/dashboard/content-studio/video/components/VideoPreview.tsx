'use client'

import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'

interface Photo {
  id: string
  url: string
  selected: boolean
}

interface VideoPreviewProps {
  photos: Photo[]
  currentPreview: number
  onPreviousPhoto: () => void
  onNextPhoto: () => void
}

export function VideoPreview({
  photos,
  currentPreview,
  onPreviousPhoto,
  onNextPhoto,
}: VideoPreviewProps) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-lg border border-white/10">
        <ImageIcon className="w-12 h-12 text-white/30 mb-3" />
        <p className="text-white/50 text-sm">No photos selected</p>
        <p className="text-white/30 text-xs mt-1">Select photos from your listing to preview</p>
      </div>
    )
  }

  const photo = photos[currentPreview]

  return (
    <div className="space-y-3">
      {/* Main Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={`Preview ${currentPreview + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation */}
        {photos.length > 1 && (
          <>
            <button
              onClick={onPreviousPhoto}
              disabled={currentPreview === 0}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/60 rounded-full hover:bg-black/80 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onNextPhoto}
              disabled={currentPreview === photos.length - 1}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/60 rounded-full hover:bg-black/80 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded text-xs text-white/80">
          {currentPreview + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => {
                // This handler would be provided by parent
              }}
              className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentPreview ? 'border-amber-500' : 'border-white/20 hover:border-white/40'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
