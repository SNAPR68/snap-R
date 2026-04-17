'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Image, Video, FolderOpen,
  Instagram, Facebook, Linkedin, Sparkles, Mail, Globe,
  Home, Coins, Palette, Zap,
  ArrowRight, Loader2, Download
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

interface MarketingStatus {
  status: string
  hasDescription: boolean
  hasCaptions: boolean
  hasSite: boolean
  hasScheduledPosts: boolean
  descriptionPreview: string | null
  captionPlatforms: string[]
  propertySiteSlug: string | null
}

export default function ContentStudioClient({
  initialListings,
  credits,
  marketingStatuses
}: {
  initialListings: Listing[]
  credits: number
  marketingStatuses?: Record<string, MarketingStatus>
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
      desc: 'Instagram Reels & short-form video',
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
    const hasMarketing = marketingStatuses?.[listingId]?.status === 'completed'
    // Auto-prefill from marketing pipeline when content is ready
    const prefillParam = hasMarketing ? '&prefill=marketing' : ''
    router.push(`${activeTab.route}?listing=${listingId}${prefillParam}`)
  }

  const getTabDescription = () => {
    switch(selectedTab) {
      case 'social':
        return 'Create Instagram, Facebook, and LinkedIn posts with 150+ templates'
      case 'video':
        return 'Create slideshow videos for Instagram Reels and short-form placements from your listing photos'
      case 'bulk':
        return 'Generate content for multiple listings at once'
      case 'email':
        return 'Create email marketing campaigns for your listings'
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#111] border-b border-white/5 px-6 pt-6 pb-0 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          {/* Top Row: Title + Credits */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Content Studio</h1>
                <p className="text-xs text-white/40">Create and manage marketing content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Quick Links */}
              <div className="flex items-center gap-1.5">
                <Link href="/dashboard/content-studio/library" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/50 hover:bg-white/5 hover:text-white/70 transition-colors">
                  <FolderOpen className="w-3.5 h-3.5" /> Library
                </Link>
                <Link href="/dashboard/content-studio/sites" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/50 hover:bg-white/5 hover:text-white/70 transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Sites
                </Link>
                <Link href="/dashboard/content-studio/customize" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/50 hover:bg-white/5 hover:text-white/70 transition-colors">
                  <Palette className="w-3.5 h-3.5" /> Templates
                </Link>
              </div>
              <div className="h-5 w-px bg-white/10" />
              <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2.5 py-1.5">
                <Coins className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-sm font-semibold">{credits}</span>
              </div>
            </div>
          </div>

          {/* Horizontal Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = selectedTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg border-b-2 transition-all ${
                    isActive
                      ? `bg-[#0A0A0A] border-[#D4AF37] ${tab.textColor}`
                      : 'bg-transparent border-transparent text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md ${isActive ? tab.bgColor : 'bg-white/10'} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-white/50'}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{tab.label}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Tab Header */}
          <div className="text-center mb-6">
            <p className="text-white/40 text-sm">{getTabDescription()}</p>
            <h2 className="text-lg font-bold mt-1">Select a Listing</h2>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16 bg-[#111] rounded-xl border border-white/5">
              <Home className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <h3 className="font-medium mb-2">No Listings Yet</h3>
              <p className="text-white/40 text-sm mb-4">Create a listing and enhance photos first</p>
              <Link href="/listings/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-lg font-semibold text-sm">
                Create Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => handleListingClick(listing.id)}
                  className={`group bg-[#111] rounded-xl border border-white/5 transition-all overflow-hidden text-left ${activeTab.hoverBorder}`}
                >
                  <div className="aspect-[4/3] relative">
                    {listing.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Home className="w-8 h-8 text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className={`font-semibold text-sm truncate group-hover:${activeTab.textColor} transition-colors`}>{listing.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded">{listing.photoCount} photos</span>
                        {listing.enhancedCount > 0 && (
                          <span className="text-[10px] bg-green-500/80 px-1.5 py-0.5 rounded">{listing.enhancedCount} ready</span>
                        )}
                        {marketingStatuses?.[listing.id]?.status === 'completed' && (
                          <span className="text-[10px] bg-[#D4AF37]/90 text-black font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> AI Content Ready
                          </span>
                        )}
                        {marketingStatuses?.[listing.id]?.status === 'processing' && (
                          <span className="text-[10px] bg-amber-500/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Hover CTA */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 gap-1.5">
                      <span className={`${activeTab.bgColor} text-black px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5`}>
                        <activeTab.icon className="w-3.5 h-3.5" />
                        {selectedTab === 'social' && (marketingStatuses?.[listing.id]?.status === 'completed' ? 'Create with AI Content' : 'Create Post')}
                        {selectedTab === 'video' && 'Create Video'}
                        {selectedTab === 'bulk' && 'Add to Bulk'}
                        {selectedTab === 'email' && (marketingStatuses?.[listing.id]?.status === 'completed' ? 'Create with AI Content' : 'Create Email')}
                      </span>
                      {marketingStatuses?.[listing.id]?.status === 'completed' && (
                        <span className="text-[10px] text-white/70">Captions & hashtags auto-loaded</span>
                      )}
                    </div>
                  </div>
                  {/* Generated Content Preview */}
                  {marketingStatuses?.[listing.id]?.status === 'completed' && (
                    <div className="px-2.5 py-2 border-t border-white/5 space-y-1.5">
                      {marketingStatuses[listing.id].descriptionPreview && (
                        <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">
                          {marketingStatuses[listing.id].descriptionPreview}...
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {marketingStatuses[listing.id].captionPlatforms.length > 0 && (
                          <span className="text-[10px] bg-white/5 text-white/60 px-1.5 py-0.5 rounded">
                            {marketingStatuses[listing.id].captionPlatforms.length} captions
                          </span>
                        )}
                        {marketingStatuses[listing.id].propertySiteSlug && (
                          <span className="text-[10px] bg-white/5 text-white/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" /> Site live
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Stats Band */}
      <div className="bg-[#111] border-t border-white/5 px-6 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-white/50">Download & Share Anywhere</span>
            </div>
          </div>
          {listings.length > 0 && (
            <Link
              href={`${activeTab.route}?listing=${listings[0].id}${marketingStatuses?.[listings[0].id]?.status === 'completed' ? '&prefill=marketing' : ''}`}
              className={`px-4 py-2 ${activeTab.bgColor} text-black rounded-lg font-semibold text-sm hover:opacity-90 transition-colors flex items-center gap-2`}
            >
              Start Creating <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
