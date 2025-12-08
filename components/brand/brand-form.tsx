'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoUploader } from './logo-uploader'
import { Loader2, Save, CheckCircle } from 'lucide-react'

interface BrandProfile {
  id?: string
  business_name: string
  logo_url: string
  primary_color: string
  secondary_color: string
  phone: string
  email: string
  website: string
  brokerage_name: string
  brokerage_logo_url: string
  license_number: string
  tagline: string
  social_handles: {
    instagram?: string
    facebook?: string
    tiktok?: string
    linkedin?: string
  }
}

const defaultProfile: BrandProfile = {
  business_name: '',
  logo_url: '',
  primary_color: '#D4AF37',
  secondary_color: '#1A1A1A',
  phone: '',
  email: '',
  website: '',
  brokerage_name: '',
  brokerage_logo_url: '',
  license_number: '',
  tagline: '',
  social_handles: {}
}

export function BrandForm() {
  const [profile, setProfile] = useState<BrandProfile>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Fetch existing profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/brand')
      const data = await res.json()
      
      if (data.brandProfile) {
        setProfile({
          ...defaultProfile,
          ...data.brandProfile,
          social_handles: data.brandProfile.social_handles || {}
        })
      }
    } catch (error) {
      console.error('Failed to fetch brand profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      const data = await res.json()

      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert('Failed to save: ' + data.error)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save brand profile')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof BrandProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const updateSocialHandle = (platform: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      social_handles: { ...prev.social_handles, [platform]: value }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Business Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Business Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={profile.business_name}
              onChange={(e) => updateField('business_name', e.target.value)}
              placeholder="Your Name or Company"
              className="bg-white/5 border-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={profile.tagline}
              onChange={(e) => updateField('tagline', e.target.value)}
              placeholder="Your professional tagline"
              className="bg-white/5 border-white/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LogoUploader
            currentLogo={profile.logo_url}
            onUpload={(url) => updateField('logo_url', url)}
            label="Your Logo"
          />

          <LogoUploader
            currentLogo={profile.brokerage_logo_url}
            onUpload={(url) => updateField('brokerage_logo_url', url)}
            label="Brokerage Logo"
          />
        </div>
      </section>

      {/* Contact Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="bg-white/5 border-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="you@example.com"
              className="bg-white/5 border-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={profile.website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://yourwebsite.com"
              className="bg-white/5 border-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number">License Number</Label>
            <Input
              id="license_number"
              value={profile.license_number}
              onChange={(e) => updateField('license_number', e.target.value)}
              placeholder="DRE# 01234567"
              className="bg-white/5 border-white/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brokerage_name">Brokerage Name</Label>
          <Input
            id="brokerage_name"
            value={profile.brokerage_name}
            onChange={(e) => updateField('brokerage_name', e.target.value)}
            placeholder="Keller Williams, Compass, etc."
            className="bg-white/5 border-white/20"
          />
        </div>
      </section>

      {/* Brand Colors */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Brand Colors
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="primary_color"
                value={profile.primary_color}
                onChange={(e) => updateField('primary_color', e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <Input
                value={profile.primary_color}
                onChange={(e) => updateField('primary_color', e.target.value)}
                placeholder="#D4AF37"
                className="bg-white/5 border-white/20 flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="secondary_color"
                value={profile.secondary_color}
                onChange={(e) => updateField('secondary_color', e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <Input
                value={profile.secondary_color}
                onChange={(e) => updateField('secondary_color', e.target.value)}
                placeholder="#1A1A1A"
                className="bg-white/5 border-white/20 flex-1"
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div className="flex gap-4 items-center">
          <span className="text-sm text-white/60">Preview:</span>
          <div 
            className="px-4 py-2 rounded font-medium"
            style={{ 
              backgroundColor: profile.primary_color, 
              color: profile.secondary_color 
            }}
          >
            {profile.business_name || 'Your Brand'}
          </div>
        </div>
      </section>

      {/* Social Handles */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
          Social Media Handles
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <div className="flex">
              <span className="bg-white/10 border border-r-0 border-white/20 rounded-l px-3 py-2 text-white/50">@</span>
              <Input
                id="instagram"
                value={profile.social_handles.instagram || ''}
                onChange={(e) => updateSocialHandle('instagram', e.target.value)}
                placeholder="username"
                className="bg-white/5 border-white/20 rounded-l-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <div className="flex">
              <span className="bg-white/10 border border-r-0 border-white/20 rounded-l px-3 py-2 text-white/50">@</span>
              <Input
                id="facebook"
                value={profile.social_handles.facebook || ''}
                onChange={(e) => updateSocialHandle('facebook', e.target.value)}
                placeholder="username"
                className="bg-white/5 border-white/20 rounded-l-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok</Label>
            <div className="flex">
              <span className="bg-white/10 border border-r-0 border-white/20 rounded-l px-3 py-2 text-white/50">@</span>
              <Input
                id="tiktok"
                value={profile.social_handles.tiktok || ''}
                onChange={(e) => updateSocialHandle('tiktok', e.target.value)}
                placeholder="username"
                className="bg-white/5 border-white/20 rounded-l-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <div className="flex">
              <span className="bg-white/10 border border-r-0 border-white/20 rounded-l px-3 py-2 text-white/50">in/</span>
              <Input
                id="linkedin"
                value={profile.social_handles.linkedin || ''}
                onChange={(e) => updateSocialHandle('linkedin', e.target.value)}
                placeholder="username"
                className="bg-white/5 border-white/20 rounded-l-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-semibold px-8"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Brand Profile
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
