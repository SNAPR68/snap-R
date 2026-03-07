'use client'

import { useState } from 'react'
import {
  Camera, Video, Plane, Grid, Sparkles, Moon, Clock,
  MapPin, ChevronRight, ChevronLeft, Check, Loader2,
  User, Mail, Phone, Building, FileText, Lock, Calendar,
  CheckCircle, AlertCircle
} from 'lucide-react'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Package {
  id: string
  name: string
  description: string | null
  price_cents: number
  includes_photos: boolean
  max_photos: number
  includes_video: boolean
  includes_drone: boolean
  includes_floor_plan: boolean
  includes_virtual_staging: boolean
  includes_twilight: boolean
  estimated_duration_minutes: number
  sort_order: number
}

interface BookingFormProps {
  photographer: {
    id: string
    name: string
    avatar?: string
    phone?: string
    email?: string
  }
  brand: {
    name: string
    logo?: string
    primaryColor: string
    secondaryColor: string
  }
  packages: Package[]
  availability?: {
    weekly_schedule: Record<string, { start: string | null; end: string | null; available: boolean }>
    max_shoots_per_day: number
    blocked_dates: string[]
    buffer_minutes: number
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condo', label: 'Condo / Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Vacant Land' },
]

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (8am–12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm–4pm)' },
  { value: 'evening', label: 'Evening (4pm–7pm)' },
]

const STEPS = ['Package', 'Property', 'Schedule', 'Contact', 'Review']

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BookingForm({ photographer, brand, packages }: BookingFormProps) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  // Form data
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [propertyAddress, setPropertyAddress] = useState('')
  const [propertyCity, setPropertyCity] = useState('')
  const [propertyState, setPropertyState] = useState('')
  const [propertyZip, setPropertyZip] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [squareFeet, setSquareFeet] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [accessInfo, setAccessInfo] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientBrokerage, setClientBrokerage] = useState('')

  const selectedPackage = packages.find(p => p.id === selectedPackageId)
  const pc = brand.primaryColor

  // ─── Validation ──────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!selectedPackageId || packages.length === 0
      case 1: return propertyAddress.trim().length > 0
      case 2: return true // date/time optional
      case 3: return clientName.trim().length > 0 && clientEmail.trim().length > 0
      default: return true
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/photographer/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photographerId: photographer.id,
          packageId: selectedPackageId || undefined,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim() || undefined,
          clientBrokerage: clientBrokerage.trim() || undefined,
          propertyAddress: propertyAddress.trim(),
          propertyCity: propertyCity.trim() || undefined,
          propertyState: propertyState.trim() || undefined,
          propertyZip: propertyZip.trim() || undefined,
          propertyType: propertyType || undefined,
          bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
          bathrooms: bathrooms ? parseFloat(bathrooms) : undefined,
          squareFeet: squareFeet ? parseInt(squareFeet) : undefined,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
          specialInstructions: specialInstructions.trim() || undefined,
          accessInfo: accessInfo.trim() || undefined,
        }),
        signal: AbortSignal.timeout(15000),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to create booking')
        return
      }

      setBookingId(data.bookingId)
      setSubmitted(true)
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Input Styles ────────────────────────────────────────────────────────

  const inputCls = 'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--brand)] transition-colors'
  const labelCls = 'block text-sm font-medium text-white/70 mb-2'

  // ─── Render ──────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: `${pc}22` }}>
            <CheckCircle className="w-10 h-10" style={{ color: pc }} />
          </div>
          <h1 className="text-3xl font-bold mb-3">Booking Submitted!</h1>
          <p className="text-white/60 mb-6">
            Your shoot request has been sent to {photographer.name}. You&apos;ll receive a confirmation email shortly.
          </p>
          {bookingId && (
            <p className="text-sm text-white/40 mb-8">
              Booking reference: <span className="font-mono text-white/60">{bookingId.slice(0, 8)}</span>
            </p>
          )}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Property</span>
              <span className="text-white">{propertyAddress}</span>
            </div>
            {selectedPackage && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Package</span>
                <span style={{ color: pc }}>{selectedPackage.name} — ${(selectedPackage.price_cents / 100).toFixed(0)}</span>
              </div>
            )}
            {preferredDate && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Preferred Date</span>
                <span className="text-white">{new Date(preferredDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ ['--brand' as string]: pc }}>
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logo ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden relative">
                <Image src={brand.logo} alt={brand.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-black text-xl" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}>
                {brand.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-bold">{brand.name}</span>
              <p className="text-xs text-white/40">Book a Shoot</p>
            </div>
          </div>
          {photographer.phone && (
            <a href={`tel:${photographer.phone}`} className="text-sm text-white/50 hover:text-white flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {photographer.phone}
            </a>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step ? 'text-black' : i === step ? 'text-black' : 'bg-white/10 text-white/40'
                }`}
                style={i <= step ? { background: pc } : undefined}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i <= step ? 'text-white' : 'text-white/30'}`}>{label}</span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-1 ${i < step ? '' : 'bg-white/10'}`} style={i < step ? { background: pc } : undefined} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-6 pb-32">
        {/* Step 0: Package Selection */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose Your Package</h2>
            <p className="text-white/50 mb-6">Select a photography package for your property.</p>

            {packages.length === 0 ? (
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/50 mb-2">No packages configured yet.</p>
                <p className="text-sm text-white/30">Contact {photographer.name} directly to discuss pricing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {packages.map(pkg => {
                  const isSelected = selectedPackageId === pkg.id
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`w-full text-left rounded-2xl p-5 border-2 transition-all ${
                        isSelected
                          ? 'bg-white/[0.08] shadow-lg'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                      style={isSelected ? { borderColor: pc, boxShadow: `0 0 20px ${pc}22` } : undefined}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{pkg.name}</h3>
                          {pkg.description && <p className="text-sm text-white/50 mt-1">{pkg.description}</p>}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold" style={{ color: pc }}>${(pkg.price_cents / 100).toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pkg.includes_photos && (
                          <span className="inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
                            <Camera className="w-3 h-3" /> {pkg.max_photos} Photos
                          </span>
                        )}
                        {pkg.includes_video && (
                          <span className="inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
                            <Video className="w-3 h-3" /> Video
                          </span>
                        )}
                        {pkg.includes_drone && (
                          <span className="inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
                            <Plane className="w-3 h-3" /> Drone
                          </span>
                        )}
                        {pkg.includes_floor_plan && (
                          <span className="inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
                            <Grid className="w-3 h-3" /> Floor Plan
                          </span>
                        )}
                        {pkg.includes_virtual_staging && (
                          <span className="inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
                            <Sparkles className="w-3 h-3" /> Virtual Staging
                          </span>
                        )}
                        {pkg.includes_twilight && (
                          <span className="inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
                            <Moon className="w-3 h-3" /> Twilight
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> ~{pkg.estimated_duration_minutes} min
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Property Details */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Property Details</h2>
            <p className="text-white/50 mb-6">Tell us about the property to photograph.</p>

            <div className="space-y-4">
              <div>
                <label className={labelCls}><MapPin className="w-3.5 h-3.5 inline mr-1" />Property Address *</label>
                <input type="text" value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} placeholder="123 Main Street" className={inputCls} required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" value={propertyCity} onChange={e => setPropertyCity(e.target.value)} placeholder="Austin" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input type="text" value={propertyState} onChange={e => setPropertyState(e.target.value)} placeholder="TX" maxLength={2} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>ZIP</label>
                  <input type="text" value={propertyZip} onChange={e => setPropertyZip(e.target.value)} placeholder="78701" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Property Type</label>
                  <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className={inputCls}>
                    <option value="">Select...</option>
                    {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Square Feet</label>
                  <input type="number" value={squareFeet} onChange={e => setSquareFeet(e.target.value)} placeholder="2,400" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Bedrooms</label>
                  <input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} placeholder="3" min="0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Bathrooms</label>
                  <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="2.5" min="0" step="0.5" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}><FileText className="w-3.5 h-3.5 inline mr-1" />Special Instructions</label>
                <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="Back door is around the left side, landscaping not yet complete..." rows={3} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}><Lock className="w-3.5 h-3.5 inline mr-1" />Access Info</label>
                <input type="text" value={accessInfo} onChange={e => setAccessInfo(e.target.value)} placeholder="Lockbox code: 1234, or call tenant at..." className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Preferred Schedule</h2>
            <p className="text-white/50 mb-6">{photographer.name} will confirm the final date and time.</p>

            <div className="space-y-4">
              <div>
                <label className={labelCls}><Calendar className="w-3.5 h-3.5 inline mr-1" />Preferred Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}><Clock className="w-3.5 h-3.5 inline mr-1" />Preferred Time</label>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setPreferredTime(slot.value)}
                      className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        preferredTime === slot.value
                          ? 'bg-white/[0.08] text-white'
                          : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}
                      style={preferredTime === slot.value ? { borderColor: pc } : undefined}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-white/50">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {selectedPackage
                    ? `Estimated shoot duration: ~${selectedPackage.estimated_duration_minutes} minutes`
                    : 'Shoot duration depends on the selected package'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Contact Info</h2>
            <p className="text-white/50 mb-6">How can {photographer.name} reach you?</p>

            <div className="space-y-4">
              <div>
                <label className={labelCls}><User className="w-3.5 h-3.5 inline mr-1" />Your Name *</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Sarah Johnson" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}><Mail className="w-3.5 h-3.5 inline mr-1" />Email *</label>
                <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="sarah@remax.com" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}><Phone className="w-3.5 h-3.5 inline mr-1" />Phone</label>
                <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(512) 555-1234" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}><Building className="w-3.5 h-3.5 inline mr-1" />Brokerage</label>
                <input type="text" value={clientBrokerage} onChange={e => setClientBrokerage(e.target.value)} placeholder="RE/MAX, Compass, eXp..." className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Review Your Booking</h2>
            <p className="text-white/50 mb-6">Confirm everything looks good before submitting.</p>

            <div className="space-y-4">
              {selectedPackage && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-white/50">Package</p>
                      <p className="font-bold text-lg">{selectedPackage.name}</p>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: pc }}>${(selectedPackage.price_cents / 100).toFixed(0)}</span>
                  </div>
                </div>
              )}

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
                <p className="text-sm text-white/50 font-medium">Property</p>
                <p className="font-medium">{propertyAddress}</p>
                {(propertyCity || propertyState) && (
                  <p className="text-sm text-white/60">{[propertyCity, propertyState, propertyZip].filter(Boolean).join(', ')}</p>
                )}
                {(bedrooms || bathrooms || squareFeet) && (
                  <p className="text-sm text-white/60">
                    {[
                      bedrooms && `${bedrooms} bed`,
                      bathrooms && `${bathrooms} bath`,
                      squareFeet && `${parseInt(squareFeet).toLocaleString()} sqft`,
                    ].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>

              {(preferredDate || preferredTime) && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-2">
                  <p className="text-sm text-white/50 font-medium">Schedule</p>
                  {preferredDate && (
                    <p className="font-medium">{new Date(preferredDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  )}
                  {preferredTime && <p className="text-sm text-white/60 capitalize">{preferredTime}</p>}
                </div>
              )}

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-2">
                <p className="text-sm text-white/50 font-medium">Contact</p>
                <p className="font-medium">{clientName}</p>
                <p className="text-sm text-white/60">{clientEmail}</p>
                {clientPhone && <p className="text-sm text-white/60">{clientPhone}</p>}
                {clientBrokerage && <p className="text-sm text-white/60">{clientBrokerage}</p>}
              </div>

              {specialInstructions && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-2">
                  <p className="text-sm text-white/50 font-medium">Special Instructions</p>
                  <p className="text-sm text-white/80">{specialInstructions}</p>
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{submitError}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur border-t border-white/10 p-4 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 border border-white/20 rounded-xl text-white hover:bg-white/5 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="px-8 py-3 rounded-xl text-black font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="px-8 py-3 rounded-xl text-black font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Check className="w-4 h-4" /> Submit Booking</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Powered by */}
      <div className="fixed bottom-20 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] text-white/20">Powered by SnapR</p>
      </div>
    </div>
  )
}
