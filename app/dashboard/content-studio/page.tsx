import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, Calendar, BarChart3, Zap, FolderOpen, 
  Mail, Globe, Palette, Image, Video, Home, ChevronRight,
  Instagram, Facebook, Linkedin, Crown, ImageIcon
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const CONTENT_TOOLS = [
  { name: 'Content Library', desc: 'Saved posts', href: '/dashboard/content-studio/library', icon: FolderOpen },
  { name: 'Email Marketing', desc: 'Campaigns', href: '/dashboard/content-studio/email', icon: Mail },
  { name: 'Property Sites', desc: 'Landing pages', href: '/dashboard/content-studio/sites', icon: Globe },
  { name: 'Analytics', desc: 'Performance', href: '/dashboard/content-studio/analytics', icon: BarChart3 },
]

const CUSTOMIZATION = [
  { name: 'Templates', desc: 'Colors & fonts', href: '/dashboard/content-studio/customize', icon: Palette },
  { name: 'Watermark', desc: 'Brand images', href: '/dashboard/settings/watermark', icon: Image },
  { name: 'Auto-Post', desc: 'Automation', href: '/dashboard/content-studio/auto-post', icon: Zap },
]

export default async function ContentStudio() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  const { data: listings } = await supabase
    .from('listings')
    .select('*, photos(id, raw_url, processed_url, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const listingsWithPhotos = await Promise.all(
    (listings || []).map(async (listing: any) => {
      const photos = listing.photos || []
      const enhancedPhotos = photos.filter((p: any) => p.status === 'completed' && p.processed_url)
      
      let thumbnailUrl = null
      const firstPhoto = enhancedPhotos[0] || photos[0]
      if (firstPhoto) {
        const photoPath = firstPhoto.processed_url || firstPhoto.raw_url
        if (photoPath && !photoPath.startsWith('http')) {
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(photoPath, 3600)
          thumbnailUrl = data?.signedUrl
        } else {
          thumbnailUrl = photoPath
        }
      }
      
      return {
        id: listing.id,
        title: listing.title,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        price: listing.price,
        photoCount: photos.length,
        enhancedCount: enhancedPhotos.length,
        thumbnail: thumbnailUrl
      }
    })
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Compact Header */}
      <header className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              Content Studio
            </h1>
            <p className="text-white/50 text-xs">Create social media content for your listings</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"><Instagram className="w-4 h-4 text-white" /></div>
            <div className="p-1.5 rounded-lg bg-blue-600"><Facebook className="w-4 h-4 text-white" /></div>
            <div className="p-1.5 rounded-lg bg-blue-700"><Linkedin className="w-4 h-4 text-white" /></div>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto space-y-4">
        {/* Quick Actions Row */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/dashboard/content-studio/calendar">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30 hover:border-blue-500/50 transition-all flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="font-semibold text-sm">Content Calendar</h3>
                <p className="text-white/50 text-xs">Schedule posts</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/content-studio/bulk">
            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center gap-3">
              <Zap className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="font-semibold text-sm">Bulk Creator</h3>
                <p className="text-white/50 text-xs">Multiple listings</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/content-studio/video">
            <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/30 hover:border-pink-500/50 transition-all flex items-center gap-3">
              <Video className="w-6 h-6 text-pink-400" />
              <div>
                <h3 className="font-semibold text-sm">Video Creator</h3>
                <p className="text-white/50 text-xs">Reels & TikTok</p>
              </div>
            </div>
          </Link>
        </div>

        {/* SELECT A LISTING */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#D4AF37]" />
              Select a Listing to Create Content
            </h2>
            <Link href="/dashboard" className="text-xs text-[#D4AF37] hover:underline">View All →</Link>
          </div>
          
          {listingsWithPhotos.length === 0 ? (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
              <Home className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <h3 className="font-medium mb-1">No Listings Yet</h3>
              <p className="text-white/50 text-xs mb-3">Create a listing first</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37] text-black rounded-lg text-sm font-medium">
                <ImageIcon className="w-3 h-3" /> Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {listingsWithPhotos.map(listing => (
                <Link key={listing.id} href={`/dashboard/content-studio/create-all?listing=${listing.id}`}>
                  <div className="bg-white/5 rounded-lg border border-white/10 hover:border-[#D4AF37]/50 transition-all group overflow-hidden">
                    <div className="aspect-[4/3] bg-black/40 relative">
                      {listing.thumbnail ? (
                        <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                        <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded">{listing.photoCount} photos</span>
                        {listing.enhancedCount > 0 && (
                          <span className="text-[10px] bg-green-500/80 px-1.5 py-0.5 rounded">{listing.enhancedCount} enhanced</span>
                        )}
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="text-xs font-medium truncate group-hover:text-[#D4AF37] transition-colors">
                        {listing.title || listing.address || 'Untitled'}
                      </h3>
                      <p className="text-white/40 text-[10px] truncate">
                        {listing.city}{listing.city && listing.state ? ', ' : ''}{listing.state}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Content Management + Customization - Side by Side */}
        <div className="grid md:grid-cols-2 gap-4">
          <section>
            <h2 className="text-sm font-bold mb-2">Content Management</h2>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TOOLS.map(tool => (
                <Link key={tool.name} href={tool.href}>
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-white/20 transition flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <tool.icon className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-medium truncate">{tool.name}</h3>
                      <p className="text-white/40 text-[10px] truncate">{tool.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold mb-2">Customization & Automation</h2>
            <div className="grid grid-cols-3 gap-2">
              {CUSTOMIZATION.map(tool => (
                <Link key={tool.name} href={tool.href}>
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-white/20 transition text-center">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-1">
                      <tool.icon className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <h3 className="text-xs font-medium truncate">{tool.name}</h3>
                    <p className="text-white/40 text-[10px] truncate">{tool.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
