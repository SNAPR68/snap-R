'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image';
import {
  ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
  Instagram, Facebook, Linkedin, Video, Clock, Trash2, Edit2, X,
  Home, Loader2, Check, CheckCircle, AlertCircle, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ScheduledPost {
  id: string
  listing_id: string
  listing_title: string
  platform: string
  post_type: string
  scheduled_date: string
  scheduled_time: string
  caption: string
  status: 'pending' | 'published' | 'failed' | 'cancelled'
  thumbnail?: string
  image_urls?: string[]
  source?: 'manual' | 'auto'
}

interface Listing {
  id: string
  title: string
  thumbnail: string | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface RawPost {
  id: string
  listing_id?: string
  listings?: { title?: string; address?: string }
  platform: string
  post_type?: string
  scheduled_for: string
  content?: string
  status: 'pending' | 'published' | 'failed' | 'cancelled'
  image_urls?: string[]
}

interface RawListingPhoto {
  raw_url: string | null
  processed_url: string | null
  status: string | null
}

interface RawListing {
  id: string
  title: string | null
  address: string | null
  photos: RawListingPhoto[]
}

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  // Form state
  const [formListing, setFormListing] = useState('')
  const [formPlatform, setFormPlatform] = useState('instagram')
  const [formPostType, setFormPostType] = useState('just_listed')
  const [formTime, setFormTime] = useState('09:00')
  const [formCaption, setFormCaption] = useState('')
  const [saving, setSaving] = useState(false)

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule?status=pending,published,failed')
      if (!res.ok) throw new Error('Failed to fetch posts')
      const { posts } = await res.json()
      const mapped: ScheduledPost[] = (posts || []).map((p: RawPost) => {
        const scheduledFor = new Date(p.scheduled_for)
        return {
          id: p.id,
          listing_id: p.listing_id || '',
          listing_title: p.listings?.title || p.listings?.address || 'Untitled',
          platform: p.platform,
          post_type: p.post_type || 'just_listed',
          scheduled_date: scheduledFor.toISOString().split('T')[0],
          scheduled_time: scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          caption: p.content || '',
          status: p.status,
          image_urls: p.image_urls,
          source: (p.post_type === 'just_listed' && p.content && p.content.length > 50) ? 'auto' : 'manual',
        }
      })
      setScheduledPosts(mapped)
    } catch (error: unknown) {
      console.error('Error loading scheduled posts:', error)
    }
  }, [])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, title, address, photos!photos_listing_id_fkey(raw_url, processed_url, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (listingsData) {
        const processed = await Promise.all(
          (listingsData as RawListing[]).map(async (listing) => {
            const photos = listing.photos || []
            const firstPhoto = photos.find((p) => p.processed_url) ?? photos[0]
            let thumbnail: string | null = null
            if (firstPhoto) {
              const path = firstPhoto.processed_url || firstPhoto.raw_url
              if (path && !path.startsWith('http')) {
                const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
                thumbnail = data?.signedUrl ?? null
              } else {
                thumbnail = path
              }
            }
            return { id: listing.id, title: listing.title || listing.address || 'Untitled', thumbnail }
          })
        )
        setListings(processed)
        if (processed.length > 0) setFormListing(processed[0].id)
      }

      await loadPosts()
    } catch (error: unknown) {
      console.error('Error loading data:', error)
    }
  }, [loadPosts])

  // Reschedule a post by drag-and-drop
  const reschedulePost = useCallback(async (postId: string, newDate: Date, oldTime: string) => {
    const [h, m] = oldTime.split(':').map(Number)
    const scheduled = new Date(newDate)
    scheduled.setHours(h, m, 0, 0)
    const scheduledFor = scheduled.toISOString()

    // Optimistic update
    setScheduledPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, scheduled_date: newDate.toISOString().split('T')[0] }
        : p
    ))

    try {
      await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, scheduledFor }),
      })
    } catch {
      await loadPosts()
    }
  }, [loadPosts])

  useEffect(() => { loadData() }, [loadData])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return scheduledPosts.filter(p => p.scheduled_date === dateStr)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const openScheduleModal = (date: Date, post?: ScheduledPost) => {
    setSelectedDate(date)
    if (post) {
      setEditingPost(post)
      setFormListing(post.listing_id)
      setFormPlatform(post.platform)
      setFormPostType(post.post_type)
      setFormTime(post.scheduled_time)
      setFormCaption(post.caption)
    } else {
      setEditingPost(null)
      setFormTime('09:00')
      setFormCaption('')
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPost(null)
    setSelectedDate(null)
  }

  const handleSave = async () => {
    if (!selectedDate || !formListing) return
    setSaving(true)

    try {
      // Build ISO timestamp from date + time
      const [hours, minutes] = formTime.split(':').map(Number)
      const scheduledFor = new Date(selectedDate)
      scheduledFor.setHours(hours, minutes, 0, 0)

      if (editingPost) {
        // Cancel old post and create new one (no PATCH endpoint)
        await fetch('/api/schedule', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPost.id }),
        })
      }

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: formListing,
          platform: formPlatform,
          postType: formPostType,
          content: formCaption,
          scheduledFor: scheduledFor.toISOString(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to schedule')
      }

      // Reload posts from DB
      await loadPosts()
    } catch (error: unknown) {
      console.error('Error saving post:', error)
    }

    setSaving(false)
    closeModal()
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Cancel this scheduled post?')) return

    try {
      const res = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
      })
      if (!res.ok) throw new Error('Failed to cancel')
      await loadPosts()
    } catch (error: unknown) {
      console.error('Error cancelling post:', error)
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const platformIcons: Record<string, React.ElementType> = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    tiktok: Video
  }

  const platformColors: Record<string, string> = {
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    facebook: 'bg-blue-600',
    linkedin: 'bg-blue-700',
    tiktok: 'bg-black'
  }

  const postTypeLabels: Record<string, string> = {
    'just_listed': 'Just Listed',
    'just-listed': 'Just Listed',
    'open_house': 'Open House',
    'open-house': 'Open House',
    'price_drop': 'Price Reduced',
    'price-reduced': 'Price Reduced',
    'sold': 'Just Sold',
    'just-sold': 'Just Sold',
    'custom': 'Custom',
  }

  const postTypeColors: Record<string, string> = {
    'just_listed': '#D4AF37',
    'just-listed': '#D4AF37',
    'open_house': '#22C55E',
    'open-house': '#22C55E',
    'price_drop': '#EF4444',
    'price-reduced': '#EF4444',
    'sold': '#8B5CF6',
    'just-sold': '#8B5CF6',
    'custom': '#6B7280',
  }

  const statusColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock },
    published: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
  }

  const days = getDaysInMonth(currentDate)

  // Stats
  const pendingCount = scheduledPosts.filter(p => p.status === 'pending').length
  const publishedCount = scheduledPosts.filter(p => p.status === 'published').length

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/content-studio" className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="w-4 h-4 text-white/50" />
            <span className="text-white/50 text-sm">Back</span>
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Content Calendar</span>
          </div>
          {/* Stats pills */}
          <div className="flex items-center gap-2 ml-4">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400">
                <Clock className="w-3 h-3" />
                {pendingCount} queued
              </span>
            )}
            {publishedCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                {publishedCount} published
              </span>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/content-studio"
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-semibold text-sm hover:bg-[#B8860B]"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </Link>
      </header>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold min-w-[200px] text-center">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-white/5">
              {DAYS.map(day => (
                <div key={day} className="py-3 text-center text-sm font-medium text-white/50">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {days.map((date, i) => {
                const posts = date ? getPostsForDate(date) : []
                const today = date ? isToday(date) : false
                const dateKey = date ? date.toISOString().split('T')[0] : null
                const isOver = dateKey !== null && dragOverDate === dateKey

                return (
                  <div
                    key={i}
                    className={`min-h-[120px] border-b border-r border-white/5 p-2 transition-colors ${
                      date ? 'hover:bg-white/5 cursor-pointer' : 'bg-white/[0.02]'
                    } ${today ? 'bg-[#D4AF37]/10' : ''} ${isOver ? 'bg-[#D4A017]/10 ring-1 ring-inset ring-[#D4A017]/40' : ''}`}
                    onClick={() => date && openScheduleModal(date)}
                    onDragOver={date ? (e) => { e.preventDefault(); setDragOverDate(dateKey) } : undefined}
                    onDragLeave={() => setDragOverDate(null)}
                    onDrop={date ? (e) => {
                      e.preventDefault()
                      setDragOverDate(null)
                      const postId = e.dataTransfer.getData('postId')
                      const oldTime = e.dataTransfer.getData('oldTime')
                      if (postId && draggingId === postId) reschedulePost(postId, date, oldTime)
                      setDraggingId(null)
                    } : undefined}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-2 ${today ? 'text-[#D4AF37]' : 'text-white/70'}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {posts.slice(0, 3).map(post => {
                            const Icon = platformIcons[post.platform] || Instagram
                            const isPublished = post.status === 'published'
                            const isFailed = post.status === 'failed'
                            const isDraggable = post.status === 'pending'
                            return (
                              <div
                                key={post.id}
                                draggable={isDraggable}
                                onDragStart={isDraggable ? (e) => {
                                  setDraggingId(post.id)
                                  e.dataTransfer.setData('postId', post.id)
                                  e.dataTransfer.setData('oldTime', post.scheduled_time)
                                  e.dataTransfer.effectAllowed = 'move'
                                } : undefined}
                                onDragEnd={() => { setDraggingId(null); setDragOverDate(null) }}
                                onClick={(e) => { e.stopPropagation(); openScheduleModal(date, post) }}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg text-xs truncate ${
                                  isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
                                } ${isPublished ? 'opacity-60' : isFailed ? 'opacity-50' : ''} ${draggingId === post.id ? 'opacity-30' : ''}`}
                                style={{ backgroundColor: (postTypeColors[post.post_type] || '#6B7280') + '30' }}
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${platformColors[post.platform] || 'bg-gray-600'}`}>
                                  <Icon className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="truncate">{post.listing_title}</span>
                                {isPublished && <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                                {isFailed && <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                              </div>
                            )
                          })}
                          {posts.length > 3 && (
                            <div className="text-xs text-white/40 pl-1">
                              +{posts.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming Posts */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">Upcoming Scheduled Posts</h3>
            {scheduledPosts.filter(p => p.status === 'pending').length === 0 ? (
              <div className="bg-[#111] rounded-xl border border-white/5 p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40">No upcoming posts scheduled</p>
                <p className="text-white/30 text-sm mt-1">Click on any date to schedule a post, or auto-generate via the marketing pipeline</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledPosts
                  .filter(p => p.status === 'pending')
                  .sort((a, b) => new Date(a.scheduled_date + 'T' + a.scheduled_time).getTime() - new Date(b.scheduled_date + 'T' + b.scheduled_time).getTime())
                  .slice(0, 6)
                  .map(post => {
                    const Icon = platformIcons[post.platform] || Instagram
                    const listing = listings.find(l => l.id === post.listing_id)
                    return (
                      <div key={post.id} className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center gap-3 p-3 border-b border-white/5">
                          {listing?.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <Image src={listing.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover" width={400} height={300} unoptimized />
                          ) : post.image_urls?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <Image src={post.image_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover" width={400} height={300} unoptimized />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                              <Home className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium truncate">{post.listing_title}</p>
                              {post.source === 'auto' && (
                                <span title="Auto-generated by marketing pipeline">
                                  <Sparkles className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <Clock className="w-3 h-3" />
                              {new Date(post.scheduled_date).toLocaleDateString()} at {post.scheduled_time}
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${platformColors[post.platform] || 'bg-gray-600'}`}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span
                              className="text-xs px-2 py-0.5 rounded capitalize"
                              style={{ backgroundColor: (postTypeColors[post.post_type] || '#6B7280') + '30', color: postTypeColors[post.post_type] || '#6B7280' }}
                            >
                              {postTypeLabels[post.post_type] || post.post_type?.replace(/[_-]/g, ' ')}
                            </span>
                          </div>
                          {post.caption && (
                            <p className="text-xs text-white/50 line-clamp-2">{post.caption}</p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => openScheduleModal(new Date(post.scheduled_date), post)}
                              className="flex-1 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 flex items-center justify-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="py-1.5 px-3 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Recently Published */}
          {scheduledPosts.filter(p => p.status === 'published').length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Recently Published</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledPosts
                  .filter(p => p.status === 'published')
                  .slice(0, 3)
                  .map(post => {
                    const Icon = platformIcons[post.platform] || Instagram
                    return (
                      <div key={post.id} className="bg-[#111] rounded-xl border border-emerald-500/10 overflow-hidden opacity-80">
                        <div className="flex items-center gap-3 p-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${platformColors[post.platform] || 'bg-gray-600'}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{post.listing_title}</p>
                            <div className="flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              Published
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl w-full max-w-lg border border-white/10">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-bold text-lg">
                {editingPost ? 'Edit Scheduled Post' : 'Schedule New Post'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Show status for existing posts */}
              {editingPost && editingPost.status !== 'pending' && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusColors[editingPost.status]?.bg || 'bg-white/5'}`}>
                  {(() => {
                    const StatusIcon = statusColors[editingPost.status]?.icon || Clock
                    return <StatusIcon className={`w-4 h-4 ${statusColors[editingPost.status]?.text || 'text-white/50'}`} />
                  })()}
                  <span className={`text-sm font-medium capitalize ${statusColors[editingPost.status]?.text || 'text-white/50'}`}>
                    {editingPost.status}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <div className="px-4 py-3 bg-white/5 rounded-xl text-white/70">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Listing</label>
                <select
                  value={formListing}
                  onChange={(e) => setFormListing(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500"
                  disabled={editingPost?.status === 'published'}
                >
                  {listings.map(l => (
                    <option key={l.id} value={l.id} className="bg-gray-900">{l.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500"
                    disabled={editingPost?.status === 'published'}
                  >
                    <option value="instagram" className="bg-gray-900">Instagram</option>
                    <option value="facebook" className="bg-gray-900">Facebook</option>
                    <option value="linkedin" className="bg-gray-900">LinkedIn</option>
                    <option value="tiktok" className="bg-gray-900">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500"
                    disabled={editingPost?.status === 'published'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Post Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'just_listed', label: '🏠 Just Listed' },
                    { id: 'open_house', label: '🚪 Open House' },
                    { id: 'price_drop', label: '💰 Price Reduced' },
                    { id: 'sold', label: '🎉 Just Sold' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFormPostType(type.id)}
                      disabled={editingPost?.status === 'published'}
                      className={`py-2 px-3 rounded-lg text-sm transition-all ${
                        formPostType === type.id
                          ? 'text-white'
                          : 'bg-white/5 text-white/60'
                      } ${editingPost?.status === 'published' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        backgroundColor: formPostType === type.id ? postTypeColors[type.id] : undefined
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Caption</label>
                <textarea
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  rows={3}
                  placeholder="Add your caption here..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                  readOnly={editingPost?.status === 'published'}
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-white/5">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20"
              >
                {editingPost?.status === 'published' ? 'Close' : 'Cancel'}
              </button>
              {editingPost?.status !== 'published' && (
                <button
                  onClick={handleSave}
                  disabled={saving || !formListing}
                  className="flex-1 py-3 bg-[#D4AF37] text-black rounded-xl font-semibold hover:bg-[#B8860B] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingPost ? 'Update' : 'Schedule'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
