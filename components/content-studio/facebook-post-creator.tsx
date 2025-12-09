'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import { ArrowLeft, Download, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FacebookTemplateRenderer } from './template-renderer'
import { FACEBOOK_POST_TEMPLATES, LINKEDIN_POST_TEMPLATES, TEMPLATE_CATEGORIES, TemplateDefinition } from '@/lib/content/templates'

interface PropertyData {
  address: string
  city: string
  state: string
  price: number | ''
  bedrooms: number | ''
  bathrooms: number | ''
  squareFeet: number | ''
}

interface BrandData {
  business_name: string
  logo_url: string
  primary_color: string
  secondary_color: string
  phone: string
  tagline: string
}

interface SocialPostCreatorProps {
  platform: 'facebook' | 'linkedin'
}

export function SocialPostCreator({ platform }: SocialPostCreatorProps) {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  const templateRef = useRef<HTMLDivElement>(null)

  const templates = platform === 'facebook' ? FACEBOOK_POST_TEMPLATES : LINKEDIN_POST_TEMPLATES
  const dimensions = platform === 'facebook' ? { width: 1200, height: 630 } : { width: 1200, height: 627 }
  const platformName = platform === 'facebook' ? 'Facebook' : 'LinkedIn'

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(templates[0])
  const [selectedCategory, setSelectedCategory] = useState('just-listed')
  const [headline, setHeadline] = useState('JUST LISTED')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const previewImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop'

  const [property, setProperty] = useState<PropertyData>({
    address: '',
    city: '',
    state: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: ''
  })

  const [brand, setBrand] = useState<BrandData>({
    business_name: '',
    logo_url: '',
    primary_color: '#D4AF37',
    secondary_color: '#1A1A1A',
    phone: '',
    tagline: ''
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const brandRes = await fetch('/api/brand')
        const brandData = await brandRes.json()
        if (brandData.brandProfile) {
          setBrand({
            business_name: brandData.brandProfile.business_name || '',
            logo_url: brandData.brandProfile.logo_url || '',
            primary_color: brandData.brandProfile.primary_color || '#D4AF37',
            secondary_color: brandData.brandProfile.secondary_color || '#1A1A1A',
            phone: brandData.brandProfile.phone || '',
            tagline: brandData.brandProfile.tagline || ''
          })
        }

        if (listingId) {
          const listingRes = await fetch(`/api/listings?id=${listingId}`)
          const listingData = await listingRes.json()
          if (listingData.listing) {
            setProperty({
              address: listingData.listing.address || '',
              city: listingData.listing.city || '',
              state: listingData.listing.state || '',
              price: listingData.listing.price || '',
              bedrooms: listingData.listing.bedrooms || '',
              bathrooms: listingData.listing.bathrooms || '',
              squareFeet: listingData.listing.square_feet || ''
            })
          }
          
          if (listingData.photos && listingData.photos.length > 0) {
            const enhancedPhotos = listingData.photos
              .filter((p: any) => p.processed_url)
              .map((p: any) => p.signedProcessedUrl || p.processed_url)
            
            const originalPhotos = listingData.photos
              .map((p: any) => p.signedOriginalUrl || p.signedProcessedUrl || p.original_url)
              .filter(Boolean)
            
            const allPhotos = enhancedPhotos.length > 0 ? enhancedPhotos : originalPhotos
            setPhotos(allPhotos)
            if (allPhotos.length > 0) {
              setPhotoUrl(allPhotos[0])
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [listingId])

  useEffect(() => {
    const headlines: Record<string, string> = {
      'just-listed': 'JUST LISTED',
      'open-house': 'OPEN HOUSE',
      'price-reduced': 'PRICE REDUCED',
      'just-sold': 'JUST SOLD'
    }
    setHeadline(headlines[selectedCategory] || 'JUST LISTED')
  }, [selectedCategory])

  const updateProperty = (field: keyof PropertyData, value: string | number) => {
    setProperty(prev => ({ ...prev, [field]: value }))
  }

  const handleDownload = async () => {
    if (!templateRef.current) return

    setDownloading(true)
    try {
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: dimensions.width,
        height: dimensions.height
      })

      const link = document.createElement('a')
      link.download = `${platform}-post-${selectedTemplate.id}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download image. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/content-studio" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Content Studio
          </Link>
          <h1 className="text-2xl font-bold">Create {platformName} Post</h1>
          <p className="text-white/60">Select a template and customize your listing post</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Template Selection */}
          <div className="space-y-6">
            {/* Category Tabs */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <Label className="text-sm text-white/60 mb-3 block">Post Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Grid with Previews */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <Label className="text-sm text-white/60 mb-3 block">Select Template</Label>
              <div className="space-y-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full relative rounded-xl overflow-hidden border-2 transition-all ${
                      selectedTemplate.id === template.id
                        ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    {/* Mini Template Preview */}
                    <div className="aspect-video w-full relative overflow-hidden">
                      <div className="absolute inset-0 scale-[0.25] origin-top-left" style={{ width: '400%', height: '400%' }}>
                        <FacebookTemplateRenderer
                          templateId={template.id}
                          photoUrl={previewImage}
                          property={{ address: '123 Main St', city: 'Los Angeles', state: 'CA', price: 750000, bedrooms: 4, bathrooms: 3, squareFeet: 2500 }}
                          brand={{ business_name: 'Agent Name', primary_color: '#D4AF37', secondary_color: '#1A1A1A', phone: '(555) 123-4567' }}
                          headline={headline}
                        />
                      </div>
                      {/* Overlay with template name */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <span className="text-white font-medium text-sm">{template.name}</span>
                      </div>
                    </div>
                    {selectedTemplate.id === template.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Selection */}
            {photos.length > 0 && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                <Label className="text-sm text-white/60 mb-3 block">Select Photo</Label>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoUrl(url)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        photoUrl === url
                          ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {photos.length === 0 && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                <Label className="text-sm text-white/60 mb-2 block">Photo URL</Label>
                <Input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="bg-white/5 border-white/20"
                />
              </div>
            )}
          </div>

          {/* Middle Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Label className="text-sm text-white/60 mb-3 block">Preview</Label>
              <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                {/* Scaled Preview */}
                <div className="relative overflow-hidden rounded-lg" style={{ paddingBottom: platform === 'facebook' ? '52.5%' : '52.25%' }}>
                  <div 
                    className="absolute inset-0 origin-top-left"
                    style={{ transform: 'scale(0.3)', width: '333.3%', height: '333.3%' }}
                  >
                    <FacebookTemplateRenderer
                      ref={templateRef}
                      templateId={selectedTemplate.id}
                      photoUrl={photoUrl || previewImage}
                      property={{
                        address: property.address || '123 Main Street',
                        city: property.city || 'Los Angeles',
                        state: property.state || 'CA',
                        price: property.price || undefined,
                        bedrooms: property.bedrooms || undefined,
                        bathrooms: property.bathrooms || undefined,
                        squareFeet: property.squareFeet || undefined
                      }}
                      brand={brand}
                      headline={headline}
                    />
                  </div>
                </div>

                {/* Download Button */}
                <Button
                  onClick={handleDownload}
                  disabled={downloading || !photoUrl}
                  className="w-full mt-4 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-semibold"
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : downloaded ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {downloading ? 'Generating...' : downloaded ? 'Downloaded!' : `Download ${dimensions.width}×${dimensions.height}`}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Property Details */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <Label className="text-sm text-white/60 mb-2 block">Headline</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value.toUpperCase())}
                placeholder="JUST LISTED"
                className="bg-white/5 border-white/20 text-lg font-bold"
              />
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
              <Label className="text-sm text-white/60 block">Property Details</Label>
              
              <div>
                <Label className="text-xs text-white/40">Address</Label>
                <Input
                  value={property.address}
                  onChange={(e) => updateProperty('address', e.target.value)}
                  placeholder="123 Main Street"
                  className="bg-white/5 border-white/20 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-white/40">City</Label>
                  <Input
                    value={property.city}
                    onChange={(e) => updateProperty('city', e.target.value)}
                    placeholder="Los Angeles"
                    className="bg-white/5 border-white/20 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/40">State</Label>
                  <Input
                    value={property.state}
                    onChange={(e) => updateProperty('state', e.target.value)}
                    placeholder="CA"
                    className="bg-white/5 border-white/20 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-white/40">Price</Label>
                <Input
                  type="number"
                  value={property.price}
                  onChange={(e) => updateProperty('price', e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="750000"
                  className="bg-white/5 border-white/20 mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-white/40">Beds</Label>
                  <Input
                    type="number"
                    value={property.bedrooms}
                    onChange={(e) => updateProperty('bedrooms', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="4"
                    className="bg-white/5 border-white/20 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/40">Baths</Label>
                  <Input
                    type="number"
                    value={property.bathrooms}
                    onChange={(e) => updateProperty('bathrooms', e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="3"
                    className="bg-white/5 border-white/20 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/40">Sq Ft</Label>
                  <Input
                    type="number"
                    value={property.squareFeet}
                    onChange={(e) => updateProperty('squareFeet', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="2500"
                    className="bg-white/5 border-white/20 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-white/60">Brand Settings</Label>
                <Link href="/dashboard/brand" className="text-xs text-[#D4AF37] hover:underline">
                  Edit Brand Profile →
                </Link>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: brand.primary_color, color: brand.secondary_color }}
                  >
                    {brand.business_name?.[0] || 'A'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{brand.business_name || 'Your Name'}</p>
                  <p className="text-xs text-white/50 truncate">{brand.phone || 'Add phone in Brand Profile'}</p>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: brand.primary_color }} />
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: brand.secondary_color }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
