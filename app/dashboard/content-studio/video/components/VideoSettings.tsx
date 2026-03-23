'use client'

import { RectangleHorizontal, Smartphone, Square } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

type AspectRatio = '16:9' | '1:1' | '9:16'
type VideoTemplate = 'property-showcase' | 'just-listed' | 'open-house' | 'price-drop' | 'sold' | 'short-form'

const VIDEO_TEMPLATES: Record<VideoTemplate, { name: string; desc: string; duration: string }> = {
  'short-form': { name: 'Short-Form', desc: 'TikTok/Reels — fast cuts with AI hook text', duration: '15s' },
  'property-showcase': { name: 'Showcase', desc: 'Cinematic slideshow with crossfades', duration: '~3s/photo' },
  'just-listed': { name: 'Just Listed', desc: 'Intro card + slide transitions + features', duration: '~3s/photo' },
  'open-house': { name: 'Open House', desc: 'Urgency pacing with event date badge', duration: '~2.5s/photo' },
  'price-drop': { name: 'Price Drop', desc: 'Price reduced badge with urgency pacing', duration: '~2.5s/photo' },
  'sold': { name: 'Sold', desc: 'Celebration styling with social proof', duration: '~3s/photo' },
}

const ASPECT_RATIOS: Record<AspectRatio, { width: number; height: number; label: string; icon: typeof RectangleHorizontal; platform: string }> = {
  '9:16': { width: 1080, height: 1920, label: 'Vertical', icon: Smartphone, platform: 'Reels/TikTok' },
  '1:1': { width: 1080, height: 1080, label: 'Square', icon: Square, platform: 'Instagram Feed' },
  '16:9': { width: 1920, height: 1080, label: 'Landscape', icon: RectangleHorizontal, platform: 'Facebook/YouTube' },
}

interface VideoSettingsProps {
  template: VideoTemplate
  aspectRatio: AspectRatio
  openHouseDate: string
  previousPrice: string
  daysOnMarket: string
  onTemplateChange: (template: VideoTemplate) => void
  onAspectRatioChange: (ratio: AspectRatio) => void
  onOpenHouseDateChange: (date: string) => void
  onPreviousPriceChange: (price: string) => void
  onDaysOnMarketChange: (days: string) => void
}

export function VideoSettings({
  template,
  aspectRatio,
  openHouseDate,
  previousPrice,
  daysOnMarket,
  onTemplateChange,
  onAspectRatioChange,
  onOpenHouseDateChange,
  onPreviousPriceChange,
  onDaysOnMarketChange,
}: VideoSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <Label className="text-white/80 mb-3 block">Video Template</Label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(VIDEO_TEMPLATES) as Array<[VideoTemplate, typeof VIDEO_TEMPLATES['property-showcase']]>).map(
            ([key, value]) => (
              <button
                key={key}
                onClick={() => onTemplateChange(key)}
                className={`p-3 rounded-lg text-left transition-all ${
                  template === key
                    ? 'bg-amber-500/30 border border-amber-500'
                    : 'bg-white/5 border border-white/10 hover:border-amber-500/50'
                }`}
              >
                <p className="font-medium text-white">{value.name}</p>
                <p className="text-xs text-white/50 mt-1">{value.desc}</p>
                <p className="text-xs text-white/40 mt-1">{value.duration}</p>
              </button>
            )
          )}
        </div>
      </div>

      {/* Aspect Ratio Selection */}
      <div>
        <Label className="text-white/80 mb-3 block">Video Format</Label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(ASPECT_RATIOS) as Array<[AspectRatio, typeof ASPECT_RATIOS['9:16']]>).map(([key, value]) => {
            const IconComponent = value.icon
            return (
              <button
                key={key}
                onClick={() => onAspectRatioChange(key)}
                className={`p-3 rounded-lg text-center transition-all ${
                  aspectRatio === key
                    ? 'bg-amber-500/30 border border-amber-500'
                    : 'bg-white/5 border border-white/10 hover:border-amber-500/50'
                }`}
              >
                <IconComponent className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                <p className="font-medium text-white text-sm">{value.label}</p>
                <p className="text-xs text-white/50 mt-1">{value.platform}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Optional Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">Optional Settings</h3>

        {/* Open House Date */}
        <div>
          <Label htmlFor="open-house-date" className="text-white/60 text-sm">
            Open House Date
          </Label>
          <Input
            id="open-house-date"
            type="datetime-local"
            value={openHouseDate}
            onChange={e => onOpenHouseDateChange(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
          <p className="text-xs text-white/40 mt-1">Shows event badge on video</p>
        </div>

        {/* Previous Price */}
        <div>
          <Label htmlFor="previous-price" className="text-white/60 text-sm">
            Previous Price
          </Label>
          <Input
            id="previous-price"
            type="number"
            value={previousPrice}
            onChange={e => onPreviousPriceChange(e.target.value)}
            placeholder="e.g., 850000"
            className="bg-white/5 border-white/10 text-white"
          />
          <p className="text-xs text-white/40 mt-1">Shows price reduction badge</p>
        </div>

        {/* Days On Market */}
        <div>
          <Label htmlFor="days-on-market" className="text-white/60 text-sm">
            Days on Market
          </Label>
          <Input
            id="days-on-market"
            type="number"
            value={daysOnMarket}
            onChange={e => onDaysOnMarketChange(e.target.value)}
            placeholder="e.g., 15"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>
    </div>
  )
}
