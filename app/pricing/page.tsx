'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

// Calendly URL - replace with your actual Calendly link
const CALENDLY_URL = 'https://calendly.com/snapr-demo/30min';

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
  const [proSliderIndex, setProSliderIndex] = useState(4); // Default 75 listings
  const [teamSliderIndex, setTeamSliderIndex] = useState(4); // Separate slider for Team
  const [teamOptionIndex, setTeamOptionIndex] = useState(0);
  const [loading, setLoading] = useState<'pro' | 'team' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'team'>('pro');
  const [showModal, setShowModal] = useState(false);
  const [modalPlan, setModalPlan] = useState<'pro' | 'team'>('pro');

  // Load Calendly widget script and styles
  useEffect(() => {
    // Add Calendly CSS
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Add Calendly JS
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  const openBookingModal = (plan: 'pro' | 'team') => {
    setModalPlan(plan);
    setShowModal(true);
  };

  const openCalendly = () => {
    // @ts-ignore - Calendly is loaded via script
    if (window.Calendly) {
      // @ts-ignore
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    } else {
      // Fallback: open in new tab
      window.open(CALENDLY_URL, '_blank');
    }
    setShowModal(false);
  };

  const continueToCheckout = () => {
    setShowModal(false);
    handleCheckout(modalPlan);
  };

  const proTier = PRO_TIERS[proSliderIndex];
  const teamTier = PRO_TIERS[teamSliderIndex];
  const teamOption = TEAM_OPTIONS[teamOptionIndex];

  const isProEnterprise = proTier.listings === 'enterprise';
  const isTeamEnterprise = teamTier.listings === 'enterprise';

  const handleCheckout = async (plan: 'pro' | 'team') => {
    setLoading(plan);
    try {
      const listings = plan === 'pro' ? proTier.listings : teamTier.listings;
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          listings,
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

  const proCalc = useMemo(() => {
    if (isProEnterprise) {
      return { price: null, total: null, savings: 0 };
    }
    const price = isAnnual ? proTier.annual : proTier.monthly;
    const total = (proTier.listings as number) * (price as number);
    const savings = isAnnual ? ((proTier.monthly as number) - (proTier.annual as number)) * (proTier.listings as number) * 12 : 0;
    return { price, total, savings };
  }, [proTier, isAnnual, isProEnterprise]);

  const teamCalc = useMemo(() => {
    const base = isAnnual ? teamOption.baseAnnual : teamOption.baseMonthly;
    if (isTeamEnterprise) {
      return { base, price: null, listingCost: null, total: null };
    }
    const price = isAnnual ? teamTier.annual : teamTier.monthly;
    const listingCost = (teamTier.listings as number) * (price as number);
    const total = base + listingCost;
    return { base, price, listingCost, total };
  }, [teamOption, teamTier, isAnnual, isTeamEnterprise]);

  // Card styles based on selection
  const getCardStyle = (plan: 'free' | 'pro' | 'team') => {
    const isSelected = selectedPlan === plan;
    if (isSelected) {
      return {
        background: `linear-gradient(180deg, ${GOLD}15 0%, ${GOLD}05 40%, transparent 100%)`,
        border: `1px solid ${GOLD}50`
      };
    }
    return {
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)'
    };
  };

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

        {/* Pricing Cards - 3 Column Layout with equal heights */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16 sm:mb-20 items-stretch">
          
          {/* FREE PLAN */}
          <div 
            className="relative rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col"
            style={getCardStyle('free')}
            onClick={() => setSelectedPlan('free')}
          >
            {selectedPlan === 'free' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div 
                  className="px-4 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: GOLD, color: '#000000' }}
                >
                  Selected
                </div>
              </div>
            )}

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
              style={{ 
                backgroundColor: selectedPlan === 'free' ? GOLD : 'rgba(255,255,255,0.1)', 
                color: selectedPlan === 'free' ? '#000000' : '#FFFFFF', 
                border: selectedPlan === 'free' ? 'none' : '1px solid rgba(255,255,255,0.2)' 
              }}
            >
              Get started free
            </Link>

            {/* Features - flex-grow to push to bottom */}
            <div className="mt-6 pt-6 flex-grow" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
            className="relative rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col"
            style={getCardStyle('pro')}
            onClick={() => setSelectedPlan('pro')}
          >
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div 
                className="px-4 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: GOLD, color: '#000000' }}
              >
                {selectedPlan === 'pro' ? 'Selected' : 'Most Popular'}
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
                    {isProEnterprise ? '150+' : proTier.listings}
                  </span>
                  <span className="ml-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>listings/mo</span>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-semibold" style={{ color: GOLD }}>
                    {isProEnterprise ? 'Custom' : `$${proCalc.price}`}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {isProEnterprise ? 'pricing' : 'per listing'}
                  </div>
                </div>
              </div>

              {/* Pro Slider */}
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
                  onChange={(e) => {
                    setProSliderIndex(parseInt(e.target.value));
                    setSelectedPlan('pro');
                  }}
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
            {isProEnterprise ? (
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
            {isProEnterprise ? (
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
                  onClick={() => openBookingModal('pro')}
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
            <div className="mt-6 pt-6 flex-grow" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
            className="relative rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col"
            style={getCardStyle('team')}
            onClick={() => setSelectedPlan('team')}
          >
            {selectedPlan === 'team' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div 
                  className="px-4 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: GOLD, color: '#000000' }}
                >
                  Selected
                </div>
              </div>
            )}

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
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeamOptionIndex(i);
                      setSelectedPlan('team');
                    }}
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

            {/* Team Listings Slider */}
            <div className="mb-4">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-2xl font-semibold">
                    {isTeamEnterprise ? '150+' : teamTier.listings}
                  </span>
                  <span className="ml-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>listings/mo</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold" style={{ color: GOLD }}>
                    {isTeamEnterprise ? 'Custom' : `$${teamCalc.price}`}
                  </span>
                  <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {isTeamEnterprise ? '' : '/listing'}
                  </span>
                </div>
              </div>

              {/* Team Slider - SEPARATE from Pro */}
              <div className="relative mb-2">
                <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div 
                    className="absolute h-full rounded-full transition-all duration-150"
                    style={{ 
                      width: `${(teamSliderIndex / (PRO_TIERS.length - 1)) * 100}%`,
                      background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})`
                    }}
                  />
                </div>
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-150"
                  style={{ 
                    left: `calc(${(teamSliderIndex / (PRO_TIERS.length - 1)) * 100}% - 6px)`,
                    backgroundColor: GOLD,
                    boxShadow: `0 0 8px ${GOLD}80`
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={PRO_TIERS.length - 1}
                  value={teamSliderIndex}
                  onChange={(e) => {
                    e.stopPropagation();
                    setTeamSliderIndex(parseInt(e.target.value));
                    setSelectedPlan('team');
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ height: '20px', top: '-6px' }}
                />
              </div>
              <div className="flex justify-between text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {PRO_TIERS.map((tier, i) => (
                  <span 
                    key={String(tier.listings)}
                    style={{ 
                      color: i === teamSliderIndex ? GOLD : undefined,
                      fontWeight: i === teamSliderIndex ? 600 : undefined
                    }}
                  >
                    {tier.listings === 'enterprise' ? '150+' : tier.listings}
                  </span>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            {isTeamEnterprise ? (
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
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{teamTier.listings} listings × ${teamCalc.price}</span>
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
            {isTeamEnterprise ? (
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
                  onClick={() => openBookingModal('team')}
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
            <div className="mt-6 pt-6 flex-grow" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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

      {/* Demo/Subscribe Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-md rounded-2xl p-6 sm:p-8"
            style={{ backgroundColor: '#111111', border: `1px solid ${GOLD}30` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full transition-all hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${GOLD}15` }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-semibold mb-3">
                Ready to get started?
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                Not sure yet? Book a quick demo with our team to see SnapR in action before you subscribe.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Continue to Subscribe - Primary */}
              <button
                onClick={continueToCheckout}
                disabled={loading === modalPlan}
                className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
              >
                {loading === modalPlan ? (
                  'Loading...'
                ) : (
                  <>
                    Continue to subscribe
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Book a Demo - Secondary */}
              <button
                onClick={openCalendly}
                className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}50` }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Book a demo first
              </button>

              <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                30-minute call • See all features • Ask questions
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
