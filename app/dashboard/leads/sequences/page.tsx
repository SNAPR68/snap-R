'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Plus, Trash2, ChevronDown, ChevronUp,
  Pencil, Check, X, Loader2, Users, ToggleLeft, ToggleRight,
  GripVertical, Clock
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface DripStep {
  id?: string
  step_number: number
  delay_days: number
  subject_template: string
  body_template: string
}

interface DripSequence {
  id: string
  name: string
  description: string | null
  trigger_event: string
  is_active: boolean
  is_system: boolean
  created_at: string
  steps: DripStep[]
  active_enrollments: number
}

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manual only',
  lead_captured: 'Auto: Lead captured',
  status_change: 'Auto: Status change',
}

const TEMPLATE_VARS = ['{{name}}', '{{address}}', '{{agent_name}}', '{{agent_phone}}', '{{property_site_url}}', '{{unsubscribe_url}}']

// ── Empty step factory ─────────────────────────────────────────────────────────

function emptyStep(n: number): DripStep {
  return {
    step_number: n,
    delay_days: n === 1 ? 0 : (n - 1) * 3,
    subject_template: '',
    body_template: '',
  }
}

// ── Step Editor ────────────────────────────────────────────────────────────────

function StepEditor({
  step, index, total,
  onChange, onRemove,
}: {
  step: DripStep
  index: number
  total: number
  onChange: (s: DripStep) => void
  onRemove: () => void
}) {
  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Step {index + 1}</span>
        <div className="flex items-center gap-1.5 ml-auto">
          <Clock className="w-3 h-3 text-white/30" />
          <input
            type="number"
            min={0}
            max={365}
            value={step.delay_days}
            onChange={e => onChange({ ...step, delay_days: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-14 bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#D4A017]/60"
            aria-label={`Step ${index + 1} delay days`}
          />
          <span className="text-xs text-white/40">days after enroll</span>
          {total > 1 && (
            <button
              onClick={onRemove}
              className="ml-2 p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400"
              aria-label="Remove step"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={step.subject_template}
          onChange={e => onChange({ ...step, subject_template: e.target.value })}
          placeholder="Subject: {{name}}, just listed — {{address}}"
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#D4A017]/60"
          aria-label={`Step ${index + 1} subject`}
        />
        <textarea
          value={step.body_template}
          onChange={e => onChange({ ...step, body_template: e.target.value })}
          placeholder={'Hi {{name}},\n\nJust wanted to follow up about {{address}}...\n\nBest,\n{{agent_name}}'}
          rows={5}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#D4A017]/60 resize-y"
          aria-label={`Step ${index + 1} body`}
        />
      </div>
    </div>
  )
}

// ── Sequence Form ──────────────────────────────────────────────────────────────

function SequenceForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<DripSequence>
  onSave: (data: { name: string; description: string; triggerEvent: string; steps: DripStep[] }) => void
  onCancel: () => void
  saving: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [triggerEvent, setTriggerEvent] = useState(initial?.trigger_event ?? 'manual')
  const [steps, setSteps] = useState<DripStep[]>(
    initial?.steps && initial.steps.length > 0 ? initial.steps : [emptyStep(1)]
  )
  const [showVars, setShowVars] = useState(false)

  function updateStep(i: number, s: DripStep) {
    setSteps(prev => prev.map((p, idx) => idx === i ? s : p))
  }

  function addStep() {
    setSteps(prev => [...prev, emptyStep(prev.length + 1)])
  }

  function removeStep(i: number) {
    setSteps(prev => {
      const next = prev.filter((_, idx) => idx !== i)
      return next.map((s, idx) => ({ ...s, step_number: idx + 1 }))
    })
  }

  const valid = name.trim().length > 0 && steps.every(s => s.subject_template.trim() && s.body_template.trim())

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1">Sequence Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. New Lead Follow-Up"
            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/60"
            aria-label="Sequence name"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Auto-trigger</label>
          <select
            value={triggerEvent}
            onChange={e => setTriggerEvent(e.target.value)}
            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4A017]/60"
            aria-label="Trigger event"
          >
            {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Short description for your reference"
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/60"
          aria-label="Sequence description"
        />
      </div>

      {/* Template vars hint */}
      <div>
        <button
          type="button"
          onClick={() => setShowVars(v => !v)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70"
        >
          {showVars ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Available template variables
        </button>
        {showVars && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TEMPLATE_VARS.map(v => (
              <code key={v} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[11px] text-[#D4A017]/80 font-mono">{v}</code>
            ))}
          </div>
        )}
      </div>

      {/* Steps */}
      <div>
        <label className="block text-xs text-white/50 mb-2">Email Steps <span className="text-red-400">*</span></label>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <StepEditor
              key={i}
              step={step}
              index={i}
              total={steps.length}
              onChange={s => updateStep(i, s)}
              onRemove={() => removeStep(i)}
            />
          ))}
        </div>
        {steps.length < 20 && (
          <button
            type="button"
            onClick={addStep}
            className="mt-3 flex items-center gap-2 text-sm text-white/50 hover:text-white px-3 py-2 border border-dashed border-white/20 rounded-lg hover:border-white/40 w-full justify-center"
          >
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave({ name: name.trim(), description: description.trim(), triggerEvent, steps })}
          disabled={saving || !valid}
          className="flex items-center gap-2 px-5 py-2 bg-[#D4A017] text-black font-semibold rounded-lg hover:bg-[#B8860B] disabled:opacity-50 text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Sequence'}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/20"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SequencesPage() {
  const [sequences, setSequences] = useState<DripSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchSequences = useCallback(async () => {
    try {
      const res = await fetch('/api/leads/sequences?include_steps=true')
      if (res.ok) {
        const data = await res.json()
        setSequences(data.sequences || [])
      } else {
        setError('Failed to load sequences')
      }
    } catch {
      setError('Failed to load sequences')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSequences() }, [fetchSequences])

  async function handleCreate(data: { name: string; description: string; triggerEvent: string; steps: DripStep[] }) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/leads/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description || null, triggerEvent: data.triggerEvent, steps: data.steps }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to create sequence')
        return
      }
      setShowCreate(false)
      await fetchSequences()
    } catch {
      setError('Failed to create sequence')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(id: string, data: { name: string; description: string; triggerEvent: string; steps: DripStep[] }) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/leads/sequences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: data.name, description: data.description || null, triggerEvent: data.triggerEvent, steps: data.steps }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to update sequence')
        return
      }
      setEditingId(null)
      await fetchSequences()
    } catch {
      setError('Failed to update sequence')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(seq: DripSequence) {
    try {
      await fetch('/api/leads/sequences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seq.id, is_active: !seq.is_active }),
      })
      setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, is_active: !s.is_active } : s))
    } catch {
      setError('Failed to update sequence')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this sequence? Active enrollments will continue to completion, but no new leads can be enrolled.')) return
    try {
      const res = await fetch('/api/leads/sequences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to delete')
        return
      }
      setSequences(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Failed to delete sequence')
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/dashboard/leads" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Mail className="w-7 h-7 text-[#D4A017]" />
            <div>
              <h1 className="text-2xl font-bold">Email Drip Sequences</h1>
              <p className="text-white/50 text-sm mt-0.5">Automated follow-up sequences enrolled per lead</p>
            </div>
          </div>
          <button
            onClick={() => { setShowCreate(v => !v); setEditingId(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black font-semibold rounded-lg hover:bg-[#B8860B] text-sm"
          >
            <Plus className="w-4 h-4" /> New Sequence
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="bg-[#1A1A1A] border border-[#D4A017]/40 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">New Sequence</h2>
            <SequenceForm
              onSave={handleCreate}
              onCancel={() => setShowCreate(false)}
              saving={saving}
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-white/40 text-sm py-12 text-center">Loading sequences…</div>
        ) : sequences.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-12 text-center">
            <Mail className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No sequences yet. Create one to start automating lead follow-up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sequences.map(seq => (
              <div
                key={seq.id}
                className={`bg-[#1A1A1A] border rounded-xl overflow-hidden transition-colors ${seq.is_active ? 'border-white/10' : 'border-white/5 opacity-60'}`}
              >
                {editingId === seq.id ? (
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-white/60 mb-4">Editing: {seq.name}</h3>
                    <SequenceForm
                      initial={seq}
                      onSave={data => handleEdit(seq.id, data)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  </div>
                ) : (
                  <>
                    {/* Row */}
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${seq.is_active ? 'bg-green-400' : 'bg-white/20'}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{seq.name}</p>
                          {seq.is_system && (
                            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/40">system</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-white/40">{TRIGGER_LABELS[seq.trigger_event] ?? seq.trigger_event}</span>
                          <span className="text-xs text-white/30">·</span>
                          <span className="text-xs text-white/40">{seq.steps.length} step{seq.steps.length !== 1 ? 's' : ''}</span>
                          {seq.active_enrollments > 0 && (
                            <>
                              <span className="text-xs text-white/30">·</span>
                              <span className="flex items-center gap-1 text-xs text-green-400/70">
                                <Users className="w-3 h-3" /> {seq.active_enrollments} active
                              </span>
                            </>
                          )}
                        </div>
                        {seq.description && <p className="text-xs text-white/30 mt-0.5 truncate">{seq.description}</p>}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Expand steps */}
                        <button
                          onClick={() => setExpandedId(expandedId === seq.id ? null : seq.id)}
                          className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
                          aria-label="Toggle steps"
                        >
                          {expandedId === seq.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {/* Edit */}
                        {!seq.is_system && (
                          <button
                            onClick={() => { setEditingId(seq.id); setShowCreate(false) }}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
                            aria-label="Edit sequence"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Toggle active */}
                        {!seq.is_system && (
                          <button
                            onClick={() => handleToggle(seq)}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
                            aria-label={seq.is_active ? 'Disable sequence' : 'Enable sequence'}
                          >
                            {seq.is_active
                              ? <ToggleRight className="w-5 h-5 text-green-400" />
                              : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        )}
                        {/* Delete */}
                        {!seq.is_system && (
                          <button
                            onClick={() => handleDelete(seq.id)}
                            className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
                            aria-label="Delete sequence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded steps summary */}
                    {expandedId === seq.id && seq.steps.length > 0 && (
                      <div className="border-t border-white/10 px-4 py-3 bg-black/20 space-y-2">
                        {seq.steps.map(step => (
                          <div key={step.step_number} className="flex items-start gap-3 text-xs">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-mono">
                              {step.step_number}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/70 truncate">{step.subject_template || '(no subject)'}</p>
                              <p className="text-white/30 mt-0.5">Day {step.delay_days}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info callout */}
        <div className="mt-8 bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-2">How drip sequences work</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            Enroll a lead from the Leads page — that schedules all emails in the sequence based on their delay days.
            Use template variables like <code className="text-[#D4A017]">{'{{name}}'}</code> and <code className="text-[#D4A017]">{'{{agent_name}}'}</code> for personalization.
            System sequences are read-only; create your own to customize the messaging.
          </p>
        </div>
      </main>
    </div>
  )
}
