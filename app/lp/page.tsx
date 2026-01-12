'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/before-after-slider';

// Pricing Slider Component
function PricingSlider() {
  const [listings, setListings] = useState(10);
  
  const getPricePerListing = (count: number) => {
    if (count >= 50) return 6;
    if (count >= 30) return 7;
    return 8;
  };
  
  const pricePerListing = getPricePerListing(listings);
  const totalPrice = listings * pricePerListing;
  const savings = listings >= 30 ? `Save $${listings * (8 - pricePerListing)}/mo` : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400">How many listings per month?</span>
        <span className="text-2xl font-bold text-white">{listings} listings</span>
      </div>
      
      <input
        type="range"
        min="1"
        max="100"
        value={listings}
        onChange={(e) => setListings(Number(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #D4A017 0%, #D4A017 ${listings}%, rgba(255,255,255,0.1) ${listings}%, rgba(255,255,255,0.1) 100%)`
        }}
      />
      
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>1</span>
        <span>50</span>
        <span>100</span>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-white/5 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-bold text-[#D4A017]">${totalPrice}</span>
          <span className="text-gray-400">/month</span>
        </div>
        <div className="text-gray-500 mt-1">
          ${pricePerListing} per listing
          {listings >= 30 && (
            <span className="ml-2 text-[#C8FCEA]">• Volume discount!</span>
          )}
        </div>
        {savings && (
          <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#C8FCEA]/10 text-[#C8FCEA] text-sm">
            {savings}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
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
      `}</style>

      {/* Floating CTA - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-50 md:hidden">
        <Link
          href="/pricing"
          className="block w-full py-4 px-6 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-center rounded-xl shadow-lg shadow-[#D4A017]/20"
        >
          Start Free Trial — $8/listing →
        </Link>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <span className="text-black font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold">SnapR</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#compare" className="text-gray-400 hover:text-white transition-colors">Compare</a>
              <Link
                href="/pricing"
                className="px-5 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4A017]/20 transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-[#0A0A0A]"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-[#0A0A0A]"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-[#0A0A0A]"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-[#0A0A0A]"></div>
              </div>
              <span className="text-sm text-gray-300">Trusted by <span className="text-white font-semibold">2,000+</span> real estate pros</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
              Save 2+ Hours Per Listing.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A017] to-[#F4C430]">
                Market-Ready in 3 Minutes.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              AI photo enhancement + social posts + videos + property websites + email campaigns.
              <span className="text-white"> One platform. One price.</span>
            </p>

            {/* Price Callout */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="px-5 py-2 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30">
                <span className="text-[#D4A017] font-bold text-lg">$8/listing</span>
                <span className="text-gray-400 ml-2">• Everything included</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
              <Link
                href="/pricing"
                className="px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-[#D4A017]/30 transition-all transform hover:scale-105"
              >
                Start Free Trial — No Credit Card
              </Link>
            </div>

            {/* Trust indicators */}
            <p className="text-sm text-gray-500">14-day free trial • Cancel anytime • 30-second setup</p>

            {/* Competitor comparison */}
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
              <span className="line-through">BoxBrownie $30+</span>
              <span className="line-through">Fotello ~$20</span>
              <span className="text-[#C8FCEA] font-medium">SnapR $8 ✓</span>
            </div>
          </div>

          {/* Hero Before/After */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#D4A017]/20 via-transparent to-[#D4A017]/20 rounded-3xl blur-2xl opacity-50"></div>
            
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <BeforeAfterSlider
                beforeUrl="/gallery/sky-before.jpg"
                afterUrl="/gallery/sky-after.jpg"
                beforeLabel="Before"
                afterLabel="After • 30 seconds"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {['Sky Replacement', 'Virtual Twilight', 'HDR Enhancement', 'Declutter', 'Virtual Staging'].map((feature) => (
                <span key={feature} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PROBLEM → SOLUTION (Quick) */}
      {/* ============================================ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Problem */}
            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/20">
              <div className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Without SnapR
              </div>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>6 different tools, 6 subscriptions, 6 logins</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>$150-200/month on fragmented software</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>2-3 hours per listing on marketing</span>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="p-6 rounded-2xl bg-[#D4A017]/5 border border-[#D4A017]/20">
              <div className="text-[#D4A017] font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                With SnapR
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#C8FCEA] mt-1">•</span>
                  <span>One platform, everything included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8FCEA] mt-1">•</span>
                  <span>$8/listing — predictable, pay-as-you-go</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C8FCEA] mt-1">•</span>
                  <span>3 minutes per listing, start to finish</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-[#D4A017] hover:text-[#F4C430] font-medium transition-colors"
            >
              Stop juggling tools → Start free trial
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* BEFORE/AFTER SHOWCASE */}
      {/* ============================================ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              AI Enhancement in <span className="text-[#D4A017]">30 Seconds</span>
            </h2>
            <p className="text-gray-400">Drag the slider to see the transformation</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { before: '/gallery/sky-before.jpg', after: '/gallery/sky-after.jpg', label: 'Sky Replacement' },
              { before: '/gallery/twilight-before.jpg', after: '/gallery/twilight-after.jpg', label: 'Virtual Twilight' },
              { before: '/gallery/staging-before.jpg', after: '/gallery/staging-after.jpg', label: 'Virtual Staging' },
              { before: '/gallery/hdr-before.jpg', after: '/gallery/hdr-after.jpg', label: 'HDR Enhancement' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/5">
                <div className="aspect-video">
                  <BeforeAfterSlider
                    beforeUrl={item.before}
                    afterUrl={item.after}
                    beforeLabel="Before"
                    afterLabel="After"
                  />
                </div>
                <div className="p-4 text-center border-t border-white/5">
                  <span className="text-[#D4A017] font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING SECTION */}
      {/* ============================================ */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple Pricing. <span className="text-[#D4A017]">Everything Included.</span>
            </h2>
            <p className="text-gray-400 text-lg">No hidden fees. No per-feature charges. Just one price per listing.</p>
          </div>

          <div className="bg-[#1A1A1A] rounded-3xl border border-white/10 overflow-hidden">
            
            {/* Price Header */}
            <div className="p-8 sm:p-12 text-center border-b border-white/10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-5xl sm:text-6xl font-bold text-white">$8</span>
                <span className="text-xl text-gray-400">/ listing</span>
              </div>
              <p className="text-gray-400">Photos + Content + Video + Website + Email</p>
              
              {/* Competitor Comparison */}
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
                <div className="px-3 py-1 rounded-full bg-white/5 text-gray-500">
                  <span className="line-through">BoxBrownie $30+</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 text-gray-500">
                  <span className="line-through">Fotello ~$20</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#C8FCEA]/10 text-[#C8FCEA]">
                  SnapR $8 (with 5x more features)
                </div>
              </div>
            </div>

            {/* Slider Section */}
            <div className="p-8 sm:p-12 border-b border-white/10">
              <PricingSlider />
            </div>

            {/* Features List */}
            <div className="p-8 sm:p-12">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-6 text-center">Everything included with every listing</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'AI Photo Enhancement (15 tools)',
                  'Sky Replacement & Twilight',
                  'Virtual Staging',
                  'HDR & Color Correction',
                  '150+ Social Media Templates',
                  'AI-Written Captions',
                  'Auto Video Creation',
                  'Property Website',
                  'Email Campaign Templates',
                  'Client Approval System',
                  'Unlimited Revisions',
                  'Commercial License',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#C8FCEA] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-10 text-center">
                <Link
                  href="/pricing"
                  className="inline-block px-10 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-[#D4A017]/30 transition-all transform hover:scale-105"
                >
                  Start Free Trial — No Credit Card
                </Link>
                <p className="text-gray-500 text-sm mt-4">14-day free trial • Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* US VS THEM */}
      {/* ============================================ */}
      <section id="compare" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              SnapR vs <span className="text-gray-500">Everyone Else</span>
            </h2>
            <p className="text-gray-400">They do photo editing. We do everything.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                  <th className="py-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                        <span className="text-black font-bold text-xs">S</span>
                      </div>
                      <span className="text-[#D4A017] font-bold text-sm">SnapR</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 text-gray-500 font-medium text-sm">BoxBrownie</th>
                  <th className="py-4 px-4 text-gray-500 font-medium text-sm">Fotello</th>
                  <th className="py-4 px-4 text-gray-500 font-medium text-sm">PhotoUp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Speed', snapr: '30 sec', box: '24-48 hrs', fot: '~10 sec', photo: '24 hrs' },
                  { feature: 'Photo Enhancement', snapr: true, box: true, fot: true, photo: true },
                  { feature: 'Social Templates', snapr: '150+', box: false, fot: false, photo: false },
                  { feature: 'Video Creation', snapr: true, box: false, fot: false, photo: false },
                  { feature: 'Property Websites', snapr: true, box: false, fot: false, photo: false },
                  { feature: 'Email Campaigns', snapr: true, box: false, fot: false, photo: false },
                  { feature: 'AI Captions', snapr: true, box: false, fot: false, photo: false },
                  { feature: 'Price', snapr: '$8/listing', box: '$30+', fot: '~$20', photo: '$7/hr' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-4 px-4 text-white font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.snapr === 'boolean' ? (
                        row.snapr ? (
                          <svg className="w-5 h-5 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : (
                        <span className="text-[#C8FCEA] font-medium">{row.snapr}</span>
                      )}
                    </td>
                    {[row.box, row.fot, row.photo].map((val, j) => (
                      <td key={j} className="py-4 px-4 text-center">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <svg className="w-5 h-5 text-gray-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-700 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )
                        ) : (
                          <span className="text-gray-500">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Line */}
          <div className="mt-10 text-center">
            <p className="text-xl text-gray-400">
              They do photo editing. <span className="text-white font-semibold">We do everything else too.</span>
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 mt-4 text-[#D4A017] hover:text-[#F4C430] font-medium transition-colors"
            >
              Switch to SnapR →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES (Crisp) */}
      {/* ============================================ */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Everything You Need. <span className="text-[#D4A017]">One Upload.</span>
            </h2>
            <p className="text-gray-400">From raw photos to market-ready in 3 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🖼️',
                title: 'AI Photo Enhancement',
                desc: 'Sky replacement, twilight, HDR, staging — 30 seconds.',
              },
              {
                icon: '📱',
                title: 'Social Media Content',
                desc: '150+ templates. AI writes captions. One click.',
              },
              {
                icon: '🎬',
                title: 'Auto Video Creation',
                desc: 'Professional listing videos with music. Instant.',
              },
              {
                icon: '🌐',
                title: 'Property Websites',
                desc: 'Beautiful single-property sites. Auto-generated.',
              },
              {
                icon: '📧',
                title: 'Email Campaigns',
                desc: 'Just Listed, Open House, Sold — ready to send.',
              },
              {
                icon: '✅',
                title: 'Client Approval',
                desc: 'Share galleries. Get approvals. No email chaos.',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/5 hover:border-[#D4A017]/30 transition-all">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-[#D4A017] hover:text-[#F4C430] font-medium transition-colors"
            >
              Get all this for $8/listing →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS + STATS */}
      {/* ============================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          
          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                quote: "SnapR cut my listing prep from 3 hours to 15 minutes. I've doubled my client load.",
                name: 'Sarah M.',
                role: 'RE Photographer, LA',
              },
              {
                quote: "I canceled 4 subscriptions. SnapR does everything in one place.",
                name: 'Mike T.',
                role: 'Agent, Phoenix',
              },
              {
                quote: "The AI quality is incredible. Clients can't tell it's not manual editing.",
                name: 'Jennifer L.',
                role: 'Broker, Miami',
              },
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
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#D4A017]/20 to-transparent border border-[#D4A017]/30 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Save 2+ Hours Per Listing?
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Join 2,000+ real estate pros. Start your free trial today.
            </p>
            
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="px-4 py-2 rounded-full bg-white/10">
                <span className="text-white font-bold">$8/listing</span>
                <span className="text-gray-400 ml-2">• Everything included</span>
              </div>
            </div>

            <Link
              href="/pricing"
              className="inline-block px-10 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-[#D4A017]/30 transition-all transform hover:scale-105"
            >
              Start Free Trial — No Credit Card
            </Link>

            <p className="text-gray-500 text-sm mt-4">14-day free trial • Cancel anytime • 30-second setup</p>
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
              <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/features" className="hover:text-white transition-colors">Features</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            </div>

            <p className="text-sm text-gray-500">
              © 2026 SnapR. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Bottom padding for mobile CTA */}
      <div className="h-24 md:hidden"></div>
    </div>
  );
}
