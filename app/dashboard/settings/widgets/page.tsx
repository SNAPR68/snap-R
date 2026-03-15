'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Code2, Copy, Check, Eye } from 'lucide-react'

interface Listing {
  id: string
  title: string
  address: string
}

type WidgetType = 'before-after' | 'gallery' | 'property'

const WIDGET_OPTIONS: { type: WidgetType; label: string; description: string }[] = [
  { type: 'before-after', label: 'Before / After Slider', description: 'Interactive comparison slider showing AI-enhanced vs original photos' },
  { type: 'gallery', label: 'Photo Gallery', description: 'Carousel of enhanced listing photos with thumbnails' },
  { type: 'property', label: 'Property Card', description: 'Mini property card with hero image, price, and specs' },
]

export default function WidgetsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<string>('')
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>('before-after')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchListings = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('listings')
      .select('id, title, address')
      .eq('user_id', user.id)
      .eq('preparation_status', 'prepared')
      .order('created_at', { ascending: false })
      .limit(100)

    setListings(data ?? [])
    if (data && data.length > 0 && !selectedListing) {
      setSelectedListing(data[0].id)
    }
    setLoading(false)
  }, [selectedListing])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const embedCode = selectedListing
    ? `<script src="https://snap-r.com/widget/snapr-embed.js"></script>\n<div data-snapr-widget="${selectedWidget}" data-listing-id="${selectedListing}"></div>`
    : ''

  const previewUrl = selectedListing
    ? `https://snap-r.com/embed/${selectedWidget}/${selectedListing}`
    : ''

  const handleCopy = async () => {
    if (!embedCode) return
    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Code2 className="w-6 h-6 text-[#D4A017]" />
        <h1 className="text-2xl font-bold text-white">Embeddable Widgets</h1>
      </div>

      <p className="text-gray-400 mb-6">
        Embed interactive SnapR widgets on any website. Choose a widget type, select a listing, and copy the embed code.
      </p>

      {/* Widget Type Selection */}
      <div className="glass-luxury rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Widget Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {WIDGET_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => setSelectedWidget(opt.type)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                selectedWidget === opt.type
                  ? 'border-[#D4A017] bg-[#D4A017]/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <p className="text-white font-medium text-sm">{opt.label}</p>
              <p className="text-gray-500 text-xs mt-1">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Listing Selection */}
      <div className="glass-luxury rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Select Listing</h2>
        {loading ? (
          <p className="text-gray-500">Loading listings...</p>
        ) : listings.length === 0 ? (
          <p className="text-gray-500">No prepared listings found. Prepare a listing first to create widgets.</p>
        ) : (
          <select
            value={selectedListing}
            onChange={e => setSelectedListing(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#D4A017]/50"
            aria-label="Select listing"
          >
            {listings.map(l => (
              <option key={l.id} value={l.id}>
                {l.title ?? l.address ?? l.id}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Embed Code */}
      {selectedListing && (
        <div className="glass-luxury rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Embed Code</h2>
            <div className="flex gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </a>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#D4A017] text-black font-medium rounded-lg hover:bg-[#B8860B] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          <pre className="bg-black/50 rounded-lg p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">
            <code>{embedCode}</code>
          </pre>

          <p className="text-gray-500 text-xs mt-3">
            Paste this code into any HTML page. The widget will auto-resize to fit its container.
          </p>
        </div>
      )}

      {/* Preview */}
      {selectedListing && (
        <div className="glass-luxury rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Live Preview</h2>
          <div className="rounded-lg overflow-hidden border border-white/10" style={{ minHeight: '300px' }}>
            <iframe
              src={`/embed/${selectedWidget}/${selectedListing}`}
              className="w-full border-none"
              style={{ minHeight: '300px' }}
              title="Widget preview"
            />
          </div>
        </div>
      )}
    </div>
  )
}
