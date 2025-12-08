'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlatformSelector } from '@/components/content-studio/platform-selector'
import { CaptionGenerator } from '@/components/content-studio/caption-generator'
import { ContentPreview } from '@/components/content-studio/content-preview'

interface PropertyDetails {
  address: string
  city: string
  state: string
  bedrooms: number | ''
  bathrooms: number | ''
  squareFeet: number | ''
  price: number | ''
  propertyType: string
  features: string
}

export default function CreateContentPage() {
  const searchParams = useSearchParams()
  const contentType = searchParams.get('type') || 'social'

  const [platform, setPlatform] = useState('instagram')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(true)
  const [brandProfile, setBrandProfile] = useState<any>(null)
  const [property, setProperty] = useState<PropertyDetails>({
    address: '',
    city: '',
    state: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    price: '',
    propertyType: 'house',
    features: ''
  })

  // Fetch brand profile
  useEffect(() => {
    async function fetchBrandProfile() {
      try {
        const res = await fetch('/api/brand')
        const data = await res.json()
        if (data.brandProfile) {
          setBrandProfile(data.brandProfile)
        }
      } catch (error) {
        console.error('Failed to fetch brand profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBrandProfile()
  }, [])

  const updateProperty = (field: keyof PropertyDetails, value: string | number) => {
    setProperty(prev => ({ ...prev, [field]: value }))
  }

  const getPropertyForAPI = () => ({
    ...property,
    bedrooms: property.bedrooms || undefined,
    bathrooms: property.bathrooms || undefined,
    squareFeet: property.squareFeet || undefined,
    price: property.price || undefined,
    features: property.features ? property.features.split(',').map(f => f.trim()) : []
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/content-studio" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Content Studio
          </Link>
          <h1 className="text-2xl font-bold">
            {contentType === 'social' && 'Create Social Media Post'}
            {contentType === 'description' && 'Generate Property Description'}
            {contentType === 'hashtags' && 'Generate Hashtags'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            {/* Platform Selection */}
            {contentType === 'social' && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <Label className="text-lg font-semibold mb-4 block">Select Platform</Label>
                <PlatformSelector selected={platform} onChange={setPlatform} />
              </div>
            )}

            {/* Property Details */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <Label className="text-lg font-semibold mb-4 block">Property Details</Label>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={property.address}
                      onChange={(e) => updateProperty('address', e.target.value)}
                      placeholder="123 Main Street"
                      className="bg-white/5 border-white/20 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={property.city}
                      onChange={(e) => updateProperty('city', e.target.value)}
                      placeholder="Los Angeles"
                      className="bg-white/5 border-white/20 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={property.state}
                      onChange={(e) => updateProperty('state', e.target.value)}
                      placeholder="CA"
                      className="bg-white/5 border-white/20 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Beds</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={property.bedrooms}
                      onChange={(e) => updateProperty('bedrooms', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="4"
                      className="bg-white/5 border-white/20 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Baths</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={property.bathrooms}
                      onChange={(e) => updateProperty('bathrooms', e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="3"
                      className="bg-white/5 border-white/20 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="squareFeet">Sq Ft</Label>
                    <Input
                      id="squareFeet"
                      type="number"
                      value={property.squareFeet}
                      onChange={(e) => updateProperty('squareFeet', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="2500"
                      className="bg-white/5 border-white/20 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={property.price}
                      onChange={(e) => updateProperty('price', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="750000"
                      className="bg-white/5 border-white/20 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <select
                    id="propertyType"
                    value={property.propertyType}
                    onChange={(e) => updateProperty('propertyType', e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white"
                  >
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="features">Key Features (comma separated)</Label>
                  <Input
                    id="features"
                    value={property.features}
                    onChange={(e) => updateProperty('features', e.target.value)}
                    placeholder="pool, renovated kitchen, mountain view"
                    className="bg-white/5 border-white/20 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Caption Generator */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <Label className="text-lg font-semibold mb-4 block">Generate Content</Label>
              <CaptionGenerator
                property={getPropertyForAPI()}
                platform={platform}
                onCaptionGenerated={setCaption}
              />
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="sticky top-8">
              <Label className="text-lg font-semibold mb-4 block">Preview</Label>
              <ContentPreview
                platform={platform}
                caption={caption}
                brandProfile={brandProfile}
              />

              {/* Not connected to brand */}
              {!brandProfile?.business_name && (
                <Link href="/dashboard/brand">
                  <div className="mt-4 p-4 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30 text-center">
                    <p className="text-[#D4AF37] text-sm">
                      Set up your Brand Profile for auto-branded posts →
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
