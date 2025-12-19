'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Image, Video, Calendar, FolderOpen, Settings,
  Instagram, Facebook, Linkedin, Sparkles, Mail, Globe,
  Home, Coins, ChevronRight, Hash, Palette, Zap,
  BarChart3, ArrowRight, Loader2
} from 'lucide-react'
import { trackEvent, SnapREvents } from '@/lib/analytics'

type TabType = 'social' | 'video' | 'bulk' | 'email'

interface Listing {
  id: string
  title: string
  photoCount: number
  enhancedCount: number
  thumbnail: string | null
}

export default function ContentStudioClient({ 
  initialListings, 
  credits 
}: { 
  initialListings: Listing[]
  credits: number 
}) {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<TabType>('social')
  const [listings] = useState<Listing[]>(initialListings)

  useEffect(() => {
    trackEvent(SnapREvents.CONTENT_STUDIO_OPENED);
  }, []);

  const tabs = [
    { 
      id: 'social' as TabType, 
      label: 'Social Post', 
      desc: 'All platforms & templates',
      icon: Image,
      color: 'from-[#D4AF37] to-[#B8860B]',
      textColor: 'text-[#D4AF37]',
      bgColor: 'bg-[#D4AF37]',
      hoverBorder: 'hover:border-[#D4AF37]/50',
      activeBorder: 'border-[#D4AF37]/30',
      activeBg: 'from-[#D4AF37]/15 to-[#B8860B]/10',
      route: '/dashboard/content-studio/create-all'
    },
    { 
      id: 'video' as TabType, 
      label: 'Video Reels', 
      desc: 'TikTok & Instagram Reels',
      icon: Video,
      color: 'from-pink-500 to-rose-500',
      textColor: 'text-pink-400',
      bgColor: 'bg-pink-500',
      hoverBorder: 'hover:border-pink-500/50',
      activeBorder: 'border-pink-500/30',
      activeBg: 'from-pink-500/15 to-rose-500/10',
      route: '/dashboard/content-studio/video'
    },
    { 
      id: 'bulk' as TabType, 
      label: 'Bulk Creator', 
      desc: 'Multiple listings at once',
      icon: Zap,
      color: 'from-purple-500 to-violet-500',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500',
      hoverBorder: 'hover:border-purple-500/50',
      activeBorder: 'border-purple-500/30',
      activeBg: 'from-purple-500/15 to-violet-500/10',
      route: '/dashboard/content-studio/bulk'
    },
    { 
      id: 'email' as TabType, 
      label: 'Email Marketing', 
      desc: 'Campaign templates',
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500',
      hoverBorder: 'hover:border-blue-500/50',
      activeBorder: 'border-blue-500/30',
      activeBg: 'from-blue-500/15 to-cyan-500/10',
      route: '/dashboard/content-studio/email'
    },
  ]

  const activeTab = tabs.find(t => t.id === selectedTab)!

  const handleListingClick = (listingId: string) => {
    router.push(`${activeTab.route}?listing=${listingId}`)
  }

  const getTabDescription = () => {
    switch(selectedTab) {
      case 'social':
        return 'Create Instagram, Facebook, LinkedIn & TikTok posts with 150+ templates'
      case 'video':
        return 'Create slideshow videos for Reels & TikTok from your listing photos'
      case 'bulk':
        return 'Generate content for multiple listings at once'
      case 'email':
        return 'Create email marketing campaigns for your listings'
    }
  }

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="h-12 bg-[#111] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4 text-white/50" />
            <span className="text-white/50 text-sm">Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-[#D4AF37]">Content Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2.5 py-1">
            <Coins className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-sm font-semibold">{credits}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-72 bg-[#111] border-r border-white/5 flex flex-col flex-shrink-0">
          {/* Create Tabs */}
          <div className="p-3 border-b border-white/5">
            <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Create</h3>
            <div className="space-y-1.5">
              {tabs.map((tab) => {
                const isActive = selectedTab === tab.id
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left ${
                      isActive 
                        ? `bg-gradient-to-r ${tab.activeBg} ${tab.activeBorder}` 
                        : `bg-white/5 border-white/5 ${tab.hoverBorder}`
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${isActive ? tab.bgColor : 'bg-white/10'} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-white/50'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isActive ? tab.textColor : 'text-white'}`}>{tab.label}</p>
                      <p className="text-[9px] text-white/40">{tab.desc}</p>
                    </div>
                    {isActive && <ChevronRight className={`w-4 h-4 ${tab.textColor}`} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Manage */}
          <div className="p-3 border-b border-white/5">
            <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Manage</h3>
            <div className="space-y-0.5">
              <Link href="/dashboard/content-studio/calendar" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Content Calendar</span>
              </Link>
              <Link href="/dashboard/content-studio/library" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all">
                <FolderOpen className="w-4 h-4 text-green-400" />
                <span className="text-sm">Content Library</span>
              </Link>
              <Link href="/dashboard/content-studio/analytics" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <span className="text-sm">Post Analytics</span>
              </Link>
              <Link href="/dashboard/content-studio/sites" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">Property Sites</span>
              </Link>
            </div>
          </div>

          {/* Customize */}
          <div className="p-3 flex-1">
            <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Customize</h3>
            <div className="space-y-0.5">
              <Link href="/dashboard/content-studio/customize" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all">
                <Palette className="w-4 h-4 text-purple-400" />
                <span className="text-sm">Template Customizer</span>
              </Link>
              <Link href="/dashboard/settings/watermark" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all">
                <Image className="w-4 h-4 text-teal-400" />
                <span className="text-sm">Watermark Settings</span>
              </Link>
              <Link href="/dashboard/content-studio/auto-post" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Auto-Post Rules</span>
              </Link>
            </div>
          </div>

          {/* Settings */}
          <div className="p-3 border-t border-white/5">
            <Link href="/dashboard/settings" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all text-white/50">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </Link>
          </div>
        </aside>

        {/* Center - Listings */}
        <main className="flex-1 bg-[#080808] overflow-auto flex flex-col">
          <div className="flex-1 p-5">
            <div className="max-w-4xl mx-auto">
              {/* Tab Header */}
              <div className="text-center mb-5">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${activeTab.activeBg} border ${activeTab.activeBorder} mb-3`}>
                  <activeTab.icon className={`w-5 h-5 ${activeTab.textColor}`} />
                  <span className={`font-semibold ${activeTab.textColor}`}>{activeTab.label}</span>
                </div>
                <h2 className="text-xl font-bold mb-1">Select a Listing</h2>
                <p className="text-white/40 text-sm">{getTabDescription()}</p>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-12 bg-[#111] rounded-xl border border-white/5">
                  <Home className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">No Listings Yet</h3>
                  <p className="text-white/40 text-sm mb-4">Create a listing and enhance photos first</p>
                  <Link href="/listings/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-lg font-semibold text-sm">
                    Create Listing
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {listings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => handleListingClick(listing.id)}
                      className={`group bg-[#111] rounded-xl border border-white/5 transition-all overflow-hidden text-left ${activeTab.hoverBorder}`}
                    >
                      <div className="aspect-[4/3] relative">
                        {listing.thumbnail ? (
                          <img src={listing.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Home className="w-8 h-8 text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <h3 className={`font-semibold text-sm truncate group-hover:${activeTab.textColor} transition-colors`}>{listing.title}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded">{listing.photoCount} photos</span>
                            {listing.enhancedCount > 0 && (
                              <span className="text-[10px] bg-green-500/80 px-1.5 py-0.5 rounded">{listing.enhancedCount} ready</span>
                            )}
                          </div>
                        </div>
                        {/* Hover CTA */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <span className={`${activeTab.bgColor} text-black px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5`}>
                            <activeTab.icon className="w-3.5 h-3.5" /> 
                            {selectedTab === 'social' && 'Create Post'}
                            {selectedTab === 'video' && 'Create Video'}
                            {selectedTab === 'bulk' && 'Add to Bulk'}
                            {selectedTab === 'email' && 'Create Email'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Stats Band */}
          <div className="bg-[#111] border-t border-white/5 px-5 py-3 flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center border border-black"><Instagram className="w-3 h-3" /></div>
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center border border-black"><Facebook className="w-3 h-3" /></div>
                    <div className="w-5 h-5 rounded bg-blue-700 flex items-center justify-center border border-black"><Linkedin className="w-3 h-3" /></div>
                  </div>
                  <span className="text-sm"><span className="font-bold text-white">5</span> <span className="text-white/50">Platforms</span></span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="text-sm">
                  <span className="font-bold text-white">6</span> <span className="text-white/50">Post Types</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="text-sm">
                  <span className="font-bold text-white">150+</span> <span className="text-white/50">Templates</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-white/50">AI Captions & Hashtags</span>
                </div>
              </div>
              {listings.length > 0 && (
                <Link 
                  href={`${activeTab.route}?listing=${listings[0].id}`}
                  className={`px-4 py-2 ${activeTab.bgColor} text-black rounded-lg font-semibold text-sm hover:opacity-90 transition-colors flex items-center gap-2`}
                >
                  Start Creating <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}