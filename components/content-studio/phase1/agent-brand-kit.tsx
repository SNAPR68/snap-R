'use client'

import { useState, useRef } from 'react'
import { 
  Palette, 
  Upload, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Building2, 
  Award, 
  Save,
  Loader2,
  Check,
  Camera,
  Eye
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface AgentBrandKit {
  id?: string
  user_id?: string
  
  // Branding
  logo_url: string | null
  primary_color: string
  secondary_color: string
  
  // Agent Info
  agent_name: string
  agent_title: string
  agent_photo_url: string | null
  
  // Contact
  phone: string
  email: string
  website: string
  
  // Brokerage
  brokerage_name: string
  brokerage_logo_url: string | null
  license_number: string
  
  // Personal
  tagline: string
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

export const DEFAULT_BRAND_KIT: AgentBrandKit = {
  logo_url: null,
  primary_color: '#D4AF37',
  secondary_color: '#1A1A1A',
  agent_name: '',
  agent_title: 'Real Estate Agent',
  agent_photo_url: null,
  phone: '',
  email: '',
  website: '',
  brokerage_name: '',
  brokerage_logo_url: null,
  license_number: '',
  tagline: ''
}

// ============================================
// COLOR PRESETS
// ============================================

const COLOR_PRESETS = [
  { name: 'Gold', primary: '#D4AF37', secondary: '#1A1A1A' },
  { name: 'Navy', primary: '#1E3A5F', secondary: '#FFFFFF' },
  { name: 'Emerald', primary: '#2E8B57', secondary: '#FFFFFF' },
  { name: 'Burgundy', primary: '#722F37', secondary: '#F5F5F5' },
  { name: 'Slate', primary: '#4A5568', secondary: '#FFFFFF' },
  { name: 'Royal Blue', primary: '#4169E1', secondary: '#FFFFFF' },
  { name: 'Coral', primary: '#FF6B6B', secondary: '#2D3436' },
  { name: 'Teal', primary: '#20B2AA', secondary: '#1A1A1A' },
]

const AGENT_TITLES = [
  'Real Estate Agent',
  'Realtor®',
  'Broker',
  'Associate Broker',
  'Luxury Home Specialist',
  "Buyer's Agent",
  'Listing Agent',
  'Real Estate Consultant',
  'Property Advisor',
]

// ============================================
// BRAND KIT EDITOR COMPONENT
// ============================================

interface BrandKitEditorProps {
  brandKit: AgentBrandKit
  onChange: (kit: AgentBrandKit) => void
  onSave?: () => Promise<void>
  loading?: boolean
  saved?: boolean
}

export function BrandKitEditor({ 
  brandKit, 
  onChange, 
  onSave,
  loading = false,
  saved = false
}: BrandKitEditorProps) {
  const [activeTab, setActiveTab] = useState<'branding' | 'contact' | 'brokerage'>('branding')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const brokerageLogoInputRef = useRef<HTMLInputElement>(null)
  
  const updateField = <K extends keyof AgentBrandKit>(
    field: K, 
    value: AgentBrandKit[K]
  ) => {
    onChange({ ...brandKit, [field]: value })
  }
  
  const handleImageUpload = async (
    file: File, 
    field: 'logo_url' | 'agent_photo_url' | 'brokerage_logo_url'
  ) => {
    const url = URL.createObjectURL(file)
    updateField(field, url)
  }
  
  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'brokerage', label: 'Brokerage', icon: Building2 },
  ]
  
  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center">
            <Palette className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Agent Brand Kit</h2>
            <p className="text-white/40 text-xs">Customize your branding for all content</p>
          </div>
        </div>
        
        {onSave && (
          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-medium text-sm hover:bg-[#B8860B] transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition
                ${isActive 
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-[#D4AF37]/5' 
                  : 'text-white/50 hover:text-white/70'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 block">Your Logo</label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 hover:border-[#D4AF37]/50 flex items-center justify-center cursor-pointer transition overflow-hidden bg-white/5"
                >
                  {brandKit.logo_url ? (
                    <img src={brandKit.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="w-6 h-6 text-white/40" />
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo_url')}
                />
                <div className="flex-1">
                  <p className="text-white/50 text-xs">Upload your business logo</p>
                  <p className="text-white/30 text-xs">PNG or SVG recommended</p>
                  {brandKit.logo_url && (
                    <button
                      onClick={() => updateField('logo_url', null)}
                      className="text-red-400 text-xs mt-1 hover:underline"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Colors */}
            <div className="space-y-3">
              <label className="text-sm text-white/70 block">Brand Colors</label>
              
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      updateField('primary_color', preset.primary)
                      updateField('secondary_color', preset.secondary)
                    }}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg border transition
                      ${brandKit.primary_color === preset.primary 
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                        : 'border-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span className="text-xs text-white/70">{preset.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-white/40">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandKit.primary_color}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandKit.primary_color}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/40">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandKit.secondary_color}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandKit.secondary_color}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tagline */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 block">Tagline</label>
              <input
                type="text"
                value={brandKit.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="Your expertise, their dream home"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
              />
              <p className="text-white/30 text-xs">A short phrase that represents your brand</p>
            </div>
          </div>
        )}
        
        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            {/* Agent Photo */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 block">Your Photo</label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => photoInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 hover:border-[#D4AF37]/50 flex items-center justify-center cursor-pointer transition overflow-hidden bg-white/5"
                >
                  {brandKit.agent_photo_url ? (
                    <img src={brandKit.agent_photo_url} alt="Agent" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-white/40" />
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'agent_photo_url')}
                />
                <div className="flex-1">
                  <p className="text-white/50 text-xs">Professional headshot</p>
                  {brandKit.agent_photo_url && (
                    <button
                      onClick={() => updateField('agent_photo_url', null)}
                      className="text-red-400 text-xs mt-1 hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Name & Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/70 flex items-center gap-2">
                  <User className="w-4 h-4" /> Name
                </label>
                <input
                  type="text"
                  value={brandKit.agent_name}
                  onChange={(e) => updateField('agent_name', e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Title
                </label>
                <select
                  value={brandKit.agent_title}
                  onChange={(e) => updateField('agent_title', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  {AGENT_TITLES.map(title => (
                    <option key={title} value={title} className="bg-[#1A1A1A]">{title}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/70 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                <input
                  type="tel"
                  value={brandKit.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <input
                  type="email"
                  value={brandKit.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@realty.com"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>
            
            {/* Website */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Website
              </label>
              <input
                type="url"
                value={brandKit.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>
          </div>
        )}
        
        {/* Brokerage Tab */}
        {activeTab === 'brokerage' && (
          <div className="space-y-6">
            {/* Brokerage Logo */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 block">Brokerage Logo</label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => brokerageLogoInputRef.current?.click()}
                  className="w-32 h-16 rounded-lg border-2 border-dashed border-white/20 hover:border-[#D4AF37]/50 flex items-center justify-center cursor-pointer transition overflow-hidden bg-white/5"
                >
                  {brandKit.brokerage_logo_url ? (
                    <img src={brandKit.brokerage_logo_url} alt="Brokerage" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-6 h-6 text-white/40" />
                  )}
                </div>
                <input
                  ref={brokerageLogoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'brokerage_logo_url')}
                />
                <div className="flex-1">
                  <p className="text-white/50 text-xs">Your brokerage official logo</p>
                  {brandKit.brokerage_logo_url && (
                    <button
                      onClick={() => updateField('brokerage_logo_url', null)}
                      className="text-red-400 text-xs mt-1 hover:underline"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Brokerage Name */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Brokerage Name
              </label>
              <input
                type="text"
                value={brandKit.brokerage_name}
                onChange={(e) => updateField('brokerage_name', e.target.value)}
                placeholder="Keller Williams Realty"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>
            
            {/* License Number */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <Award className="w-4 h-4" /> License Number
              </label>
              <input
                type="text"
                value={brandKit.license_number}
                onChange={(e) => updateField('license_number', e.target.value)}
                placeholder="DRE #01234567"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
              />
              <p className="text-white/30 text-xs">Required for MLS compliance in most states</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Preview Card */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/40 uppercase tracking-wide">Preview</span>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: brandKit.secondary_color }}
        >
          <div className="flex items-center gap-3">
            {brandKit.agent_photo_url ? (
              <img 
                src={brandKit.agent_photo_url} 
                alt="Agent" 
                className="w-12 h-12 rounded-full object-cover border-2"
                style={{ borderColor: brandKit.primary_color }}
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brandKit.primary_color }}
              >
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <p 
                className="font-semibold"
                style={{ color: brandKit.primary_color }}
              >
                {brandKit.agent_name || 'Your Name'}
              </p>
              <p className="text-xs" style={{ color: brandKit.primary_color, opacity: 0.7 }}>
                {brandKit.agent_title} {brandKit.brokerage_name && `• ${brandKit.brokerage_name}`}
              </p>
              {brandKit.phone && (
                <p className="text-xs mt-1" style={{ color: brandKit.primary_color, opacity: 0.5 }}>
                  {brandKit.phone}
                </p>
              )}
            </div>
            {brandKit.logo_url && (
              <img 
                src={brandKit.logo_url} 
                alt="Logo" 
                className="w-10 h-10 object-contain ml-auto"
              />
            )}
          </div>
          {brandKit.tagline && (
            <p 
              className="text-xs mt-3 italic"
              style={{ color: brandKit.primary_color, opacity: 0.6 }}
            >
              &quot;{brandKit.tagline}&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BrandKitEditor
