'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Globe, Eye, Save, ToggleLeft, ToggleRight,
  Copy, Check, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react'

interface Site {
  id: string
  slug: string
  template: string
  custom_colors: Record<string, string> | null
  agent_info: Record<string, string> | null
  is_published: boolean
  listing_id: string
}

interface Listing {
  id: string
  title: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  description: string | null
  property_type: string | null
  year_built: number | null
  lot_size: string | null
  parking: string | null
  features: string[] | null
  mls_number: string | null
  hoa_fees: number | null
  virtual_tour_url: string | null
}

interface Props {
  site: Site
  listing: Listing | null
}

type Theme = 'modern' | 'classic' | 'minimal' | 'luxury'

const THEMES: { value: Theme; label: string; bg: string; accent: string }[] = [
  { value: 'modern', label: 'Modern Dark', bg: '#111', accent: '#3B82F6' },
  { value: 'classic', label: 'Classic Light', bg: '#fff', accent: '#16a34a' },
  { value: 'minimal', label: 'Minimal', bg: '#F5F5F5', accent: '#000' },
  { value: 'luxury', label: 'Luxury Gold', bg: '#0A0A0A', accent: '#D4A017' },
]

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/8 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-white/80">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/60 transition-colors"
const textareaCls = inputCls + " resize-none"

export default function SiteEditorClient({ site, listing }: Props) {
  const siteUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://snap-r.com'}/p/${site.slug}`

  // Form state — listing fields
  const [title, setTitle] = useState(listing?.title ?? '')
  const [address, setAddress] = useState(listing?.address ?? '')
  const [city, setCity] = useState(listing?.city ?? '')
  const [state, setState] = useState(listing?.state ?? '')
  const [postalCode, setPostalCode] = useState(listing?.postal_code ?? '')
  const [price, setPrice] = useState(listing?.price?.toString() ?? '')
  const [bedrooms, setBedrooms] = useState(listing?.bedrooms?.toString() ?? '')
  const [bathrooms, setBathrooms] = useState(listing?.bathrooms?.toString() ?? '')
  const [squareFeet, setSquareFeet] = useState(listing?.square_feet?.toString() ?? '')
  const [description, setDescription] = useState(listing?.description ?? '')
  const [propertyType, setPropertyType] = useState(listing?.property_type ?? '')
  const [yearBuilt, setYearBuilt] = useState(listing?.year_built?.toString() ?? '')
  const [lotSize, setLotSize] = useState(listing?.lot_size ?? '')
  const [parking, setParking] = useState(listing?.parking ?? '')
  const [mlsNumber, setMlsNumber] = useState(listing?.mls_number ?? '')
  const [hoaFees, setHoaFees] = useState(listing?.hoa_fees?.toString() ?? '')
  const [featuresText, setFeaturesText] = useState((listing?.features ?? []).join('\n'))
  const [virtualTourUrl, setVirtualTourUrl] = useState(listing?.virtual_tour_url ?? '')

  // Agent info
  const [agentName, setAgentName] = useState(site.agent_info?.name ?? '')
  const [agentEmail, setAgentEmail] = useState(site.agent_info?.email ?? '')
  const [agentPhone, setAgentPhone] = useState(site.agent_info?.phone ?? '')
  const [agentCompany, setAgentCompany] = useState(site.agent_info?.company ?? '')
  const [agentTitle, setAgentTitle] = useState(site.agent_info?.title ?? '')

  // Site settings
  const [theme, setTheme] = useState<Theme>((site.template as Theme) ?? 'luxury')
  const [isPublished, setIsPublished] = useState(site.is_published)

  // UI state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      // Update listing
      if (listing?.id) {
        const listingRes = await fetch(`/api/listing/update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: listing.id,
            title: title || null,
            address: address || null,
            city: city || null,
            state: state || null,
            postal_code: postalCode || null,
            price: price ? parseFloat(price) : null,
            bedrooms: bedrooms ? parseInt(bedrooms) : null,
            bathrooms: bathrooms ? parseFloat(bathrooms) : null,
            square_feet: squareFeet ? parseInt(squareFeet) : null,
            description: description || null,
            property_type: propertyType || null,
            year_built: yearBuilt ? parseInt(yearBuilt) : null,
            lot_size: lotSize || null,
            parking: parking || null,
            mls_number: mlsNumber || null,
            hoa_fees: hoaFees ? parseFloat(hoaFees) : null,
            features: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
            virtual_tour_url: virtualTourUrl.trim() || null,
          }),
          signal: AbortSignal.timeout(15000),
        })
        if (!listingRes.ok) {
          const d = await listingRes.json() as { error?: string }
          throw new Error(d.error ?? 'Failed to update listing')
        }
      }

      // Update site
      const siteRes = await fetch('/api/property-site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: site.id,
          template: theme,
          is_published: isPublished,
          agent_info: {
            name: agentName,
            email: agentEmail,
            phone: agentPhone,
            company: agentCompany,
            title: agentTitle,
          },
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!siteRes.ok) {
        const d = await siteRes.json() as { error?: string }
        throw new Error(d.error ?? 'Failed to update site')
      }

      setSaved(true)
      setPreviewKey(k => k + 1)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [
    listing?.id, site.id, title, address, city, state, postalCode,
    price, bedrooms, bathrooms, squareFeet, description, propertyType,
    yearBuilt, lotSize, parking, mlsNumber, hoaFees, featuresText, virtualTourUrl,
    theme, isPublished, agentName, agentEmail, agentPhone, agentCompany, agentTitle,
  ])

  const copyLink = async () => {
    await navigator.clipboard.writeText(siteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4 gap-4 flex-shrink-0 z-10">
        <Link href="/dashboard/content-studio/sites" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#D4A017]" />
          <span className="font-semibold text-sm truncate max-w-xs">{title || listing?.address || 'Property Site'}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* Publish toggle */}
          <button
            onClick={() => setIsPublished(p => !p)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            {isPublished
              ? <ToggleRight className="w-5 h-5 text-green-400" />
              : <ToggleLeft className="w-5 h-5 text-white/30" />}
            {isPublished ? 'Published' : 'Draft'}
          </button>

          {/* Copy link */}
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/50" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          {/* Open site */}
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-white/50" /> View Live
          </a>

          {/* Save */}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#D4A017] text-black rounded-lg text-sm font-bold hover:bg-[#B8860B] transition-colors disabled:opacity-60"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-900/30 border-b border-red-500/30 px-4 py-2 text-sm text-red-300 text-center">
          {error}
        </div>
      )}

      {/* Body: editor + preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — editor */}
        <aside className="w-[360px] flex-shrink-0 bg-[#0F0F0F] border-r border-white/5 overflow-y-auto p-4">

          {/* Theme */}
          <Section title="Theme">
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${theme === t.value ? 'border-[#D4A017]' : 'border-white/10 hover:border-white/20'}`}
                >
                  <div className="h-7 rounded-lg mb-2 flex items-center justify-center" style={{ background: t.bg }}>
                    <div className="w-8 h-1.5 rounded" style={{ background: t.accent }} />
                  </div>
                  <p className="text-xs font-medium text-white/80">{t.label}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* Property details */}
          <Section title="Property Details">
            <Field label="Title / Headline">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Stunning Modern Estate" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Price ($)">
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="850000" className={inputCls} />
              </Field>
              <Field label="Property Type">
                <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className={inputCls}>
                  <option value="">Select...</option>
                  {['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Beds">
                <input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} placeholder="4" className={inputCls} />
              </Field>
              <Field label="Baths">
                <input type="number" step="0.5" value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="3" className={inputCls} />
              </Field>
              <Field label="Sq Ft">
                <input type="number" value={squareFeet} onChange={e => setSquareFeet(e.target.value)} placeholder="2400" className={inputCls} />
              </Field>
            </div>
            <Field label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Describe the property..." className={textareaCls} />
            </Field>
          </Section>

          {/* Address */}
          <Section title="Address" defaultOpen={false}>
            <Field label="Street Address">
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" className={inputCls} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="City">
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Austin" className={inputCls} />
              </Field>
              <Field label="State">
                <input value={state} onChange={e => setState(e.target.value)} placeholder="TX" className={inputCls} maxLength={2} />
              </Field>
              <Field label="ZIP">
                <input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="78701" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Additional details */}
          <Section title="Additional Details" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Year Built">
                <input type="number" value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} placeholder="2018" className={inputCls} />
              </Field>
              <Field label="Lot Size">
                <input value={lotSize} onChange={e => setLotSize(e.target.value)} placeholder="0.25 acres" className={inputCls} />
              </Field>
              <Field label="Parking">
                <input value={parking} onChange={e => setParking(e.target.value)} placeholder="2-car garage" className={inputCls} />
              </Field>
              <Field label="HOA Fees ($/mo)">
                <input type="number" value={hoaFees} onChange={e => setHoaFees(e.target.value)} placeholder="150" className={inputCls} />
              </Field>
              <Field label="MLS Number">
                <input value={mlsNumber} onChange={e => setMlsNumber(e.target.value)} placeholder="MLS123456" className={inputCls} />
              </Field>
            </div>
            <Field label="Virtual Tour URL">
              <input value={virtualTourUrl} onChange={e => setVirtualTourUrl(e.target.value)} placeholder="https://my.matterport.com/show/?m=..." className={inputCls} />
            </Field>
            <Field label="Features (one per line)">
              <textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={5} placeholder={"Chef's Kitchen\nHardwood Floors\nPool & Spa\nSmart Home"} className={textareaCls} />
            </Field>
          </Section>

          {/* Agent info */}
          <Section title="Agent Info" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name">
                <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Jane Smith" className={inputCls} />
              </Field>
              <Field label="Title">
                <input value={agentTitle} onChange={e => setAgentTitle(e.target.value)} placeholder="Realtor®" className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} placeholder="jane@realty.com" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={agentPhone} onChange={e => setAgentPhone(e.target.value)} placeholder="(512) 555-0100" className={inputCls} />
              </Field>
            </div>
            <Field label="Brokerage">
              <input value={agentCompany} onChange={e => setAgentCompany(e.target.value)} placeholder="Keller Williams" className={inputCls} />
            </Field>
          </Section>

        </aside>

        {/* Right panel — live preview */}
        <div className="flex-1 bg-[#080808] flex flex-col">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 bg-[#0F0F0F]">
            <Eye className="w-4 h-4 text-white/30" />
            <span className="text-xs text-white/40">Live Preview</span>
            <div className="flex-1 bg-white/5 rounded-md px-3 py-1 text-xs text-white/30 font-mono truncate">{siteUrl}</div>
          </div>
          <div className="flex-1 relative">
            <iframe
              key={previewKey}
              src={siteUrl}
              className="w-full h-full border-0"
              title="Property site preview"
            />
            {/* Overlay hint when not yet saved */}
            {previewKey === 0 && (
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white/60 text-xs px-3 py-2 rounded-lg border border-white/10">
                Save to update preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
