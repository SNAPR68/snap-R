'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image';
import {
  Users, Building, TrendingUp, Clock, Plus, Mail,
  UserPlus, ExternalLink, ChevronRight, X, Loader2,
  Check, AlertCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'

interface BrokerDashboardProps {
  team: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  } | null
  members: Array<{
    id: string
    user_id: string
    role: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    listing_count: number
  }>
  listings: Array<{
    id: string
    title: string | null
    address: string | null
    price: number | null
    preparation_status: string | null
    marketing_status: string | null
    user_id: string
    owner_name: string | null
    hero_photo_url: string | null
  }>
  stats: {
    totalAgents: number
    activeListings: number
    totalLeads: number
  }
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-[#D4A017]/20 text-[#D4A017]',
  admin: 'bg-blue-500/20 text-blue-400',
  editor: 'bg-green-500/20 text-green-400',
  viewer: 'bg-white/10 text-white/50',
}

const STATUS_PIE_COLORS: Record<string, string> = {
  prepared: '#10B981',
  completed: '#D4A017',
  processing: '#3B82F6',
  failed: '#EF4444',
  pending: '#6B7280',
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-white/30">Draft</span>
  const colors: Record<string, string> = {
    prepared: 'bg-green-500/20 text-green-400',
    completed: 'bg-[#D4A017]/20 text-[#D4A017]',
    processing: 'bg-blue-500/20 text-blue-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] ?? 'bg-white/10 text-white/40'}`}>
      {status}
    </span>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-white/50 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function BrokerDashboardClient({ team, members, listings, stats }: BrokerDashboardProps) {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team || !inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(false)
    try {
      const res = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setInviteError(data.error ?? 'Failed to send invite')
        return
      }
      setInviteSuccess(true)
      setInviteEmail('')
      setTimeout(() => { setShowInvite(false); setInviteSuccess(false) }, 2000)
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setInviting(false)
    }
  }

  // No team state
  if (!team) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
          <Building className="w-8 h-8 text-white/30" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Team Yet</h2>
        <p className="text-white/50 max-w-md mb-6">
          Create a team to manage your agents, track listings across your brokerage, and view aggregated analytics.
        </p>
        <Link
          href="/dashboard/team"
          className="px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />Create Team
        </Link>
      </div>
    )
  }

  const STAT_CARDS = [
    { label: 'Total Agents', value: stats.totalAgents, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Listings', value: stats.activeListings, icon: Building, color: 'text-[#D4A017]', bg: 'bg-[#D4A017]/10' },
    { label: 'Total Leads', value: stats.totalLeads, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg Response', value: '< 2h', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  // Chart data: listings per agent
  const agentBarData = members.map(m => ({
    name: (m.full_name ?? m.email ?? 'Unknown').split(' ')[0],
    Listings: m.listing_count,
  }))

  // Pie: listings by preparation status
  const statusCounts: Record<string, number> = {}
  for (const l of listings) {
    const s = l.preparation_status ?? 'pending'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  }
  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    rawName: name,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{team.name}</h1>
          <p className="text-white/50 text-sm">Broker team dashboard</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />Invite Agent
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      {(members.length > 0 || listings.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Listings per agent bar chart */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Listings per Agent</h3>
            {agentBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={agentBarData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Listings" radius={[4, 4, 0, 0]}>
                    {agentBarData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? '#D4A017' : '#B8860B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-white/20 text-sm">
                No agent data yet
              </div>
            )}
          </div>

          {/* Listing status pie chart */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Listings by Status</h3>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_PIE_COLORS[entry.rawName] ?? '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-white/50 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-white/20 text-sm">
                No listing data yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content: Agent Roster + Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Agent Roster — 3 cols */}
        <div className="lg:col-span-3 bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Agent Roster</h2>
            <span className="text-xs text-white/40">{members.length} members</span>
          </div>
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image src={m.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" width={400} height={300} unoptimized />
                  ) : (
                    <span className="text-sm font-bold text-white/60">
                      {(m.full_name ?? m.email ?? '?')[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.full_name ?? m.email ?? 'Unknown'}</p>
                  <p className="text-xs text-white/40 truncate">{m.email}</p>
                </div>
                {/* Role badge */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[m.role] ?? ROLE_COLORS.viewer}`}>
                  {m.role}
                </span>
                {/* Listing count */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-white">{m.listing_count}</p>
                  <p className="text-xs text-white/30">listings</p>
                </div>
                {/* Status dot */}
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" title="Active" />
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-center text-white/30 text-sm py-8">No team members yet. Invite your first agent above.</p>
            )}
          </div>
        </div>

        {/* Team Listings — 2 cols */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Team Listings</h2>
            <span className="text-xs text-white/40">{listings.length} total</span>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {listings.map(l => (
              <Link
                key={l.id}
                href={`/dashboard/studio/${l.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors group"
              >
                {/* Thumbnail placeholder */}
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Building className="w-5 h-5 text-white/20" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{l.address ?? l.title ?? 'Untitled'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {l.price && <span className="text-xs text-[#D4A017] font-bold">${l.price.toLocaleString()}</span>}
                    <span className="text-xs text-white/30">{l.owner_name ?? 'Unknown agent'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={l.preparation_status} />
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
              </Link>
            ))}
            {listings.length === 0 && (
              <p className="text-center text-white/30 text-sm py-8">No listings from team members yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Invite agent">
          <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#D4A017]/20 rounded-lg">
                  <Mail className="w-5 h-5 text-[#D4A017]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Invite Agent</h2>
                  <p className="text-white/50 text-sm">Send a team invite via email</p>
                </div>
              </div>
              <button onClick={() => { setShowInvite(false); setInviteError(null); setInviteSuccess(false) }} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Close">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="agent@brokerage.com"
                  required
                  aria-label="Invite email address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['admin', 'editor', 'viewer'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`py-2 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                        inviteRole === r
                          ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]'
                          : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {inviteError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{inviteError}</p>
                </div>
              )}
              {inviteSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-400">Invite sent successfully!</p>
                </div>
              )}

              <button
                type="submit"
                disabled={inviting || inviteSuccess}
                className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
