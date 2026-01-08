'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { ArrowLeft, Download, Loader2, Check, Sparkles, Instagram, Facebook, Linkedin, Video, Image, Copy, Hash, ClipboardCopy, Package, MessageCircle, Images, ImageIcon, Share2, CheckCircle, Upload, ExternalLink } from 'lucide-react'
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

// Platform URLs
const PLATFORM_URLS: Record<string, string> = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  linkedin: 'https://www.linkedin.com/feed/',
  tiktok: 'https://www.tiktok.com/upload',
  story: 'https://www.instagram.com/',
}

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
  const [uploading, setUploading] = useState<string | null>(null)
  const [listingTitle, setListingTitle] = useState('')
  const [tone, setTone] = useState<Tone>('professional')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [genCaption, setGenCaption] = useState(false)
  const [genHashtags, setGenHashtags] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

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

  // Generate image blob from canvas
  const generateImageBlob = async (): Promise<Blob | null> => {
    if (!downloadRef.current) return null
    const { w, h } = getDims(platform)
    await new Promise(r => setTimeout(r, 100))
    const canvas = await html2canvas(downloadRef.current, { 
      scale: 1, 
      useCORS: true, 
      allowTaint: true, 
      backgroundColor: null, 
      width: w, 
      height: h, 
      windowWidth: w, 
      windowHeight: h 
    })
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0)
    })
  }

  // Get full caption text
  const getFullCaption = () => {
    return `${caption}\n\n${hashtags}`.trim()
  }

  // Upload to platform - uses Web Share API on mobile, fallback on desktop
  const uploadToPlatform = async (targetPlatform: string) => {
    setUploading(targetPlatform)
    setUploadSuccess(null)

    try {
      const imageBlob = await generateImageBlob()
      if (!imageBlob) throw new Error('Failed to generate image')

      const fullCaption = getFullCaption()
      const fileName = `${targetPlatform}-post-${Date.now()}.png`
      const file = new File([imageBlob], fileName, { type: 'image/png' })

      // Check if Web Share API is available with file sharing (mainly mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        // Mobile: Use Web Share API - opens native share sheet
        await navigator.share({
          files: [file],
          title: listingTitle || 'Property Post',
          text: fullCaption,
        })
        setUploadSuccess(targetPlatform)
      } else {
        // Desktop fallback: Download image, copy caption, open platform
        
        // 1. Download the image
        const link = document.createElement('a')
        link.href = URL.createObjectURL(imageBlob)
        link.download = fileName
        link.click()

        // 2. Copy caption to clipboard
        await navigator.clipboard.writeText(fullCaption)

        // 3. Open the platform in new tab
        const platformUrl = PLATFORM_URLS[targetPlatform] || PLATFORM_URLS[platform]
        window.open(platformUrl, '_blank')

        setUploadSuccess(targetPlatform)
      }
    } catch (e: any) {
      // User cancelled share or error
      if (e.name !== 'AbortError') {
        console.error('Upload error:', e)
      }
    } finally {
      setUploading(null)
      if (uploadSuccess) {
        setTimeout(() => setUploadSuccess(null), 5000)
      }
    }
  }

  // Share to WhatsApp
  const shareToWhatsApp = async () => {
    setUploading('whatsapp')
    try {
      const imageBlob = await generateImageBlob()
      if (!imageBlob) throw new Error('Failed to generate image')

      const fullCaption = getFullCaption()
      const fileName = `property-post-${Date.now()}.png`
      const file = new File([imageBlob], fileName, { type: 'image/png' })

      // Check if Web Share API supports files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: fullCaption,
        })
      } else {
        // Fallback: Download image and open WhatsApp with text
        const link = document.createElement('a')
        link.href = URL.createObjectURL(imageBlob)
        link.download = fileName
        link.click()

        // Open WhatsApp with caption
        const encodedText = encodeURIComponent(fullCaption)
        window.open(`https://wa.me/?text=${encodedText}`, '_blank')
      }
      setUploadSuccess('whatsapp')
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('WhatsApp share error:', e)
      }
    } finally {
      setUploading(null)
    }
  }

  // Download only (for users who prefer manual)
  const downloadOnly = async () => {
    setUploading('download')
    try {
      const imageBlob = await generateImageBlob()
      if (!imageBlob) throw new Error('Failed to generate image')

      const link = document.createElement('a')
      link.href = URL.createObjectURL(imageBlob)
      link.download = `${platform}-post-${Date.now()}.png`
      link.click()

      setUploadSuccess('download')
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setUploading(null)
    }
  }

  // Download carousel as ZIP
  const downloadCarousel = async () => {
    if (selectedPhotos.length < 2) return
    setUploading('carousel')
    try { 
      const zip = new JSZip()
      for (let i = 0; i < selectedPhotos.length; i++) { 
        const res = await fetch(selectedPhotos[i])
        const blob = await res.blob()
        zip.file(`slide-${String(i+1).padStart(2,'0')}.jpg`, blob) 
      }
      if (caption || hashtags) zip.file('caption.txt', getFullCaption())
      const blob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `carousel-${selectedPhotos.length}-slides.zip`
      link.click()
      setUploadSuccess('carousel')
    } catch (e) { console.error(e) } finally { setUploading(null) }
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

  const copyCaption = () => { 
    navigator.clipboard.writeText(getFullCaption())
    setCopied('caption')
    setTimeout(() => setCopied(null), 2000) 
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
  const currentTemplates = getTemplates(platform).filter(t => t.category === category)
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
          onClick={downloadOnly}
          disabled={uploading !== null}
          className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 px-4"
        >
          <Download className="w-3 h-3 mr-1" />
          Download Only
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

          {/* Success Banner */}
          {uploadSuccess && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-400">
                  {uploadSuccess === 'download' ? 'Downloaded!' : 
                   uploadSuccess === 'carousel' ? 'Carousel downloaded!' :
                   uploadSuccess === 'whatsapp' ? 'Shared to WhatsApp!' :
                   `Ready to upload to ${uploadSuccess}!`}
                </p>
                <p className="text-xs text-green-400/70">
                  {uploadSuccess === 'download' ? 'Image saved to your device' :
                   uploadSuccess === 'carousel' ? 'ZIP file saved with all slides' :
                   uploadSuccess === 'whatsapp' ? 'Image shared successfully' :
                   'Caption copied • Platform opened • Just upload the image!'}
                </p>
              </div>
              <button onClick={() => setUploadSuccess(null)} className="text-green-400/50 hover:text-green-400">×</button>
            </div>
          )}

          {/* Upload to Platform Buttons */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <Label className="text-[10px] text-white/40 uppercase mb-3 block">Upload To</Label>
            
            {postMode === 'carousel' ? (
              <Button 
                onClick={downloadCarousel} 
                disabled={uploading !== null || selectedPhotos.length < 2} 
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-bold h-12 text-sm mb-3"
              >
                {uploading === 'carousel' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Package className="w-5 h-5 mr-2" />Download Carousel ({selectedPhotos.length} slides)</>}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Instagram */}
                <Button 
                  onClick={() => uploadToPlatform('instagram')}
                  disabled={uploading !== null}
                  className="h-11 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                >
                  {uploading === 'instagram' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Instagram className="w-4 h-4 mr-2" />Instagram</>}
                </Button>

                {/* Facebook */}
                <Button 
                  onClick={() => uploadToPlatform('facebook')}
                  disabled={uploading !== null}
                  className="h-11 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-semibold"
                >
                  {uploading === 'facebook' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Facebook className="w-4 h-4 mr-2" />Facebook</>}
                </Button>

                {/* LinkedIn */}
                <Button 
                  onClick={() => uploadToPlatform('linkedin')}
                  disabled={uploading !== null}
                  className="h-11 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white font-semibold"
                >
                  {uploading === 'linkedin' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Linkedin className="w-4 h-4 mr-2" />LinkedIn</>}
                </Button>

                {/* WhatsApp */}
                <Button 
                  onClick={shareToWhatsApp}
                  disabled={uploading !== null}
                  className="h-11 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold"
                >
                  {uploading === 'whatsapp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</>}
                </Button>
              </div>
            )}

            {/* Copy Caption */}
            <Button 
              onClick={copyCaption}
              disabled={!caption && !hashtags}
              className="w-full h-10 bg-white/10 hover:bg-white/20 text-white font-medium"
            >
              {copied === 'caption' ? <><Check className="w-4 h-4 mr-2 text-green-400" />Copied!</> : <><ClipboardCopy className="w-4 h-4 mr-2" />Copy Caption & Hashtags</>}
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
                {genCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" />Caption</>}
              </Button>
              <Button onClick={generateHashtags} disabled={genHashtags} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white h-10 text-sm font-medium">
                {genHashtags ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Hash className="w-4 h-4 mr-2" />Hashtags</>}
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

          {/* How It Works */}
          <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#B8960C]/10 rounded-xl p-3 border border-[#D4AF37]/20">
            <p className="text-[10px] text-[#D4AF37] font-medium mb-2">📱 How Upload Works</p>
            <ol className="text-[10px] text-white/50 space-y-1">
              <li><span className="text-[#D4AF37]">Mobile:</span> Opens share sheet → Select app → Post!</li>
              <li><span className="text-[#D4AF37]">Desktop:</span> Downloads image → Opens platform → Upload & paste caption</li>
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
