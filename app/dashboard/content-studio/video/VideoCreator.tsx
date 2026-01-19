'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Video, Download, Loader2, Clock, Sparkles, Check, 
  Music, Type, Instagram, Facebook, Linkedin, Calendar, ExternalLink, 
  CheckCircle, Copy, Smartphone, Square, RectangleHorizontal, 
  RectangleVertical, Mic, Volume2, VolumeX, RefreshCw, Play, Pause
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, SnapREvents } from '@/lib/analytics'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

// ============================================
// TYPES & CONSTANTS
// ============================================

interface Photo { id: string; url: string; selected: boolean }
type Transition = 'fade' | 'slide' | 'zoom' | 'none'
type AspectRatio = '16:9' | '1:1' | '4:5' | '9:16'
type VoiceId = 'professional-male' | 'professional-female' | 'luxury-male' | 'luxury-female' | 'friendly-male' | 'friendly-female'
type ScriptStyle = 'professional' | 'luxury' | 'friendly' | 'firstTimeBuyer'

const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080, label: 'Landscape', icon: RectangleHorizontal, platform: 'Facebook/YouTube' },
  '1:1': { width: 1080, height: 1080, label: 'Square', icon: Square, platform: 'Instagram Feed' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait', icon: RectangleVertical, platform: 'Instagram Feed' },
  '9:16': { width: 1080, height: 1920, label: 'Vertical', icon: Smartphone, platform: 'Reels/TikTok' }
}

const VOICE_OPTIONS = {
  'professional-male': { name: 'James', desc: 'Professional Male', emoji: '👔' },
  'professional-female': { name: 'Sarah', desc: 'Professional Female', emoji: '👔' },
  'luxury-male': { name: 'Richard', desc: 'Luxury Male', emoji: '✨' },
  'luxury-female': { name: 'Victoria', desc: 'Luxury Female', emoji: '✨' },
  'friendly-male': { name: 'Mike', desc: 'Friendly Male', emoji: '😊' },
  'friendly-female': { name: 'Emma', desc: 'Friendly Female', emoji: '😊' },
}

const SCRIPT_STYLES = {
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
  const [listingLocation, setListingLocation] = useState('')
  const [listingData, setListingData] = useState<any>(null)
  
  // Video settings
  const [duration, setDuration] = useState(3)
  const [transition, setTransition] = useState<Transition>('fade')
  const [showTitle, setShowTitle] = useState(true)
  const [showPrice, setShowPrice] = useState(true)
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('contain')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  
  // Audio settings
  const [enableVoiceover, setEnableVoiceover] = useState(false)
  const [voiceId, setVoiceId] = useState<VoiceId>('professional-female')
  const [scriptStyle, setScriptStyle] = useState<ScriptStyle>('professional')
  const [script, setScript] = useState('')
  const [generatingScript, setGeneratingScript] = useState(false)
  const [generatingVoiceover, setGeneratingVoiceover] = useState(false)
  const [voiceoverAudio, setVoiceoverAudio] = useState<Blob | null>(null)
  const [voiceoverDuration, setVoiceoverDuration] = useState<number>(0)
  
  const [enableMusic, setEnableMusic] = useState(false)
  const [selectedMusic, setSelectedMusic] = useState('none')
  const [voiceoverVolume, setVoiceoverVolume] = useState(100)
  const [musicVolume, setMusicVolume] = useState(30)
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  
  // UI state
  const [currentPreview, setCurrentPreview] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [addingToCalendar, setAddingToCalendar] = useState(false)
  const [addedToCalendar, setAddedToCalendar] = useState(false)
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video')
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)

  // ============================================
  // INITIALIZATION
  // ============================================

  // Load FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg()
        ffmpegRef.current = ffmpeg
        
        ffmpeg.on('progress', ({ progress }) => {
          setProgress(Math.round(progress * 100))
        })
        
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        })
        setFfmpegLoaded(true)
        console.log('FFmpeg loaded successfully')
      } catch (e) { 
        console.error('FFmpeg load error:', e) 
      }
    }
    loadFFmpeg()
  }, [])

  // Load photos
  useEffect(() => { if (listingId) loadPhotos(listingId) }, [listingId])

  // Preview cycling
  useEffect(() => {
    const selectedPhotos = photos.filter(p => p.selected)
    if (selectedPhotos.length > 0 && !videoUrl) {
      previewIntervalRef.current = setInterval(() => {
        setCurrentPreview(prev => (prev + 1) % selectedPhotos.length)
      }, duration * 1000)
    }
    return () => { if (previewIntervalRef.current) clearInterval(previewIntervalRef.current) }
  }, [photos, duration, videoUrl])

  const loadPhotos = async (id: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data: listing } = await supabase
      .from('listings')
      .select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status, display_order)')
      .eq('id', id)
      .single()
    
    if (listing) {
      setListingTitle(listing.title || listing.address || 'Property')
      setListingPrice(listing.price)
      setListingLocation([listing.city, listing.state].filter(Boolean).join(', '))
      setListingData(listing)
      
      const sortedPhotos = (listing.photos || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      const photoUrls = await Promise.all(sortedPhotos.map(async (photo: any) => {
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
            price: listingData.price ? `$${listingData.price.toLocaleString()}` : undefined,
            bedrooms: listingData.bedrooms,
            bathrooms: listingData.bathrooms,
            sqft: listingData.square_feet,
            neighborhood: listingData.city,
            features: listingData.features || [],
          },
          style: scriptStyle,
          duration: selectedPhotos.length * duration,
        })
      })
      
      const data = await res.json()
      if (data.script) {
        setScript(data.script)
      } else if (data.error) {
        alert('Failed to generate script: ' + data.error)
      }
    } catch (e) {
      console.error('Script generation error:', e)
      // Fallback script
      const fallbackScript = `Welcome to ${listingData.address || 'this beautiful property'}. ${
        listingData.price ? `Priced at $${listingData.price.toLocaleString()}, this` : 'This'
      } stunning ${listingData.bedrooms || ''}${listingData.bedrooms ? ' bedroom' : ''} home offers ${
        listingData.square_feet ? `${listingData.square_feet.toLocaleString()} square feet of` : ''
      } exceptional living space. Located in ${listingData.city || 'a prime location'}, this property is the perfect place to call home. Contact us today to schedule your private showing.`
      setScript(fallbackScript)
    }
    setGeneratingScript(false)
  }

  const generateVoiceover = async () => {
    if (!script) {
      alert('Please generate or enter a script first')
      return
    }
    setGeneratingVoiceover(true)
    
    try {
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
      if (data.audioUrl) {
        // Convert base64 to blob
        const audioData = data.audioUrl.split(',')[1]
        const audioBlob = base64ToBlob(audioData, 'audio/mpeg')
        setVoiceoverAudio(audioBlob)
        setVoiceoverDuration(data.duration || Math.ceil(script.split(/\s+/).length / 2.2)) // ~130 words per minute
        
        // Auto-adjust video duration if voiceover is longer
        const totalVideoDuration = selectedPhotos.length * duration
        if (data.duration && data.duration > totalVideoDuration) {
          const newDuration = Math.ceil(data.duration / selectedPhotos.length * 10) / 10
          setDuration(Math.min(newDuration, 5))
        }
      } else if (data.error) {
        alert('Failed to generate voiceover: ' + data.error)
      }
    } catch (e) {
      console.error('Voiceover generation error:', e)
      alert('Failed to generate voiceover. Please try again.')
    }
    setGeneratingVoiceover(false)
  }

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // ============================================
  // VIDEO GENERATION
  // ============================================

  const selectedPhotos = photos.filter(p => p.selected)
  const totalDuration = selectedPhotos.length * duration

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const generateVideo = async () => {
    if (selectedPhotos.length === 0) return
    setGenerating(true)
    setProgress(0)
    setProgressMessage('Preparing...')
    setVideoUrl(null)
    setVideoBlob(null)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = ASPECT_RATIOS[aspectRatio]
    canvas.width = width
    canvas.height = height

    const fps = 30
    const frameDuration = 1000 / fps
    const framesPerPhoto = duration * fps
    const transitionFrames = Math.floor(fps * 0.5)

    try {
      // Step 1: Generate silent video
      setProgressMessage('Recording frames...')
      const stream = canvas.captureStream(fps)
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp9', 
        videoBitsPerSecond: 5000000 
      })
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      
      const videoPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          resolve(blob)
        }
      })

      mediaRecorder.start()

      const images = await Promise.all(selectedPhotos.map(p => loadImage(p.url)))
      const totalFrames = selectedPhotos.length * framesPerPhoto

      for (let photoIndex = 0; photoIndex < selectedPhotos.length; photoIndex++) {
        const img = images[photoIndex]
        const nextImg = images[(photoIndex + 1) % images.length]

        for (let frame = 0; frame < framesPerPhoto; frame++) {
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          const drawImage = (image: HTMLImageElement, alpha: number = 1, scale: number = 1, offsetX: number = 0) => {
            ctx.save()
            ctx.globalAlpha = alpha
            const imgRatio = image.width / image.height
            const canvasRatio = canvas.width / canvas.height
            let dw, dh, dx, dy

            if (fitMode === 'contain') {
              if (imgRatio > canvasRatio) {
                dw = canvas.width * scale
                dh = dw / imgRatio
              } else {
                dh = canvas.height * scale
                dw = dh * imgRatio
              }
            } else {
              if (imgRatio > canvasRatio) {
                dh = canvas.height * scale
                dw = dh * imgRatio
              } else {
                dw = canvas.width * scale
                dh = dw / imgRatio
              }
            }
            dx = (canvas.width - dw) / 2 + offsetX
            dy = (canvas.height - dh) / 2
            ctx.drawImage(image, dx, dy, dw, dh)
            ctx.restore()
          }

          const isTransition = frame >= framesPerPhoto - transitionFrames && photoIndex < selectedPhotos.length - 1
          const transitionProgress = isTransition ? (frame - (framesPerPhoto - transitionFrames)) / transitionFrames : 0

          if (transition === 'fade' && isTransition) {
            drawImage(img, 1 - transitionProgress)
            drawImage(nextImg, transitionProgress)
          } else if (transition === 'slide' && isTransition) {
            drawImage(img, 1, 1, -canvas.width * transitionProgress)
            drawImage(nextImg, 1, 1, canvas.width * (1 - transitionProgress))
          } else if (transition === 'zoom') {
            const zoomProgress = frame / framesPerPhoto
            const scale = 1 + zoomProgress * 0.1
            drawImage(img, 1, scale)
          } else {
            drawImage(img)
          }

          // Gradient overlay
          const gradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height)
          gradient.addColorStop(0, 'rgba(0,0,0,0)')
          gradient.addColorStop(1, 'rgba(0,0,0,0.8)')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Text overlays
          const isVertical = aspectRatio === '9:16'
          const titleSize = isVertical ? 64 : 48
          const locationSize = isVertical ? 36 : 28
          const priceSize = isVertical ? 72 : 56
          const bottomPadding = isVertical ? 120 : 80

          if (showTitle) {
            ctx.fillStyle = '#fff'
            ctx.font = `bold ${titleSize}px system-ui`
            ctx.textAlign = 'center'
            const title = listingTitle.length > 25 ? listingTitle.substring(0, 25) + '...' : listingTitle
            ctx.fillText(title, canvas.width / 2, canvas.height - (bottomPadding + 160))
          }
          if (listingLocation) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.font = `${locationSize}px system-ui`
            ctx.fillText(listingLocation, canvas.width / 2, canvas.height - (bottomPadding + 90))
          }
          if (showPrice && listingPrice) {
            ctx.fillStyle = '#D4AF37'
            ctx.font = `bold ${priceSize}px system-ui`
            ctx.fillText('$' + listingPrice.toLocaleString(), canvas.width / 2, canvas.height - bottomPadding)
          }

          // Photo counter
          ctx.fillStyle = 'rgba(0,0,0,0.6)'
          ctx.beginPath()
          ctx.roundRect(canvas.width - 120, 40, 80, 40, 20)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = '24px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText((photoIndex + 1) + '/' + selectedPhotos.length, canvas.width - 80, 68)

          const currentFrame = photoIndex * framesPerPhoto + frame
          setProgress(Math.round((currentFrame / totalFrames) * 60))
          await new Promise(r => setTimeout(r, frameDuration / 3))
        }
      }

      mediaRecorder.stop()
      const webmBlob = await videoPromise
      
      // Step 2: Add audio if enabled
      let finalBlob: Blob
      
      if ((enableVoiceover && voiceoverAudio) || (enableMusic && selectedMusic !== 'none')) {
        setProgress(65)
        setProgressMessage('Adding audio...')
        finalBlob = await mergeAudioWithVideo(webmBlob)
      } else {
        finalBlob = new Blob([webmBlob], { type: 'video/mp4' })
      }
      
      setProgress(100)
      setProgressMessage('Done!')
      
      const url = URL.createObjectURL(finalBlob)
      setVideoUrl(url)
      setVideoBlob(finalBlob)
      setShowShareModal(true)
      trackEvent(SnapREvents.VIDEO_CREATED)
    } catch (error) {
      console.error('Video generation error:', error)
      alert('Error generating video. Please try again.')
    }
    setGenerating(false)
    setProgressMessage('')
  }

  const mergeAudioWithVideo = async (videoBlob: Blob): Promise<Blob> => {
    const ffmpeg = ffmpegRef.current
    if (!ffmpeg || !ffmpegLoaded) {
      console.log('FFmpeg not ready, returning video without audio')
      return new Blob([videoBlob], { type: 'video/mp4' })
    }

    try {
      // Write video file
      await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob))
      
      // Build FFmpeg command
      let filterComplex = ''
      let inputs = ['-i', 'input.webm']
      let audioStreams: string[] = []
      let streamIndex = 1
      
      // Add voiceover
      if (enableVoiceover && voiceoverAudio) {
        await ffmpeg.writeFile('voiceover.mp3', await fetchFile(voiceoverAudio))
        inputs.push('-i', 'voiceover.mp3')
        const vol = voiceoverVolume / 100
        audioStreams.push(`[${streamIndex}:a]volume=${vol}[vo]`)
        streamIndex++
      }
      
      // Add background music
      if (enableMusic && selectedMusic !== 'none') {
        const musicTrack = MUSIC_TRACKS.find(m => m.id === selectedMusic)
        if (musicTrack?.url) {
          try {
            const musicResponse = await fetch(musicTrack.url)
            if (musicResponse.ok) {
              const musicBlob = await musicResponse.blob()
              await ffmpeg.writeFile('music.mp3', await fetchFile(musicBlob))
              inputs.push('-i', 'music.mp3')
              const vol = musicVolume / 100
              audioStreams.push(`[${streamIndex}:a]volume=${vol},aloop=loop=-1:size=2e+09[music]`)
              streamIndex++
            }
          } catch (e) {
            console.log('Could not load music track:', e)
          }
        }
      }
      
      // Build filter complex for audio mixing
      if (audioStreams.length > 0) {
        filterComplex = audioStreams.join(';')
        
        if (audioStreams.length === 2) {
          // Mix voiceover and music
          filterComplex += ';[vo][music]amix=inputs=2:duration=first[aout]'
        } else if (enableVoiceover && voiceoverAudio) {
          filterComplex += ';[vo]anull[aout]'
        } else {
          filterComplex += ';[music]anull[aout]'
        }
        
        // Run FFmpeg with audio
        await ffmpeg.exec([
          ...inputs,
          '-filter_complex', filterComplex,
          '-map', '0:v',
          '-map', '[aout]',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          'output.mp4'
        ])
      } else {
        // Just convert to MP4 without audio
        await ffmpeg.exec([
          '-i', 'input.webm',
          '-c:v', 'copy',
          'output.mp4'
        ])
      }
      
      const data = await ffmpeg.readFile('output.mp4')
      const outputBlob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' })
      
      // Cleanup
      try {
        await ffmpeg.deleteFile('input.webm')
        await ffmpeg.deleteFile('output.mp4')
        if (enableVoiceover && voiceoverAudio) await ffmpeg.deleteFile('voiceover.mp3')
        if (enableMusic && selectedMusic !== 'none') await ffmpeg.deleteFile('music.mp3')
      } catch {}
      
      return outputBlob
    } catch (error) {
      console.error('Audio merge error:', error)
      // Return video without audio on error
      return new Blob([videoBlob], { type: 'video/mp4' })
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const togglePhoto = (id: string) => setPhotos(photos.map(p => p.id === id ? { ...p, selected: !p.selected } : p))

  const downloadVideo = () => {
    if (!videoUrl || !videoBlob) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${listingTitle.replace(/[^a-z0-9]/gi, '_')}_${aspectRatio.replace(':', 'x')}.mp4`
    a.click()
  }

  const addToCalendar = async () => {
    if (!videoUrl || !videoBlob || !listingId) return
    setAddingToCalendar(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const ext = videoBlob.type === 'video/mp4' ? 'mp4' : 'webm'
      const fileName = `videos/${user.id}/${listingId}_${Date.now()}.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(fileName, videoBlob, { contentType: videoBlob.type })
      
      if (uploadError) throw uploadError
      
      const { error: calendarError } = await supabase
        .from('content_calendar')
        .insert({
          user_id: user.id,
          listing_id: listingId,
          content_type: 'video',
          title: `Video: ${listingTitle}`,
          content_url: fileName,
          platforms: ['instagram', 'facebook', 'tiktok'],
          status: 'draft',
          scheduled_for: null
        })
      
      if (calendarError) throw calendarError
      
      setAddedToCalendar(true)
      setTimeout(() => setAddedToCalendar(false), 3000)
    } catch (error) {
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
      case '4:5': return 'aspect-[4/5]'
      case '9:16': return 'aspect-[9/16]'
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <canvas ref={canvasRef} className="hidden" />
      
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
          {ffmpegLoaded && (
            <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Ready</span>
          )}
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
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
            ) : selectedPhotos.length > 0 ? (
              <>
                <img 
                  src={selectedPhotos[currentPreview]?.url} 
                  alt="" 
                  className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {showTitle && (
                  <div className="absolute bottom-32 left-0 right-0 text-center text-white font-bold text-3xl">
                    {listingTitle}
                  </div>
                )}
                {listingLocation && (
                  <div className="absolute bottom-20 left-0 right-0 text-center text-white/70 text-xl">
                    {listingLocation}
                  </div>
                )}
                {showPrice && listingPrice && (
                  <div className="absolute bottom-8 left-0 right-0 text-center text-[#D4AF37] font-bold text-4xl">
                    ${listingPrice.toLocaleString()}
                  </div>
                )}
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
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratio) => {
                      const config = ASPECT_RATIOS[ratio]
                      const Icon = config.icon
                      return (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`p-3 rounded-lg border transition-all ${
                            aspectRatio === ratio
                              ? 'bg-pink-500/20 border-pink-500 text-white'
                              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4" />
                            <span className="font-bold text-sm">{ratio}</span>
                          </div>
                          <div className="text-xs opacity-70">{config.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Photo Duration</span>
                    </div>
                    <span className="text-white font-bold">{duration}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="0.5" 
                    value={duration} 
                    onChange={(e) => setDuration(parseFloat(e.target.value))} 
                    className="w-full accent-pink-500" 
                  />
                  <div className="text-xs text-white/30">
                    Total: {totalDuration}s ({selectedPhotos.length} photos)
                  </div>
                </div>

                {/* Transition */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">Transition</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['fade', 'slide', 'zoom', 'none'] as Transition[]).map(t => (
                      <button 
                        key={t} 
                        onClick={() => setTransition(t)} 
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                          transition === t 
                            ? 'bg-pink-500 text-white' 
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Overlays */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Type className="w-4 h-4" />
                    <span className="font-medium">Text Overlays</span>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                      <input 
                        type="checkbox" 
                        checked={showTitle} 
                        onChange={(e) => setShowTitle(e.target.checked)} 
                        className="w-4 h-4 accent-pink-500" 
                      />
                      <span className="text-sm">Show Title</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                      <input 
                        type="checkbox" 
                        checked={showPrice} 
                        onChange={(e) => setShowPrice(e.target.checked)} 
                        className="w-4 h-4 accent-pink-500" 
                      />
                      <span className="text-sm">Show Price</span>
                    </label>
                  </div>
                </div>

                {/* Fit Mode */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Square className="w-4 h-4" />
                    <span className="font-medium">Image Fit</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setFitMode('contain')} 
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        fitMode === 'contain' 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      Contain
                    </button>
                    <button 
                      onClick={() => setFitMode('cover')} 
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        fitMode === 'cover' 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      Cover
                    </button>
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
                        ) : voiceoverAudio ? (
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

                      {/* Voiceover Volume */}
                      {voiceoverAudio && (
                        <div className="space-y-2">
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
              </>
            )}

            {/* Generate Button (always visible) */}
            <button 
              onClick={generateVideo} 
              disabled={generating || selectedPhotos.length === 0 || !ffmpegLoaded} 
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
            >
              {generating ? (
                <>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating {progress}%</span>
                  </div>
                  {progressMessage && <span className="text-xs opacity-70">{progressMessage}</span>}
                </>
              ) : !ffmpegLoaded ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Loading encoder...</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>Generate Video</span>
                  {(enableVoiceover || enableMusic) && (
                    <span className="text-xs opacity-70">
                      {enableVoiceover && enableMusic ? '+ Voiceover + Music' :
                       enableVoiceover ? '+ Voiceover' : '+ Music'}
                    </span>
                  )}
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
                  Download Video
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
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {photos.map(photo => (
                  <div 
                    key={photo.id} 
                    onClick={() => togglePhoto(photo.id)} 
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                      photo.selected 
                        ? 'border-pink-500' 
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    {photo.selected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && videoUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Video Ready! 🎬</h3>
              <button 
                onClick={() => setShowShareModal(false)} 
                className="text-white/50 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-white/70 text-sm">
              Your {aspectRatio} video has been generated
              {(enableVoiceover || enableMusic) && (
                <span className="text-purple-400">
                  {enableVoiceover && enableMusic ? ' with voiceover and music' :
                   enableVoiceover ? ' with AI voiceover' : ' with background music'}
                </span>
              )}
              .
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
