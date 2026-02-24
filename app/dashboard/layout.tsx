import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedbackButton } from '@/components/feedback-button'
import DashboardSidebar from '@/components/dashboard-sidebar'
import { MobileSidebarProvider } from '@/components/mobile-sidebar-provider'
import { MobileDashboardHeader } from '@/components/mobile-dashboard-header'
import { DesktopNotificationBar } from '@/components/desktop-notification-bar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch profile for usage info
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, plan, listings_per_month, onboarded_at')
    .eq('id', user.id)
    .single()

  // Enforce onboarding — redirect if user hasn't completed it
  if (!profile?.onboarded_at) {
    redirect('/onboarding')
  }

  // Count actual listings created this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count: listingsCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart)

  // Prefer subscription_tier, fall back to plan field (Stripe webhook writes both, but older accounts may only have plan)
  const rawTier = profile?.subscription_tier || profile?.plan || 'free'
  const tier = rawTier === 'free' && profile?.plan && profile.plan !== 'free' ? profile.plan : rawTier
  const listingsUsed = listingsCount || 0
  const tierDefaults: Record<string, number> = { free: 3, starter: 10, pro: 30, agency: 50 }
  const listingsLimit = profile?.listings_per_month || tierDefaults[tier] || 3

  return (
    <MobileSidebarProvider>
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col md:flex-row">
        <MobileDashboardHeader />
        <DashboardSidebar tier={tier} listingsUsed={listingsUsed} listingsLimit={listingsLimit} />
        <main className="flex-1 overflow-auto flex flex-col">
          <DesktopNotificationBar />
          <div className="flex-1">
            {children}
          </div>
        </main>
        <FeedbackButton />
      </div>
    </MobileSidebarProvider>
  )
}
