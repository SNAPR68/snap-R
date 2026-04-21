'use client'

import { X, Loader2, Check, Plus, Upload, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'

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
  description?: string
  cover_image_url?: string
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
  tour_scenes?: TourScene[]
}

interface TourEditorProps {
  tour?: Tour
  onClose: () => void
  onSave: (tour: Tour) => void
}

export function TourEditor({ tour, onClose, onSave }: TourEditorProps) {
  const [name, setName] = useState(tour?.name || '')
  const [description, setDescription] = useState(tour?.description || '')
  const [scenes, setScenes] = useState<TourScene[]>(tour?.tour_scenes || [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const removeScene = (id: string) => {
    setScenes(scenes.filter(s => s.id !== id))
  }

  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === scenes.length - 1) return

    const newScenes = [...scenes]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newScenes[index], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[index]]
    newScenes.forEach((s, idx) => (s.order_index = idx))
    setScenes(newScenes)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container-high rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold">{tour ? 'Edit Gallery' : 'Create Gallery'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name & Description */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Gallery Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 123 Main Street Photos"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the property..."
              rows={2}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none resize-none text-white"
            />
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-white/60">Photos ({scenes.length})</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={() => {}}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Add Photos
              </Button>
            </div>

            {scenes.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-white/30" />
                <p className="text-white/50 text-sm">Click to upload photos</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {scenes.map((scene, index) => (
                  <div key={scene.id} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scene.image_url} alt={scene.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => moveScene(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-white/20 rounded hover:bg-white/30 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeScene(scene.id)}
                        className="p-1.5 bg-red-500/50 rounded hover:bg-red-500/70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveScene(index, 'down')}
                        disabled={index === scenes.length - 1}
                        className="p-1.5 bg-white/20 rounded hover:bg-white/30 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white transition-colors">
            Cancel
          </button>
          <Button
            onClick={() => setSaving(true)}
            disabled={!name.trim() || scenes.length === 0 || saving}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            {tour ? 'Save Changes' : 'Create Gallery'}
          </Button>
        </div>
      </div>
    </div>
  )
}
