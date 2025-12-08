'use client'

import { Instagram, Facebook, Video, Linkedin } from 'lucide-react'

interface PlatformSelectorProps {
  selected: string
  onChange: (platform: string) => void
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-400' },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'from-black to-gray-700' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-500' }
]

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {PLATFORMS.map((platform) => {
        const Icon = platform.icon
        const isSelected = selected === platform.id
        
        return (
          <button
            key={platform.id}
            onClick={() => onChange(platform.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              flex flex-col items-center gap-2
              ${isSelected 
                ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                : 'border-white/10 bg-white/5 hover:border-white/30'
              }
            `}
          >
            <div className={`
              w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color}
              flex items-center justify-center
            `}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className={`text-sm font-medium ${isSelected ? 'text-[#D4AF37]' : 'text-white/80'}`}>
              {platform.name}
            </span>
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D4AF37]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
