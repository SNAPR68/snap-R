import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Instagram, Facebook, Linkedin, Video, Image, Home, Check, Sparkles, FileText, MessageSquare, ChevronRight } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SelectPlatformPage({
  searchParams
}: {
  searchParams: Promise<{ listing?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const params = await searchParams
  const listingId = params.listing

  if (!listingId) redirect('/dashboard/content-studio')

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, title, address')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single()

  if (listingError || !listing) {
    redirect('/dashboard/content-studio')
  }

  const { data: photos } = await supabase
    .from('photos')
    .select('id, processed_url, raw_url')
    .eq('listing_id', listingId)

  // Fetch marketing job for this listing (wrapped in try/catch for resilience)
  let marketingJob: { id?: string; status?: string; description_result?: string | Record<string, unknown>; captions_result?: unknown; mls_result?: unknown } | null = null
  try {
    const { data } = await supabase
      .from('marketing_jobs')
      .select('*')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    marketingJob = data
  } catch { /* marketing_jobs query failed — degrade gracefully */ }

  const hasMarketingContent = marketingJob?.status === 'completed'
  const descriptionResult = hasMarketingContent ? marketingJob?.description_result : null
  const captionsResult = hasMarketingContent ? marketingJob?.captions_result : null
  const descriptionText = typeof descriptionResult === 'string'
    ? descriptionResult
    : (descriptionResult as Record<string, unknown>)?.description as string || ''
  const captionPlatforms = captionsResult && typeof captionsResult === 'object'
    ? Object.keys(captionsResult)
    : []

  const enhancedPhotos = photos?.filter((p) => p.processed_url) || []

  const photosWithUrls = await Promise.all(
    (photos || []).slice(0, 6).map(async (photo) => {
      const photoPath = photo.processed_url || photo.raw_url
      if (photoPath && !photoPath.startsWith('http')) {
        const { data } = await supabase.storage
          .from('raw-images')
          .createSignedUrl(photoPath, 3600)
        return data?.signedUrl || null
      }
      return photoPath
    })
  )
  const validPhotos = photosWithUrls.filter(Boolean)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/dashboard/content-studio" className="hover:text-white transition-colors">Content Studio</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">{listing.title || listing.address || 'Select Platform'}</span>
        </nav>

        {/* Selected Listing Card */}
        <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/30 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-20 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
              {validPhotos[0] ? (
                <NextImage src={validPhotos[0]} alt="" className="w-full h-full object-cover" width={96} height={80} unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-6 h-6 text-white/20" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">Listing Selected</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {listing.title || listing.address || 'Untitled Listing'}
              </h2>
              <p className="text-white/60 text-sm">{photos?.length || 0} photos • {enhancedPhotos.length} enhanced</p>
            </div>
          </div>
        </div>

        {/* Auto-Generated Marketing Content */}
        {hasMarketingContent && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-300">Auto-Generated Marketing Content</h3>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Ready to use</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Description */}
              {descriptionText && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/60">Description</span>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2">{descriptionText}</p>
                </div>
              )}

              {/* Captions */}
              {captionPlatforms.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/60">Social Captions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {captionPlatforms.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/50 capitalize">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick action: use auto-generated captions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/content-studio/create-all?listing=${listingId}&prefill=marketing`}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 font-medium transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Edit & Post with Auto Content
                <ChevronRight className="w-3 h-3" />
              </Link>
              <span className="text-xs text-white/30">or create from scratch below</span>
            </div>
          </div>
        )}

        {/* MAIN CTA - Create All Posts */}
        <Link href={`/dashboard/content-studio/create-all?listing=${listingId}`}>
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8960C] rounded-xl p-6 mb-8 hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-black/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">Create All Posts</h3>
                  <p className="text-black/70">Instagram, Facebook, LinkedIn, TikTok, Story — all in one place</p>
                </div>
              </div>
              <div className="text-black font-bold text-2xl group-hover:translate-x-2 transition-transform">
                →
              </div>
            </div>
          </div>
        </Link>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-white/40 text-sm">or choose a single platform</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Individual Platforms */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { id: 'instagram', name: 'Instagram', icon: Instagram, gradient: 'from-purple-500 to-pink-500' },
            { id: 'story', name: 'Story', icon: Image, gradient: 'from-purple-600 to-orange-500' },
            { id: 'facebook', name: 'Facebook', icon: Facebook, gradient: 'from-blue-600 to-blue-400' },
            { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, gradient: 'from-blue-700 to-blue-500' },
            { id: 'tiktok', name: 'TikTok', icon: Video, gradient: 'from-gray-700 to-black', border: true },
          ].map(platform => {
            const Icon = platform.icon
            return (
              <Link 
                key={platform.id} 
                href={`/dashboard/content-studio/${platform.id}?listing=${listingId}`}
                className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-white/30 transition-all cursor-pointer group text-center"
              >
                <div className={`w-10 h-10 mx-auto bg-gradient-to-br ${platform.gradient} rounded-lg flex items-center justify-center mb-2 ${platform.border ? 'border border-white/20' : ''}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white/70 text-sm group-hover:text-white transition-colors">{platform.name}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
