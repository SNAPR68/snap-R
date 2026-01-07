'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Zap, ArrowRight, Camera, Building2, Loader2, Sparkles } from 'lucide-react';

// Slider steps
const LISTING_OPTIONS = [10, 15, 20, 25, 30, 40, 50];

// Volume discount: more listings = lower per-listing price
const getVolumeDiscount = (listings: number): number => {
  if (listings >= 50) return 3.00;
  if (listings >= 40) return 2.50;
  if (listings >= 30) return 2.00;
  if (listings >= 25) return 1.50;
  if (listings >= 20) return 1.00;
  if (listings >= 15) return 0.50;
  return 0;
};

// Photographer tiers (Fotello comparison)
const PHOTOGRAPHER_TIERS = [
  {
    id: 'essentials',
    name: 'Essentials',
    basePrice: 12,
    popular: false,
    photos: 60,
    features: [
      { name: '60 photos per listing', included: true },
      { name: 'Basic photo editing (8 tools)', included: true },
      { name: '2 Twilight per listing', included: true },
      { name: 'Unlimited human revision', included: true },
      { name: 'Content Studio (150+ templates)', included: true, bonus: true },
      { name: 'Email Marketing', included: true, bonus: true },
      { name: 'Social Publishing', included: true, bonus: true },
      { name: 'Property Sites', included: true, bonus: true },
      { name: 'Client Approval', included: true, bonus: true },
      { name: 'Virtual Staging', included: false },
      { name: 'Virtual Tours', included: false },
      { name: 'AI Voiceovers', included: false },
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    basePrice: 14,
    popular: true,
    photos: 75,
    features: [
      { name: '75 photos per listing', included: true },
      { name: 'ALL photo editing (15 tools)', included: true },
      { name: 'Unlimited Twilight', included: true },
      { name: '2 Virtual Staging per listing', included: true },
      { name: 'Unlimited human revision', included: true },
      { name: 'Content Studio (150+ templates)', included: true, bonus: true },
      { name: 'Email Marketing', included: true, bonus: true },
      { name: 'Social Publishing', included: true, bonus: true },
      { name: 'Property Sites', included: true, bonus: true },
      { name: 'Client Approval', included: true, bonus: true },
      { name: 'Virtual Tours', included: false },
      { name: 'AI Voiceovers', included: false },
    ],
  },
  {
    id: 'complete',
    name: 'Complete',
    basePrice: 18,
    popular: false,
    photos: 75,
    features: [
      { name: '75 photos per listing', included: true },
      { name: 'ALL photo editing (15 tools)', included: true },
      { name: 'Unlimited Twilight', included: true },
      { name: 'Unlimited Virtual Staging', included: true },
      { name: 'Unlimited human revision', included: true },
      { name: '1 Virtual Tour per listing', included: true },
      { name: '1 AI Voiceover per listing', included: true },
      { name: '1 Video per listing', included: true },
      { name: 'CMA Reports', included: true },
      { name: 'Content Studio (150+ templates)', included: true },
      { name: 'Email Marketing', included: true },
      { name: 'Social Publishing', included: true },
      { name: 'Property Sites', included: true },
      { name: 'Client Approval', included: true },
    ],
  },
];

// Agent tiers (Complete solution)
const AGENT_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    basePrice: 14,
    popular: false,
    photos: 60,
    features: [
      { name: '60 photos per listing', included: true },
      { name: 'ALL photo editing (15 tools)', included: true },
      { name: '2 Twilight per listing', included: true },
      { name: '2 Virtual Staging per listing', included: true },
      { name: 'Unlimited human revision', included: true },
      { name: 'Content Studio (150+ templates)', included: true },
      { name: 'Email Marketing (24 templates)', included: true },
      { name: 'Social Publishing (5 platforms)', included: true },
      { name: 'Property Sites (4 themes)', included: true },
      { name: 'Client Approval', included: true },
      { name: 'Virtual Tours', included: false },
      { name: 'AI Voiceovers', included: false },
      { name: 'Video Creator', included: false },
    ],
  },
  {
    id: 'complete',
    name: 'Complete',
    basePrice: 18,
    popular: true,
    photos: 75,
    features: [
      { name: '75 photos per listing', included: true },
      { name: 'ALL photo editing (15 tools)', included: true },
      { name: 'Unlimited Twilight', included: true },
      { name: 'Unlimited Virtual Staging', included: true },
      { name: 'Unlimited human revision', included: true },
      { name: '1 Virtual Tour per listing', included: true },
      { name: '1 AI Voiceover per listing', included: true },
      { name: '1 Video per listing', included: true },
      { name: 'CMA Reports', included: true },
      { name: 'Content Studio (150+ templates)', included: true },
      { name: 'Email Marketing (24 templates)', included: true },
      { name: 'Social Publishing (5 platforms)', included: true },
      { name: 'Property Sites (4 themes)', included: true },
      { name: 'Client Approval', included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'photographer' | 'agent'>('photographer');
  const [sliderIndex, setSliderIndex] = useState(4); // Default to 30 listings
  const [loading, setLoading] = useState<string | null>(null);
  const [annual, setAnnual] = useState(true);

  const listings = LISTING_OPTIONS[sliderIndex];
  const discount = getVolumeDiscount(listings);
  const annualDiscount = annual ? 0.20 : 0; // 20% off for annual

  const tiers = userType === 'photographer' ? PHOTOGRAPHER_TIERS : AGENT_TIERS;

  const calculatePrice = (basePrice: number) => {
    const afterVolume = basePrice - discount;
    const afterAnnual = afterVolume * (1 - annualDiscount);
    return Math.max(afterAnnual, basePrice * 0.5); // Never go below 50% of base
  };

  const handleSelectPlan = (planId: string, price: number) => {
    setLoading(planId);
    const totalMonthly = (price * listings).toFixed(0);
    router.push(`/auth/signup?role=${userType}&plan=${planId}&listings=${listings}&price=${price.toFixed(2)}&total=${totalMonthly}&billing=${annual ? 'annual' : 'monthly'}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black text-xl">S</div>
            <span className="text-xl font-bold">Snap<span className="text-[#D4A017]">R</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-white/60 hover:text-white">Log in</Link>
            <Link href="/auth/signup" className="px-4 py-2 bg-[#D4A017] text-black rounded-lg font-medium">Start Free</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Role Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-white/5 border border-white/10 rounded-full">
            <button
              onClick={() => setUserType('photographer')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                userType === 'photographer'
                  ? 'bg-[#D4A017] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Camera className="w-5 h-5" />
              I&apos;m a Photographer
            </button>
            <button
              onClick={() => setUserType('agent')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                userType === 'agent'
                  ? 'bg-[#D4A017] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5" />
              I&apos;m an Agent / Broker
            </button>
          </div>
        </div>

        {/* Headline - Changes based on role */}
        <div className="text-center mb-10">
          {userType === 'photographer' ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Same price as Fotello. More photos. More features.
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Switch from Fotello. <span className="text-[#D4A017]">Get more.</span>
              </h1>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                Same $12/listing starting price. But you get 60 photos (not 50), 2 free twilights, 
                plus Content Studio, Email Marketing, and Social Publishing included.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Stop paying for 8 different tools
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                One Platform. <span className="text-[#D4A017]">Everything Included.</span>
              </h1>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                Photo editing, virtual tours, AI voiceovers, video creation, CMA reports, 
                email marketing, social publishing — all in one place.
              </p>
            </>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-full">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              Annual
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Listings Slider */}
        <div className="max-w-xl mx-auto mb-10 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">How many listings per month?</h3>
              <p className="text-sm text-white/50">More listings = lower price per listing</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#D4A017]">{listings}</div>
              <div className="text-sm text-white/50">listings/mo</div>
            </div>
          </div>
          
          {/* Slider Track */}
          <div className="relative mb-4">
            <input
              type="range"
              min="0"
              max={LISTING_OPTIONS.length - 1}
              value={sliderIndex}
              onChange={(e) => setSliderIndex(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
            <div className="flex justify-between mt-2">
              {LISTING_OPTIONS.map((opt, i) => (
                <span 
                  key={opt} 
                  className={`text-xs ${i === sliderIndex ? 'text-[#D4A017] font-bold' : 'text-white/40'}`}
                >
                  {opt}
                </span>
              ))}
            </div>
          </div>

          {discount > 0 && (
            <div className="text-center text-green-400 text-sm">
              🎉 Volume discount: Save ${discount.toFixed(2)}/listing
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-6 mb-12 ${tiers.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'}`}>
          {tiers.map((tier) => {
            const price = calculatePrice(tier.basePrice);
            const monthlyTotal = price * listings;
            const isPopular = tier.popular;

            return (
              <div
                key={tier.id}
                className={`relative p-6 rounded-2xl transition-all ${
                  isPopular
                    ? 'border-2 border-[#D4A017] bg-gradient-to-b from-[#D4A017]/10 to-transparent'
                    : 'border border-white/10 bg-white/5'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4A017] text-black text-sm font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <p className="text-sm text-white/50">{tier.photos} photos per listing</p>
                </div>

                <div className="mb-2">
                  <span className={`text-4xl font-bold ${isPopular ? 'text-[#D4A017]' : ''}`}>
                    ${price.toFixed(2)}
                  </span>
                  <span className="text-white/50">/listing</span>
                </div>

                {discount > 0 && (
                  <p className="text-sm text-white/40 line-through mb-1">
                    ${tier.basePrice}/listing
                  </p>
                )}

                <div className="mb-6 p-3 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{listings} listings × ${price.toFixed(2)}</span>
                    <span className="font-bold">${monthlyTotal.toFixed(0)}<span className="text-xs text-white/40">/mo</span></span>
                  </div>
                  {annual && (
                    <div className="text-xs text-green-400 text-right mt-1">
                      Billed ${(monthlyTotal * 12).toFixed(0)}/year
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(tier.id, price)}
                  disabled={loading === tier.id}
                  className={`w-full py-3 rounded-xl font-semibold transition-all mb-6 disabled:opacity-50 ${
                    isPopular
                      ? 'bg-[#D4A017] text-black hover:bg-[#B8860B]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {loading === tier.id ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    `Start ${tier.name} Trial`
                  )}
                </button>

                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li 
                      key={i} 
                      className={`flex items-center gap-2 text-sm ${
                        feature.included ? 'text-white/80' : 'text-white/30'
                      }`}
                    >
                      {feature.included ? (
                        <Check className={`w-4 h-4 flex-shrink-0 ${feature.bonus ? 'text-green-400' : 'text-[#D4A017]'}`} />
                      ) : (
                        <X className="w-4 h-4 flex-shrink-0 text-white/20" />
                      )}
                      <span>
                        {feature.name}
                        {feature.bonus && <span className="text-green-400 text-xs ml-1">(Bonus)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Enterprise */}
        <div className="text-center mb-12 p-6 border border-white/10 rounded-2xl bg-white/5">
          <h3 className="text-xl font-bold mb-2">Need more than 50 listings?</h3>
          <p className="text-white/60 mb-4">Contact us for custom enterprise pricing with volume discounts</p>
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition"
          >
            Contact Sales <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Comparison Section - Changes based on role */}
        {userType === 'photographer' ? (
          /* Fotello Comparison */
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-6">SnapR vs Fotello</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60">Feature</th>
                    <th className="text-center p-4 text-red-400">Fotello $12</th>
                    <th className="text-center p-4 text-[#D4A017]">SnapR $12</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Photos per listing', '50', '60 ✓'],
                    ['Twilight included', '0', '2 ✓'],
                    ['Human revision', '✓ Unlimited', '✓ Unlimited'],
                    ['Content Studio', '✗', '✓ 150+ templates'],
                    ['Email Marketing', '✗', '✓ 24 templates'],
                    ['Social Publishing', '✗', '✓ 5 platforms'],
                    ['Property Sites', '✗', '✓ 4 themes'],
                    ['Client Approval', '✗', '✓ Included'],
                  ].map(([feature, fotello, snapr], i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-4 text-white/80">{feature}</td>
                      <td className="p-4 text-center">
                        <span className={fotello.includes('✗') ? 'text-red-400' : 'text-white/60'}>
                          {fotello}
                        </span>
                      </td>
                      <td className="p-4 text-center bg-[#D4A017]/5">
                        <span className={snapr.includes('✓') ? 'text-green-400' : 'text-white/60'}>
                          {snapr}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center mt-6 text-lg">
              <span className="text-white/50">Same price. </span>
              <span className="text-[#D4A017] font-bold">20% more photos + marketing suite included.</span>
            </p>
          </div>
        ) : (
          /* Agent Cost Comparison */
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-6">What You&apos;re Paying Now vs SnapR</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2">
                  <X className="w-5 h-5" /> Separate Tools
                </h3>
                <ul className="space-y-3">
                  {[
                    ['BoxBrownie/PhotoUp', '$150-300/mo'],
                    ['Canva Pro', '$13/mo'],
                    ['Animoto (videos)', '$33/mo'],
                    ['ElevenLabs (voiceover)', '$22/mo'],
                    ['Matterport (tours)', '$69/mo'],
                    ['Mailchimp (email)', '$20/mo'],
                    ['Later (social)', '$25/mo'],
                    ['Squarespace (sites)', '$30/mo'],
                  ].map(([name, price]) => (
                    <li key={name} className="flex justify-between text-sm">
                      <span className="text-white/60">{name}</span>
                      <span>{price}</span>
                    </li>
                  ))}
                  <li className="flex justify-between border-t border-white/10 pt-3 font-bold">
                    <span>Total</span>
                    <span className="text-red-400">$360-510/mo</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-[#D4A017]/5 border border-[#D4A017]/30 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-[#D4A017] flex items-center gap-2">
                  <Check className="w-5 h-5" /> SnapR Complete
                </h3>
                <ul className="space-y-3">
                  {[
                    'ALL photo editing (15 tools)',
                    'Virtual Tours',
                    'AI Voiceovers',
                    'Video Creator',
                    'CMA Reports',
                    'Content Studio (150+ templates)',
                    'Email Marketing',
                    'Social Publishing',
                  ].map((f) => (
                    <li key={f} className="flex justify-between text-sm">
                      <span className="text-white/60">{f}</span>
                      <span className="text-green-400">Included</span>
                    </li>
                  ))}
                  <li className="flex justify-between border-t border-white/10 pt-3 font-bold">
                    <span>Total (20 listings)</span>
                    <span className="text-[#D4A017]">${(calculatePrice(18) * 20).toFixed(0)}/mo</span>
                  </li>
                </ul>
                <p className="text-center mt-4 text-green-400 font-bold">
                  One platform. Everything included.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add-ons */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-2">Need More?</h2>
          <p className="text-white/60 text-center mb-6">Add these to any plan as needed</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Extra Photos', price: '$0.25/photo', desc: 'Over plan limit' },
              { name: 'Extra Listings', price: '$15/listing', desc: 'Over plan limit' },
              { name: 'Virtual Tour', price: '$15/tour', desc: 'If not in plan' },
              { name: 'AI Voiceover', price: '$5/script', desc: 'If not in plan' },
              { name: 'Video', price: '$10/video', desc: 'If not in plan' },
              { name: 'Virtual Staging', price: '$5/image', desc: 'Over plan limit' },
              { name: 'CMA Report', price: '$10/report', desc: 'If not in plan' },
              { name: 'Rush Delivery', price: '2x price', desc: 'Priority processing' },
            ].map((addon) => (
              <div key={addon.name} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h4 className="font-semibold text-sm">{addon.name}</h4>
                <p className="text-[#D4A017] font-bold">{addon.price}</p>
                <p className="text-xs text-white/40">{addon.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              ['How does listing-based pricing work?', 'You pay a fixed price per listing. Each listing includes up to 50-75 photos (depending on plan). All AI enhancements and human revisions on photos are included. No per-photo charges.'],
              ['What does "unlimited human revision" mean?', 'If our AI doesn\'t get your photo edit perfect, our human editors will fix it at no extra charge. This applies to all photo editing tools (sky replacement, twilight, HDR, etc.). Unlimited revisions until you\'re satisfied.'],
              ['What\'s the difference between Photographer and Agent plans?', 'Photographer plans are optimized for high-volume photo editing with delivery to clients. Agent plans include more marketing tools prominently (Content Studio, Email, Social) since agents market their own listings.'],
              ['Can I change plans later?', 'Yes! Upgrade or downgrade anytime. Changes take effect on your next billing cycle.'],
              ['What if I need more than 50 listings?', 'Contact our sales team for enterprise pricing. We offer volume discounts for high-volume users.'],
            ].map(([q, a], i) => (
              <details key={i} className="group bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <summary className="p-5 cursor-pointer font-medium flex items-center justify-between">
                  {q}
                  <span className="text-[#D4A017] group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="px-5 pb-5 text-white/60">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-white/60 mb-6">Start your free trial today. No credit card required.</p>
          <button
            onClick={() => handleSelectPlan(tiers.find(t => t.popular)?.id || tiers[0].id, calculatePrice(tiers.find(t => t.popular)?.basePrice || tiers[0].basePrice))}
            className="px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl text-lg inline-flex items-center gap-2 hover:opacity-90 transition"
          >
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black">S</div>
            <span className="font-bold">Snap<span className="text-[#D4A017]">R</span></span>
          </div>
          <p className="text-white/40 text-sm">© 2025 SnapR. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>

      {/* Custom slider styles */}
      <style jsx>{`
        input[type='range'] {
          background: linear-gradient(to right, #D4A017 ${(sliderIndex / (LISTING_OPTIONS.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(sliderIndex / (LISTING_OPTIONS.length - 1)) * 100}%);
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #D4A017;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(212, 160, 23, 0.5);
        }
        input[type='range']::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #D4A017;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(212, 160, 23, 0.5);
        }
      `}</style>
    </div>
  );
}
