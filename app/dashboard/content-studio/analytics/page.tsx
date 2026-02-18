'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Heart, MessageCircle, Share2, Eye, Users, TrendingUp, Instagram, Facebook, Linkedin, Video, BarChart3, Download, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface PublishedPost {
  id: string
  platform: string
  post_type: string
  caption: string
  published_at: string
  likes: number
  comments: number
  shares: number
  impressions: number
  reach: number
}

const PLATFORM_ICONS: Record<string, any> = { instagram: Instagram, facebook: Facebook, linkedin: Linkedin, tiktok: Video }
const PLATFORM_COLORS: Record<string, string> = { instagram: 'from-purple-500 to-pink-500', facebook: 'from-blue-600 to-blue-400', linkedin: 'from-blue-700 to-blue-500', tiktok: 'from-gray-800 to-black' }

type DateRange = '7d' | '30d' | '90d' | 'all'

function getFromDate(range: DateRange): string | null {
  if (range === 'all') return null
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export default function PostAnalytics() {
  const [posts, setPosts] = useState<PublishedPost[]>([])
  const [totals, setTotals] = useState({ posts: 0, likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  useEffect(() => { fetchAnalytics() }, [filter, dateRange])

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.set('platform', filter)
      const from = getFromDate(dateRange)
      if (from) params.set('from', from)
      const qs = params.toString()
      const url = `/api/analytics/posts${qs ? `?${qs}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      setPosts(data.posts || [])
      setTotals(data.totals || { posts: 0, likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0 })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const exportCSV = () => {
    if (!posts.length) return
    const headers = ['Platform', 'Post Type', 'Caption', 'Published At', 'Likes', 'Comments', 'Shares', 'Impressions', 'Reach']
    const rows = posts.map(p => [
      p.platform,
      p.post_type || '',
      `"${(p.caption || '').replace(/"/g, '""')}"`,
      new Date(p.published_at).toLocaleString(),
      p.likes ?? 0,
      p.comments ?? 0,
      p.shares ?? 0,
      p.impressions ?? 0,
      p.reach ?? 0,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapr-analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="text-sm text-white/50">{label}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <Link href="/dashboard/content-studio" className="text-white/40 hover:text-white transition-colors">Content Studio</Link>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="text-white font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#D4AF37]" />Analytics</span>
          </nav>
          <div className="flex items-center gap-4">
            {/* Date range pills */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as DateRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-[#D4AF37] text-black'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {range === 'all' ? 'All' : range}
                </button>
              ))}
            </div>
            {/* Platform filters */}
            <div className="flex gap-2">
              <Button onClick={() => setFilter(null)} variant={filter === null ? 'default' : 'ghost'} size="sm" className={filter === null ? 'bg-[#D4AF37] text-black' : ''}>All</Button>
              {Object.keys(PLATFORM_ICONS).map(p => {
                const Icon = PLATFORM_ICONS[p]
                return <Button key={p} onClick={() => setFilter(p)} variant={filter === p ? 'default' : 'ghost'} size="sm" className={filter === p ? 'bg-[#D4AF37] text-black' : ''}><Icon className="w-4 h-4" /></Button>
              })}
            </div>
            {/* CSV export */}
            <Button onClick={exportCSV} variant="ghost" size="sm" disabled={posts.length === 0} className="text-white/60 hover:text-white">
              <Download className="w-4 h-4 mr-1" />CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard icon={TrendingUp} label="Posts" value={totals.posts} color="from-[#D4AF37] to-[#B8960C]" />
              <StatCard icon={Heart} label="Likes" value={totals.likes} color="from-red-500 to-pink-500" />
              <StatCard icon={MessageCircle} label="Comments" value={totals.comments} color="from-blue-500 to-cyan-500" />
              <StatCard icon={Share2} label="Shares" value={totals.shares} color="from-green-500 to-emerald-500" />
              <StatCard icon={Eye} label="Impressions" value={totals.impressions} color="from-purple-500 to-violet-500" />
              <StatCard icon={Users} label="Reach" value={totals.reach} color="from-orange-500 to-amber-500" />
            </div>

            {/* Posts List */}
            <h2 className="text-lg font-bold mb-4">Published Posts</h2>
            {posts.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
                <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No published posts yet</p>
                <Link href="/dashboard/content-studio/create-all"><Button className="mt-4 bg-[#D4AF37] hover:bg-[#B8960C] text-black">Create Your First Post</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => {
                  const Icon = PLATFORM_ICONS[post.platform] || TrendingUp
                  return (
                    <div key={post.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${PLATFORM_COLORS[post.platform]} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium capitalize">{post.post_type?.replace('-', ' ') || 'Post'}</div>
                          <div className="text-sm text-white/50 truncate">{post.caption?.slice(0, 60) || 'No caption'}...</div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center"><div className="font-medium">{post.likes}</div><div className="text-white/40 text-xs">Likes</div></div>
                          <div className="text-center"><div className="font-medium">{post.comments}</div><div className="text-white/40 text-xs">Comments</div></div>
                          <div className="text-center"><div className="font-medium">{post.shares}</div><div className="text-white/40 text-xs">Shares</div></div>
                          <div className="text-center"><div className="font-medium">{post.impressions}</div><div className="text-white/40 text-xs">Views</div></div>
                        </div>
                        <div className="text-right text-sm text-white/40">
                          {new Date(post.published_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
