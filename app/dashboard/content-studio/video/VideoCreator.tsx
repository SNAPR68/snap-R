'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Play, Pause, Download, Home, Loader2, ChevronLeft, Clock, Sparkles, Check, Music, Type, Instagram, Facebook, Linkedin, Music2, Calendar, ExternalLink, CheckCircle, Copy, Smartphone, Square, RectangleHorizontal, RectangleVertical, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, SnapREvents } from '@/lib/analytics'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface Photo { id: string; url: string; selected: boolean }
type Transition = 'fade' | 'slide' | 'zoom' | 'none'
type AspectRatio = '16:9' | '1:1' | '4:5' | '9:16'

const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080, label: 'Landscape (Feed)', icon: RectangleHorizontal, platform: 'Facebook/Instagram Feed' },
  '1:1': { width: 1080, height: 1080, label: 'Square (Feed)', icon: Square, platform: 'Facebook/Instagram Feed' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait (Feed)', icon: RectangleVertical, platform: 'Facebook/Instagram Feed' },
  '9:16': { width: 1080, height: 1920, label: 'Vertical (Stories)', icon: Smartphone, platform: 'Instagram/TikTok/Reels' }
}

export default function VideoCreatorClient() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [listingTitle, setListingTitle] = useState('')
  const [listingPrice, setListingPrice] = useState<number | null>(null)
  const [listingLocation, setListingLocation] = useState('')
  const [duration, setDuration] = useState(3)
  const [transition, setTransition] = useState<Transition>('fade')
  const [showTitle, setShowTitle] = useState(true)
  const [showPrice, setShowPrice] = useState(true)
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('contain')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentPreview, setCurrentPreview] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [addingToCalendar, setAddingToCalendar] = useState(false)
  const [addedToCalendar, setAddedToCalendar] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg()
        ffmpegRef.current = ffmpeg
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })
        setFfmpegLoaded(true)
      } catch (e) { console.error('FFmpeg load error:', e) }
    }
    loadFFmpeg()
  }, [])

  useEffect(() => { if (listingId) loadPhotos(listingId) }, [listingId])

  useEffect(() => {
    if (playing && photos.filter(p => p.selected).length > 0) {
      previewIntervalRef.current = setInterval(() => {
        setCurrentPreview(prev => (prev + 1) % photos.filter(p => p.selected).length)
      }, duration * 1000)
    }
    return () => { if (previewIntervalRef.current) clearInterval(previewIntervalRef.current) }
  }, [playing, photos, duration])

  const loadPhotos = async (id: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data: listing } = await supabase.from('listings').select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status, display_order)').eq('id', id).single()
    if (listing) {
      setListingTitle(listing.title || listing.address || 'Property')
      setListingPrice(listing.price)
      setListingLocation([listing.city, listing.state].filter(Boolean).join(', '))
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

  const togglePhoto = (id: string) => setPhotos(photos.map(p => p.id === id ? { ...p, selected: !p.selected } : p))
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

  // Convert WebM to MP4 using FFmpeg
  const convertToMP4 = async (webmBlob: Blob): Promise<Blob> => {
    if (!ffmpegRef.current || !ffmpegLoaded) {
      console.warn('FFmpeg not loaded, returning WebM')
      return webmBlob
    }

    const ffmpeg = ffmpegRef.current
    setProgressMessage('Converting to MP4...')

    try {
      // Write WebM file to FFmpeg virtual filesystem
      const webmData = await fetchFile(webmBlob)
      await ffmpeg.writeFile('input.webm', webmData)

      // Convert WebM to MP4 with H.264 codec (Instagram compatible)
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-y',
        'output.mp4'
      ])

      // Read the converted MP4 file
      const mp4Data = await ffmpeg.readFile('output.mp4')
      const mp4Blob = new Blob([mp4Data as any], { type: 'video/mp4' })

      // Cleanup
      await ffmpeg.deleteFile('input.webm')
      await ffmpeg.deleteFile('output.mp4')

      return mp4Blob
    } catch (error) {
      console.error('MP4 conversion failed:', error)
      // Return original WebM if conversion fails
      return webmBlob
    }
  }

  const generateVideo = async () => {
    if (selectedPhotos.length === 0) return
    setGenerating(true)
    setProgress(0)
    setProgressMessage('Preparing frames...')
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
      const stream = canvas.captureStream(fps)
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 5000000 })
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      
      const webmPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          resolve(blob)
        }
      })

      mediaRecorder.start()
      setProgressMessage('Generating frames...')

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
                dx = (canvas.width - dw) / 2 + offsetX
                dy = (canvas.height - dh) / 2
              } else {
                dh = canvas.height * scale
                dw = dh * imgRatio
                dx = (canvas.width - dw) / 2 + offsetX
                dy = (canvas.height - dh) / 2
              }
            } else {
              if (imgRatio > canvasRatio) {
                dh = canvas.height * scale
                dw = dh * imgRatio
                dx = (canvas.width - dw) / 2 + offsetX
                dy = (canvas.height - dh) / 2
              } else {
                dw = canvas.width * scale
                dh = dw / imgRatio
                dx = (canvas.width - dw) / 2 + offsetX
                dy = (canvas.height - dh) / 2
              }
            }

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

          // Dynamic text sizing based on aspect ratio
          const isVertical = aspectRatio === '9:16'
          const titleSize = isVertical ? 64 : 48
          const locationSize = isVertical ? 36 : 28
          const priceSize = isVertical ? 72 : 56
          const bottomPadding = isVertical ? 120 : 80

          // Text overlays
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
          setProgress(Math.round((currentFrame / totalFrames) * 80)) // 80% for frame generation
          await new Promise(r => setTimeout(r, frameDuration / 3))
        }
      }

      mediaRecorder.stop()
      const webmBlob = await webmPromise
      
      // Convert to MP4 for Instagram compatibility
      setProgress(85)
      setProgressMessage('Converting to MP4 for Instagram...')
      
      const mp4Blob = await convertToMP4(webmBlob)
      
      setProgress(100)
      setProgressMessage('Complete!')
      
      const url = URL.createObjectURL(mp4Blob)
      setVideoUrl(url)
      setVideoBlob(mp4Blob)
      setShowShareModal(true)
      trackEvent(SnapREvents.VIDEO_CREATED)
    } catch (error) {
      console.error('Video generation error:', error)
      alert('Error generating video. Please try again.')
    }
    setGenerating(false)
    setProgressMessage('')
  }

  const downloadVideo = () => {
    if (!videoUrl || !videoBlob) return
    const a = document.createElement('a')
    a.href = videoUrl
    // Use .mp4 extension for Instagram compatibility
    const extension = videoBlob.type === 'video/mp4' ? 'mp4' : 'webm'
    a.download = `${listingTitle.replace(/[^a-z0-9]/gi, '_')}_${aspectRatio.replace(':', 'x')}.${extension}`
    a.click()
  }

  const addToCalendar = async () => {
    if (!videoUrl || !videoBlob || !listingId) return
    setAddingToCalendar(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const extension = videoBlob.type === 'video/mp4' ? 'mp4' : 'webm'
      const fileName = `videos/${user.id}/${listingId}_${Date.now()}.${extension}`
      
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

  const copyVideoLink = async () => {
    if (!videoUrl) return
    try {
      await navigator.clipboard.writeText(videoUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePlatformUpload = (platform: 'instagram' | 'facebook' | 'linkedin') => {
    // Download video first
    downloadVideo()
    
    // Open platform-specific upload page
    const urls = {
      instagram: 'https://www.instagram.com/',
      facebook: 'https://business.facebook.com/latest/composer',
      linkedin: 'https://www.linkedin.com/feed/'
    }
    
    setTimeout(() => {
      window.open(urls[platform], '_blank')
    }, 500)
  }

  const getPreviewAspectClass = () => {
    switch(aspectRatio) {
      case '16:9': return 'aspect-video'
      case '1:1': return 'aspect-square'
      case '4:5': return 'aspect-[4/5]'
      case '9:16': return 'aspect-[9/16]'
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <canvas ref={canvasRef} className="hidden" />
      
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4">
        <Link href="/dashboard/content-studio" className="flex items-center gap-2 hover:opacity-80">
          <ArrowLeft className="w-4 h-4 text-white/50" />
          <span className="text-white/50 text-sm">Back</span>
        </Link>
        <div className="h-5 w-px bg-white/10 mx-4" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center"><Video className="w-4 h-4" /></div>
          <span className="font-bold">Video Creator</span>
          {ffmpegLoaded && <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">MP4 Ready</span>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {videoUrl && (
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-lg font-semibold hover:bg-pink-600">
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
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-pink-500" /></div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
            ) : selectedPhotos.length > 0 ? (
              <>
                <img src={selectedPhotos[currentPreview]?.url} alt="" className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {showTitle && <div className="absolute bottom-32 left-0 right-0 text-center text-white font-bold text-3xl">{listingTitle}</div>}
                {listingLocation && <div className="absolute bottom-20 left-0 right-0 text-center text-white/70 text-xl">{listingLocation}</div>}
                {showPrice && listingPrice && <div className="absolute bottom-8 left-0 right-0 text-center text-[#D4AF37] font-bold text-4xl">${listingPrice.toLocaleString()}</div>}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/30">Select photos to preview</div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-96 bg-[#111] border-l border-white/5 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Aspect Ratio Selector */}
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
                      <div className="text-[10px] opacity-50 mt-1">{config.platform}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Photo Duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Photo Duration</span>
                </div>
                <span className="text-white font-bold">{duration}s</span>
              </div>
              <input type="range" min="1" max="5" step="0.5" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} className="w-full" />
              <div className="text-xs text-white/30">Total: {totalDuration}s ({selectedPhotos.length} photos)</div>
            </div>

            {/* Transition Effect */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Transition</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['fade', 'slide', 'zoom', 'none'] as Transition[]).map(t => (
                  <button key={t} onClick={() => setTransition(t)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${transition === t ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
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
                  <input type="checkbox" checked={showTitle} onChange={(e) => setShowTitle(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm">Show Title</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                  <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="w-4 h-4" />
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
                <button onClick={() => setFitMode('contain')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${fitMode === 'contain' ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                  Contain (Fit)
                </button>
                <button onClick={() => setFitMode('cover')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${fitMode === 'cover' ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                  Cover (Fill)
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button onClick={generateVideo} disabled={generating || selectedPhotos.length === 0 || !ffmpegLoaded} className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1">
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
                  <span className="text-sm">Loading MP4 encoder...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    <span>Generate MP4 Video</span>
                  </div>
                  <span className="text-xs opacity-70">Instagram & TikTok compatible</span>
                </>
              )}
            </button>

            {videoUrl && (
              <div className="space-y-2">
                <button onClick={downloadVideo} className="w-full py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download MP4 Video
                </button>
                <button onClick={addToCalendar} disabled={addingToCalendar} className="w-full py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 flex items-center justify-center gap-2">
                  {addingToCalendar ? <Loader2 className="w-4 h-4 animate-spin" /> : addedToCalendar ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Calendar className="w-4 h-4" />}
                  {addedToCalendar ? 'Added to Calendar!' : 'Add to Calendar'}
                </button>
              </div>
            )}

            {/* Photo Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="font-medium">Selected Photos</span>
                <span className="ml-auto text-pink-500 font-bold">{selectedPhotos.length}/{photos.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {photos.map(photo => (
                  <div key={photo.id} onClick={() => togglePhoto(photo.id)} className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition ${photo.selected ? 'border-pink-500' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    {photo.selected && <div className="absolute top-1 right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
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
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                MP4 Video Ready!
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <p className="text-white/70 text-sm">Your {aspectRatio} video has been generated in MP4 format - compatible with Instagram, TikTok, and all social platforms.</p>
            <div className="space-y-2">
              <button onClick={downloadVideo} className="w-full py-3 bg-pink-500 rounded-lg font-semibold hover:bg-pink-600 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download MP4 Video
              </button>
              
              {/* Platform Upload Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePlatformUpload('instagram')}
                  className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-600/30 transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">Instagram</span>
                </button>
                
                <button
                  onClick={() => handlePlatformUpload('facebook')}
                  className="flex flex-col items-center gap-2 p-3 bg-blue-600/20 rounded-lg border border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-600/30 transition-all"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">Facebook</span>
                </button>
                
                <button
                  onClick={() => handlePlatformUpload('linkedin')}
                  className="flex flex-col items-center gap-2 p-3 bg-[#0A66C2]/20 rounded-lg border border-[#0A66C2]/30 hover:border-[#0A66C2]/60 hover:bg-[#0A66C2]/30 transition-all"
                >
                  <div className="w-10 h-10 bg-[#0A66C2] rounded-lg flex items-center justify-center">
                    <Linkedin className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">LinkedIn</span>
                </button>
              </div>
              
              <button onClick={copyVideoLink} className="w-full py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 flex items-center justify-center gap-2">
                {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={addToCalendar} disabled={addingToCalendar} className="w-full py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 flex items-center justify-center gap-2">
                {addingToCalendar ? <Loader2 className="w-4 h-4 animate-spin" /> : addedToCalendar ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Calendar className="w-4 h-4" />}
                {addedToCalendar ? 'Added!' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
