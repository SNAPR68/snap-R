'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Globe, Plus, Trash2, ExternalLink, Eye, Copy, Check, QrCode } from 'lucide-react'
import Link from 'next/link'

interface PropertySite {
  id: string
  listing_id: string
  slug: string
  template: string
  views: number
  leads: number
  created_at: string
  listings?: any
}

export default function PropertySites() {
  const [sites, setSites] = useState<PropertySite[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedListing, setSelectedListing] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchSites()
    fetchListings()
  }, [])

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/property-site')
      const data = await res.json()
      setSites(data.sites || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings')
      const data = await res.json()
      setListings(data.listings || [])
    } catch (e) { console.error(e) }
  }

  const createSite = async () => {
    if (!selectedListing) return
    setCreating(true)
    try {
      const res = await fetch('/api/property-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedListing, template: 'modern' })
      })
      const data = await res.json()
      if (data.site) {
        fetchSites()
        setShowCreate(false)
        setSelectedListing('')
      }
    } catch (e) { console.error(e) }
    finally { setCreating(false) }
  }

  const deleteSite = async (id: string) => {
    if (!confirm('Delete this property site?')) return
    await fetch('/api/property-site', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setSites(sites.filter(s => s.id !== id))
  }

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-[#D4AF37]" />Property Websites</h1>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold">
            <Plus className="w-4 h-4 mr-2" />Create Site
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
              <h2 className="text-xl font-bold mb-4">Create Property Site</h2>
              <div className="mb-4">
                <label className="text-sm text-white/60 block mb-2">Select Listing</label>
                <select
                  value={selectedListing}
                  onChange={e => setSelectedListing(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Choose a listing...</option>
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.address}, {l.city}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1 border-white/20">Cancel</Button>
                <Button onClick={createSite} disabled={!selectedListing || creating} className="flex-1 bg-[#D4AF37] text-black font-bold">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sites List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h2 className="text-xl font-bold mb-2">No Property Sites Yet</h2>
            <p className="text-white/50 mb-6">Create mini landing pages for your listings</p>
            <Button onClick={() => setShowCreate(true)} className="bg-[#D4AF37] text-black font-bold"><Plus className="w-4 h-4 mr-2" />Create Your First Site</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sites.map(site => {
              const listing = listings.find(l => l.id === site.listing_id)
              return (
                <div key={site.id} className="bg-white/5 rounded-xl p-5 border border-white/10 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                    {listing?.photos?.[0] && <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{listing?.address || 'Unknown Property'}</h3>
                    <p className="text-white/50 text-sm">{listing?.city}, {listing?.state}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-white/40">/{site.slug}</span>
                      <span className="text-[#D4AF37]">{site.views} views</span>
                      <span className="text-green-400">{site.leads} leads</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyUrl(site.slug)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10" title="Copy URL">
                      {copied === site.slug ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <a href={`/p/${site.slug}`} target="_blank" className="p-2 rounded-lg bg-white/5 hover:bg-white/10" title="Preview">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${baseUrl}/p/${site.slug}`)}`} target="_blank" className="p-2 rounded-lg bg-white/5 hover:bg-white/10" title="QR Code">
                      <QrCode className="w-5 h-5" />
                    </a>
                    <button onClick={() => deleteSite(site.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
