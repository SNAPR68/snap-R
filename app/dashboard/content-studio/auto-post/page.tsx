'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Plus, Trash2, Zap, Instagram, Facebook, Linkedin, ToggleLeft, ToggleRight, Check } from 'lucide-react'
import Link from 'next/link'

interface AutoPostRule {
  id: string
  name: string
  trigger_event: string
  trigger_value: string
  platforms: string[]
  post_type: string
  is_active: boolean
}

const TRIGGERS = [
  { id: 'listing_created', name: 'New Listing Added', icon: '🏠' },
  { id: 'status_active', name: 'Status → Active', icon: '✅' },
  { id: 'status_pending', name: 'Status → Pending', icon: '⏳' },
  { id: 'status_sold', name: 'Status → Sold', icon: '🎉' },
  { id: 'price_reduced', name: 'Price Reduced', icon: '💰' },
]

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
]

const POST_TYPES: Record<string, string> = {
  'listing_created': 'just-listed',
  'status_active': 'just-listed',
  'status_pending': 'under-contract',
  'status_sold': 'just-sold',
  'price_reduced': 'price-reduced',
}

export default function AutoPostSettings() {
  const [rules, setRules] = useState<AutoPostRule[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newRule, setNewRule] = useState({ trigger: '', platforms: [] as string[], name: '' })

  useEffect(() => { fetchRules() }, [])

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/auto-post')
      const data = await res.json()
      setRules(data.rules || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const createRule = async () => {
    if (!newRule.trigger || newRule.platforms.length === 0) return
    setCreating(true)
    try {
      const trigger = TRIGGERS.find(t => t.id === newRule.trigger)
      const res = await fetch('/api/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRule.name || trigger?.name || 'Auto Post Rule',
          triggerEvent: newRule.trigger.includes('status_') ? 'status_changed' : newRule.trigger,
          triggerValue: newRule.trigger.replace('status_', ''),
          platforms: newRule.platforms,
          postType: POST_TYPES[newRule.trigger] || 'just-listed'
        })
      })
      const data = await res.json()
      if (data.rule) {
        setRules([data.rule, ...rules])
        setShowCreate(false)
        setNewRule({ trigger: '', platforms: [], name: '' })
      }
    } catch (e) { console.error(e) }
    finally { setCreating(false) }
  }

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/auto-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      })
      setRules(rules.map(r => r.id === id ? { ...r, is_active: !isActive } : r))
    } catch (e) { console.error(e) }
  }

  const deleteRule = async (id: string) => {
    try {
      await fetch('/api/auto-post', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      setRules(rules.filter(r => r.id !== id))
    } catch (e) { console.error(e) }
  }

  const togglePlatform = (platformId: string) => {
    setNewRule(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId) 
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-[#D4AF37]" />Auto-Post Rules</h1>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold">
            <Plus className="w-4 h-4 mr-2" />New Rule
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Info Banner */}
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[#D4AF37]">Automate Your Social Media</p>
              <p className="text-sm text-white/60 mt-1">Create rules to automatically generate and schedule posts when listing status changes. Never miss a marketing opportunity!</p>
            </div>
          </div>
        </div>

        {/* Create Rule Modal */}
        {showCreate && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
            <h3 className="text-lg font-bold mb-4">Create Auto-Post Rule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">When this happens...</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGERS.map(t => (
                    <button key={t.id} onClick={() => setNewRule({ ...newRule, trigger: t.id })} className={`p-3 rounded-lg text-left transition ${newRule.trigger === t.id ? 'bg-[#D4AF37]/20 border border-[#D4AF37]' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                      <span className="mr-2">{t.icon}</span>{t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Post to these platforms...</label>
                <div className="flex gap-2">
                  {PLATFORMS.map(p => {
                    const Icon = p.icon
                    const selected = newRule.platforms.includes(p.id)
                    return (
                      <button key={p.id} onClick={() => togglePlatform(p.id)} className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition ${selected ? 'bg-[#D4AF37]/20 border border-[#D4AF37]' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                        <Icon className="w-4 h-4" />
                        {p.name}
                        {selected && <Check className="w-4 h-4 text-[#D4AF37]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1 border-white/20">Cancel</Button>
                <Button onClick={createRule} disabled={creating || !newRule.trigger || newRule.platforms.length === 0} className="flex-1 bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Rule'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Rules List */}
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" /></div>
        ) : rules.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
            <Zap className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 mb-4">No auto-post rules yet</p>
            <Button onClick={() => setShowCreate(true)} className="bg-[#D4AF37] hover:bg-[#B8960C] text-black">Create Your First Rule</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => {
              const trigger = TRIGGERS.find(t => t.id === rule.trigger_event || t.id === `status_${rule.trigger_value}`)
              return (
                <div key={rule.id} className={`bg-white/5 rounded-xl p-4 border transition ${rule.is_active ? 'border-[#D4AF37]/30' : 'border-white/10 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleRule(rule.id, rule.is_active)} className="flex-shrink-0">
                      {rule.is_active ? <ToggleRight className="w-8 h-8 text-[#D4AF37]" /> : <ToggleLeft className="w-8 h-8 text-white/30" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{trigger?.icon || '��'}</span>
                        <span className="font-medium">{rule.name || trigger?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {rule.platforms.map(p => {
                          const plat = PLATFORMS.find(pl => pl.id === p)
                          const Icon = plat?.icon || Instagram
                          return <Icon key={p} className="w-4 h-4 text-white/50" />
                        })}
                        <span className="text-xs text-white/40 ml-2">→ {rule.post_type}</span>
                      </div>
                    </div>
                    <Button onClick={() => deleteRule(rule.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
