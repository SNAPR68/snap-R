'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image';
import {
  ArrowLeft, Globe, Home, Loader2, ExternalLink, Copy, Check,
  ChevronDown, Pencil, Plus, Eye, ToggleRight, ToggleLeft, Trash2
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

interface PropertySite {
  id: string
  slug: string
  template: string
  is_published: boolean
  views: number
  leads: number
  created_at: string
  listing_id: string
  listing?: Listing
}

type Theme = 'modern' | 'classic' | 'minimal' | 'luxury'

const themeStyles: Record<Theme, { bg: string; accent: string; label: string }> = {
  modern: { bg: 'bg-gray-900', accent: 'bg-blue-500', label: 'Modern Dark' },
  classic: { bg: 'bg-white', accent: 'bg-green-600', label: 'Classic Light' },
  minimal: { bg: 'bg-gray-100', accent: 'bg-black', label: 'Minimal' },
  luxury: { bg: 'bg-black', accent: 'bg-amber-500', label: 'Luxury Gold' },
}

export default function PropertySitesClient() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')

  const [sites, setSites] = useState<PropertySite[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListingId, setSelectedListingId] = useState<string>(listingId ?? '')
  const [theme, setTheme] = useState<Theme>('luxury')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [sitesRes, listingsRes] = await Promise.all([
        supabase.from('property_sites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('listings').select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status)').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      const listingMap: Record<string, Listing> = {}
      const processedListings: Listing[] = []
      for (const l of listingsRes.data ?? []) {
        const photos = (l.photos ?? []) as Array<{ raw_url: string | null; processed_url: string | null }>
        let thumbnail: string | null = null
        const firstPhoto = photos[0]
        if (firstPhoto) {
          const path = firstPhoto.processed_url || firstPhoto.raw_url
          if (path) {
            if (path.startsWith('http')) {
              thumbnail = path
            } else {
              const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
              thumbnail = data?.signedUrl ?? null
            }
          }
        }
        const listing: Listing = {
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
        }
        processedListings.push(listing)
        listingMap[l.id] = listing
      }

      const enrichedSites = (sitesRes.data ?? []).map((s: PropertySite) => ({
        ...s,
        listing: listingMap[s.listing_id],
      }))

      setSites(enrichedSites)
      setListings(processedListings)
    } catch {
      // load failed silently
    } finally {
      setLoading(false)
    }
  }

  const getSiteUrl = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://snap-r.com'
    return `${origin}/p/${slug}`
  }

  const copyLink = async (site: PropertySite) => {
    await navigator.clipboard.writeText(getSiteUrl(site.slug))
    setCopiedId(site.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const createSite = async () => {
    if (!selectedListingId) return
    setCreating(true)
    try {
      const res = await fetch('/api/property-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedListingId, template: theme }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json() as { site?: PropertySite }
      if (data.site) {
        window.location.href = `/dashboard/content-studio/sites/${data.site.id}`
      }
    } catch {
      // create failed
    } finally {
      setCreating(false)
    }
  }

  const deleteSite = async (siteId: string) => {
    if (!confirm('Delete this property site? This cannot be undone.')) return
    setDeletingId(siteId)
    try {
      await fetch('/api/property-site', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: siteId }),
        signal: AbortSignal.timeout(15000),
      })
      setSites(s => s.filter(x => x.id !== siteId))
    } catch {
      // delete failed
    } finally {
      setDeletingId(null)
    }
  }

  const selectedListing = listings.find(l => l.id === selectedListingId)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4 gap-4">
        <Link href="/dashboard/content-studio" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-bold">Property Sites</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* Create new site */}
        <div className="glass-luxury glossy-top rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#D4A017]" /> Create New Property Site
          </h2>
          <p className="text-white/40 text-sm mb-5">Select a listing and theme — we&apos;ll generate a public landing page instantly.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Select Listing</label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(d => !d)}
                  className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                >
                  {selectedListing ? (
                    <div className="flex items-center gap-3">
                      {selectedListing.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <Image src={selectedListing.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" width={400} height={300} unoptimized />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Home className="w-5 h-5 text-white/30" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium text-sm">{selectedListing.title}</p>
                        <p className="text-xs text-white/40">{selectedListing.city}{selectedListing.city && selectedListing.state ? ', ' : ''}{selectedListing.state}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-white/40 text-sm">Choose a listing...</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-20 max-h-64 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-cyan-400" /></div>
                    ) : listings.length === 0 ? (
                      <div className="p-4 text-center text-white/40 text-sm">No listings found</div>
                    ) : listings.map(l => (
                      <button
                        key={l.id}
                        onClick={() => { setSelectedListingId(l.id); setShowDropdown(false) }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left ${selectedListingId === l.id ? 'bg-cyan-500/10' : ''}`}
                      >
                        {l.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <Image src={l.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" width={400} height={300} unoptimized />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Home className="w-5 h-5 text-white/30" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{l.title}</p>
                          <p className="text-xs text-white/40">{l.city}{l.city && l.state ? ', ' : ''}{l.state}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(themeStyles) as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-2.5 rounded-xl border-2 transition-all text-left ${theme === t ? 'border-[#D4A017]' : 'border-white/10 hover:border-white/20'}`}
                  >
                    <div className={`h-6 rounded-lg mb-1.5 flex items-center justify-center ${themeStyles[t].bg}`}>
                      <div className={`w-8 h-1.5 rounded ${themeStyles[t].accent}`} />
                    </div>
                    <p className="text-xs font-medium text-white/70">{themeStyles[t].label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={createSite}
            disabled={!selectedListingId || creating}
            className="mt-5 flex items-center gap-2 px-6 py-3 bg-[#D4A017] text-black font-bold rounded-xl hover:bg-[#B8860B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? 'Creating...' : 'Create & Edit Site'}
          </button>
        </div>

        {/* Existing sites list */}
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Your Sites ({sites.length})</h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No property sites yet. Create one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map(site => (
              <div key={site.id} className="glass-luxury glossy-top rounded-2xl overflow-hidden">
                <div className="h-36 bg-[#1A1A1A] relative">
                  {site.listing?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image src={site.listing.thumbnail} alt="" className="w-full h-full object-cover" width={400} height={300} unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-10 h-10 text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${site.is_published ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                    {site.is_published ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {site.is_published ? 'Live' : 'Draft'}
                  </div>
                </div>

                <div className="p-4">
                  <p className="font-semibold text-sm mb-0.5 truncate">{site.listing?.title ?? 'Untitled'}</p>
                  <p className="text-xs text-white/40 mb-3 truncate font-mono">/p/{site.slug}</p>

                  <div className="flex gap-4 mb-4 text-xs text-white/50">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {site.views} views</span>
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {themeStyles[(site.template as Theme) ?? 'luxury']?.label ?? site.template}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/content-studio/sites/${site.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#D4A017] text-black rounded-lg text-sm font-bold hover:bg-[#B8860B] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => copyLink(site)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors"
                      title="Copy link"
                    >
                      {copiedId === site.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/50" />}
                    </button>
                    <a
                      href={getSiteUrl(site.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors"
                      title="Open site"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-white/50" />
                    </a>
                    <button
                      onClick={() => deleteSite(site.id)}
                      disabled={deletingId === site.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-red-900/30 hover:border-red-500/30 hover:text-red-400 transition-colors"
                      title="Delete site"
                    >
                      {deletingId === site.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-white/50" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
