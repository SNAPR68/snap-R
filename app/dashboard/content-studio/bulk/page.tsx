'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Check, Image, Instagram, Facebook, Linkedin, Video, Download, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Listing {
  id: string
  address: string
  city: string
  state: string
  price: number
  bedrooms: number
  bathrooms: number
  square_feet: number
  photos: string[]
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-400' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-500' },
]

const POST_TYPES = [
  { id: 'just-listed', name: 'Just Listed', emoji: '🏠' },
  { id: 'open-house', name: 'Open House', emoji: '🚪' },
  { id: 'price-reduced', name: 'Price Reduced', emoji: '💰' },
  { id: 'just-sold', name: 'Just Sold', emoji: '🎉' },
]

export default function BulkCreator() {
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListings, setSelectedListings] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])
  const [postType, setPostType] = useState('just-listed')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings')
      const data = await res.json()
      setListings(data.listings || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggleListing = (id: string) => {
    setSelectedListings(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id])
  }

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const generateAll = async () => {
    if (selectedListings.length === 0 || selectedPlatforms.length === 0) return
    setGenerating(true)
    setProgress(0)
    setCompleted([])

    const total = selectedListings.length * selectedPlatforms.length
    let done = 0

    for (const listingId of selectedListings) {
      for (const platform of selectedPlatforms) {
        // Open creator for each combination
        const url = `/dashboard/content-studio/create-all?listing=${listingId}&platform=${platform}&type=${postType}`
        // In a real implementation, this would generate and download automatically
        // For now, we'll just track progress
        await new Promise(r => setTimeout(r, 500))
        done++
        setProgress(Math.round((done / total) * 100))
        setCompleted(prev => [...prev, `${listingId}-${platform}`])
      }
    }

    setGenerating(false)
  }

  const totalPosts = selectedListings.length * selectedPlatforms.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#D4AF37]" />Bulk Create</h1>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {/* Select Listings */}
          <div className="col-span-2">
            <h2 className="text-lg font-bold mb-4">Select Listings ({selectedListings.length})</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" /></div>
            ) : listings.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
                <Image className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No listings found</p>
                <Link href="/dashboard/listings/new"><Button className="mt-4 bg-[#D4AF37] hover:bg-[#B8960C] text-black">Add Listing</Button></Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {listings.map(listing => {
                  const selected = selectedListings.includes(listing.id)
                  return (
                    <button
                      key={listing.id}
                      onClick={() => toggleListing(listing.id)}
                      className={`p-4 rounded-xl border text-left transition ${selected ? 'bg-[#D4AF37]/20 border-[#D4AF37]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                          {listing.photos?.[0] && <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{listing.address}</p>
                          <p className="text-sm text-white/50">{listing.city}, {listing.state}</p>
                          <p className="text-sm text-[#D4AF37] font-medium">${listing.price?.toLocaleString()}</p>
                        </div>
                        {selected && <Check className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-6">
            {/* Platforms */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-3">Platforms</h3>
              <div className="space-y-2">
                {PLATFORMS.map(p => {
                  const Icon = p.icon
                  const selected = selectedPlatforms.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition ${selected ? 'bg-white/10 border border-[#D4AF37]' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${p.color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="flex-1 text-left">{p.name}</span>
                      {selected && <Check className="w-4 h-4 text-[#D4AF37]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Post Type */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-3">Post Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {POST_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPostType(t.id)}
                    className={`p-2 rounded-lg text-sm transition ${postType === t.id ? 'bg-[#D4AF37] text-black font-medium' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {t.emoji} {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary & Generate */}
            <div className="bg-[#D4AF37]/10 rounded-xl p-4 border border-[#D4AF37]/30">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-[#D4AF37]">{totalPosts}</div>
                <div className="text-sm text-white/60">posts to generate</div>
              </div>
              
              {generating ? (
                <div className="space-y-3">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-sm text-center text-white/60">{progress}% complete</p>
                </div>
              ) : (
                <Button
                  onClick={generateAll}
                  disabled={totalPosts === 0}
                  className="w-full bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold h-12"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Generate All Posts
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
