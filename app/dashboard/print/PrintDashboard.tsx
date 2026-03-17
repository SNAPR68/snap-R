'use client'

import Image from 'next/image';
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  FileText, Download, Loader2, Home, ChevronDown, Printer,
  BookOpen, Layout, Check, AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Listing {
  id: string
  title: string
  address: string
  city: string
  state: string
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  thumbnail: string | null
}

type MaterialType = 'flyer' | 'feature-sheet'

const MATERIALS: { type: MaterialType; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'flyer', label: 'Property Flyer', desc: '1-page marketing flyer with hero photo, price, and key details', icon: Layout },
  { type: 'feature-sheet', label: 'Feature Sheet', desc: '2-page detailed sheet with full specs, features list, and agent contact', icon: BookOpen },
]

export default function PrintDashboard() {
  const searchParams = useSearchParams()
  const preselect = searchParams.get('listing')

  const [listings, setListings] = useState<Listing[]>([])
  const [selectedId, setSelectedId] = useState<string>(preselect ?? '')
  const [selectedType, setSelectedType] = useState<MaterialType>('flyer')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => { loadListings() }, [])

  const loadListings = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('listings')
        .select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const processed: Listing[] = []
      for (const l of data ?? []) {
        const photos = (l.photos ?? []) as Array<{ raw_url: string | null; processed_url: string | null }>
        let thumbnail: string | null = null
        const first = photos[0]
        if (first) {
          const path = first.processed_url || first.raw_url
          if (path) {
            if (path.startsWith('http')) {
              thumbnail = path
            } else {
              const { data: signed } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
              thumbnail = signed?.signedUrl ?? null
            }
          }
        }
        processed.push({
          id: l.id,
          title: l.title || l.address || 'Untitled',
          address: l.address || '',
          city: l.city || '',
          state: l.state || '',
          price: l.price,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          square_feet: l.square_feet,
          thumbnail,
        })
      }
      setListings(processed)
    } catch {
      // load failed silently
    } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    if (!selectedId) return
    setGenerating(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/marketing/print-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedId, type: selectedType }),
        signal: AbortSignal.timeout(60000),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Generation failed')
      }

      // Download the PDF blob
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const listing = listings.find(l => l.id === selectedId)
      const filename = `${listing?.title ?? 'property'}-${selectedType}.pdf`.toLowerCase().replace(/\s+/g, '-')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const selected = listings.find(l => l.id === selectedId)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-6 gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
          <Printer className="w-4 h-4 text-[#D4A017]" />
        </div>
        <span className="font-bold">Print Materials</span>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Generate Print Materials</h1>
          <p className="text-white/40">Create print-ready PDFs for any listing — flyers and feature sheets, branded with your info.</p>
        </div>

        {/* Step 1 — listing */}
        <div className="glass-luxury glossy-top rounded-2xl p-6 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Step 1 — Select Listing</p>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(d => !d)}
              className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
            >
              {selected ? (
                <div className="flex items-center gap-3">
                  {selected.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image src={selected.thumbnail} alt="" className="w-12 h-10 rounded-lg object-cover" width={400} height={300} unoptimized />
                  ) : (
                    <div className="w-12 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Home className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-sm">{selected.title}</p>
                    <p className="text-xs text-white/40">
                      {[selected.city, selected.state].filter(Boolean).join(', ')}
                      {selected.price ? ` · $${Number(selected.price).toLocaleString()}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-white/40 text-sm">Choose a listing...</span>
              )}
              <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-20 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#D4A017]" /></div>
                ) : listings.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center px-4">
                    <div className="text-3xl mb-2">🏠</div>
                    <p className="text-white/60 text-sm font-medium mb-1">No listings found</p>
                    <p className="text-white/30 text-xs">Create a listing first to generate print materials.</p>
                  </div>
                ) : listings.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setSelectedId(l.id); setShowDropdown(false) }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left ${selectedId === l.id ? 'bg-[#D4A017]/10' : ''}`}
                  >
                    {l.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <Image src={l.thumbnail} alt="" className="w-12 h-10 rounded-lg object-cover flex-shrink-0" width={400} height={300} unoptimized />
                    ) : (
                      <div className="w-12 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Home className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{l.title}</p>
                      <p className="text-xs text-white/40">
                        {[l.city, l.state].filter(Boolean).join(', ')}
                        {l.price ? ` · $${Number(l.price).toLocaleString()}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 2 — type */}
        <div className="glass-luxury glossy-top rounded-2xl p-6 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Step 2 — Choose Format</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MATERIALS.map(({ type, label, desc, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedType === type ? 'border-[#D4A017] bg-[#D4A017]/5' : 'border-white/10 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedType === type ? 'bg-[#D4A017]/20' : 'bg-white/5'}`}>
                    <Icon className={`w-5 h-5 ${selectedType === type ? 'text-[#D4A017]' : 'text-white/40'}`} />
                  </div>
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 — generate */}
        <div className="glass-luxury glossy-top rounded-2xl p-6">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Step 3 — Generate & Download</p>

          {error && (
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-4">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">PDF generated and downloaded!</p>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-white/40">
              {selected ? (
                <span>
                  Generating <span className="text-white/70 font-medium">{MATERIALS.find(m => m.type === selectedType)?.label}</span> for{' '}
                  <span className="text-white/70 font-medium">{selected.title}</span>
                </span>
              ) : (
                'Select a listing to get started'
              )}
            </div>

            <button
              onClick={generate}
              disabled={!selectedId || generating}
              className="flex items-center gap-2 px-6 py-3 bg-[#D4A017] text-black font-bold rounded-xl hover:bg-[#B8860B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
              ) : success ? (
                <><Check className="w-4 h-4" /> Downloaded!</>
              ) : (
                <><Download className="w-4 h-4" /> Generate PDF</>
              )}
            </button>
          </div>

          <p className="text-xs text-white/30 mt-3">
            PDFs are branded with your logo and contact info from your{' '}
            <a href="/dashboard/brand" className="text-[#D4A017] hover:underline">Brand Profile</a>.
            Generation takes ~10–20 seconds.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { icon: FileText, label: 'Print-Ready', desc: 'PDF at 300 DPI, letter size, CMYK-safe colors' },
            { icon: Layout, label: 'Auto-Branded', desc: 'Your logo, colors, and contact info auto-applied' },
            { icon: Printer, label: 'Instant Download', desc: 'No watermarks, no subscription required' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-[#111] border border-white/5 rounded-xl p-4">
              <Icon className="w-5 h-5 text-[#D4A017] mb-2" />
              <p className="text-sm font-semibold mb-1">{label}</p>
              <p className="text-xs text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
