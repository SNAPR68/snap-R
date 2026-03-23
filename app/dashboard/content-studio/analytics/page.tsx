'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Heart, MessageCircle, Share2, Eye, Users, TrendingUp,
  Instagram, Facebook, Linkedin, Video, BarChart3,
  Download, ChevronRight, DollarSign, Target, Zap,
  ArrowUpRight, Loader2, UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts'

// ============================================
// TYPES
// ============================================

interface DailyEngagement {
  date: string
  likes: number
  comments: number
  shares: number
  impressions: number
  reach: number
  posts: number
}

interface PlatformBreakdown {
  platform: string
  posts: number
  likes: number
  comments: number
  shares: number
  impressions: number
  reach: number
  engagementRate: number
}

interface LeadSummary {
  total: number
  bySource: Record<string, number>
  byCampaign: Record<string, number>
  byStatus: Record<string, number>
  conversionRate: number
}

interface CostSummary {
  totalCents: number
  listingsMarketed: number
  avgCostPerListing: number
  costPerLead: number
  costPerEngagement: number
}

interface TopPost {
  id: string
  platform: string
  caption: string
  published_at: string
  likes: number
  comments: number
  shares: number
  impressions: number
  engagement: number
}

interface ROIData {
  totals: {
    posts: number
    likes: number
    comments: number
    shares: number
    impressions: number
    reach: number
    engagement: number
    avgEngagementRate: number
  }
  dailyEngagement: DailyEngagement[]
  platformBreakdown: PlatformBreakdown[]
  leadSummary: LeadSummary
  costSummary: CostSummary
  topPosts: TopPost[]
  dateRange: { from: string; to: string }
}

type DateRange = '7d' | '30d' | '90d' | 'all'

// ============================================
// CONSTANTS
// ============================================

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: Video,
}

const PLATFORM_COLORS_GRADIENT: Record<string, string> = {
  instagram: 'from-purple-500 to-pink-500',
  facebook: 'from-blue-600 to-blue-400',
  linkedin: 'from-blue-700 to-blue-500',
  tiktok: 'from-gray-700 to-gray-500',
}

const PIE_COLORS = ['#E1306C', '#1877F2', '#0A66C2', '#69C9D0', '#D4AF37', '#10B981']

// ============================================
// HELPERS
// ============================================

function getDateParams(range: DateRange): { from?: string } {
  if (range === 'all') return {}
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return { from: d.toISOString() }
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ============================================
// CUSTOM TOOLTIP
// ============================================

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{formatNumber(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

// ============================================
// STAT CARD
// ============================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subValue?: string
  color: string
}) {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-white/40 mt-0.5">{label}</div>
      {subValue && <div className="text-xs text-white/30 mt-1">{subValue}</div>}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

interface ListingStat {
  id: string
  title: string
  address: string
  city: string
  state: string
  price: number | null
  preparation_status: string
  posts: number
  likes: number
  comments: number
  shares: number
  impressions: number
  reach: number
  engagement: number
  engagementRate: number
  leads: number
  qualifiedLeads: number
  costCents: number
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<ROIData | null>(null)
  const [listingStats, setListingStats] = useState<ListingStat[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'platforms' | 'leads' | 'roi' | 'listings'>('overview')
  // ROI Calculator state
  const [roiCommission, setRoiCommission] = useState(3)
  const [roiSalePrice, setRoiSalePrice] = useState(500000)

  const fetchROI = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const { from } = getDateParams(dateRange)
      if (from) params.set('from', from)
      const qs = params.toString()
      const [roiRes, listingsRes] = await Promise.all([
        fetch(`/api/analytics/roi${qs ? `?${qs}` : ''}`, { signal: AbortSignal.timeout(15000) }),
        fetch(`/api/analytics/listings${qs ? `?${qs}` : ''}`, { signal: AbortSignal.timeout(15000) }),
      ])
      if (!roiRes.ok) throw new Error('Failed to fetch')
      const json = await roiRes.json()
      setData(json)
      if (listingsRes.ok) {
        const lj = await listingsRes.json()
        setListingStats(lj.listings || [])
      }
    } catch {
      console.error('[Analytics] Failed to load ROI data')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { fetchROI() }, [fetchROI])

  // CSV export of engagement data
  const exportCSV = () => {
    if (!data?.dailyEngagement.length) return
    const headers = ['Date', 'Posts', 'Likes', 'Comments', 'Shares', 'Impressions', 'Reach']
    const rows = data.dailyEngagement.map(d => [
      d.date, d.posts, d.likes, d.comments, d.shares, d.impressions, d.reach,
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

  // Prepare chart data
  const chartData = data?.dailyEngagement.map(d => ({
    ...d,
    name: formatDateShort(d.date),
  })) || []

  // Platform pie data for leads
  const leadSourceData = data ? Object.entries(data.leadSummary.bySource).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  })) : []

  // Platform bar data
  const platformBarData = data?.platformBreakdown.map(p => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    Likes: p.likes,
    Comments: p.comments,
    Shares: p.shares,
    platform: p.platform,
  })) || []

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <Link href="/dashboard/content-studio" className="text-white/40 hover:text-white transition-colors">Content Studio</Link>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="text-white font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" />Analytics & ROI
            </span>
          </nav>

          <div className="flex items-center gap-3">
            {/* Date range pills */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as DateRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    dateRange === range
                      ? 'bg-[#D4AF37] text-black shadow-sm'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range}
                </button>
              ))}
            </div>

            {/* Export */}
            <button
              onClick={exportCSV}
              disabled={!data?.dailyEngagement.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-px">
          {([
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'platforms', label: 'Platforms', icon: TrendingUp },
            { id: 'leads', label: 'Leads', icon: UserPlus },
            { id: 'roi', label: 'ROI', icon: DollarSign },
            { id: 'listings', label: 'Listings', icon: Target },
          ] as const).map(tab => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#D4AF37] text-[#D4AF37] bg-white/[0.03]'
                    : 'border-transparent text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : !data ? (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">Failed to load analytics</p>
            <button onClick={fetchROI} className="mt-4 px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-medium hover:bg-[#B8960C]">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  <StatCard icon={TrendingUp} label="Posts" value={formatNumber(data.totals.posts)} color="from-[#D4AF37] to-[#B8960C]" />
                  <StatCard icon={Heart} label="Likes" value={formatNumber(data.totals.likes)} color="from-red-500 to-pink-500" />
                  <StatCard icon={MessageCircle} label="Comments" value={formatNumber(data.totals.comments)} color="from-blue-500 to-cyan-500" />
                  <StatCard icon={Share2} label="Shares" value={formatNumber(data.totals.shares)} color="from-green-500 to-emerald-500" />
                  <StatCard icon={Eye} label="Impressions" value={formatNumber(data.totals.impressions)} color="from-purple-500 to-violet-500" />
                  <StatCard icon={Users} label="Reach" value={formatNumber(data.totals.reach)} color="from-orange-500 to-amber-500" />
                  <StatCard icon={Zap} label="Engagement" value={formatNumber(data.totals.engagement)} color="from-yellow-500 to-orange-500" />
                  <StatCard
                    icon={Target}
                    label="Eng. Rate"
                    value={`${data.totals.avgEngagementRate}%`}
                    color="from-teal-500 to-cyan-500"
                  />
                </div>

                {/* Engagement Trend Chart */}
                <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                  <h3 className="text-sm font-semibold text-white/70 mb-4">Engagement Trend</h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={45}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: 10 }}
                          iconType="circle"
                          iconSize={8}
                          formatter={(value: string) => <span className="text-xs text-white/50 ml-1">{value}</span>}
                        />
                        <Area type="monotone" dataKey="likes" name="Likes" stroke="#EF4444" fillOpacity={1} fill="url(#colorLikes)" strokeWidth={2} />
                        <Area type="monotone" dataKey="comments" name="Comments" stroke="#3B82F6" fillOpacity={1} fill="url(#colorComments)" strokeWidth={2} />
                        <Area type="monotone" dataKey="shares" name="Shares" stroke="#10B981" fillOpacity={1} fill="url(#colorShares)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-white/30">
                      No engagement data for this period
                    </div>
                  )}
                </div>

                {/* Top Performing Posts */}
                {data.topPosts.length > 0 && (
                  <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4">Top Performing Posts</h3>
                    <div className="space-y-3">
                      {data.topPosts.map((post, i) => {
                        const Icon = PLATFORM_ICONS[post.platform] || TrendingUp
                        return (
                          <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <span className="text-lg font-bold text-white/20 w-6 text-center">{i + 1}</span>
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${PLATFORM_COLORS_GRADIENT[post.platform] || 'from-gray-600 to-gray-500'} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/80 truncate">{post.caption?.slice(0, 80) || 'No caption'}</p>
                              <p className="text-xs text-white/30">{formatDateShort(post.published_at)}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs shrink-0">
                              <div className="text-center">
                                <div className="font-semibold text-red-400">{formatNumber(post.likes)}</div>
                                <div className="text-white/30">Likes</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-blue-400">{formatNumber(post.comments)}</div>
                                <div className="text-white/30">Comments</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-green-400">{formatNumber(post.shares)}</div>
                                <div className="text-white/30">Shares</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-[#D4AF37]">{formatNumber(post.engagement)}</div>
                                <div className="text-white/30">Total</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════ PLATFORMS TAB ══════════════════ */}
            {activeTab === 'platforms' && (
              <div className="space-y-6">
                {/* Platform engagement bar chart */}
                <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                  <h3 className="text-sm font-semibold text-white/70 mb-4">Engagement by Platform</h3>
                  {platformBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={platformBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                        />
                        <YAxis
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={45}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value: string) => <span className="text-xs text-white/50 ml-1">{value}</span>}
                        />
                        <Bar dataKey="Likes" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Comments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Shares" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-white/30">
                      No platform data yet
                    </div>
                  )}
                </div>

                {/* Platform cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {data.platformBreakdown.map(p => {
                    const Icon = PLATFORM_ICONS[p.platform] || TrendingUp
                    const totalEng = p.likes + p.comments + p.shares
                    return (
                      <div key={p.platform} className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${PLATFORM_COLORS_GRADIENT[p.platform] || 'from-gray-600 to-gray-500'} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold capitalize">{p.platform}</h4>
                            <p className="text-xs text-white/40">{p.posts} post{p.posts !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="text-lg font-bold text-[#D4AF37]">{p.engagementRate}%</div>
                            <div className="text-xs text-white/40">Eng. Rate</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2 text-center">
                          <div>
                            <div className="text-sm font-semibold text-red-400">{formatNumber(p.likes)}</div>
                            <div className="text-[10px] text-white/30">Likes</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-blue-400">{formatNumber(p.comments)}</div>
                            <div className="text-[10px] text-white/30">Comments</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-green-400">{formatNumber(p.shares)}</div>
                            <div className="text-[10px] text-white/30">Shares</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-purple-400">{formatNumber(p.impressions)}</div>
                            <div className="text-[10px] text-white/30">Impressions</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-orange-400">{formatNumber(p.reach)}</div>
                            <div className="text-[10px] text-white/30">Reach</div>
                          </div>
                        </div>

                        {/* Mini engagement bar */}
                        <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden flex">
                          {totalEng > 0 && (
                            <>
                              <div className="bg-red-500 h-full" style={{ width: `${(p.likes / totalEng) * 100}%` }} />
                              <div className="bg-blue-500 h-full" style={{ width: `${(p.comments / totalEng) * 100}%` }} />
                              <div className="bg-green-500 h-full" style={{ width: `${(p.shares / totalEng) * 100}%` }} />
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {data.platformBreakdown.length === 0 && (
                    <div className="md:col-span-2 text-center py-16 bg-[#1A1A1A] rounded-xl border border-white/5">
                      <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-3" />
                      <p className="text-white/40">No platform data yet</p>
                      <p className="text-white/20 text-sm mt-1">Publish posts to see platform analytics</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════ LEADS TAB ══════════════════ */}
            {activeTab === 'leads' && (
              <div className="space-y-6">
                {/* Lead KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    icon={UserPlus}
                    label="Total Leads"
                    value={formatNumber(data.leadSummary.total)}
                    color="from-[#D4AF37] to-[#B8960C]"
                  />
                  <StatCard
                    icon={Target}
                    label="Conversion Rate"
                    value={`${data.leadSummary.conversionRate}%`}
                    subValue={`${data.leadSummary.byStatus['converted'] || 0} converted`}
                    color="from-green-500 to-emerald-500"
                  />
                  <StatCard
                    icon={DollarSign}
                    label="Cost per Lead"
                    value={data.leadSummary.total > 0 ? formatCurrency(data.costSummary.costPerLead) : '$0.00'}
                    color="from-blue-500 to-indigo-500"
                  />
                  <StatCard
                    icon={Zap}
                    label="Qualified"
                    value={formatNumber(data.leadSummary.byStatus['qualified'] || 0)}
                    subValue={`${data.leadSummary.byStatus['contacted'] || 0} contacted`}
                    color="from-purple-500 to-violet-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Lead sources pie chart */}
                  <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4">Leads by Source</h3>
                    {leadSourceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={leadSourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''} (${value ?? 0})`}
                            labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                          >
                            {leadSourceData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1A1A1A',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-white/30">
                        No lead data yet
                      </div>
                    )}
                  </div>

                  {/* Lead status breakdown */}
                  <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4">Lead Funnel</h3>
                    <div className="space-y-3">
                      {[
                        { status: 'new', label: 'New', color: 'bg-blue-500' },
                        { status: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
                        { status: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
                        { status: 'converted', label: 'Converted', color: 'bg-green-500' },
                        { status: 'archived', label: 'Archived', color: 'bg-gray-500' },
                      ].map(s => {
                        const count = data.leadSummary.byStatus[s.status] || 0
                        const pct = data.leadSummary.total > 0
                          ? Math.round((count / data.leadSummary.total) * 100)
                          : 0
                        return (
                          <div key={s.status}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-white/60">{s.label}</span>
                              <span className="text-sm font-medium">{count} <span className="text-white/30">({pct}%)</span></span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Campaign breakdown */}
                    {Object.keys(data.leadSummary.byCampaign).length > 0 && (
                      <div className="mt-6 pt-4 border-t border-white/5">
                        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">By Campaign</h4>
                        <div className="space-y-2">
                          {Object.entries(data.leadSummary.byCampaign)
                            .sort(([, a], [, b]) => b - a)
                            .map(([campaign, count]) => (
                              <div key={campaign} className="flex items-center justify-between text-sm">
                                <span className="text-white/50 capitalize">{campaign.replace(/_/g, ' ')}</span>
                                <span className="font-medium text-[#D4AF37]">{count}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick link to leads dashboard */}
                <Link
                  href="/dashboard/leads"
                  className="flex items-center justify-center gap-2 p-4 bg-[#1A1A1A] rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition-colors group"
                >
                  <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/60 group-hover:text-white">View full leads dashboard</span>
                  <ArrowUpRight className="w-3 h-3 text-white/30 group-hover:text-[#D4AF37]" />
                </Link>
              </div>
            )}

            {/* ══════════════════ ROI TAB ══════════════════ */}
            {activeTab === 'roi' && (
              <div className="space-y-6">
                {/* ROI KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <StatCard
                    icon={DollarSign}
                    label="Total AI Spend"
                    value={formatCurrency(data.costSummary.totalCents)}
                    color="from-[#D4AF37] to-[#B8960C]"
                  />
                  <StatCard
                    icon={BarChart3}
                    label="Listings Marketed"
                    value={formatNumber(data.costSummary.listingsMarketed)}
                    color="from-blue-500 to-indigo-500"
                  />
                  <StatCard
                    icon={Target}
                    label="Cost per Listing"
                    value={formatCurrency(data.costSummary.avgCostPerListing)}
                    color="from-purple-500 to-violet-500"
                  />
                  <StatCard
                    icon={UserPlus}
                    label="Cost per Lead"
                    value={data.leadSummary.total > 0 ? formatCurrency(data.costSummary.costPerLead) : 'N/A'}
                    subValue={`${data.leadSummary.total} leads`}
                    color="from-green-500 to-emerald-500"
                  />
                  <StatCard
                    icon={Zap}
                    label="Cost per Eng."
                    value={data.totals.engagement > 0 ? formatCurrency(data.costSummary.costPerEngagement) : 'N/A'}
                    subValue={`${formatNumber(data.totals.engagement)} engagements`}
                    color="from-orange-500 to-amber-500"
                  />
                </div>

                {/* ROI Insights */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Impressions trend */}
                  <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4">Impressions & Reach Trend</h3>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                            tickLine={false}
                            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={45}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value: string) => <span className="text-xs text-white/50 ml-1">{value}</span>}
                          />
                          <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorImpressions)" strokeWidth={2} />
                          <Area type="monotone" dataKey="reach" name="Reach" stroke="#F59E0B" fillOpacity={1} fill="url(#colorReach)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-white/30">
                        No data for this period
                      </div>
                    )}
                  </div>

                  {/* ROI Summary */}
                  <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-semibold text-white/70 mb-4">ROI Summary</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                          <span className="text-sm font-medium">Marketing Investment</span>
                        </div>
                        <div className="text-3xl font-bold text-[#D4AF37]">
                          {formatCurrency(data.costSummary.totalCents)}
                        </div>
                        <p className="text-xs text-white/30 mt-1">
                          AI costs across {data.costSummary.listingsMarketed} listing{data.costSummary.listingsMarketed !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                          <div className="text-xl font-bold text-green-400 flex items-center justify-center gap-1">
                            {formatNumber(data.totals.engagement)}
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                          <div className="text-xs text-white/40 mt-1">Total Engagements</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                          <div className="text-xl font-bold text-blue-400 flex items-center justify-center gap-1">
                            {formatNumber(data.leadSummary.total)}
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div className="text-xs text-white/40 mt-1">Leads Generated</div>
                        </div>
                      </div>

                      {data.costSummary.totalCents > 0 && data.totals.engagement > 0 && (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <ArrowUpRight className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium text-green-400">Efficiency</span>
                          </div>
                          <p className="text-xs text-white/50">
                            Every $1 spent generated {Math.round(data.totals.engagement / (data.costSummary.totalCents / 100))} engagements
                            {data.leadSummary.total > 0 && ` and ${(data.leadSummary.total / (data.costSummary.totalCents / 100)).toFixed(1)} leads`}
                          </p>
                        </div>
                      )}

                      {data.costSummary.totalCents === 0 && (
                        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                          <p className="text-sm text-white/40">No marketing spend recorded yet</p>
                          <p className="text-xs text-white/20 mt-1">Costs are tracked automatically when the AI marketing pipeline runs</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════ LISTINGS TAB ══════════════════ */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                {/* ROI Calculator */}
                <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
                  <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                    ROI Calculator
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Expected Sale Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                        <input
                          type="number"
                          value={roiSalePrice}
                          onChange={e => setRoiSalePrice(Number(e.target.value))}
                          min={50000}
                          step={10000}
                          aria-label="Expected sale price"
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Your Commission (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={roiCommission}
                          onChange={e => setRoiCommission(Number(e.target.value))}
                          min={0.5}
                          max={10}
                          step={0.25}
                          aria-label="Commission percentage"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">%</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#B8960C]/10 border border-[#D4AF37]/20 rounded-lg p-3 flex flex-col justify-center">
                      {(() => {
                        const commission = (roiSalePrice * roiCommission) / 100
                        const spend = data?.costSummary.totalCents ? data.costSummary.totalCents / 100 : 0
                        const roi = spend > 0 ? ((commission - spend) / spend) * 100 : null
                        return (
                          <>
                            <div className="text-xs text-white/40 mb-1">Estimated Return</div>
                            <div className="text-2xl font-bold text-[#D4AF37]">
                              ${commission.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </div>
                            {roi !== null && (
                              <div className="text-xs text-green-400 mt-1">
                                {roi >= 0 ? '+' : ''}{roi.toFixed(0)}% ROI vs AI spend
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* Per-Listing Comparison Table */}
                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/70">Per-Listing Performance</h3>
                    <span className="text-xs text-white/30">{listingStats.length} listings</span>
                  </div>
                  {listingStats.length === 0 ? (
                    <div className="py-12 text-center text-white/30 text-sm">
                      No listing data available for this period
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Listing</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-white/40">Posts</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-white/40">Engagement</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-white/40">Impressions</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-white/40">Leads</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-white/40">Qualified</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-white/40">AI Spend</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-white/40">Eng. Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listingStats.map((ls, i) => (
                            <tr key={ls.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                              <td className="px-5 py-3">
                                <div className="font-medium text-white truncate max-w-[200px]">{ls.title || ls.address}</div>
                                <div className="text-xs text-white/30 truncate">{ls.city}{ls.city && ls.state ? ', ' : ''}{ls.state}</div>
                              </td>
                              <td className="px-3 py-3 text-right text-white/70">{ls.posts}</td>
                              <td className="px-3 py-3 text-right">
                                <span className="text-white/70">{formatNumber(ls.engagement)}</span>
                              </td>
                              <td className="px-3 py-3 text-right text-white/70">{formatNumber(ls.impressions)}</td>
                              <td className="px-3 py-3 text-right text-white/70">{ls.leads}</td>
                              <td className="px-3 py-3 text-right">
                                {ls.qualifiedLeads > 0
                                  ? <span className="text-green-400 font-medium">{ls.qualifiedLeads}</span>
                                  : <span className="text-white/30">—</span>
                                }
                              </td>
                              <td className="px-3 py-3 text-right text-[#D4AF37]">{ls.costCents > 0 ? formatCurrency(ls.costCents) : '—'}</td>
                              <td className="px-3 py-3 text-right">
                                {ls.engagementRate > 0
                                  ? <span className={`font-medium ${ls.engagementRate >= 3 ? 'text-green-400' : ls.engagementRate >= 1 ? 'text-yellow-400' : 'text-white/50'}`}>
                                      {ls.engagementRate.toFixed(1)}%
                                    </span>
                                  : <span className="text-white/30">—</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════ EMPTY STATE ══════════════════ */}
            {data.totals.posts === 0 && data.leadSummary.total === 0 && (
              <div className="mt-8 text-center py-16 bg-[#1A1A1A] rounded-xl border border-white/5">
                <BarChart3 className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No analytics data yet</h3>
                <p className="text-white/40 text-sm max-w-md mx-auto mb-6">
                  Your analytics will populate as you publish posts and receive leads through your property sites.
                </p>
                <Link href="/dashboard/content-studio/create-all">
                  <button className="px-6 py-2.5 bg-[#D4AF37] text-black rounded-lg text-sm font-semibold hover:bg-[#B8960C] transition-colors">
                    Create Your First Post
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
