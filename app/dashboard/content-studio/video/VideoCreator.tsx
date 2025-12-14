'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Play, Pause, ChevronLeft, ChevronRight, Clock, Download, Image, Loader2, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  url: string
}

export default function VideoCreatorClient() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [duration, setDuration] = useState(3)
  const [transition, setTransition] = useState<'fade' | 'slide' | 'zoom'>('fade')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listingTitle, setListingTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const [overlayStyle, setOverlayStyle] = useState<'minimal' | 'bold' | 'elegant'>('elegant')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (listingId) loadListingPhotos()
    else setLoading(false)
  }, [listingId])

  const loadListingPhotos = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: listing } = await supabase.from('listings').select('*, photos(id, raw_url, processed_url, status)').eq('id', listingId).single()
      if (listing) {
        setListingTitle(listing.title || listing.address || 'Untitled')
        const photoList = await Promise.all((listing.photos || []).filter((p: any) => p.processed_url || p.raw_url).map(async (photo: any) => {
          const path = photo.processed_url || photo.raw_url
          let url = path
          if (path && !path.startsWith('http')) {
            const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
            url = data?.signedUrl || path
          }
          return { id: photo.id, url }
        }))
        setPhotos(photoList)
        if (photoList.length > 0) setSelectedPhotos(photoList.slice(0, Math.min(5, photoList.length)).map(p => p.id))
      }
    } catch (error) { console.error('Error loading photos:', error) }
    setLoading(false)
  }

  const togglePhoto = (photoId: string) => {
    if (selectedPhotos.includes(photoId)) setSelectedPhotos(selectedPhotos.filter(id => id !== photoId))
    else if (selectedPhotos.length < 10) setSelectedPhotos([...selectedPhotos, photoId])
  }

  const selectedPhotoUrls = photos.filter(p => selectedPhotos.includes(p.id)).map(p => p.url)
  const totalDuration = selectedPhotos.length * duration

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && selectedPhotoUrls.length > 0) {
      interval = setInterval(() => setCurrentIndex(prev => (prev + 1) % selectedPhotoUrls.length), duration * 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, selectedPhotoUrls.length, duration])

  const generateVideo = async () => {
    if (selectedPhotoUrls.length === 0) return
    setGenerating(true)
    setProgress(0)
    setGeneratedVideo(null)
    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not found')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Context not found')
      canvas.width = 1080
      canvas.height = 1920
      const fps = 30
      const framesPerSlide = duration * fps
      const transitionFrames = Math.floor(fps * 0.5)
      const totalFrames = selectedPhotoUrls.length * framesPerSlide
      const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => { const img = new window.Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = reject; img.src = src })
      const images = await Promise.all(selectedPhotoUrls.map(loadImage))
      const stream = canvas.captureStream(fps)
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 })
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mediaRecorder.onstop = () => { const blob = new Blob(chunks, { type: 'video/webm' }); setGeneratedVideo(URL.createObjectURL(blob)); setGenerating(false) }
      mediaRecorder.start()
      for (let frame = 0; frame < totalFrames; frame++) {
        const slideIndex = Math.floor(frame / framesPerSlide)
        const frameInSlide = frame % framesPerSlide
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const currentImage = images[slideIndex]
        const nextImage = images[(slideIndex + 1) % images.length]
        let transitionProgress = 0
        if (frameInSlide >= framesPerSlide - transitionFrames && slideIndex < images.length - 1) transitionProgress = (frameInSlide - (framesPerSlide - transitionFrames)) / transitionFrames
        const drawImageCover = (img: HTMLImageElement, opacity = 1, offsetX = 0, scale = 1) => { ctx.save(); ctx.globalAlpha = opacity; const imgRatio = img.width / img.height; const canvasRatio = canvas.width / canvas.height; let dw, dh, dx, dy; if (imgRatio > canvasRatio) { dh = canvas.height * scale; dw = dh * imgRatio; dx = (canvas.width - dw) / 2 + offsetX; dy = (canvas.height - dh) / 2 } else { dw = canvas.width * scale; dh = dw / imgRatio; dx = (canvas.width - dw) / 2 + offsetX; dy = (canvas.height - dh) / 2 } ctx.drawImage(img, dx, dy, dw, dh); ctx.restore() }
        if (transition === 'fade') { drawImageCover(currentImage, 1 - transitionProgress); if (transitionProgress > 0) drawImageCover(nextImage, transitionProgress) }
        else if (transition === 'slide') { const offset = transitionProgress * canvas.width; drawImageCover(currentImage, 1, -offset); if (transitionProgress > 0) drawImageCover(nextImage, 1, canvas.width - offset) }
        else if (transition === 'zoom') { const scale = 1 + transitionProgress * 0.2; drawImageCover(currentImage, 1 - transitionProgress, 0, scale); if (transitionProgress > 0) drawImageCover(nextImage, transitionProgress) }
        if (showOverlay) { const gradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height); gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, 'rgba(0,0,0,0.8)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; if (overlayStyle === 'elegant') { ctx.font = 'bold 72px system-ui'; ctx.fillText(listingTitle, canvas.width / 2, canvas.height - 200); ctx.font = '36px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('Swipe for more', canvas.width / 2, canvas.height - 120) } else if (overlayStyle === 'bold') { ctx.font = 'bold 96px system-ui'; ctx.fillText(listingTitle.toUpperCase(), canvas.width / 2, canvas.height - 180) } else { ctx.font = '48px system-ui'; ctx.fillText(listingTitle, canvas.width / 2, canvas.height - 150) } ctx.font = '24px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('Created with SnapR', canvas.width / 2, canvas.height - 50) }
        setProgress(Math.round((frame / totalFrames) * 100))
        await new Promise(r => setTimeout(r, 1))
      }
      mediaRecorder.stop()
    } catch (error) { console.error('Video generation error:', error); setGenerating(false); alert('Error generating video.') }
  }

  const downloadVideo = () => { if (!generatedVideo) return; const a = document.createElement('a'); a.href = generatedVideo; a.download = listingTitle.replace(/[^a-z0-9]/gi, '_') + '_reel.webm'; a.click() }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <canvas ref={canvasRef} className="hidden" />
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4">
        <Link href="/dashboard/content-studio" className="flex items-center gap-2 hover:opacity-80"><ArrowLeft className="w-4 h-4 text-white/50" /><span className="text-white/50 text-sm">Back</span></Link>
        <div className="h-5 w-px bg-white/10 mx-4" />
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center"><Video className="w-4 h-4" /></div><span className="font-bold">Video Creator</span>{listingTitle && <span className="text-white/50 text-sm ml-2">• {listingTitle}</span>}</div>
      </header>
      <div className="flex h-[calc(100vh-56px)]">
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#080808]">
          {loading ? <div className="flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /><p className="text-white/50">Loading photos...</p></div>
          : !listingId ? <div className="text-center"><Video className="w-16 h-16 text-white/10 mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Listing Selected</h3><p className="text-white/40 mb-4">Go back and select a listing first</p><Link href="/dashboard/content-studio" className="px-4 py-2 bg-pink-500 text-white rounded-lg font-medium">Select Listing</Link></div>
          : generatedVideo ? <div className="flex flex-col items-center"><div className="w-[280px] h-[500px] bg-black rounded-3xl overflow-hidden border-4 border-gray-800"><video src={generatedVideo} controls autoPlay loop className="w-full h-full object-cover" /></div><div className="flex gap-3 mt-6"><button onClick={() => { setGeneratedVideo(null); setProgress(0) }} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 flex items-center gap-2"><RotateCcw className="w-4 h-4" />Create New</button><button onClick={downloadVideo} className="px-6 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 flex items-center gap-2 font-semibold"><Download className="w-4 h-4" />Download Video</button></div></div>
          : <><div className="w-[280px] h-[500px] bg-[#111] rounded-3xl border-4 border-gray-800 overflow-hidden relative">{selectedPhotoUrls.length > 0 ? <><img src={selectedPhotoUrls[currentIndex]} alt="" className="w-full h-full object-cover transition-all duration-500" />{showOverlay && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4"><p className={'text-white font-bold ' + (overlayStyle === 'bold' ? 'text-lg uppercase' : 'text-base')}>{listingTitle}</p>{overlayStyle === 'elegant' && <p className="text-white/60 text-xs mt-1">Swipe for more</p>}</div>}</> : <div className="w-full h-full flex flex-col items-center justify-center text-white/30"><Image className="w-12 h-12 mb-2" /><p className="text-sm">Select photos below</p></div>}</div><div className="flex items-center gap-4 mt-6"><button onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : selectedPhotoUrls.length - 1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20" disabled={!selectedPhotoUrls.length}><ChevronLeft className="w-5 h-5" /></button><button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-pink-500 rounded-full hover:bg-pink-600" disabled={!selectedPhotoUrls.length}>{isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}</button><button onClick={() => setCurrentIndex(prev => (prev + 1) % selectedPhotoUrls.length)} className="p-2 bg-white/10 rounded-full hover:bg-white/20" disabled={!selectedPhotoUrls.length}><ChevronRight className="w-5 h-5" /></button></div></>}
        </div>
        <aside className="w-80 bg-[#111] border-l border-white/5 flex flex-col overflow-auto">
          <div className="p-4 border-b border-white/5"><div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-white/50" /><h3 className="font-medium">Slide Duration</h3></div><div className="grid grid-cols-3 gap-2">{[2,3,5].map(d => <button key={d} onClick={() => setDuration(d)} className={'py-3 rounded-lg font-medium transition-all ' + (duration === d ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10')}><span className="text-lg">{d}s</span><p className="text-[10px] opacity-70">{d === 2 ? 'Fast' : d === 3 ? 'Normal' : 'Slow'}</p></button>)}</div></div>
          <div className="p-4 border-b border-white/5"><h3 className="font-medium mb-3">Transition</h3><div className="grid grid-cols-3 gap-2">{(['fade','slide','zoom'] as const).map(t => <button key={t} onClick={() => setTransition(t)} className={'py-2 rounded-lg font-medium capitalize transition-all ' + (transition === t ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10')}>{t}</button>)}</div></div>
          <div className="p-4 border-b border-white/5"><div className="flex items-center justify-between mb-3"><h3 className="font-medium">Text Overlay</h3><button onClick={() => setShowOverlay(!showOverlay)} className={'w-10 h-6 rounded-full transition-colors ' + (showOverlay ? 'bg-pink-500' : 'bg-white/20')}><div className={'w-4 h-4 bg-white rounded-full transition-transform mx-1 ' + (showOverlay ? 'translate-x-4' : '')} /></button></div>{showOverlay && <div className="grid grid-cols-3 gap-2">{(['minimal','elegant','bold'] as const).map(s => <button key={s} onClick={() => setOverlayStyle(s)} className={'py-2 rounded-lg text-sm font-medium capitalize transition-all ' + (overlayStyle === s ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10')}>{s}</button>)}</div>}</div>
          <div className="p-4 border-b border-white/5"><div className="bg-white/5 rounded-xl p-4 mb-4"><div className="grid grid-cols-2 gap-4 text-center"><div><p className="text-2xl font-bold">{selectedPhotos.length}</p><p className="text-xs text-white/50">Photos</p></div><div><p className="text-2xl font-bold">{totalDuration}s</p><p className="text-xs text-white/50">Duration</p></div></div></div>{generating ? <div className="space-y-3"><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-pink-500 transition-all duration-300" style={{width:progress+'%'}} /></div><p className="text-center text-sm text-white/50">Generating video... {progress}%</p></div> : <button onClick={generateVideo} disabled={!selectedPhotos.length} className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"><Video className="w-4 h-4" />Generate Video</button>}</div>
          <div className="p-4"><h3 className="font-medium mb-2">Output Format:</h3><ul className="text-sm text-white/50 space-y-1"><li>• 1080×1920 (9:16 vertical)</li><li>• WebM format</li><li>• Perfect for Reels & TikTok</li></ul></div>
        </aside>
      </div>
      <div className="fixed bottom-0 left-0 right-80 bg-[#111] border-t border-white/5 p-4"><div className="flex items-center justify-between mb-2"><h3 className="font-medium">Select Photos ({selectedPhotos.length}/10)</h3>{selectedPhotos.length > 0 && <button onClick={() => setSelectedPhotos([])} className="text-xs text-white/50 hover:text-white">Clear all</button>}</div>{photos.length === 0 ? <p className="text-white/40 text-sm">No photos available</p> : <div className="flex gap-2 overflow-x-auto pb-2">{photos.map(photo => <button key={photo.id} onClick={() => togglePhoto(photo.id)} className={'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ' + (selectedPhotos.includes(photo.id) ? 'border-pink-500 ring-2 ring-pink-500/50' : 'border-transparent hover:border-white/30')}><img src={photo.url} alt="" className="w-full h-full object-cover" />{selectedPhotos.includes(photo.id) && <div className="absolute top-1 right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">{selectedPhotos.indexOf(photo.id) + 1}</div>}</button>)}</div>}</div>
    </div>
  )
}
