'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, Plus, Trash2, RefreshCw, CheckCircle, Clock, XCircle, Copy, Check, X } from 'lucide-react'

interface CustomDomain {
  id: string
  domain: string
  target_type: string
  target_id: string | null
  verification_status: string
  verification_token: string
  verified_at: string | null
  created_at: string
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<{ step1: string; value: string; step2: string } | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch('/api/domains', { signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const data = await res.json()
        setDomains(data.domains)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load domains'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDomains() }, [fetchDomains])

  const handleCreate = async () => {
    if (!newDomain.trim()) return
    setCreating(true)
    setError(null)
    setInstructions(null)
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase() }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json()
      if (res.ok) {
        setNewDomain('')
        setInstructions(data.instructions)
        fetchDomains()
      } else {
        setError(data.error || 'Failed to add domain')
      }
    } catch {
      setError('Request failed')
    } finally {
      setCreating(false)
    }
  }

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch('/api/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        setError('Verification request failed')
      }
    } catch {
      setError('Verification request failed')
    }
    fetchDomains()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this custom domain?')) return
    try {
      const res = await fetch('/api/domains', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        setError('Failed to remove domain')
      }
    } catch {
      setError('Failed to remove domain')
    }
    fetchDomains()
  }

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedToken(value)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-yellow-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-6 h-6 text-[#D4A017]" />
        <h1 className="text-2xl font-bold text-white">Custom Domains</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DNS Instructions */}
      {instructions && (
        <div className="glass-luxury rounded-xl p-4 mb-6 border border-blue-600/30">
          <p className="text-blue-200 font-medium mb-3">DNS Configuration Required</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400">1. Add a TXT record:</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-black/50 px-2 py-1 rounded text-white flex-1">{instructions.value}</code>
                <button onClick={() => copyValue(instructions.value)} className="p-1 text-gray-400 hover:text-white">
                  {copiedToken === instructions.value ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-400">2. {instructions.step2}</p>
            </div>
          </div>
          <button onClick={() => setInstructions(null)} className="text-gray-400 text-sm mt-3 underline">Dismiss</button>
        </div>
      )}

      {/* Add domain form */}
      <div className="glass-luxury rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Add Domain</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="photos.yourdomain.com"
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A017]/50"
            aria-label="Custom domain"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newDomain.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black font-medium rounded-lg hover:bg-[#B8860B] disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Adding...' : 'Add Domain'}
          </button>
        </div>
      </div>

      {/* Domains list */}
      <div className="glass-luxury rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Your Domains</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : domains.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No custom domains configured</div>
        ) : (
          <div className="divide-y divide-white/5">
            {domains.map((d) => (
              <div key={d.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(d.verification_status)}
                  <div>
                    <p className="text-white font-medium">{d.domain}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {d.verification_status === 'verified'
                        ? `Verified ${d.verified_at ? new Date(d.verified_at).toLocaleDateString() : ''}`
                        : `Pending verification • TXT: snapr-verify=${d.verification_token}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.verification_status !== 'verified' && (
                    <button
                      onClick={() => handleVerify(d.id)}
                      className="p-2 text-gray-400 hover:text-[#D4A017] transition-colors"
                      title="Re-verify"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove domain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
