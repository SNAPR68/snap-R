'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Play, Pause, Video, Music, Clock, Download, Image, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const DURATIONS = [
  { id: 2, label: '2s', desc: 'Fast' },
  { id: 3, label: '3s', desc: 'Normal' },
  { id: 5, label: '5s', desc: 'Slow' },
]

const TRANSITIONS = [
  { id: 'fade', name: 'Fade' },
  { id: 'slide', name: 'Slide' },
  { id: 'zoom', name: 'Zoom' },
]

function VideoCreatorContent() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  
  const [photos, setPhotos] = useState<string[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [duration, setDuration] = useState(3)
  const [transition, setTransition] = useState('fade')
  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (listingId) fetchListing()
    else setLoading(false)
  }, [listingId])

  useEffect(() => {
    if (playing && selectedPhotos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % selectedPhotos.length)
      }, duration * 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, selectedPhotos.length, duration])

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}`)
      const data = await res.json()
      if (data.listing?.photos) {
        setPhotos(data.listing.photos)
        setSelectedPhotos(data.listing.photos.slice(0, 5))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const togglePhoto = (url: string) => {
    setSelectedPhotos(prev => 
      prev.includes(url) ? prev.filter(p => p !== url) : prev.length < 10 ? [...prev, url] : prev
    )
  }

  const togglePlay = () => {
    setPlaying(!playing)
    if (!playing) setCurrentIndex(0)
  }

  const generateVideo = async () => {
    setGenerating(true)
    // In production, this would call an API to generate actual video
    // For now, show a message
    await new Promise(r => setTimeout(r, 2000))
    alert('Video generation requires FFmpeg integration. The slideshow preview above shows how your video will look!')
    setGenerating(false)
  }

  const totalDuration = selectedPhotos.length * duration

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Video className="w-5 h-5 text-[#D4AF37]" />Video Creator</h1>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Preview */}
            <div className="col-span-2 space-y-4">
              <div className="bg-black rounded-2xl aspect-[9/16] max-h-[500px] mx-auto overflow-hidden relative">
                {selectedPhotos.length > 0 ? (
                  <>
                    <img 
                      src={selectedPhotos[currentIndex]} 
                      alt="" 
                      className={`w-full h-full object-cover transition-all duration-500 ${transition === 'fade' ? 'opacity-100' : ''} ${transition === 'zoom' ? 'scale-105' : ''}`}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                      {selectedPhotos.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition ${i === currentIndex ? 'bg-[#D4AF37]' : 'bg-white/30'}`} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <div className="text-center">
                      <Image className="w-12 h-12 mx-auto mb-2" />
                      <p>Select photos below</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} variant="ghost" disabled={selectedPhotos.length < 2}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button onClick={togglePlay} className="w-12 h-12 rounded-full bg-[#D4AF37] hover:bg-[#B8960C] text-black" disabled={selectedPhotos.length < 2}>
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button onClick={() => setCurrentIndex(prev => Math.min(selectedPhotos.length - 1, prev + 1))} variant="ghost" disabled={selectedPhotos.length < 2}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Photo Selection */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-3">Select Photos ({selectedPhotos.length}/10)</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((url, i) => {
                    const selected = selectedPhotos.includes(url)
                    const order = selectedPhotos.indexOf(url) + 1
                    return (
                      <button key={i} onClick={() => togglePhoto(url)} className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${selected ? 'border-[#D4AF37]' : 'border-transparent'}`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {selected && <div className="absolute top-1 left-1 w-5 h-5 bg-[#D4AF37] rounded-full text-xs font-bold text-black flex items-center justify-center">{order}</div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              {/* Duration */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />Slide Duration</h3>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map(d => (
                    <button key={d.id} onClick={() => setDuration(d.id)} className={`p-3 rounded-lg text-center transition ${duration === d.id ? 'bg-[#D4AF37] text-black' : 'bg-white/5 hover:bg-white/10'}`}>
                      <div className="font-bold">{d.label}</div>
                      <div className="text-xs opacity-60">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transition */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-3">Transition</h3>
                <div className="grid grid-cols-3 gap-2">
                  {TRANSITIONS.map(t => (
                    <button key={t.id} onClick={() => setTransition(t.id)} className={`p-2 rounded-lg text-sm transition ${transition === t.id ? 'bg-[#D4AF37] text-black font-medium' : 'bg-white/5 hover:bg-white/10'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#D4AF37]/10 rounded-xl p-4 border border-[#D4AF37]/30">
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#D4AF37]">{selectedPhotos.length}</div>
                    <div className="text-xs text-white/50">Photos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#D4AF37]">{totalDuration}s</div>
                    <div className="text-xs text-white/50">Duration</div>
                  </div>
                </div>
                <Button onClick={generateVideo} disabled={generating || selectedPhotos.length < 2} className="w-full bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold h-12">
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5 mr-2" />Generate Video</>}
                </Button>
              </div>

              {/* Format Info */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm text-white/50">
                <p className="font-medium text-white mb-2">Output Format:</p>
                <ul className="space-y-1">
                  <li>• 1080×1920 (9:16 vertical)</li>
                  <li>• MP4 format</li>
                  <li>• Perfect for Reels & TikTok</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VideoCreator() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>}><VideoCreatorContent /></Suspense>
}
