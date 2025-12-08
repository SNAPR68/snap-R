'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Check, Camera, Building2, Loader2, Gift } from 'lucide-react';

type RegionConfig = {
  symbol: string;
  code: string;
  flag: string;
  free: number;
  photographer: { starter: number; professional: number; studio: number };
  agent: { starter: number; professional: number; agency: number };
};

const REGION_PRICING: Record<string, RegionConfig> = {
  us: {
    symbol: '$', code: 'USD', flag: '🇺🇸', free: 25,
    photographer: { starter: 29, professional: 79, studio: 199 },
    agent: { starter: 49, professional: 99, agency: 299 },
  },
  uk: {
    symbol: '£', code: 'GBP', flag: '🇬🇧', free: 25,
    photographer: { starter: 25, professional: 65, studio: 159 },
    agent: { starter: 39, professional: 79, agency: 239 },
  },
  ae: {
    symbol: 'AED ', code: 'AED', flag: '🇦🇪', free: 25,
    photographer: { starter: 119, professional: 319, studio: 799 },
    agent: { starter: 199, professional: 399, agency: 1199 },
  },
  sg: {
    symbol: 'S$', code: 'SGD', flag: '🇸🇬', free: 25,
    photographer: { starter: 39, professional: 109, studio: 269 },
    agent: { starter: 69, professional: 139, agency: 399 },
  },
  in: {
    symbol: '₹', code: 'INR', flag: '🇮🇳', free: 25,
    photographer: { starter: 999, professional: 2499, studio: 5999 },
    agent: { starter: 1499, professional: 2999, agency: 8999 },
  },
};

const PLAN_CREDITS = {
  starter: 50,
  professional: 200,
  studio: 600,
  agency: 500,
};

export default function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const roleParam = searchParams.get('role');
  const regionParam = searchParams.get('region');
  const [userRole, setUserRole] = useState<string>(roleParam || 'photographer');
  const [userRegion, setUserRegion] = useState<string>(regionParam || 'us');
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const isAgentType = ['agent', 'broker', 'property-manager'].includes(userRole);
  const isUS = userRegion === 'us';
  const region = REGION_PRICING[userRegion] || REGION_PRICING.us;

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role, region').eq('id', user.id).single();
        if (profile?.role && !roleParam) setUserRole(profile.role);
        if (profile?.region && !regionParam) setUserRegion(profile.region);
      }
    }
    fetchProfile();
  }, [roleParam, regionParam, supabase]);

  const getPlans = () => {
    if (isAgentType) {
      const prices = region.agent;
      return [
        { id: 'starter', name: 'Agent Starter', price: prices.starter, credits: 50, features: isUS ? ['50 credits/month', 'All 15 AI tools', 'MLS Export Package', 'Auto-watermarking', 'Disclosure generator'] : ['50 credits/month', 'All 15 AI tools', 'HD downloads', 'Email support'], popular: false },
        { id: 'professional', name: 'Agent Pro', price: prices.professional, credits: 150, features: isUS ? ['150 credits/month', 'All 15 AI tools', 'MLS Export Package', 'Auto-watermarking', 'Disclosure generator', 'Priority support'] : ['150 credits/month', 'All 15 AI tools', '4K downloads', 'Priority support', 'Batch processing'], popular: true },
        { id: 'agency', name: 'Agency', price: prices.agency, credits: 500, features: isUS ? ['500 credits/month', 'All 15 AI tools', 'MLS Export Package', 'Auto-watermarking', 'Disclosure generator', 'Team management', 'Dedicated account manager'] : ['500 credits/month', 'All 15 AI tools', '4K downloads', 'Dedicated support', 'Team management', 'Dedicated account manager'], popular: false },
      ];
    } else {
      const prices = region.photographer;
      return [
        { id: 'starter', name: 'Starter', price: prices.starter, credits: 50, features: ['50 credits/month', 'All 15 AI tools', 'HD downloads', 'Email support'], popular: false },
        { id: 'professional', name: 'Professional', price: prices.professional, credits: 200, features: ['200 credits/month', 'All 15 AI tools', '4K downloads', 'Priority support', 'Batch processing'], popular: true },
        { id: 'studio', name: 'Studio', price: prices.studio, credits: 600, features: ['600 credits/month', 'All 15 AI tools', '4K downloads', 'Dedicated support', 'Batch processing', 'API access'], popular: false },
      ];
    }
  };

  const plans = getPlans();

  const formatPrice = (price: number) => `${region.symbol}${price.toLocaleString()}`;

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      if (planId === 'free') {
        await supabase.from('profiles').upsert({
          id: user.id,
          subscription_tier: 'free',
          plan: 'free',
          credits: 25,
          role: userRole,
          region: userRegion,
          updated_at: new Date().toISOString(),
        });
        router.push('/dashboard');
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, region: userRegion }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL:', data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const isHighlighted = (planId: string, isPopular: boolean) => {
    if (selectedPlan === planId || hoveredPlan === planId) return true;
    if (!selectedPlan && !hoveredPlan && isPopular) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
          <span className="text-xl font-bold text-[#D4A017]">SnapR</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-sm">
          <span>{region.flag}</span>
          <span className="text-white/60">{region.code}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${!isAgentType ? 'bg-[#D4A017]/20 border border-[#D4A017]' : 'bg-white/5'}`}>
            <Camera className="w-4 h-4" />
            <span className={!isAgentType ? 'text-[#D4A017]' : 'text-white/50'}>Photographer</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isAgentType ? 'bg-[#D4A017]/20 border border-[#D4A017]' : 'bg-white/5'}`}>
            <Building2 className="w-4 h-4" />
            <span className={isAgentType ? 'text-[#D4A017]' : 'text-white/50'}>Agent / Broker</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-white/60 text-lg">
            {isAgentType && isUS ? 'Plans include MLS compliance tools, watermarking, and disclosure generation' : 'Professional photo enhancement tools for real estate professionals'}
          </p>
        </div>

        {/* Free Trial */}
        <div className="max-w-md mx-auto mb-8">
          <div 
            onClick={() => setSelectedPlan('free')}
            onMouseEnter={() => setHoveredPlan('free')}
            onMouseLeave={() => setHoveredPlan(null)}
            className={`cursor-pointer transition-all border rounded-2xl p-6 ${selectedPlan === 'free' || hoveredPlan === 'free' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400 shadow-lg shadow-green-500/20' : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-400">Free Trial</h3>
                <p className="text-white/50 text-sm">No credit card required</p>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-white/80"><Check className="w-4 h-4 text-green-400" />25 free credits</li>
              <li className="flex items-center gap-2 text-white/80"><Check className="w-4 h-4 text-green-400" />All 15 AI tools</li>
              <li className="flex items-center gap-2 text-white/80"><Check className="w-4 h-4 text-green-400" />HD downloads</li>
              <li className="flex items-center gap-2 text-white/80"><Check className="w-4 h-4 text-green-400" />No credit card required</li>
            </ul>
            <button onClick={(e) => { e.stopPropagation(); handleSelectPlan('free'); }} disabled={loading && selectedPlan === 'free'} className="w-full py-3 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white transition-all disabled:opacity-50">
              {loading && selectedPlan === 'free' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Start Free Trial'}
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-white/40">Or choose a paid plan for more credits</p>
        </div>

        {/* Paid Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const highlighted = isHighlighted(plan.id, plan.popular);
            return (
              <div 
                key={plan.id} 
                onClick={() => setSelectedPlan(plan.id)}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`relative bg-[#1A1A1A] border rounded-2xl p-6 cursor-pointer transition-all ${highlighted ? 'border-[#D4A017] shadow-lg shadow-[#D4A017]/20 scale-[1.02]' : 'border-white/10 hover:border-white/20'}`}
              >
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-full text-black text-sm font-semibold">Most Popular</div>}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${highlighted ? 'text-[#D4A017]' : 'text-white'}`}>{formatPrice(plan.price)}</span>
                    <span className="text-white/50">/month</span>
                  </div>
                  <p className="text-white/50 mt-2">{plan.credits} credits/month</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className={`w-5 h-5 flex-shrink-0 ${highlighted ? 'text-[#D4A017]' : 'text-white/40'}`} />
                      <span className="text-white/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan.id); }} disabled={loading && selectedPlan === plan.id} className={`w-full py-3 rounded-xl font-semibold transition-all ${highlighted ? 'bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black hover:opacity-90' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'} disabled:opacity-50`}>
                  {loading && selectedPlan === plan.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
