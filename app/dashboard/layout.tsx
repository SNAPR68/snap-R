import Link from 'next/link'
import { Home, Hammer, Image, Palette, FileText, Settings, CheckSquare, Camera, Sparkles, CreditCard, BookOpen, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex">
      {/* Sidebar */}
      <aside className="w-[220px] bg-[#1A1A1A] border-r border-white/10 p-4 flex flex-col flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
          <span className="text-xl font-bold text-[#D4A017]">SnapR</span>
        </Link>
        
        <nav className="flex-1 space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 px-3">Main</p>
          <NavLink href="/dashboard/listings" icon={Home}>My Listings</NavLink>
          <NavLink href="/dashboard/camera" icon={Camera}>Mobile Camera</NavLink>
          
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Content</p>
          <NavLink href="/dashboard/content-studio" icon={FileText}>Content Studio</NavLink>
          <NavLink href="/dashboard/brand" icon={Palette}>Brand Profile</NavLink>
          
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Tools</p>
          <NavLink href="/dashboard/listing-intelligence" icon={Sparkles}>AI Analyzer</NavLink>
          <NavLink href="/dashboard/approvals" icon={CheckSquare}>Client Approvals</NavLink>
          <NavLink href="/dashboard/ai-descriptions" icon={FileText}>AI Descriptions</NavLink>
          <NavLink href="/dashboard/photo-culling" icon={Image}>Photo Culling</NavLink>
          <NavLink href="/dashboard/portfolio" icon={Palette}>Portfolios</NavLink>
          <NavLink href="/dashboard/renovation" icon={Hammer}>Virtual Renovation</NavLink>
          
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2 mt-6 px-3">Account</p>
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
