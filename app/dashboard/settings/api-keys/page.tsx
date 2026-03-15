'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  rate_limit_per_minute: number
  last_used_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tier, setTier] = useState<string>('free')

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/api-keys', { signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys)
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
    // Check user tier
    const checkTier = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single()
        setTier(profile?.subscription_tier ?? 'free')
      }
    }
    checkTier()
  }, [fetchKeys])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json()
      if (res.ok) {
        setNewKeySecret(data.key)
        setNewKeyName('')
        fetchKeys()
      } else {
        setError(data.error || 'Failed to create key')
      }
    } catch {
      setError('Request failed')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return
    try {
      const res = await fetch('/api/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        fetchKeys()
      }
    } catch {
      // Silently handle
    }
  }

  const copyKey = async () => {
    if (!newKeySecret) return
    try {
      await navigator.clipboard.writeText(newKeySecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  const isEnterprise = tier === 'enterprise'

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Key className="w-6 h-6 text-[#D4A017]" />
        <h1 className="text-2xl font-bold text-white">API Keys</h1>
      </div>

      {!isEnterprise && (
        <div className="glass-luxury rounded-xl p-4 mb-6 border border-yellow-600/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-yellow-200 font-medium">Enterprise Plan Required</p>
            <p className="text-gray-400 text-sm mt-1">
              API access is available on the Enterprise plan. You can create keys here, but they will not work until you upgrade.
            </p>
          </div>
        </div>
      )}

      {/* New key secret display */}
      {newKeySecret && (
        <div className="glass-luxury rounded-xl p-4 mb-6 border border-green-600/30">
          <p className="text-green-200 font-medium mb-2">🔑 Your new API key (shown once):</p>
          <div className="flex items-center gap-2">
            <code className="bg-black/50 px-3 py-2 rounded text-sm text-white font-mono flex-1 overflow-x-auto">
              {showSecret ? newKeySecret : '•'.repeat(40)}
            </code>
            <button onClick={() => setShowSecret(!showSecret)} className="p-2 text-gray-400 hover:text-white">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={copyKey} className="p-2 text-gray-400 hover:text-white">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">Save this key securely. It cannot be retrieved again.</p>
          <button onClick={() => setNewKeySecret(null)} className="text-gray-400 text-sm mt-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Create key form */}
      <div className="glass-luxury rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Create New Key</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production, Staging)"
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A017]/50"
            aria-label="API key name"
            maxLength={100}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black font-medium rounded-lg hover:bg-[#B8860B] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Creating...' : 'Create Key'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Keys list */}
      <div className="glass-luxury rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Active Keys</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : keys.filter(k => k.is_active).length === 0 ? (
          <div className="p-8 text-center text-gray-500">No API keys created yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.filter(k => k.is_active).map((apiKey) => (
              <div key={apiKey.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{apiKey.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <code className="text-gray-400 text-sm font-mono">{apiKey.key_prefix}••••••</code>
                    <span className="text-gray-500 text-xs">
                      Created {new Date(apiKey.created_at).toLocaleDateString()}
                    </span>
                    {apiKey.last_used_at && (
                      <span className="text-gray-500 text-xs">
                        Last used {new Date(apiKey.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                    {apiKey.expires_at && (
                      <span className="text-yellow-500 text-xs">
                        Expires {new Date(apiKey.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(apiKey.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage info */}
      <div className="mt-6 glass-luxury rounded-xl p-4">
        <h2 className="text-lg font-semibold text-white mb-2">Quick Start</h2>
        <pre className="bg-black/50 rounded-lg p-3 text-sm text-gray-300 overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://snap-r.com/api/v1/listings`}
        </pre>
        <p className="text-gray-500 text-sm mt-2">
          See the <a href="/developers" className="text-[#D4A017] underline">Developer Docs</a> for full API reference.
        </p>
      </div>
    </div>
  )
}
