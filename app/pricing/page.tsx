'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Zap, ArrowRight, Bell, Wand2, Video, Users, Building2, TrendingUp } from 'lucide-react';

const PRICING = {
  free: { listings: 3, price: 0 },
  pro: { listings: 30, priceMonthly: 449, priceAnnual: 359 },
  agency: { listings: 50, priceMonthly: 649, priceAnnual: 519 },
};

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  const proPrice = annual ? PRICING.pro.priceAnnual : PRICING.pro.priceMonthly;
  const agencyPrice = annual ? PRICING.agency.priceAnnual : PRICING.agency.priceMonthly;
  const proPerListing = (proPrice / PRICING.pro.listings).toFixed(2);
  const agencyPerListing = (agencyPrice / PRICING.agency.listings).toFixed(2);

  const FeatureCheck = ({ value }: { value: boolean | string }) => {
    if (value === true) return <Check className="w-5 h-5 text-green-400" />;
    if (value === false) return <X className="w-5 h-5 text-white/20" />;
    return <span className="text-sm text-white/80">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black text-xl">S</div>
            <span className="text-xl font-bold">SnapR</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-white/60 hover:text-white">Log in</Link>
            <Link href="/auth/signup" className="px-4 py-2 bg-[#D4A017] text-black rounded-lg font-medium">Start Free</Link>
          </div>
        </div>
      </header>

      <section className="py-16 text-center px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-sm mb-6">
          <Zap className="w-4 h-4" />
          Stop paying $1,000+/mo for 8 different tools
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-4xl mx-auto leading-tight">
          The <span className="text-[#D4A017]">Complete</span> Real Estate Marketing OS
        </h1>
        
        <p className="text-xl text-white/60 mb-4 max-w-2xl mx-auto">
          Photo editing, video creation, content studio, virtual tours, client approval, 
          email marketing, social publishing, WhatsApp alerts — <span className="text-white font-semibold">ALL IN ONE</span>
        </p>
        
        <p className="text-lg mb-8">
          <span className="text-white/50">Fotello charges $12-14/listing for</span>{' '}
          <span className="text-red-400 line-through">just editing</span>{' '}
          <span className="text-white/50">→</span>{' '}
          <span className="text-[#D4A017] font-bold">SnapR gives you EVERYTHING for ${proPerListing}-${agencyPerListing}/listing</span>
        </p>

        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mb-12">
          {['15 AI Enhancement Tools', 'Content Studio', 'Video Creator', 'Email Marketing', 'Property Sites', 'Virtual Tours', 'Client Approval', 'CMA Reports', 'WhatsApp', 'Social Publishing'].map((f) => (
            <span key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70">✓ {f}</span>
          ))}
        </div>
      </section>

      <section className="py-12 px-6 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="flex items-center gap-1 p-1.5 bg-white/5 border border-white/10 rounded-full">
              <button onClick={() => setAnnual(false)} className={`px-6 py-2.5 rounded-full font-medium transition-all ${!annual ? 'bg-[#D4A017] text-black' : 'text-white/50'}`}>
                Monthly
              </button>
              <button onClick={() => setAnnual(true)} className={`px-6 py-2.5 rounded-full font-medium transition-all ${annual ? 'bg-[#D4A017] text-black' : 'text-white/50'}`}>
                Annual<span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <p className="text-white/50 text-sm">Try SnapR risk-free</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-white/50">/forever</span>
              </div>
              <div className="mb-6 p-3 bg-white/5 rounded-lg">
                <span className="text-2xl font-bold text-[#D4A017]">3</span>
                <span className="text-white/60 ml-2">listings/month</span>
              </div>
              <Link href="/auth/signup?plan=free" className="block w-full py-3 text-center border border-white/20 rounded-xl font-medium hover:bg-white/5 transition mb-6">
                Start Free
              </Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 3 listings/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> All 15 AI enhancements</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 10 social templates</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-white/20" /> Watermarked exports</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border-2 border-[#D4A017] bg-[#D4A017]/5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4A017] text-black text-sm font-bold rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <p className="text-white/50 text-sm">For active agents</p>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold">${proPrice}</span>
                <span className="text-white/50">/month</span>
              </div>
              {annual && <p className="text-green-400 text-sm mb-4">Billed annually (save $1,080/year)</p>}
              <div className="mb-6 p-3 bg-[#D4A017]/10 rounded-lg border border-[#D4A017]/30">
                <span className="text-2xl font-bold text-[#D4A017]">30</span>
                <span className="text-white/60 ml-2">listings/month</span>
                <span className="text-green-400 ml-2">${proPerListing}/listing</span>
              </div>
              <Link href="/auth/signup?plan=pro" className="block w-full py-3 text-center bg-[#D4A017] text-black rounded-xl font-bold hover:bg-[#B8860B] transition mb-6">
                Start Pro Trial
              </Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 30 listings/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> All 15 AI enhancements</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 150+ social templates</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Unlimited AI videos</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> AI voiceovers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 360 virtual tours</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Client approval</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> CMA reports</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Email marketing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Social publishing</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/5">
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1 text-purple-400">Agency</h3>
                <p className="text-white/50 text-sm">For teams</p>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold">${agencyPrice}</span>
                <span className="text-white/50">/month</span>
              </div>
              {annual && <p className="text-green-400 text-sm mb-4">Billed annually (save $1,560/year)</p>}
              <div className="mb-6 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <span className="text-2xl font-bold text-purple-400">50</span>
                <span className="text-white/60 ml-2">listings/month</span>
                <span className="text-green-400 ml-2">${agencyPerListing}/listing</span>
              </div>
              <Link href="/auth/signup?plan=agency" className="block w-full py-3 text-center bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition mb-6">
                Start Agency Trial
              </Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 50 listings/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Everything in Pro</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 5+ team members</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> White-label option</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Priority support</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> API access</li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[#D4A017]/30 bg-[#D4A017]/5 mb-12">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D4A017]" />
              Why SnapR vs Fotello?
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-red-400">Fotello ($12-14/listing)</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Photo editing ONLY</li>
                  <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> No video creation</li>
                  <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> No virtual tours</li>
                  <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> No content studio</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-[#D4A017]">SnapR Pro (${proPerListing}/listing)</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 15 AI enhancement tools</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Unlimited AI videos</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 360 virtual tours</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 150+ content templates</li>
                </ul>
              </div>
            </div>
            <p className="mt-6 text-center text-lg">
              <span className="text-white/50">Same price per listing, </span>
              <span className="text-[#D4A017] font-bold">10x the features</span>
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">FAQ</h2>
          <div className="space-y-4">
            {[
              ['How does listing-based pricing work?', 'You pay per listing, not per photo. Each listing can have unlimited photos.'],
              ['What counts as a listing?', 'A listing is one property. Upload as many photos as you want.'],
              ['Why is SnapR cheaper than Fotello?', 'Fotello charges $12-14 for JUST editing. SnapR includes everything.'],
              ['Can I cancel anytime?', 'Yes. Monthly plans can be cancelled anytime.']
            ].map(([q, a], i) => (
              <details key={i} className="group bg-black rounded-xl border border-white/10 overflow-hidden">
                <summary className="p-5 cursor-pointer font-medium flex items-center justify-between">{q}<span className="text-[#D4A017] group-open:rotate-45 transition-transform text-xl">+</span></summary>
                <p className="px-5 pb-5 text-white/60">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to 10x Your Listing Game?</h2>
        <p className="text-white/60 mb-8 text-lg">Join thousands of agents who switched to SnapR</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup?plan=free" className="px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl text-lg flex items-center gap-2">
            Start Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/contact" className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold">Book a Demo</Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">© 2025 SnapR. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
