'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Video, Download, Loader2, Clock, Sparkles, Check,
  Music, Instagram, Facebook, Linkedin, Calendar, ExternalLink,
  CheckCircle, Smartphone, Square, RectangleHorizontal,
  Mic, RefreshCw, ChevronUp, ChevronDown
} from 'lucide-react'
/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/client'
import { trackEvent, SnapREvents } from '@/lib/analytics'

// ============================================
// TYPES & CONSTANTS
// ============================================

interface Photo { id: string; url: string; selected: boolean }
type AspectRatio = '16:9' | '1:1' | '9:16'
type VoiceId = 'professional-male' | 'professional-female' | 'luxury-male' | 'luxury-female' | 'friendly-male' | 'friendly-female'
type ScriptStyle = 'professional' | 'luxury' | 'friendly' | 'firstTimeBuyer'

type RenderStatus = 'idle' | 'triggering' | 'rendering' | 'completed' | 'failed'
type VideoTemplate = 'property-showcase' | 'just-listed' | 'open-house' | 'price-drop' | 'sold'

const VIDEO_TEMPLATES: Record<VideoTemplate, { name: string; desc: string; duration: string }> = {
  'property-showcase': { name: 'Showcase', desc: 'Cinematic slideshow with crossfades', duration: '~4.5s/photo' },
  'just-listed': { name: 'Just Listed', desc: 'Intro card + slide transitions + features', duration: '~5s/photo' },
  'open-house': { name: 'Open House', desc: 'Urgency pacing with event date badge', duration: '~3.5s/photo' },
  'price-drop': { name: 'Price Drop', desc: 'Price reduced badge with urgency pacing', duration: '~3.5s/photo' },
  'sold': { name: 'Sold', desc: 'Celebration styling with social proof', duration: '~4.5s/photo' },
}

interface ListingData {
  title: string | null
  address: string | null
  city: string | null
  state: string | null
  description: string | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  photos: Array<{
    id: string
    raw_url: string | null
    processed_url: string | null
    display_order: number | null
  }>
}

const ASPECT_RATIOS: Record<AspectRatio, { width: number; height: number; label: string; icon: typeof RectangleHorizontal; platform: string }> = {
  '9:16': { width: 1080, height: 1920, label: 'Vertical', icon: Smartphone, platform: 'Reels/TikTok' },
  '1:1': { width: 1080, height: 1080, label: 'Square', icon: Square, platform: 'Instagram Feed' },
  '16:9': { width: 1920, height: 1080, label: 'Landscape', icon: RectangleHorizontal, platform: 'Facebook/YouTube' },
}

const VOICE_OPTIONS: Record<VoiceId, { name: string; desc: string; emoji: string }> = {
  'professional-male': { name: 'James', desc: 'Professional Male', emoji: '👔' },
  'professional-female': { name: 'Sarah', desc: 'Professional Female', emoji: '👔' },
  'luxury-male': { name: 'Richard', desc: 'Luxury Male', emoji: '✨' },
  'luxury-female': { name: 'Victoria', desc: 'Luxury Female', emoji: '✨' },
  'friendly-male': { name: 'Mike', desc: 'Friendly Male', emoji: '😊' },
  'friendly-female': { name: 'Emma', desc: 'Friendly Female', emoji: '😊' },
}

const SCRIPT_STYLES: Record<ScriptStyle, { name: string; desc: string; emoji: string }> = {
  'professional': { name: 'Professional', desc: 'Business-like tone', emoji: '👔' },
  'luxury': { name: 'Luxury', desc: 'Upscale & exclusive', emoji: '✨' },
  'friendly': { name: 'Friendly', desc: 'Warm & welcoming', emoji: '😊' },
  'firstTimeBuyer': { name: 'First-Time', desc: 'Helpful & informative', emoji: '🏠' },
}

const MUSIC_TRACKS = [
  { id: 'none', name: 'No Music', emoji: '🔇' },
  { id: 'upbeat', name: 'Upbeat', emoji: '🎵', url: '/music/upbeat.mp3' },
  { id: 'elegant', name: 'Elegant', emoji: '🎻', url: '/music/elegant.mp3' },
  { id: 'cinematic', name: 'Cinematic', emoji: '🎬', url: '/music/cinematic.mp3' },
  { id: 'ambient', name: 'Ambient', emoji: '🌊', url: '/music/ambient.mp3' },
  { id: 'corporate', name: 'Corporate', emoji: '💼', url: '/music/corporate.mp3' },
]

const POLL_INTERVAL_MS = 3000

// ============================================
// MAIN COMPONENT
// ============================================

export default function VideoCreatorClient() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')

  // Core state
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [listingTitle, setListingTitle] = useState('')
  const [listingPrice, setListingPrice] = useState<number | null>(null)
  const [listingData, setListingData] = useState<ListingData | null>(null)

  // Video settings
  const [template, setTemplate] = useState<VideoTemplate>('property-showcase')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [openHouseDate, setOpenHouseDate] = useState('')
  const [previousPrice, setPreviousPrice] = useState('')
  const [daysOnMarket, setDaysOnMarket] = useState('')

  // Audio settings
  const [enableVoiceover, setEnableVoiceover] = useState(false)
  const [voiceId, setVoiceId] = useState<VoiceId>('professional-female')
  const [scriptStyle, setScriptStyle] = useState<ScriptStyle>('professional')
  const [script, setScript] = useState('')
  const [generatingScript, setGeneratingScript] = useState(false)
  const [generatingVoiceover, setGeneratingVoiceover] = useState(false)
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null)

  const [enableMusic, setEnableMusic] = useState(false)
  const [selectedMusic, setSelectedMusic] = useState('none')
  const [voiceoverVolume, setVoiceoverVolume] = useState(100)
  const [musicVolume, setMusicVolume] = useState(30)

  // Render state (Lambda-based)
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle')
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  // UI state
  const [currentPreview, setCurrentPreview] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [addingToCalendar, setAddingToCalendar] = useState(false)
  const [addedToCalendar, setAddedToCalendar] = useState(false)
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video')

  // Refs
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (pollingRef.current) clearTimeout(pollingRef.current)
      if (previewIntervalRef.current) clearInterval(previewIntervalRef.current)
    }
  }, [])

  // ============================================
  // INITIALIZATION
  // ============================================

  // Load photos
  useEffect(() => { if (listingId) loadPhotos(listingId) }, [listingId])

  // Check for existing video from marketing pipeline
  useEffect(() => {
    if (!listingId || videoUrl) return
    const checkExistingVideo = async () => {
      try {
        const res = await fetch(`/api/marketing/status?listingId=${listingId}`)
        if (!res.ok) return
        const data = await res.json()
        const video = data.marketingJob?.video
        if (video?.result?.videoUrl && video?.result?.renderStatus === 'completed') {
          setVideoUrl(video.result.videoUrl)
          setRenderStatus('completed')
          setRenderProgress(100)
        }
      } catch {
        // Silently ignore — marketing video is optional
      }
    }
    checkExistingVideo()
  }, [listingId, videoUrl])

  // Preview cycling
  useEffect(() => {
    const selectedPhotos = photos.filter(p => p.selected)
    if (selectedPhotos.length > 0 && !videoUrl) {
      previewIntervalRef.current = setInterval(() => {
        setCurrentPreview(prev => (prev + 1) % selectedPhotos.length)
      }, 4500) // Match PropertyShowcase 4.5s per photo
    }
    return () => { if (previewIntervalRef.current) clearInterval(previewIntervalRef.current) }
  }, [photos, videoUrl])

  const loadPhotos = async (id: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data: listing } = await supabase
      .from('listings')
      .select('title, address, city, state, description, price, bedrooms, bathrooms, square_feet, photos!photos_listing_id_fkey(id, raw_url, processed_url, status, display_order)')
      .eq('id', id)
      .single()

    if (listing) {
      setListingTitle(listing.address || listing.title || 'Property')
      setListingPrice(listing.price ?? null)
      setListingData(listing as unknown as ListingData)

      const sortedPhotos = (listing.photos || []).sort(
        (a: { display_order: number | null }, b: { display_order: number | null }) =>
          (a.display_order || 0) - (b.display_order || 0)
      )
      const photoUrls = await Promise.all(sortedPhotos.map(async (photo: { id: string; processed_url: string | null; raw_url: string | null }) => {
        const path = photo.processed_url || photo.raw_url
        if (!path) return null
        if (path.startsWith('http')) return { id: photo.id, url: path, selected: true }
        const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
        return data?.signedUrl ? { id: photo.id, url: data.signedUrl, selected: true } : null
      }))
      setPhotos(photoUrls.filter(Boolean) as Photo[])
    }
    setLoading(false)
  }

  // ============================================
  // VOICEOVER FUNCTIONS
  // ============================================

  const selectedPhotos = photos.filter(p => p.selected)

  const generateScript = async () => {
    if (!listingData) return
    setGeneratingScript(true)

    try {
      const res = await fetch('/api/video/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-script',
          propertyDetails: {
            address: listingData.address,
            neighborhood: listingData.city,
            description: listingData.description,
            price: listingData.price?.toString() ?? undefined,
            bedrooms: listingData.bedrooms ?? undefined,
            bathrooms: listingData.bathrooms ?? undefined,
            sqft: listingData.square_feet ?? undefined,
          },
          style: scriptStyle,
          duration: selectedPhotos.length * 4.5,
        })
      })

      const data = await res.json()
      if (data.script) {
        setScript(data.script)
      } else if (data.error) {
        alert('Failed to generate script: ' + data.error)
      }
    } catch {
      // Fallback script
      const fallbackScript = `Welcome to ${listingData.address || 'this beautiful property'}. This stunning home offers exceptional living space. Contact us today to schedule your private showing.`
      setScript(fallbackScript)
    }
    setGeneratingScript(false)
  }

  const generateVoiceover = async () => {
    if (!script || !listingId) {
      alert('Please generate or enter a script first')
      return
    }
    setGeneratingVoiceover(true)

    try {
      // Step 1: Generate audio (returns base64)
      const res = await fetch('/api/video/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-audio',
          script,
          voiceId,
        })
      })

      const data = await res.json()
      if (data.audioBase64) {
        // Step 2: Upload to storage and get signed URL
        const uploadRes = await fetch('/api/video/voiceover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload-audio',
            audioBase64: data.audioBase64,
            listingId,
          })
        })

        const uploadData = await uploadRes.json()
        if (uploadData.voiceoverUrl) {
          setVoiceoverUrl(uploadData.voiceoverUrl)
        } else {
          alert('Failed to upload voiceover: ' + (uploadData.error || 'Unknown error'))
        }
      } else if (data.error) {
        alert('Failed to generate voiceover: ' + data.error)
      }
    } catch {
      alert('Failed to generate voiceover. Please try again.')
    }
    setGeneratingVoiceover(false)
  }

  // ============================================
  // VIDEO GENERATION (Lambda-based)
  // ============================================

  const pollRenderStatus = useCallback(async (id: string) => {
    if (!isMountedRef.current) return

    try {
      const res = await fetch(`/api/video/status?renderId=${encodeURIComponent(id)}`, {
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        throw new Error(`Status check failed: ${res.status}`)
      }

      const data = await res.json()

      if (!isMountedRef.current) return

      if (data.status === 'completed') {
        setRenderStatus('completed')
        setRenderProgress(100)
        setVideoUrl(data.videoUrl)
        setShowShareModal(true)
        trackEvent(SnapREvents.VIDEO_CREATED)
        return // Stop polling
      }

      if (data.status === 'failed') {
        setRenderStatus('failed')
        setRenderError(data.error || 'Render failed')
        return // Stop polling
      }

      // Still rendering — update progress and poll again
      setRenderProgress(Math.round((data.progress ?? 0) * 100))
      pollingRef.current = setTimeout(() => pollRenderStatus(id), POLL_INTERVAL_MS)
    } catch (error: unknown) {
      if (!isMountedRef.current) return
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[VideoCreator] Poll error:', message)
      // Retry on transient errors
      pollingRef.current = setTimeout(() => pollRenderStatus(id), POLL_INTERVAL_MS * 2)
    }
  }, [])

  const generateVideo = async () => {
    if (!listingId || selectedPhotos.length === 0) return

    setRenderStatus('triggering')
    setRenderProgress(0)
    setRenderError(null)
    setVideoUrl(null)
    // renderId cleared

    try {
      const parsedPreviousPrice = previousPrice ? parseFloat(previousPrice) : undefined
      const parsedDaysOnMarket = daysOnMarket ? parseInt(daysOnMarket, 10) : undefined

      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          aspectRatio,
          template,
          ...(template === 'open-house' && openHouseDate ? { openHouseDate } : {}),
          ...(template === 'price-drop' && parsedPreviousPrice ? { previousPrice: parsedPreviousPrice } : {}),
          ...(template === 'sold' && parsedDaysOnMarket ? { daysOnMarket: parsedDaysOnMarket } : {}),
          ...((enableMusic || voiceoverUrl) ? {
            audio: {
              musicTrack: enableMusic && selectedMusic !== 'none' ? selectedMusic : undefined,
              musicVolume: enableMusic ? musicVolume : undefined,
              voiceoverUrl: voiceoverUrl ?? undefined,
              voiceoverVolume: enableVoiceover ? voiceoverVolume : undefined,
            }
          } : {}),
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok) {
        const data = await res.json()
        // Log full error details for debugging
        if (data.stack) {
          console.error('[VideoCreator] Server error stack:', data.stack)
        }
        if (data.errorName) {
          console.error('[VideoCreator] Error type:', data.errorName)
        }
        throw new Error(data.error || `Request failed: ${res.status}`)
      }

      const data = await res.json()
      setRenderStatus('rendering')

      // Start polling
      pollingRef.current = setTimeout(() => pollRenderStatus(data.renderId), POLL_INTERVAL_MS)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to trigger render'
      setRenderStatus('failed')
      setRenderError(message)
    }
  }

  const regenerateVideo = () => {
    if (pollingRef.current) clearTimeout(pollingRef.current)
    setRenderStatus('idle')
    setRenderProgress(0)
    setRenderError(null)
    setVideoUrl(null)
    // renderId cleared
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const togglePhoto = (id: string) => setPhotos(photos.map(p => p.id === id ? { ...p, selected: !p.selected } : p))

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...photos]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return
    ;[newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]]
    setPhotos(newPhotos)
  }

  const downloadVideo = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${listingTitle.replace(/[^a-z0-9]/gi, '_')}_${aspectRatio.replace(':', 'x')}.mp4`
    a.click()
  }

  const addToCalendar = async () => {
    if (!videoUrl || !listingId) return
    setAddingToCalendar(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: calendarError } = await supabase
        .from('content_calendar')
        .insert({
          user_id: user.id,
          listing_id: listingId,
          content_type: 'video',
          title: `Video: ${listingTitle}`,
          content_url: videoUrl,
          platforms: ['instagram', 'facebook', 'tiktok'],
          status: 'draft',
          scheduled_for: null
        })

      if (calendarError) throw calendarError

      setAddedToCalendar(true)
      setTimeout(() => setAddedToCalendar(false), 3000)
    } catch (error: unknown) {
      console.error('Error adding to calendar:', error)
      alert('Failed to add to calendar. Please try again.')
    }

    setAddingToCalendar(false)
  }

  const handlePlatformUpload = (platform: 'instagram' | 'facebook' | 'linkedin') => {
    downloadVideo()
    const urls = {
      instagram: 'https://www.instagram.com/',
      facebook: 'https://business.facebook.com/latest/composer',
      linkedin: 'https://www.linkedin.com/feed/'
    }
    setTimeout(() => { window.open(urls[platform], '_blank') }, 500)
  }

  const getPreviewAspectClass = () => {
    switch(aspectRatio) {
      case '16:9': return 'aspect-video'
      case '1:1': return 'aspect-square'
      case '9:16': return 'aspect-[9/16]'
    }
  }

  const isGenerating = renderStatus === 'triggering' || renderStatus === 'rendering'

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4">
        <Link href="/dashboard/content-studio" className="flex items-center gap-2 hover:opacity-80">
          <ArrowLeft className="w-4 h-4 text-white/50" />
          <span className="text-white/50 text-sm">Back</span>
        </Link>
        <div className="h-5 w-px bg-white/10 mx-4" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <span className="font-bold">Video Creator</span>
          <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Lambda</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {videoUrl && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-lg font-semibold hover:bg-pink-600"
            >
              <ExternalLink className="w-4 h-4" />
              Share Video
            </button>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center bg-[#080808] p-8">
          <div className={`relative w-full max-w-[600px] ${getPreviewAspectClass()} bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800`}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
              </div>
            ) : videoUrl ? (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
                poster={selectedPhotos[0]?.url}
              />
            ) : isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-16 h-16 animate-spin text-pink-500" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {renderStatus === 'triggering' ? 'Starting...' : `${renderProgress}%`}
                  </div>
                  <div className="text-sm text-white/50 mt-1">
                    {renderStatus === 'triggering'
                      ? 'Triggering Lambda render...'
                      : 'Rendering your video...'}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            ) : renderStatus === 'failed' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-3xl">!</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400">Render Failed</div>
                  <div className="text-sm text-white/50 mt-1">{renderError}</div>
                </div>
                <button
                  onClick={regenerateVideo}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            ) : selectedPhotos.length > 0 ? (
              <>
                <img
                  src={selectedPhotos[currentPreview]?.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <div className="text-white font-semibold text-xl mb-2">
                    {listingTitle}
                  </div>
                  {listingPrice && (
                    <div className="text-[#D4A017] font-bold text-3xl">
                      ${listingPrice.toLocaleString()}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/30">
                Select photos to preview
              </div>
            )}
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-[420px] bg-[#111] border-l border-white/5 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === 'video'
                  ? 'text-pink-500 border-b-2 border-pink-500'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4 inline mr-2" />
              Video
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === 'audio'
                  ? 'text-pink-500 border-b-2 border-pink-500'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4 inline mr-2" />
              Audio
              {(enableVoiceover || enableMusic) && (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'video' ? (
              <>
                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <RectangleHorizontal className="w-4 h-4" />
                    <span className="font-medium">Aspect Ratio</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratio) => {
                      const config = ASPECT_RATIOS[ratio]
                      const Icon = config.icon
                      return (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          disabled={isGenerating}
                          className={`p-3 rounded-lg border transition-all ${
                            aspectRatio === ratio
                              ? 'bg-pink-500/20 border-pink-500 text-white'
                              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Icon className="w-4 h-4" />
                            <span className="font-bold text-sm">{ratio}</span>
                          </div>
                          <div className="text-xs opacity-70 text-center">{config.platform}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Template Selector */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">Template</span>
                  </div>
                  <div className="space-y-2">
                    {(Object.keys(VIDEO_TEMPLATES) as VideoTemplate[]).map((tmpl) => {
                      const config = VIDEO_TEMPLATES[tmpl]
                      return (
                        <button
                          key={tmpl}
                          onClick={() => setTemplate(tmpl)}
                          disabled={isGenerating}
                          className={`w-full p-3 rounded-lg border transition-all text-left ${
                            template === tmpl
                              ? 'bg-[#D4A017]/15 border-[#D4A017] text-white'
                              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="font-bold text-sm">{config.name}</div>
                          <div className="text-xs opacity-70">{config.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Open House Date (conditional) */}
                {template === 'open-house' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Event Date & Time</span>
                    </div>
                    <input
                      type="text"
                      value={openHouseDate}
                      onChange={(e) => setOpenHouseDate(e.target.value)}
                      placeholder="e.g. Saturday, March 1st · 1-4 PM"
                      disabled={isGenerating}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4A017] disabled:opacity-50"
                    />
                  </div>
                )}

                {/* Price Drop: Previous Price (conditional) */}
                {template === 'price-drop' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <span className="font-medium">Original Price</span>
                    </div>
                    <input
                      type="number"
                      value={previousPrice}
                      onChange={(e) => setPreviousPrice(e.target.value)}
                      placeholder="e.g. 2500000"
                      disabled={isGenerating}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4A017] disabled:opacity-50"
                    />
                    <p className="text-xs text-white/40">Enter the original listing price before the reduction</p>
                  </div>
                )}

                {/* Sold: Days on Market (conditional) */}
                {template === 'sold' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <span className="font-medium">Days on Market</span>
                    </div>
                    <input
                      type="number"
                      value={daysOnMarket}
                      onChange={(e) => setDaysOnMarket(e.target.value)}
                      placeholder="e.g. 12"
                      disabled={isGenerating}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4A017] disabled:opacity-50"
                    />
                    <p className="text-xs text-white/40">Optional — shows social proof in the video</p>
                  </div>
                )}

                {/* Video Info */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Clock className="w-4 h-4 text-pink-400" />
                    <span className="font-medium">{VIDEO_TEMPLATES[template].name}</span>
                  </div>
                  <div className="text-xs text-white/40 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{VIDEO_TEMPLATES[template].duration} · {selectedPhotos.length} photos</span>
                    </div>
                    <div>Ken Burns zoom/pan effect</div>
                    <div>Closing card with property details</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* AUDIO TAB */}

                {/* Voiceover Section */}
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <span className="font-medium">AI Voiceover</span>
                        <p className="text-xs text-white/50">Narrated property tour</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableVoiceover}
                      onChange={(e) => setEnableVoiceover(e.target.checked)}
                      className="w-5 h-5 accent-purple-500"
                    />
                  </label>

                  {enableVoiceover && (
                    <div className="space-y-4 pl-2 border-l-2 border-purple-500/30 ml-4">
                      {/* Voice Selection */}
                      <div className="space-y-2">
                        <label className="text-xs text-white/50 uppercase">Voice</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(Object.keys(VOICE_OPTIONS) as VoiceId[]).map(id => {
                            const voice = VOICE_OPTIONS[id]
                            return (
                              <button
                                key={id}
                                onClick={() => setVoiceId(id)}
                                className={`p-2 rounded-lg text-xs transition ${
                                  voiceId === id
                                    ? 'bg-purple-500/30 border border-purple-500 text-white'
                                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                              >
                                {voice.emoji} {voice.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Script Style */}
                      <div className="space-y-2">
                        <label className="text-xs text-white/50 uppercase">Style</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(Object.keys(SCRIPT_STYLES) as ScriptStyle[]).map(id => {
                            const style = SCRIPT_STYLES[id]
                            return (
                              <button
                                key={id}
                                onClick={() => setScriptStyle(id)}
                                className={`p-2 rounded-lg text-xs transition ${
                                  scriptStyle === id
                                    ? 'bg-purple-500/30 border border-purple-500 text-white'
                                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                              >
                                {style.emoji} {style.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Script */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-white/50 uppercase">Script</label>
                          <button
                            onClick={generateScript}
                            disabled={generatingScript}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                          >
                            {generatingScript ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            Generate
                          </button>
                        </div>
                        <textarea
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                          placeholder="Click 'Generate' or write your own script..."
                          className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-sm resize-none focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      {/* Generate Voiceover Button */}
                      <button
                        onClick={generateVoiceover}
                        disabled={generatingVoiceover || !script}
                        className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/30 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        {generatingVoiceover ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : voiceoverUrl ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            Voiceover Ready
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Voiceover
                          </>
                        )}
                      </button>

                      {/* Voiceover preview + volume */}
                      {voiceoverUrl && (
                        <div className="space-y-2">
                          <audio src={voiceoverUrl} controls className="w-full h-8" />
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-white/50">Voiceover Volume</label>
                            <span className="text-xs text-white/70">{voiceoverVolume}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={voiceoverVolume}
                            onChange={(e) => setVoiceoverVolume(parseInt(e.target.value))}
                            className="w-full accent-purple-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Music Section */}
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <Music className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <span className="font-medium">Background Music</span>
                        <p className="text-xs text-white/50">Royalty-free tracks</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableMusic}
                      onChange={(e) => setEnableMusic(e.target.checked)}
                      className="w-5 h-5 accent-pink-500"
                    />
                  </label>

                  {enableMusic && (
                    <div className="space-y-4 pl-2 border-l-2 border-pink-500/30 ml-4">
                      {/* Track Selection */}
                      <div className="space-y-2">
                        <label className="text-xs text-white/50 uppercase">Track</label>
                        <div className="grid grid-cols-2 gap-2">
                          {MUSIC_TRACKS.filter(t => t.id !== 'none').map(track => (
                            <button
                              key={track.id}
                              onClick={() => setSelectedMusic(track.id)}
                              className={`p-3 rounded-lg text-sm transition ${
                                selectedMusic === track.id
                                  ? 'bg-pink-500/30 border border-pink-500 text-white'
                                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                              }`}
                            >
                              <span className="text-lg">{track.emoji}</span>
                              <span className="ml-2">{track.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Music Volume */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-white/50">Music Volume</label>
                          <span className="text-xs text-white/70">{musicVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                          className="w-full accent-pink-500"
                        />
                        <p className="text-xs text-white/40">
                          {enableVoiceover ? 'Music will duck under voiceover' : 'Background music level'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio status indicator */}
                {(enableMusic || voiceoverUrl) && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-200/70">
                      {enableMusic && voiceoverUrl ? 'Music + voiceover will be mixed into the video (music ducks under narration).' :
                       enableMusic ? 'Background music will be included in the video.' :
                       'Voiceover narration will be included in the video.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Generate Button (always visible) */}
            <button
              onClick={videoUrl ? regenerateVideo : generateVideo}
              disabled={isGenerating || selectedPhotos.length === 0}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
            >
              {isGenerating ? (
                <>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>
                      {renderStatus === 'triggering' ? 'Starting...' : `Rendering ${renderProgress}%`}
                    </span>
                  </div>
                  <span className="text-xs opacity-70">Cloud rendering via AWS Lambda</span>
                </>
              ) : videoUrl ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Regenerate Video</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>Generate Video</span>
                  <span className="text-xs opacity-70">{selectedPhotos.length} photos - {aspectRatio}</span>
                </>
              )}
            </button>

            {videoUrl && (
              <div className="space-y-2">
                <button
                  onClick={downloadVideo}
                  className="w-full py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download MP4
                </button>
                <button
                  onClick={addToCalendar}
                  disabled={addingToCalendar}
                  className="w-full py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 flex items-center justify-center gap-2"
                >
                  {addingToCalendar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : addedToCalendar ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  {addedToCalendar ? 'Added!' : 'Add to Calendar'}
                </button>
              </div>
            )}

            {/* Photo Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="font-medium">Photos</span>
                <span className="ml-auto text-pink-500 font-bold">
                  {selectedPhotos.length}/{photos.length}
                </span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`flex items-center gap-2 p-1.5 rounded-lg transition ${
                      photo.selected
                        ? 'bg-white/5'
                        : 'opacity-50'
                    }`}
                  >
                    <div
                      onClick={() => togglePhoto(photo.id)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer border-2 transition flex-shrink-0 ${
                        photo.selected
                          ? 'border-pink-500'
                          : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      {photo.selected && (
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-pink-500 rounded-full flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white/40 flex-1 truncate">Photo {index + 1}</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => movePhoto(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => movePhoto(index, 'down')}
                        disabled={index === photos.length - 1}
                        className="p-0.5 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && videoUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Share video">
          <div className="bg-[#111] rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Video Ready!</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-white/50 hover:text-white text-2xl"
              >
                x
              </button>
            </div>
            <p className="text-white/70 text-sm">
              Your {aspectRatio} {VIDEO_TEMPLATES[template].name} video has been rendered.
            </p>
            <div className="space-y-2">
              <button
                onClick={downloadVideo}
                className="w-full py-3 bg-pink-500 rounded-lg font-semibold hover:bg-pink-600 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download MP4
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePlatformUpload('instagram')}
                  className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30 hover:border-purple-500/60 transition-all"
                >
                  <Instagram className="w-6 h-6" />
                  <span className="text-xs">Instagram</span>
                </button>
                <button
                  onClick={() => handlePlatformUpload('facebook')}
                  className="flex flex-col items-center gap-2 p-3 bg-blue-600/20 rounded-lg border border-blue-500/30 hover:border-blue-500/60 transition-all"
                >
                  <Facebook className="w-6 h-6" />
                  <span className="text-xs">Facebook</span>
                </button>
                <button
                  onClick={() => handlePlatformUpload('linkedin')}
                  className="flex flex-col items-center gap-2 p-3 bg-[#0A66C2]/20 rounded-lg border border-[#0A66C2]/30 hover:border-[#0A66C2]/60 transition-all"
                >
                  <Linkedin className="w-6 h-6" />
                  <span className="text-xs">LinkedIn</span>
                </button>
              </div>

              <button
                onClick={addToCalendar}
                disabled={addingToCalendar}
                className="w-full py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 flex items-center justify-center gap-2"
              >
                {addingToCalendar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : addedToCalendar ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                {addedToCalendar ? 'Added!' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
