'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Plus, Home, ChevronDown, X, Check, Clock,
  User, Phone, Mail, MapPin, Star, TrendingUp, AlertCircle,
  CheckCircle2, XCircle, Loader2, MessageSquare, Building, Send
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Listing {
  id: string
  title: string
  address: string
  city: string
  state: string
  thumbnail: string | null
}

interface Showing {
  id: string
  listing_id: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  contact_type: string
  agent_name: string | null
  brokerage: string | null
  status: string
  outcome: string | null
  feedback: string | null
  interest_level: number | null
  source: string | null
  agent_notes: string | null
  listings: { address: string | null; city: string | null; state: string | null; title: string | null } | null
}

interface Stats {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  no_show: number
  interested: number
  offers: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-400 bg-blue-400/10', icon: Clock },
  completed: { label: 'Completed', color: 'text-green-400 bg-green-400/10', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10', icon: XCircle },
  no_show: { label: 'No Show', color: 'text-yellow-400 bg-yellow-400/10', icon: AlertCircle },
}

const OUTCOME_CONFIG: Record<string, { label: string; color: string }> = {
  very_interested: { label: 'Very Interested', color: 'text-green-400' },
  interested: { label: 'Interested', color: 'text-emerald-400' },
  unknown: { label: 'Unknown', color: 'text-white/40' },
  not_interested: { label: 'Not Interested', color: 'text-red-400' },
  offer_submitted: { label: 'Offer Submitted!', color: 'text-[#D4A017]' },
}

const SOURCES = ['mls', 'property_site', 'social_media', 'email', 'referral', 'open_house', 'direct', 'other']
const SOURCE_LABELS: Record<string, string> = {
  mls: 'MLS', property_site: 'Property Site', social_media: 'Social Media',
  email: 'Email', referral: 'Referral', open_house: 'Open House', direct: 'Direct', other: 'Other',
}

function fmt(dt: string) {
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ─── Schedule Form ────────────────────────────────────────────────────────────

interface ScheduleFormProps {
  listings: Listing[]
  onSaved: () => void
  onClose: () => void
}

function ScheduleForm({ listings, onSaved, onClose }: ScheduleFormProps) {
  const [listingId, setListingId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('30')
  const [location, setLocation] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactType, setContactType] = useState('buyer')
  const [agentName, setAgentName] = useState('')
  const [brokerage, setBrokerage] = useState('')
  const [source, setSource] = useState('')
  const [agentNotes, setAgentNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/showings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes: parseInt(duration),
          location: location || null,
          contactName,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          contactType,
          agentName: agentName || null,
          brokerage: brokerage || null,
          source: source || null,
          agentNotes: agentNotes || null,
        }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      onSaved()
      onClose()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/60"
  const labelCls = "text-xs text-white/50 uppercase tracking-wider block mb-1"

  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">Schedule Showing</h3>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      {/* Listing */}
      <div>
        <label className={labelCls}>Listing *</label>
        <select required value={listingId} onChange={e => setListingId(e.target.value)} className={inputCls}>
          <option value="">Select listing...</option>
          {listings.map(l => <option key={l.id} value={l.id}>{l.title || l.address}</option>)}
        </select>
      </div>

      {/* Date/time + duration */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Date & Time *</label>
          <input required type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Duration (min)</label>
          <select value={duration} onChange={e => setDuration(e.target.value)} className={inputCls}>
            {['15', '30', '45', '60', '90', '120'].map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="123 Main St or Virtual" className={inputCls} />
      </div>

      {/* Contact */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Contact Info</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Name *</label>
            <input required value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={contactType} onChange={e => setContactType(e.target.value)} className={inputCls}>
              <option value="buyer">Buyer</option>
              <option value="agent">Buyer&apos;s Agent</option>
              <option value="investor">Investor</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="jane@email.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="(512) 555-0100" className={inputCls} />
          </div>
          {contactType === 'agent' && <>
            <div>
              <label className={labelCls}>Agent Name</label>
              <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Bob Jones" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Brokerage</label>
              <input value={brokerage} onChange={e => setBrokerage(e.target.value)} placeholder="Keller Williams" className={inputCls} />
            </div>
          </>}
        </div>
      </div>

      {/* Attribution */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Lead Source</label>
          <select value={source} onChange={e => setSource(e.target.value)} className={inputCls}>
            <option value="">Unknown</option>
            {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={agentNotes} onChange={e => setAgentNotes(e.target.value)} rows={2} placeholder="Internal notes..." className={inputCls + ' resize-none'} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10">Cancel</button>
        <button type="submit" disabled={saving} className="flex-2 flex-1 py-2.5 bg-[#D4A017] text-black font-bold rounded-xl text-sm hover:bg-[#B8860B] disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Schedule Showing'}
        </button>
      </div>
    </form>
  )
}

// ─── Outcome Form ─────────────────────────────────────────────────────────────

interface OutcomeFormProps {
  showing: Showing
  onSaved: () => void
  onClose: () => void
}

function OutcomeForm({ showing, onSaved, onClose }: OutcomeFormProps) {
  const [status, setStatus] = useState(showing.status)
  const [outcome, setOutcome] = useState(showing.outcome ?? '')
  const [feedback, setFeedback] = useState(showing.feedback ?? '')
  const [interestLevel, setInterestLevel] = useState(showing.interest_level ?? 0)
  const [agentNotes, setAgentNotes] = useState(showing.agent_notes ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/showings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: showing.id,
          status,
          outcome: outcome || null,
          feedback: feedback || null,
          interestLevel: interestLevel || null,
          agentNotes: agentNotes || null,
        }),
        signal: AbortSignal.timeout(15000),
      })
      onSaved()
      onClose()
    } catch {
      // save failed
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4A017]/60"

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Update Showing</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Status</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(STATUS_CONFIG).map(([k, v]) => {
            const Icon = v.icon
            return (
              <button key={k} onClick={() => setStatus(k)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${status === k ? 'border-[#D4A017] bg-[#D4A017]/5' : 'border-white/10 hover:border-white/20'}`}>
                <Icon className="w-4 h-4" /> {v.label}
              </button>
            )
          })}
        </div>
      </div>

      {status === 'completed' && <>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Buyer Interest</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setInterestLevel(n)}
                className={`w-10 h-10 rounded-lg border transition-all ${n <= interestLevel ? 'border-[#D4A017] bg-[#D4A017]/20 text-[#D4A017]' : 'border-white/10 text-white/30'}`}>
                <Star className="w-4 h-4 mx-auto" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Outcome</label>
          <select value={outcome} onChange={e => setOutcome(e.target.value)} className={inputCls}>
            <option value="">Select...</option>
            {Object.entries(OUTCOME_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Buyer Feedback</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="What did they say?" className={inputCls + ' resize-none'} />
        </div>
      </>}

      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Agent Notes</label>
        <textarea value={agentNotes} onChange={e => setAgentNotes(e.target.value)} rows={2} placeholder="Internal notes..." className={inputCls + ' resize-none'} />
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[#D4A017] text-black font-bold rounded-xl text-sm hover:bg-[#B8860B] disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Showing Card ─────────────────────────────────────────────────────────────

function ShowingCard({ showing, onUpdate }: { showing: Showing; onUpdate: () => void }) {
  const [showOutcome, setShowOutcome] = useState(false)
  const statusCfg = STATUS_CONFIG[showing.status] ?? STATUS_CONFIG.scheduled
  const StatusIcon = statusCfg.icon
  const outcomeCfg = showing.outcome ? OUTCOME_CONFIG[showing.outcome] : null
  const listingLabel = showing.listings
    ? [showing.listings.address, showing.listings.city, showing.listings.state].filter(Boolean).join(', ') || showing.listings.title || 'Property'
    : 'Property'

  return (
    <div className="glass-luxury glossy-top rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3" /> {statusCfg.label}
            </span>
            {outcomeCfg && (
              <span className={`text-xs font-semibold ${outcomeCfg.color}`}>{outcomeCfg.label}</span>
            )}
          </div>
          <p className="font-semibold text-sm truncate">{listingLabel}</p>
          <p className="text-xs text-white/40 mt-0.5">{fmt(showing.scheduled_at)} · {showing.duration_minutes}min</p>
        </div>
        {showing.interest_level && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className={`w-3.5 h-3.5 ${n <= showing.interest_level! ? 'text-[#D4A017] fill-[#D4A017]' : 'text-white/10'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50 mb-3">
        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {showing.contact_name}</span>
        {showing.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {showing.contact_email}</span>}
        {showing.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {showing.contact_phone}</span>}
        {showing.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {showing.location}</span>}
        {showing.brokerage && <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {showing.brokerage}</span>}
        {showing.source && <span className="flex items-center gap-1">via {SOURCE_LABELS[showing.source] ?? showing.source}</span>}
      </div>

      {/* Feedback */}
      {showing.feedback && (
        <div className="bg-white/5 rounded-xl p-3 mb-3 text-xs text-white/60 flex gap-2">
          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white/30" />
          <span className="italic">&ldquo;{showing.feedback}&rdquo;</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShowOutcome(true)}
          className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors"
        >
          {showing.status === 'scheduled' ? 'Update / Mark Complete' : 'Edit Outcome'}
        </button>
        {showing.status === 'completed' && showing.contact_email && (
          <a
            href={`mailto:${showing.contact_email}?subject=Thanks for visiting — share your feedback&body=Hi ${encodeURIComponent(showing.contact_name)},%0A%0AThanks for the showing! We'd love your feedback:%0A%0A${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/feedback/showing/${showing.id}`)}%0A%0AThanks!`}
            title="Send feedback request email"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium hover:bg-[#D4A017]/10 hover:border-[#D4A017]/30 hover:text-[#D4A017] transition-colors"
          >
            <Send className="w-3 h-3" /> Feedback
          </a>
        )}
      </div>

      {showOutcome && (
        <div role="dialog" aria-modal="true" aria-label="Update Showing" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowOutcome(false)} />
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <OutcomeForm showing={showing} onSaved={onUpdate} onClose={() => setShowOutcome(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ShowingsDashboard() {
  const [showings, setShowings] = useState<Showing[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [listingFilter, setListingFilter] = useState<string>('all')
  const [showListingDropdown, setShowListingDropdown] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = listingFilter !== 'all' ? `/api/showings?listingId=${listingFilter}` : '/api/showings'
      const [showingsRes, listingsRes] = await Promise.all([
        fetch(url),
        (async () => {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return []
          const { data } = await supabase
            .from('listings')
            .select('id, title, address, city, state, photos!photos_listing_id_fkey(raw_url, processed_url)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          const result: Listing[] = []
          for (const l of data ?? []) {
            const photos = (l.photos ?? []) as Array<{ raw_url: string | null; processed_url: string | null }>
            let thumbnail: string | null = null
            const p = photos[0]
            if (p) {
              const path = p.processed_url || p.raw_url
              if (path?.startsWith('http')) thumbnail = path
            }
            result.push({ id: l.id, title: l.title || l.address || 'Untitled', address: l.address || '', city: l.city || '', state: l.state || '', thumbnail })
          }
          return result
        })(),
      ])
      const showingsData = await showingsRes.json() as { showings?: Showing[]; stats?: Stats }
      setShowings(showingsData.showings ?? [])
      setStats(showingsData.stats ?? null)
      setListings(listingsRes)
    } catch {
      // load failed
    } finally {
      setLoading(false)
    }
  }, [listingFilter])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? showings : showings.filter(s => s.status === filter)
  const upcoming = filtered.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date())
  const past = filtered.filter(s => s.status !== 'scheduled' || new Date(s.scheduled_at) < new Date())

  const selectedListing = listings.find(l => l.id === listingFilter)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-6 gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-[#D4A017]" />
        </div>
        <span className="font-bold">Showings</span>
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black font-bold rounded-xl text-sm hover:bg-[#B8860B] transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule Showing
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-white' },
              { label: 'Upcoming', value: stats.scheduled, color: 'text-blue-400' },
              { label: 'Interested', value: stats.interested, color: 'text-green-400' },
              { label: 'Offers', value: stats.offers, color: 'text-[#D4A017]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-luxury glossy-top rounded-2xl p-4">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-white/40 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Status filter */}
          <div className="flex gap-1 bg-[#111] rounded-xl p-1">
            {['all', 'scheduled', 'completed', 'cancelled', 'no_show'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'}`}
              >
                {f === 'all' ? 'All' : f === 'no_show' ? 'No Show' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Listing filter */}
          <div className="relative">
            <button
              onClick={() => setShowListingDropdown(d => !d)}
              className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-white/10 rounded-xl text-sm hover:border-white/20 transition-colors"
            >
              <Home className="w-4 h-4 text-white/40" />
              <span className="text-white/60">{listingFilter === 'all' ? 'All Listings' : (selectedListing?.title ?? 'Listing')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </button>
            {showListingDropdown && (
              <div className="absolute top-full mt-2 left-0 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-20 min-w-[220px] max-h-60 overflow-y-auto">
                <button onClick={() => { setListingFilter('all'); setShowListingDropdown(false) }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 text-white/60">All Listings</button>
                {listings.map(l => (
                  <button key={l.id} onClick={() => { setListingFilter(l.id); setShowListingDropdown(false) }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 ${listingFilter === l.id ? 'text-[#D4A017]' : 'text-white/60'}`}>
                    {l.title || l.address}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : showings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40">No showings yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-[#D4A017] text-black font-bold rounded-xl text-sm">Schedule First Showing</button>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Upcoming ({upcoming.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcoming.map(s => <ShowingCard key={s.id} showing={s} onUpdate={load} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-white/30" />
                  <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Past ({past.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {past.map(s => <ShowingCard key={s.id} showing={s} onUpdate={load} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule modal */}
      {showForm && (
        <div role="dialog" aria-modal="true" aria-label="Schedule Showing" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <ScheduleForm listings={listings} onSaved={load} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
