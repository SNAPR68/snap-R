'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';

// Slider steps - max 30 listings
const LISTING_OPTIONS = [10, 15, 20, 25, 30];

// Volume discount: more listings = lower per-listing price
const getVolumeDiscount = (listings: number): number => {
  if (listings >= 30) return 2.00;
  if (listings >= 25) return 1.50;
  if (listings >= 20) return 1.00;
  if (listings >= 15) return 0.50;
  return 0;
};

// Pricing tiers
const TIERS = [
  {
    id: 'free',
    name: 'Free',
    basePrice: 0,
    popular: false,
    photos: 30,
    listings: 1,
    isFree: true,
    features: [
      { name: '1 listing (7-day trial)', included: true },
      { name: '30 photos per listing', included: true },
      { name: 'All 15 AI tools', included: true },
      { name: 'Watermarked exports', included: true },
      { name: 'HD exports', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    basePrice: 10,
    popular: true,
    photos: 75,
    features: [
      { name: '75 photos per listing', included: true },
      { name: 'All 15 AI tools', included: true },
      { name: 'Unlimited Twilight', included: true },
      { name: '2 Virtual Staging/listing', included: true },
      { name: '3 revisions (within 7 days)', included: true },
      { name: 'HD exports (no watermark)', included: true },
      { name: 'Client delivery portal', included: true },
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    basePrice: 16,
    popular: false,
    photos: 75,
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Content Studio (150+ templates)', included: true },
      { name: 'Email Marketing', included: true },
      { name: 'Upload to Social Media', included: true },
      { name: 'Property Sites', included: true },
      { name: 'Priority Support', included: true },
    ],
  },
];

interface PricingSectionProps {
  showHeadline?: boolean;
  showFAQ?: boolean;
  showCTA?: boolean;
  showEnterprise?: boolean;
}

export default function PricingSection({ 
  showHeadline = true, 
  showFAQ = false, 
  showCTA = false,
  showEnterprise = true,
}: PricingSectionProps) {
  const router = useRouter();
  const [sliderIndex, setSliderIndex] = useState(4); // Default to 30 listings
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [loading, setLoading] = useState<string | null>(null);
  const [annual, setAnnual] = useState(true);

  const listings = LISTING_OPTIONS[sliderIndex];
  const discount = getVolumeDiscount(listings);
  const annualDiscount = annual ? 0.20 : 0; // 20% off for annual

  const calculatePrice = (basePrice: number) => {
    if (basePrice === 0) return 0;
    const afterVolume = basePrice - discount;
    const afterAnnual = afterVolume * (1 - annualDiscount);
    return Math.max(afterAnnual, basePrice * 0.5); // Never go below 50% of base
  };

  const handleSelectPlan = (planId: string, price: number, isFree?: boolean) => {
    setLoading(planId);
    
    if (isFree) {
      router.push('/auth/signup?plan=free');
      return;
    }
    
    const totalMonthly = (price * listings).toFixed(0);
    router.push(`/auth/signup?plan=${planId}&listings=${listings}&price=${price.toFixed(2)}&total=${totalMonthly}&billing=${annual ? 'annual' : 'monthly'}`);
  };

  return (
    <div>
      {/* Headline */}
      {showHeadline && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-xs mb-3">
            <Sparkles className="w-3 h-3" />
            Simple, transparent pricing
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            From photo to published in 60 seconds.
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Same $12/listing starting price. But you get 60 photos (not 50), 2 free twilights, 
            plus Content Studio, Email Marketing, and upload to social media included.
          </p>
        </div>
      )}

      {/* Billing Toggle + Slider Row */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        {/* Billing Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-full">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              !annual ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
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
          <span className="text-xs text-white/50">Listings:</span>
          <input
            type="range"
            min="0"
            max={LISTING_OPTIONS.length - 1}
            value={sliderIndex}
            onChange={(e) => setSliderIndex(Number(e.target.value))}
            className="w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #D4A017 ${(sliderIndex / (LISTING_OPTIONS.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(sliderIndex / (LISTING_OPTIONS.length - 1)) * 100}%)`
            }}
          />
          <span className="text-lg font-bold text-[#D4A017] w-8">{listings}</span>
          {discount > 0 && (
            <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              -${discount.toFixed(2)}/ea
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards - Compact */}
      <div className="grid md:grid-cols-3 gap-4 mb-6 max-w-4xl mx-auto">
        {TIERS.map((tier) => {
          const price = calculatePrice(tier.basePrice);
          const monthlyTotal = tier.isFree ? 0 : price * listings;
          const isPopular = tier.popular;
          const isSelected = selectedPlan === tier.id;
          const isFree = tier.isFree;

          return (
            <div
              key={tier.id}
              onClick={() => setSelectedPlan(tier.id)}
              className={`relative p-4 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-[#D4A017] bg-gradient-to-b from-[#D4A017]/10 to-transparent shadow-lg shadow-[#D4A017]/20'
                  : isPopular
                  ? 'border-2 border-[#D4A017]/50 bg-[#D4A017]/5'
                  : 'border border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#D4A017] text-black text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-3">
                <h3 className="text-lg font-bold">{tier.name}</h3>
                <p className="text-xs text-white/50">
                  {isFree ? '3 listings/month' : `${tier.photos} photos per listing`}
                </p>
              </div>

              <div className="mb-1">
                {isFree ? (
                  <span className="text-3xl font-bold">$0</span>
                ) : (
                  <>
                    <span className={`text-3xl font-bold ${isSelected ? 'text-[#D4A017]' : ''}`}>
                      ${price.toFixed(2)}
                    </span>
                    <span className="text-white/50 text-sm">/listing</span>
                  </>
                )}
              </div>

              {!isFree && discount > 0 && (
                <p className="text-xs text-white/40 line-through mb-1">
                  ${tier.basePrice}/listing
                </p>
              )}

              {!isFree && (
                <div className="mb-3 p-2 bg-white/5 rounded-lg text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{listings} listings</span>
                    <span className="font-bold">${monthlyTotal.toFixed(0)}<span className="text-white/40">/mo</span></span>
                  </div>
                  {annual && (
                    <div className="text-[10px] text-green-400 text-right">
                      Billed ${(monthlyTotal * 12).toFixed(0)}/year
                    </div>
                  )}
                </div>
              )}

              {isFree && (
                <div className="mb-3 p-2 bg-white/5 rounded-lg text-xs text-center">
                  <span className="text-white/60">7-day trial</span>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan(tier.id, price, isFree);
                }}
                disabled={loading === tier.id}
                className={`w-full py-2 rounded-lg font-semibold transition-all mb-3 disabled:opacity-50 text-sm ${
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

              <ul className="space-y-1">
                {tier.features.map((feature, i) => (
                  <li 
                    key={i} 
                    className={`flex items-center gap-1.5 text-xs ${
                      feature.included ? 'text-white/80' : 'text-white/30'
                    }`}
                  >
                    {feature.included ? (
                      <Check className="w-3 h-3 flex-shrink-0 text-green-400" />
                    ) : (
                      <X className="w-3 h-3 flex-shrink-0 text-white/20" />
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Enterprise - Compact */}
      {showEnterprise && (
        <div className="text-center p-4 border border-white/10 rounded-xl bg-white/5 max-w-2xl mx-auto">
          <h3 className="text-base font-bold mb-1">Need more than 30 listings?</h3>
          <p className="text-white/60 text-xs mb-3">Contact us for custom enterprise pricing with volume discounts</p>
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition"
          >
            Contact Sales <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* FAQ - Only on pricing page */}
      {showFAQ && (
        <div className="mt-10 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {[
              ['How does listing-based pricing work?', 'You pay a fixed price per listing. Each listing includes up to 30-75 photos depending on plan. All AI enhancements are included. No per-photo charges.'],
              ['What does "unlimited human revision" mean?', 'If our AI doesn\'t get your photo edit perfect, our human editors will fix it at no extra charge. Unlimited revisions until you\'re satisfied.'],
              ['Is the Property Gallery really free?', 'Yes! Every listing gets a FREE shareable Property Gallery page with all photos, property details, and contact form. No limits.'],
              ['How do I upload to Instagram/Facebook?', 'Click "Upload to Instagram" and on mobile it opens the app directly with your image ready. On desktop, the image downloads and caption copies automatically.'],
              ['Can I start free and upgrade later?', 'Yes! Start with 3 free listings/month. Upgrade anytime when you need more.'],
            ].map(([q, a], i) => (
              <details key={i} className="group bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                <summary className="p-3 cursor-pointer text-sm font-medium flex items-center justify-between">
                  {q}
                  <span className="text-[#D4A017] group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-3 pb-3 text-xs text-white/60">{a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* CTA - Only on pricing page */}
      {showCTA && (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
          <p className="text-white/60 text-sm mb-4">Start free with 3 listings/month. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup?plan=free"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg inline-flex items-center gap-2 transition border border-white/20"
            >
              Start Free
            </Link>
            <button
              onClick={() => handleSelectPlan(selectedPlan, calculatePrice(TIERS.find(t => t.id === selectedPlan)?.basePrice || 14))}
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
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4A017;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(212, 160, 23, 0.5);
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4A017;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(212, 160, 23, 0.5);
        }
      `}</style>
    </div>
  );
}
