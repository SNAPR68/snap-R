'use client'

import { Plus, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface Hotspot {
  id: string
  x: number
  y: number
  label: string
  description?: string
}

interface HotspotEditorProps {
  hotspots: Hotspot[]
  onAddHotspot: (hotspot: Hotspot) => void
  onRemoveHotspot: (id: string) => void
  onUpdateHotspot: (hotspot: Hotspot) => void
}

export function HotspotEditor({
  hotspots,
  onAddHotspot,
  onRemoveHotspot,
  onUpdateHotspot,
}: HotspotEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (hotspots.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
        <AlertCircle className="w-6 h-6 text-white/50 mx-auto mb-2" />
        <p className="text-white/60 text-sm">No hotspots added yet</p>
        <p className="text-white/40 text-xs mt-1">Hotspots allow interactive labels on photos</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white">Hotspots ({hotspots.length})</h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {hotspots.map(hotspot => (
          <div
            key={hotspot.id}
            className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex-1 min-w-0">
              {editingId === hotspot.id ? (
                <Input
                  type="text"
                  value={hotspot.label}
                  onChange={(e) =>
                    onUpdateHotspot({ ...hotspot, label: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white text-sm"
                />
              ) : (
                <p className="text-white text-sm font-medium truncate">{hotspot.label}</p>
              )}
            </div>
            <button
              onClick={() => setEditingId(editingId === hotspot.id ? null : hotspot.id)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              {editingId === hotspot.id ? (
                <X className="w-4 h-4 text-white/60" />
              ) : (
                <Plus className="w-4 h-4 text-white/60" />
              )}
            </button>
            <button
              onClick={() => onRemoveHotspot(hotspot.id)}
              className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
