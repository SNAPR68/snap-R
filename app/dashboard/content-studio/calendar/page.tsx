'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Instagram, Facebook, Linkedin, Video, Loader2, Trash2, Clock } from 'lucide-react'
import Link from 'next/link'

interface ScheduledPost {
  id: string
  platform: string
  post_type: string
  template_id: string
  caption: string
  hashtags: string
  scheduled_at: string
  status: string
  property_data: any
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: Video,
  story: Calendar,
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-purple-500 to-pink-500',
  facebook: 'from-blue-600 to-blue-400',
  linkedin: 'from-blue-700 to-blue-500',
  tiktok: 'from-gray-800 to-black',
  story: 'from-purple-600 to-orange-500',
}

export default function ContentCalendar() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { fetchPosts() }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/schedule?status=scheduled')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const cancelPost = async (id: string) => {
    setDeleting(id)
    try {
      await fetch('/api/schedule', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      setPosts(posts.filter(p => p.id !== id))
    } catch (e) { console.error(e) }
    finally { setDeleting(null) }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  const getPostsForDate = (date: Date) => posts.filter(p => new Date(p.scheduled_at).toDateString() === date.toDateString())
  const days = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-[#D4AF37]" />Content Calendar</h1>
          </div>
          <Link href="/dashboard/content-studio/create-all"><Button className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold">+ Create Post</Button></Link>
        </div>
      </header>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="text-white/60 hover:text-white"><ChevronLeft className="w-5 h-5" /></Button>
          <h2 className="text-2xl font-bold">{monthName}</h2>
          <Button variant="ghost" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="text-white/60 hover:text-white"><ChevronRight className="w-5 h-5" /></Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
        ) : (
          <>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-white/10">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-white/50">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const dayPosts = day ? getPostsForDate(day) : []
                  const isToday = day?.toDateString() === new Date().toDateString()
                  return (
                    <div key={i} className={`min-h-[120px] p-2 border-b border-r border-white/5 ${day ? '' : 'bg-white/[0.02]'} ${isToday ? 'bg-[#D4AF37]/10' : ''}`}>
                      {day && (
                        <>
                          <div className={`text-sm mb-1 ${isToday ? 'text-[#D4AF37] font-bold' : 'text-white/50'}`}>{day.getDate()}</div>
                          <div className="space-y-1">
                            {dayPosts.slice(0, 3).map(post => {
                              const Icon = PLATFORM_ICONS[post.platform] || Calendar
                              return (
                                <div key={post.id} className={`p-1.5 rounded text-xs bg-gradient-to-r ${PLATFORM_COLORS[post.platform]} flex items-center gap-1 group`}>
                                  <Icon className="w-3 h-3" /><span className="truncate flex-1">{post.post_type}</span>
                                  <button onClick={() => cancelPost(post.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/20 rounded">
                                    {deleting === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  </button>
                                </div>
                              )
                            })}
                            {dayPosts.length > 3 && <div className="text-[10px] text-white/40">+{dayPosts.length - 3} more</div>}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[#D4AF37]" />Upcoming Posts ({posts.length})</h3>
              {posts.length === 0 ? (
                <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
                  <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">No scheduled posts yet</p>
                  <Link href="/dashboard/content-studio/create-all"><Button className="mt-4 bg-[#D4AF37] hover:bg-[#B8960C] text-black">Create Your First Post</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map(post => {
                    const Icon = PLATFORM_ICONS[post.platform] || Calendar
                    const scheduledDate = new Date(post.scheduled_at)
                    return (
                      <div key={post.id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${PLATFORM_COLORS[post.platform]} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium capitalize">{post.post_type.replace('-', ' ')}</div>
                          <div className="text-sm text-white/50 truncate">{post.property_data?.address || 'No address'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                          <div className="text-xs text-white/50">{scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => cancelPost(post.id)} disabled={deleting === post.id} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          {deleting === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
