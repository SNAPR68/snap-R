'use client'

import { Heart, MessageCircle, Share2, Eye, Users, TrendingUp, Download } from 'lucide-react'

export interface AnalyticsTotals {
  posts: number
  likes: number
  comments: number
  shares: number
  impressions: number
  reach: number
}

export interface AnalyticsPost {
  id: string
  platform: string
  post_type?: string
  caption?: string
  published_at: string
  likes: number
  comments: number
  shares: number
  impressions: number
  reach: number
}

interface AnalyticsContainerProps {
  totals: AnalyticsTotals
  posts: AnalyticsPost[]
}

function MiniStat({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string
}) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03]">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold">{value.toLocaleString()}</p>
        <p className="text-[10px] text-white/40">{label}</p>
      </div>
    </div>
  )
}

export function AnalyticsCollapsed({ totals }: AnalyticsContainerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <MiniStat label="Posts" value={totals.posts} icon={TrendingUp} color="bg-[#D4A017]/30" />
        <MiniStat label="Likes" value={totals.likes} icon={Heart} color="bg-red-500/30" />
        <MiniStat label="Impressions" value={totals.impressions} icon={Eye} color="bg-purple-500/30" />
        <MiniStat label="Reach" value={totals.reach} icon={Users} color="bg-orange-500/30" />
      </div>
      <div className="pt-2 border-t border-white/5 text-center">
        <p className="text-[10px] text-white/30">Click to view detailed analytics</p>
      </div>
    </div>
  )
}

export function AnalyticsExpanded({ totals, posts }: AnalyticsContainerProps) {
  const exportCSV = () => {
    if (!posts.length) return
    const headers = ['Platform', 'Post Type', 'Caption', 'Published', 'Likes', 'Comments', 'Shares', 'Impressions', 'Reach']
    const rows = posts.map(p => [
      p.platform,
      p.post_type || '',
      `"${(p.caption || '').replace(/"/g, '""')}"`,
      new Date(p.published_at).toLocaleString(),
      p.likes ?? 0, p.comments ?? 0, p.shares ?? 0, p.impressions ?? 0, p.reach ?? 0,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapr-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-white/50">Performance overview</p>
        <button
          onClick={exportCSV}
          disabled={posts.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 hover:text-white bg-white/5 rounded-lg disabled:opacity-30"
        >
          <Download className="w-3 h-3" /> Export CSV
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <TrendingUp className="w-5 h-5 text-[#D4A017] mx-auto mb-1" />
          <p className="text-xl font-bold">{totals.posts}</p>
          <p className="text-[10px] text-white/40">Posts</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-xl font-bold">{totals.likes.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">Likes</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <MessageCircle className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-xl font-bold">{totals.comments.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">Comments</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <Share2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-xl font-bold">{totals.shares.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">Shares</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <Eye className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-xl font-bold">{totals.impressions.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">Impressions</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <Users className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-xl font-bold">{totals.reach.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">Reach</p>
        </div>
      </div>

      {/* Posts list */}
      <h4 className="text-sm font-semibold mb-3">Recent Posts</h4>
      {posts.length > 0 ? (
        <div className="space-y-2">
          {posts.slice(0, 10).map(post => (
            <div key={post.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium capitalize">{post.platform}</p>
                <p className="text-xs text-white/40 truncate">{post.caption?.slice(0, 60) || 'No caption'}</p>
              </div>
              <div className="flex gap-4 text-xs text-white/50">
                <span>{post.likes} likes</span>
                <span>{post.impressions} views</span>
              </div>
              <span className="text-xs text-white/30">
                {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/30 text-center py-6">No published posts yet</p>
      )}
    </div>
  )
}
