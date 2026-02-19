'use client'

import Link from 'next/link'
import { CheckCircle, Megaphone, Calendar, BarChart3, Clock } from 'lucide-react'

export interface ActivityItem {
  type: 'listing_prepared' | 'marketing_completed' | 'post_scheduled' | 'post_published'
  title: string
  subtitle: string
  timestamp: string
  href: string
  icon: 'listing' | 'marketing' | 'calendar' | 'analytics'
}

interface ActivityContainerProps {
  activities: ActivityItem[]
}

function ActivityIcon({ type }: { type: ActivityItem['icon'] }) {
  switch (type) {
    case 'listing':
      return <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-green-400" /></div>
    case 'marketing':
      return <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center"><Megaphone className="w-3.5 h-3.5 text-purple-400" /></div>
    case 'calendar':
      return <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-blue-400" /></div>
    case 'analytics':
      return <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center"><BarChart3 className="w-3.5 h-3.5 text-amber-400" /></div>
    default:
      return <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-white/40" /></div>
  }
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  return (
    <Link
      href={activity.href}
      className="flex items-center gap-3 py-2.5 hover:bg-white/[0.03] rounded-lg px-2 -mx-2 transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      <ActivityIcon type={activity.icon} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{activity.title}</p>
        <p className="text-[10px] text-white/40 truncate">{activity.subtitle}</p>
      </div>
      <span className="text-[10px] text-white/25 flex-shrink-0">{formatTimeAgo(activity.timestamp)}</span>
    </Link>
  )
}

export function ActivityCollapsed({ activities }: ActivityContainerProps) {
  const recent = activities.slice(0, 4)

  return (
    <div>
      {recent.length > 0 ? (
        <div className="divide-y divide-white/5">
          {recent.map((activity, i) => (
            <ActivityRow key={i} activity={activity} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/30 text-center py-3">No recent activity</p>
      )}
    </div>
  )
}

export function ActivityExpanded({ activities }: ActivityContainerProps) {
  // Group by date
  const grouped: Record<string, ActivityItem[]> = {}
  for (const activity of activities) {
    const dateKey = new Date(activity.timestamp).toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric'
    })
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(activity)
  }

  return (
    <div>
      {activities.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-8">No activity yet</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h4 className="text-xs font-semibold text-white/40 mb-2">{date}</h4>
              <div className="space-y-1 divide-y divide-white/5">
                {items.map((activity, i) => (
                  <ActivityRow key={i} activity={activity} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
