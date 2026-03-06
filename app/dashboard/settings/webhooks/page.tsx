'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Webhook, Plus, Trash2, ToggleLeft, ToggleRight, Copy, Check, ChevronDown, ChevronUp, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutgoingWebhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
  description: string | null;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status_code: number | null;
  success: boolean;
  response_body: string | null;
  created_at: string;
}

const ALL_EVENTS = [
  { value: 'listing.created', label: 'Listing Created' },
  { value: 'listing.updated', label: 'Listing Updated' },
  { value: 'listing.prepared', label: 'Listing Prepared' },
  { value: 'lead.created', label: 'Lead Created' },
  { value: 'lead.updated', label: 'Lead Updated' },
  { value: 'post.published', label: 'Post Published' },
  { value: 'post.scheduled', label: 'Post Scheduled' },
  { value: 'photo.enhanced', label: 'Photo Enhanced' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WebhooksSettingsPage() {
  const [webhooks, setWebhooks] = useState<OutgoingWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Delivery log state
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

  // Create form state
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['listing.prepared', 'lead.created']);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks/outgoing');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch {
      setError('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeliveries = useCallback(async () => {
    setLoadingDeliveries(true);
    try {
      const res = await fetch('/api/webhooks/deliveries?limit=50');
      if (res.ok) {
        const data = await res.json() as { deliveries: WebhookDelivery[] };
        setDeliveries(data.deliveries || []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingDeliveries(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
    fetchDeliveries();
  }, [fetchWebhooks, fetchDeliveries]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl || newEvents.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/webhooks/outgoing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, events: newEvents, description: newDescription || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to create webhook');
        return;
      }
      setNewUrl('');
      setNewDescription('');
      setNewEvents(['listing.prepared', 'lead.created']);
      setShowCreate(false);
      fetchWebhooks();
    } catch {
      setError('Failed to create webhook');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await fetch('/api/webhooks/outgoing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
      setWebhooks(wh => wh.map(w => w.id === id ? { ...w, is_active: !currentActive } : w));
    } catch {
      setError('Failed to update webhook');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook? This cannot be undone.')) return;
    try {
      await fetch('/api/webhooks/outgoing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setWebhooks(wh => wh.filter(w => w.id !== id));
    } catch {
      setError('Failed to delete webhook');
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleEvent(ev: string) {
    setNewEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    );
  }

  function webhookUrlFor(webhookId: string) {
    return webhooks.find(w => w.id === webhookId)?.url ?? webhookId.slice(0, 8) + '...';
  }

  const successCount = deliveries.filter(d => d.success).length;
  const failCount = deliveries.filter(d => !d.success).length;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/dashboard/settings" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Webhook className="w-7 h-7 text-[#D4A017]" />
            <div>
              <h1 className="text-2xl font-bold">Outgoing Webhooks</h1>
              <p className="text-white/50 text-sm mt-0.5">Send real-time events to Zapier, Make, or your own endpoints</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black font-semibold rounded-lg hover:bg-[#B8860B] text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {/* ── Create Form ──────────────────────────────────────────────── */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-[#1A1A1A] border border-[#D4A017]/40 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">New Webhook</h2>

            <div className="mb-4">
              <label className="block text-sm text-white/60 mb-1">Endpoint URL <span className="text-red-400">*</span></label>
              <input
                type="url"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                required
                aria-label="Webhook endpoint URL"
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/60"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-white/60 mb-1">Description (optional)</label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="e.g. Zapier — new lead to CRM"
                aria-label="Webhook description"
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/60"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">Events to send <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_EVENTS.map(ev => (
                  <label key={ev.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={newEvents.includes(ev.value)}
                      onChange={() => toggleEvent(ev.value)}
                      className="w-4 h-4 accent-[#D4A017]"
                    />
                    <span className="text-sm text-white/70 group-hover:text-white">{ev.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !newUrl || newEvents.length === 0}
                className="px-5 py-2 bg-[#D4A017] text-black font-semibold rounded-lg hover:bg-[#B8860B] disabled:opacity-50 text-sm"
              >
                {saving ? 'Creating...' : 'Create Webhook'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── Webhook List ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-white/40 text-sm py-12 text-center">Loading webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-12 text-center">
            <Webhook className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No webhooks yet. Add one to start receiving real-time events.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(wh => (
              <div key={wh.id} className={`bg-[#1A1A1A] border rounded-xl overflow-hidden transition-colors ${wh.is_active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-center gap-4 p-4">
                  {/* Active indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${wh.is_active ? 'bg-green-400' : 'bg-white/20'}`} />

                  {/* URL + description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-white truncate">{wh.url}</p>
                    {wh.description && <p className="text-xs text-white/40 mt-0.5">{wh.description}</p>}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {wh.events.slice(0, 4).map(ev => (
                        <span key={ev} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/50">{ev}</span>
                      ))}
                      {wh.events.length > 4 && (
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/50">+{wh.events.length - 4} more</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === wh.id ? null : wh.id)}
                      className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
                      aria-label="Toggle details"
                    >
                      {expandedId === wh.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleToggle(wh.id, wh.is_active)}
                      className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
                      aria-label={wh.is_active ? 'Disable webhook' : 'Enable webhook'}
                    >
                      {wh.is_active
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
                      aria-label="Delete webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: secret key */}
                {expandedId === wh.id && (
                  <div className="border-t border-white/10 px-4 py-3 bg-black/20">
                    <p className="text-xs text-white/40 mb-1">Signing Secret — verify with <code className="text-[#D4A017]">X-Webhook-Signature</code> header (HMAC-SHA256)</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-white/60 bg-black/40 px-3 py-1.5 rounded border border-white/10 truncate">
                        {wh.secret}
                      </code>
                      <button
                        onClick={() => handleCopy(wh.secret, wh.id)}
                        className="flex-shrink-0 p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
                        aria-label="Copy secret"
                      >
                        {copiedId === wh.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/30 mt-2">Created {new Date(wh.created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Delivery Log ─────────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#D4A017]" />
              Delivery Log
            </h2>
            <div className="flex items-center gap-3 text-xs text-white/40">
              {deliveries.length > 0 && (
                <>
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />{successCount} ok
                  </span>
                  {failCount > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle className="w-3.5 h-3.5" />{failCount} failed
                    </span>
                  )}
                </>
              )}
              <button
                onClick={fetchDeliveries}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {loadingDeliveries ? (
            <div className="text-white/40 text-sm py-8 text-center">Loading deliveries...</div>
          ) : deliveries.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-8 text-center">
              <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No deliveries yet. Events will appear here once webhooks start firing.</p>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden">
              {/* Summary row */}
              <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] grid grid-cols-[auto_1fr_auto_auto] gap-4 text-xs text-white/30 font-medium">
                <span>Status</span>
                <span>Event / Endpoint</span>
                <span className="text-right">Code</span>
                <span className="text-right">When</span>
              </div>
              <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
                {deliveries.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDelivery(selectedDelivery?.id === d.id ? null : d)}
                    className="w-full grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-4 py-3 hover:bg-white/[0.02] text-left transition-colors"
                  >
                    <span>
                      {d.success
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                    </span>
                    <span className="min-w-0">
                      <span className="text-sm font-mono text-white/70 block truncate">{d.event}</span>
                      <span className="text-xs text-white/30 block truncate">{webhookUrlFor(d.webhook_id)}</span>
                    </span>
                    <span className={`text-xs font-mono text-right flex-shrink-0 ${d.success ? 'text-green-400' : 'text-red-400'}`}>
                      {d.status_code ?? 'ERR'}
                    </span>
                    <span className="text-xs text-white/30 text-right flex-shrink-0 whitespace-nowrap">
                      {new Date(d.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>

              {/* Expanded delivery detail */}
              {selectedDelivery && (
                <div className="border-t border-white/10 px-4 py-3 bg-black/20">
                  <p className="text-xs text-white/40 mb-1.5">Response body</p>
                  <pre className="text-xs font-mono text-white/50 bg-black/40 rounded p-3 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
                    {selectedDelivery.response_body || '(empty)'}
                  </pre>
                  <p className="text-xs text-white/20 mt-1.5">
                    {new Date(selectedDelivery.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Docs callout ─────────────────────────────────────────────── */}
        <div className="mt-8 bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-2">How to verify webhook signatures</h3>
          <p className="text-xs text-white/50 mb-3">Every delivery includes an <code className="text-[#D4A017]">X-Webhook-Signature</code> header. Verify it with HMAC-SHA256:</p>
          <pre className="text-xs bg-black/40 rounded-lg p-3 overflow-x-auto text-white/60 font-mono">{`const crypto = require('crypto')
const sig = req.headers['x-webhook-signature']
const expected = crypto
  .createHmac('sha256', YOUR_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex')
if (sig !== expected) throw new Error('Invalid signature')`}</pre>
        </div>
      </main>
    </div>
  );
}
