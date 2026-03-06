'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Mail, Users, Send, ChevronRight, Loader2, Check,
  Search, X, UserPlus, AlertCircle, Clock,
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string | null
  status: string
  score: number | null
  source: string | null
  created_at: string
}

interface BulkSend {
  subject: string
  count: number
  at: string
}

export default function EmailListsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Compose state
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)
  const [sendError, setSendError] = useState('')

  // History
  const [history, setHistory] = useState<BulkSend[]>([])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json() as { leads: Lead[] }
      setLeads(json.leads || [])
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/leads/bulk-email')
      if (!res.ok) return
      const json = await res.json() as { sends: BulkSend[] }
      setHistory(json.sends || [])
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchHistory()
  }, [fetchLeads, fetchHistory])

  const filtered = leads.filter(l => {
    if (!l.email) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        l.name.toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(filtered.map(l => l.id)))
  }

  const selectNone = () => setSelected(new Set())

  const selectByStatus = (status: string) => {
    const ids = filtered.filter(l => l.status === status).map(l => l.id)
    setSelected(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })
  }

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || selected.size === 0) return
    setSending(true)
    setSendError('')
    setSendResult(null)
    try {
      const res = await fetch('/api/leads/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selected),
          subject: subject.trim(),
          body: body.trim(),
        }),
      })
      const json = await res.json() as { sent?: number; failed?: number; error?: string }
      if (!res.ok) throw new Error(json.error || 'Send failed')
      setSendResult({ sent: json.sent || 0, failed: json.failed || 0 })
      setSubject('')
      setBody('')
      setSelected(new Set())
      fetchHistory()
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    converted: 'Converted',
    archived: 'Archived',
  }

  const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-300',
    contacted: 'bg-yellow-500/20 text-yellow-300',
    qualified: 'bg-purple-500/20 text-purple-300',
    converted: 'bg-green-500/20 text-green-300',
    archived: 'bg-white/10 text-white/30',
  }

  const emailableCount = filtered.filter(l => selected.has(l.id)).length

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <Link href="/dashboard/leads" className="text-white/40 hover:text-white transition-colors">Leads</Link>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="text-white font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D4AF37]" />Email Lists &amp; Bulk Send
            </span>
          </nav>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Users className="w-4 h-4" />
            {leads.filter(l => l.email).length} contacts with email
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left: Contact list */}
        <div className="w-[55%] border-r border-white/5 flex flex-col">
          {/* Filters */}
          <div className="px-5 py-4 border-b border-white/5 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search contacts..."
                  aria-label="Search contacts"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
                  </button>
                )}
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={selectAll}
                className="px-2.5 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                Select all ({filtered.length})
              </button>
              <button
                onClick={selectNone}
                className="px-2.5 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                Clear
              </button>
              {(['new', 'contacted', 'qualified'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => selectByStatus(s)}
                  className="px-2.5 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  + {STATUS_LABELS[s]}
                </button>
              ))}
              {selected.size > 0 && (
                <span className="ml-auto text-xs text-[#D4AF37] font-medium">
                  {selected.size} selected
                </span>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No contacts match your filters</p>
              </div>
            ) : (
              filtered.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => toggleSelect(lead.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors text-left ${
                    selected.has(lead.id) ? 'bg-[#D4AF37]/5' : ''
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected.has(lead.id)
                      ? 'bg-[#D4AF37] border-[#D4AF37]'
                      : 'border-white/20 bg-transparent'
                  }`}>
                    {selected.has(lead.id) && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{lead.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${STATUS_COLORS[lead.status] || 'bg-white/10 text-white/40'}`}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </div>
                    <div className="text-xs text-white/40 truncate mt-0.5">{lead.email}</div>
                  </div>
                  {(lead.score ?? 0) > 0 && (
                    <div className={`text-xs font-medium flex-shrink-0 ${
                      (lead.score ?? 0) >= 70 ? 'text-green-400' :
                      (lead.score ?? 0) >= 40 ? 'text-yellow-400' : 'text-white/40'
                    }`}>
                      {lead.score}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Compose + History */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Compose */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#D4AF37]" />
              Compose Email
            </h2>

            {sendResult && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                <Check className="w-4 h-4 flex-shrink-0" />
                Sent to {sendResult.sent} contact{sendResult.sent !== 1 ? 's' : ''}
                {sendResult.failed > 0 && `, ${sendResult.failed} failed`}
              </div>
            )}

            {sendError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {sendError}
              </div>
            )}

            <div>
              <label className="block text-xs text-white/40 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Just listed: 123 Main St — Schedule your showing"
                aria-label="Email subject"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-white/40">Body</label>
                <span className="text-xs text-white/20">Use <code className="bg-white/10 px-1 rounded">{'{{name}}'}</code> and <code className="bg-white/10 px-1 rounded">{'{{first_name}}'}</code></span>
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={`Hi {{first_name}},\n\nI wanted to reach out about...`}
                rows={12}
                aria-label="Email body"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/50 resize-none font-mono"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || selected.size === 0 || !subject.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#B8960C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
              ) : (
                <><Send className="w-4 h-4" />Send to {emailableCount} contact{emailableCount !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>

          {/* Send history */}
          {history.length > 0 && (
            <div className="border-t border-white/5 px-6 py-4">
              <h3 className="text-xs font-semibold text-white/40 mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />Recent Sends
              </h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-white/60 truncate flex-1 mr-3">{s.subject}</span>
                    <span className="text-white/30 flex-shrink-0">
                      {s.count} sent · {new Date(s.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
