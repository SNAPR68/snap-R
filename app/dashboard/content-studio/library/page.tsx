'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, FolderOpen, Heart, Trash2, Copy, Search, Filter, Grid, List } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { id: 'all', name: 'All Content' },
  { id: 'just-listed', name: 'Just Listed' },
  { id: 'open-house', name: 'Open House' },
  { id: 'just-sold', name: 'Just Sold' },
  { id: 'price-reduced', name: 'Price Reduced' },
  { id: 'market-update', name: 'Market Update' },
  { id: 'general', name: 'General' },
]

interface ContentItem {
  id: string
  name: string
  category: string
  platform: string
  post_type: string
  image_url: string
  caption: string
  is_favorite: boolean
  use_count: number
  created_at: string
}

export default function ContentLibrary() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => { fetchContent() }, [category, favoritesOnly])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (favoritesOnly) params.set('favorites', 'true')
      const res = await fetch(`/api/content-library?${params}`)
      const data = await res.json()
      setContent(data.content || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggleFavorite = async (id: string) => {
    await fetch('/api/content-library', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'favorite' })
    })
    setContent(content.map(c => c.id === id ? { ...c, is_favorite: !c.is_favorite } : c))
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this saved content?')) return
    await fetch('/api/content-library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setContent(content.filter(c => c.id !== id))
  }

  const copyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption)
  }

  const filtered = content.filter(c => 
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.caption?.toLowerCase().includes(search.toLowerCase())
  )

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'from-purple-500 to-pink-500',
      facebook: 'from-blue-600 to-blue-400',
      linkedin: 'from-blue-700 to-blue-500',
      tiktok: 'from-gray-900 to-gray-700'
    }
    return colors[platform] || 'from-gray-600 to-gray-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><FolderOpen className="w-5 h-5 text-[#D4AF37]" />Content Library</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('grid')} className={`p-2 rounded ${view === 'grid' ? 'bg-white/10' : ''}`}><Grid className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'bg-white/10' : ''}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search saved content..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-2 rounded-lg text-sm transition ${category === cat.id ? 'bg-[#D4AF37] text-black font-medium' : 'bg-white/5 hover:bg-white/10'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${favoritesOnly ? 'bg-pink-500/20 text-pink-400 border border-pink-500' : 'bg-white/5 hover:bg-white/10'}`}
          >
            <Heart className={`w-4 h-4 ${favoritesOnly ? 'fill-pink-400' : ''}`} />Favorites
          </button>
        </div>

        {/* Content Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h2 className="text-xl font-bold mb-2">No Saved Content</h2>
            <p className="text-white/50 mb-6">Save posts from the Content Creator to access them here</p>
            <Link href="/dashboard/content-studio/create-all"><Button className="bg-[#D4AF37] text-black font-bold">Create Content</Button></Link>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/50 transition group">
                <div className="aspect-square relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <FolderOpen className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <div className={`px-2 py-0.5 rounded text-xs font-medium text-white bg-gradient-to-r ${getPlatformColor(item.platform)}`}>
                      {item.platform}
                    </div>
                  </div>
                  <button onClick={() => toggleFavorite(item.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition">
                    <Heart className={`w-4 h-4 ${item.is_favorite ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">{item.name}</h3>
                  <p className="text-xs text-white/50 truncate mt-1">{item.caption?.slice(0, 60)}...</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-white/40">Used {item.use_count}x</span>
                    <div className="flex gap-1">
                      <button onClick={() => copyCaption(item.caption)} className="p-1.5 rounded bg-white/5 hover:bg-white/10"><Copy className="w-3 h-3" /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-white/50 truncate">{item.caption?.slice(0, 80)}...</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium text-white bg-gradient-to-r ${getPlatformColor(item.platform)}`}>{item.platform}</div>
                <div className="flex gap-2">
                  <button onClick={() => toggleFavorite(item.id)}><Heart className={`w-5 h-5 ${item.is_favorite ? 'fill-pink-500 text-pink-500' : 'text-white/40'}`} /></button>
                  <button onClick={() => copyCaption(item.caption)}><Copy className="w-5 h-5 text-white/40 hover:text-white" /></button>
                  <button onClick={() => deleteItem(item.id)}><Trash2 className="w-5 h-5 text-white/40 hover:text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
