'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, Download, Instagram, Facebook, Linkedin, Home, Loader2, Check, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Listing { id: string; title: string; address: string; city: string; state: string; price: number | null; bedrooms: number | null; bathrooms: number | null; square_feet: number | null; thumbnail: string | null }
interface GeneratedPost { listingId: string; listingTitle: string; platform: string; imageUrl: string; caption: string }
type Platform = 'instagram' | 'facebook' | 'linkedin'
type PostType = 'just-listed' | 'open-house' | 'price-reduced' | 'just-sold'

const platformSizes = { instagram: { width: 1080, height: 1080 }, facebook: { width: 1200, height: 630 }, linkedin: { width: 1200, height: 627 } }
const postTypeLabels = { 'just-listed': { label: 'JUST LISTED', emoji: '🏠', color: '#D4AF37' }, 'open-house': { label: 'OPEN HOUSE', emoji: '🚪', color: '#22C55E' }, 'price-reduced': { label: 'PRICE REDUCED', emoji: '💰', color: '#EF4444' }, 'just-sold': { label: 'JUST SOLD', emoji: '🎉', color: '#8B5CF6' } }

export default function BulkCreatorClient() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('listing')
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListings, setSelectedListings] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>(['instagram'])
  const [postType, setPostType] = useState<PostType>('just-listed')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [showResults, setShowResults] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { loadListings() }, [])
  useEffect(() => { if (preselectedId && listings.length > 0 && !selectedListings.includes(preselectedId)) setSelectedListings([preselectedId]) }, [preselectedId, listings])

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
          const firstPhoto = photos.find((p: any) => p.processed_url) || photos[0]
          let thumbnail = null
          if (firstPhoto) {
            const path = firstPhoto.processed_url || firstPhoto.raw_url
            if (path && !path.startsWith('http')) { const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600); thumbnail = data?.signedUrl } else thumbnail = path
          }
          return { id: listing.id, title: listing.title || listing.address || 'Untitled', address: listing.address || '', city: listing.city || '', state: listing.state || '', price: listing.price, bedrooms: listing.bedrooms, bathrooms: listing.bathrooms, square_feet: listing.square_feet, thumbnail }
        }))
        setListings(processed)
      }
    } catch (error) { console.error('Error loading listings:', error) }
    setLoading(false)
  }

  const toggleListing = (id: string) => { if (selectedListings.includes(id)) setSelectedListings(selectedListings.filter(l => l !== id)); else setSelectedListings([...selectedListings, id]) }
  const togglePlatform = (platform: Platform) => { if (platforms.includes(platform)) { if (platforms.length > 1) setPlatforms(platforms.filter(p => p !== platform)) } else setPlatforms([...platforms, platform]) }
  const totalPosts = selectedListings.length * platforms.length

  const generatePost = async (listing: Listing, platform: Platform): Promise<GeneratedPost | null> => {
    const canvas = canvasRef.current
    if (!canvas || !listing.thumbnail) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const size = platformSizes[platform]
    canvas.width = size.width
    canvas.height = size.height
    try {
      const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => { const img = new window.Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = reject; img.src = src })
      const img = await loadImage(listing.thumbnail)
      const imgRatio = img.width / img.height
      const canvasRatio = canvas.width / canvas.height
      let dw, dh, dx, dy
      if (imgRatio > canvasRatio) { dh = canvas.height; dw = dh * imgRatio; dx = (canvas.width - dw) / 2; dy = 0 } else { dw = canvas.width; dh = dw / imgRatio; dx = 0; dy = (canvas.height - dh) / 2 }
      ctx.drawImage(img, dx, dy, dw, dh)
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.85)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const typeInfo = postTypeLabels[postType]
      const badgeY = platform === 'instagram' ? 80 : 50
      ctx.fillStyle = typeInfo.color
      ctx.font = 'bold 24px system-ui'
      const badgeWidth = ctx.measureText(typeInfo.label).width + 60
      const badgeX = (canvas.width - badgeWidth) / 2
      ctx.beginPath()
      ctx.roundRect(badgeX, badgeY, badgeWidth, 50, 25)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.textAlign = 'center'
      ctx.fillText(typeInfo.label, canvas.width / 2, badgeY + 33)
      const bottomY = canvas.height - 60
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 48px system-ui'
      const title = listing.title.length > 30 ? listing.title.substring(0, 30) + '...' : listing.title
      ctx.fillText(title, canvas.width / 2, bottomY - 120)
      const location = [listing.city, listing.state].filter(Boolean).join(', ')
      if (location) { ctx.font = '28px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(location, canvas.width / 2, bottomY - 70) }
      if (listing.price) { ctx.font = 'bold 56px system-ui'; ctx.fillStyle = typeInfo.color; ctx.fillText('$' + listing.price.toLocaleString(), canvas.width / 2, bottomY - 10) }
      const features = [listing.bedrooms ? listing.bedrooms + ' Beds' : null, listing.bathrooms ? listing.bathrooms + ' Baths' : null, listing.square_feet ? listing.square_feet.toLocaleString() + ' Sq Ft' : null].filter(Boolean)
      if (features.length > 0) { ctx.font = '24px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText(features.join('  •  '), canvas.width / 2, bottomY + 30) }
      const imageUrl = canvas.toDataURL('image/jpeg', 0.95)
      const caption = generateCaption(listing, postType)
      return { listingId: listing.id, listingTitle: listing.title, platform, imageUrl, caption }
    } catch (error) { console.error('Error generating post:', error); return null }
  }

  const generateCaption = (listing: Listing, type: PostType): string => {
    const typeInfo = postTypeLabels[type]
    const location = [listing.city, listing.state].filter(Boolean).join(', ')
    const price = listing.price ? '$' + listing.price.toLocaleString() : ''
    const features = [listing.bedrooms ? listing.bedrooms + ' bedrooms' : null, listing.bathrooms ? listing.bathrooms + ' bathrooms' : null, listing.square_feet ? listing.square_feet.toLocaleString() + ' sq ft' : null].filter(Boolean).join(', ')
    const captions: Record<PostType, string> = {
      'just-listed': typeInfo.emoji + ' JUST LISTED! ' + typeInfo.emoji + '\n\n' + listing.title + '\n📍 ' + location + '\n💰 ' + price + '\n\n' + (features ? '✨ ' + features + '\n\n' : '') + 'Schedule your private showing today!\n\n#JustListed #RealEstate #NewListing #DreamHome',
      'open-house': typeInfo.emoji + ' OPEN HOUSE ' + typeInfo.emoji + '\n\n' + listing.title + '\n📍 ' + location + '\n💰 ' + price + '\n\n' + (features ? '✨ ' + features + '\n\n' : '') + 'Join us this weekend!\n\n#OpenHouse #RealEstate #HouseHunting',
      'price-reduced': typeInfo.emoji + ' PRICE REDUCED! ' + typeInfo.emoji + '\n\n' + listing.title + '\n📍 ' + location + '\n💰 NOW ' + price + '\n\n' + (features ? '✨ ' + features + '\n\n' : '') + 'Don\'t miss this opportunity!\n\n#PriceReduced #RealEstate #GreatDeal',
      'just-sold': typeInfo.emoji + ' JUST SOLD! ' + typeInfo.emoji + '\n\n' + listing.title + '\n�� ' + location + '\n\nCongratulations to the new homeowners! 🎉\n\n#JustSold #RealEstate #Sold'
    }
    return captions[type]
  }

  const handleGenerate = async () => {
    if (selectedListings.length === 0) return
    setGenerating(true); setProgress(0); setGeneratedPosts([])
    const selectedListingData = listings.filter(l => selectedListings.includes(l.id))
    const posts: GeneratedPost[] = []
    let completed = 0
    const total = selectedListingData.length * platforms.length
    for (const listing of selectedListingData) {
      for (const platform of platforms) {
        const post = await generatePost(listing, platform)
        if (post) posts.push(post)
        completed++
        setProgress(Math.round((completed / total) * 100))
      }
    }
    setGeneratedPosts(posts); setGenerating(false); setShowResults(true)
  }

  const downloadAll = async () => { for (const post of generatedPosts) { const link = document.createElement('a'); link.href = post.imageUrl; link.download = post.listingTitle.replace(/[^a-z0-9]/gi, '_') + '_' + post.platform + '.jpg'; link.click(); await new Promise(r => setTimeout(r, 500)) } }
  const copyAllCaptions = () => { const allCaptions = generatedPosts.map(p => '--- ' + p.listingTitle + ' (' + p.platform + ') ---\n' + p.caption).join('\n\n'); navigator.clipboard.writeText(allCaptions); alert('All captions copied!') }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <canvas ref={canvasRef} className="hidden" />
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4">
        <Link href="/dashboard/content-studio" className="flex items-center gap-2 hover:opacity-80"><ArrowLeft className="w-4 h-4 text-white/50" /><span className="text-white/50 text-sm">Back</span></Link>
        <div className="h-5 w-px bg-white/10 mx-4" />
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center"><Zap className="w-4 h-4" /></div><span className="font-bold">Bulk Create</span></div>
      </header>
      {showResults ? (
        <div className="p-6"><div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6"><div><h2 className="text-2xl font-bold">Generated Posts</h2><p className="text-white/50">{generatedPosts.length} posts created</p></div><div className="flex gap-3"><button onClick={() => setShowResults(false)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">Create More</button><button onClick={copyAllCaptions} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">Copy All Captions</button><button onClick={downloadAll} className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 flex items-center gap-2 font-semibold"><Download className="w-4 h-4" />Download All</button></div></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{generatedPosts.map((post, i) => (
            <div key={i} className="bg-[#111] rounded-xl overflow-hidden border border-white/5">
              <div className="aspect-square relative"><img src={post.imageUrl} alt="" className="w-full h-full object-cover" /><div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-xs capitalize">{post.platform}</div></div>
              <div className="p-3"><h4 className="font-medium text-sm truncate">{post.listingTitle}</h4><p className="text-white/40 text-xs mt-1 line-clamp-2">{post.caption.substring(0, 100)}...</p><div className="flex gap-2 mt-3"><button onClick={() => { const link = document.createElement('a'); link.href = post.imageUrl; link.download = post.listingTitle.replace(/[^a-z0-9]/gi, '_') + '_' + post.platform + '.jpg'; link.click() }} className="flex-1 py-2 bg-white/10 rounded-lg text-xs hover:bg-white/20">Download</button><button onClick={() => { navigator.clipboard.writeText(post.caption); alert('Caption copied!') }} className="flex-1 py-2 bg-white/10 rounded-lg text-xs hover:bg-white/20">Copy Caption</button></div></div>
            </div>
          ))}</div>
        </div></div>
      ) : (
        <div className="flex h-[calc(100vh-56px)]">
          <div className="flex-1 p-6 overflow-auto">
            <h2 className="text-lg font-bold mb-4">Select Listings ({selectedListings.length})</h2>
            {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            : listings.length === 0 ? <div className="text-center py-12 bg-[#111] rounded-xl border border-white/5"><Home className="w-12 h-12 text-white/10 mx-auto mb-3" /><p className="text-white/40">No listings found</p></div>
            : <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{listings.map(listing => (
              <button key={listing.id} onClick={() => toggleListing(listing.id)} className={'relative bg-[#111] rounded-xl border-2 overflow-hidden text-left transition-all ' + (selectedListings.includes(listing.id) ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-white/5 hover:border-white/20')}>
                <div className="aspect-video relative">{listing.thumbnail ? <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Home className="w-8 h-8 text-white/10" /></div>}{selectedListings.includes(listing.id) && <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"><Check className="w-4 h-4" /></div>}</div>
                <div className="p-3"><h3 className="font-medium truncate">{listing.title}</h3><p className="text-sm text-white/40 truncate">{listing.address}</p>{listing.price && <p className="text-sm text-purple-400 mt-1">${listing.price.toLocaleString()}</p>}</div>
              </button>
            ))}</div>}
          </div>
          <aside className="w-80 bg-[#111] border-l border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5"><h3 className="font-medium mb-3">Platforms</h3><div className="space-y-2">{[{ id: 'instagram' as Platform, icon: Instagram, color: 'from-purple-500 to-pink-500', label: 'Instagram' }, { id: 'facebook' as Platform, icon: Facebook, color: 'bg-blue-600', label: 'Facebook' }, { id: 'linkedin' as Platform, icon: Linkedin, color: 'bg-blue-700', label: 'LinkedIn' }].map(p => (<button key={p.id} onClick={() => togglePlatform(p.id)} className={'w-full flex items-center gap-3 p-3 rounded-xl transition-all ' + (platforms.includes(p.id) ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5 border border-transparent hover:border-white/10')}><div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (p.id === 'instagram' ? 'bg-gradient-to-r ' + p.color : p.color)}><p.icon className="w-4 h-4" /></div><span>{p.label}</span>{platforms.includes(p.id) && <Check className="w-4 h-4 ml-auto text-purple-400" />}</button>))}</div></div>
            <div className="p-4 border-b border-white/5"><h3 className="font-medium mb-3">Post Type</h3><div className="grid grid-cols-2 gap-2">{Object.entries(postTypeLabels).map(([id, info]) => (<button key={id} onClick={() => setPostType(id as PostType)} className={'py-2 px-3 rounded-lg text-sm transition-all ' + (postType === id ? 'text-white' : 'bg-white/5 text-white/60 hover:bg-white/10')} style={{ backgroundColor: postType === id ? info.color : undefined }}>{info.emoji} {info.label.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</button>))}</div></div>
            <div className="p-4 mt-auto"><div className="bg-white/5 rounded-xl p-4 mb-4 text-center"><p className="text-3xl font-bold text-purple-400">{totalPosts}</p><p className="text-sm text-white/50">posts to generate</p></div>{generating ? <div className="space-y-3"><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-500 transition-all duration-300" style={{width:progress+'%'}} /></div><p className="text-center text-sm text-white/50">Generating... {progress}%</p></div> : <button onClick={handleGenerate} disabled={!selectedListings.length} className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"><Package className="w-4 h-4" />Generate All Posts</button>}</div>
          </aside>
        </div>
      )}
    </div>
  )
}
