'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { Download, Loader2, Check, Sparkles, Instagram, Facebook, Linkedin, Image, Hash, ClipboardCopy, MessageCircle, Images, ImageIcon, CheckCircle, AlertCircle, FolderOpen, Calendar, ChevronRight } from "lucide-react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { INSTAGRAM_POST_TEMPLATES, FACEBOOK_POST_TEMPLATES, LINKEDIN_POST_TEMPLATES, VERTICAL_TEMPLATES, TemplateDefinition, TEMPLATE_CATEGORIES } from '@/lib/content/templates'
import { trackEvent, SnapREvents } from '@/lib/analytics'
import { ScheduleModal } from './schedule-modal'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { TemplateSelector } from './TemplateSelector'
import { ContentEditor } from './ContentEditor'
import { PlatformPreview } from './PlatformPreview'
import { TemplateRenderer, FacebookTemplateRenderer, VerticalTemplateRenderer } from './template-renderer'

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'story'
type Tone = 'professional' | 'casual' | 'luxury' | 'excited'
type PostMode = 'single' | 'carousel'

interface ListingPhoto {
  id: string
  raw_url: string | null
  processed_url: string | null
  status: string | null
  display_order: number | null
}

interface ListingRecord {
  address: string | null
  city: string | null
  state: string | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  property_type: string | null
  features: string[] | null
  photos: ListingPhoto[] | null
  [key: string]: unknown
}

interface ListingData {
  listing: ListingRecord
}

const PLATFORMS = [
  { id: 'instagram' as Platform, name: 'Instagram', icon: Instagram, dimensions: '1080×1080', gradient: 'from-purple-500 to-pink-500', supportsCarousel: true },
  { id: 'story' as Platform, name: 'Story', icon: Image, dimensions: '1080×1920', gradient: 'from-purple-600 to-orange-500', supportsCarousel: false },
  { id: 'facebook' as Platform, name: 'Facebook', icon: Facebook, dimensions: '1200×630', gradient: 'from-blue-600 to-blue-400', supportsCarousel: true },
  { id: 'linkedin' as Platform, name: 'LinkedIn', icon: Linkedin, dimensions: '1200×627', gradient: 'from-blue-700 to-blue-500', supportsCarousel: true },
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
  twitter: 'https://x.com/compose/post',
  story: 'https://www.instagram.com/',
}

export function UnifiedCreator() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  const renovatedImageUrl = searchParams.get('renovatedImage') // NEW: Get renovated image from URL
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, _setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [listingTitle, setListingTitle] = useState('')
  const [tone, setTone] = useState<Tone>('professional')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [genCaption, setGenCaption] = useState(false)
  const [genHashtags, setGenHashtags] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set())

  const [property, setProperty] = useState({ address: '', city: '', state: '', price: null as number | null, bedrooms: null as number | null, bathrooms: null as number | null, squareFeet: null as number | null, propertyType: 'House' as string })
  const [listingData, setListingData] = useState<ListingData | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [brand, setBrand] = useState({ business_name: '', logo_url: '', primary_color: '#D4AF37', secondary_color: '#1A1A1A', phone: '', tagline: '' })

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const loadFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg()
        ffmpegRef.current = ffmpeg
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        })
        setFfmpegLoaded(true)
      } catch (error: unknown) { console.error('FFmpeg load error:', error) }
    }
    //loadFFmpeg()
  }, [])

  // Fetch connected social platforms for direct API publishing
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await fetch('/api/social/connections', { signal: AbortSignal.timeout(15000) })
        if (!res.ok) return
        const data = await res.json()
        const platforms = new Set<string>(
          (data.connections || []).map((c: { platform: string }) => c.platform)
        )
        setConnectedPlatforms(platforms)
      } catch {
        // Silently ignore — fallback to download+open behavior
      }
    }
    loadConnections()
  }, [])

  // Load listing data and photos
  useEffect(() => {
    const loadListingData = async () => {
      if (!listingId) return

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: listing } = await supabase
        .from('listings')
        .select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status, display_order)')
        .eq('id', listingId)
        .single()

      if (listing) {
        setListingTitle(listing.title || listing.address || 'Property')
        setListingData({ listing } as ListingData)
        setProperty({
          address: listing.address || '',
          city: listing.city || '',
          state: listing.state || '',
          price: listing.price || null,
          bedrooms: listing.bedrooms || null,
          bathrooms: listing.bathrooms || null,
          squareFeet: listing.square_feet || null,
          propertyType: listing.property_type || 'House'
        })

        // Load photos
        const sortedPhotos = (listing.photos || [])
          .sort((a: ListingPhoto, b: ListingPhoto) => (a.display_order || 0) - (b.display_order || 0))

        const photoUrls = await Promise.all(sortedPhotos.map(async (photo: ListingPhoto) => {
          const path = photo.processed_url || photo.raw_url
          if (!path) return null
          if (path.startsWith('http')) return path
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
          return data?.signedUrl || null
        }))

        setPhotos(photoUrls.filter(Boolean) as string[])

        // Auto-select first photo
        if (photoUrls.length > 0 && photoUrls[0]) {
          setPhotoUrl(photoUrls[0] as string)
        }
      }
    }

    loadListingData()
  }, [listingId])

  // Auto-detect and pre-fill from marketing pipeline when listing has completed marketing
  const [marketingCaptions, setMarketingCaptions] = useState<Record<string, Record<string, string> | string> | null>(null)
  const [marketingLoaded, setMarketingLoaded] = useState(false)
  const [captionManuallyEdited, setCaptionManuallyEdited] = useState(false)

  // Fetch marketing captions when listing is selected (auto-detect or via prefill param)
  useEffect(() => {
    if (!listingId) return

    const loadMarketingContent = async () => {
      try {
        const res = await fetch(`/api/marketing/status?listingId=${listingId}`)
        if (!res.ok) return
        const data = await res.json()
        const job = data.marketingJob
        if (!job || job.status !== 'completed') return

        // Cache all captions
        const captions = job.captions?.result
        if (captions && typeof captions === 'object') {
          setMarketingCaptions(captions as Record<string, Record<string, string> | string>)
          setMarketingLoaded(true)
        }
      } catch (error: unknown) {
        console.error('Error loading marketing content for prefill:', error)
      }
    }

    // Small delay to ensure listing data loads first
    const timer = setTimeout(loadMarketingContent, 500)
    return () => clearTimeout(timer)
  }, [listingId])

  // Apply cached caption when platform changes (only if user hasn't manually edited)
  useEffect(() => {
    if (!marketingCaptions || captionManuallyEdited) return

    const platformCaption = marketingCaptions[platform] || marketingCaptions.instagram || marketingCaptions.facebook || marketingCaptions.linkedin
    if (platformCaption) {
      const captionText = typeof platformCaption === 'string' ? platformCaption : platformCaption?.caption || platformCaption?.text || ''
      const hashtagsText = typeof platformCaption === 'object' ? platformCaption?.hashtags : null
      if (captionText) setCaption(captionText)
      if (hashtagsText) {
        setHashtags(Array.isArray(hashtagsText) ? hashtagsText.join(' ') : String(hashtagsText))
      }
    }
  }, [platform, marketingCaptions, captionManuallyEdited])

  const selectPhoto = (url: string) => {
    if (postMode === 'carousel') {
      setSelectedPhotos(prev => prev.includes(url) ? prev.filter(u => u !== url) : prev.length < 10 ? [...prev, url] : prev)
    } else {
      setPhotoUrl(url)
    }
  }

  // Generate image blob from canvas - with better error handling
  const generateImageBlob = async (): Promise<Blob | null> => {
    if (!downloadRef.current) {
      console.error('Download ref not found')
      return null
    }

    try {
      const { w, h } = getDims(platform)
      // Wait for images to load
      await new Promise(r => setTimeout(r, 300))

      const canvas = await html2canvas(downloadRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#000000',
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure images are loaded in cloned document
          const images = clonedDoc.querySelectorAll('img')
          images.forEach(img => {
            img.crossOrigin = 'anonymous'
          })
        }
      })

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas')
          }
          resolve(blob)
        }, 'image/png', 1.0)
      })
    } catch (error: unknown) {
      console.error('html2canvas error:', error)
      return null
    }
  }

  // Get full caption text
  const getFullCaption = () => {
    return `${caption}\n\n${hashtags}`.trim()
  }

  // Upload to platform - uses Web Share API on mobile, fallback on desktop
  const uploadToPlatform = async (targetPlatform: string) => {
    setUploading(targetPlatform)
    setUploadSuccess(null)
    setUploadError(null)

    try {
      const imageBlob = await generateImageBlob()

      if (!imageBlob) {
        // Fallback: If image generation fails, just copy caption and open platform
        const fullCaption = getFullCaption()
        if (fullCaption) {
          await navigator.clipboard.writeText(fullCaption)
        }
        window.open(PLATFORM_URLS[targetPlatform] || PLATFORM_URLS[platform], '_blank')
        setUploadError('Could not generate image. Caption copied, platform opened.')
        setUploading(null)
        return
      }

      const fullCaption = getFullCaption()
      const fileName = `${targetPlatform}-post-${Date.now()}.png`
      const file = new File([imageBlob], fileName, { type: 'image/png' })

      // Check if Web Share API is available with file sharing (mainly mobile)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        // Mobile: Use Web Share API - opens native share sheet
        await navigator.share({
          files: [file],
          title: listingTitle || 'Property Post',
          text: fullCaption,
        })
        setUploadSuccess(targetPlatform)
      } else {
        // Determine the publish key (story maps to instagram)
        const publishKey = targetPlatform === 'story' ? 'instagram' : targetPlatform
        const isConnected = connectedPlatforms.has(publishKey)

        // Upload the generated image to storage for permanent URL
        const formData = new FormData()
        formData.append('file', imageBlob, fileName)
        formData.append('folder', isConnected ? 'social-posts' : 'content-library')

        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(15000),
        })
        const uploadData = await uploadRes.json()
        const permanentImageUrl = uploadData.url || photoUrl

        if (isConnected) {
          // Connected platform: Publish directly via API
          const publishRes = await fetch('/api/social/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: publishKey,
              content: fullCaption,
              imageUrls: [permanentImageUrl],
              listingId: listingId || undefined,
            }),
            signal: AbortSignal.timeout(30000),
          })
          const publishData = await publishRes.json()
          if (!publishRes.ok) throw new Error(publishData.error || 'Failed to publish')

          setUploadSuccess(`published-${targetPlatform}`)
        } else {
          // Not connected: Download image, copy caption, open platform
          const link = document.createElement('a')
          link.href = URL.createObjectURL(imageBlob)
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(link.href)

          if (fullCaption) {
            await navigator.clipboard.writeText(fullCaption)
          }

          const platformUrl = PLATFORM_URLS[targetPlatform] || PLATFORM_URLS[platform]
          window.open(platformUrl, '_blank')

          setUploadSuccess(targetPlatform)
        }

        // Save to content library
        try {
          await fetch('/api/content-library', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${targetPlatform.charAt(0).toUpperCase() + targetPlatform.slice(1)} post - ${new Date().toLocaleDateString()}`,
              category: headline?.toLowerCase().replace(/\s+/g, '-') || 'general',
              platform: targetPlatform,
              post_type: 'image',
              imageUrl: permanentImageUrl,
              caption: getFullCaption(),
            }),
            signal: AbortSignal.timeout(15000),
          })
        } catch (libErr) {
          console.error('Failed to save to library:', libErr)
        }
      }
    } catch (e: unknown) {
      // User cancelled share or error
      const error = e instanceof Error ? e : new Error('Unknown error')
      if (error.name !== 'AbortError') {
        console.error('Upload error:', e)
        setUploadError('Failed to process. Try "Download Only" button instead.')
      }
    } finally {
      setUploading(null)
      setTimeout(() => {
        setUploadSuccess(null)
        setUploadError(null)
      }, 5000)
    }
  }

  // Share to WhatsApp
  const shareToWhatsApp = async () => {
    setUploading('whatsapp')
    setUploadError(null)
    try {
      const imageBlob = await generateImageBlob()
      const fullCaption = getFullCaption()

      if (!imageBlob) {
        // Fallback: just open WhatsApp with text
        const encodedText = encodeURIComponent(fullCaption)
        window.open(`https://wa.me/?text=${encodedText}`, '_blank')
        setUploadSuccess('whatsapp')
        setUploading(null)
        return
      }

      const fileName = `property-post-${Date.now()}.png`
      const file = new File([imageBlob], fileName, { type: 'image/png' })

      // Check if Web Share API supports files
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: fullCaption,
        })
      } else {
        // Fallback: Download image and open WhatsApp with text
        const link = document.createElement('a')
        link.href = URL.createObjectURL(imageBlob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Open WhatsApp with caption
        const encodedText = encodeURIComponent(fullCaption)
        window.open(`https://wa.me/?text=${encodedText}`, '_blank')
      }
      setUploadSuccess('whatsapp')
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error')
      if (error.name !== 'AbortError') {
        console.error('WhatsApp share error:', e)
        setUploadError('Failed to share. Try downloading manually.')
      }
    } finally {
      setUploading(null)
    }
  }

  // Download only (for users who prefer manual)
  const downloadOnly = async () => {
    setUploading('download')
    setUploadError(null)
    try {
      const imageBlob = await generateImageBlob()
      if (!imageBlob) {
        setUploadError('Failed to generate image. Please try again.')
        setUploading(null)
        return
      }

      const link = document.createElement('a')
      link.href = URL.createObjectURL(imageBlob)
      link.download = `${platform}-post-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      setUploadSuccess('download')
    } catch (error: unknown) {
      console.error('Download error:', error)
      setUploadError('Download failed. Please try again.')
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
        const res = await fetch(selectedPhotos[i], { signal: AbortSignal.timeout(15000) })
        const blob = await res.blob()
        zip.file(`slide-${String(i+1).padStart(2,'0')}.jpg`, blob)
      }
      if (caption || hashtags) zip.file('caption.txt', getFullCaption())
      const blob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `carousel-${selectedPhotos.length}-slides.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setUploadSuccess('carousel')
    } catch (error: unknown) { console.error(error) } finally { setUploading(null) }
  }

  // Publish carousel directly to platform via API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publishCarousel = async (targetPlatform: 'instagram' | 'facebook' | 'linkedin') => {
    if (selectedPhotos.length < 2) return
    setUploading(targetPlatform)
    setUploadError(null)
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: targetPlatform,
          content: getFullCaption(),
          imageUrls: selectedPhotos,
          listingId,
        }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to publish')
      setUploadSuccess(targetPlatform)
      if (data.url) setTimeout(() => window.open(data.url, '_blank'), 1000)
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error')
      setUploadError(error.message || 'Failed to publish carousel')
    } finally {
      setUploading(null)
    }
  }

  // Generate video from carousel photos and open platform
  const generateCarouselVideo = async (targetPlatform: 'instagram' | 'facebook' | 'linkedin') => {
    if (selectedPhotos.length < 2) return
    if (!ffmpegLoaded || !ffmpegRef.current) {
      setUploadError('Video encoder still loading, please wait...')
      return
    }

    setUploading(targetPlatform)
    setUploadError(null)
    setVideoProgress(0)

    try {
      const ffmpeg = ffmpegRef.current
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = 1080
      canvas.height = 1080

      // Load all images
      const images: HTMLImageElement[] = []
      for (const url of selectedPhotos) {
        const img = document.createElement('img')
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = url
        })
        images.push(img)
      }

      // Generate frames (3 seconds per image at 30fps = 90 frames per image)
      const fps = 30
      const secondsPerImage = 3
      const framesPerImage = fps * secondsPerImage
      const totalFrames = images.length * framesPerImage

      for (let i = 0; i < images.length; i++) {
        const img = images[i]

        // Draw image (cover fit)
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2

        for (let f = 0; f < framesPerImage; f++) {
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

          // Add text overlay
          ctx.fillStyle = 'rgba(0,0,0,0.5)'
          ctx.fillRect(0, canvas.height - 80, canvas.width, 80)
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 28px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(listingTitle || 'Property Listing', canvas.width / 2, canvas.height - 35)

          const frameNum = i * framesPerImage + f
          const blob = await new Promise<Blob>((r) => canvas.toBlob(b => r(b!), 'image/jpeg', 0.9))
          await ffmpeg.writeFile(`frame${String(frameNum).padStart(5, '0')}.jpg`, await fetchFile(blob))

          setVideoProgress(Math.round((frameNum / totalFrames) * 80))
        }
      }

      setVideoProgress(85)

      // Generate video
      await ffmpeg.exec([
        '-framerate', '30',
        '-i', 'frame%05d.jpg',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-y', 'output.mp4'
      ])

      setVideoProgress(95)

      const mp4Data = await ffmpeg.readFile('output.mp4')
      const mp4Bytes = mp4Data instanceof Uint8Array ? mp4Data : new TextEncoder().encode(mp4Data)
      const mp4Buffer = new ArrayBuffer(mp4Bytes.byteLength)
      new Uint8Array(mp4Buffer).set(mp4Bytes)
      const mp4Blob = new Blob([mp4Buffer], { type: 'video/mp4' })

      // Download
      const link = document.createElement('a')
      link.href = URL.createObjectURL(mp4Blob)
      link.download = `${targetPlatform}-reel-${selectedPhotos.length}-photos.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      // Copy caption
      const fullCaption = getFullCaption()
      if (fullCaption) await navigator.clipboard.writeText(fullCaption)

      // Open platform
      const urls: Record<string, string> = {
        instagram: 'https://www.instagram.com/',
        facebook: 'https://www.facebook.com/',
        linkedin: 'https://www.linkedin.com/feed/',
      }
      setTimeout(() => window.open(urls[targetPlatform], '_blank'), 500)

      setVideoProgress(100)
      setUploadSuccess(targetPlatform)

      // Cleanup
      for (let i = 0; i < totalFrames; i++) {
        try { await ffmpeg.deleteFile(`frame${String(i).padStart(5, '0')}.jpg`) } catch {}
      }
      try { await ffmpeg.deleteFile('output.mp4') } catch {}

    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error')
      console.error('Video generation error:', e)
      setUploadError('Failed to generate video: ' + error.message)
    } finally {
      setUploading(null)
      setVideoProgress(0)
    }
  }

  // Copy caption to clipboard
  const copyCaption = async () => {
    const text = getFullCaption()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied('caption')
    setTimeout(() => setCopied(null), 2000)
  }

  const generateCaption = async () => {
    setGenCaption(true)
    try {
      // Convert category from dash format (just-listed) to underscore format (just_listed) for API
      const contentType = category.replace(/-/g, '_')

      // Use listingData as primary source, fallback to property state (form values)
      const propertyData = {
        address: listingData?.listing?.address || property.address || '',
        city: listingData?.listing?.city || property.city || '',
        state: listingData?.listing?.state || property.state || '',
        price: listingData?.listing?.price || property.price || '',
        bedrooms: listingData?.listing?.bedrooms || property.bedrooms || '',
        bathrooms: listingData?.listing?.bathrooms || property.bathrooms || '',
        squareFeet: listingData?.listing?.square_feet || property.squareFeet || '',
        propertyType: listingData?.listing?.property_type || property.propertyType || 'House',
        features: []
      }

      const res = await fetch('/api/copy/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform === 'story' ? 'instagram' : platform,
          tone,
          includeEmojis: true,
          includeCallToAction: true,
          contentType: contentType,
          property: {
            address: propertyData.address || undefined,
            city: propertyData.city || undefined,
            state: propertyData.state || undefined,
            price: propertyData.price || undefined,
            bedrooms: propertyData.bedrooms || undefined,
            bathrooms: propertyData.bathrooms || undefined,
            squareFeet: propertyData.squareFeet || undefined,
            propertyType: propertyData.propertyType,
            features: propertyData.features
          }
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.caption) { setCaption(data.caption); setCaptionManuallyEdited(true) }
      else if (data.error) console.error('Caption error:', data.error)
    } catch (error: unknown) {
      console.error('Failed to generate caption:', error)
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
          property: {
            address: property.address || undefined,
            city: property.city || undefined,
            state: property.state || undefined,
            price: property.price || undefined,
            bedrooms: property.bedrooms || undefined,
            bathrooms: property.bathrooms || undefined,
            squareFeet: property.squareFeet || undefined,
            propertyType: property.propertyType || 'House',
            features: []
          }
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.hashtagsText) setHashtags(data.hashtagsText)
      else if (data.hashtags) setHashtags(Array.isArray(data.hashtags) ? data.hashtags.join(' ') : data.hashtags)
      else if (data.error) console.error('Hashtags error:', data.error)
    } catch (error: unknown) {
      console.error('Failed to generate hashtags:', error)
      generateFallbackHashtags()
    } finally { setGenHashtags(false) }
  }

  const generateFallbackCaption = () => {
    const price = property.price ? `$${Number(property.price).toLocaleString()}` : ''
    const beds = property.bedrooms ? `${property.bedrooms} bed` : ''
    const baths = property.bathrooms ? `${property.bathrooms} bath` : ''
    const sqft = property.squareFeet ? `${Number(property.squareFeet).toLocaleString()} sq ft` : ''
    const location = [property.city, property.state].filter(Boolean).join(', ')

    const details = [beds, baths, sqft].filter(Boolean).join(' | ')

    let text = `✨ ${headline}\n\n`
    if (property.address) text += `📍 ${property.address}\n`
    if (location) text += `🏙️ ${location}\n`
    if (price) text += `💰 ${price}\n`
    if (details) text += `🏠 ${details}\n`
    text += `\n📞 Contact me for more information!`

    setCaption(text)
    setCaptionManuallyEdited(true)
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

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent-gold" /></div>


  // Save post to library
  const saveToLibrary = async () => {
    try {
      const blob = await generateImageBlob()
      let imageUrl = ''
      if (blob) {
        const reader = new FileReader()
        imageUrl = await new Promise(resolve => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      }
      const res = await fetch('/api/content-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: headline + ' - ' + (listingTitle || 'Untitled'),
          category: headline.toLowerCase().replace(/ /g, "-"),
          platform,
          postType: postMode,
          templateId: templates[platform]?.id || "default",
          imageUrl,
          caption: getFullCaption(),
          hashtags: hashtags,
          propertyData: { address: property.address, city: property.city, state: property.state, price: property.price, beds: property.bedrooms, baths: property.bathrooms, sqft: property.squareFeet }
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) { alert('Saved to library!'); } else { const err = await res.json(); alert('Save failed: ' + (err.error || 'Unknown error')); console.error('Save failed:', err); }
    } catch (error: unknown) { console.error('Save error:', error) }
  }

  // Schedule post for future publishing
  const handleSchedulePost = async (scheduledAt: string) => {
    setUploading('schedule')
    setUploadError(null)
    try {
      const fullCaption = getFullCaption()
      const schedulePlatform = platform === 'story' ? 'instagram' : platform
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listingId || null,
          platform: schedulePlatform,
          postType: headline.toLowerCase().replace(/ /g, '_'),
          content: fullCaption,
          imageUrls: [photoUrl],
          scheduledFor: scheduledAt,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to schedule')
      }
      setUploadSuccess('schedule')
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error')
      setUploadError(error.message || 'Failed to schedule post')
    } finally {
      setUploading(null)
    }
  }

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
        <nav className="flex items-center gap-1.5 text-xs">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <Link href="/dashboard/content-studio" className="text-white/40 hover:text-white transition-colors">Content Studio</Link>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <span className="text-white font-medium truncate max-w-[200px]">{listingTitle || 'Create Content'}</span>
          {renovatedImageUrl && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full ml-1.5">Renovated</span>}
        </nav>
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
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
        {/* LEFT - Compact Controls + Templates */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          {/* Mode & Type - Compact */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            {currentPlatform.supportsCarousel && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => { setPostMode('single'); setSelectedPhotos([]) }} className={`py-2 rounded-lg text-xs font-medium transition ${postMode === 'single' ? 'bg-accent-gold text-black' : 'bg-white/10 text-white/60'}`}><ImageIcon className="w-3.5 h-3.5 inline mr-1" />Single</button>
                <button onClick={() => setPostMode('carousel')} className={`py-2 rounded-lg text-xs font-medium transition ${postMode === 'carousel' ? 'bg-accent-gold text-black' : 'bg-white/10 text-white/60'}`}><Images className="w-3.5 h-3.5 inline mr-1" />Carousel</button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} className={`py-1.5 rounded-lg text-[11px] font-medium transition ${category === c.id ? 'bg-accent-gold text-black' : 'bg-white/10 text-white/60'}`}>{c.icon} {c.name}</button>
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
                }} className={`aspect-square rounded-lg border-2 transition overflow-hidden ${templates[platform].id === t.id ? 'border-accent-gold ring-2 ring-accent-gold/50' : 'border-white/10 hover:border-white/30'}`}>
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

        {/* CENTER - Preview + Upload + AI Copy (scrollable) */}
        <div className="col-span-6 flex flex-col gap-3 overflow-y-auto pr-2">
          {/* Preview */}
          <div className={`flex items-center justify-center ${isVertical ? 'py-2' : ''}`}>
            <div className={`${isVertical ? 'h-[280px] aspect-[9/16]' : platform === 'instagram' ? 'w-full max-w-[320px] aspect-square' : 'w-full max-w-[400px] aspect-[1200/630]'} max-h-[350px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 relative`}>
              <div className="absolute inset-0 origin-top-left" style={{
                transform: platform === 'instagram' ? 'scale(0.30)' : isVertical ? 'scale(0.15)' : 'scale(0.27)',
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
                   uploadSuccess === 'schedule' ? 'Post Scheduled!' :
                   uploadSuccess.startsWith('published-') ? `Published to ${uploadSuccess.replace('published-', '').charAt(0).toUpperCase() + uploadSuccess.replace('published-', '').slice(1)}!` :
                   `Ready to upload to ${uploadSuccess}!`}
                </p>
                <p className="text-xs text-green-400/70">
                  {uploadSuccess === 'download' ? 'Image saved to your device' :
                   uploadSuccess === 'carousel' ? 'ZIP file saved with all slides' :
                   uploadSuccess === 'whatsapp' ? 'Image shared successfully' :
                   uploadSuccess === 'schedule' ? 'Your post will be published automatically at the scheduled time' :
                   uploadSuccess.startsWith('published-') ? 'Your post is now live on your page!' :
                   'Caption copied • Platform opened • Just upload the image!'}
                </p>
              </div>
              <button onClick={() => setUploadSuccess(null)} className="text-green-400/50 hover:text-green-400">×</button>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400 flex-1">{uploadError}</p>
              <button onClick={() => setUploadError(null)} className="text-red-400/50 hover:text-red-400">×</button>
            </div>
          )}

          {/* Upload to Platform Buttons */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <Label className="text-[10px] text-white/40 uppercase mb-3 block">Upload To</Label>

            {postMode === 'carousel' ? (
              <>
                <p className="text-[10px] text-white/60 mb-2">Publish {selectedPhotos.length} photos as carousel:</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Button onClick={() => generateCarouselVideo('instagram')} disabled={uploading !== null || selectedPhotos.length < 2} className="h-11 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                    {uploading === 'instagram' ? <><Loader2 className="w-4 h-4 animate-spin" />{videoProgress > 0 && ` ${videoProgress}%`}</> : <><Instagram className="w-4 h-4 mr-1" />Reel</>}
                  </Button>
                  <Button onClick={() => generateCarouselVideo('facebook')} disabled={uploading !== null || selectedPhotos.length < 2} className="h-11 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold">
                    {uploading === 'facebook' ? <><Loader2 className="w-4 h-4 animate-spin" />{videoProgress > 0 && ` ${videoProgress}%`}</> : <><Facebook className="w-4 h-4 mr-1" />Reel</>}
                  </Button>
                  <Button onClick={() => generateCarouselVideo('linkedin')} disabled={uploading !== null || selectedPhotos.length < 2} className="h-11 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold">
                    {uploading === 'linkedin' ? <><Loader2 className="w-4 h-4 animate-spin" />{videoProgress > 0 && ` ${videoProgress}%`}</> : <><Linkedin className="w-4 h-4 mr-1" />Reel</>}
                  </Button>
                </div>
                <Button onClick={downloadCarousel} disabled={uploading !== null || selectedPhotos.length < 2} variant="outline" className="w-full bg-white/5 border-white/20 text-white/70 h-9 text-xs">
                  {uploading === 'carousel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-2" />Download ZIP</>}
                </Button>
                <Button onClick={saveToLibrary} disabled={uploading !== null || selectedPhotos.length < 2} variant="outline" className="w-full bg-white/5 border-white/20 text-white/70 h-9 text-xs mt-2">
                  <FolderOpen className="w-4 h-4 mr-2" />Save to Library
                </Button>
              </>
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

                {/* Schedule */}
                <Button
                  onClick={() => setShowScheduleModal(true)}
                  disabled={uploading !== null}
                  className="h-11 col-span-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold"
                >
                  {uploading === 'schedule' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calendar className="w-4 h-4 mr-2" />Schedule Post</>}
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

          {/* Auto-generated badge when pre-filled from marketing pipeline */}
          {marketingLoaded && caption && !captionManuallyEdited && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Auto-generated captions loaded from marketing pipeline</span>
              <span className="text-xs text-white/30 ml-auto">Edit freely below</span>
            </div>
          )}

          {/* AI Caption - FIXED: Now visible with proper spacing */}
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
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          {/* Headline */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <Label className="text-[10px] text-white/40 uppercase mb-2 block">Headline</Label>
            <Input value={headline} onChange={e => setHeadline(e.target.value.toUpperCase())} className="bg-black/40 border-white/20 h-10 text-sm font-bold text-accent-gold" />
          </div>

          {/* Property */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
            <Label className="text-[10px] text-white/40 uppercase block">Property Details</Label>
            <div>
              <Label className="text-[9px] text-white/30 mb-1 block">Address</Label>
              <Input id="property-address" value={property.address} onChange={e => setProperty(p => ({...p, address: e.target.value}))} placeholder="123 Main St" className="bg-black/40 border-white/20 h-9 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">City</Label>
                <Input id="property-city" value={property.city} onChange={e => setProperty(p => ({...p, city: e.target.value}))} placeholder="Los Angeles" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">State</Label>
                <Input id="property-state" value={property.state} onChange={e => setProperty(p => ({...p, state: e.target.value}))} placeholder="CA" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-[9px] text-white/30 mb-1 block">Price</Label>
              <Input id="property-price" type="number" value={property.price ?? ''} onChange={e => setProperty(p => ({...p, price: e.target.value ? parseInt(e.target.value) : null}))} placeholder="750000" className="bg-black/40 border-white/20 h-9 text-xs" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">Beds</Label>
                <Input id="property-bedrooms" type="number" value={property.bedrooms ?? ''} onChange={e => setProperty(p => ({...p, bedrooms: e.target.value ? parseInt(e.target.value) : null}))} placeholder="4" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">Baths</Label>
                <Input id="property-bathrooms" type="number" value={property.bathrooms ?? ''} onChange={e => setProperty(p => ({...p, bathrooms: e.target.value ? parseFloat(e.target.value) : null}))} placeholder="3" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
              <div>
                <Label className="text-[9px] text-white/30 mb-1 block">Sq Ft</Label>
                <Input id="property-sqft" type="number" value={property.squareFeet ?? ''} onChange={e => setProperty(p => ({...p, squareFeet: e.target.value ? parseInt(e.target.value) : null}))} placeholder="2500" className="bg-black/40 border-white/20 h-9 text-xs" />
              </div>
            </div>
          </div>

          {/* Brand */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 uppercase">Brand</span>
              <Link href="/dashboard/brand" className="text-[10px] text-accent-gold hover:underline">Edit →</Link>
            </div>
            <div className="flex items-center gap-3 p-2 bg-black/30 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-accent-gold flex items-center justify-center text-black font-bold">{brand.business_name?.[0] || 'A'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{brand.business_name || 'Your Name'}</p>
                <p className="text-[10px] text-white/50 truncate">{brand.phone || 'Add phone'}</p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-accent-gold/10 to-accent-gold/10 rounded-xl p-3 border border-accent-gold/20">
            <p className="text-[10px] text-accent-gold font-medium mb-2">📱 How Upload Works</p>
            <ol className="text-[10px] text-white/50 space-y-1">
              <li><span className="text-accent-gold">Mobile:</span> Opens share sheet → Select app → Post!</li>
              <li><span className="text-accent-gold">Desktop:</span> Downloads image → Opens platform → Upload & paste caption</li>
            </ol>
          </div>
        </div>
      </div>

      {/* BOTTOM - Photos Filmstrip - FIXED: Higher z-index, proper containment */}
      <div className="flex-shrink-0 h-24 border-t border-white/10 bg-black/80 px-6 flex items-center gap-4 relative z-10">
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-white/50 uppercase font-medium">Photos</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{photos.length}</span>
          {postMode === 'carousel' && selectedPhotos.length > 0 && <span className="text-xs bg-accent-gold text-black px-2 py-0.5 rounded-full font-medium">{selectedPhotos.length} selected</span>}
        </div>
        {photos.length > 0 ? (
          <div className="flex-1 flex gap-3 overflow-x-auto py-2">
            {photos.map((url, i) => {
              const selected = postMode === 'carousel' ? selectedPhotos.includes(url) : photoUrl === url
              const isRenovated = renovatedImageUrl && url === decodeURIComponent(renovatedImageUrl)
              return (
                <button key={i} onClick={() => selectPhoto(url)} className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selected ? 'border-accent-gold ring-2 ring-accent-gold/50 scale-105' : 'border-white/20 hover:border-white/40'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
<img src={url} alt="" className="w-full h-full object-cover" />
                  {postMode === 'carousel' && selected && <div className="absolute top-0 left-0 w-5 h-5 bg-accent-gold rounded-br-lg text-[10px] font-bold text-black flex items-center justify-center">{selectedPhotos.indexOf(url) + 1}</div>}
                  {isRenovated && <div className="absolute bottom-0 inset-x-0 bg-green-500/90 text-[8px] text-white text-center py-0.5">Renovated</div>}
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
      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleSchedulePost}
        platform={platform === 'story' ? 'instagram' : platform}
      />
    </div>
  )
}
