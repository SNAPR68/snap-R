import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canUseContentStudio, getRemainingCaptions, getRemainingPosts } from '@/lib/content/limits'
import { UpgradePrompt } from '@/components/content-studio/upgrade-prompt'
import { Sparkles, Instagram, FileText, Hash, ArrowRight, Palette } from 'lucide-react'
import Link from 'next/link'

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
  
  // Check if user can access Content Studio
  if (!canUseContentStudio(plan)) {
    return <UpgradePrompt feature="Content Studio" currentPlan={plan} requiredPlan="Starter" />
  }

  const captionsRemaining = getRemainingCaptions(plan, profile?.ai_captions_used || 0)
  const postsRemaining = getRemainingPosts(plan, profile?.content_posts_used || 0)

  // Check if brand profile exists
  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('id, business_name')
    .eq('user_id', user.id)
    .single()

  const hasBrandProfile = !!brandProfile?.business_name

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-2xl font-bold">Content Studio</h1>
          </div>
          <p className="text-white/60">
            Create stunning social media content from your enhanced photos
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

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-white mb-4">Create Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Social Post */}
          <Link href="/dashboard/content-studio/create?type=social">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#D4AF37]/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1 group-hover:text-[#D4AF37] transition-colors">
                Social Media Post
              </h3>
              <p className="text-white/60 text-sm">
                Instagram, Facebook, TikTok, LinkedIn
              </p>
            </div>
          </Link>

          {/* Property Description */}
          <Link href="/dashboard/content-studio/create?type=description">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#D4AF37]/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1 group-hover:text-[#D4AF37] transition-colors">
                Property Description
              </h3>
              <p className="text-white/60 text-sm">
                MLS listing, website, brochure
              </p>
            </div>
          </Link>

          {/* Hashtags */}
          <Link href="/dashboard/content-studio/create?type=hashtags">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#D4AF37]/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8960C] rounded-xl flex items-center justify-center mb-4">
                <Hash className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-white font-semibold mb-1 group-hover:text-[#D4AF37] transition-colors">
                Hashtag Generator
              </h3>
              <p className="text-white/60 text-sm">
                Platform-optimized hashtags
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Content - Placeholder */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Content</h2>
          <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
            <p className="text-white/40">No content created yet</p>
            <p className="text-white/30 text-sm mt-1">Your generated content will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
