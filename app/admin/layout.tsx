import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, DollarSign, Clock, TrendingUp, AlertTriangle, Mail, Server, Command, Brain, Handshake, MessageCircle } from 'lucide-react';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fail closed: redirect if no admin list configured, no user, or email not in list
  if (!user?.email || ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-charcoal-deep text-white flex">
      <aside className="w-64 bg-surface-container-high border-r border-white/10 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-bold text-black text-xl">S</div>
          <div>
            <span className="font-bold text-lg">Snap<span className="text-primary">R</span></span>
            <span className="text-primary text-xs block">Admin Panel</span>
          </div>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Dashboard
          </Link>
          <Link href="/admin/command-center" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors bg-accent-gold/10 border border-primary/30">
            <Command className="w-5 h-5 text-primary" />
            Command Center
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Users className="w-5 h-5 text-primary" />
            Users
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <TrendingUp className="w-5 h-5 text-primary" />
            Analytics & Costs
          </Link>
          <Link href="/admin/ai-decisions" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Brain className="w-5 h-5 text-primary" />
            AI Decisions
          </Link>
          <Link href="/admin/revenue" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <DollarSign className="w-5 h-5 text-primary" />
            Revenue
          </Link>
          <Link href="/admin/human-edits" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Clock className="w-5 h-5 text-primary" />
            Human Edits
          </Link>
          <Link href="/admin/partners" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Handshake className="w-5 h-5 text-primary" />
            Partners
          </Link>
          <Link href="/admin/notifications" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <MessageCircle className="w-5 h-5 text-primary" />
            Notifications
          </Link>
          <Link href="/admin/contacts" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Mail className="w-5 h-5 text-primary" />
            Contact Forms
          </Link>
          <Link href="/admin/status" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Server className="w-5 h-5 text-primary" />
            System Status
          </Link>
          <Link href="/admin/logs" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Logs & Errors
          </Link>
        </nav>
        
        <div className="pt-4 border-t border-white/10">
          <Link href="/dashboard" className="block text-center text-sm text-white/50 hover:text-white py-2">
            ← Back to App
          </Link>
        </div>
      </aside>
      
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
