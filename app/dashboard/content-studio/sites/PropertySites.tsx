'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Home, Loader2, ExternalLink, Copy, Check, Palette, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Listing { id: string; title: string; address: string; city: string; state: string; price: number | null; bedrooms: number | null; bathrooms: number | null; square_feet: number | null; description: string | null; thumbnail: string | null; photos: string[] }
type Theme = 'modern' | 'classic' | 'minimal' | 'luxury'

export default function PropertySitesClient() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [theme, setTheme] = useState<Theme>('modern')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => { loadListings() }, [])
  useEffect(() => { if (listingId && listings.length > 0) { const l = listings.find(x => x.id === listingId); if (l) setSelectedListing(l) } }, [listingId, listings])

  const loadListings = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: listingsData } = await supabase.from('listings').select('*, photos(id, raw_url, processed_url, status)').eq('user_id', user.id).order('created_at', { ascending: false })
      if (listingsData) {
        const processed = await Promise.all(listingsData.map(async (listing: any) => {
          const photos = listing.photos || []
          const photoUrls: string[] = []
          let thumbnail = null
          for (const photo of photos) {
            const path = photo.processed_url || photo.raw_url
            if (path) {
              let url = path
              if (!path.startsWith('http')) { const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600); url = data?.signedUrl || path }
              photoUrls.push(url)
              if (!thumbnail) thumbnail = url
            }
          }
          return { id: listing.id, title: listing.title || listing.address || 'Untitled', address: listing.address || '', city: listing.city || '', state: listing.state || '', price: listing.price, bedrooms: listing.bedrooms, bathrooms: listing.bathrooms, square_feet: listing.square_feet, description: listing.description, thumbnail, photos: photoUrls }
        }))
        setListings(processed)
      }
    } catch (error) { console.error('Error loading listings:', error) }
    setLoading(false)
  }

  const getPropertyUrl = (listing: Listing) => {
    const slug = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://snap-r.com'
    return origin + '/p/' + slug + '-' + listing.id.slice(0, 8)
  }

  const copyToClipboard = () => { if (!selectedListing) return; navigator.clipboard.writeText(getPropertyUrl(selectedListing)); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const themeStyles: Record<Theme, { bg: string; accent: string; text: string }> = {
    modern: { bg: 'bg-gray-900', accent: 'bg-blue-500', text: 'Modern Dark' },
    classic: { bg: 'bg-white', accent: 'bg-green-600', text: 'Classic Light' },
    minimal: { bg: 'bg-gray-100', accent: 'bg-black', text: 'Minimal' },
    luxury: { bg: 'bg-black', accent: 'bg-amber-500', text: 'Luxury Gold' }
  }
  const currentTheme = themeStyles[theme]
  const isLightTheme = theme === 'classic' || theme === 'minimal'

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4">
        <Link href="/dashboard/content-studio" className="flex items-center gap-2 hover:opacity-80"><ArrowLeft className="w-4 h-4 text-white/50" /><span className="text-white/50 text-sm">Back</span></Link>
        <div className="h-5 w-px bg-white/10 mx-4" />
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center"><Globe className="w-4 h-4" /></div><span className="font-bold">Property Sites</span></div>
      </header>
      <div className="flex h-[calc(100vh-56px)]">
        <aside className="w-96 bg-[#111] border-r border-white/5 flex flex-col p-4 overflow-auto">
          <div className="mb-6"><h3 className="font-medium mb-2">Select Property</h3><div className="relative"><button onClick={() => setShowDropdown(!showDropdown)} className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20">{selectedListing ? <div className="flex items-center gap-3">{selectedListing.thumbnail ? <img src={selectedListing.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Home className="w-5 h-5 text-white/30" /></div>}<div className="text-left"><p className="font-medium text-sm">{selectedListing.title}</p><p className="text-xs text-white/40">{selectedListing.city}{selectedListing.city && selectedListing.state ? ', ' : ''}{selectedListing.state}</p></div></div> : <span className="text-white/50">Select a Listing</span>}<ChevronDown className="w-4 h-4 text-white/50" /></button>{showDropdown && <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-10 max-h-60 overflow-auto">{loading ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-cyan-500" /></div> : listings.length === 0 ? <div className="p-4 text-center text-white/40 text-sm">No listings found</div> : listings.map(l => <button key={l.id} onClick={() => { setSelectedListing(l); setShowDropdown(false) }} className={'w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ' + (selectedListing?.id === l.id ? 'bg-cyan-500/10' : '')}>{l.thumbnail ? <img src={l.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Home className="w-5 h-5 text-white/30" /></div>}<div className="text-left"><p className="font-medium text-sm">{l.title}</p><p className="text-xs text-white/40">{l.photos.length} photos</p></div></button>)}</div>}</div></div>
          <div className="mb-6"><h3 className="font-medium mb-2 flex items-center gap-2"><Palette className="w-4 h-4 text-cyan-400" />Site Theme</h3><div className="grid grid-cols-2 gap-2">{(Object.keys(themeStyles) as Theme[]).map(t => <button key={t} onClick={() => setTheme(t)} className={'p-3 rounded-xl border-2 transition-all ' + (theme === t ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-white/10 hover:border-white/20')}><div className={'h-8 rounded-lg mb-2 flex items-center justify-center ' + themeStyles[t].bg}><div className={'w-10 h-2 rounded ' + themeStyles[t].accent} /></div><p className="text-xs font-medium">{themeStyles[t].text}</p></button>)}</div></div>
          <div className="mb-6"><h3 className="font-medium mb-2">Site Includes</h3><div className="space-y-2 text-sm text-white/60">{['Photo Gallery with Lightbox', 'Property Details Section', 'Contact Form', 'Mobile Responsive', 'Social Share Buttons', 'SEO Optimized'].map((feature, i) => <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"><Check className="w-4 h-4 text-green-400" /><span>{feature}</span></div>)}</div></div>
          {selectedListing && <div className="mt-auto space-y-3"><div className="p-3 bg-white/5 rounded-xl"><p className="text-xs text-white/50 mb-1">Property Site URL:</p><code className="text-xs text-cyan-400 break-all">{getPropertyUrl(selectedListing)}</code></div><div className="flex gap-2"><button onClick={copyToClipboard} className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 flex items-center justify-center gap-2">{copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy Link'}</button><a href={selectedListing ? getPropertyUrl(selectedListing) : '#'} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" />Open Site</a></div></div>}
        </aside>
        <div className="flex-1 bg-[#080808] p-6 overflow-auto">
          {selectedListing ? <div className="max-w-3xl mx-auto"><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Site Preview</h2></div><div className="rounded-xl overflow-hidden border border-white/10"><div className="bg-[#1A1A1A] px-4 py-2 flex items-center gap-3 border-b border-white/5"><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" /></div><div className="flex-1 bg-white/5 rounded-lg px-3 py-1 text-xs text-white/50 truncate">{getPropertyUrl(selectedListing)}</div></div><div className={currentTheme.bg + ' min-h-[500px]'}><div className="relative h-64">{selectedListing.thumbnail ? <img src={selectedListing.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center"><Home className="w-16 h-16 text-white/20" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-6"><h1 className="text-2xl font-bold text-white mb-2">{selectedListing.title}</h1><p className="text-white/70">{selectedListing.address}</p></div></div><div className={'p-6 ' + (isLightTheme ? 'text-gray-900' : 'text-white')}>{selectedListing.price && <p className={'text-3xl font-bold mb-4 ' + (theme === 'luxury' ? 'text-amber-500' : '')}>${selectedListing.price.toLocaleString()}</p>}<div className="grid grid-cols-3 gap-4 mb-6">{selectedListing.bedrooms && <div className={'p-3 rounded-lg text-center ' + (isLightTheme ? 'bg-gray-100' : 'bg-white/10')}><p className="text-2xl font-bold">{selectedListing.bedrooms}</p><p className={'text-sm ' + (isLightTheme ? 'text-gray-500' : 'text-white/50')}>Beds</p></div>}{selectedListing.bathrooms && <div className={'p-3 rounded-lg text-center ' + (isLightTheme ? 'bg-gray-100' : 'bg-white/10')}><p className="text-2xl font-bold">{selectedListing.bathrooms}</p><p className={'text-sm ' + (isLightTheme ? 'text-gray-500' : 'text-white/50')}>Baths</p></div>}{selectedListing.square_feet && <div className={'p-3 rounded-lg text-center ' + (isLightTheme ? 'bg-gray-100' : 'bg-white/10')}><p className="text-2xl font-bold">{selectedListing.square_feet.toLocaleString()}</p><p className={'text-sm ' + (isLightTheme ? 'text-gray-500' : 'text-white/50')}>Sq Ft</p></div>}</div>{selectedListing.photos.length > 1 && <div className="grid grid-cols-4 gap-2">{selectedListing.photos.slice(0, 4).map((photo, i) => <div key={i} className="aspect-square rounded-lg overflow-hidden"><img src={photo} alt="" className="w-full h-full object-cover" /></div>)}</div>}</div></div></div></div>
          : <div className="h-full flex flex-col items-center justify-center text-center"><div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Globe className="w-10 h-10 text-white/20" /></div><h3 className="text-lg font-medium mb-2">Create a Property Site</h3><p className="text-white/40 max-w-sm">Select a listing to generate a beautiful landing page for your property</p></div>}
        </div>
      </div>
    </div>
  )
}
