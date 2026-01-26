'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ArrowRight, Loader2, Sparkles, Zap, Building2, Users, Phone } from 'lucide-react';

// Slider steps for listings per month (max 30 for Pro self-serve)
const LISTING_OPTIONS = [5, 10, 15, 20, 25, 30];

// Pricing tiers with hybrid model (base + per listing)
const TIERS = [
  {
    id: 'free',
    name: 'Free',
    icon: Sparkles,
    basePrice: 0,
    perListing: 0,
    popular: false,
    description: 'Try SnapR risk-free',
    maxListings: 3,
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
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    basePrice: 99,
    perListing: 18,
    popular: true,
    description: 'For solo agents & photographers',
    maxListings: 30,
    features: [
      { name: 'Up to 30 listings/month', included: true },
      { name: '75 photos per listing', included: true },
      { name: 'All 15 AI tools', included: true },
      { name: 'Unlimited Twilight', included: true },
      { name: '2 Virtual Staging/listing', included: true },
      { name: 'HD exports (no watermark)', included: true },
      { name: 'Content Studio (150+ templates)', included: true },
      { name: 'Social Media Posting', included: true },
      { name: 'Email Marketing', included: true },
      { name: 'AI Video Creator', included: true },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    icon: Users,
    basePrice: 299,
    perListing: 0,
    popular: false,
    description: 'For teams (30-50 listings)',
    maxListings: 50,
    requiresCall: true,
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Up to 50 listings/month', included: true },
      { name: '5 team members', included: true },
      { name: 'Brand templates', included: true },
      { name: 'Team analytics', included: true },
      { name: 'Priority support', included: true },
    ],
  },
  {
    id: 'brokerage',
    name: 'Brokerage',
    icon: Building2,
    basePrice: 599,
    perListing: 0,
    popular: false,
    description: 'For high-volume brokerages',
    requiresCall: true,
    features: [
      { name: 'Everything in Team', included: true },
      { name: 'White-label branding included', included: true, highlight: true },
      { name: 'Custom listing volume', included: true },
      { name: '10+ team members', included: true },
      { name: 'Dedicated success manager', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SLA guarantee', included: true },
    ],
  },
];

interface PricingSectionProps {
  showHeadline?: boolean;
  showFAQ?: boolean;
  showCTA?: boolean;
  showEnterprise?: boolean;
  showComparison?: boolean;
}

export default function PricingSection({ 
  showHeadline = true, 
  showFAQ = false, 
  showCTA = false,
  showEnterprise = false,
  showComparison = true,
}: PricingSectionProps) {
  const router = useRouter();
  const [sliderIndex, setSliderIndex] = useState(2); // Default to 15 listings
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [loading, setLoading] = useState<string | null>(null);
  const [annual, setAnnual] = useState(true);

  const listings = LISTING_OPTIONS[sliderIndex];
  const annualDiscount = annual ? 0.20 : 0; // 20% off for annual

  const calculateMonthlyTotal = (tier: typeof TIERS[0]) => {
    if (tier.isFree) return 0;
    if (tier.requiresCall) return tier.basePrice; // Show "From $X" for sales call tiers
    const base = tier.basePrice * (1 - annualDiscount);
    const listingCost = tier.perListing * listings;
    return base + listingCost;
  };

  const calculateBasePrice = (tier: typeof TIERS[0]) => {
    if (tier.isFree) return 0;
    if (tier.requiresCall) return tier.basePrice; // No discount shown for sales call tiers
    return tier.basePrice * (1 - annualDiscount);
  };

  const handleSelectPlan = (planId: string, monthlyTotal: number, isFree?: boolean) => {
    setLoading(planId);
    
    if (isFree) {
      router.push('/auth/signup?plan=free');
      return;
    }
    
    const tier = TIERS.find(t => t.id === planId);
    router.push(`/auth/signup?plan=${planId}&listings=${listings}&total=${monthlyTotal.toFixed(0)}&billing=${annual ? 'annual' : 'monthly'}`);
  };

  // Calculate competitor cost for comparison
  const fotelloComparison = listings * 28; // Fotello Essential $28/listing
  const toolsCost = 174; // Canva $15 + Hootsuite $99 + Mailchimp $30 + Video $30
  const competitorTotal = fotelloComparison + toolsCost;
  const proTotal = calculateMonthlyTotal(TIERS[1]);
  const savings = competitorTotal - proTotal;
  const savingsPercent = Math.round((savings / competitorTotal) * 100);

  return (
    <div>
      {/* Headline */}
      {showHeadline && (
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-xs mb-4">
            <Sparkles className="w-3 h-3" />
            Simple, transparent pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Edit, Create, Post — All in One Platform
          </h2>
          <p className="text-base text-white/60 max-w-2xl mx-auto">
            Replace Canva + Hootsuite + Mailchimp + your photo editor. One platform for photo enhancement and listing marketing.
          </p>
        </div>
      )}

      {/* Billing Toggle + Slider Row */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
        {/* Billing Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-full">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !annual ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              annual ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'
            }`}
          >
            Annual
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>

        {/* Compact Slider */}
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
          <span className="text-sm text-white/50">Listings/mo:</span>
          <input
            type="range"
            min="0"
            max={LISTING_OPTIONS.length - 1}
            value={sliderIndex}
            onChange={(e) => setSliderIndex(Number(e.target.value))}
            className="w-32 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #D4A017 ${(sliderIndex / (LISTING_OPTIONS.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(sliderIndex / (LISTING_OPTIONS.length - 1)) * 100}%)`
            }}
          />
          <span className="text-xl font-bold text-[#D4A017] min-w-[2.5rem]">{listings}</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto">
        {TIERS.map((tier) => {
          const monthlyTotal = calculateMonthlyTotal(tier);
          const basePrice = calculateBasePrice(tier);
          const isPopular = tier.popular;
          const isSelected = selectedPlan === tier.id;
          const isFree = tier.isFree;
          const requiresCall = tier.requiresCall;
          const Icon = tier.icon;

          return (
            <div
              key={tier.id}
              onClick={() => setSelectedPlan(tier.id)}
              className={`relative p-5 rounded-2xl transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-[#D4A017] bg-gradient-to-b from-[#D4A017]/10 to-transparent shadow-lg shadow-[#D4A017]/20'
                  : isPopular
                  ? 'border-2 border-[#D4A017]/50 bg-[#D4A017]/5'
                  : 'border border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4A017] text-black text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-[#D4A017]/20' : 'bg-white/10'
                }`}>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#D4A017]' : 'text-white/60'}`} />
                </div>
                <h3 className="text-lg font-bold">{tier.name}</h3>
              </div>
              
              <p className="text-xs text-white/50 mb-4">{tier.description}</p>

              {/* Pricing Display */}
              <div className="mb-4">
                {isFree ? (
                  <div>
                    <span className="text-4xl font-bold">$0</span>
                  </div>
                ) : requiresCall ? (
                  <div>
                    <span className="text-white/50 text-sm">From </span>
                    <span className={`text-4xl font-bold ${isSelected ? 'text-[#D4A017]' : ''}`}>
                      ${basePrice}
                    </span>
                    <span className="text-white/50 text-sm">/mo</span>
                    <p className="text-xs text-white/40 mt-1">Custom pricing based on volume</p>
                  </div>
                ) : (
                  <div>
                    <span className={`text-4xl font-bold ${isSelected ? 'text-[#D4A017]' : ''}`}>
                      ${monthlyTotal.toFixed(0)}
                    </span>
                    <span className="text-white/50 text-sm">/mo</span>
                    <p className="text-xs text-white/40 mt-1">
                      ${basePrice.toFixed(0)} base + ${tier.perListing} × {listings} listings
                    </p>
                  </div>
                )}
              </div>

              {/* Annual savings note - only for Pro */}
              {!isFree && !requiresCall && annual && (
                <div className="mb-4 p-2 bg-green-500/10 rounded-lg text-xs text-green-400 text-center">
                  Save ${(monthlyTotal * 12 * 0.25).toFixed(0)}/year with annual billing
                </div>
              )}

              {/* CTA Button */}
              {requiresCall ? (
                <Link
                  href={`https://calendly.com/rajesh-snap-r/30min?plan=${tier.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all mb-4 text-sm flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-[#D4A017] text-black hover:bg-[#B8860B]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Talk to Sales
                </Link>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(tier.id, monthlyTotal, isFree);
                  }}
                  disabled={loading === tier.id}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all mb-4 disabled:opacity-50 text-sm ${
                    isSelected
                      ? 'bg-[#D4A017] text-black hover:bg-[#B8860B]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {loading === tier.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : isFree ? (
                    'Start Free'
                  ) : (
                    `Start ${tier.name} Trial`
                  )}
                </button>
              )}

              <ul className="space-y-2">
                {tier.features.map((feature, i) => (
                  <li 
                    key={i} 
                    className={`flex items-center gap-2 text-xs ${
                      feature.included ? 'text-white/80' : 'text-white/30'
                    } ${(feature as any).highlight ? 'text-[#D4A017] font-medium' : ''}`}
                  >
                    {feature.included ? (
                      <Check className={`w-3.5 h-3.5 flex-shrink-0 ${(feature as any).highlight ? 'text-[#D4A017]' : 'text-green-400'}`} />
                    ) : (
                      <X className="w-3.5 h-3.5 flex-shrink-0 text-white/20" />
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Cost Comparison - Only show for Pro (self-serve) */}
      {showComparison && (
        <div className="max-w-3xl mx-auto mb-8 p-6 bg-gradient-to-r from-green-500/10 to-[#D4A017]/10 rounded-2xl border border-green-500/20">
          <h3 className="text-lg font-bold text-center mb-4">Your Savings vs. Separate Tools</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/50 mb-1">Fotello + Tools</p>
              <p className="text-2xl font-bold text-red-400 line-through">${competitorTotal}/mo</p>
              <p className="text-[10px] text-white/40">
                ${fotelloComparison} editing + ${toolsCost} marketing
              </p>
            </div>
            <div className="p-4 bg-[#D4A017]/10 rounded-xl border border-[#D4A017]/30">
              <p className="text-xs text-white/50 mb-1">SnapR Pro</p>
              <p className="text-2xl font-bold text-[#D4A017]">${proTotal.toFixed(0)}/mo</p>
              <p className="text-[10px] text-white/40">
                Everything included
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
              <p className="text-xs text-white/50 mb-1">You Save</p>
              <p className="text-2xl font-bold text-green-400">${savings > 0 ? savings.toFixed(0) : 0}/mo</p>
              <p className="text-[10px] text-green-400/80">
                {savingsPercent > 0 ? savingsPercent : 0}% less
              </p>
            </div>
          </div>
          <p className="text-xs text-white/40 text-center mt-4">
            Need more than 30 listings? <Link href="https://calendly.com/rajesh-snap-r/30min" className="text-[#D4A017] hover:underline">Talk to sales</Link> for Team & Brokerage pricing.
          </p>
        </div>
      )}

      {/* Add-ons Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <h3 className="text-lg font-bold text-center mb-4">Available Add-ons</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: 'Virtual Renovation', price: 'From $15/room' },
            { name: 'Human Editing', price: 'From $5/image' },
            { name: 'Extra Users', price: '$25/user/mo' },
          ].map((addon, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
              <p className="text-sm font-medium">{addon.name}</p>
              <p className="text-xs text-[#D4A017]">{addon.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      {showFAQ && (
        <div className="mt-10 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {[
              ['How does Pro pricing work?', 'Pro is $99/month base fee plus $18 per listing, up to 30 listings/month. The base fee includes Content Studio, social posting, email marketing, and video creator. The per-listing fee covers AI photo enhancement. At 30 listings, you pay $639/month.'],
              ['What\'s included in the base fee?', 'The $99 base fee includes unlimited access to Content Studio (150+ templates), social media posting, email marketing, AI video creator, and all platform features. The per-listing fee covers AI photo processing only.'],
              ['Why do Team and Brokerage require a call?', 'Team and Brokerage plans are customized based on your volume, team size, and specific needs. A quick 15-minute call helps us understand your requirements and offer the best pricing. Most teams save 30-50% compared to self-serve rates.'],
              ['What if I need more than 30 listings?', 'Contact us for Team ($299+/mo for up to 50 listings) or Brokerage pricing (custom volume). We\'ll create a package that fits your needs and budget.'],
              ['What is white-label branding?', 'White-label branding (included free with Brokerage) removes all SnapR branding from your exports, galleries, and client-facing materials. Your clients see only your brand. This feature is exclusive to Brokerage tier.'],
              ['Is there a contract?', 'No long-term contracts for Pro. Pay monthly or save 20% with annual billing. Team and Brokerage plans may include annual commitments with additional discounts.'],
            ].map(([q, a], i) => (
              <details key={i} className="group bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <summary className="p-4 cursor-pointer text-sm font-medium flex items-center justify-between">
                  {q}
                  <span className="text-[#D4A017] group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="px-4 pb-4 text-sm text-white/60">{a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {showCTA && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-white/60 text-sm mb-6">Start free with 3 listings/month. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup?plan=free"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg inline-flex items-center gap-2 transition border border-white/20"
            >
              Start Free
            </Link>
            <button
              onClick={() => {
                const tier = TIERS.find(t => t.id === selectedPlan);
                if (tier) handleSelectPlan(selectedPlan, calculateMonthlyTotal(tier));
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition"
            >
              Start {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Trial <ArrowRight className="w-4 h-4" />
            </button>
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
