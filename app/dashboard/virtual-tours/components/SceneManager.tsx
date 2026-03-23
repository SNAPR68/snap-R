'use client'

import { Edit3, Trash2, Link2, Check, Eye } from 'lucide-react'
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
  slug: string
  is_published: boolean
  view_count: number
  tour_scenes?: TourScene[]
}

interface SceneManagerProps {
  tour: Tour
  onEdit: (tour: Tour) => void
  onDelete: (tour: Tour) => void
  onView: (tour: Tour) => void
}

export function SceneManager({ tour, onEdit, onDelete, onView }: SceneManagerProps) {
  const [copied, setCopied] = useState(false)
  const tourUrl = typeof window !== 'undefined' ? `${window.location.origin}/tour/${tour.slug}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(tourUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-white/50" />
        <span className="text-white/50 text-sm">{tour.view_count} views</span>
      </div>

      {/* Scenes Grid */}
      {tour.tour_scenes && tour.tour_scenes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-white/60 font-medium">{tour.tour_scenes.length} photos</p>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {tour.tour_scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scene.image_url} alt={scene.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 text-xs bg-black/80 text-white px-1 py-0.5 rounded">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 mt-4">
        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={() => onView(tour)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 rounded-lg text-sm text-blue-300 hover:bg-blue-500/30 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Gallery
        </button>
        <button
          onClick={() => onEdit(tour)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 rounded-lg text-sm text-amber-300 hover:bg-amber-500/30 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(tour)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg text-sm text-red-300 hover:bg-red-500/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  )
}
