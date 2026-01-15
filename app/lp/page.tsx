'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/before-after-slider';

// Founding Members Counter - In production, fetch from API/DB
const TOTAL_FOUNDING_SPOTS = 50;
const SPOTS_CLAIMED = 27; // Update this as people sign up, or fetch from DB

// Founding Member Benefits
const FOUNDING_BENEFITS = [
  { icon: '💰', title: '50% Off for 3 Months', desc: '$4/listing for your first 3 months' },
  { icon: '📱', title: 'Direct Access', desc: 'WhatsApp support with founders (3 months)' },
  { icon: '🚀', title: 'Early Features', desc: 'Get new tools before everyone else' },
  { icon: '🗳️', title: 'Shape the Product', desc: 'Vote on roadmap, your voice matters' },
  { icon: '🏆', title: 'Founding Badge', desc: 'Exclusive profile badge forever' },
  { icon: '🎁', title: '3 Free Listings', desc: 'Try before you commit anything' },
];

export default function LandingPage() {
  const [spotsRemaining, setSpotsRemaining] = useState(TOTAL_FOUNDING_SPOTS - SPOTS_CLAIMED);
  const [showBanner, setShowBanner] = useState(true);
  
  // In production, fetch real count from API
  // useEffect(() => {
  //   fetch('/api/founding-spots').then(r => r.json()).then(d => setSpotsRemaining(d.remaining));
  // }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      
      {/* Custom Styles */}
      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #D4A017, #B8860B);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(212, 160, 23, 0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #D4A017, #B8860B);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 20px rgba(212, 160, 23, 0.4);
        }
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(212, 160, 23, 0); }
        }
        .pulse-gold { animation: pulse-gold 2s infinite; }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* ============================================ */}
      {/* FOUNDING 50 STICKY BANNER */}
      {/* ============================================ */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#D4A017] via-[#F4C430] to-[#D4A017] text-black py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm font-medium">
            <span className="hidden sm:inline">🚀</span>
            <span>
              <strong>Founding 50 Launch:</strong> Only <span className="inline-flex items-center justify-center bg-black text-white px-2 py-0.5 rounded font-bold mx-1">{spotsRemaining}</span> spots left at <strong>50% off for 3 months</strong>
            </span>
            <Link href="#founding" className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-900 transition-colors">
              Claim Your Spot →
            </Link>
            <button onClick={() => setShowBanner(false)} className="absolute right-4 text-black/50 hover:text-black">✕</button>
          </div>
        </div>
      )}

      {/* Floating CTA - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-40 md:hidden">
        <Link
          href="#founding"
          className="block w-full py-4 px-6 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-center rounded-xl shadow-lg shadow-[#D4A017]/20 pulse-gold"
        >
          🔥 Claim Founding Spot — {spotsRemaining} Left →
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`fixed ${showBanner ? 'top-10' : 'top-0'} left-0 right-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 transition-all`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <span className="text-black font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold">SnapR</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#founding" className="text-[#D4A017] font-semibold hover:text-[#F4C430] transition-colors">Founding 50 🔥</a>
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#compare" className="text-gray-400 hover:text-white transition-colors">Compare</a>
              <Link
                href="#founding"
                className="px-5 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4A017]/20 transition-all pulse-gold"
              >
                Claim Your Spot
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className={`${showBanner ? 'pt-36' : 'pt-28'} pb-16 px-4 sm:px-6 lg:px-8 transition-all`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            
            {/* Founding Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A017] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4A017]"></span>
              </span>
              <span className="text-sm text-[#D4A017] font-semibold">🚀 FOUNDING 50 LAUNCH — {spotsRemaining} spots remaining</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
              Save 2+ Hours Per Listing.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A017] to-[#F4C430]">
                AI Does The Heavy Lifting.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Upload photos. Get enhanced images, social content, videos, property sites, and email campaigns — all in under 3 minutes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="#founding"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-[#D4A017]/30 transition-all transform hover:scale-105 pulse-gold"
              >
                🔥 Become a Founding Member — 50% Off for 3 Months
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                3 free listings
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                No credit card
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                30-day guarantee
              </span>
            </div>
          </div>

          {/* Before/After Demo */}
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-[#D4A017]/10 border border-white/10">
            <BeforeAfterSlider
              beforeUrl="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200"
              afterUrl="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200"
            />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOUNDING 30 OFFER SECTION */}
      {/* ============================================ */}
      <section id="founding" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0A0A0A] via-[#111] to-[#0A0A0A]">
        <div className="max-w-5xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 mb-4">
              <span className="text-2xl">🚀</span>
              <span className="text-[#D4A017] font-bold">LIMITED LAUNCH OFFER</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A017] to-[#F4C430]">Founding Member</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Only <strong className="text-white">{TOTAL_FOUNDING_SPOTS} people</strong> will ever get this deal. Lock in 50% off for your first 3 months.
            </p>
          </div>

          {/* Spots Counter */}
          <div className="max-w-md mx-auto mb-12">
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#D4A017]/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Founding spots claimed</span>
                <span className="text-[#D4A017] font-bold">{TOTAL_FOUNDING_SPOTS - spotsRemaining} / {TOTAL_FOUNDING_SPOTS}</span>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#D4A017] to-[#F4C430] rounded-full transition-all duration-1000"
                  style={{ width: `${((TOTAL_FOUNDING_SPOTS - spotsRemaining) / TOTAL_FOUNDING_SPOTS) * 100}%` }}
                />
              </div>
              <div className="mt-4 text-center">
                <span className="text-3xl font-bold text-white">{spotsRemaining}</span>
                <span className="text-gray-400 ml-2">spots remaining</span>
              </div>
            </div>
          </div>

          {/* Pricing Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            
            {/* Regular Price */}
            <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 opacity-60">
              <div className="text-gray-400 text-sm uppercase tracking-wide mb-2">Regular Price</div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-white">$8</span>
                <span className="text-gray-400">/listing</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-600">✓</span> All AI enhancement tools
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-600">✓</span> Social media content
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-600">✓</span> Email support
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-600">✗</span> <span className="line-through">Priority support</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-600">✗</span> <span className="line-through">Early feature access</span>
                </li>
              </ul>
              <div className="mt-6 text-center text-gray-500 text-sm">Available after launch</div>
            </div>

            {/* Founding Member Price */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#D4A017]/20 to-[#B8860B]/10 border-2 border-[#D4A017] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#D4A017] text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                BEST VALUE
              </div>
              <div className="shimmer absolute inset-0 pointer-events-none" />
              
              <div className="text-[#D4A017] text-sm uppercase tracking-wide mb-2 font-semibold">Founding Member</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-bold text-white">$4</span>
                <span className="text-gray-400">/listing</span>
              </div>
              <div className="mb-4">
                <span className="text-gray-500 line-through">$8/listing</span>
                <span className="ml-2 text-[#C8FCEA] font-semibold">50% OFF FOR 3 MONTHS</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-white">
                  <span className="text-[#D4A017]">✓</span> All AI enhancement tools
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-[#D4A017]">✓</span> Social media content
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-[#D4A017]">✓</span> <strong>Direct WhatsApp support</strong>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-[#D4A017]">✓</span> <strong>Early feature access</strong>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-[#D4A017]">✓</span> <strong>Vote on roadmap</strong>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-[#D4A017]">✓</span> <strong>Founding Member badge</strong>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-[#D4A017]">✓</span> <strong>$8/listing after 3 months</strong>
                </li>
              </ul>
              
              <Link
                href="/signup?plan=founding"
                className="block w-full py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-center rounded-xl hover:shadow-xl hover:shadow-[#D4A017]/30 transition-all transform hover:scale-[1.02] pulse-gold"
              >
                🔥 Claim My Founding Spot
              </Link>
              
              <p className="text-center text-gray-500 text-xs mt-3">Only {spotsRemaining} spots left • 30-day money-back guarantee</p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FOUNDING_BENEFITS.map((benefit, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#1A1A1A] border border-white/5 hover:border-[#D4A017]/30 transition-all">
                <div className="text-2xl mb-2">{benefit.icon}</div>
                <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-400">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Guarantee */}
          <div className="mt-12 p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-2">30-Day Money-Back Guarantee</h3>
            <p className="text-gray-400 max-w-lg mx-auto">
              Try SnapR risk-free. If you're not saving hours on every listing, we'll refund every penny. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMPARISON SECTION */}
      {/* ============================================ */}
      <section id="compare" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              SnapR vs. <span className="text-gray-500">The Rest</span>
            </h2>
            <p className="text-gray-400">See why real estate pros are switching</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4"></th>
                  <th className="py-4 px-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A017]/20 border border-[#D4A017]/50">
                      <span className="font-bold text-[#D4A017]">SnapR</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 text-gray-500">BoxBrownie</th>
                  <th className="py-4 px-4 text-gray-500">PhotoUp</th>
                  <th className="py-4 px-4 text-gray-500">Fotello</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Turnaround Time', snapr: '30 seconds', others: ['24-48 hours', '24 hours', '10 seconds'] },
                  { feature: 'Price per Image', snapr: '$0.40', others: ['$1.60+', '$1.50+', '$2+'] },
                  { feature: 'Social Media Content', snapr: '✓ 150+ templates', others: ['✗', '✗', '✗'] },
                  { feature: 'Video Creation', snapr: '✓ Auto-generated', others: ['✗', '✗', '✗'] },
                  { feature: 'Property Websites', snapr: '✓ Included', others: ['✗', '✗', '✗'] },
                  { feature: 'Email Campaigns', snapr: '✓ Included', others: ['✗', '✗', '✗'] },
                  { feature: 'Client Approval', snapr: '✓ Built-in', others: ['✓', '✓', '✗'] },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-400">{row.feature}</td>
                    <td className="py-4 px-4 text-center font-semibold text-[#D4A017]">{row.snapr}</td>
                    {row.others.map((val, j) => (
                      <td key={j} className="py-4 px-4 text-center text-gray-500">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-4">
              They do photo editing. <span className="text-white font-semibold">We do everything else too.</span>
            </p>
            <Link
              href="#founding"
              className="inline-flex items-center gap-2 text-[#D4A017] hover:text-[#F4C430] font-medium transition-colors"
            >
              Claim your Founding spot →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES */}
      {/* ============================================ */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Everything You Need. <span className="text-[#D4A017]">One Upload.</span>
            </h2>
            <p className="text-gray-400">From raw photos to market-ready in 3 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🖼️', title: 'AI Photo Enhancement', desc: 'Sky replacement, twilight, HDR, staging — 30 seconds.' },
              { icon: '📱', title: 'Social Media Content', desc: '150+ templates. AI writes captions. One click.' },
              { icon: '🎬', title: 'Auto Video Creation', desc: 'Professional listing videos with music. Instant.' },
              { icon: '🌐', title: 'Property Websites', desc: 'Beautiful single-property sites. Auto-generated.' },
              { icon: '📧', title: 'Email Campaigns', desc: 'Just Listed, Open House, Sold — ready to send.' },
              { icon: '✅', title: 'Client Approval', desc: 'Share galleries. Get approvals. No email chaos.' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/5 hover:border-[#D4A017]/30 transition-all">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="#founding" className="inline-flex items-center gap-2 text-[#D4A017] hover:text-[#F4C430] font-medium transition-colors">
              Get all this for $4/listing as a Founding Member →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { quote: "SnapR cut my listing prep from 3 hours to 15 minutes. I've doubled my client load.", name: 'Sarah M.', role: 'RE Photographer, LA' },
              { quote: "I canceled 4 subscriptions. SnapR does everything in one place.", name: 'Mike T.', role: 'Agent, Phoenix' },
              { quote: "The AI quality is incredible. Clients can't tell it's not manual editing.", name: 'Jennifer L.', role: 'Broker, Miami' },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/5">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-[#D4A017]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 mb-4 text-sm italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { stat: '10,000+', label: 'Listings Processed' },
              { stat: '250,000+', label: 'Photos Enhanced' },
              { stat: '2+ Hours', label: 'Saved Per Listing' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#D4A017]">{item.stat}</div>
                <div className="text-gray-500 text-sm mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#D4A017]/20 to-transparent border border-[#D4A017]/30 text-center relative overflow-hidden">
            <div className="shimmer absolute inset-0 pointer-events-none" />
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-400 text-sm font-semibold">Only {spotsRemaining} Founding spots left</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Don't Miss Your Chance
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Once the 50 spots are gone, this offer disappears. Get 50% off for your first 3 months.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="px-4 py-2 rounded-full bg-white/10">
                <span className="text-gray-500 line-through mr-2">$8</span>
                <span className="text-white font-bold">$4/listing</span>
                <span className="text-[#C8FCEA] ml-2">for 3 months</span>
              </div>
            </div>

            <Link
              href="/signup?plan=founding"
              className="inline-block px-10 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-[#D4A017]/30 transition-all transform hover:scale-105 pulse-gold"
            >
              🔥 Claim My Founding Spot Now
            </Link>

            <p className="text-gray-500 text-sm mt-4">3 free listings • No credit card • 30-day guarantee</p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              { q: 'What does "50% off for 3 months" mean?', a: 'As a Founding Member, you pay just $4/listing for your first 3 months. After that, you continue at our regular $8/listing rate. It\'s our way of saying thanks for believing in us early.' },
              { q: 'What happens after the 50 spots are filled?', a: 'The Founding Member offer disappears permanently. New users will pay regular pricing ($8/listing) from day one without the exclusive benefits or discount period.' },
              { q: 'Is there a contract or commitment?', a: 'No contracts. Pay per listing, cancel anytime. Plus you get 3 free listings to try before paying anything.' },
              { q: 'What if I\'m not satisfied?', a: 'We offer a 30-day money-back guarantee. If SnapR isn\'t saving you time, we refund everything. No questions asked.' },
              { q: 'Can I use SnapR for my entire team?', a: 'Yes! Founding Member benefits apply to your account. Contact us for team pricing with additional seats.' },
            ].map((faq, i) => (
              <details key={i} className="group p-4 rounded-xl bg-[#1A1A1A] border border-white/5">
                <summary className="flex items-center justify-between cursor-pointer text-white font-semibold">
                  {faq.q}
                  <span className="text-[#D4A017] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-gray-400 text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <span className="text-black font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold">SnapR</span>
            </div>
            
            <div className="flex gap-8 text-sm text-gray-400">
              <a href="#founding" className="hover:text-white transition-colors">Pricing</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            </div>

            <p className="text-sm text-gray-500">© 2026 SnapR. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Bottom padding for mobile CTA */}
      <div className="h-24 md:hidden"></div>
    </div>
  );
}
