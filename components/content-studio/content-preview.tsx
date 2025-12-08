'use client'

import { Instagram, Facebook, Video, Linkedin } from 'lucide-react'

interface ContentPreviewProps {
  platform: string
  imageUrl?: string
  caption?: string
  brandProfile?: {
    business_name?: string
    logo_url?: string
    primary_color?: string
  }
}

export function ContentPreview({ platform, imageUrl, caption, brandProfile }: ContentPreviewProps) {
  const platformConfig = {
    instagram: { icon: Instagram, name: 'Instagram', aspectRatio: '1/1' },
    facebook: { icon: Facebook, name: 'Facebook', aspectRatio: '1.91/1' },
    tiktok: { icon: Video, name: 'TikTok', aspectRatio: '9/16' },
    linkedin: { icon: Linkedin, name: 'LinkedIn', aspectRatio: '1.91/1' }
  }

  const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.instagram
  const Icon = config.icon

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Platform Header */}
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <Icon className="w-4 h-4 text-white/60" />
        <span className="text-sm text-white/60">{config.name} Preview</span>
      </div>

      {/* Post Preview */}
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          {brandProfile?.logo_url ? (
            <img 
              src={brandProfile.logo_url} 
              alt="Logo" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold"
              style={{ backgroundColor: brandProfile?.primary_color || '#D4AF37' }}
            >
              {brandProfile?.business_name?.[0] || 'S'}
            </div>
          )}
          <div>
            <p className="text-white font-medium text-sm">
              {brandProfile?.business_name || 'Your Business'}
            </p>
            <p className="text-white/50 text-xs">Just now</p>
          </div>
        </div>

        {/* Image */}
        <div 
          className="bg-white/10 rounded-lg overflow-hidden mb-3"
          style={{ aspectRatio: config.aspectRatio }}
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Post preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <span>Select a photo</span>
            </div>
          )}
        </div>

        {/* Caption */}
        {caption && (
          <div className="text-sm text-white/80">
            <span className="font-medium text-white">
              {brandProfile?.business_name || 'yourbusiness'}
            </span>{' '}
            <span className="whitespace-pre-wrap">
              {caption.length > 150 ? caption.slice(0, 150) + '...' : caption}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
