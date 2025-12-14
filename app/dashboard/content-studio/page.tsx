'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Sparkles, PenTool, Calendar, BarChart3, Zap, FolderOpen, 
  Mail, Globe, Palette, Image, QrCode, Languages, Video,
  Instagram, Facebook, Linkedin, ArrowRight, Crown
} from 'lucide-react'

const MAIN_TOOLS = [
  { name: 'Create Post', desc: 'AI-powered social media content', href: '/dashboard/content-studio/create-all', icon: PenTool, color: 'from-[#D4AF37] to-[#B8960C]', featured: true },
  { name: 'Content Calendar', desc: 'Schedule & manage posts', href: '/dashboard/content-studio/calendar', icon: Calendar, color: 'from-blue-500 to-blue-600' },
  { name: 'Bulk Creator', desc: 'Generate for multiple listings', href: '/dashboard/content-studio/bulk', icon: Zap, color: 'from-purple-500 to-purple-600' },
  { name: 'Video Creator', desc: 'Slideshows for Reels & TikTok', href: '/dashboard/content-studio/video', icon: Video, color: 'from-pink-500 to-rose-600' },
]

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

const PLATFORMS = [
  { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
]

export default function ContentStudio() {
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
            {PLATFORMS.map(p => (
              <div key={p.name} className={`p-2 rounded-lg ${p.color}`}>
                <p.icon className="w-5 h-5 text-white" />
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Main Tools */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#D4AF37]" />Main Tools
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MAIN_TOOLS.map(tool => (
              <Link key={tool.name} href={tool.href}>
                <div className={`rounded-2xl p-5 border transition hover:scale-[1.02] h-full ${tool.featured ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#B8960C]/10 border-[#D4AF37]/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${tool.color} mb-4`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{tool.name}</h3>
                  <p className="text-white/50 text-sm">{tool.desc}</p>
                  {tool.featured && (
                    <div className="mt-3 flex items-center text-[#D4AF37] text-sm font-medium">
                      Get Started <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Content Tools */}
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

        {/* Stats Preview */}
        <section className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-2xl p-6 border border-[#D4AF37]/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Ready to create amazing content?</h2>
              <p className="text-white/50 text-sm">108 professional templates • 4 platforms • AI-powered captions</p>
            </div>
            <Link href="/dashboard/content-studio/create-all">
              <Button className="bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold">
                <PenTool className="w-4 h-4 mr-2" />Create Now
              </Button>
            </Link>
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Link href="/dashboard/content-studio/create-all?type=just-listed" className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition">
            🏠 Just Listed Post
          </Link>
          <Link href="/dashboard/content-studio/create-all?type=open-house" className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition">
            🚪 Open House Post
          </Link>
          <Link href="/dashboard/content-studio/create-all?type=just-sold" className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition">
            🎉 Just Sold Post
          </Link>
          <Link href="/dashboard/content-studio/create-all?type=market-update" className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition">
            📊 Market Update
          </Link>
        </section>
      </div>
    </div>
  )
}
