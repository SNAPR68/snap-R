'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Home, Sparkles, Palette, Calendar, Zap,
  BarChart3, CheckSquare, FileText, FolderOpen, Images, Mic,
  ClipboardList, Users, Settings, CreditCard, LogOut,
  ChevronDown, ChevronRight, X,
  Sofa, Globe, Megaphone, ScanSearch, Hammer, Brain, Mail, Handshake, Camera, Printer, MessageSquare, FileJson,
  Building2, DoorOpen
} from 'lucide-react'
import { useSidebar } from './mobile-sidebar-provider'

interface DashboardSidebarProps {
  tier: string
  listingsUsed: number
  listingsLimit: number
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/listings', label: 'My Listings', icon: Home },
    ],
  },
  {
    title: 'Create',
    items: [
      { href: '/dashboard/content-studio', label: 'Content Studio', icon: Sparkles },
      { href: '/dashboard/brand', label: 'Brand Profile', icon: Palette },
      { href: '/dashboard/staging', label: 'Virtual Staging', icon: Sofa },
      { href: '/dashboard/content-studio/sites', label: 'Property Sites', icon: Globe },
    ],
  },
  {
    title: 'Publish',
    items: [
      { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
      { href: '/dashboard/auto-post', label: 'Auto-Post Rules', icon: Zap },
      { href: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone },
    ],
  },
  {
    title: 'Measure',
    items: [
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/leads', label: 'Leads', icon: Users },
      { href: '/dashboard/showings', label: 'Showings', icon: Calendar },
      { href: '/dashboard/open-houses', label: 'Open Houses', icon: DoorOpen },
      { href: '/dashboard/approvals', label: 'Client Approvals', icon: CheckSquare },
      { href: '/dashboard/photographer', label: 'Photographer Portal', icon: Camera },
      { href: '/dashboard/notify', label: 'Notify', icon: MessageSquare },
    ],
  },
  {
    title: 'More Tools',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { href: '/dashboard/ai-descriptions', label: 'AI Descriptions', icon: FileText },
      { href: '/dashboard/portfolio', label: 'Portfolios', icon: FolderOpen },
      { href: '/dashboard/virtual-tours', label: 'Property Gallery', icon: Images },
      { href: '/dashboard/voiceover', label: 'AI Voiceover', icon: Mic },
      { href: '/dashboard/cma', label: 'CMA Reports', icon: ClipboardList },
      { href: '/dashboard/photo-culling', label: 'Photo Culling', icon: ScanSearch },
      { href: '/dashboard/renovation', label: 'Renovation', icon: Hammer },
      { href: '/dashboard/listing-intelligence', label: 'Listing Intel', icon: Brain },
      { href: '/dashboard/content-studio/email', label: 'Email Marketing', icon: Mail },
      { href: '/dashboard/print', label: 'Print Materials', icon: Printer },
      { href: '/dashboard/partner', label: 'Partner Program', icon: Handshake },
      { href: '/dashboard/mls', label: 'MLS Submission', icon: FileJson },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/team', label: 'Team', icon: Users },
      { href: '/dashboard/broker', label: 'Broker Dashboard', icon: Building2 },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
      { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
    ],
  },
]

function SidebarContent({ tier, listingsUsed, listingsLimit, onNavClick }: DashboardSidebarProps & { onNavClick?: () => void }) {
  const pathname = usePathname()
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'More Tools': true,
  })

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const usagePercent = Math.min((listingsUsed / listingsLimit) * 100, 100)

  return (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-6" onClick={onNavClick}>
        <span className="text-xl font-bold">Snap<span className="text-[#D4A017]">R</span></span>
      </Link>

      {/* Usage Card */}
      <div className="mb-6 p-3 glass-luxury glossy-top rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">Listings This Month</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            tier === 'agency' ? 'bg-purple-500/20 text-purple-400' :
            tier === 'pro' ? 'bg-[#D4A017]/20 text-[#D4A017]' :
            tier === 'starter' ? 'bg-blue-500/20 text-blue-400' :
            'bg-white/10 text-white/60'
          }`}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold">{listingsUsed}</span>
          <span className="text-white/40">/ {listingsLimit}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent >= 90 ? 'bg-red-500' :
              usagePercent >= 70 ? 'bg-yellow-500' :
              'bg-[#D4A017]'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        {tier === 'free' && listingsUsed >= listingsLimit && (
          <Link href="/pricing" className="block mt-2 text-xs text-[#D4A017] hover:underline" onClick={onNavClick}>
            Upgrade for more &rarr;
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV_SECTIONS.map((section) => {
          const isCollapsed = section.collapsible && collapsedSections[section.title]

          return (
            <div key={section.title}>
              {section.collapsible ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between text-xs text-white/40 uppercase tracking-wider mb-2 mt-5 px-3 hover:text-white/60 transition-colors"
                >
                  <span>{section.title}</span>
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />
                  }
                </button>
              ) : (
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-5 px-3 first:mt-0">
                  {section.title}
                </p>
              )}

              {!isCollapsed && section.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      active
                        ? 'glass-gold-luxury text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="pt-4 border-t border-white/10">
        <form action="/auth/signout" method="POST">
          <button type="submit" className="flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/60 w-full transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </form>
      </div>
    </>
  )
}

export default function DashboardSidebar({ tier, listingsUsed, listingsLimit }: DashboardSidebarProps) {
  const { isOpen, close } = useSidebar()

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] bg-[#0F0F0F] border-r border-white/10 p-4 flex-col flex-shrink-0" style={{ backdropFilter: 'blur(24px)', background: 'linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.99) 100%)' }}>
        <SidebarContent tier={tier} listingsUsed={listingsUsed} listingsLimit={listingsLimit} />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          {/* Sidebar panel */}
          <aside className="relative w-[280px] h-full bg-[#0F0F0F] p-4 flex flex-col overflow-y-auto" style={{ backdropFilter: 'blur(24px)', background: 'linear-gradient(180deg, rgba(20,20,20,0.99) 0%, rgba(10,10,10,1) 100%)' }}>
            <button
              onClick={close}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent
              tier={tier}
              listingsUsed={listingsUsed}
              listingsLimit={listingsLimit}
              onNavClick={close}
            />
          </aside>
        </div>
      )}
    </>
  )
}
