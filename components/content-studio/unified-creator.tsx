'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { ArrowLeft, Download, Loader2, Check, Sparkles, Instagram, Facebook, Linkedin, Video, Image, Copy, Hash, ClipboardCopy, Package, MessageCircle, Images, ImageIcon, Share2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TemplateRenderer, FacebookTemplateRenderer, VerticalTemplateRenderer } from './template-renderer'
import { INSTAGRAM_POST_TEMPLATES, FACEBOOK_POST_TEMPLATES, LINKEDIN_POST_TEMPLATES, VERTICAL_TEMPLATES, TEMPLATE_CATEGORIES, TemplateDefinition } from '@/lib/content/templates'
import { trackEvent, SnapREvents } from '@/lib/analytics'

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'story'
type Tone = 'professional' | 'casual' | 'luxury' | 'excited'
type PostMode = 'single' | 'carousel'

const PLATFORMS = [
  { id: 'instagram' as Platform, name: 'Instagram', icon: Instagram, dimensions: '1080×1080', gradient: 'from-purple-500 to-pink-500', supportsCarousel: true },
  { id: 'story' as Platform, name: 'Story', icon: Image, dimensions: '1080×1920', gradient: 'from-purple-600 to-orange-500', supportsCarousel: false },
  { id: 'facebook' as Platform, name: 'Facebook', icon: Facebook, dimensions: '1200×630', gradient: 'from-blue-600 to-blue-400', supportsCarousel: true },
  { id: 'linkedin' as Platform, name: 'LinkedIn', icon: Linkedin, dimensions: '1200×627', gradient: 'from-blue-700 to-blue-500', supportsCarousel: true },
  { id: 'tiktok' as Platform, name: 'TikTok', icon: Video, dimensions: '1080×1920', gradient: 'from-gray-800 to-black', supportsCarousel: true },
]

const TONES = [
  { id: 'professional' as Tone, label: '🏢' },
  { id: 'casual' as Tone, label: '😊' },
  { id: 'luxury' as Tone, label: '✨' },
  { id: 'excited' as Tone, label: '🎉' },
]

const getTemplates = (p: Platform): TemplateDefinition[] => {
  switch(p) {
    case 'instagram': return INSTAGRAM_POST_TEMPLATES
    case 'facebook': return FACEBOOK_POST_TEMPLATES
    case 'linkedin': return LINKEDIN_POST_TEMPLATES
    default: return VERTICAL_TEMPLATES
  }
}

const getDims = (p: Platform) => {
  switch(p) {
    case 'instagram': return { w: 1080, h: 1080 }
    case 'facebook': return { w: 1200, h: 630 }
    case 'linkedin': return { w: 1200, h: 627 }
    default: return { w: 1080, h: 1920 }
  }
}

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop'

export function UnifiedCreator() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  const downloadRef = useRef<HTMLDivElement>(null)

  const [platform, setPlatform] = useState<Platform>('instagram')
  const [postMode, setPostMode] = useState<PostMode>('single')
  const [templates, setTemplates] = useState<Record<Platform, TemplateDefinition>>({
    instagram: INSTAGRAM_POST_TEMPLATES[0],
    facebook: FACEBOOK_POST_TEMPLATES[0],
    linkedin: LINKEDIN_POST_TEMPLATES[0],
    story: VERTICAL_TEMPLATES[0],
    tiktok: VERTICAL_TEMPLATES[0]
  })
  const [category, setCategory] = useState('just-listed')
  const [headline, setHeadline] = useState('JUST LISTED')
  const [photoUrl, setPhotoUrl] = useState(DEFAULT_PHOTO)
  const [photos, setPhotos] = useState<string[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [listingTitle, setListingTitle] = useState('')
  const [tone, setTone] = useState<Tone>('professional')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [genCaption, setGenCaption] = useState(false)
  const [genHashtags, setGenHashtags] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const [property, setProperty] = useState({ address: '', city: '', state: '', price: '' as any, bedrooms: '' as any, bathrooms: '' as any, squareFeet: '' as any })
  const [brand, setBrand] = useState({ business_name: '', logo_url: '', primary_color: '#D4AF37', secondary_color: '#1A1A1A', phone: '', tagline: '' })

  useEffect(() => {
    async function load() {
      try {
        const [brandRes, listingRes] = await Promise.all([
          fetch('/api/brand'),
          listingId ? fetch(`/api/listings?id=${listingId}`) : Promise.resolve(null)
        ])
        const brandData = await brandRes.json()
        if (brandData.brandProfile) setBrand({ business_name: brandData.brandProfile.business_name || '', logo_url: brandData.brandProfile.logo_url || '', primary_color: brandData.brandProfile.primary_color || '#D4AF37', secondary_color: brandData.brandProfile.secondary_color || '#1A1A1A', phone: brandData.brandProfile.phone || '', tagline: brandData.brandProfile.tagline || '' })
        if (listingRes) {
          const data = await listingRes.json()
          if (data.listing) { setListingTitle(data.listing.title || data.listing.address || 'Listing'); setProperty({ address: data.listing.address || '', city: data.listing.city || '', state: data.listing.state || '', price: data.listing.price || '', bedrooms: data.listing.bedrooms || '', bathrooms: data.listing.bathrooms || '', squareFeet: data.listing.square_feet || '' }) }
          if (data.photos?.length > 0) { const urls = data.photos.filter((p: any) => p.signedProcessedUrl).map((p: any) => p.signedProcessedUrl); if (urls.length > 0) { setPhotos(urls); setPhotoUrl(urls[0]) } }
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [listingId])

  useEffect(() => { setHeadline({ 'just-listed': 'JUST LISTED', 'open-house': 'OPEN HOUSE', 'price-reduced': 'PRICE REDUCED', 'just-sold': 'JUST SOLD' }[category] || 'JUST LISTED') }, [category])

  const selectPhoto = (url: string) => { if (postMode === 'single') { setPhotoUrl(url); return }; setSelectedPhotos(prev => prev.includes(url) ? prev.filter(p => p !== url) : prev.length >= 10 ? prev : [...prev, url]) }

  const download = async (p: Platform) => {
    if (!downloadRef.current) return; setDownloading(p)
    try { 
      const { w, h } = getDims(p)
      await new Promise(r => setTimeout(r, 100))
      const canvas = await html2canvas(downloadRef.current, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, width: w, height: h, windowWidth: w, windowHeight: h })
      const link = document.createElement('a')
      link.download = `${p}-post-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (e) { console.error(e) } finally { setDownloading(null) }
  }

  const downloadCarousel = async () => {
    if (selectedPhotos.length < 2) return; setDownloading('carousel')
    try { 
      const zip = new JSZip()
      for (let i = 0; i < selectedPhotos.length; i++) { 
        const res = await fetch(selectedPhotos[i])
        const blob = await res.blob()
        zip.file(`slide-${String(i+1).padStart(2,'0')}.jpg`, blob) 
      }
      if (caption || hashtags) zip.file('caption.txt', `${caption}\n\n${hashtags}`.trim())
      const blob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `carousel-${selectedPhotos.length}-slides.zip`
      link.click()
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (e) { console.error(e) } finally { setDownloading(null) }
  }

  const downloadAllPlatforms = async () => {
    setDownloading('all')
    try {
      for (let i = 0; i < PLATFORMS.length; i++) {
        setPlatform(PLATFORMS[i].id)
        await new Promise(r => setTimeout(r, 400))
        await download(PLATFORMS[i].id)
        await new Promise(r => setTimeout(r, 200))
      }
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (e) { console.error(e) } finally { setDownloading(null) }
  }

  const generateCaption = async () => { 
    setGenCaption(true)
    try { 
      const res = await fetch('/api/copy/caption', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          platform: platform === 'story' ? 'instagram' : platform, 
          tone, 
          includeEmojis: true, 
          includeCallToAction: true, 
          property: { ...property, propertyType: 'House', features: [] }
        }) 
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.caption) setCaption(data.caption)
      else if (data.error) console.error('Caption error:', data.error)
    } catch (e) { 
      console.error('Failed to generate caption:', e)
      generateFallbackCaption()
    } finally { setGenCaption(false) } 
  }

  const generateHashtags = async () => { 
    setGenHashtags(true)
    try { 
      const res = await fetch('/api/copy/hashtags', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          platform: platform === 'story' ? 'instagram' : platform, 
          property: { city: property.city, state: property.state, propertyType: 'House', features: [] }
        }) 
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.hashtagsText) setHashtags(data.hashtagsText)
      else if (data.hashtags) setHashtags(Array.isArray(data.hashtags) ? data.hashtags.join(' ') : data.hashtags)
      else if (data.error) console.error('Hashtags error:', data.error)
    } catch (e) { 
      console.error('Failed to generate hashtags:', e)
      generateFallbackHashtags()
    } finally { setGenHashtags(false) } 
  }

  const copy = (text: string, type: string) => { navigator.clipboard.writeText(text); setCopied(type); setTimeout(() => setCopied(null), 2000) }

  const copyAll = () => {
    const fullText = `${caption}\n\n${hashtags}`.trim()
    navigator.clipboard.writeText(fullText)
    setCopied('all')
    setTimeout(() => setCopied(null), 2000)
  }

  const shareToWhatsApp = () => {
    const text = `${caption}\n\n${hashtags}`.trim()
    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }

  const generateFallbackCaption = () => {
    const emoji = tone === 'luxury' ? '✨' : tone === 'excited' ? '🎉' : tone === 'casual' ? '🏠' : '🏢'
    const beds = property.bedrooms ? `${property.bedrooms} bed` : ''
    const baths = property.bathrooms ? `${property.bathrooms} bath` : ''
    const sqft = property.squareFeet ? `${Number(property.squareFeet).toLocaleString()} sq ft` : ''
    const details = [beds, baths, sqft].filter(Boolean).join(' • ')
    const price = property.price ? `$${Number(property.price).toLocaleString()}` : ''
    
    setCaption(`${emoji} ${headline}\n\n📍 ${property.address || 'Beautiful Home'}${property.city ? `, ${property.city}` : ''}${property.state ? ` ${property.state}` : ''}\n${price ? `💰 ${price}\n` : ''}${details ? `${details}\n` : ''}\n📲 Contact us today for a private showing!`)
  }

  const generateFallbackHashtags = () => {
    const city = property.city?.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '') || ''
    const state = property.state?.toLowerCase().replace(/\s+/g, '') || ''
    const cityTag = city ? `#${city}realestate #${city}homes` : ''
    const stateTag = state ? `#${state}realestate` : ''
    
    setHashtags(`#realestate #luxuryrealestate #homeforsale #dreamhome #justlisted #realtor #property #househunting #newhome #luxuryhomes #realtorlife #homesforsale ${cityTag} ${stateTag}`.trim())
  }

  const prop = { address: property.address || '123 Main Street', city: property.city || 'Los Angeles', state: property.state || 'CA', price: property.price || undefined, bedrooms: property.bedrooms || undefined, bathrooms: property.bathrooms || undefined, squareFeet: property.squareFeet || undefined }
  const currentTemplates = getTemplates(platform).filter(t => t.category === category).filter(t => t.category === category)
  const dims = getDims(platform)
  const currentPlatform = PLATFORMS.find(p => p.id === platform)!
  const isVertical = platform === 'story' || platform === 'tiktok'

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col overflow-hidden">
      {/* Hidden download */}
      <div className="fixed -left-[9999px]" style={{ width: dims.w, height: dims.h }}>
        <div ref={downloadRef} style={{ width: dims.w, height: dims.h }}>
          {platform === 'instagram' && <TemplateRenderer templateId={templates[platform].id} photoUrl={photoUrl} property={prop} brand={brand} headline={headline} />}
          {(platform === 'facebook' || platform === 'linkedin') && <FacebookTemplateRenderer templateId={templates[platform].id} photoUrl={photoUrl} property={prop} brand={brand} headline={headline} />}
          {isVertical && <VerticalTemplateRenderer templateId={templates[platform].id} photoUrl={photoUrl} property={prop} brand={brand} headline={headline} />}
        </div>
      </div>

      {/* Header */}
      <header className="flex-shrink-0 h-12 px-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/content-studio" className="text-white/50 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
          <h1 className="text-sm font-semibold">{listingTitle || 'Create Content'}</h1>
        </div>
        <Button 
          size="sm" 
          onClick={downloadAllPlatforms}
          disabled={downloading !== null}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs h-8 px-4"
        >
          {downloading === 'all' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
          Download All Platforms
        </Button>
      </header>

      {/* Platform Tabs */}
      <div className="flex-shrink-0 h-10 px-4 border-b border-white/5 flex items-center gap-2">
        {PLATFORMS.map(p => (
          <button key={p.id} onClick={() => { setPlatform(p.id); if (!p.supportsCarousel) setPostMode('single') }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${platform === p.id ? `bg-gradient-to-r ${p.gradient} text-white` : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
            <p.icon className="w-3.5 h-3.5" />{p.name}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
        {/* LEFT - Compact Controls + Templates */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto ">
          {/* Mode & Type - Compact */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            {currentPlatform.supportsCarousel && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => { setPostMode('single'); setSelectedPhotos([]) }} className={`py-2 rounded-lg text-xs font-medium transition ${postMode === 'single' ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/60'}`}><ImageIcon className="w-3.5 h-3.5 inline mr-1" />Single</button>
                <button onClick={() => setPostMode('carousel')} className={`py-2 rounded-lg text-xs font-medium transition ${postMode === 'carousel' ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/60'}`}><Images className="w-3.5 h-3.5 inline mr-1" />Carousel</button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} className={`py-1.5 rounded-lg text-[11px] font-medium transition ${category === c.id ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/60'}`}>{c.icon} {c.name}</button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <Label className="text-[10px] text-white/40 uppercase mb-2 block">Templates</Label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {currentTemplates.map(t => (
                <button key={t.id} onClick={() => {
                  setTemplates(prev => ({ ...prev, [platform]: t }));
                  trackEvent(SnapREvents.TEMPLATE_SELECTED, { type: t.category });
                }} className={`aspect-square rounded-lg border-2 transition overflow-hidden ${templates[platform].id === t.id ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' : 'border-white/10 hover:border-white/30'}`}>
                  <div className="w-full h-full relative overflow-hidden bg-black">
                    <div className="absolute inset-0 scale-[0.12] origin-top-left pointer-events-none" style={{ width: '833%', height: '833%' }}>
                      {platform === 'instagram' && <TemplateRenderer templateId={t.id} photoUrl={photoUrl || DEFAULT_PHOTO} property={prop} brand={brand} headline={headline} />}
                      {(platform === 'facebook' || platform === 'linkedin') && <FacebookTemplateRenderer templateId={t.id} photoUrl={photoUrl || DEFAULT_PHOTO} property={prop} brand={brand} headline={headline} />}
                      {isVertical && <VerticalTemplateRenderer templateId={t.id} photoUrl={photoUrl || DEFAULT_PHOTO} property={prop} brand={brand} headline={headline} />}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent py-1">
                      <span className="text-[7px] text-white/90 font-medium block text-center truncate px-0.5">{t.name}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER - Preview */}
        <div className="col-span-6 flex flex-col gap-3">
          <div className={`flex-1 flex items-center justify-center ${isVertical ? 'py-2' : ''}`}>
            <div className={`${isVertical ? 'h-full aspect-[9/16]' : platform === 'instagram' ? 'w-full max-w-[400px] aspect-square' : 'w-full aspect-video'} max-h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 relative`}>
              <div className="absolute inset-0 origin-top-left" style={{
                transform: platform === 'instagram' ? 'scale(0.37)' : isVertical ? 'scale(0.25)' : 'scale(0.33)',
                width: platform === 'instagram' ? '1080px' : isVertical ? '1080px' : '1200px',
                height: platform === 'instagram' ? '1080px' : isVertical ? '1920px' : platform === 'facebook' ? '630px' : '627px'
              }}>
                {platform === 'instagram' && <TemplateRenderer templateId={templates[platform].id} photoUrl={photoUrl} property={prop} brand={brand} headline={headline} />}
                {(platform === 'facebook' || platform === 'linkedin') && <FacebookTemplateRenderer templateId={templates[platform].id} photoUrl={photoUrl} property={prop} brand={brand} headline={headline} />}
                {isVertical && <VerticalTemplateRenderer templateId={templates[platform].id} photoUrl={photoUrl} property={prop} brand={brand} headline={headline} />}
              </div>
            </div>
          </div>

          {/* Download Success Banner */}
          {downloadSuccess && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-400">Downloaded! Ready to post</p>
                <p className="text-xs text-green-400/70">Open Instagram/Facebook and upload your image</p>
              </div>
            </div>
          )}

          {/* Primary Actions - Download Focused */}
          <div className="flex gap-3">
            {postMode === 'carousel' ? (
              <Button onClick={downloadCarousel} disabled={downloading !== null || selectedPhotos.length < 2} className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-bold h-12 text-sm">
                {downloading === 'carousel' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Package className="w-5 h-5 mr-2" />Download ZIP ({selectedPhotos.length} slides)</>}
              </Button>
            ) : (
              <Button onClick={() => download(platform)} disabled={downloading !== null} className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-bold h-12 text-sm">
                {downloading === platform ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5 mr-2" />Download for {currentPlatform.name}</>}
              </Button>
            )}
          </div>

          {/* Secondary Actions - Copy & Share */}
          <div className="flex gap-2">
            <Button 
              onClick={copyAll} 
              disabled={!caption && !hashtags}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white h-10 text-sm font-medium"
            >
              {copied === 'all' ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <ClipboardCopy className="w-4 h-4 mr-2" />}
              {copied === 'all' ? 'Copied!' : 'Copy Caption'}
            </Button>
            <Button 
              onClick={shareToWhatsApp}
              disabled={!caption && !hashtags}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </Button>
          </div>

          {/* AI Caption */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">AI Copy Generator</span>
              </div>
              <div className="flex gap-1">
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} className={`w-7 h-7 rounded-lg text-sm transition ${tone === t.id ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'}`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateCaption} disabled={genCaption} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-10 text-sm font-medium">
                {genCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" />Generate Caption</>}
              </Button>
              <Button onClick={generateHashtags} disabled={genHashtags} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white h-10 text-sm font-medium">
                {genHashtags ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Hash className="w-4 h-4 mr-2" />Generate Hashtags</>}
              </Button>
            </div>
            {(caption || hashtags) && (
              <div className="mt-3 bg-black/40 rounded-lg p-3 text-sm text-white/80 max-h-24 overflow-y-auto">
                {caption && <p className="mb-2">{caption}</p>}
                {hashtags && <p className="text-blue-400 text-xs">{hashtags}</p>}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT - Property Details */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto ">
          {/* Headline */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <Label className="text-[10px] text-white/40 uppercase mb-2 block">Headline</Label>
            <Input value={headline} onChange={e => setHeadline(e.target.value.toUpperCase())} className="bg-black/40 border-white/20 h-10 text-sm font-bold text-[#D4AF37]" />
          </div>

          {/* Property */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
            <Label className="text-[10px] text-white/40 uppercase block">Property Details</Label>
            <div>
              <Label className="text-[9px] text-white/30 mb-1 block">Address</Label>
              <Input value={property.address} onChange={e => setProperty(p => ({...p, address: e.target.value}))} placeholder="123 Main St" className="bg-black/40 border-white/20 h-9 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">City</Label>
                <Input value={property.city} onChange={e => setProperty(p => ({...p, city: e.target.value}))} placeholder="Los Angeles" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">State</Label>
                <Input value={property.state} onChange={e => setProperty(p => ({...p, state: e.target.value}))} placeholder="CA" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-[9px] text-white/30 mb-1 block">Price</Label>
              <Input type="number" value={property.price} onChange={e => setProperty(p => ({...p, price: e.target.value ? parseInt(e.target.value) : ''}))} placeholder="750000" className="bg-black/40 border-white/20 h-9 text-xs" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">Beds</Label>
                <Input type="number" value={property.bedrooms} onChange={e => setProperty(p => ({...p, bedrooms: e.target.value ? parseInt(e.target.value) : ''}))} placeholder="4" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">Baths</Label>
                <Input type="number" value={property.bathrooms} onChange={e => setProperty(p => ({...p, bathrooms: e.target.value ? parseFloat(e.target.value) : ''}))} placeholder="3" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">Sq Ft</Label>
                <Input type="number" value={property.squareFeet} onChange={e => setProperty(p => ({...p, squareFeet: e.target.value ? parseInt(e.target.value) : ''}))} placeholder="2500" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
            </div>
          </div>

          {/* Brand */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 uppercase">Brand</span>
              <Link href="/dashboard/brand" className="text-[10px] text-[#D4AF37] hover:underline">Edit →</Link>
            </div>
            <div className="flex items-center gap-3 p-2 bg-black/30 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold">{brand.business_name?.[0] || 'A'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{brand.business_name || 'Your Name'}</p>
                <p className="text-[10px] text-white/50 truncate">{brand.phone || 'Add phone'}</p>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
            <p className="text-[10px] text-purple-300 font-medium mb-2">💡 Quick Posting Tips</p>
            <ol className="text-[10px] text-white/50 space-y-1">
              <li>1. Download your post image</li>
              <li>2. Copy the caption & hashtags</li>
              <li>3. Open Instagram/Facebook app</li>
              <li>4. Upload image & paste caption</li>
              <li>5. Post! 🎉</li>
            </ol>
          </div>
        </div>
      </div>

      {/* BOTTOM - Photos Filmstrip */}
      <div className="flex-shrink-0 h-24 border-t border-white/10 bg-black/60 px-6 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-white/50 uppercase font-medium">Photos</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{photos.length}</span>
          {postMode === 'carousel' && selectedPhotos.length > 0 && <span className="text-xs bg-[#D4AF37] text-black px-2 py-0.5 rounded-full font-medium">{selectedPhotos.length} selected</span>}
        </div>
        {photos.length > 0 ? (
          <div className="flex-1 flex gap-3 overflow-x-auto py-2">
            {photos.map((url, i) => {
              const selected = postMode === 'carousel' ? selectedPhotos.includes(url) : photoUrl === url
              return (
                <button key={i} onClick={() => selectPhoto(url)} className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selected ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 scale-105' : 'border-white/20 hover:border-white/40'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {postMode === 'carousel' && selected && <div className="absolute top-0 left-0 w-5 h-5 bg-[#D4AF37] rounded-br-lg text-[10px] font-bold text-black flex items-center justify-center">{selectedPhotos.indexOf(url) + 1}</div>}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-orange-400">No enhanced photos available</span>
            <Link href="/dashboard" className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition">Enhance Photos →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
