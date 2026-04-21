'use client'

import Link from 'next/link'
import { Instagram, Facebook, Linkedin, Video, Clock, CheckCircle, Plus } from 'lucide-react'

export interface ScheduledPostItem {
  id: string
  platform: string
  content?: string
  scheduled_for: string
  status: string
}

interface CalendarContainerProps {
  scheduledPosts: ScheduledPostItem[]
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: Video,
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-gray-800',
}

function PostRow({ post }: { post: ScheduledPostItem }) {
  const Icon = PLATFORM_ICONS[post.platform] || Clock
  const colorClass = PLATFORM_COLORS[post.platform] || 'bg-white/10'
  const date = new Date(post.scheduled_for)

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-7 h-7 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 truncate">
          {(post.content || 'Scheduled post').slice(0, 50)}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-white/40">
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-[10px] text-white/25">
          {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function MiniWeekStrip({ posts }: { posts: ScheduledPostItem[] }) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  return (
    <div className="flex gap-1 mb-3">
      {days.map((day, i) => {
        const dayStr = day.toISOString().slice(0, 10)
        const count = posts.filter(p => p.scheduled_for.slice(0, 10) === dayStr).length
        const isToday = i === 0

        return (
          <div key={i} className="flex-1 text-center">
            <p className={`text-[10px] mb-1 ${isToday ? 'text-primary' : 'text-white/30'}`}>
              {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
            </p>
            <div className={`w-full aspect-square rounded-md flex items-center justify-center text-[10px] ${
              isToday ? 'bg-accent-gold/20 text-primary border border-primary/30' :
              count > 0 ? 'bg-white/10 text-white/60' : 'bg-white/[0.03] text-white/15'
            }`}>
              {count > 0 ? count : day.getDate()}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CalendarCollapsed({ scheduledPosts }: CalendarContainerProps) {
  const pending = scheduledPosts.filter(p => p.status === 'pending')
  const upcoming = pending.slice(0, 2)

  return (
    <div>
      <MiniWeekStrip posts={pending} />
      {upcoming.length > 0 ? (
        <div className="divide-y divide-white/5">
          {upcoming.map(post => (
            <PostRow key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/30 text-center py-2">No upcoming posts</p>
      )}
    </div>
  )
}

export function CalendarExpanded({ scheduledPosts }: CalendarContainerProps) {
  const pending = scheduledPosts.filter(p => p.status === 'pending')
  const published = scheduledPosts.filter(p => p.status === 'published')
  const failed = scheduledPosts.filter(p => p.status === 'failed')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="text-white/70">{pending.length} pending</span>
          <span className="text-green-400/70">{published.length} published</span>
          {failed.length > 0 && <span className="text-red-400/70">{failed.length} failed</span>}
        </div>
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-gold text-black rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Schedule Post
        </Link>
      </div>

      <MiniWeekStrip posts={pending} />

      {/* Upcoming section */}
      <h4 className="text-sm font-semibold mb-3 mt-4">Upcoming</h4>
      {pending.length > 0 ? (
        <div className="space-y-1 divide-y divide-white/5">
          {pending.map(post => (
            <PostRow key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/30 text-center py-4">No scheduled posts</p>
      )}

      {/* Published section */}
      {published.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mb-3 mt-6 text-white/50">Recently Published</h4>
          <div className="space-y-1 divide-y divide-white/5 opacity-60">
            {published.slice(0, 5).map(post => (
              <div key={post.id} className="flex items-center gap-3 py-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <PostRow post={post} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
