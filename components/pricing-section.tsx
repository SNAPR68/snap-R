'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ArrowRight, Loader2, Sparkles, Crown, Diamond, Building2, Phone } from 'lucide-react';

// Slider options for listings per month
const LISTING_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300];

// Billing options with discounts
const BILLING_OPTIONS = [
  { id: 'paygo', label: 'Pay as you go', discount: 0 },
  { id: 'monthly', label: 'Monthly', discount: 0.40, badge: 'Save 40%' },
  { id: 'annual', label: 'Annual', discount: 0.60, badge: 'Save 60%' },
];

// Pricing structure matching Fotello exactly
// Gold = $28 base, Platinum = $30 base
// Volume tiers: 5-50 and 75-300 have different effective rates
const getPricePerListing = (planId: string, listings: number, billingId: string): number => {
  // Base prices (pay as you go)
  const basePrices: Record<string, number> = {
    gold: 28,
    platinum: 30,
  };

  const base = basePrices[planId] || 28;
  
  if (billingId === 'paygo') {
    return base;
  }

  // Volume-adjusted rates that match Fotello's structure
  // Gold: 5-50 monthly=$20, 75-300 monthly=$16, 5-50 annual=$16, 75-300 annual=$11
  // Platinum: 5-50 monthly=$22, 75-300 monthly=$18, 5-50 annual=$18, 75-300 annual=$12
  
  if (planId === 'gold') {
    if (billingId === 'monthly') {
      return listings >= 75 ? 16 : 20;
    } else { // annual
      return listings >= 75 ? 11 : 16;
    }
  } else if (planId === 'platinum') {
    if (billingId === 'monthly') {
      return listings >= 75 ? 18 : 22;
    } else { // annual
      return listings >= 75 ? 12 : 18;
    }
  }
  
  return base;
};

// Tier definitions
const TIERS = [
  {
    id: 'free',
    name: 'Free',
    icon: Sparkles,
    description: 'Try SnapR risk-free',
    isFree: true,
    features: [
      { name: '3 listings/month', included: true },
      { name: '30 photos per listing', included: true },
      { name: 'All 15 AI tools', included: true },
      { name: 'Watermarked exports', included: true },
      { name: 'Property Gallery', included: true },
      { name: 'HD exports', included: false },
      { name: 'Content Studio', included: false },
      { name: 'Social Posting', included: false },
    ],
  },
  {
    id: 'gold',
    name: 'SnapR Gold',
    icon: Crown,
    description: 'Best for individual agents managing active listings',
    popular: true,
    photosPerListing: 50,
    features: [
      { name: '50 photos per listing', included: true },
      { name: 'All 15 AI tools', included: true },
      { name: 'Unlimited Twilight', included: true },
      { name: '2 Virtual Staging/listing', included: true },
      { name: 'HD exports (no watermark)', included: true },
      { name: 'Content Studio (150+ templates)', included: true },
      { name: 'Social Media Posting', included: true },
      { name: 'Email Marketing', included: true },
      { name: 'AI Video Creator', included: true },
      { name: 'MLS Descriptions', included: true },
      { name: 'Listings Rollover', included: true },
    ],
  },
  {
    id: 'platinum',
    name: 'SnapR Platinum',
    icon: Diamond,
    description: 'Best for teams and brokerages that need faster workflows and deeper support',
    photosPerListing: 75,
    features: [
      { name: 'Everything in Gold, plus:', included: true, isHeader: true },
      { name: '75 photos per listing', included: true },
      { name: 'White-label branding', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Guided onboarding', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom templates', included: true },
      { name: 'Team analytics', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    description: 'For high-volume organizations that need custom onboarding, controls, and service',
    requiresCall: true,
    features: [
      { name: 'Everything in Platinum, plus:', included: true, isHeader: true },
      { name: 'Public Developer API (v1)', included: true },
      { name: 'Custom domain mapping', included: true },
      { name: 'Embeddable widgets', included: true },
      { name: 'Custom listing volume', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SLA guarantee', included: true },
      { name: 'Dedicated success manager', included: true },
    ],
  },
];

interface PricingSectionProps {
  showHeadline?: boolean;
  showFAQ?: boolean;
  showCTA?: boolean;
  showComparison?: boolean;
  showAddons?: boolean;
  headingLevel?: 'h1' | 'h2';
}

export default function PricingSection({
  showHeadline = true,
  showFAQ = false,
  showCTA = false,
  showComparison = true,
  showAddons = true,
  headingLevel = 'h2',
}: PricingSectionProps) {
  const router = useRouter();
  const [sliderIndex, setSliderIndex] = useState(2); // Default to 15 listings
  const [billingOption, setBillingOption] = useState('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('gold'); // Track selected plan

  const listings = LISTING_OPTIONS[sliderIndex];
  const requiresSales = listings > 300;

  // Calculate prices for display
  const goldPrice = getPricePerListing('gold', listings, billingOption);
  const platinumPrice = getPricePerListing('platinum', listings, billingOption);

  const goldTotal = goldPrice * listings;
  const platinumTotal = platinumPrice * listings;

  const handleSelectPlan = (planId: string, total: number, isFree?: boolean) => {
    setLoading(planId);

    if (isFree) {
      router.push('/auth/signup?plan=free');
      return;
    }

    router.push(`/auth/signup?plan=${planId}&listings=${listings}&total=${total}&billing=${billingOption}`);
  };

  const handleEnterpriseTrial = () => {
    setLoading('enterprise-trial');
    const billing = billingOption === 'annual' ? 'annual' : 'monthly';
    router.push(`/auth/signup?plan=enterprise&billing=${billing}&trial=true`);
  };

  return (
    <div>
      {/* Headline */}
      {showHeadline && (
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-sm text-green-400 uppercase tracking-wide text-[0.6875rem] mb-4">
            <Sparkles className="w-3 h-3" />
            Simple, transparent pricing
          </div>
          {headingLevel === 'h1' ? (
            <h1 className="text-3xl md:text-4xl font-bold font-serif tracking-tighter mb-3">
              Choose the Plan That Fits Your Listing Volume
            </h1>
          ) : (
            <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tighter mb-3">
              Choose the Plan That Fits Your Listing Volume
            </h2>
          )}
          <p className="text-base text-on-surface-muted max-w-2xl mx-auto">
            Every plan includes AI photo enhancement tools, with higher tiers unlocking more output, faster processing, and deeper marketing support.
          </p>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-sm">
          {BILLING_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setBillingOption(option.id)}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-all flex items-center gap-1.5 ${
                billingOption === option.id 
                  ? 'bg-primary text-black' 
                  : 'text-on-surface-muted hover:text-on-surface'
              }`}
            >
              {option.label}
              {option.badge && billingOption !== option.id && (
                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-sm">
                  {option.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Listings Slider */}
        <div className="flex items-center gap-4 w-full max-w-md">
          <span className="text-sm text-on-surface-muted whitespace-nowrap">Listings/mo:</span>
          <input
            type="range"
            min={0}
            max={LISTING_OPTIONS.length - 1}
            value={sliderIndex}
            onChange={(e) => setSliderIndex(Number(e.target.value))}
            aria-label="Number of listings"
            className="flex-1 h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="text-lg font-bold text-primary min-w-[3rem] text-right">
            {listings}
          </span>
        </div>

        {requiresSales && (
          <p className="text-sm text-primary">
            300+ listings? <Link href="/contact" className="underline">Talk to Sales About Enterprise</Link> for custom pricing.
          </p>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
        {TIERS.map((tier) => {
          const isFree = tier.isFree;
          const isEnterprise = tier.requiresCall;
          const isGold = tier.id === 'gold';
          const isPlatinum = tier.id === 'platinum';
          const isSelected = selectedPlan === tier.id;
          
          const pricePerListing = isGold ? goldPrice : isPlatinum ? platinumPrice : 0;
          const totalPrice = isGold ? goldTotal : isPlatinum ? platinumTotal : 0;
          
          const Icon = tier.icon;

          return (
            <div
              key={tier.id}
              onClick={() => !isEnterprise && setSelectedPlan(tier.id)}
              className={`relative rounded-lg p-5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary shadow-lg shadow-primary/20'
                  : 'bg-surface-container-low hover:bg-surface-container-high'
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-black text-xs font-bold rounded-sm">
                  MOST POPULAR
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-surface-container-high'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-on-surface-muted'}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isSelected ? 'text-primary' : ''}`}>{tier.name}</h3>
                </div>
              </div>

              <p className="text-xs text-on-surface-muted mb-4">{tier.description}</p>

              {/* Pricing */}
              <div className="mb-4">
                {isFree ? (
                  <div>
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-on-surface-muted text-sm">/forever</span>
                  </div>
                ) : isEnterprise ? (
                  <div>
                    <span className="text-2xl font-bold">Custom</span>
                    <p className="text-xs text-on-surface-muted">Talk to Sales About Enterprise</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">${pricePerListing}</span>
                      <span className="text-on-surface-muted text-sm">/listing</span>
                    </div>
                    {!requiresSales && listings > 0 && (
                      <p className="text-xs text-on-surface-muted mt-1">
                        {listings} listings = ${totalPrice.toLocaleString()}/mo
                      </p>
                    )}
                    {billingOption !== 'paygo' && (
                      <p className="text-[10px] text-green-400 mt-1">
                        Billed {billingOption === 'annual' ? 'yearly' : 'monthly'} • {listings} listings
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CTA Button */}
              {isEnterprise ? (
                <div className="space-y-2 mb-4">
                  <Link
                    href="/contact?plan=enterprise"
                    className="w-full py-2.5 rounded-lg font-semibold transition-all text-sm flex items-center justify-center gap-2 bg-surface-container-high text-on-surface hover:bg-surface-container-high border-outline-variant"
                  >
                    <Phone className="w-4 h-4" />
                    Talk to Sales About Enterprise
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnterpriseTrial();
                    }}
                    disabled={loading === 'enterprise-trial'}
                    className="w-full py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {loading === 'enterprise-trial' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                    ) : (
                      'Or start 14-day Enterprise Trial'
                    )}
                  </button>
                  <p className="text-[10px] text-on-surface-muted/60 text-center">
                    {billingOption === 'annual' ? '$249' : '$299'}/mo after trial
                  </p>
                </div>
              ) : requiresSales && !isFree ? (
                <Link
                  href={`/contact?plan=${tier.id}`}
                  className="w-full py-2.5 rounded-lg font-semibold transition-all mb-4 text-sm flex items-center justify-center gap-2 bg-surface-container-high text-on-surface hover:bg-surface-container-high border-outline-variant"
                >
                  <Phone className="w-4 h-4" />
                  Talk to Sales About Enterprise
                </Link>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(tier.id, totalPrice, isFree);
                  }}
                  disabled={loading === tier.id}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all mb-4 disabled:opacity-50 text-sm ${
                    isSelected
                      ? 'bg-primary text-black hover:bg-primary-container'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-high border-outline-variant'
                  }`}
                >
                  {loading === tier.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : isFree ? (
                    'Start Free'
                  ) : (
                    'Get Started'
                  )}
                </button>
              )}

              {/* Features */}
              <ul className="space-y-2">
                {tier.features.map((feature, i) => (
                  <li 
                    key={i} 
                    className={`flex items-center gap-2 text-xs ${
                      'isHeader' in feature && feature.isHeader ? 'text-on-surface font-medium mt-2' :
                      feature.included ? 'text-on-surface/80' : 'text-on-surface-muted/60'
                    }`}
                  >
                    {!('isHeader' in feature && feature.isHeader) && (
                      feature.included ? (
                        <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-400" />
                      ) : (
                        <X className="w-3.5 h-3.5 flex-shrink-0 text-on-surface-muted/60" />
                      )
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Value Highlight */}
      {showComparison && !requiresSales && (
        <div className="max-w-3xl mx-auto mb-8 p-6 bg-gradient-to-r from-primary/10 to-green-500/10 rounded-lg">
          <h3 className="text-lg font-bold text-center mb-4">Everything You Need, One Platform</h3>
          <div className="grid md:grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-xs text-on-surface-muted mb-1">SnapR Gold</p>
              <p className="text-2xl font-bold text-primary">${goldTotal}/mo</p>
              <p className="text-[10px] text-on-surface-muted">
                {listings} listings × ${goldPrice}/listing
              </p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <p className="text-xs text-on-surface-muted mb-1">Includes</p>
              <p className="text-sm text-on-surface/80">Photo editing + Social templates + Email marketing + Video creator + MLS descriptions</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-muted text-center mt-4">
            No separate subscriptions. No hidden fees. Everything in one place.
          </p>
        </div>
      )}

      {/* Premium Add-ons */}
      {showAddons && (
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="text-lg font-bold text-center mb-2">Premium Add-ons</h3>
          <p className="text-sm text-on-surface-muted text-center mb-4">Pay as you go</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: 'Property Gallery', desc: 'Shareable galleries', price: 'FREE', highlight: true },
              { name: 'Renovation', desc: 'Digital remodeling', price: '$15 / $25 / $50' },
              { name: 'AI Voiceovers', desc: 'Pro narration', price: '$2 flat' },
              { name: 'CMA Reports', desc: 'Market analysis', price: 'FREE', highlight: true },
              { name: 'Human Editing', desc: 'Pro retouching', price: 'From $5/img' },
            ].map((addon, i) => (
              <div key={i} className={`p-3 rounded-lg border text-center ${
                addon.highlight 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-surface-container-low border-surface-container-high'
              }`}>
                <p className="text-sm font-medium">{addon.name}</p>
                <p className="text-[10px] text-on-surface-muted">{addon.desc}</p>
                <p className={`text-xs mt-1 ${addon.highlight ? 'text-green-400' : 'text-primary'}`}>
                  {addon.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {showFAQ && (
        <div className="mt-10 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold font-serif tracking-tighter text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {[
              ['How does pricing work?', 'Choose your billing cycle (Pay as you go, Monthly, or Annual) and select how many listings you need per month. The more you commit, the more you save. Monthly billing saves 40%, Annual saves 60%. Higher volume (75+ listings) unlocks additional discounts.'],
              ['What\'s the difference between Gold and Platinum?', 'Gold includes 50 photos per listing and all features. Platinum adds 75 photos per listing, white-label branding, a dedicated account manager, and guided onboarding.'],
              ['What if I need more than 300 listings?', 'Contact our sales team for Enterprise pricing. We\'ll create a custom package with volume discounts, dedicated support, and SLA guarantees.'],
              ['Do unused listings roll over?', 'Yes! Unused listings roll over for the duration of your billing term. Real estate is seasonal, so we want to make sure you get full value.'],
              ['How does SnapR compare to other services?', 'SnapR includes everything in one platform: photo editing, social templates, email marketing, video creator, and MLS descriptions. No need to pay for 5 separate tools.'],
              ['Can I switch plans anytime?', 'Yes! Upgrade anytime and we\'ll credit your unused listings. Downgrades take effect at your next billing cycle.'],
              ['Is there a free trial?', 'Yes! Start with our Free plan - 3 listings per month with all 15 AI tools. Upgrade when you\'re ready.'],
            ].map(([q, a], i) => (
              <details key={i} className="group bg-surface-container-low rounded-lg border-surface-container-high overflow-hidden">
                <summary className="p-4 cursor-pointer text-sm font-medium flex items-center justify-between">
                  {q}
                  <span className="text-primary group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="px-4 pb-4 text-sm text-on-surface-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {showCTA && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold font-serif tracking-tighter mb-3">Ready to Get Started?</h2>
          <p className="text-on-surface-muted text-sm mb-6">Start free with 3 listings/month. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup?plan=free"
              className="px-6 py-3 bg-surface-container-high hover:bg-surface-container-high text-on-surface font-bold rounded-lg inline-flex items-center gap-2 transition border-outline-variant"
            >
              Start Free
            </Link>
            <Link
              href={`/auth/signup?plan=gold&listings=${listings}&billing=${billingOption}`}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-black font-bold rounded-lg inline-flex items-center gap-2 hover:shadow-glow-gold transition"
            >
              Get SnapR Gold <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Custom slider styles */}
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #D4A017;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(212, 160, 23, 0.5);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #D4A017;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(212, 160, 23, 0.5);
        }
      `}</style>
    </div>
  );
}
