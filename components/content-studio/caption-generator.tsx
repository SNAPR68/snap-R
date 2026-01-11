'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Copy, Check, RefreshCw, Hash } from 'lucide-react'

interface PropertyDetails {
  address?: string
  city?: string
  state?: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  price?: number
  propertyType?: string
  features?: string[]
}

interface CaptionGeneratorProps {
  property: PropertyDetails
  platform: string
  contentType?: string
  onCaptionGenerated?: (caption: string) => void
  onHashtagsGenerated?: (hashtags: string[]) => void
}

const TONES = [
  { id: 'professional', label: 'Professional', emoji: '👔' },
  { id: 'casual', label: 'Casual', emoji: '😊' },
  { id: 'luxury', label: 'Luxury', emoji: '✨' },
  { id: 'excited', label: 'Excited', emoji: '🎉' }
]

export function CaptionGenerator({ property, platform, contentType, onCaptionGenerated, onHashtagsGenerated }: CaptionGeneratorProps) {
  const [tone, setTone] = useState('professional')
  const [includeEmojis, setIncludeEmojis] = useState(true)
  const [includeCTA, setIncludeCTA] = useState(true)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHashtags, setLoadingHashtags] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState<number | string | null>(null)

  const generateCaption = async () => {
    setLoading(true)
    try {
      // Convert contentType from dash format (just-listed) to underscore format (just_listed) for API, or default to just_listed
      const apiContentType = contentType ? contentType.replace(/-/g, '_') : 'just_listed'
      
      const res = await fetch('/api/copy/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          platform,
          tone,
          includeEmojis,
          includeCallToAction: includeCTA,
          contentType: apiContentType
        })
      })

      const data = await res.json()

      if (data.error) {
        if (data.upgrade) {
          alert('You\'ve reached your caption limit. Please upgrade your plan.')
        } else {
          alert(data.error)
        }
        return
      }

      setCaption(data.caption)
      setRemaining(data.captionsRemaining)
      onCaptionGenerated?.(data.caption)
    } catch (error) {
      console.error('Failed to generate caption:', error)
      alert('Failed to generate caption. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateHashtags = async () => {
    setLoadingHashtags(true)
    try {
      const res = await fetch('/api/copy/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          platform,
          count: 20
        })
      })

      const data = await res.json()

      if (data.error) {
        if (data.upgrade) {
          alert('You\'ve reached your generation limit. Please upgrade your plan.')
        } else {
          alert(data.error)
        }
        return
      }

      setHashtags(data.hashtags)
      setRemaining(data.generationsRemaining)
      onHashtagsGenerated?.(data.hashtags)
    } catch (error) {
      console.error('Failed to generate hashtags:', error)
      alert('Failed to generate hashtags. Please try again.')
    } finally {
      setLoadingHashtags(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Tone Selector */}
      <div className="space-y-2">
        <Label>Tone</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={`
                px-3 py-2 rounded-lg border text-sm font-medium transition-all
                ${tone === t.id
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30'
                }
              `}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeEmojis}
            onChange={(e) => setIncludeEmojis(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37]"
          />
          <span className="text-sm text-white/80">Include emojis</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeCTA}
            onChange={(e) => setIncludeCTA(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37]"
          />
          <span className="text-sm text-white/80">Include call-to-action</span>
        </label>
      </div>

      {/* Generate Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={generateCaption}
          disabled={loading}
          className="bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-semibold"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Caption
        </Button>
        
        <Button
          onClick={generateHashtags}
          disabled={loadingHashtags}
          variant="outline"
          className="border-white/20"
        >
          {loadingHashtags ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Hash className="w-4 h-4 mr-2" />
          )}
          Generate Hashtags
        </Button>
      </div>

      {/* Remaining indicator */}
      {remaining !== null && (
        <p className="text-sm text-white/50">
          {remaining === 'unlimited' ? '∞ generations remaining' : `${remaining} generations remaining this month`}
        </p>
      )}

      {/* Generated Caption */}
      {caption && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Generated Caption</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={generateCaption}
                disabled={loading}
                className="text-white/60 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(caption)}
                className="text-white/60 hover:text-white"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <p className="text-white/90 whitespace-pre-wrap">{caption}</p>
          </div>
        </div>
      )}

      {/* Generated Hashtags */}
      {hashtags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Generated Hashtags</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(hashtags.join(' '))}
              className="text-white/60 hover:text-white"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/10 p-4">
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, i) => (
                <span key={i} className="text-[#D4AF37] text-sm">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
