'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Palette, Type, Layout, Download, RotateCcw, Save, Check } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const FONT_OPTIONS = [
  { id: 'inter', name: 'Inter', family: 'Inter, sans-serif' },
  { id: 'playfair', name: 'Playfair', family: 'Playfair Display, serif' },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat, sans-serif' },
  { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif' },
  { id: 'lora', name: 'Lora', family: 'Lora, serif' },
  { id: 'opensans', name: 'Open Sans', family: 'Open Sans, sans-serif' },
]

const COLOR_PRESETS = [
  { id: 'gold', name: 'Luxury Gold', primary: '#D4AF37', secondary: '#1A1A1A', accent: '#FFFFFF' },
  { id: 'navy', name: 'Classic Navy', primary: '#1E3A5F', secondary: '#FFFFFF', accent: '#C9A227' },
  { id: 'emerald', name: 'Modern Emerald', primary: '#047857', secondary: '#FFFFFF', accent: '#D4AF37' },
  { id: 'rose', name: 'Soft Rose', primary: '#BE185D', secondary: '#FFFFFF', accent: '#FDF2F8' },
  { id: 'slate', name: 'Minimal Slate', primary: '#334155', secondary: '#F8FAFC', accent: '#0EA5E9' },
  { id: 'custom', name: 'Custom', primary: '#D4AF37', secondary: '#1A1A1A', accent: '#FFFFFF' },
]

const LAYOUT_OPTIONS = [
  { id: 'overlay', name: 'Text Overlay', desc: 'Text on image' },
  { id: 'split', name: 'Split View', desc: 'Side panel' },
  { id: 'bottom', name: 'Bottom Bar', desc: 'Info at bottom' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean & simple' },
]

function TemplateCustomizerContent() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template') || 'luxury-1'
  
  const [font, setFont] = useState('inter')
  const [colorPreset, setColorPreset] = useState('gold')
  const [colors, setColors] = useState({ primary: '#D4AF37', secondary: '#1A1A1A', accent: '#FFFFFF' })
  const [layout, setLayout] = useState('overlay')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Sample property for preview
  const property = {
    address: '123 Luxury Lane',
    city: 'Beverly Hills',
    state: 'CA',
    price: 2450000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3200,
    photo: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
  }

  const handleColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setColorPreset(preset.id)
    if (preset.id !== 'custom') {
      setColors({ primary: preset.primary, secondary: preset.secondary, accent: preset.accent })
    }
  }

  const saveCustomization = async () => {
    setSaving(true)
    // In production, save to database
    await new Promise(r => setTimeout(r, 1000))
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetDefaults = () => {
    setFont('inter')
    setColorPreset('gold')
    setColors({ primary: '#D4AF37', secondary: '#1A1A1A', accent: '#FFFFFF' })
    setLayout('overlay')
  }

  const currentFont = FONT_OPTIONS.find(f => f.id === font)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio/create-all">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#D4AF37]" />
              Customize Template
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetDefaults} variant="ghost" className="text-white/60">
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
            <Button onClick={saveCustomization} disabled={saving} className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4 mr-2" />Saved!</> : <><Save className="w-4 h-4 mr-2" />Save</>}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-8">
          {/* Preview */}
          <div>
            <h2 className="text-lg font-bold mb-4">Preview</h2>
            <div className="aspect-square rounded-2xl overflow-hidden relative" style={{ fontFamily: currentFont?.family }}>
              <img src={property.photo} alt="" className="w-full h-full object-cover" />
              
              {layout === 'overlay' && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>Just Listed</div>
                  <div className="text-2xl font-bold mb-1" style={{ color: colors.accent }}>{property.address}</div>
                  <div className="text-sm opacity-80 mb-3" style={{ color: colors.accent }}>{property.city}, {property.state}</div>
                  <div className="text-3xl font-bold" style={{ color: colors.primary }}>${property.price.toLocaleString()}</div>
                  <div className="flex gap-4 mt-3 text-sm" style={{ color: colors.accent }}>
                    <span>{property.bedrooms} Beds</span>
                    <span>{property.bathrooms} Baths</span>
                    <span>{property.sqft.toLocaleString()} Sqft</span>
                  </div>
                </div>
              )}

              {layout === 'split' && (
                <div className="absolute inset-y-0 left-0 w-2/5 flex flex-col justify-center p-6" style={{ backgroundColor: colors.secondary }}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>Just Listed</div>
                  <div className="text-xl font-bold mb-1" style={{ color: colors.accent }}>{property.address}</div>
                  <div className="text-sm opacity-80 mb-3" style={{ color: colors.accent }}>{property.city}, {property.state}</div>
                  <div className="text-2xl font-bold" style={{ color: colors.primary }}>${property.price.toLocaleString()}</div>
                  <div className="flex flex-col gap-1 mt-3 text-sm" style={{ color: colors.accent }}>
                    <span>{property.bedrooms} Beds • {property.bathrooms} Baths</span>
                    <span>{property.sqft.toLocaleString()} Sqft</span>
                  </div>
                </div>
              )}

              {layout === 'bottom' && (
                <div className="absolute inset-x-0 bottom-0 p-4" style={{ backgroundColor: colors.secondary }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.primary }}>Just Listed</div>
                      <div className="text-lg font-bold" style={{ color: colors.accent }}>{property.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: colors.primary }}>${property.price.toLocaleString()}</div>
                      <div className="text-sm" style={{ color: colors.accent }}>{property.bedrooms}bd • {property.bathrooms}ba • {property.sqft.toLocaleString()}sf</div>
                    </div>
                  </div>
                </div>
              )}

              {layout === 'minimal' && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="backdrop-blur-md rounded-xl p-4" style={{ backgroundColor: `${colors.secondary}CC` }}>
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold" style={{ color: colors.accent }}>{property.address}</div>
                      <div className="text-xl font-bold" style={{ color: colors.primary }}>${property.price.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Colors */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4" />Color Scheme
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleColorPreset(preset)}
                    className={`p-3 rounded-lg text-left transition ${colorPreset === preset.id ? 'bg-white/10 ring-2 ring-[#D4AF37]' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                      <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.accent }} />
                    </div>
                    <div className="text-xs">{preset.name}</div>
                  </button>
                ))}
              </div>
              
              {colorPreset === 'custom' && (
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Primary</label>
                    <input type="color" value={colors.primary} onChange={e => setColors({ ...colors, primary: e.target.value })} className="w-full h-10 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Secondary</label>
                    <input type="color" value={colors.secondary} onChange={e => setColors({ ...colors, secondary: e.target.value })} className="w-full h-10 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Accent</label>
                    <input type="color" value={colors.accent} onChange={e => setColors({ ...colors, accent: e.target.value })} className="w-full h-10 rounded cursor-pointer" />
                  </div>
                </div>
              )}
            </div>

            {/* Fonts */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                <Type className="w-4 h-4" />Typography
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFont(f.id)}
                    className={`p-3 rounded-lg text-left transition ${font === f.id ? 'bg-white/10 ring-2 ring-[#D4AF37]' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="text-lg mb-1" style={{ fontFamily: f.family }}>{f.name}</div>
                    <div className="text-xs text-white/40" style={{ fontFamily: f.family }}>Aa Bb Cc 123</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4" />Layout Style
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_OPTIONS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id)}
                    className={`p-3 rounded-lg text-left transition ${layout === l.id ? 'bg-white/10 ring-2 ring-[#D4AF37]' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="font-medium mb-1">{l.name}</div>
                    <div className="text-xs text-white/40">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <Link href={`/dashboard/content-studio/create-all?customColors=${encodeURIComponent(JSON.stringify(colors))}&customFont=${font}&customLayout=${layout}`}>
              <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-bold h-12">
                Apply to Content Creator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TemplateCustomizer() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>}><TemplateCustomizerContent /></Suspense>
}
