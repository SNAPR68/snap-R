import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canUseContentStudio, getRemainingCaptions, getRemainingPosts } from '@/lib/content/limits'
import { UpgradePrompt } from '@/components/content-studio/upgrade-prompt'
import { Sparkles, Instagram, Facebook, Linkedin, FileText, Hash, ArrowRight, Palette, Video, Image, ArrowLeft, Home, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ContentStudioPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, ai_captions_used, content_posts_used')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan || 'free'
  
  if (!canUseContentStudio(plan)) {
    return <UpgradePrompt feature="Content Studio" currentPlan={plan} requiredPlan="Starter" />
  }

  const captionsRemaining = getRemainingCaptions(plan, profile?.ai_captions_used || 0)
  const postsRemaining = getRemainingPosts(plan, profile?.content_posts_used || 0)

  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('id, business_name')
    .eq('user_id', user.id)
    .single()

  const hasBrandProfile = !!brandProfile?.business_name

  // Fetch user's listings - only basic columns that definitely exist
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id, title, address, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  console.log('Content Studio - Listings:', listings?.length || 0, 'found')
  if (listingsError) console.log('Content Studio - Error:', listingsError)

  // Get photos for each listing
  const listingsWithPhotos = await Promise.all(
    (listings || []).map(async (listing) => {
      const { data: photos } = await supabase
        .from('photos')
        .select('id, processed_url, raw_url')
        .eq('listing_id', listing.id)

      const enhancedPhotos = photos?.filter((p) => p.processed_url) || []
      let thumbnailUrl = null
      
      const firstPhoto = enhancedPhotos[0] || photos?.[0]
      if (firstPhoto) {
        const photoPath = firstPhoto.processed_url || firstPhoto.raw_url
        if (photoPath && !photoPath.startsWith('http')) {
          const { data } = await supabase.storage
            .from('raw-images')
            .createSignedUrl(photoPath, 3600)
          thumbnailUrl = data?.signedUrl
        } else {
          thumbnailUrl = photoPath
        }
      }

      return {
        ...listing,
        thumbnailUrl,
        enhancedCount: enhancedPhotos.length,
        totalPhotos: photos?.length || 0
      }
    })
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-2xl font-bold">Content Studio</h1>
          </div>
          <p className="text-white/60">
            Select a listing to create social media content with auto-filled details
          </p>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <p className="text-white/60 text-sm mb-1">AI Generations</p>
            <p className="text-2xl font-bold text-white">
              {captionsRemaining === 'unlimited' ? '∞' : captionsRemaining}
              <span className="text-lg text-white/40 font-normal"> remaining</span>
            </p>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <p className="text-white/60 text-sm mb-1">Content Posts</p>
            <p className="text-2xl font-bold text-white">
              {postsRemaining === 'unlimited' ? '∞' : postsRemaining}
              <span className="text-lg text-white/40 font-normal"> remaining</span>
            </p>
          </div>
        </div>

        {/* Brand Profile Prompt */}
        {!hasBrandProfile && (
          <Link href="/dashboard/brand">
            <div className="mb-8 bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/30 p-4 flex items-center justify-between hover:border-[#D4AF37]/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-white font-medium">Set up your Brand Profile</p>
                  <p className="text-white/60 text-sm">Add your logo and colors for auto-branded content</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </Link>
        )}

        {/* Select Listing Section */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-[#D4AF37]" />
            Select a Listing
          </h2>
          
          {listingsWithPhotos && listingsWithPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listingsWithPhotos.map((listing) => (
                <Link 
                  key={listing.id} 
                  href={`/dashboard/content-studio/select?listing=${listing.id}`}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-[#D4AF37]/50 transition-all cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-white/5 relative overflow-hidden">
                    {listing.thumbnailUrl ? (
                      <img 
                        src={listing.thumbnailUrl} 
                        alt={listing.address || 'Listing'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    {listing.enhancedCount > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 rounded text-xs font-medium text-white">
                        {listing.enhancedCount} enhanced
                      </div>
                    )}
                    {listing.totalPhotos > 0 && listing.enhancedCount === 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 rounded text-xs font-medium text-white">
                        {listing.totalPhotos} photos
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white truncate group-hover:text-[#D4AF37] transition-colors">
                      {listing.title || listing.address || 'Untitled Listing'}
                    </h3>
                    {listing.address && listing.address !== listing.title && (
                      <p className="text-sm text-white/50 truncate">{listing.address}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-white/40">
                        {listing.totalPhotos} photos
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
              <Home className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-2">No listings yet</p>
              <p className="text-white/30 text-sm mb-4">Create a listing first to generate content</p>
              <Link 
                href="/listings/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Create Listing
              </Link>
            </div>
          )}
        </div>

        {/* AI Text Generation */}
        <h2 className="text-lg font-semibold text-white mb-4">AI Text Generation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/content-studio/create?type=social">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#D4AF37]/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1 group-hover:text-[#D4AF37] transition-colors">
                Social Captions
              </h3>
              <p className="text-white/60 text-sm">AI-powered captions for all platforms</p>
            </div>
          </Link>

          <Link href="/dashboard/content-studio/create?type=description">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#D4AF37]/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1 group-hover:text-[#D4AF37] transition-colors">
                Property Description
              </h3>
              <p className="text-white/60 text-sm">MLS listing, website, brochure</p>
            </div>
          </Link>

          <Link href="/dashboard/content-studio/create?type=hashtags">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#D4AF37]/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8960C] rounded-xl flex items-center justify-center mb-4">
                <Hash className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-white font-semibold mb-1 group-hover:text-[#D4AF37] transition-colors">
                Hashtag Generator
              </h3>
              <p className="text-white/60 text-sm">Platform-optimized hashtags</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
