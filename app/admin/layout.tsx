import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Zap, DollarSign, Clock, Settings, TrendingUp, AlertTriangle, Mail, Server } from 'lucide-react';

const ADMIN_EMAILS = ['rajesh@snap-r.com'];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex">
      <aside className="w-64 bg-[#1A1A1A] border-r border-white/10 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
          <div>
            <span className="font-bold text-lg">Snap<span className="text-[#D4A017]">R</span></span>
            <span className="text-[#D4A017] text-xs block">Admin Panel</span>
          </div>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-[#D4A017]" />
            Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Users className="w-5 h-5 text-[#D4A017]" />
            Users
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <TrendingUp className="w-5 h-5 text-[#D4A017]" />
            Analytics & Costs
          </Link>
          <Link href="/admin/revenue" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <DollarSign className="w-5 h-5 text-[#D4A017]" />
            Revenue
          </Link>
          <Link href="/admin/human-edits" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Clock className="w-5 h-5 text-[#D4A017]" />
            Human Edits
          </Link>
          <Link href="/admin/contacts" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Mail className="w-5 h-5 text-[#D4A017]" />
            Contact Forms
          </Link>
          <Link href="/admin/status" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Server className="w-5 h-5 text-[#D4A017]" />
            System Status
          </Link>
          <Link href="/admin/logs" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <AlertTriangle className="w-5 h-5 text-[#D4A017]" />
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
