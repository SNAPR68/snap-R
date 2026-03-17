'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, DoorOpen, Users, Star, Calendar, Copy, Check,
  ChevronDown, ChevronUp, X, Loader2, AlertCircle,
  ExternalLink, Eye, EyeOff, MapPin, Clock, Phone, Mail
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Listing {
  id: string
  title: string | null
  address: string | null
  city: string | null
  state: string | null
}

interface Attendee {
  id: string
  name: string
  email: string
  phone: string | null
  contact_type: string
  brokerage: string | null
  checked_in_at: string
  interest_level: number | null
  feedback: string | null
  wants_follow_up: boolean
}

interface OpenHouseEvent {
  id: string
  listing_id: string
  title: string
  event_date: string
  start_time: string
  end_time: string
  description: string | null
  event_slug: string
  is_published: boolean
  max_attendees: number | null
  checkin_count: number
  status: string
  created_at: string
  listings: { address: string | null; city: string | null; state: string | null; title: string | null } | null
}

interface Stats {
  total: number
  upcoming: number
  totalCheckins: number
  avgInterest: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-400/10 text-blue-400',
  active: 'bg-green-400/10 text-green-400',
  completed: 'bg-white/10 text-white/40',
  cancelled: 'bg-red-400/10 text-red-400',
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${m} ${ampm}`
}

function generateSlug(address: string, date: string): string {
  const parts = address.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).slice(0, 4)
  const datePart = date.replace(/-/g, '')
  return [...parts, datePart].join('-')
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OpenHousesDashboard() {
  const [events, setEvents] = useState<OpenHouseEvent[]>([])
  const [attendees, setAttendees] = useState<Record<string, Attendee[]>>({})
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Create form state
  const [formListingId, setFormListingId] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('10:00')
  const [formEndTime, setFormEndTime] = useState('14:00')
  const [formDescription, setFormDescription] = useState('')
  const [formMaxAttendees, setFormMaxAttendees] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formPublished, setFormPublished] = useState(true)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [eventsRes, listingsRes] = await Promise.all([
        supabase
          .from('open_house_events')
          .select('*, listings(address, city, state, title)')
          .eq('user_id', user.id)
          .order('event_date', { ascending: false }),
        supabase
          .from('listings')
          .select('id, title, address, city, state')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (eventsRes.data) setEvents(eventsRes.data as OpenHouseEvent[])
      if (listingsRes.data) setListings(listingsRes.data)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchAttendees = useCallback(async (eventId: string) => {
    const { data } = await supabase
      .from('open_house_attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false })
    if (data) {
      setAttendees(prev => ({ ...prev, [eventId]: data as Attendee[] }))
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleExpand = (eventId: string) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null)
    } else {
      setExpandedEvent(eventId)
      if (!attendees[eventId]) fetchAttendees(eventId)
    }
  }

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/open-house/${slug}`)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const updateStatus = async (eventId: string, status: string) => {
    await supabase
      .from('open_house_events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', eventId)
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status } : e))
  }

  const togglePublished = async (eventId: string, published: boolean) => {
    await supabase
      .from('open_house_events')
      .update({ is_published: published, updated_at: new Date().toISOString() })
      .eq('id', eventId)
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_published: published } : e))
  }

  // Auto-generate slug when listing or date changes
  useEffect(() => {
    if (formListingId && formDate) {
      const listing = listings.find(l => l.id === formListingId)
      const address = listing?.address ?? listing?.title ?? 'open-house'
      setFormSlug(generateSlug(address, formDate))
    }
  }, [formListingId, formDate, listings])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('open_house_events').insert({
        user_id: user.id,
        listing_id: formListingId,
        title: formTitle,
        event_date: formDate,
        start_time: formStartTime,
        end_time: formEndTime,
        description: formDescription || null,
        event_slug: formSlug,
        is_published: formPublished,
        max_attendees: formMaxAttendees ? parseInt(formMaxAttendees, 10) : null,
      })

      if (error) throw new Error(error.message)

      setShowCreate(false)
      setFormListingId('')
      setFormTitle('')
      setFormDate('')
      setFormStartTime('10:00')
      setFormEndTime('14:00')
      setFormDescription('')
      setFormMaxAttendees('')
      setFormSlug('')
      setFormPublished(true)
      fetchData()
    } catch (error: unknown) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create event')
    } finally {
      setCreating(false)
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const stats: Stats = {
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming' || e.status === 'active').length,
    totalCheckins: events.reduce((sum, e) => sum + (e.checkin_count ?? 0), 0),
    avgInterest: 0,
  }

  // Calculate avg interest from loaded attendees
  const allAttendees = Object.values(attendees).flat()
  const rated = allAttendees.filter(a => a.interest_level !== null)
  if (rated.length > 0) {
    stats.avgInterest = parseFloat((rated.reduce((s, a) => s + (a.interest_level ?? 0), 0) / rated.length).toFixed(1))
  }

  const STAT_CARDS = [
    { label: 'Total Events', value: stats.total, icon: DoorOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'text-[#D4A017]', bg: 'bg-[#D4A017]/10' },
    { label: 'Total Check-ins', value: stats.totalCheckins, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg Interest', value: stats.avgInterest > 0 ? `${stats.avgInterest}/5` : '—', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Open Houses</h1>
          <p className="text-white/50 text-sm">Manage events and track attendee check-ins</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />Create Event
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

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <DoorOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No open house events yet</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Schedule open houses, manage digital check-ins, and track attendee interest — all from one place.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2.5 bg-[#D4A017] hover:bg-[#B8860B] text-black font-medium rounded-lg transition-colors"
            >
              Create First Open House
            </button>
          </div>
        ) : events.map(event => {
          const isExpanded = expandedEvent === event.id
          const listing = event.listings
          const address = listing ? [listing.address, listing.city, listing.state].filter(Boolean).join(', ') : 'Unknown listing'

          return (
            <div key={event.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden">
              {/* Event Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white truncate">{event.title}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[event.status] ?? 'bg-white/10 text-white/40'}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />{address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />{formatDate(event.event_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{formatTime(event.start_time)} – {formatTime(event.end_time)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Check-in count */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{event.checkin_count ?? 0}</p>
                      <p className="text-xs text-white/30">
                        {event.max_attendees ? `/ ${event.max_attendees}` : 'check-ins'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {/* Copy link */}
                  <button
                    onClick={() => copyLink(event.event_slug)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copiedSlug === event.event_slug ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSlug === event.event_slug ? 'Copied!' : 'Copy Check-in Link'}
                  </button>

                  {/* Open link */}
                  <a
                    href={`/open-house/${event.event_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />Preview
                  </a>

                  {/* Published toggle */}
                  <button
                    onClick={() => togglePublished(event.id, !event.is_published)}
                    className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
                      event.is_published ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {event.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {event.is_published ? 'Published' : 'Unpublished'}
                  </button>

                  {/* Status buttons */}
                  {event.status === 'upcoming' && (
                    <button onClick={() => updateStatus(event.id, 'active')} className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs transition-colors">
                      Start Event
                    </button>
                  )}
                  {event.status === 'active' && (
                    <button onClick={() => updateStatus(event.id, 'completed')} className="px-3 py-1.5 bg-white/10 text-white/60 hover:bg-white/20 rounded-lg text-xs transition-colors">
                      End Event
                    </button>
                  )}
                  {(event.status === 'upcoming' || event.status === 'active') && (
                    <button onClick={() => updateStatus(event.id, 'cancelled')} className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors">
                      Cancel
                    </button>
                  )}

                  {/* Expand attendees */}
                  <button
                    onClick={() => toggleExpand(event.id)}
                    className="ml-auto px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Attendees
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Attendee List (expanded) */}
              {isExpanded && (
                <div className="border-t border-white/5 p-4">
                  {!attendees[event.id] ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                    </div>
                  ) : attendees[event.id].length === 0 ? (
                    <p className="text-center text-white/30 text-sm py-4">No check-ins yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-white/40 text-xs uppercase tracking-wider">
                            <th className="text-left pb-3 font-medium">Name</th>
                            <th className="text-left pb-3 font-medium">Contact</th>
                            <th className="text-left pb-3 font-medium">Type</th>
                            <th className="text-left pb-3 font-medium">Brokerage</th>
                            <th className="text-left pb-3 font-medium">Checked In</th>
                            <th className="text-left pb-3 font-medium">Interest</th>
                            <th className="text-left pb-3 font-medium">Follow-up</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {attendees[event.id].map(att => (
                            <tr key={att.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 text-white font-medium">{att.name}</td>
                              <td className="py-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-white/60 flex items-center gap-1"><Mail className="w-3 h-3" />{att.email}</span>
                                  {att.phone && <span className="text-white/40 flex items-center gap-1"><Phone className="w-3 h-3" />{att.phone}</span>}
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 capitalize">{att.contact_type}</span>
                              </td>
                              <td className="py-3 text-white/40">{att.brokerage ?? '—'}</td>
                              <td className="py-3 text-white/40">
                                {new Date(att.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </td>
                              <td className="py-3">
                                {att.interest_level ? (
                                  <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-3.5 h-3.5 ${i < att.interest_level! ? 'text-[#D4A017] fill-[#D4A017]' : 'text-white/20'}`} />
                                    ))}
                                  </div>
                                ) : <span className="text-white/20">—</span>}
                              </td>
                              <td className="py-3">
                                {att.wants_follow_up ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A017]/10 text-[#D4A017]">Yes</span>
                                ) : <span className="text-white/20">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Create open house event">
          <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#D4A017]/20 rounded-lg">
                  <DoorOpen className="w-5 h-5 text-[#D4A017]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create Open House</h2>
                  <p className="text-white/50 text-sm">Set up a new event with public check-in</p>
                </div>
              </div>
              <button onClick={() => { setShowCreate(false); setCreateError(null) }} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Close">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Listing */}
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Listing</label>
                <select
                  value={formListingId}
                  onChange={e => setFormListingId(e.target.value)}
                  required
                  aria-label="Select listing"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none"
                >
                  <option value="">Select a listing...</option>
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.address ?? l.title ?? 'Untitled'}{l.city ? `, ${l.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Event Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Sunday Open House"
                  required
                  aria-label="Event title"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none"
                />
              </div>

              {/* Date + Times */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                    aria-label="Event date"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Start</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    required
                    aria-label="Start time"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">End</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    required
                    aria-label="End time"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Optional event description..."
                  rows={3}
                  aria-label="Event description"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none resize-none"
                />
              </div>

              {/* Max Attendees + Slug */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Max Attendees</label>
                  <input
                    type="number"
                    value={formMaxAttendees}
                    onChange={e => setFormMaxAttendees(e.target.value)}
                    placeholder="Unlimited"
                    min={1}
                    aria-label="Maximum attendees"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">URL Slug</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={e => setFormSlug(e.target.value)}
                    required
                    aria-label="Event URL slug"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017]/60 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Published toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setFormPublished(!formPublished)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${formPublished ? 'bg-[#D4A017]' : 'bg-white/20'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${formPublished ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-sm text-white/60">Publish immediately</span>
              </label>

              {createError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{createError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
