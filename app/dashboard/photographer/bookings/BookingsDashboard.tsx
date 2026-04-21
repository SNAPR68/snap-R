'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Camera, Clock, CheckCircle2, XCircle, Loader2,
  DollarSign, Calendar, ChevronDown, ChevronUp, X, Mail, Phone,
  MapPin, Package, FileText, User, Building
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PackageInfo {
  id: string
  name: string
  price_cents: number
  description: string | null
  estimated_duration_minutes: number
}

interface Booking {
  id: string
  photographer_id: string
  package_id: string | null
  listing_id: string | null
  client_name: string
  client_email: string
  client_phone: string | null
  client_brokerage: string | null
  property_address: string
  property_city: string | null
  property_state: string | null
  property_zip: string | null
  property_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  preferred_date: string | null
  preferred_time: string | null
  confirmed_date: string | null
  confirmed_time: string | null
  special_instructions: string | null
  access_info: string | null
  add_ons: string[] | null
  quoted_price_cents: number | null
  status: string
  payment_status: string
  created_at: string
}

type BookingStatus = 'pending' | 'confirmed' | 'shot' | 'editing' | 'delivered' | 'cancelled' | 'invoiced'
type FilterTab = 'all' | BookingStatus

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'bg-yellow-400/10 text-yellow-400', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-400/10 text-blue-400', icon: CheckCircle2 },
  shot: { label: 'Shot', color: 'bg-purple-400/10 text-purple-400', icon: Camera },
  editing: { label: 'Editing', color: 'bg-orange-400/10 text-orange-400', icon: FileText },
  delivered: { label: 'Delivered', color: 'bg-green-400/10 text-green-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-400/10 text-red-400', icon: XCircle },
  invoiced: { label: 'Invoiced', color: 'bg-emerald-400/10 text-emerald-400', icon: DollarSign },
}

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: 'bg-white/10 text-white/40',
  invoiced: 'bg-yellow-400/10 text-yellow-400',
  paid: 'bg-green-400/10 text-green-400',
  refunded: 'bg-red-400/10 text-red-400',
}

const STATUS_FLOW: BookingStatus[] = ['pending', 'confirmed', 'shot', 'editing', 'delivered']

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookingsDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [packages, setPackages] = useState<Record<string, PackageInfo>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<string | null>(null)
  const [confirmDate, setConfirmDate] = useState('')
  const [confirmTime, setConfirmTime] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [bookingsRes, packagesRes] = await Promise.all([
        supabase
          .from('booking_requests')
          .select('*')
          .eq('photographer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('photographer_packages')
          .select('id, name, price_cents, description, estimated_duration_minutes')
          .eq('photographer_id', user.id),
      ])

      if (bookingsRes.data) setBookings(bookingsRes.data as Booking[])
      if (packagesRes.data) {
        const map: Record<string, PackageInfo> = {}
        for (const p of packagesRes.data) {
          map[p.id] = p as PackageInfo
        }
        setPackages(map)
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const updateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdating(bookingId)
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      // If confirming, set confirmed date/time
      if (newStatus === 'confirmed' && confirmDate) {
        updateData.confirmed_date = confirmDate
        updateData.confirmed_time = confirmTime || null
      }

      await supabase
        .from('booking_requests')
        .update(updateData)
        .eq('id', bookingId)

      setBookings(prev => prev.map(b =>
        b.id === bookingId
          ? { ...b, status: newStatus, ...(newStatus === 'confirmed' ? { confirmed_date: confirmDate, confirmed_time: confirmTime || null } : {}) }
          : b
      ))
      setConfirmModal(null)
      setConfirmDate('')
      setConfirmTime('')
    } catch {
      // silently ignore
    } finally {
      setUpdating(null)
    }
  }

  const handleAdvanceStatus = (booking: Booking) => {
    const currentIdx = STATUS_FLOW.indexOf(booking.status as BookingStatus)
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return

    const nextStatus = STATUS_FLOW[currentIdx + 1]

    // If advancing to confirmed, show confirm modal
    if (nextStatus === 'confirmed') {
      setConfirmModal(booking.id)
      setConfirmDate(booking.preferred_date ?? '')
      setConfirmTime('')
    } else {
      updateStatus(booking.id, nextStatus)
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => b.status === activeTab)

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    revenue: bookings
      .filter(b => b.payment_status === 'paid' && b.quoted_price_cents)
      .reduce((sum, b) => sum + (b.quoted_price_cents ?? 0), 0),
  }

  const STAT_CARDS = [
    { label: 'Total Bookings', value: stats.total, icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Revenue', value: stats.revenue > 0 ? formatPrice(stats.revenue) : '$0', icon: DollarSign, color: 'text-primary', bg: 'bg-accent-gold/10' },
  ]

  const TABS: { value: FilterTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shot', label: 'Shot' },
    { value: 'editing', label: 'Editing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Booking Requests</h1>
        <p className="text-white/50 text-sm">Manage photo shoot bookings from agents</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-surface-container-high border border-white/5 rounded-xl p-4">
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

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? 'bg-accent-gold/20 text-primary'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60">
                {bookings.filter(b => b.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Camera className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'all' ? 'No booking requests yet' : `No ${activeTab} bookings`}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              {activeTab === 'all'
                ? 'When clients book a photography session through your public booking page, their requests will appear here.'
                : `Bookings will appear here once they move to the "${activeTab}" stage.`}
            </p>
          </div>
        ) : filtered.map(booking => {
          const isExpanded = expandedBooking === booking.id
          const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending
          const StatusIcon = statusCfg.icon
          const pkg = booking.package_id ? packages[booking.package_id] : null
          const address = [booking.property_address, booking.property_city, booking.property_state].filter(Boolean).join(', ')
          const currentFlowIdx = STATUS_FLOW.indexOf(booking.status as BookingStatus)
          const canAdvance = currentFlowIdx >= 0 && currentFlowIdx < STATUS_FLOW.length - 1

          return (
            <div key={booking.id} className="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
              {/* Booking Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{booking.client_name}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusCfg.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />{statusCfg.label}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${PAYMENT_COLORS[booking.payment_status] ?? PAYMENT_COLORS.unpaid}`}>
                        {booking.payment_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />{address}
                      </span>
                      {booking.preferred_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(booking.preferred_date)}
                          {booking.preferred_time ? ` at ${booking.preferred_time}` : ''}
                        </span>
                      )}
                      {pkg && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />{pkg.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    {booking.quoted_price_cents ? (
                      <>
                        <p className="text-xl font-bold text-white">{formatPrice(booking.quoted_price_cents)}</p>
                        <p className="text-xs text-white/30">quoted</p>
                      </>
                    ) : pkg ? (
                      <>
                        <p className="text-xl font-bold text-white/60">{formatPrice(pkg.price_cents)}</p>
                        <p className="text-xs text-white/30">package price</p>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Confirmed date */}
                {booking.confirmed_date && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs text-blue-400">
                      Confirmed: {formatDate(booking.confirmed_date)}
                      {booking.confirmed_time ? ` at ${booking.confirmed_time}` : ''}
                    </span>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {/* Advance status */}
                  {canAdvance && (
                    <button
                      onClick={() => handleAdvanceStatus(booking)}
                      disabled={updating === booking.id}
                      className="px-3 py-1.5 bg-gradient-to-r from-gold to-gold-dark text-black text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity"
                    >
                      {updating === booking.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      Mark as {STATUS_CONFIG[STATUS_FLOW[currentFlowIdx + 1]]?.label}
                    </button>
                  )}

                  {/* Cancel */}
                  {booking.status !== 'cancelled' && booking.status !== 'delivered' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'cancelled')}
                      disabled={updating === booking.id}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}

                  {/* Expand details */}
                  <button
                    onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                    className="ml-auto px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    Details
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-white/5 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Info */}
                    <div>
                      <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">Client Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-white/30" />
                          <span className="text-white">{booking.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-white/30" />
                          <span className="text-white/60">{booking.client_email}</span>
                        </div>
                        {booking.client_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-white/30" />
                            <span className="text-white/60">{booking.client_phone}</span>
                          </div>
                        )}
                        {booking.client_brokerage && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="w-4 h-4 text-white/30" />
                            <span className="text-white/60">{booking.client_brokerage}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property Info */}
                    <div>
                      <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">Property Details</h4>
                      <div className="space-y-1 text-sm text-white/60">
                        <p>{address}{booking.property_zip ? ` ${booking.property_zip}` : ''}</p>
                        {booking.property_type && <p className="capitalize">{booking.property_type}</p>}
                        <div className="flex items-center gap-3">
                          {booking.bedrooms !== null && <span>{booking.bedrooms} bed</span>}
                          {booking.bathrooms !== null && <span>{booking.bathrooms} bath</span>}
                          {booking.square_feet !== null && <span>{booking.square_feet.toLocaleString()} sqft</span>}
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {booking.special_instructions && (
                      <div>
                        <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">Special Instructions</h4>
                        <p className="text-sm text-white/60">{booking.special_instructions}</p>
                      </div>
                    )}

                    {/* Access Info */}
                    {booking.access_info && (
                      <div>
                        <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">Access Info</h4>
                        <p className="text-sm text-white/60">{booking.access_info}</p>
                      </div>
                    )}

                    {/* Add-ons */}
                    {booking.add_ons && booking.add_ons.length > 0 && (
                      <div>
                        <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">Add-ons</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {booking.add_ons.map(addon => (
                            <span key={addon} className="text-xs px-2.5 py-1 bg-white/5 rounded-full text-white/60">{addon}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-white/20 mt-4">
                    Booked {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirm Booking Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Confirm booking">
          <div className="bg-surface-container-high rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Confirm Booking</h2>
              <button onClick={() => { setConfirmModal(null); setConfirmDate(''); setConfirmTime('') }} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Close">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Confirmed Date</label>
                <input
                  type="date"
                  value={confirmDate}
                  onChange={e => setConfirmDate(e.target.value)}
                  required
                  aria-label="Confirmed date"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/60 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Confirmed Time</label>
                <input
                  type="time"
                  value={confirmTime}
                  onChange={e => setConfirmTime(e.target.value)}
                  aria-label="Confirmed time"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary/60 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmModal(null); setConfirmDate(''); setConfirmTime('') }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStatus(confirmModal, 'confirmed')}
                  disabled={!confirmDate || updating === confirmModal}
                  className="flex-1 py-3 bg-gradient-to-r from-gold to-gold-dark rounded-xl text-black font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating === confirmModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
