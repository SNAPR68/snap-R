'use client'

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react'
import {
  Camera, Users, Send, Link, Copy, Check, ChevronDown, ChevronUp,
  ExternalLink, Download, Eye, Plus, Search, X, Mail
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeliveryLink {
  id: string
  token: string
  client_name: string
  client_email: string
  status: string
  allow_download: boolean
  viewed_at: string | null
  downloaded_at: string | null
  download_count: number
  created_at: string
  url: string
}

interface ListingDelivery {
  total: number
  sent: number
  downloaded: number
  links: DeliveryLink[]
}

interface Listing {
  id: string
  address: string | null
  city: string | null
  state: string | null
  title: string | null
  hero_url: string | null
  photo_count: number
  delivery: ListingDelivery
}

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  brokerage: string | null
  total_deliveries: number
  last_delivery_at: string | null
  status: string
}

// ─── Deliver Form Modal ───────────────────────────────────────────────────────

interface DeliverModalProps {
  listing: Listing
  clients: Client[]
  primaryColor: string
  onClose: () => void
  onDelivered: () => void
}

function DeliverModal({ listing, clients, primaryColor, onClose, onDelivered }: DeliverModalProps) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [allowDownload, setAllowDownload] = useState(true)
  const [expiresInDays, setExpiresInDays] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; clientName: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const selectClient = (client: Client) => {
    setSelectedClientId(client.id)
    setClientName(client.name)
    setClientEmail(client.email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/photographer/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientId: selectedClientId ?? undefined,
          message: message.trim() || null,
          allowDownload,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
          sendEmail,
        }),
      })

      const data = await res.json() as { success?: boolean; created?: Array<{ url: string; clientName: string }>; errors?: string[] }
      if (!res.ok || !data.success) {
        setError(data.errors?.[0] ?? 'Failed to create delivery link')
        return
      }

      setResult(data.created?.[0] ? { url: data.created[0].url, clientName: data.created[0].clientName } : null)
      onDelivered()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const copyLink = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const propertyLabel = [listing.address, listing.city, listing.state].filter(Boolean).join(', ') || listing.title || 'Property'

  if (result) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: `${primaryColor}22`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Check size={28} style={{ color: primaryColor }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Delivery Link Created!</h3>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            {sendEmail ? `Email sent to ${result.clientName}` : `Share this link with ${result.clientName}`}
          </p>
        </div>

        <div style={{ background: '#0A0A0A', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, border: '1px solid #2A2A2A' }}>
          <span style={{ flex: 1, fontSize: 13, color: '#ccc', wordBreak: 'break-all', fontFamily: 'monospace' }}>{result.url}</span>
          <button
            onClick={copyLink}
            style={{ background: copied ? '#16a34a22' : '#1A1A1A', border: 'none', borderRadius: 8, padding: '8px 12px', color: copied ? '#4ade80' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, flexShrink: 0 }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', background: primaryColor, color: '#000', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 28 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Deliver Photos</h3>
      <p style={{ color: '#666', fontSize: 13, margin: '0 0 24px' }}>{propertyLabel} · {listing.photo_count} photos</p>

      {/* Quick-select from client roster */}
      {clients.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Select from your clients</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {clients.slice(0, 8).map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectClient(c)}
                style={{
                  border: `1px solid ${selectedClientId === c.id ? primaryColor : '#2A2A2A'}`,
                  background: selectedClientId === c.id ? `${primaryColor}22` : '#111',
                  color: selectedClientId === c.id ? primaryColor : '#888',
                  borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Client Name *</label>
          <input
            required
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="Sarah Johnson"
            style={{ width: '100%', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Client Email *</label>
          <input
            required
            type="email"
            value={clientEmail}
            onChange={e => setClientEmail(e.target.value)}
            placeholder="sarah@example.com"
            style={{ width: '100%', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Personal message (optional)</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Hi Sarah, your photos are looking amazing! Let me know if you need any edits."
          rows={3}
          style={{ width: '100%', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Expires in (days)</label>
          <input
            type="number"
            value={expiresInDays}
            onChange={e => setExpiresInDays(e.target.value)}
            placeholder="Never"
            min={1}
            max={365}
            style={{ width: '100%', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#ccc' }}>
          <input type="checkbox" checked={allowDownload} onChange={e => setAllowDownload(e.target.checked)} />
          Allow download
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#ccc' }}>
          <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
          Send email to client
        </label>
      </div>

      {error && (
        <div style={{ background: '#2A0A0A', border: '1px solid #5A1A1A', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', borderRadius: 10, padding: '12px 0', fontSize: 14, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{ flex: 2, background: primaryColor, color: '#000', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Send size={16} />
          {submitting ? 'Creating...' : sendEmail ? 'Send Delivery' : 'Create Link'}
        </button>
      </div>
    </form>
  )
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: Listing
  clients: Client[]
  primaryColor: string
  onRefresh: () => void
}

function ListingCard({ listing, clients, primaryColor, onRefresh }: ListingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const label = [listing.address, listing.city, listing.state].filter(Boolean).join(', ') || listing.title || 'Untitled'
  const { delivery } = listing

  const copyLink = async (url: string, token: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: 14, overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ display: 'flex', gap: 16, padding: '16px 20px', alignItems: 'center' }}>
        {/* Thumbnail */}
        <div style={{ width: 72, height: 52, borderRadius: 8, overflow: 'hidden', background: '#1A1A1A', flexShrink: 0 }}>
          {listing.hero_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <Image src={listing.hero_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={20} style={{ color: '#333' }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#666' }}>
            <span>{listing.photo_count} photos</span>
            <span style={{ color: '#444' }}>·</span>
            <span>{delivery.sent} delivered</span>
            {delivery.downloaded > 0 && (
              <>
                <span style={{ color: '#444' }}>·</span>
                <span style={{ color: '#4ade80' }}>{delivery.downloaded} downloaded</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowDeliverModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: primaryColor, color: '#000', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Send size={14} /> Deliver
          </button>
          {delivery.sent > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 10px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Delivery links list */}
      {expanded && delivery.links.length > 0 && (
        <div style={{ borderTop: '1px solid #1A1A1A' }}>
          {delivery.links.map(link => (
            <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid #141414' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px', color: '#ddd' }}>{link.client_name}</p>
                <p style={{ fontSize: 12, color: '#555', margin: 0 }}>{link.client_email}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#555' }}>
                {link.viewed_at && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888' }}>
                    <Eye size={12} /> Viewed
                  </span>
                )}
                {link.downloaded_at && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4ade80' }}>
                    <Download size={12} /> {link.download_count}×
                  </span>
                )}
                <span style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 11,
                  background: link.status === 'active' ? '#16a34a22' : '#5A1A1A22',
                  color: link.status === 'active' ? '#4ade80' : '#f87171',
                }}>
                  {link.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => copyLink(link.url, link.token)}
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, padding: '6px 8px', color: copiedToken === link.token ? '#4ade80' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Copy link"
                >
                  {copiedToken === link.token ? <Check size={13} /> : <Copy size={13} />}
                </button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, padding: '6px 8px', color: '#888', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                  title="Open link"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deliver modal */}
      {showDeliverModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setShowDeliverModal(false)} />
          <div style={{ position: 'relative', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setShowDeliverModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <DeliverModal
              listing={listing}
              clients={clients}
              primaryColor={primaryColor}
              onClose={() => setShowDeliverModal(false)}
              onDelivered={() => { onRefresh(); }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────

interface ClientsTabProps {
  clients: Client[]
  primaryColor: string
  onRefresh: () => void
}

function ClientsTab({ clients, primaryColor, onRefresh }: ClientsTabProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', brokerage: '' })
  const [error, setError] = useState<string | null>(null)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.brokerage ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/photographer/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to add client'); return }
      setShowAdd(false)
      setForm({ name: '', email: '', phone: '', brokerage: '' })
      onRefresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{ width: '100%', background: '#111', border: '1px solid #1E1E1E', borderRadius: 10, padding: '10px 12px 10px 36px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: primaryColor, color: '#000', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 15 }}>New Client</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" style={{ background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 14 }} />
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" style={{ background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 14 }} />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" style={{ background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 14 }} />
            <input value={form.brokerage} onChange={e => setForm(f => ({ ...f, brokerage: e.target.value }))} placeholder="Brokerage" style={{ background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 14 }} />
          </div>
          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', borderRadius: 8, padding: '9px 0', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: primaryColor, color: '#000', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Add Client'}</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#444', fontSize: 15 }}>
            {search ? 'No clients match your search.' : 'No clients yet. Add your first client above.'}
          </div>
        )}
        {filtered.map(client => (
          <div key={client.id} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: primaryColor }}>{client.name[0].toUpperCase()}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px', color: '#fff' }}>{client.name}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#555', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{client.email}</span>
                {client.brokerage && <span>{client.brokerage}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 2px', color: primaryColor }}>{client.total_deliveries}</p>
              <p style={{ fontSize: 12, color: '#555', margin: 0 }}>deliveries</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function PhotographerDashboard() {
  const [tab, setTab] = useState<'listings' | 'clients'>('listings')
  const [listings, setListings] = useState<Listing[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [primaryColor] = useState('#D4A017')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, clientRes] = await Promise.all([
        fetch('/api/photographer/listings'),
        fetch('/api/photographer/clients'),
      ])
      const listData = await listRes.json() as { listings?: Listing[] }
      const clientData = await clientRes.json() as { clients?: Client[] }
      setListings(listData.listings ?? [])
      setClients(clientData.clients ?? [])
    } catch {
      // load failed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const totalDelivered = listings.reduce((sum, l) => sum + l.delivery.sent, 0)
  const totalDownloaded = listings.reduce((sum, l) => sum + l.delivery.downloaded, 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>
          <span style={{ color: primaryColor }}>Photographer</span> Portal
        </h1>
        <p style={{ color: '#666', fontSize: 15, margin: 0 }}>
          Deliver photos to clients with your branded link — no SnapR branding visible.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        {[
          { label: 'Listings', value: listings.length, icon: Camera },
          { label: 'Delivered', value: totalDelivered, icon: Send },
          { label: 'Downloaded', value: totalDownloaded, icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <Icon size={16} style={{ color: '#333' }} />
            </div>
            <p style={{ fontSize: 30, fontWeight: 700, margin: 0, color: primaryColor }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#111', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {(['listings', 'clients'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: tab === t ? primaryColor : 'transparent',
              color: tab === t ? '#000' : '#666',
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            {t === 'listings' ? <><Camera size={15} /> Listings</> : <><Users size={15} /> Clients ({clients.length})</>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#444' }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${primaryColor}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : tab === 'listings' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: '#111', borderRadius: 16, border: '1px solid #1E1E1E' }}>
              <Camera size={48} style={{ color: '#333', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ color: '#555', fontSize: 16, margin: '0 0 8px' }}>No listings yet</p>
              <p style={{ color: '#444', fontSize: 14, margin: 0 }}>Upload photos to a listing to get started.</p>
            </div>
          ) : (
            listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                clients={clients}
                primaryColor={primaryColor}
                onRefresh={load}
              />
            ))
          )}
        </div>
      ) : (
        <ClientsTab clients={clients} primaryColor={primaryColor} onRefresh={load} />
      )}

      {/* Setup tip: org branding */}
      <div style={{ marginTop: 40, background: '#0D0D0D', border: '1px solid #1A1A1A', borderLeft: `3px solid ${primaryColor}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link size={18} style={{ color: primaryColor, flexShrink: 0 }} />
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#ddd' }}>Set up your branded portal</p>
          <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
            Add your logo, studio name, and brand colors so delivery links show your brand, not SnapR.{' '}
            <a href="/dashboard/organization" style={{ color: primaryColor, textDecoration: 'none' }}>Configure branding →</a>
          </p>
        </div>
      </div>
    </div>
  )
}
