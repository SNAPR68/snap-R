import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, ExternalLink, Check, Zap, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const TIER_INFO = {
  free: { name: 'Free', color: 'text-white/60', listings: 3, price: '$0' },
  pro: { name: 'Pro', color: 'text-[#D4A017]', listings: 'Custom', price: '$7-9/listing' },
  agency: { name: 'Agency', color: 'text-purple-400', listings: 'Unlimited', price: '$9-11/listing' },
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, listings_limit, listings_used_this_month, billing_cycle_start')
    .eq('id', user.id)
    .single();

  const tier = (profile?.subscription_tier || 'free') as keyof typeof TIER_INFO;
  const tierInfo = TIER_INFO[tier] || TIER_INFO.free;
  const listingsUsed = profile?.listings_used_this_month || 0;
  const listingsLimit = profile?.listings_limit || 3;
  const usagePercent = Math.min((listingsUsed / listingsLimit) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </header>
      
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
        
        {/* Current Plan */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-[#D4A017]" />
            <h2 className="text-xl font-semibold">Current Plan</h2>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-4">
            <div>
              <p className={`font-bold text-2xl ${tierInfo.color}`}>{tierInfo.name}</p>
              <p className="text-white/50 text-sm">{tierInfo.price}/month</p>
            </div>
            {tier !== 'free' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">Active</span>
            )}
          </div>
          
          {tier === 'free' && (
            <Link 
              href="/pricing" 
              className="block w-full text-center py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              Upgrade to Pro
            </Link>
          )}
        </section>

        {/* Usage This Month */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-[#D4A017]" />
            <h2 className="text-xl font-semibold">Usage This Month</h2>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-white/60">Listings Used</span>
              <span className="font-semibold">{listingsUsed} / {listingsLimit}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-[#D4A017]'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
              <Zap className="w-4 h-4 text-green-400" />
              <span>AI Enhancements: <span className="text-green-400 font-semibold">Unlimited</span></span>
            </div>
            <p className="text-xs text-white/40">All 15 AI tools included free with your plan. No per-enhancement charges.</p>
          </div>
        </section>

        {/* What's Included */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">What's Included</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              '15 AI Enhancement Tools',
              'Content Studio (150+ templates)',
              'Video Creator + AI Voiceovers',
              'Email Marketing (24 templates)',
              'Property Landing Pages',
              'Client Approval Workflow',
              'Social Publishing',
              tier !== 'free' ? 'WhatsApp Alerts' : 'Basic Notifications',
              tier !== 'free' ? 'Clean HD Exports' : 'Watermarked Exports',
              tier === 'agency' ? '5 Team Members' : 'Single User',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Manage Subscription */}
        {tier !== 'free' && (
          <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
            <div className="flex gap-4">
              <a 
                href="/api/stripe/portal" 
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Billing Portal
              </a>
              <Link 
                href="/pricing" 
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                Change Plan
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
