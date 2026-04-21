'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Home, Clock, MapPin, Users, ChevronRight, Check,
  Loader2, Star, MessageSquare, ArrowLeft,
} from 'lucide-react'

interface CheckInFormProps {
  event: {
    id: string
    title: string
    event_date: string
    start_time: string
    end_time: string
    description: string | null
    checkin_count: number
    max_attendees: number | null
  }
  listing: {
    address: string | null
    city: string | null
    state: string | null
    hero_photo_url: string | null
  }
}

type Step = 'welcome' | 'form' | 'success' | 'feedback'

const CONTACT_TYPES = [
  { value: 'buyer', label: 'Home Buyer' },
  { value: 'agent', label: "Buyer's Agent" },
  { value: 'investor', label: 'Investor' },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'other', label: 'Other' },
]

const SOURCES = [
  { value: '', label: 'How did you hear about this?' },
  { value: 'sign', label: 'Yard Sign' },
  { value: 'online', label: 'Online Listing (Zillow, Realtor, etc.)' },
  { value: 'social', label: 'Social Media' },
  { value: 'referral', label: 'Friend / Referral' },
  { value: 'drive_by', label: 'Drove By' },
  { value: 'agent', label: 'My Agent' },
  { value: 'other', label: 'Other' },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours ?? '0', 10)
  const m = minutes ?? '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

export default function CheckInForm({ event, listing }: CheckInFormProps) {
  const [step, setStep] = useState<Step>('welcome')
  const [attendeeId, setAttendeeId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', contactType: 'buyer', brokerage: '', source: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interestLevel, setInterestLevel] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [wantsFollowUp, setWantsFollowUp] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState(false)

  const addressLine = [listing.address, listing.city, listing.state].filter(Boolean).join(', ')
  const isFull = event.max_attendees !== null && event.checkin_count >= event.max_attendees

  const inputCls = 'w-full bg-charcoal-deep border border-white/10 rounded-xl px-4 py-3.5 text-base text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-colors'
  const labelCls = 'text-xs text-white/50 uppercase tracking-wider block mb-1.5'

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/open-house/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          contactType: formData.contactType,
          brokerage: formData.brokerage.trim() || undefined,
          source: formData.source || undefined,
        }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json() as { success?: boolean; attendeeId?: string; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Check-in failed. Please try again.')
        return
      }
      setAttendeeId(data.attendeeId ?? null)
      setStep('success')
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        setError('Request timed out. Please try again.')
      } else {
        setError('Network error. Please check your connection.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleFeedback = async () => {
    if (!attendeeId) return
    setFeedbackSubmitting(true)
    try {
      const res = await fetch('/api/open-house/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, interestLevel: interestLevel || undefined, feedback: feedbackText.trim() || undefined, wantsFollowUp }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json() as { success?: boolean }
      if (res.ok && data.success) setFeedbackDone(true)
    } catch {
      // Feedback is optional
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-surface text-white flex flex-col">
        {listing.hero_photo_url && (
          <div className="relative w-full h-56 sm:h-72">
            <Image src={listing.hero_photo_url} alt={addressLine || 'Property'} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          </div>
        )}
        <div className="flex-1 flex flex-col items-center px-6 pb-8">
          <div className="w-full max-w-md -mt-12 relative z-10">
            <div className="bg-surface-container-high border border-white/10 rounded-2xl p-6 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
              {addressLine && (
                <p className="flex items-center gap-2 text-white/60 text-sm mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />{addressLine}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDate(event.event_date)}</span>
              </div>
              <p className="text-sm text-white/50 mt-1 ml-5">{formatTime(event.start_time)} &ndash; {formatTime(event.end_time)}</p>
              {event.description && <p className="text-sm text-white/40 mt-4 leading-relaxed">{event.description}</p>}
              {event.max_attendees !== null && (
                <div className="flex items-center gap-2 mt-4 text-xs text-white/40">
                  <Users className="w-3.5 h-3.5" />{event.checkin_count} / {event.max_attendees} checked in
                </div>
              )}
            </div>
            {isFull ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
                <p className="text-red-400 font-semibold">This open house has reached capacity.</p>
              </div>
            ) : (
              <button onClick={() => setStep('form')} className="w-full py-4 bg-gradient-to-r from-accent-gold via-accent-gold to-gold-dark text-black font-bold rounded-2xl text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
                Check In<ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Check-in Form
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-surface text-white flex flex-col">
        <div className="flex-1 flex flex-col items-center px-6 py-8">
          <div className="w-full max-w-md">
            <button onClick={() => setStep('welcome')} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back
            </button>
            <h2 className="text-2xl font-bold mb-1">Welcome!</h2>
            <p className="text-white/50 text-sm mb-6">Please sign in to register your visit.</p>
            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="checkin-name">Full Name *</label>
                <input id="checkin-name" aria-label="Full name" required type="text" autoComplete="name" value={formData.name} onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))} placeholder="Jane Smith" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="checkin-email">Email *</label>
                <input id="checkin-email" aria-label="Email address" required type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))} placeholder="jane@email.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="checkin-phone">Phone</label>
                <input id="checkin-phone" aria-label="Phone number" type="tel" autoComplete="tel" value={formData.phone} onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))} placeholder="(512) 555-0100" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>I am a...</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CONTACT_TYPES.map(ct => (
                    <button key={ct.value} type="button" onClick={() => setFormData(d => ({ ...d, contactType: ct.value }))} className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.contactType === ct.value ? 'border-primary bg-accent-gold/10 text-primary' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>
              {formData.contactType === 'agent' && (
                <div>
                  <label className={labelCls} htmlFor="checkin-brokerage">Brokerage</label>
                  <input id="checkin-brokerage" aria-label="Brokerage name" type="text" value={formData.brokerage} onChange={(e) => setFormData(d => ({ ...d, brokerage: e.target.value }))} placeholder="Keller Williams" className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls} htmlFor="checkin-source">Source</label>
                <select id="checkin-source" aria-label="How did you hear about this open house" value={formData.source} onChange={(e) => setFormData(d => ({ ...d, source: e.target.value }))} className={inputCls}>
                  {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>}
              <button type="submit" disabled={submitting} className="w-full py-4 bg-gradient-to-r from-accent-gold via-accent-gold to-gold-dark text-black font-bold rounded-2xl text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 active:scale-[0.98]">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Checking In...</> : <><Check className="w-5 h-5" />Check In</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Success Screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-surface text-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-accent-gold/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
          <p className="text-lg text-white/60 mb-2">You&apos;re checked in.</p>
          <p className="text-sm text-white/40 mb-8">Enjoy your tour of <span className="text-white/60">{addressLine || event.title}</span></p>
          <div className="bg-surface-container-high border border-white/10 rounded-2xl p-5 mb-8 text-left">
            <h3 className="font-semibold text-sm mb-3 text-white/70">{event.title}</h3>
            {addressLine && <p className="flex items-center gap-2 text-white/50 text-sm mb-2"><MapPin className="w-4 h-4 flex-shrink-0" />{addressLine}</p>}
            <p className="flex items-center gap-2 text-white/50 text-sm"><Clock className="w-4 h-4 flex-shrink-0" />{formatTime(event.start_time)} &ndash; {formatTime(event.end_time)}</p>
          </div>
          <button onClick={() => setStep('feedback')} className="w-full py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />Share Your Feedback
          </button>
        </div>
      </div>
    )
  }

  // Feedback Screen
  if (step === 'feedback') {
    if (feedbackDone) {
      return (
        <div className="min-h-screen bg-surface text-white flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-accent-gold/20 flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-white/50">Your feedback has been recorded.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-surface text-white flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-md">
          <button onClick={() => setStep('success')} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <h2 className="text-2xl font-bold mb-1">How was the tour?</h2>
          <p className="text-white/50 text-sm mb-8">Your feedback helps the agent improve future showings.</p>
          <div className="mb-6">
            <label className={labelCls}>Interest Level</label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setInterestLevel(n)} className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center ${n <= interestLevel ? 'border-primary bg-accent-gold/20 text-primary' : 'border-white/10 text-white/20 hover:border-white/20'}`} aria-label={`Rate interest ${n} out of 5`}>
                  <Star className={`w-5 h-5 ${n <= interestLevel ? 'fill-accent-gold' : ''}`} />
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-1.5">
              {interestLevel === 0 && 'Tap to rate'}{interestLevel === 1 && 'Not for me'}{interestLevel === 2 && 'Somewhat interested'}{interestLevel === 3 && 'Interested'}{interestLevel === 4 && 'Very interested'}{interestLevel === 5 && 'Love it!'}
            </p>
          </div>
          <div className="mb-6">
            <label className={labelCls} htmlFor="feedback-text">Comments</label>
            <textarea id="feedback-text" aria-label="Feedback comments" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={4} placeholder="What did you think of the property?" className={inputCls + ' resize-none'} />
          </div>
          <div className="mb-8">
            <button type="button" onClick={() => setWantsFollowUp(f => !f)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${wantsFollowUp ? 'border-primary bg-accent-gold/10' : 'border-white/10 hover:border-white/20'}`}>
              <span className="text-sm font-medium">I&apos;d like the agent to follow up with me</span>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${wantsFollowUp ? 'bg-accent-gold justify-end' : 'bg-white/10 justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white mx-1 shadow-sm" />
              </div>
            </button>
          </div>
          <button onClick={handleFeedback} disabled={feedbackSubmitting} className="w-full py-4 bg-gradient-to-r from-accent-gold via-accent-gold to-gold-dark text-black font-bold rounded-2xl text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 active:scale-[0.98]">
            {feedbackSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</> : 'Submit Feedback'}
          </button>
          <button onClick={() => setStep('success')} className="w-full py-3 text-white/40 text-sm hover:text-white/60 mt-3 transition-colors">Skip for now</button>
        </div>
      </div>
    )
  }

  return null
}
