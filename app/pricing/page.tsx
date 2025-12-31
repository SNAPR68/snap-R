'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Sparkles, Building2, Zap, ArrowRight, Bell, Camera, Wand2, Video, Mail, Globe, Users, Smartphone, FileText, Share2, Palette, Image, Clock, Shield, TrendingUp, Download, Eye, Layers } from 'lucide-react';

const PRO_TIERS = [
  { listings: 10, perListing: 9, perListingAnnual: 7 },
  { listings: 20, perListing: 8.5, perListingAnnual: 6.75 },
  { listings: 30, perListing: 8, perListingAnnual: 6.5 },
  { listings: 50, perListing: 7.5, perListingAnnual: 6 },
  { listings: 75, perListing: 7, perListingAnnual: 5.5 },
  { listings: 100, perListing: null, perListingAnnual: null, enterprise: true },
];
const AGENCY_PREMIUM = 2;
const FREE_LISTINGS = 3;

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(2);
  
  const currentTier = PRO_TIERS[sliderIndex];
  const isEnterprise = currentTier.enterprise;
  
  const perListing = annual ? currentTier.perListingAnnual : currentTier.perListing;
  const proTotal = isEnterprise ? null : currentTier.listings * perListing!;
  const agencyPerListing = isEnterprise ? null : perListing! + AGENCY_PREMIUM;
  const agencyTotal = isEnterprise ? null : currentTier.listings * agencyPerListing!;
  const proFirstMonth = proTotal ? Math.round(proTotal * 0.75) : null;

  const FeatureCheck = ({ value }: { value: boolean | string }) => {
    if (value === true) return <Check className="w-5 h-5 text-green-400" />;
    if (value === false) return <X className="w-5 h-5 text-white/20" />;
    return <span className="text-sm text-white/80">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-50">
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

      {/* Hero */}
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
          <span className="text-[#D4A017] font-bold">SnapR gives you EVERYTHING for $7-9/listing</span>
        </p>

        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mb-12">
          {['15 AI Enhancement Tools', 'Content Studio (150+ templates)', 'Video Creator + AI Voiceovers', 'Email Marketing (24 templates)', 'Property Sites (4 themes)', '360° Virtual Tours', 'Client Approval Workflow', 'CMA Reports', 'WhatsApp Notifications', 'Social Publishing (5 platforms)', 'Mobile Editing', 'Team Management'].map((f) => (
            <span key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70">✓ {f}</span>
          ))}
        </div>
      </section>

      {/* Pricing Calculator */}
      <section className="py-12 px-6 bg-gradient-to-b from-[#0A0A0A] to-[#111]">
        <div className="max-w-5xl mx-auto">
          
          {/* Toggle */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="flex items-center gap-1 p-1.5 bg-white/5 border border-white/10 rounded-full">
              <button onClick={() => setAnnual(false)} className={`px-6 py-2.5 rounded-full font-medium transition-all ${!annual ? 'bg-[#D4A017] text-black' : 'text-white/50'}`}>
                Monthly<span className="block text-xs font-normal">(1 week free)</span>
              </button>
              <button onClick={() => setAnnual(true)} className={`px-6 py-2.5 rounded-full font-medium transition-all ${annual ? 'bg-[#D4A017] text-black' : 'text-white/50'}`}>
                Annual<span className="block text-xs font-normal">(1 month free)</span>
              </button>
            </div>
          </div>

          {/* Slider */}
          <div className="flex flex-col items-center mb-10">
            <label className="text-white/50 text-sm mb-3">How many listings do you handle per month?</label>
            <div className="flex items-center gap-4 w-full max-w-md">
              <span className="text-sm text-white/40">10</span>
              <input
                type="range" min="0" max="5" value={sliderIndex}
                onChange={(e) => setSliderIndex(parseInt(e.target.value))}
                className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D4A017]"
                style={{ background: `linear-gradient(to right, #D4A017 0%, #D4A017 ${sliderIndex * 20}%, rgba(255,255,255,0.1) ${sliderIndex * 20}%, rgba(255,255,255,0.1) 100%)` }}
              />
              <span className="text-sm text-white/40">100+</span>
            </div>
            <div className="mt-3 text-3xl font-bold text-[#D4A017]">
              {isEnterprise ? 'Enterprise' : `${currentTier.listings} listings/month`}
            </div>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* FREE */}
            <div className="rounded-2xl p-6 bg-white/5 border border-white/10 flex flex-col">
              <h3 className="text-2xl font-bold mb-1">Free</h3>
              <p className="text-white/50 text-sm mb-4">Try everything risk-free</p>
              <div className="mb-6"><span className="text-5xl font-bold">$0</span><span className="text-white/50">/forever</span></div>
              <div className="p-4 bg-white/5 rounded-xl mb-6">
                <div className="flex justify-between text-sm mb-2"><span className="text-white/50">Listings</span><span className="font-semibold">{FREE_LISTINGS}/month</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-white/50">AI Tools</span><span className="font-semibold">All 15</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/50">Exports</span><span className="font-semibold text-yellow-400">Watermarked</span></div>
              </div>
              <Link href="/auth/signup" className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-center transition-all block">Start Free</Link>
              <p className="text-center text-xs text-white/30 mt-3">No credit card required</p>
            </div>

            {/* PRO */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#D4A017]/20 to-transparent border-2 border-[#D4A017] flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4A017] text-black text-sm font-bold rounded-full">Most Popular</div>
              <h3 className="text-2xl font-bold mb-1">Pro</h3>
              <p className="text-white/50 text-sm mb-4">For agents & photographers</p>
              <div className="mb-2">
                {isEnterprise ? <span className="text-4xl font-bold">Custom</span> : <><span className="text-5xl font-bold text-[#D4A017]">${perListing}</span><span className="text-white/50">/listing</span></>}
              </div>
              {!isEnterprise && (
                <div className="mb-6">
                  <p className="text-sm text-white/50">= <span className="text-white font-semibold">${proTotal}/mo</span> for {currentTier.listings} listings</p>
                  <p className="text-xs text-green-400 mt-1">{annual ? `1 month free = save $${currentTier.listings * currentTier.perListing!}/year` : `First month only $${proFirstMonth} (1 week free!)`}</p>
                </div>
              )}
              <div className="p-4 bg-black/30 rounded-xl mb-6">
                <div className="flex justify-between text-sm mb-2"><span className="text-white/50">Listings</span><span className="font-semibold">{isEnterprise ? 'Custom' : `${currentTier.listings}/month`}</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-white/50">Processing</span><span className="font-semibold text-[#D4A017]">Priority (30 sec)</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/50">Exports</span><span className="font-semibold text-green-400">Clean HD</span></div>
              </div>
              <Link href={isEnterprise ? '/contact' : '/auth/signup?plan=pro'} className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl font-semibold text-black text-center transition-all hover:opacity-90 block">
                {isEnterprise ? 'Contact Sales' : 'Start Pro Trial'}
              </Link>
              <p className="text-center text-xs text-white/30 mt-3">{annual ? '14-day money-back guarantee' : '7-day free trial'}</p>
            </div>

            {/* AGENCY */}
            <div className="rounded-2xl p-6 bg-white/5 border border-white/10 flex flex-col">
              <h3 className="text-2xl font-bold mb-1">Agency</h3>
              <p className="text-white/50 text-sm mb-4">For teams & brokerages</p>
              <div className="mb-2">
                {isEnterprise ? <span className="text-4xl font-bold">Custom</span> : <><span className="text-5xl font-bold">${agencyPerListing}</span><span className="text-white/50">/listing</span></>}
              </div>
              {!isEnterprise && (
                <div className="mb-6">
                  <p className="text-sm text-white/50">= <span className="text-white font-semibold">${agencyTotal}/mo</span> for {currentTier.listings} listings</p>
                  <p className="text-xs text-purple-400 mt-1">+$2/listing includes team features</p>
                </div>
              )}
              <div className="p-4 bg-white/5 rounded-xl mb-6">
                <div className="flex justify-between text-sm mb-2"><span className="text-white/50">Team Members</span><span className="font-semibold">5 included</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-white/50">Processing</span><span className="font-semibold text-purple-400">Instant</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/50">Exports</span><span className="font-semibold text-green-400">Clean 4K</span></div>
              </div>
              <Link href={isEnterprise ? '/contact' : '/auth/signup?plan=agency'} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-center transition-all block">
                {isEnterprise ? 'Contact Sales' : 'Start Agency Trial'}
              </Link>
              <p className="text-center text-xs text-white/30 mt-3">Dedicated account manager</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Comparison */}
      <section className="py-16 px-6 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">The Math is Simple</h2>
          <p className="text-white/60 text-center mb-10">What you'd pay separately vs SnapR</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2"><X className="w-5 h-5" /> Without SnapR</h3>
              <ul className="space-y-3">
                {[['Fotello/BoxBrownie (editing)', '$300-500/mo'], ['Hootsuite (social)', '$99/mo'], ['Canva Pro (content)', '$15/mo'], ['CloudPano (virtual tours)', '$50/mo'], ['Client approval tool', '$30/mo'], ['Email marketing', '$30/mo'], ['Property websites', '$20/mo'], ['Video creation', '$30/mo']].map(([name, price]) => (
                  <li key={name} className="flex justify-between text-sm"><span className="text-white/60">{name}</span><span>{price}</span></li>
                ))}
                <li className="flex justify-between border-t border-white/10 pt-3 font-bold"><span>Total</span><span className="text-red-400">$574-774/mo</span></li>
              </ul>
              <p className="text-xs text-white/40 mt-3">Plus managing 8 different logins...</p>
            </div>
            <div className="p-6 bg-[#D4A017]/5 border border-[#D4A017]/30 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 text-[#D4A017] flex items-center gap-2"><Check className="w-5 h-5" /> With SnapR Pro</h3>
              <ul className="space-y-3">
                {['15 AI Enhancement Tools', 'Content Studio (150+ templates)', 'Video Creator + AI Voiceovers', 'Virtual Tours', 'Client Approval', 'Email Marketing', 'Property Sites', 'Social Publishing + WhatsApp'].map((f) => (
                  <li key={f} className="flex justify-between text-sm"><span className="text-white/60">{f}</span><span className="text-green-400">Included</span></li>
                ))}
                <li className="flex justify-between border-t border-white/10 pt-3 font-bold"><span>Total ({currentTier.listings} listings)</span><span className="text-[#D4A017]">{isEnterprise ? 'Custom' : `$${proTotal}/mo`}</span></li>
              </ul>
              <p className="text-center mt-4 text-green-400 font-bold text-lg">
                {isEnterprise ? 'Maximum savings at scale' : `Save $${774 - (proTotal || 195)}+/month (${Math.round(((774 - (proTotal || 195)) / 774) * 100)}%+)`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Tables */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Complete Feature Comparison</h2>
          <p className="text-white/60 text-center mb-10">Every feature included in SnapR</p>
          
          {[
            { name: 'AI Photo Enhancement', icon: Wand2, features: [
              ['Sky Replacement', true, true, true], ['Virtual Twilight', true, true, true], ['Lawn Repair', true, true, true], 
              ['Declutter & Object Removal', true, true, true], ['Virtual Staging', true, true, true], ['HDR Enhancement', true, true, true],
              ['Processing Speed', '60 sec', '30 sec', 'Instant']
            ]},
            { name: 'Content Studio & Video', icon: Video, features: [
              ['Social Media Templates', '10', '150+', '150+ + Custom'], ['Platforms Supported', '2', '5', '5 + API'],
              ['AI Video Generation', '1/mo', 'Unlimited', 'Unlimited'], ['AI Voiceovers (ElevenLabs)', false, true, true],
              ['Email Marketing Templates', '4', '24', '24 + Custom']
            ]},
            { name: 'Marketing & Client Tools', icon: Users, features: [
              ['Property Landing Pages', 'Basic', '4 Themes', 'Custom'], ['360° Virtual Tours', false, true, 'Unlimited'],
              ['Client Approval Workflow', true, true, true], ['CMA Reports', false, true, true], ['Social Publishing', false, true, true]
            ]},
            { name: 'Notifications & Mobile', icon: Bell, features: [
              ['WhatsApp Integration', 'Basic', 'Full', 'Full + Team'], ['Client View Alerts', true, true, true],
              ['Daily Morning Briefings', false, true, true], ['Mobile Editing (Industry First)', true, true, true],
              ['iOS & Android Apps', 'Coming', 'Coming', 'Priority']
            ]},
            { name: 'Exports & Team', icon: Building2, features: [
              ['Export Quality', 'Watermarked', 'Clean HD', 'Clean 4K'], ['Team Members', '1', '1', '5+'],
              ['White-Label Option', false, false, true], ['Support', 'Community', 'Email', 'Priority + Phone']
            ]}
          ].map((cat) => (
            <div key={cat.name} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden mb-6">
              <div className="p-4 bg-white/5 flex items-center gap-3 border-b border-white/10">
                <cat.icon className="w-5 h-5 text-[#D4A017]" />
                <h3 className="font-semibold">{cat.name}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/50 font-medium">Feature</th>
                    <th className="text-center p-4 text-white/50 font-medium w-28">Free</th>
                    <th className="text-center p-4 text-[#D4A017] font-medium w-28">Pro</th>
                    <th className="text-center p-4 text-purple-400 font-medium w-28">Agency</th>
                  </tr></thead>
                  <tbody>
                    {cat.features.map(([name, free, pro, agency], i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 text-sm text-white/80">{name}</td>
                        <td className="p-4 text-center"><FeatureCheck value={free} /></td>
                        <td className="p-4 text-center bg-[#D4A017]/5"><FeatureCheck value={pro} /></td>
                        <td className="p-4 text-center"><FeatureCheck value={agency} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              ['How does listing-based pricing work?', 'You pay per listing, not per photo. Each listing can have unlimited photos. All AI enhancements, content creation, video generation, etc. are included at no extra cost.'],
              ['What counts as a listing?', 'A listing is one property. Upload as many photos as you want (up to 200 per listing). All photos get AI-enhanced. Creating a new property counts as one listing.'],
              ["What's the \"1 week free\" on monthly?", 'Your first month is 25% off. So if Pro would normally be $240/mo, your first month is only $180.'],
              ['Why is SnapR so much cheaper than Fotello?', 'Fotello charges $12-14/listing for JUST photo editing. SnapR includes everything: editing, content studio, video creator, virtual tours, email marketing, social publishing, WhatsApp alerts, and more.'],
              ['Can I cancel anytime?', 'Yes. Monthly plans can be cancelled anytime. Annual plans can be cancelled with a prorated refund in the first 30 days.']
            ].map(([q, a], i) => (
              <details key={i} className="group bg-[#0A0A0A] rounded-xl border border-white/10 overflow-hidden">
                <summary className="p-5 cursor-pointer font-medium flex items-center justify-between">{q}<span className="text-[#D4A017] group-open:rotate-45 transition-transform text-xl">+</span></summary>
                <p className="px-5 pb-5 text-white/60">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to 10x Your Listing Game?</h2>
        <p className="text-white/60 mb-8 text-lg">Join thousands of agents and photographers who switched to SnapR</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup" className="px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl text-lg flex items-center gap-2">
            Start Free — 3 Listings/Month <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/contact" className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold">Book a Demo</Link>
        </div>
        <p className="text-white/40 text-sm mt-4">No credit card required • Cancel anytime</p>
      </section>

      {/* Footer */}
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
