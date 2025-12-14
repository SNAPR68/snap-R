import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, PenTool, Calendar, BarChart3, Zap, FolderOpen, 
  Mail, Globe, Palette, Image, Video, Home, ChevronRight,
  Instagram, Facebook, Linkedin, ArrowRight, Crown, ImageIcon
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const CONTENT_TOOLS = [
  { name: 'Content Library', desc: 'Saved posts & templates', href: '/dashboard/content-studio/library', icon: FolderOpen },
  { name: 'Email Marketing', desc: 'Generate email campaigns', href: '/dashboard/content-studio/email', icon: Mail },
  { name: 'Property Websites', desc: 'Mini landing pages', href: '/dashboard/content-studio/sites', icon: Globe },
  { name: 'Post Analytics', desc: 'Track performance', href: '/dashboard/content-studio/analytics', icon: BarChart3 },
]

const CUSTOMIZATION = [
  { name: 'Template Customizer', desc: 'Colors, fonts & layouts', href: '/dashboard/content-studio/customize', icon: Palette },
  { name: 'Watermark Settings', desc: 'Brand your images', href: '/dashboard/settings/watermark', icon: Image },
  { name: 'Auto-Post Rules', desc: 'Automation triggers', href: '/dashboard/content-studio/auto-post', icon: Zap },
]

export default async function ContentStudio() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  // Fetch user's listings with photo counts
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, address, city, state, price, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get photo counts and first photo for each listing
  const listingsWithPhotos = await Promise.all(
    (listings || []).map(async (listing) => {
      const { data: photos } = await supabase
        .from('photos')
        .select('id, processed_url, raw_url, status')
        .eq('listing_id', listing.id)
      
      const enhancedPhotos = photos?.filter(p => p.status === 'completed' && p.processed_url) || []
      
      let thumbnailUrl = null
      const firstPhoto = enhancedPhotos[0] || photos?.[0]
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
        ...listing,
        photoCount: photos?.length || 0,
        enhancedCount: enhancedPhotos.length,
        thumbnail: thumbnailUrl
      }
    })
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              Content Studio
            </h1>
            <p className="text-white/50 text-sm mt-1">Create stunning social media content for your listings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"><Instagram className="w-5 h-5 text-white" /></div>
            <div className="p-2 rounded-lg bg-blue-600"><Facebook className="w-5 h-5 text-white" /></div>
            <div className="p-2 rounded-lg bg-blue-700"><Linkedin className="w-5 h-5 text-white" /></div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* SELECT A LISTING - Primary Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              Select a Listing to Create Content
            </h2>
            <Link href="/dashboard" className="text-sm text-[#D4AF37] hover:underline">View All Listings →</Link>
          </div>
          
          {listingsWithPhotos.length === 0 ? (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
              <Home className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No Listings Yet</h3>
              <p className="text-white/50 text-sm mb-4">Create a listing and enhance some photos first</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium">
                <ImageIcon className="w-4 h-4" /> Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listingsWithPhotos.map(listing => (
                <Link key={listing.id} href={`/dashboard/content-studio/create-all?listing=${listing.id}`}>
                  <div className="bg-white/5 rounded-xl border border-white/10 hover:border-[#D4AF37]/50 transition-all group overflow-hidden">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-black/40 relative">
                      {listing.thumbnail ? (
                        <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-xs bg-black/60 px-2 py-1 rounded">{listing.photoCount} photos</span>
                        {listing.enhancedCount > 0 && (
                          <span className="text-xs bg-green-500/80 px-2 py-1 rounded text-white">{listing.enhancedCount} enhanced</span>
                        )}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-medium truncate group-hover:text-[#D4AF37] transition-colors">
                        {listing.title || listing.address || 'Untitled Listing'}
                      </h3>
                      <p className="text-white/50 text-sm truncate">
                        {listing.city}{listing.city && listing.state ? ', ' : ''}{listing.state}
                        {listing.price && ` • $${listing.price.toLocaleString()}`}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/30">Click to create content</span>
                        <ChevronRight className="w-4 h-4 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid md:grid-cols-3 gap-4">
          <Link href="/dashboard/content-studio/calendar">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30 hover:border-blue-500/50 transition-all">
              <Calendar className="w-8 h-8 text-blue-400 mb-2" />
              <h3 className="font-bold">Content Calendar</h3>
              <p className="text-white/50 text-sm">Schedule & manage posts</p>
            </div>
          </Link>
          <Link href="/dashboard/content-studio/bulk">
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30 hover:border-purple-500/50 transition-all">
              <Zap className="w-8 h-8 text-purple-400 mb-2" />
              <h3 className="font-bold">Bulk Creator</h3>
              <p className="text-white/50 text-sm">Generate for multiple listings</p>
            </div>
          </Link>
          <Link href="/dashboard/content-studio/video">
            <div className="bg-gradient-to-br from-pink-500/20 to-rose-600/10 rounded-xl p-4 border border-pink-500/30 hover:border-pink-500/50 transition-all">
              <Video className="w-8 h-8 text-pink-400 mb-2" />
              <h3 className="font-bold">Video Creator</h3>
              <p className="text-white/50 text-sm">Slideshows for Reels & TikTok</p>
            </div>
          </Link>
        </section>

        {/* Content Management */}
        <section>
          <h2 className="text-lg font-bold mb-4">Content Management</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTENT_TOOLS.map(tool => (
              <Link key={tool.name} href={tool.href}>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <tool.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-medium">{tool.name}</h3>
                    <p className="text-white/40 text-xs">{tool.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Customization */}
        <section>
          <h2 className="text-lg font-bold mb-4">Customization & Automation</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {CUSTOMIZATION.map(tool => (
              <Link key={tool.name} href={tool.href}>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <tool.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-medium">{tool.name}</h3>
                    <p className="text-white/40 text-xs">{tool.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
