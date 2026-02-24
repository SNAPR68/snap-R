'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Trash2,
  Edit3,
  Plus,
  Loader2,
  Search,
  ArrowLeft,
  Copy,
  Instagram,
  Facebook,
  Linkedin,
  Clock,
  Music,
  ExternalLink,
  ChevronUp,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Draft {
  id: string
  listing_id: string | null
  name: string | null
  platform: string
  post_type: string
  template_id: string | null
  caption: string | null
  hashtags: string | null
  property_data: Record<string, unknown> | null
  brand_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface EditFormState {
  name: string
  platform: string
  post_type: string
  caption: string
  hashtags: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORMS = [
  { id: 'all', label: 'All' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
] as const

const PLATFORM_BADGE_STYLES: Record<string, string> = {
  facebook: 'bg-blue-500/20 text-blue-400',
  instagram: 'bg-pink-500/20 text-pink-400',
  linkedin: 'bg-sky-500/20 text-sky-400',
  tiktok: 'bg-fuchsia-500/20 text-fuchsia-400',
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music,
}

const POST_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'just_listed', label: 'Just Listed' },
  { value: 'open_house', label: 'Open House' },
  { value: 'price_drop', label: 'Price Drop' },
  { value: 'sold', label: 'Sold' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'tips', label: 'Tips' },
  { value: 'testimonial', label: 'Testimonial' },
] as const

const POST_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  POST_TYPES.map((pt) => [pt.value, pt.label])
)

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PostDraftsPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Auth + data fetching
  // -------------------------------------------------------------------------

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/drafts', {
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('Failed to fetch drafts')
      const data: { drafts: Draft[] } = await res.json()
      setDrafts(data.drafts)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error fetching drafts:', message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/content-studio/drafts')
        return
      }
      fetchDrafts()
    }
    checkAuthAndFetch()
  }, [router, fetchDrafts])

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleDelete = async (draftId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return

    setDeleting(draftId)
    try {
      const res = await fetch('/api/drafts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draftId }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('Failed to delete draft')
      setDrafts((prev) => prev.filter((d) => d.id !== draftId))
      if (expandedDraftId === draftId) {
        setExpandedDraftId(null)
        setEditForm(null)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error deleting draft:', message)
    } finally {
      setDeleting(null)
    }
  }

  const handleDuplicate = async (draft: Draft) => {
    setDuplicating(draft.id)
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: draft.listing_id ?? undefined,
          name: `${draft.name ?? 'Draft'} (Copy)`,
          platform: draft.platform,
          postType: draft.post_type,
          templateId: draft.template_id ?? undefined,
          caption: draft.caption ?? undefined,
          hashtags: draft.hashtags ?? undefined,
          propertyData: draft.property_data ?? undefined,
          brandData: draft.brand_data ?? undefined,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('Failed to duplicate draft')
      const data: { draft: Draft } = await res.json()
      setDrafts((prev) => [data.draft, ...prev])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error duplicating draft:', message)
    } finally {
      setDuplicating(null)
    }
  }

  const handleEditToggle = (draft: Draft) => {
    if (expandedDraftId === draft.id) {
      setExpandedDraftId(null)
      setEditForm(null)
    } else {
      setExpandedDraftId(draft.id)
      setEditForm({
        name: draft.name ?? '',
        platform: draft.platform,
        post_type: draft.post_type,
        caption: draft.caption ?? '',
        hashtags: draft.hashtags ?? '',
      })
    }
  }

  const handleSaveEdit = async (draftId: string) => {
    if (!editForm) return

    setSaving(true)
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          name: editForm.name || undefined,
          platform: editForm.platform,
          postType: editForm.post_type,
          caption: editForm.caption || undefined,
          hashtags: editForm.hashtags || undefined,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('Failed to save draft')
      const data: { draft: Draft } = await res.json()
      setDrafts((prev) =>
        prev.map((d) => (d.id === draftId ? data.draft : d))
      )
      setExpandedDraftId(null)
      setEditForm(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error saving draft:', message)
    } finally {
      setSaving(false)
    }
  }

  const handleNewDraft = async () => {
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Draft - ${new Date().toLocaleDateString()}`,
          platform: 'facebook',
          postType: 'announcement',
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('Failed to create draft')
      const data: { draft: Draft } = await res.json()
      setDrafts((prev) => [data.draft, ...prev])
      setExpandedDraftId(data.draft.id)
      setEditForm({
        name: data.draft.name ?? '',
        platform: data.draft.platform,
        post_type: data.draft.post_type,
        caption: data.draft.caption ?? '',
        hashtags: data.draft.hashtags ?? '',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error creating draft:', message)
    }
  }

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  const filteredDrafts = drafts.filter((draft) => {
    const matchesPlatform =
      platformFilter === 'all' || draft.platform === platformFilter

    const query = searchQuery.toLowerCase()
    const matchesSearch =
      !query ||
      (draft.name ?? '').toLowerCase().includes(query) ||
      (draft.caption ?? '').toLowerCase().includes(query)

    return matchesPlatform && matchesSearch
  })

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D4A017]" />
              Post Drafts
            </h1>
          </div>
          <Button
            onClick={handleNewDraft}
            className="bg-[#D4A017] hover:bg-[#B8960C] text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Draft
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Search + Platform Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drafts by name or caption..."
              aria-label="Search drafts"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4A017]/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatformFilter(p.id)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  platformFilter === p.id
                    ? 'bg-[#D4A017] text-black font-medium'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h2 className="text-xl font-bold mb-2">
              {drafts.length === 0
                ? 'No Drafts Yet'
                : 'No Drafts Match Your Filters'}
            </h2>
            <p className="text-white/50 mb-6">
              {drafts.length === 0
                ? 'Create your first post draft to start crafting content'
                : 'Try adjusting your search or platform filter'}
            </p>
            {drafts.length === 0 && (
              <Button
                onClick={handleNewDraft}
                className="bg-[#D4A017] hover:bg-[#B8960C] text-black font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Draft
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrafts.map((draft) => {
              const isExpanded = expandedDraftId === draft.id
              const PlatformIcon =
                PLATFORM_ICONS[draft.platform] ?? FileText
              const badgeStyle =
                PLATFORM_BADGE_STYLES[draft.platform] ??
                'bg-white/10 text-white/60'
              const postTypeLabel =
                POST_TYPE_LABELS[draft.post_type] ?? draft.post_type

              return (
                <div
                  key={draft.id}
                  className={`bg-[#1A1A1A] border rounded-xl transition-all ${
                    isExpanded
                      ? 'border-[#D4A017]/50 col-span-1 md:col-span-2 lg:col-span-3'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <PlatformIcon className="w-4 h-4 text-white/50 flex-shrink-0" />
                        <h3 className="font-medium truncate">
                          {draft.name ?? 'Untitled Draft'}
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 capitalize ${badgeStyle}`}
                      >
                        {draft.platform}
                      </span>
                    </div>

                    {/* Post Type */}
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 rounded bg-white/5 text-white/60 text-xs">
                        {postTypeLabel}
                      </span>
                    </div>

                    {/* Caption Preview */}
                    {draft.caption && (
                      <p className="text-sm text-white/60 mb-2 leading-relaxed">
                        {truncate(draft.caption, 120)}
                      </p>
                    )}

                    {/* Hashtags Preview */}
                    {draft.hashtags && (
                      <p className="text-xs text-[#D4A017]/70 mb-3 truncate">
                        {truncate(draft.hashtags, 80)}
                      </p>
                    )}

                    {/* Footer: timestamp + actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(draft.updated_at)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditToggle(draft)}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition"
                          title={isExpanded ? 'Close editor' : 'Edit draft'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-white/60" />
                          ) : (
                            <Edit3 className="w-3.5 h-3.5 text-white/60" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDuplicate(draft)}
                          disabled={duplicating === draft.id}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
                          title="Duplicate draft"
                        >
                          {duplicating === draft.id ? (
                            <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-white/60" />
                          )}
                        </button>
                        <Link
                          href={`/dashboard/content-studio?draftId=${draft.id}`}
                          className="p-1.5 rounded bg-white/5 hover:bg-[#D4A017]/20 transition"
                          title="Use in Content Studio"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#D4A017]" />
                        </Link>
                        <button
                          onClick={() => handleDelete(draft.id)}
                          disabled={deleting === draft.id}
                          className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 transition disabled:opacity-50"
                          title="Delete draft"
                        >
                          {deleting === draft.id ? (
                            <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Edit Form */}
                  {isExpanded && editForm && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm text-white/60 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          aria-label="Draft name"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4A017]/50"
                          placeholder="Draft name"
                        />
                      </div>

                      {/* Platform + Post Type row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/60 mb-1">
                            Platform
                          </label>
                          <select
                            value={editForm.platform}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                platform: e.target.value,
                              })
                            }
                            aria-label="Platform"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#D4A017]/50"
                          >
                            {PLATFORM_OPTIONS.map((p) => (
                              <option
                                key={p.value}
                                value={p.value}
                                className="bg-[#1A1A1A]"
                              >
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-white/60 mb-1">
                            Post Type
                          </label>
                          <select
                            value={editForm.post_type}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                post_type: e.target.value,
                              })
                            }
                            aria-label="Post type"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#D4A017]/50"
                          >
                            {POST_TYPES.map((pt) => (
                              <option
                                key={pt.value}
                                value={pt.value}
                                className="bg-[#1A1A1A]"
                              >
                                {pt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Caption */}
                      <div>
                        <label className="block text-sm text-white/60 mb-1">
                          Caption
                        </label>
                        <textarea
                          value={editForm.caption}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              caption: e.target.value,
                            })
                          }
                          aria-label="Caption"
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4A017]/50 resize-none"
                          placeholder="Write your post caption..."
                        />
                      </div>

                      {/* Hashtags */}
                      <div>
                        <label className="block text-sm text-white/60 mb-1">
                          Hashtags
                        </label>
                        <textarea
                          value={editForm.hashtags}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              hashtags: e.target.value,
                            })
                          }
                          aria-label="Hashtags"
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4A017]/50 resize-none"
                          placeholder="#realestate #luxuryhomes #justlisted"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-1">
                        <Button
                          onClick={() => {
                            setExpandedDraftId(null)
                            setEditForm(null)
                          }}
                          variant="outline"
                          className="flex-1 border-white/20 text-white/60 hover:text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveEdit(draft.id)}
                          disabled={saving}
                          className="flex-1 bg-[#D4A017] hover:bg-[#B8960C] text-black font-bold"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
