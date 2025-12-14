'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Image, Type, Move, Eye, Save, Check } from 'lucide-react'
import Link from 'next/link'

const POSITIONS = [
  { id: 'top-left', name: 'Top Left' },
  { id: 'top-right', name: 'Top Right' },
  { id: 'bottom-left', name: 'Bottom Left' },
  { id: 'bottom-right', name: 'Bottom Right' },
  { id: 'center', name: 'Center' },
]

export default function WatermarkSettings() {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<'text' | 'logo'>('text')
  const [text, setText] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [position, setPosition] = useState('bottom-right')
  const [opacity, setOpacity] = useState(50)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/watermark')
      const data = await res.json()
      if (data.settings) {
        setEnabled(data.settings.watermark_enabled || false)
        setText(data.settings.watermark_text || '')
        setLogoUrl(data.settings.watermark_logo_url || '')
        setPosition(data.settings.watermark_position || 'bottom-right')
        setOpacity(data.settings.watermark_opacity || 50)
        setMode(data.settings.watermark_logo_url ? 'logo' : 'text')
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await fetch('/api/watermark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, text: mode === 'text' ? text : null, logoUrl: mode === 'logo' ? logoUrl : null, position, opacity })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const samplePhoto = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'
  const getPositionClasses = (pos: string) => {
    const map: Record<string, string> = { 'top-left': 'top-4 left-4', 'top-right': 'top-4 right-4', 'bottom-left': 'bottom-4 left-4', 'bottom-right': 'bottom-4 right-4', 'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' }
    return map[pos] || 'bottom-4 right-4'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Image className="w-5 h-5 text-[#D4AF37]" />Watermark Settings</h1>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4 mr-2" />Saved!</> : <><Save className="w-4 h-4 mr-2" />Save</>}
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-5xl mx-auto">
        {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div> : (
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold mb-4">Preview</h2>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden relative bg-gray-800">
                <img src={samplePhoto} alt="" className="w-full h-full object-cover" />
                {enabled && (
                  <div className={`absolute ${getPositionClasses(position)}`} style={{ opacity: opacity / 100 }}>
                    {mode === 'text' ? <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded text-white font-medium text-sm">{text || 'Your Watermark'}</div> : logoUrl ? <img src={logoUrl} alt="Watermark" className="h-12 w-auto" /> : <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded text-white/50 font-medium text-sm">Logo</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-medium">Enable Watermark</h3><p className="text-sm text-white/50">Add watermark to all downloads</p></div>
                  <button onClick={() => setEnabled(!enabled)} className={`w-12 h-6 rounded-full transition ${enabled ? 'bg-[#D4AF37]' : 'bg-white/20'}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
                </div>
              </div>
              {enabled && (<>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2"><Type className="w-4 h-4" />Watermark Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setMode('text')} className={`p-3 rounded-lg transition ${mode === 'text' ? 'bg-[#D4AF37]/20 border border-[#D4AF37]' : 'bg-white/5 border border-transparent'}`}><Type className="w-5 h-5 mx-auto mb-1" /><div className="text-sm">Text</div></button>
                    <button onClick={() => setMode('logo')} className={`p-3 rounded-lg transition ${mode === 'logo' ? 'bg-[#D4AF37]/20 border border-[#D4AF37]' : 'bg-white/5 border border-transparent'}`}><Image className="w-5 h-5 mx-auto mb-1" /><div className="text-sm">Logo</div></button>
                  </div>
                  {mode === 'text' && <div className="mt-4"><label className="text-xs text-white/50 block mb-1">Text</label><input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="© Your Name" className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white" /></div>}
                  {mode === 'logo' && <div className="mt-4"><label className="text-xs text-white/50 block mb-1">Logo URL</label><input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white" /></div>}
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2"><Move className="w-4 h-4" />Position</h3>
                  <div className="grid grid-cols-3 gap-2">{POSITIONS.map(p => <button key={p.id} onClick={() => setPosition(p.id)} className={`p-2 rounded-lg text-sm ${position === p.id ? 'bg-[#D4AF37] text-black font-medium' : 'bg-white/5'}`}>{p.name}</button>)}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" />Opacity: {opacity}%</h3>
                  <input type="range" min="10" max="100" value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} className="w-full accent-[#D4AF37]" />
                </div>
              </>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
