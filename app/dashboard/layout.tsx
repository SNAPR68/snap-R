import Link from 'next/link'
import { Home, Zap, Users, Hammer, LayoutGrid, Image, Images, Palette, FileText, Settings, CheckSquare, Camera, Mic, Sparkles, CreditCard, BookOpen, LogOut, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedbackButton } from '@/components/feedback-button'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  // Fetch profile for usage info
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, listings_limit')
    .eq('id', user.id)
    .single()
  
  // Count actual listings created this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count: listingsCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart)
  
  const tier = profile?.subscription_tier || 'free'
  const listingsUsed = listingsCount || 0
  const listingsLimit = profile?.listings_limit || 3
  const usagePercent = Math.min((listingsUsed / listingsLimit) * 100, 100)
  
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex">
      {/* Sidebar */}
      <aside className="w-[220px] bg-[#1A1A1A] border-r border-white/10 p-4 flex flex-col flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
          <span className="text-xl font-bold text-[#D4A017]">SnapR</span>
        </Link>
        
        {/* Usage Card */}
        <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50">Listings This Month</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              tier === 'agency' ? 'bg-purple-500/20 text-purple-400' : 
              tier === 'pro' ? 'bg-[#D4A017]/20 text-[#D4A017]' : 
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
            <Link href="/pricing" className="block mt-2 text-xs text-[#D4A017] hover:underline">
              Upgrade for more →
            </Link>
          )}
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 px-3">Main</p>
          <NavLink href="/dashboard/listings" icon={Home}>My Listings</NavLink>
          
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Content</p>
          <NavLink href="/dashboard/content-studio" icon={FileText}>Content Studio</NavLink>
          <NavLink href="/dashboard/brand" icon={Palette}>Brand Profile</NavLink>
          
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Tools</p>
          <NavLink href="/dashboard/approvals" icon={CheckSquare}>Client Approvals</NavLink>
          <NavLink href="/dashboard/ai-descriptions" icon={FileText}>AI Descriptions</NavLink>
          <NavLink href="/dashboard/portfolio" icon={Palette}>Portfolios</NavLink>
          {/* <NavLink href="/dashboard/renovation" icon={Hammer}>Virtual Renovation</NavLink> */}
          <NavLink href="/dashboard/virtual-tours" icon={Images}>Property Gallery</NavLink>
          <NavLink href="/dashboard/voiceover" icon={Mic}>AI Voiceover</NavLink>
          <NavLink href="/dashboard/cma" icon={FileText}>CMA Reports</NavLink>
          
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Account</p>
          <NavLink href="/dashboard/team" icon={Users}>Team</NavLink>
          <NavLink href="/dashboard/settings" icon={Settings}>Settings</NavLink>
          <NavLink href="/dashboard/billing" icon={CreditCard}>Billing</NavLink>
          <NavLink href="/academy" icon={BookOpen}>Academy</NavLink>
        </nav>
        
        <div className="pt-4 border-t border-white/10">
          <form action="/auth/signout" method="POST">
            <button type="submit" className="flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/60 w-full">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </form>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <FeedbackButton />
    </div>
  )
}

function NavLink({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition-colors">
      <Icon className="w-5 h-5" />
      <span className="text-sm">{children}</span>
    </Link>
  )
}
