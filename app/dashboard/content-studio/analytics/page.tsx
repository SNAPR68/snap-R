'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Heart, MessageCircle, Share2, Eye, Users, TrendingUp, Instagram, Facebook, Linkedin, Video, BarChart3 } from 'lucide-react'
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

export default function PostAnalytics() {
  const [posts, setPosts] = useState<PublishedPost[]>([])
  const [totals, setTotals] = useState({ posts: 0, likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => { fetchAnalytics() }, [filter])

  const fetchAnalytics = async () => {
    try {
      const url = filter ? `/api/analytics/posts?platform=${filter}` : '/api/analytics/posts'
      const res = await fetch(url)
      const data = await res.json()
      setPosts(data.posts || [])
      setTotals(data.totals || { posts: 0, likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0 })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#D4AF37]" />Post Analytics</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setFilter(null)} variant={filter === null ? 'default' : 'ghost'} size="sm" className={filter === null ? 'bg-[#D4AF37] text-black' : ''}>All</Button>
            {Object.keys(PLATFORM_ICONS).map(p => {
              const Icon = PLATFORM_ICONS[p]
              return <Button key={p} onClick={() => setFilter(p)} variant={filter === p ? 'default' : 'ghost'} size="sm" className={filter === p ? 'bg-[#D4AF37] text-black' : ''}><Icon className="w-4 h-4" /></Button>
            })}
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
