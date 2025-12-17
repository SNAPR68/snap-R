'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Pro plan pricing tiers (slider-based)
const PRO_TIERS = [
  { listings: 10, monthly: 25, annual: 20 },
  { listings: 20, monthly: 22, annual: 18 },
  { listings: 30, monthly: 19, annual: 15 },
  { listings: 50, monthly: 17, annual: 13 },
  { listings: 75, monthly: 15, annual: 12 },
  { listings: 100, monthly: 14, annual: 11 },
  { listings: 125, monthly: 13, annual: 10 },
  { listings: 150, monthly: 12, annual: 9 },
  { listings: 'enterprise', monthly: null, annual: null },
];

// Team plan options (base fee for users only - listings use same pricing as Pro)
const TEAM_OPTIONS = [
  { users: 5, baseMonthly: 199, baseAnnual: 149 },
  { users: 10, baseMonthly: 399, baseAnnual: 299 },
  { users: 25, baseMonthly: 649, baseAnnual: 499 },
];

// Premium Add-ons
const ADDONS = [
  { 
    name: 'Floor Plans', 
    description: '2D & 3D floor plans from photos',
    price: 'From $25',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    )
  },
  { 
    name: 'Virtual Tours', 
    description: '360° interactive property tours',
    price: 'From $50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    name: 'Virtual Renovation', 
    description: 'Kitchen, bath & flooring makeovers',
    price: 'From $35',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    )
  },
  { 
    name: 'AI Voiceovers', 
    description: 'Professional narration for videos',
    price: 'From $15',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    )
  },
];

// Brand colors
const GOLD = '#D4A017';
const GOLD_DARK = '#B8860B';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [proSliderIndex, setProSliderIndex] = useState(2);
  const [teamOptionIndex, setTeamOptionIndex] = useState(0);
  const [loading, setLoading] = useState<'pro' | 'team' | null>(null);

  const proTier = PRO_TIERS[proSliderIndex];
  const teamOption = TEAM_OPTIONS[teamOptionIndex];

  const handleCheckout = async (plan: 'pro' | 'team') => {
    setLoading(plan);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          listings: proTier.listings,
          teamSize: plan === 'team' ? teamOption.users : undefined,
          isAnnual,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const isEnterprise = proTier.listings === 'enterprise';

  const proCalc = useMemo(() => {
    if (isEnterprise) {
      return { price: null, total: null, savings: 0 };
    }
    const price = isAnnual ? proTier.annual : proTier.monthly;
    const total = (proTier.listings as number) * price;
    const savings = isAnnual ? (proTier.monthly - proTier.annual) * (proTier.listings as number) * 12 : 0;
    return { price, total, savings };
  }, [proTier, isAnnual, isEnterprise]);

  const teamCalc = useMemo(() => {
    const base = isAnnual ? teamOption.baseAnnual : teamOption.baseMonthly;
    // Team uses same per-listing pricing as Pro
    if (isEnterprise) {
      return { base, listingCost: null, total: null };
    }
    const pricePerListing = isAnnual ? proTier.annual : proTier.monthly;
    const listingCost = (proTier.listings as number) * (pricePerListing as number);
    const total = base + listingCost;
    return { base, listingCost, total };
  }, [teamOption, isAnnual, proTier, isEnterprise]);

  return (
    <div className="min-h-screen text-white antialiased overflow-x-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl" 
          style={{ background: `radial-gradient(circle, ${GOLD}20 0%, transparent 70%)` }} 
        />
        <div 
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl" 
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} 
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}50` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
            <span style={{ color: GOLD }} className="text-sm font-medium">Simple, transparent pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
            Choose your plan
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Everything you need to transform your listings. No hidden fees.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div 
            className="inline-flex items-center p-1 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <button
              onClick={() => setIsAnnual(false)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{ 
                backgroundColor: !isAnnual ? '#FFFFFF' : 'transparent',
                color: !isAnnual ? '#000000' : 'rgba(255,255,255,0.5)'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
              style={{ 
                backgroundColor: isAnnual ? '#FFFFFF' : 'transparent',
                color: isAnnual ? '#000000' : 'rgba(255,255,255,0.5)'
              }}
            >
              Annual
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: isAnnual ? '#10B981' : 'rgba(16,185,129,0.2)',
                  color: isAnnual ? '#FFFFFF' : '#34D399'
                }}
              >
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards - 3 Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16 sm:mb-20">
          
          {/* FREE PLAN */}
          <div 
            className="relative rounded-2xl p-6 sm:p-8"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Free</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Try SnapR with no commitment</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-semibold">$0</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>/forever</span>
              </div>
            </div>

            {/* Limits */}
            <div 
              className="p-4 rounded-xl mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Listings</span>
                <span className="font-semibold">5/month</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Downloads</span>
                <span className="font-semibold">50 images</span>
              </div>
            </div>

            {/* CTA */}
            <Link 
              href="/auth/signup"
              className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Get started free
            </Link>

            {/* Features */}
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <ul className="space-y-3">
                {[
                  '15 AI enhancement tools',
                  'Content Studio access',
                  'Watermarked exports',
                  'Email support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PRO PLAN */}
          <div 
            className="relative rounded-2xl p-6 sm:p-8"
            style={{ 
              background: `linear-gradient(180deg, ${GOLD}15 0%, ${GOLD}05 40%, transparent 100%)`,
              border: `1px solid ${GOLD}50`
            }}
          >
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div 
                className="px-4 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: GOLD, color: '#000000' }}
              >
                Most Popular
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Pro</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>For agents and photographers</p>
            </div>

            {/* Slider Section */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-3xl sm:text-4xl font-semibold">
                    {isEnterprise ? '150+' : proTier.listings}
                  </span>
                  <span className="ml-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>listings/mo</span>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-semibold" style={{ color: GOLD }}>
                    {isEnterprise ? 'Custom' : `$${proCalc.price}`}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {isEnterprise ? 'pricing' : 'per listing'}
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="relative mb-2">
                <div className="h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div 
                    className="absolute h-full rounded-full transition-all duration-150"
                    style={{ 
                      width: `${(proSliderIndex / (PRO_TIERS.length - 1)) * 100}%`,
                      background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})`
                    }}
                  />
                </div>
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-150"
                  style={{ 
                    left: `calc(${(proSliderIndex / (PRO_TIERS.length - 1)) * 100}% - 8px)`,
                    backgroundColor: GOLD,
                    boxShadow: `0 0 12px ${GOLD}80`
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={PRO_TIERS.length - 1}
                  value={proSliderIndex}
                  onChange={(e) => setProSliderIndex(parseInt(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ height: '24px', top: '-8px' }}
                />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {PRO_TIERS.map((tier, i) => (
                  <span 
                    key={String(tier.listings)}
                    style={{ 
                      color: i === proSliderIndex ? GOLD : undefined,
                      fontWeight: i === proSliderIndex ? 600 : undefined
                    }}
                  >
                    {tier.listings === 'enterprise' ? '150+' : tier.listings}
                  </span>
                ))}
              </div>
            </div>

            {/* Monthly Total */}
            {isEnterprise ? (
              <div 
                className="p-3 rounded-xl mb-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Custom pricing for high-volume needs
                </p>
              </div>
            ) : (
              <div 
                className="p-3 rounded-xl mb-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Monthly total</span>
                  <div>
                    <span className="text-lg font-semibold">${proCalc.total}</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                  </div>
                </div>
                {isAnnual && proCalc.savings > 0 && (
                  <div className="text-xs mt-1 text-right" style={{ color: '#34D399' }}>
                    Save ${proCalc.savings}/year
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            {isEnterprise ? (
              <Link 
                href="/contact?plan=enterprise"
                className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: GOLD, color: '#000000' }}
              >
                Contact Sales
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => handleCheckout('pro')}
                  disabled={loading === 'pro'}
                  className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
                >
                  {loading === 'pro' ? 'Loading...' : 'Get started'}
                </button>
                <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {isAnnual ? 'Your first year includes a bonus month — on us' : 'Your first month includes a bonus week — on us'}
                </p>
              </>
            )}

            {/* Features */}
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <ul className="space-y-2">
                {[
                  '75 photos per listing',
                  '15 AI enhancement tools',
                  'Content Studio — 150+ templates',
                  'Video Creator',
                  'Property Sites',
                  'Listing Intelligence AI',
                  'Unwatermarked exports',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* TEAM PLAN */}
          <div 
            className="relative rounded-2xl p-6 sm:p-8"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Team</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>For brokerages and teams</p>
            </div>

            {/* Team Size */}
            <div className="mb-4">
              <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Team size</div>
              <div className="grid grid-cols-3 gap-2">
                {TEAM_OPTIONS.map((option, i) => (
                  <button
                    key={option.users}
                    onClick={() => setTeamOptionIndex(i)}
                    className="py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ 
                      backgroundColor: i === teamOptionIndex ? GOLD : 'rgba(255,255,255,0.05)',
                      color: i === teamOptionIndex ? '#000000' : 'rgba(255,255,255,0.6)',
                      border: i === teamOptionIndex ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {option.users}
                  </button>
                ))}
              </div>
            </div>

            {/* Listings - Same slider as Pro */}
            <div className="mb-4">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-2xl font-semibold">
                    {isEnterprise ? '150+' : proTier.listings}
                  </span>
                  <span className="ml-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>listings/mo</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold" style={{ color: GOLD }}>
                    {isEnterprise ? 'Custom' : `$${proCalc.price}`}
                  </span>
                  <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {isEnterprise ? '' : '/listing'}
                  </span>
                </div>
              </div>

              {/* Slider - shares with Pro */}
              <div className="relative mb-2">
                <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div 
                    className="absolute h-full rounded-full transition-all duration-150"
                    style={{ 
                      width: `${(proSliderIndex / (PRO_TIERS.length - 1)) * 100}%`,
                      background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})`
                    }}
                  />
                </div>
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-150"
                  style={{ 
                    left: `calc(${(proSliderIndex / (PRO_TIERS.length - 1)) * 100}% - 6px)`,
                    backgroundColor: GOLD,
                    boxShadow: `0 0 8px ${GOLD}80`
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={PRO_TIERS.length - 1}
                  value={proSliderIndex}
                  onChange={(e) => setProSliderIndex(parseInt(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ height: '20px', top: '-6px' }}
                />
              </div>
              <div className="flex justify-between text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {PRO_TIERS.map((tier, i) => (
                  <span 
                    key={String(tier.listings)}
                    style={{ 
                      color: i === proSliderIndex ? GOLD : undefined,
                      fontWeight: i === proSliderIndex ? 600 : undefined
                    }}
                  >
                    {tier.listings === 'enterprise' ? '150+' : tier.listings}
                  </span>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            {isEnterprise ? (
              <div 
                className="p-3 rounded-xl mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Custom pricing for 150+ listings
                </p>
              </div>
            ) : (
              <div 
                className="p-3 rounded-xl mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center justify-between text-sm mb-1">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{teamOption.users} users base</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>${teamCalc.base}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{proTier.listings} listings × ${proCalc.price}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>${teamCalc.listingCost}</span>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-semibold">
                    ${teamCalc.total}
                    <span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                  </span>
                </div>
              </div>
            )}

            {/* CTA */}
            {isEnterprise ? (
              <Link 
                href="/contact?plan=enterprise-team"
                className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: GOLD, color: '#000000' }}
              >
                Contact Sales
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => handleCheckout('team')}
                  disabled={loading === 'team'}
                  className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: GOLD, color: '#000000' }}
                >
                  {loading === 'team' ? 'Loading...' : 'Get started'}
                </button>
                <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {isAnnual ? 'Your first year includes a bonus month — on us' : 'Your first month includes a bonus week — on us'}
                </p>
              </>
            )}

            {/* Features */}
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Everything in Pro, plus:</div>
              <ul className="space-y-2">
                {[
                  'Up to 25 team members',
                  'Roles & permissions',
                  'Team analytics',
                  'Centralized billing',
                  'Priority support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Premium Add-ons Section */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">Premium Add-ons</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              Enhance your listings with powerful extras. Available anytime from your dashboard.
            </p>
          </div>

          {/* Add-ons Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {ADDONS.map((addon) => (
              <div 
                key={addon.name}
                className="p-5 rounded-2xl transition-all hover:scale-[1.02]"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)' 
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
                >
                  {addon.icon}
                </div>
                <h3 className="font-semibold mb-1">{addon.name}</h3>
                <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{addon.description}</p>
                <p className="text-sm font-medium" style={{ color: GOLD }}>{addon.price}</p>
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div 
            className="p-4 rounded-xl flex items-center gap-4"
            style={{ backgroundColor: `${GOLD}10`, border: `1px solid ${GOLD}30` }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${GOLD}20` }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium" style={{ color: GOLD }}>Pay as you go</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Add-ons are purchased separately and can be added to any listing anytime from your dashboard. No subscription required.
              </p>
            </div>
          </div>
        </div>

        {/* Trust */}
        <div className="text-center mb-16 sm:mb-20">
          <p className="mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Trusted by real estate professionals worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-30">
            {['RE/MAX', 'Keller Williams', 'Coldwell Banker', 'Century 21'].map((brand) => (
              <div key={brand} className="text-base sm:text-lg font-semibold">{brand}</div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-semibold mb-3">Questions?</h3>
          <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Our team is here to help you find the right plan.
          </p>
          <Link 
            href="/contact"
            className="inline-block px-6 py-3 rounded-xl font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Contact sales
          </Link>
        </div>
      </div>
    </div>
  );
}
