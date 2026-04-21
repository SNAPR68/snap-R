'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  FileJson, Download, Loader2, Home, ChevronDown,
  Check, AlertCircle, Package, Code, FileText, ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Listing {
  id: string
  title: string
  address: string
  city: string
  state: string
  price: number | null
  mls_number: string | null
  mls_status: string | null
}

type ExportFormat = 'zip' | 'reso-json'

const FORMATS: { type: ExportFormat; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    type: 'zip',
    label: 'MLS Photo Package (ZIP)',
    desc: 'Print-ready photos + disclosure + CSV manifest, compliant with top 20 US MLS specs',
    icon: Package,
  },
  {
    type: 'reso-json',
    label: 'RESO JSON Export',
    desc: 'RESO Data Dictionary 2.0 JSON — paste directly into any RESO-compliant MLS system',
    icon: Code,
  },
]

const MLS_SPECS = [
  { id: 'crmls', name: 'CRMLS', region: 'California' },
  { id: 'bright', name: 'Bright MLS', region: 'Mid-Atlantic' },
  { id: 'stellar', name: 'Stellar MLS', region: 'Florida' },
  { id: 'nwmls', name: 'NWMLS', region: 'Pacific Northwest' },
  { id: 'mred', name: 'MRED', region: 'Midwest' },
  { id: 'mls-pin', name: 'MLS PIN', region: 'New England' },
  { id: 'harmls', name: 'HAR MLS', region: 'Texas' },
  { id: 'carets', name: 'CARETS', region: 'Southern CA' },
  { id: 'reinmls', name: 'REIN MLS', region: 'Virginia' },
  { id: 'triad', name: 'Triad MLS', region: 'North Carolina' },
  { id: 'generic', name: 'Generic / Other', region: 'Any MLS' },
]

export default function MlsDashboard() {
  const searchParams = useSearchParams()
  const preselect = searchParams.get('listing')

  const [listings, setListings] = useState<Listing[]>([])
  const [selectedId, setSelectedId] = useState<string>(preselect ?? '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('zip')
  const [mlsSpec, setMlsSpec] = useState('generic')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
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
        .select('id, title, address, city, state, price, mls_number, marketing_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setListings(
        (data ?? []).map((l: Record<string, unknown>) => ({
          id: l.id as string,
          title: (l.title as string | null) ?? (l.address as string | null) ?? 'Untitled',
          address: (l.address as string | null) ?? '',
          city: (l.city as string | null) ?? '',
          state: (l.state as string | null) ?? '',
          price: l.price as number | null,
          mls_number: l.mls_number as string | null,
          mls_status: l.marketing_status as string | null,
        }))
      )
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const exportListing = async () => {
    if (!selectedId) return
    setExporting(true)
    setError(null)
    setSuccess(false)

    try {
      const selected = listings.find(l => l.id === selectedId)
      let url: string

      if (format === 'reso-json') {
        url = `/api/marketing/reso-export?listingId=${selectedId}`
      } else {
        url = `/api/marketing/mls-export?listingId=${selectedId}&mlsId=${mlsSpec}`
      }

      const res = await fetch(url, { signal: AbortSignal.timeout(90000) })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Export failed')
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const base = (selected?.address || selected?.title || 'listing').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      a.href = objectUrl
      a.download = format === 'reso-json' ? `reso-${base}.json` : `${base}-mls-package.zip`
      a.click()
      URL.revokeObjectURL(objectUrl)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const selected = listings.find(l => l.id === selectedId)

  return (
    <div className="min-h-screen bg-surface text-white">
      {/* Header */}
      <header className="h-14 bg-surface border-b border-white/5 flex items-center px-6 gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-gold/20 flex items-center justify-center">
          <FileJson className="w-4 h-4 text-primary" />
        </div>
        <span className="font-bold">MLS Submission</span>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">MLS Export &amp; Submission</h1>
          <p className="text-white/40">Export your listing as a compliant MLS photo package or RESO JSON for direct submission.</p>
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
                  <div className="w-10 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-white/30" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{selected.address || selected.title}</p>
                    <p className="text-xs text-white/40">
                      {[selected.city, selected.state].filter(Boolean).join(', ')}
                      {selected.price ? ` · $${Number(selected.price).toLocaleString()}` : ''}
                      {selected.mls_number ? ` · MLS# ${selected.mls_number}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-white/40 text-sm">Choose a listing...</span>
              )}
              <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-white/10 rounded-xl overflow-hidden z-20 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : listings.length === 0 ? (
                  <div className="p-4 text-center text-white/40 text-sm">No listings found</div>
                ) : listings.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setSelectedId(l.id); setShowDropdown(false) }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left ${selectedId === l.id ? 'bg-accent-gold/10' : ''}`}
                  >
                    <div className="w-10 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-white/30" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{l.address || l.title}</p>
                      <p className="text-xs text-white/40">
                        {[l.city, l.state].filter(Boolean).join(', ')}
                        {l.price ? ` · $${Number(l.price).toLocaleString()}` : ''}
                        {l.mls_number ? ` · MLS# ${l.mls_number}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 2 — format */}
        <div className="glass-luxury glossy-top rounded-2xl p-6 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Step 2 — Export Format</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FORMATS.map(({ type, label, desc, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setFormat(type)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${format === type ? 'border-primary bg-accent-gold/5' : 'border-white/10 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${format === type ? 'bg-accent-gold/20' : 'bg-white/5'}`}>
                    <Icon className={`w-5 h-5 ${format === type ? 'text-primary' : 'text-white/40'}`} />
                  </div>
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>

          {/* MLS spec selector — only for ZIP */}
          {format === 'zip' && (
            <div className="mt-4">
              <p className="text-xs text-white/40 mb-2">Target MLS System</p>
              <div className="flex flex-wrap gap-2">
                {MLS_SPECS.map(spec => (
                  <button
                    key={spec.id}
                    onClick={() => setMlsSpec(spec.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${mlsSpec === spec.id ? 'border-primary bg-accent-gold/10 text-primary' : 'border-white/10 text-white/50 hover:border-white/20'}`}
                  >
                    {spec.name}
                    <span className="ml-1 text-white/30">{spec.region}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 3 — export */}
        <div className="glass-luxury glossy-top rounded-2xl p-6">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Step 3 — Export &amp; Download</p>

          {error && (
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300">{error}</p>
                {error.includes('manifest') && (
                  <p className="text-xs text-red-400/70 mt-1">
                    Run the marketing pipeline from the Content Studio first to generate the MLS manifest.
                  </p>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-4">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">Export downloaded successfully!</p>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-white/40">
              {selected ? (
                <span>
                  Exporting{' '}
                  <span className="text-white/70 font-medium">{FORMATS.find(f => f.type === format)?.label}</span>
                  {' '}for <span className="text-white/70 font-medium">{selected.address || selected.title}</span>
                </span>
              ) : (
                'Select a listing to get started'
              )}
            </div>
            <button
              onClick={exportListing}
              disabled={!selectedId || exporting}
              className="flex items-center gap-2 px-6 py-3 bg-accent-gold text-black font-bold rounded-xl hover:bg-accent-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
              ) : success ? (
                <><Check className="w-4 h-4" /> Downloaded!</>
              ) : (
                <><Download className="w-4 h-4" /> Export</>
              )}
            </button>
          </div>

          <p className="text-xs text-white/30 mt-3">
            ZIP packages may take up to 60 seconds. RESO JSON is instant.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { icon: Package, label: 'MLS Compliant', desc: 'Photos resized, watermarked, and packaged to top-20 MLS specs' },
            { icon: FileText, label: 'RESO 2.0', desc: 'Data Dictionary 2.0 field mapping for any modern MLS platform' },
            { icon: ExternalLink, label: 'Direct Submit', desc: 'Download once and upload directly to your MLS portal' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-surface border border-white/5 rounded-xl p-4">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold mb-1">{label}</p>
              <p className="text-xs text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
