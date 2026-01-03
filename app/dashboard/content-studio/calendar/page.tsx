'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Instagram, Facebook, Linkedin, Video, Clock, Trash2, Edit2, X,
  Home, Loader2, Check
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
  status: 'scheduled' | 'published' | 'failed'
  thumbnail?: string
}

interface Listing {
  id: string
  title: string
  thumbnail: string | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)

  // Form state
  const [formListing, setFormListing] = useState('')
  const [formPlatform, setFormPlatform] = useState('instagram')
  const [formPostType, setFormPostType] = useState('just-listed')
  const [formTime, setFormTime] = useState('09:00')
  const [formCaption, setFormCaption] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, title, address, photos!photos_listing_id_fkey(raw_url, processed_url, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (listingsData) {
        const processed = await Promise.all(
          listingsData.map(async (listing: any) => {
            const photos = listing.photos || []
            const firstPhoto = photos.find((p: any) => p.processed_url) || photos[0]
            let thumbnail = null
            if (firstPhoto) {
              const path = firstPhoto.processed_url || firstPhoto.raw_url
              if (path && !path.startsWith('http')) {
                const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
                thumbnail = data?.signedUrl
              } else {
                thumbnail = path
              }
            }
            return {
              id: listing.id,
              title: listing.title || listing.address || 'Untitled',
              thumbnail
            }
          })
        )
        setListings(processed)
        if (processed.length > 0) setFormListing(processed[0].id)
      }

      // Load scheduled posts (using localStorage for demo)
      const savedPosts = localStorage.getItem('snapr_scheduled_posts')
      if (savedPosts) {
        setScheduledPosts(JSON.parse(savedPosts))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
    
    setLoading(false)
  }

  const savePosts = (posts: ScheduledPost[]) => {
    localStorage.setItem('snapr_scheduled_posts', JSON.stringify(posts))
    setScheduledPosts(posts)
  }

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

    const listing = listings.find(l => l.id === formListing)
    const newPost: ScheduledPost = {
      id: editingPost?.id || `post_${Date.now()}`,
      listing_id: formListing,
      listing_title: listing?.title || 'Untitled',
      platform: formPlatform,
      post_type: formPostType,
      scheduled_date: selectedDate.toISOString().split('T')[0],
      scheduled_time: formTime,
      caption: formCaption,
      status: 'scheduled',
      thumbnail: listing?.thumbnail || undefined
    }

    let updatedPosts: ScheduledPost[]
    if (editingPost) {
      updatedPosts = scheduledPosts.map(p => p.id === editingPost.id ? newPost : p)
    } else {
      updatedPosts = [...scheduledPosts, newPost]
    }

    savePosts(updatedPosts)
    setSaving(false)
    closeModal()
  }

  const handleDelete = (postId: string) => {
    if (confirm('Delete this scheduled post?')) {
      const updatedPosts = scheduledPosts.filter(p => p.id !== postId)
      savePosts(updatedPosts)
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

  const postTypeColors: Record<string, string> = {
    'just-listed': '#D4AF37',
    'open-house': '#22C55E',
    'price-reduced': '#EF4444',
    'just-sold': '#8B5CF6'
  }

  const days = getDaysInMonth(currentDate)

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
                
                return (
                  <div
                    key={i}
                    className={`min-h-[120px] border-b border-r border-white/5 p-2 ${
                      date ? 'hover:bg-white/5 cursor-pointer' : 'bg-white/[0.02]'
                    } ${today ? 'bg-[#D4AF37]/10' : ''}`}
                    onClick={() => date && openScheduleModal(date)}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-2 ${today ? 'text-[#D4AF37]' : 'text-white/70'}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {posts.slice(0, 3).map(post => {
                            const Icon = platformIcons[post.platform] || Instagram
                            return (
                              <div
                                key={post.id}
                                onClick={(e) => { e.stopPropagation(); openScheduleModal(date, post) }}
                                className="flex items-center gap-1.5 p-1.5 rounded-lg text-xs truncate"
                                style={{ backgroundColor: postTypeColors[post.post_type] + '30' }}
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center ${platformColors[post.platform]}`}>
                                  <Icon className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="truncate">{post.listing_title}</span>
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
            {scheduledPosts.filter(p => new Date(p.scheduled_date) >= new Date()).length === 0 ? (
              <div className="bg-[#111] rounded-xl border border-white/5 p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40">No upcoming posts scheduled</p>
                <p className="text-white/30 text-sm mt-1">Click on any date to schedule a post</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledPosts
                  .filter(p => new Date(p.scheduled_date) >= new Date())
                  .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                  .slice(0, 6)
                  .map(post => {
                    const Icon = platformIcons[post.platform] || Instagram
                    return (
                      <div key={post.id} className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center gap-3 p-3 border-b border-white/5">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                              <Home className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{post.listing_title}</p>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <Clock className="w-3 h-3" />
                              {new Date(post.scheduled_date).toLocaleDateString()} at {post.scheduled_time}
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${platformColors[post.platform]}`}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span 
                              className="text-xs px-2 py-0.5 rounded capitalize"
                              style={{ backgroundColor: postTypeColors[post.post_type] + '30', color: postTypeColors[post.post_type] }}
                            >
                              {post.post_type.replace('-', ' ')}
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
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Post Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'just-listed', label: '🏠 Just Listed' },
                    { id: 'open-house', label: '🚪 Open House' },
                    { id: 'price-reduced', label: '💰 Price Reduced' },
                    { id: 'just-sold', label: '🎉 Just Sold' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFormPostType(type.id)}
                      className={`py-2 px-3 rounded-lg text-sm transition-all ${
                        formPostType === type.id
                          ? 'text-white'
                          : 'bg-white/5 text-white/60'
                      }`}
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
                <label className="block text-sm font-medium mb-2">Caption (optional)</label>
                <textarea
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  rows={3}
                  placeholder="Add your caption here..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-white/5">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formListing}
                className="flex-1 py-3 bg-[#D4AF37] text-black rounded-xl font-semibold hover:bg-[#B8860B] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingPost ? 'Update' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}