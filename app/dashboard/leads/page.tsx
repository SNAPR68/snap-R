'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Mail, Phone, MapPin, Calendar, Filter,
  ChevronDown, Download, ExternalLink, Instagram,
  Facebook, Linkedin, Globe, TrendingUp, Zap, CheckCircle,
  X, Loader2, MessageSquare, PhoneCall, Star, Clock,
  StickyNote, Send, ChevronUp
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface LeadListing {
  address: string | null
  city: string | null
  state: string | null
  title: string | null
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  status: string
  created_at: string
  updated_at: string
  listing_id: string | null
  listings: LeadListing | null
}

interface DripSequence {
  id: string
  name: string
  description: string | null
}

interface DripEnrollment {
  id: string
  status: string
  enrolled_at: string
  sequence_id: string
  lead_drip_sequences: { name: string } | null
  lead_drip_emails: Array<{
    id: string
    status: string
    scheduled_for: string
    sent_at: string | null
    subject: string
  }>
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'archived'

const STATUS_OPTIONS: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Leads' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'archived', label: 'Archived' },
]

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  qualified: 'bg-purple-500/20 text-purple-400',
  converted: 'bg-green-500/20 text-green-400',
  archived: 'bg-white/10 text-white/40',
}

const DRIP_STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400',
  completed: 'text-white/40',
  paused: 'text-yellow-400',
  unsubscribed: 'text-red-400',
}

function getPlatformIcon(source: string | null) {
  switch (source?.toLowerCase()) {
    case 'instagram': return <Instagram className="w-4 h-4 text-pink-400" />
    case 'facebook': return <Facebook className="w-4 h-4 text-blue-400" />
    case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-300" />
    case 'tiktok': return <Globe className="w-4 h-4 text-white/60" />
    default: return <Globe className="w-4 h-4 text-white/40" />
  }
}

// ============================================
// DRIP PANEL — shown inside expanded lead
// ============================================

function DripPanel({ lead }: { lead: Lead }) {
  const [sequences, setSequences] = useState<DripSequence[]>([])
  const [enrollments, setEnrollments] = useState<DripEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [unenrolling, setUnenrolling] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadDrip = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/drip?lead_id=${lead.id}`)
      if (!res.ok) return
      const data = await res.json()
      setSequences(data.sequences || [])
      setEnrollments(data.enrollments || [])
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [lead.id])

  useEffect(() => {
    loadDrip()
  }, [loadDrip])

  const enroll = async (sequenceId: string) => {
    setEnrolling(sequenceId)
    try {
      const res = await fetch('/api/leads/drip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, sequenceId }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to enroll')
        return
      }
      showToast(`Enrolled in "${data.sequenceName}" — ${data.emailsScheduled} emails scheduled`)
      await loadDrip()
    } catch {
      showToast('Failed to enroll')
    } finally {
      setEnrolling(null)
    }
  }

  const unenroll = async (enrollmentId: string) => {
    setUnenrolling(enrollmentId)
    try {
      const res = await fetch('/api/leads/drip', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId }),
      })
      if (!res.ok) {
        showToast('Failed to unenroll')
        return
      }
      showToast('Unsubscribed from sequence')
      await loadDrip()
    } catch {
      showToast('Failed to unenroll')
    } finally {
      setUnenrolling(null)
    }
  }

  const activeEnrollmentIds = new Set(
    enrollments.filter(e => e.status === 'active').map(e => e.sequence_id)
  )

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-white/40 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading sequences...
      </div>
    )
  }

  return (
    <div className="relative">
      {toast && (
        <div className="absolute -top-2 left-0 right-0 bg-[#D4A017] text-black text-xs font-medium px-3 py-2 rounded-lg z-10">
          {toast}
        </div>
      )}

      <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
        Follow-Up Sequences
      </h4>

      {/* Active enrollments */}
      {enrollments.length > 0 && (
        <div className="space-y-2 mb-4">
          {enrollments.map(enrollment => {
            const sentCount = enrollment.lead_drip_emails?.filter(e => e.status === 'sent').length ?? 0
            const totalCount = enrollment.lead_drip_emails?.length ?? 0
            const seqName = enrollment.lead_drip_sequences?.name ?? 'Sequence'

            return (
              <div key={enrollment.id} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle className={`w-4 h-4 shrink-0 ${DRIP_STATUS_COLORS[enrollment.status] || 'text-white/40'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{seqName}</p>
                    <p className="text-xs text-white/40">
                      {enrollment.status === 'active'
                        ? `${sentCount}/${totalCount} emails sent`
                        : enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                    </p>
                  </div>
                </div>
                {enrollment.status === 'active' && (
                  <button
                    onClick={() => unenroll(enrollment.id)}
                    disabled={unenrolling === enrollment.id}
                    className="ml-2 p-1 text-white/30 hover:text-red-400 transition-colors disabled:opacity-40"
                    title="Unsubscribe from sequence"
                  >
                    {unenrolling === enrollment.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <X className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Available sequences to enroll */}
      <div className="space-y-2">
        {sequences.map(seq => {
          const isEnrolled = activeEnrollmentIds.has(seq.id)
          return (
            <button
              key={seq.id}
              onClick={() => !isEnrolled && enroll(seq.id)}
              disabled={isEnrolled || enrolling === seq.id}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${
                isEnrolled
                  ? 'border-green-500/20 bg-green-500/5 cursor-default'
                  : 'border-[#D4A017]/20 bg-[#D4A017]/5 hover:bg-[#D4A017]/10'
              } disabled:opacity-60`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Zap className={`w-4 h-4 shrink-0 ${isEnrolled ? 'text-green-400' : 'text-[#D4A017]'}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isEnrolled ? 'text-green-400' : 'text-[#D4A017]'}`}>
                    {seq.name}
                  </p>
                  {seq.description && (
                    <p className="text-xs text-white/40 truncate">{seq.description}</p>
                  )}
                </div>
              </div>
              {enrolling === seq.id
                ? <Loader2 className="w-4 h-4 animate-spin text-[#D4A017] shrink-0" />
                : isEnrolled
                  ? <span className="text-xs text-green-400 shrink-0">Active</span>
                  : <span className="text-xs text-[#D4A017]/60 shrink-0">Start</span>
              }
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// ACTIVITY PANEL — timeline + notes + score
// ============================================

interface Activity {
  id: string
  activity_type: string
  body: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  note: StickyNote,
  call: PhoneCall,
  email: Mail,
  text: MessageSquare,
  showing: Calendar,
  status_change: ChevronUp,
  drip_email_sent: Send,
  property_site_viewed: Globe,
  form_submitted: CheckCircle,
  auto: Clock,
}

const ACTIVITY_COLORS: Record<string, string> = {
  note: 'text-yellow-400',
  call: 'text-green-400',
  email: 'text-blue-400',
  text: 'text-purple-400',
  showing: 'text-orange-400',
  status_change: 'text-[#D4A017]',
  drip_email_sent: 'text-cyan-400',
  property_site_viewed: 'text-pink-400',
  form_submitted: 'text-emerald-400',
  auto: 'text-white/40',
}

function ScoreDots({ score }: { score: number }) {
  const filled = Math.round(score / 20) // 0–5 dots
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= filled ? 'text-[#D4A017] fill-[#D4A017]' : 'text-white/20'}`}
        />
      ))}
      <span className="text-xs text-white/40 ml-1">{score}/100</span>
    </div>
  )
}

function ActivityPanel({ lead }: { lead: Lead }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [notes, setNotes] = useState('')
  const [newNote, setNewNote] = useState('')
  const [logType, setLogType] = useState<'note' | 'call' | 'email' | 'text'>('note')
  const [saving, setSaving] = useState(false)
  const [editingScore, setEditingScore] = useState(false)
  const [tempScore, setTempScore] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/activity?leadId=${lead.id}`)
      if (!res.ok) return
      const data = await res.json() as { activities: Activity[]; lead: { score: number; notes: string | null } }
      setActivities(data.activities || [])
      setScore(data.lead.score ?? 0)
      setNotes(data.lead.notes ?? '')
      setTempScore(data.lead.score ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [lead.id])

  useEffect(() => { load() }, [load])

  const logActivity = async () => {
    if (!newNote.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/leads/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, activityType: logType, body: newNote.trim() }),
      })
      if (!res.ok) return
      setNewNote('')
      await load()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const saveScore = async () => {
    try {
      await fetch('/api/leads/activity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, score: tempScore }),
      })
      setScore(tempScore)
      setEditingScore(false)
    } catch {
      // silent
    }
  }

  const saveNotes = async () => {
    try {
      await fetch('/api/leads/activity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, notes }),
      })
    } catch {
      // silent
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Score + Private Notes */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Lead Score</span>
            <button
              onClick={() => editingScore ? saveScore() : setEditingScore(true)}
              className="text-xs text-[#D4A017] hover:underline"
            >
              {editingScore ? 'Save' : 'Edit'}
            </button>
          </div>
          {editingScore ? (
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={100} step={5}
                value={tempScore}
                onChange={e => setTempScore(Number(e.target.value))}
                aria-label="Lead score"
                className="flex-1 accent-[#D4A017]"
              />
              <span className="text-sm font-bold w-8 text-right">{tempScore}</span>
            </div>
          ) : (
            <ScoreDots score={score} />
          )}
        </div>

        <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
          <span className="text-xs text-white/50 uppercase tracking-wider">Private Notes</span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={2}
            placeholder="Internal notes..."
            aria-label="Private notes"
            className="w-full mt-1 bg-transparent text-sm text-white/70 placeholder-white/20 resize-none focus:outline-none"
          />
        </div>
      </div>

      {/* Log activity */}
      <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
        <span className="text-xs text-white/50 uppercase tracking-wider block mb-2">Log Activity</span>
        <div className="flex gap-2 mb-2">
          {(['note', 'call', 'email', 'text'] as const).map(t => (
            <button
              key={t}
              onClick={() => setLogType(t)}
              className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-all ${logType === t ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30' : 'bg-white/5 text-white/40 hover:text-white/60'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') logActivity() }}
            placeholder={`Log a ${logType}...`}
            aria-label={`Log ${logType}`}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/40"
          />
          <button
            onClick={logActivity}
            disabled={!newNote.trim() || saving}
            className="px-3 py-1.5 bg-[#D4A017] text-black rounded-lg text-xs font-bold disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <span className="text-xs text-white/50 uppercase tracking-wider">Activity Timeline</span>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-white/30" /></div>
        ) : activities.length === 0 ? (
          <p className="text-xs text-white/30 py-3">No activity yet</p>
        ) : (
          <div className="mt-2 space-y-2">
            {activities.map(a => {
              const Icon = ACTIVITY_ICONS[a.activity_type] ?? Clock
              const color = ACTIVITY_COLORS[a.activity_type] ?? 'text-white/40'
              return (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70">{a.body ?? a.activity_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [newToday, setNewToday] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '100')

      const response = await fetch(`/api/leads?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch leads')

      const data = await response.json()
      setLeads(data.leads || [])
      setTotal(data.total || 0)
      setNewToday(data.newToday || 0)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Leads] Fetch error:', msg)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingStatus(leadId)
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      })
      if (!response.ok) throw new Error('Failed to update')

      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Leads] Update error:', msg)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Property', 'Source', 'Campaign', 'Status', 'Date', 'Message']
    const rows = leads.map(lead => [
      lead.name,
      lead.email,
      lead.phone || '',
      lead.listings?.address || '',
      lead.utm_source || 'Direct',
      lead.utm_campaign || '',
      lead.status,
      new Date(lead.created_at).toLocaleDateString(),
      (lead.message || '').replace(/"/g, '""'),
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapr-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const platformCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const source = lead.utm_source || 'direct'
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffHours < 48) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Property Leads</h1>
          <p className="text-white/50 text-sm mt-1">
            Leads captured from your property sites
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={leads.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#D4A017]/10">
              <Users className="w-5 h-5 text-[#D4A017]" />
            </div>
          </div>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-white/40 text-sm">Total Leads</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{newToday}</p>
          <p className="text-white/40 text-sm">New Today</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Instagram className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{platformCounts['instagram'] || 0}</p>
          <p className="text-white/40 text-sm">From Instagram</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-400/10">
              <Facebook className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{platformCounts['facebook'] || 0}</p>
          <p className="text-white/40 text-sm">From Facebook</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-white/40 shrink-0" />
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              statusFilter === opt.value
                ? 'bg-[#D4A017] text-black font-medium'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 bg-[#1A1A1A] rounded-xl border border-white/5">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No leads yet</h3>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Leads will appear here when visitors submit their info on your property sites.
            Make sure your property sites are gated (Pro or Agency plan).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div
              key={lead.id}
              className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden"
            >
              {/* Lead Row */}
              <button
                onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#D4A017]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#D4A017] font-semibold text-sm">
                    {lead.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name + Email */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lead.name}</p>
                  <p className="text-white/40 text-sm truncate">{lead.email}</p>
                </div>

                {/* Property */}
                <div className="hidden md:flex items-center gap-1.5 text-white/50 text-sm max-w-[200px]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {lead.listings?.address || lead.listings?.title || 'Unknown'}
                  </span>
                </div>

                {/* Source */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {getPlatformIcon(lead.utm_source)}
                  <span className="text-white/40 text-xs capitalize">
                    {lead.utm_source || 'Direct'}
                  </span>
                </div>

                {/* Status Badge */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </span>

                {/* Date */}
                <span className="text-white/30 text-xs whitespace-nowrap hidden lg:block">
                  {formatDate(lead.created_at)}
                </span>

                <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${
                  expandedLead === lead.id ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Expanded Details */}
              {expandedLead === lead.id && (
                <div className="px-4 pb-4 pt-0 border-t border-white/5">
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {/* Contact Info */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">Contact</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-white/40" />
                        <a href={`mailto:${lead.email}`} className="text-[#D4A017] hover:underline">{lead.email}</a>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-white/40" />
                          <a href={`tel:${lead.phone}`} className="text-[#D4A017] hover:underline">{lead.phone}</a>
                        </div>
                      )}
                      {lead.listings?.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-white/40" />
                          <span className="text-white/70">
                            {[lead.listings.address, lead.listings.city, lead.listings.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-white/40" />
                        <span className="text-white/70">
                          {new Date(lead.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: 'numeric', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Attribution + Status */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">Attribution</h4>
                      {lead.utm_source && (
                        <div className="flex items-center gap-2 text-sm">
                          {getPlatformIcon(lead.utm_source)}
                          <span className="text-white/70">
                            {lead.utm_source.charAt(0).toUpperCase() + lead.utm_source.slice(1)}
                            {lead.utm_campaign ? ` / ${lead.utm_campaign.replace(/_/g, ' ')}` : ''}
                          </span>
                        </div>
                      )}
                      {!lead.utm_source && (
                        <p className="text-white/40 text-sm">Direct visit (no UTM tracking)</p>
                      )}

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {(['new', 'contacted', 'qualified', 'converted', 'archived'] as LeadStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => updateLeadStatus(lead.id, s)}
                              disabled={lead.status === s || updatingStatus === lead.id}
                              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                                lead.status === s
                                  ? STATUS_COLORS[s] + ' font-medium'
                                  : 'bg-white/5 text-white/40 hover:bg-white/10'
                              } disabled:cursor-not-allowed`}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {lead.message && (
                    <div className="mt-4 p-4 bg-white/[0.03] rounded-lg border border-white/5">
                      <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">Message</h4>
                      <p className="text-white/70 text-sm whitespace-pre-wrap">{lead.message}</p>
                    </div>
                  )}

                  {/* Drip Sequences */}
                  <div className="mt-4 p-4 bg-white/[0.02] rounded-lg border border-white/5">
                    <DripPanel lead={lead} />
                  </div>

                  {/* Activity Timeline + Score + Notes */}
                  <div className="mt-4 p-4 bg-white/[0.02] rounded-lg border border-white/5">
                    <ActivityPanel lead={lead} />
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Mail className="w-4 h-4" />
                      Email Lead
                    </a>
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    )}
                    {lead.listing_id && (
                      <a
                        href={`/dashboard/studio?id=${lead.listing_id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Listing
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
