'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Pricing data
const PRO_TIERS = [
  { listings: 10, monthly: 25, annual: 20 },
  { listings: 20, monthly: 22, annual: 18 },
  { listings: 30, monthly: 19, annual: 15 },
  { listings: 50, monthly: 17, annual: 13 },
  { listings: 75, monthly: 15, annual: 12 },
  { listings: 100, monthly: 14, annual: 11 },
  { listings: 125, monthly: 13, annual: 10 },
  { listings: 150, monthly: 12, annual: 9 },
  { listings: '150+', monthly: null, annual: null, enterprise: true },
] as const;

const TEAM_OPTIONS = [
  { users: 5, monthly: 199, annual: 149 },
  { users: 10, monthly: 399, annual: 299 },
  { users: 25, monthly: 649, annual: 499 },
] as const;

const ADDONS = [
  { id: 'floorplan_2d', name: 'Floor Plans', price: 'From $25', icon: 'grid' },
  { id: 'virtual_tour', name: 'Virtual Tours', price: 'From $50', icon: 'eye' },
  { id: 'virtual_renovation', name: 'Virtual Renovation', price: 'From $35', icon: 'brush' },
  { id: 'ai_voiceover', name: 'AI Voiceovers', price: 'From $15', icon: 'mic' },
] as const;

const GOLD = '#D4A017';

const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const AddonIcon = ({ type }: { type: string }) => {
  if (type === 'grid') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
  if (type === 'eye') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  if (type === 'brush') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  );
  if (type === 'mic') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
  return null;
};

const LoadingSpinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(4);
  const [teamSizeIndex, setTeamSizeIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'team'>('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTier = PRO_TIERS[sliderIndex];
  const isEnterprise = (currentTier as any).enterprise === true;
  const teamOption = TEAM_OPTIONS[teamSizeIndex];

  const proCalc = useMemo(() => {
    if (isEnterprise) return { price: null, total: null, savings: 0 };
    const price = isAnnual ? currentTier.annual : currentTier.monthly;
    const listings = currentTier.listings as number;
    const total = listings * (price as number);
    const savings = isAnnual ? ((currentTier.monthly as number) - (currentTier.annual as number)) * listings * 12 : 0;
    return { price, total, savings };
  }, [currentTier, isAnnual, isEnterprise]);

  const teamCalc = useMemo(() => {
    if (isEnterprise) return { base: null, price: null, listingCost: null, total: null };
    const base = isAnnual ? teamOption.annual : teamOption.monthly;
    const price = isAnnual ? currentTier.annual : currentTier.monthly;
    const listings = currentTier.listings as number;
    const listingCost = listings * (price as number);
    const total = base + listingCost;
    return { base, price, listingCost, total };
  }, [teamOption, currentTier, isAnnual, isEnterprise]);

  // Checkout handler
  const handleCheckout = async () => {
    if (selectedPlan === 'free') {
      window.location.href = '/signup';
      return;
    }

    if (isEnterprise) {
      window.location.href = '/contact';
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billing: isAnnual ? 'annual' : 'monthly',
          listings: currentTier.listings as number,
          teamSize: selectedPlan === 'team' ? TEAM_OPTIONS[teamSizeIndex].users : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Addon purchase handler
  const handleAddonPurchase = async (addonId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/addon-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonType: addonId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getCardStyle = (plan: 'free' | 'pro' | 'team') => {
    const isSelected = selectedPlan === plan;
    if (isSelected) {
      return {
        backgroundColor: plan === 'pro' ? undefined : 'rgba(255,255,255,0.02)',
        background: plan === 'pro' ? 'linear-gradient(180deg, rgba(212,160,23,0.1) 0%, rgba(212,160,23,0.03) 50%, transparent 100%)' : undefined,
        border: `2px solid ${GOLD}`,
        boxShadow: '0 0 40px rgba(212, 160, 23, 0.2)',
      };
    }
    return {
      backgroundColor: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.1)',
    };
  };

  const getCtaStyle = (plan: 'free' | 'pro' | 'team') => {
    const isSelected = selectedPlan === plan;
    if (isSelected) {
      return { backgroundColor: GOLD, color: '#000' };
    }
    return { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' };
  };

  const getBonusStyle = (plan: 'pro' | 'team') => {
    const isSelected = selectedPlan === plan;
    if (isSelected) {
      return { backgroundColor: 'rgba(0,0,0,0.2)', color: '#000' };
    }
    return { backgroundColor: 'rgba(212,160,23,0.2)', color: GOLD };
  };

  const ctaText = isEnterprise ? 'Contact Sales' : 'Get started';
  const bonusText = isAnnual ? '+1 month free' : '+1 week free';

  const sliderStyles: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '128px',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255,255,255,0.1)',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#000' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .pricing-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #D4A017;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 10px rgba(212,160,23,0.5);
        }
        .pricing-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #D4A017;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 10px rgba(212,160,23,0.5);
        }
      `}} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-1">Choose your plan</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Simple, transparent pricing. No hidden fees.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-center text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
            {error}
          </div>
        )}

        {/* Controls Row */}
        <div className="flex items-center justify-center gap-6 mb-6">
          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setIsAnnual(false)} className="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all" style={{ backgroundColor: !isAnnual ? GOLD : 'transparent', color: !isAnnual ? '#000' : 'rgba(255,255,255,0.5)' }}>Monthly</button>
            <button onClick={() => setIsAnnual(true)} className="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all flex items-center gap-2" style={{ backgroundColor: isAnnual ? GOLD : 'transparent', color: isAnnual ? '#000' : 'rgba(255,255,255,0.5)' }}>
              Annual
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#10B981', color: '#fff' }}>−20%</span>
            </button>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-4 px-5 py-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-sm font-medium" style={{ color: GOLD }}>Listings:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>10</span>
              <input type="range" min="0" max="8" value={sliderIndex} onChange={(e) => setSliderIndex(parseInt(e.target.value))} className="pricing-slider" style={sliderStyles} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>150+</span>
            </div>
            <span className="text-xl font-bold w-12" style={{ color: GOLD }}>{currentTier.listings}</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          {/* FREE */}
          <div onClick={() => setSelectedPlan('free')} className="rounded-2xl p-5 relative cursor-pointer transition-all duration-300" style={getCardStyle('free')}>
            {selectedPlan === 'free' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: GOLD, color: '#000' }}>Selected</div>}
            <div style={{ height: '60px' }}><h2 className="text-xl font-bold">Free</h2><p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Try SnapR risk-free</p></div>
            <div style={{ height: '50px' }} className="flex items-baseline"><span className="text-4xl font-bold">$0</span></div>
            <div style={{ height: '100px' }}>
              <div className="p-3 rounded-xl h-full" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <div className="flex justify-between text-sm mb-1.5"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Listings</span><span className="font-semibold">3</span></div>
                <div className="flex justify-between text-sm mb-1.5"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Photos per listing</span><span className="font-semibold">10</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'rgba(255,255,255,0.5)' }}>Total downloads</span><span className="font-semibold">30 images</span></div>
              </div>
            </div>
            <div style={{ height: '50px' }} className="flex items-center">
              <button onClick={(e) => { e.stopPropagation(); if (selectedPlan === 'free') handleCheckout(); }} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2" style={getCtaStyle('free')}>
                {loading && selectedPlan === 'free' ? <LoadingSpinner /> : (isEnterprise ? 'Contact Sales' : 'Get started free')}
              </button>
            </div>
            <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <ul className="space-y-2">
                {['15 AI enhancement tools', 'Content Studio (limited)', 'Basic photo scoring', 'Watermarked exports'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}><CheckIcon />{f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* PRO */}
          <div onClick={() => setSelectedPlan('pro')} className="rounded-2xl p-5 relative cursor-pointer transition-all duration-300" style={getCardStyle('pro')}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: GOLD, color: '#000' }}>{selectedPlan === 'pro' ? 'Selected' : 'Most Popular'}</div>
            <div style={{ height: '60px' }}><h2 className="text-xl font-bold">Pro</h2><p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>For agents & photographers</p></div>
            <div style={{ height: '50px' }} className="flex items-baseline">
              <span className="text-4xl font-bold" style={{ color: GOLD }}>{isEnterprise ? 'Custom' : `$${proCalc.price}`}</span>
              {!isEnterprise && <span className="text-base ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>/listing</span>}
            </div>
            <div style={{ height: '100px' }}>
              <div className="p-3 rounded-xl h-full" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {isEnterprise ? (
                  <><div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>High-volume pricing</div><div className="text-lg font-bold">Contact us</div></>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{currentTier.listings} listings × ${proCalc.price}</span>
                      <span className="text-lg font-bold">${proCalc.total}<span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span></span>
                    </div>
                    {isAnnual && proCalc.savings > 0 && <div className="text-xs text-right" style={{ color: '#34D399' }}>Save ${proCalc.savings.toLocaleString()}/year</div>}
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>75 photos per listing included</div>
                  </>
                )}
              </div>
            </div>
            <div style={{ height: '50px' }} className="flex items-center">
              <button onClick={(e) => { e.stopPropagation(); if (selectedPlan === 'pro') handleCheckout(); }} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all" style={getCtaStyle('pro')}>
                {loading && selectedPlan === 'pro' ? <LoadingSpinner /> : ctaText}
                {!isEnterprise && !loading && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={getBonusStyle('pro')}>{bonusText}</span>}
              </button>
            </div>
            <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <ul className="space-y-2">
                {['Listing Intelligence AI', 'Photo Culling AI', 'Content Studio — 150+ templates', 'Video, Email, Property Sites'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}><CheckIcon />{f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* TEAM */}
          <div onClick={() => setSelectedPlan('team')} className="rounded-2xl p-5 relative cursor-pointer transition-all duration-300" style={getCardStyle('team')}>
            {selectedPlan === 'team' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: GOLD, color: '#000' }}>Selected</div>}
            <div style={{ height: '60px' }}><h2 className="text-xl font-bold">Team</h2><p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>For brokerages & teams</p></div>
            <div style={{ height: '50px' }} className="flex items-baseline">
              <span className="text-4xl font-bold" style={{ color: GOLD }}>{isEnterprise ? 'Custom' : `$${teamCalc.price}`}</span>
              {!isEnterprise && <span className="text-base ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>/listing + base</span>}
            </div>
            <div style={{ height: '100px' }}>
              <div className="p-3 rounded-xl h-full" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <div className="flex gap-1.5 mb-2">
                  {TEAM_OPTIONS.map((opt, i) => (
                    <button key={opt.users} onClick={(e) => { e.stopPropagation(); setTeamSizeIndex(i); }} className="flex-1 py-1 rounded text-xs font-medium cursor-pointer transition-all" style={{ backgroundColor: i === teamSizeIndex ? GOLD : 'rgba(255,255,255,0.05)', color: i === teamSizeIndex ? '#000' : 'rgba(255,255,255,0.5)' }}>
                      {i === 0 ? `${opt.users} users` : opt.users}
                    </button>
                  ))}
                </div>
                {isEnterprise ? (
                  <><div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>High-volume pricing</div><div className="font-semibold">Contact us</div></>
                ) : (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>${teamCalc.base} base + {currentTier.listings}×${teamCalc.price}</span>
                    <span className="font-semibold">${teamCalc.total?.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: '50px' }} className="flex items-center">
              <button onClick={(e) => { e.stopPropagation(); if (selectedPlan === 'team') handleCheckout(); }} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all" style={getCtaStyle('team')}>
                {loading && selectedPlan === 'team' ? <LoadingSpinner /> : ctaText}
                {!isEnterprise && !loading && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={getBonusStyle('team')}>{bonusText}</span>}
              </button>
            </div>
            <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Everything in Pro, plus:</p>
              <ul className="space-y-2">
                {['Up to 25 team members', 'Roles, permissions & analytics', 'Shared assets & brand enforcement', 'Dedicated account manager'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}><CheckIcon />{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Add-ons */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Premium Add-ons</h3>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Pay as you go</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {ADDONS.map((addon) => (
              <div key={addon.name} onClick={() => handleAddonPurchase(addon.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:border-amber-500/50" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(212,160,23,0.1)' }}><AddonIcon type={addon.icon} /></div>
                <h4 className="font-semibold text-sm mb-1">{addon.name}</h4>
                <p className="text-xs" style={{ color: GOLD }}>{addon.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-6 opacity-40">
            {['RE/MAX', 'Keller Williams', 'Coldwell Banker', 'Century 21'].map((brand) => (
              <span key={brand} className="text-sm font-medium">{brand}</span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Questions?</span>
            <Link href="/contact" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Contact sales</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
