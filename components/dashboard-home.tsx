'use client'

import Link from 'next/link'
import {
  Plus, Sparkles, Calendar, BarChart3, Home, Clock,
  CheckCircle, Megaphone, Eye, ArrowRight, Loader2,
  type LucideIcon
} from 'lucide-react'
import { GettingStartedChecklist } from './getting-started-checklist'

interface MetricsData {
  activeListings: number
  scheduledPosts: number
  publishedPosts: number
  totalImpressions: number
}

interface RecentActivity {
  type: 'listing_prepared' | 'marketing_completed' | 'post_scheduled' | 'post_published'
  title: string
  subtitle: string
  timestamp: string
  href: string
  icon: 'listing' | 'marketing' | 'calendar' | 'analytics'
}

interface ProcessingItem {
  id: string
  title: string
  status: 'preparing' | 'processing'
}

interface SetupStatus {
  hasListings: boolean
  hasBrand: boolean
  hasSocials: boolean
  tier: string
}

interface DashboardHomeProps {
  metrics: MetricsData
  recentActivity: RecentActivity[]
  processingItems: ProcessingItem[]
  setupStatus?: SetupStatus
}

function MetricCard({ label, value, icon: Icon, href, color }: {
  label: string
  value: number | string
  icon: LucideIcon
  href: string
  color: string
}) {
  return (
    <Link href={href} className="group bg-white/5 rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
      </div>
      <p className="text-3xl font-bold mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-white/50">{label}</p>
    </Link>
  )
}

function QuickAction({ label, desc, icon: Icon, href, color }: {
  label: string
  desc: string
  icon: LucideIcon
  href: string
  color: string
}) {
  return (
    <Link href={href} className={`group flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 transition-all`}>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-white/40 truncate">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
    </Link>
  )
}

function ActivityIcon({ type }: { type: RecentActivity['icon'] }) {
  switch (type) {
    case 'listing':
      return <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-400" /></div>
    case 'marketing':
      return <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center"><Megaphone className="w-4 h-4 text-purple-400" /></div>
    case 'calendar':
      return <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-400" /></div>
    case 'analytics':
      return <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-amber-400" /></div>
    default:
      return <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Clock className="w-4 h-4 text-white/40" /></div>
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

export default function DashboardHome({ metrics, recentActivity, processingItems, setupStatus }: DashboardHomeProps) {
  return (
    <div className="min-h-screen bg-surface text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Processing Banner */}
        {processingItems.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {processingItems.length} listing{processingItems.length > 1 ? 's' : ''} currently processing
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  {processingItems.map(item => item.title || 'Untitled').join(', ')}
                </p>
              </div>
              <Link href="/dashboard/listings" className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                View &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-white/50 mt-1">Your property marketing overview</p>
        </div>

        {/* Getting Started Checklist */}
        {setupStatus && (
          <GettingStartedChecklist
            hasListings={setupStatus.hasListings}
            hasBrand={setupStatus.hasBrand}
            hasSocials={setupStatus.hasSocials}
            tier={setupStatus.tier}
          />
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Active Listings"
            value={metrics.activeListings}
            icon={Home}
            href="/dashboard/listings"
            color="bg-accent-gold"
          />
          <MetricCard
            label="Scheduled Posts"
            value={metrics.scheduledPosts}
            icon={Calendar}
            href="/dashboard/calendar"
            color="bg-blue-500"
          />
          <MetricCard
            label="Published Posts"
            value={metrics.publishedPosts}
            icon={CheckCircle}
            href="/dashboard/analytics"
            color="bg-emerald-500"
          />
          <MetricCard
            label="Total Impressions"
            value={metrics.totalImpressions}
            icon={Eye}
            href="/dashboard/analytics"
            color="bg-purple-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction
              label="New Listing"
              desc="Upload & enhance photos"
              icon={Plus}
              href="/listings/new"
              color="bg-accent-gold"
            />
            <QuickAction
              label="Create Post"
              desc="Social media content"
              icon={Sparkles}
              href="/dashboard/content-studio"
              color="bg-pink-500"
            />
            <QuickAction
              label="View Calendar"
              desc="Scheduled posts"
              icon={Calendar}
              href="/dashboard/calendar"
              color="bg-blue-500"
            />
            <QuickAction
              label="View Analytics"
              desc="Performance metrics"
              icon={BarChart3}
              href="/dashboard/analytics"
              color="bg-emerald-500"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Clock className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <h3 className="font-medium mb-2">No activity yet</h3>
              <p className="text-white/40 text-sm mb-4">Create a listing to get started</p>
              <Link href="/listings/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-gold text-black rounded-lg font-semibold text-sm">
                <Plus className="w-4 h-4" /> Create First Listing
              </Link>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5">
              {recentActivity.map((activity, i) => (
                <Link
                  key={i}
                  href={activity.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <ActivityIcon type={activity.icon} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-white/40 truncate">{activity.subtitle}</p>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0">{formatTimeAgo(activity.timestamp)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
