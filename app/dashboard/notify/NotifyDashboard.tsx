'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  MessageSquare, Send, Loader2, Home, ChevronDown,
  Phone, Check, AlertCircle, Smartphone, Globe
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Listing {
  id: string
  title: string
  address: string
  city: string
  state: string
  price: number | null
  slug: string | null
}

type Channel = 'sms' | 'whatsapp'

const TEMPLATES = [
  {
    id: 'photos-ready',
    label: 'Photos Ready',
    body: (listing: Listing, siteUrl: string) =>
      `Hi! Your photos for ${listing.address || listing.title} are ready to view. Check them out here: ${siteUrl}`,
  },
  {
    id: 'listing-live',
    label: 'Listing Live',
    body: (listing: Listing, siteUrl: string) =>
      `Great news! Your property at ${listing.address || listing.title} is now live. View your property site: ${siteUrl}`,
  },
  {
    id: 'price-update',
    label: 'Price Update',
    body: (listing: Listing, siteUrl: string) =>
      `Price update for ${listing.address || listing.title}${listing.price ? ` — now listed at $${Number(listing.price).toLocaleString()}` : ''}. View listing: ${siteUrl}`,
  },
  {
    id: 'open-house',
    label: 'Open House Invite',
    body: (listing: Listing, siteUrl: string) =>
      `You're invited to an open house at ${listing.address || listing.title}! Get details and directions: ${siteUrl}`,
  },
  {
    id: 'custom',
    label: 'Custom Message',
    body: () => '',
  },
]

export default function NotifyDashboard() {
  const searchParams = useSearchParams()
  const preselect = searchParams.get('listing')

  const [listings, setListings] = useState<Listing[]>([])
  const [selectedId, setSelectedId] = useState<string>(preselect ?? '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [channel, setChannel] = useState<Channel>('sms')
  const [templateId, setTemplateId] = useState('photos-ready')
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => { loadListings() }, [])

  useEffect(() => {
    buildMessage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, templateId, listings])

  const loadListings = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('listings')
        .select('id, title, address, city, state, price, slug')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setListings((data ?? []) as Listing[])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const buildMessage = () => {
    if (templateId === 'custom') return
    const listing = listings.find(l => l.id === selectedId)
    if (!listing) return
    const siteUrl = listing.slug
      ? `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://snap-r.com'}/p/${listing.slug}`
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://snap-r.com'}/dashboard/listings`
    const tmpl = TEMPLATES.find(t => t.id === templateId)
    if (tmpl) setMessage(tmpl.body(listing, siteUrl))
  }

  const send = async () => {
    if (!to || !message) return
    setSending(true)
    setError(null)
    setSuccess(false)
    try {
      const endpoint = channel === 'whatsapp' ? '/api/notify/whatsapp' : '/api/notify/sms'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message, listingId: selectedId || undefined }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Send failed')
      }
      setSuccess(true)
      setTo('')
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const selected = listings.find(l => l.id === selectedId)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-6 gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-[#D4A017]" />
        </div>
        <span className="font-bold">Notify</span>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Send SMS / WhatsApp</h1>
          <p className="text-white/40">Instantly deliver property links, photos, and updates to clients via text.</p>
        </div>

        {/* Channel toggle */}
        <div className="glass-luxury glossy-top rounded-2xl p-6 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Step 1 — Channel</p>
          <div className="flex gap-3">
            {([
              { id: 'sms', label: 'SMS', icon: Smartphone },
              { id: 'whatsapp', label: 'WhatsApp', icon: Globe },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setChannel(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  channel === id
                    ? 'border-[#D4A017] bg-[#D4A017]/10 text-white'
                    : 'border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-3">
            {channel === 'whatsapp'
              ? 'Sent via WhatsApp Business Sandbox — recipient must opt in at wa.me/14155238886 first.'
              : 'Standard SMS — delivered to any mobile number.'}
          </p>
        </div>

        {/* Listing select */}
        <div className="glass-luxury glossy-top rounded-2xl p-6 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Step 2 — Select Listing (optional)</p>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(d => !d)}
              className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
            >
              {selected ? (
                <span className="text-sm">{selected.address || selected.title} {selected.city ? `· ${selected.city}` : ''}</span>
              ) : (
                <span className="text-white/40 text-sm">No listing selected (optional)</span>
              )}
              <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-20 max-h-56 overflow-y-auto">
                <button
                  onClick={() => { setSelectedId(''); setShowDropdown(false) }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left text-white/40 text-sm"
                >
                  No listing
                </button>
                {loading ? (
                  <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#D4A017]" /></div>
                ) : listings.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setSelectedId(l.id); setShowDropdown(false) }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left ${selectedId === l.id ? 'bg-[#D4A017]/10' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-white/30" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{l.address || l.title}</p>
                      <p className="text-xs text-white/40">{[l.city, l.state].filter(Boolean).join(', ')}{l.price ? ` · $${Number(l.price).toLocaleString()}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template + message */}
        <div className="glass-luxury glossy-top rounded-2xl p-6 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Step 3 — Message</p>

          {/* Template picker */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTemplateId(t.id)
                  if (t.id === 'custom') setMessage('')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  templateId === t.id
                    ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]'
                    : 'border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={e => { setTemplateId('custom'); setMessage(e.target.value) }}
            rows={5}
            placeholder="Type your message..."
            aria-label="Message body"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#D4A017]/50"
          />
          <p className="text-xs text-white/30 mt-1 text-right">{message.length} chars</p>
        </div>

        {/* Recipient + send */}
        <div className="glass-luxury glossy-top rounded-2xl p-6">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Step 4 — Send</p>

          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="tel"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="+1 555 000 0000"
                aria-label="Recipient phone number"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/50"
              />
            </div>
            <button
              onClick={send}
              disabled={!to || !message || sending}
              className="flex items-center gap-2 px-6 py-3 bg-[#D4A017] text-black font-bold rounded-xl hover:bg-[#B8860B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : success ? (
                <><Check className="w-4 h-4" /> Sent!</>
              ) : (
                <><Send className="w-4 h-4" /> Send</>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl p-4">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">Message sent successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
