'use client'

import { Sparkles, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface ContentEditorProps {
  headline: string
  caption: string
  hashtags: string
  genCaption: boolean
  genHashtags: boolean
  tone: 'professional' | 'casual' | 'luxury' | 'excited'
  onHeadlineChange: (value: string) => void
  onCaptionChange: (value: string) => void
  onHashtagsChange: (value: string) => void
  onToneChange: (value: 'professional' | 'casual' | 'luxury' | 'excited') => void
  onGenerateCaption: () => void
  onGenerateHashtags: () => void
  loading: boolean
}

const TONES = [
  { id: 'professional', label: '🏢' },
  { id: 'casual', label: '😊' },
  { id: 'luxury', label: '✨' },
  { id: 'excited', label: '🎉' },
] as const

export function ContentEditor({
  headline,
  caption,
  hashtags,
  genCaption,
  genHashtags,
  tone,
  onHeadlineChange,
  onCaptionChange,
  onHashtagsChange,
  onToneChange,
  onGenerateCaption,
  onGenerateHashtags,
  loading,
}: ContentEditorProps) {
  return (
    <div className="space-y-4">
      {/* Headline */}
      <div>
        <Label htmlFor="headline" className="text-white/80 mb-2">
          Headline
        </Label>
        <Input
          id="headline"
          type="text"
          value={headline}
          onChange={e => onHeadlineChange(e.target.value)}
          placeholder="e.g., JUST LISTED"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Tone Selector */}
      <div>
        <Label className="text-white/80 mb-2">Tone</Label>
        <div className="flex gap-2">
          {TONES.map(t => (
            <button
              key={t.id}
              onClick={() => onToneChange(t.id)}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                tone === t.id
                  ? 'bg-amber-500/30 border border-amber-500 text-amber-300'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Caption */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="caption" className="text-white/80">
            Caption
          </Label>
          <button
            onClick={onGenerateCaption}
            disabled={loading || genCaption}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            {genCaption ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <textarea
          id="caption"
          value={caption}
          onChange={e => onCaptionChange(e.target.value)}
          placeholder="Write your caption..."
          rows={4}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none resize-none"
        />
      </div>

      {/* Hashtags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="hashtags" className="text-white/80">
            Hashtags
          </Label>
          <button
            onClick={onGenerateHashtags}
            disabled={loading || genHashtags}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            {genHashtags ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <Input
          id="hashtags"
          type="text"
          value={hashtags}
          onChange={e => onHashtagsChange(e.target.value)}
          placeholder="#justlisted #realestate #luxury"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        <p className="text-xs text-white/40 mt-1">Separate with spaces</p>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300">Generated content uses AI to create platform-optimized captions based on your tone and property details.</p>
      </div>
    </div>
  )
}
