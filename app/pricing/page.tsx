'use client';

import { useState, useMemo } from 'react';

// Pro plan pricing tiers (slider-based)
const PRO_TIERS = [
  { listings: 10, monthly: 25, annual: 20 },
  { listings: 15, monthly: 23, annual: 18 },
  { listings: 20, monthly: 21, annual: 17 },
  { listings: 25, monthly: 20, annual: 16 },
  { listings: 30, monthly: 19, annual: 15 },
  { listings: 40, monthly: 18, annual: 14 },
  { listings: 50, monthly: 17, annual: 13 },
  { listings: 75, monthly: 15, annual: 12 },
  { listings: 100, monthly: 14, annual: 11 },
];

// Team plan options
const TEAM_OPTIONS = [
  { users: 5, base: 299, perListing: 12 },
  { users: 10, base: 499, perListing: 10 },
  { users: 25, base: 899, perListing: 8 },
];

// Brand colors
const GOLD = '#D4A017';
const GOLD_DARK = '#B8860B';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [proSliderIndex, setProSliderIndex] = useState(4);
  const [teamOptionIndex, setTeamOptionIndex] = useState(0);

  const proTier = PRO_TIERS[proSliderIndex];
  const teamOption = TEAM_OPTIONS[teamOptionIndex];

  const proCalc = useMemo(() => {
    const price = isAnnual ? proTier.annual : proTier.monthly;
    const total = proTier.listings * price;
    const savings = isAnnual ? (proTier.monthly - proTier.annual) * proTier.listings * 12 : 0;
    return { price, total, savings };
  }, [proTier, isAnnual]);

  const teamCalc = useMemo(() => {
    const base = isAnnual ? Math.round(teamOption.base * 0.8) : teamOption.base;
    const perListing = isAnnual ? Math.round(teamOption.perListing * 0.8) : teamOption.perListing;
    return { base, perListing };
  }, [teamOption, isAnnual]);

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

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-6 mb-16 sm:mb-20">
          
          {/* PRO PLAN */}
          <div 
            className="relative rounded-2xl p-6 sm:p-8 lg:p-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Pro</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>For individual agents and photographers</p>
            </div>

            {/* Slider Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-baseline justify-between mb-5 sm:mb-6">
                <div>
                  <span className="text-4xl sm:text-5xl font-semibold">{proTier.listings}</span>
                  <span className="ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>listings/mo</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-semibold" style={{ color: GOLD }}>${proCalc.price}</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>per listing</div>
                </div>
              </div>

              {/* Slider */}
              <div className="relative mb-3">
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
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-150"
                  style={{ 
                    left: `calc(${(proSliderIndex / (PRO_TIERS.length - 1)) * 100}% - 10px)`,
                    backgroundColor: GOLD,
                    boxShadow: `0 0 16px ${GOLD}80`
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={PRO_TIERS.length - 1}
                  value={proSliderIndex}
                  onChange={(e) => setProSliderIndex(parseInt(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ height: '28px', top: '-10px' }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {PRO_TIERS.map((tier, i) => (
                  <span 
                    key={tier.listings}
                    style={{ 
                      color: i === proSliderIndex ? GOLD : undefined,
                      fontWeight: i === proSliderIndex ? 600 : undefined
                    }}
                  >
                    {tier.listings}
                  </span>
                ))}
              </div>
            </div>

            {/* Monthly Total */}
            <div 
              className="p-4 rounded-xl mb-6 sm:mb-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Monthly total</span>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-semibold">${proCalc.total}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                </div>
              </div>
              {isAnnual && proCalc.savings > 0 && (
                <div className="text-sm mt-1 text-right" style={{ color: '#34D399' }}>
                  Save ${proCalc.savings}/year
                </div>
              )}
            </div>

            {/* CTA */}
            <button 
              className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
            >
              Get started
            </button>

            {/* Features */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-sm font-medium mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Everything you need:</div>
              <ul className="space-y-3">
                {[
                  '75 photos per listing',
                  '15 AI enhancement tools',
                  'Content Studio — 150+ templates',
                  'Video Creator',
                  'Property Sites',
                  'Listing Intelligence AI',
                  'Email Marketing',
                  'Client Approval workflow',
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
            className="relative rounded-2xl p-6 sm:p-8 lg:p-10"
            style={{ 
              background: `linear-gradient(180deg, ${GOLD}18 0%, ${GOLD}08 40%, transparent 100%)`,
              border: `1px solid ${GOLD}50`
            }}
          >
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div 
                className="px-4 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: GOLD, color: '#000000' }}
              >
                Best for teams
              </div>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Team</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>For brokerages and growing teams</p>
            </div>

            {/* Team Size */}
            <div className="mb-6 sm:mb-8">
              <div className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Team size</div>
              <div className="grid grid-cols-3 gap-2">
                {TEAM_OPTIONS.map((option, i) => (
                  <button
                    key={option.users}
                    onClick={() => setTeamOptionIndex(i)}
                    className="py-3 rounded-lg text-sm font-medium transition-all"
                    style={{ 
                      backgroundColor: i === teamOptionIndex ? GOLD : 'rgba(255,255,255,0.05)',
                      color: i === teamOptionIndex ? '#000000' : 'rgba(255,255,255,0.6)',
                      border: i === teamOptionIndex ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {option.users} users
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl sm:text-5xl font-semibold">${teamCalc.base}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>/mo</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                + <span style={{ color: GOLD }} className="font-medium">${teamCalc.perListing}</span> per listing
              </div>
              {isAnnual && (
                <div className="text-sm mt-2" style={{ color: '#34D399' }}>
                  20% off with annual billing
                </div>
              )}
            </div>

            {/* Example */}
            <div 
              className="p-4 rounded-xl mb-6 sm:mb-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Example: 50 listings/month</div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Monthly total</span>
                <span className="text-xl sm:text-2xl font-semibold">
                  ${teamCalc.base + (50 * teamCalc.perListing)}
                  <span className="text-base font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                </span>
              </div>
            </div>

            {/* CTA */}
            <button 
              className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: GOLD, color: '#000000' }}
            >
              Start free trial
            </button>

            {/* Features */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-sm font-medium mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Everything in Pro, plus:</div>
              <ul className="space-y-3">
                {[
                  'Up to 25 team members',
                  'Roles & permissions',
                  'Shared asset library',
                  'Team analytics dashboard',
                  'Centralized billing',
                  'Brand enforcement',
                  'Priority support',
                  'White-label options',
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

        {/* Add-ons */}
        <div className="text-center mb-16 sm:mb-20">
          <div 
            className="inline-flex items-center gap-3 px-5 sm:px-6 py-3 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm sm:text-base">
              Premium add-ons: Floor Plans, Virtual Tours, Renovations, AI Voiceovers
            </span>
            <span style={{ color: GOLD }} className="font-medium">→</span>
          </div>
        </div>

        {/* Comparison */}
        <div className="mb-16 sm:mb-20">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8 sm:mb-10">
            See how SnapR compares
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { name: 'SnapR', price: `$${proCalc.price}`, time: '30 seconds', tools: '15 AI tools', highlight: true },
              { name: 'BoxBrownie', price: '$190+', time: '24-48 hrs', tools: 'Manual', highlight: false },
              { name: 'PhotoUp', price: '$200+', time: '24 hours', tools: 'Manual', highlight: false },
              { name: 'Fotello', price: '$12-20', time: '10 seconds', tools: 'Limited', highlight: false },
            ].map((comp) => (
              <div 
                key={comp.name} 
                className="p-4 sm:p-6 rounded-2xl"
                style={{ 
                  background: comp.highlight ? `linear-gradient(180deg, ${GOLD}15 0%, transparent 100%)` : 'rgba(255,255,255,0.02)',
                  border: comp.highlight ? `1px solid ${GOLD}50` : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div 
                  className="font-semibold mb-4 sm:mb-5"
                  style={{ color: comp.highlight ? GOLD : 'rgba(255,255,255,0.4)' }}
                >
                  {comp.name}
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <div 
                      className="text-lg sm:text-2xl font-semibold"
                      style={{ color: comp.highlight ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}
                    >
                      {comp.price}
                    </div>
                    <div 
                      className="text-xs sm:text-sm"
                      style={{ color: comp.highlight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)' }}
                    >
                      per listing
                    </div>
                  </div>
                  <div>
                    <div 
                      className="text-sm sm:text-lg font-medium"
                      style={{ color: comp.highlight ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}
                    >
                      {comp.time}
                    </div>
                    <div 
                      className="text-xs sm:text-sm"
                      style={{ color: comp.highlight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)' }}
                    >
                      turnaround
                    </div>
                  </div>
                  <div>
                    <div 
                      className="text-sm sm:text-lg font-medium"
                      style={{ color: comp.highlight ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}
                    >
                      {comp.tools}
                    </div>
                    <div 
                      className="text-xs sm:text-sm"
                      style={{ color: comp.highlight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)' }}
                    >
                      included
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Savings */}
          <div 
            className="mt-6 sm:mt-8 p-4 rounded-xl text-center"
            style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <span className="font-medium" style={{ color: '#34D399' }}>
              Save 90%+ compared to traditional editing services
            </span>
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
          <button 
            className="px-6 py-3 rounded-xl font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Contact sales
          </button>
        </div>
      </div>
    </div>
  );
}
