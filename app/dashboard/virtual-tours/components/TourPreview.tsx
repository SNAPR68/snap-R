'use client'

import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react'
import { useState } from 'react'

interface TourScene {
  id: string
  name: string
  image_url: string
  order_index: number
}

interface Tour {
  id: string
  name: string
  tour_scenes?: TourScene[]
}

interface TourPreviewProps {
  tour: Tour
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
}

export function TourPreview({ tour, isOpen, onClose, onDownload }: TourPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scenes = tour.tour_scenes || []

  if (!isOpen || scenes.length === 0) {
    return null
  }

  const currentScene = scenes[currentIndex]

  const nextScene = () => {
    setCurrentIndex(prev => Math.min(prev + 1, scenes.length - 1))
  }

  const prevScene = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="text-white">
          <h2 className="font-semibold">{tour.name}</h2>
          <p className="text-sm text-white/50">{currentIndex + 1} / {scenes.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownload}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Download as video"
          >
            <Download className="w-5 h-5 text-white" />
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
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentScene.image_url}
          alt={currentScene.name}
          className="max-w-full max-h-full object-contain"
        />

        {/* Navigation */}
        {scenes.length > 1 && (
          <>
            <button
              onClick={prevScene}
              disabled={currentIndex === 0}
              className="absolute left-4 p-3 bg-black/60 rounded-full hover:bg-black/80 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={nextScene}
              disabled={currentIndex === scenes.length - 1}
              className="absolute right-4 p-3 bg-black/60 rounded-full hover:bg-black/80 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex-shrink-0 p-4 bg-black/80 backdrop-blur-sm border-t border-white/10">
        <div className="flex gap-2 overflow-x-auto justify-center">
          {scenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex ? 'border-amber-500' : 'border-transparent hover:border-white/30'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
