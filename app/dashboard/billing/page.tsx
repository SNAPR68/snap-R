import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Billing</h1>
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-[#D4A017]" />
            <h2 className="text-xl font-semibold">Current Plan</h2>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-4">
            <div>
              <p className="font-semibold text-lg capitalize">{profile?.plan || 'Free'} Plan</p>
            </div>
            <div className="text-right">
              <p className="text-[#D4A017] font-bold text-2xl">{profile?.credits || 0}</p>
              <p className="text-white/50 text-sm">credits</p>
            </div>
          </div>
          {(!profile?.plan || profile?.plan === 'free') ? (
            <Link href="/#pricing" className="block w-full text-center py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-medium rounded-lg">
              Upgrade Plan
            </Link>
          ) : (
            <a href="/api/stripe/portal" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">
              <ExternalLink className="w-4 h-4" /> Manage Subscription
            </a>
          )}
        </section>
      </main>
    </div>
  );
}
