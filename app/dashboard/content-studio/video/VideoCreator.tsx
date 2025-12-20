'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Play, Pause, Download, Home, Loader2, ChevronLeft, Clock, Sparkles, Check, Music, Type, Instagram, Facebook, Music2, Calendar, ExternalLink, CheckCircle, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, SnapREvents } from '@/lib/analytics'

interface Photo { id: string; url: string; selected: boolean }
type Transition = 'fade' | 'slide' | 'zoom' | 'none'

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
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentPreview, setCurrentPreview] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [addingToCalendar, setAddingToCalendar] = useState(false)
  const [addedToCalendar, setAddedToCalendar] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
    const { data: listing } = await supabase.from('listings').select('*, photos(id, raw_url, processed_url, status, display_order)').eq('id', id).single()
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

  const generateVideo = async () => {
    if (selectedPhotos.length === 0) return
    setGenerating(true)
    setProgress(0)
    setVideoUrl(null)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1080
    canvas.height = 1920
    const fps = 30
    const frameDuration = 1000 / fps
    const framesPerPhoto = duration * fps
    const transitionFrames = Math.floor(fps * 0.5)

    try {
      const stream = canvas.captureStream(fps)
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 5000000 })
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      
      const videoPromise = new Promise<string>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          resolve(URL.createObjectURL(blob))
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
              // Contain: fit entire image, add letterboxing
              if (imgRatio > canvasRatio) {
                // Image is wider - fit to width, letterbox top/bottom
                dw = canvas.width * scale
                dh = dw / imgRatio
                dx = (canvas.width - dw) / 2 + offsetX
                dy = (canvas.height - dh) / 2
              } else {
                // Image is taller - fit to height, letterbox sides
                dh = canvas.height * scale
                dw = dh * imgRatio
                dx = (canvas.width - dw) / 2 + offsetX
                dy = (canvas.height - dh) / 2
              }
            } else {
              // Cover: fill canvas, crop as needed
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

          // Text overlays
          if (showTitle) {
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 64px system-ui'
            ctx.textAlign = 'center'
            const title = listingTitle.length > 25 ? listingTitle.substring(0, 25) + '...' : listingTitle
            ctx.fillText(title, canvas.width / 2, canvas.height - 280)
          }
          if (listingLocation) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.font = '36px system-ui'
            ctx.fillText(listingLocation, canvas.width / 2, canvas.height - 210)
          }
          if (showPrice && listingPrice) {
            ctx.fillStyle = '#D4AF37'
            ctx.font = 'bold 72px system-ui'
            ctx.fillText('$' + listingPrice.toLocaleString(), canvas.width / 2, canvas.height - 120)
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
          setProgress(Math.round((currentFrame / totalFrames) * 100))
          await new Promise(r => setTimeout(r, frameDuration / 3))
        }
      }

      mediaRecorder.stop()
      const url = await videoPromise
      setVideoUrl(url)
      setShowShareModal(true)
      trackEvent(SnapREvents.VIDEO_CREATED)
    } catch (error) {
      console.error('Video generation error:', error)
      alert('Error generating video. Please try again.')
    }
    setGenerating(false)
  }

  const downloadVideo = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = listingTitle.replace(/[^a-z0-9]/gi, '_') + '_video.webm'
    a.click()
  }

  const addToCalendar = async () => {
    if (!videoUrl || !listingId) return
    setAddingToCalendar(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Save video to storage first
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const fileName = `videos/${user.id}/${listingId}_${Date.now()}.webm`
      
      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(fileName, blob, { contentType: 'video/webm' })
      
      if (uploadError) throw uploadError
      
      // Create calendar entry
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
          <div className="relative w-full max-w-[400px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-pink-500" /></div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
            ) : selectedPhotos.length > 0 ? (
              <>
                <img src={selectedPhotos[currentPreview]?.url} alt="" className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  {showTitle && <p className="text-white text-2xl font-bold mb-1">{listingTitle}</p>}
                  {listingLocation && <p className="text-white/70 text-sm mb-2">{listingLocation}</p>}
                  {showPrice && listingPrice && <p className="text-amber-400 text-3xl font-bold">${listingPrice.toLocaleString()}</p>}
                </div>
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 rounded-full text-sm">{currentPreview + 1}/{selectedPhotos.length}</div>
                <button onClick={() => setPlaying(!playing)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-black/50 rounded-full hover:bg-black/70">
                  {playing ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                <Home className="w-16 h-16 mb-4" />
                <p>Select photos to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-96 bg-[#111] border-l border-white/5 flex flex-col overflow-auto">
          {/* Photos */}
          <div className="p-4 border-b border-white/5">
            <h3 className="font-medium mb-3 flex items-center justify-between">
              <span>Photos ({selectedPhotos.length} selected)</span>
              <button onClick={() => setPhotos(photos.map(p => ({ ...p, selected: true })))} className="text-xs text-pink-400 hover:text-pink-300">Select All</button>
            </h3>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-auto">
              {photos.map((photo, i) => (
                <button key={photo.id} onClick={() => togglePhoto(photo.id)} className={'relative aspect-square rounded-lg overflow-hidden border-2 transition-all ' + (photo.selected ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-transparent opacity-50 hover:opacity-80')}>
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  {photo.selected && <div className="absolute top-1 right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">{photos.filter(p => p.selected).indexOf(photo) + 1}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="p-4 border-b border-white/5">
            <h3 className="font-medium mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-pink-400" />Duration per Photo</h3>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map(d => (
                <button key={d} onClick={() => setDuration(d)} className={'flex-1 py-2 rounded-lg font-medium transition-all ' + (duration === d ? 'bg-pink-500' : 'bg-white/10 hover:bg-white/20')}>{d}s</button>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-2 text-center">Total: {totalDuration}s video</p>
          </div>

          {/* Transition */}
          <div className="p-4 border-b border-white/5">
            <h3 className="font-medium mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-400" />Transition Effect</h3>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'fade', label: 'Fade' }, { id: 'slide', label: 'Slide' }, { id: 'zoom', label: 'Ken Burns' }, { id: 'none', label: 'None' }].map(t => (
                <button key={t.id} onClick={() => setTransition(t.id as Transition)} className={'py-2 rounded-lg font-medium transition-all ' + (transition === t.id ? 'bg-pink-500' : 'bg-white/10 hover:bg-white/20')}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Text Options */}
          <div className="p-4 border-b border-white/5">
            <h3 className="font-medium mb-3 flex items-center gap-2"><Type className="w-4 h-4 text-pink-400" />Text Overlays</h3>
            <div className="space-y-2">
              <button 
                type="button"
                onClick={() => setShowTitle(!showTitle)} 
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${showTitle ? 'bg-pink-500/20 border border-pink-500/30' : 'bg-white/5 hover:bg-white/10'}`}
              >
                <span>Property Title</span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${showTitle ? 'bg-pink-500 border-pink-500' : 'border-white/30'}`}>
                  {showTitle && <Check className="w-3 h-3" />}
                </div>
              </button>
              <button 
                type="button"
                onClick={() => setShowPrice(!showPrice)} 
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${showPrice ? 'bg-pink-500/20 border border-pink-500/30' : 'bg-white/5 hover:bg-white/10'}`}
              >
                <span>Price</span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${showPrice ? 'bg-pink-500 border-pink-500' : 'border-white/30'}`}>
                  {showPrice && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>
          </div>

          {/* Fit Mode */}
          <div className="p-4 border-b border-white/5">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
              </svg>
              Photo Fit
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setFitMode('contain')} 
                className={`py-2 rounded-lg font-medium transition-all ${fitMode === 'contain' ? 'bg-pink-500' : 'bg-white/10 hover:bg-white/20'}`}
              >
                Fit (Full Photo)
              </button>
              <button 
                type="button"
                onClick={() => setFitMode('cover')} 
                className={`py-2 rounded-lg font-medium transition-all ${fitMode === 'cover' ? 'bg-pink-500' : 'bg-white/10 hover:bg-white/20'}`}
              >
                Fill (Crop)
              </button>
            </div>
            <p className="text-white/40 text-xs mt-2 text-center">
              {fitMode === 'contain' ? 'Shows full photo with letterboxing' : 'Fills frame, may crop edges'}
            </p>
          </div>

          {/* Generate Button */}
          <div className="p-4 mt-auto">
            {generating ? (
              <div className="space-y-3">
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: progress + '%' }} />
                </div>
                <p className="text-center text-sm text-white/50">Generating video... {progress}%</p>
              </div>
            ) : (
              <button onClick={generateVideo} disabled={selectedPhotos.length === 0} className="w-full py-4 bg-pink-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <Video className="w-5 h-5" />
                Generate Video
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Share Modal */}
      {showShareModal && videoUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-xl border border-white/10 overflow-hidden my-8">
            {/* Header */}
            <div className="p-6 border-b border-white/10 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">Video Ready! 🎬</h2>
              <p className="text-white/50 mt-1">Your {totalDuration}s reel is ready to share</p>
            </div>
            
            {/* Video Preview */}
            <div className="px-6 py-4">
              <video 
                src={videoUrl} 
                className="w-full max-h-48 object-contain rounded-lg bg-black"
                controls
                muted
              />
            </div>
            
            {/* Share Options */}
            <div className="p-6 space-y-4">
              {/* Download Button - Primary */}
              <button
                onClick={downloadVideo}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
              >
                <Download className="w-5 h-5" />
                Download Video
              </button>
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-[#1A1A1A] text-white/40">or share to</span>
                </div>
              </div>
              
              {/* Platform Buttons - Manual Upload */}
              <div className="grid grid-cols-3 gap-3">
                {/* Facebook */}
                <a
                  href="https://business.facebook.com/latest/composer"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={downloadVideo}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-600/20 rounded-xl border border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-600/30 transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Facebook</span>
                  <span className="text-xs text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                    Upload <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
                
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={downloadVideo}
                  className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 hover:border-purple-500/60 transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Instagram</span>
                  <span className="text-xs text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                    Reels <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
                
                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={downloadVideo}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/30 transition-all group"
                >
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/20">
                    <Music2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">TikTok</span>
                  <span className="text-xs text-white/40 group-hover:text-white/60 flex items-center gap-1">
                    Video <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </div>
              
              {/* Quick Tips */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-sm text-amber-400 font-medium mb-2">📱 Quick Upload Steps:</p>
                <ol className="text-xs text-white/50 space-y-1 list-decimal list-inside">
                  <li>Click any platform above (video downloads automatically)</li>
                  <li>Open the platform app on your phone</li>
                  <li>Create new Reel/Video → Select downloaded file</li>
                  <li>Add your caption, hashtags & music!</li>
                </ol>
              </div>
              
              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={addToCalendar}
                  disabled={addingToCalendar || addedToCalendar}
                  className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {addedToCalendar ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Added!</span>
                    </>
                  ) : addingToCalendar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 text-white/60" />
                      <span className="text-sm">Add to Calendar</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={copyVideoLink}
                  className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white/60" />
                      <span className="text-sm">Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 text-white/50 hover:text-white transition-colors text-sm"
              >
                Close and Edit More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
