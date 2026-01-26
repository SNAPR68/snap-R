'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles, Zap, Clock, DollarSign, BarChart3, Palette, Mail, Video, Share2, Camera, Layers } from 'lucide-react';

// Feature comparison data - generic "Traditional Services" instead of Fotello
const COMPARISON = [
  { feature: 'AI Photo Enhancement', traditional: true, snapr: true, note: '' },
  { feature: 'HDR / Window Pull', traditional: true, snapr: true, note: '' },
  { feature: 'Sky Replacement', traditional: true, snapr: true, note: '' },
  { feature: 'Virtual Twilight', traditional: '1-2/listing', snapr: 'Unlimited', note: 'SnapR advantage' },
  { feature: 'Virtual Staging', traditional: '1-2/listing', snapr: '2/listing', note: '' },
  { feature: 'Content Studio (150+ templates)', traditional: false, snapr: true, note: 'SnapR exclusive' },
  { feature: 'Social Media Posting', traditional: false, snapr: true, note: 'SnapR exclusive' },
  { feature: 'Email Marketing', traditional: false, snapr: true, note: 'SnapR exclusive' },
  { feature: 'AI Video Creator', traditional: false, snapr: true, note: 'SnapR exclusive' },
  { feature: 'AI Voiceovers', traditional: false, snapr: true, note: 'SnapR exclusive' },
  { feature: 'Property Gallery', traditional: true, snapr: true, note: '' },
  { feature: 'WhatsApp Notifications', traditional: false, snapr: true, note: 'SnapR exclusive' },
  { feature: 'CMA Reports', traditional: false, snapr: true, note: 'SnapR exclusive' },
  { feature: 'White Label', traditional: 'Extra cost', snapr: 'Brokerage', note: '' },
  { feature: 'Unlimited Volume Pricing', traditional: false, snapr: '$599/mo', note: 'SnapR advantage' },
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "We dropped 4 separate subscriptions and save $400/month. But the real win is time - I create a week's worth of social content in 10 minutes.",
    name: "Sarah C.",
    title: "Team Lead, 25 listings/month",
  },
  {
    quote: "My photo editor was great, but I still needed Canva, a scheduling tool, and email software. SnapR replaced everything.",
    name: "Marcus W.",
    title: "Solo Agent, Austin TX",
  },
  {
    quote: "At 80 listings/month, we were spending $2,500+ on editing and marketing tools. Now it's $599. The math speaks for itself.",
    name: "Jennifer P.",
    title: "Brokerage Owner, 12 agents",
  },
];

export default function WhySnapRPage() {
  const [listingCount, setListingCount] = useState(30);

  // Calculate costs - generic "traditional" pricing (~$25-30/listing is industry standard)
  const traditionalEditingCost = 27 * listingCount; // Industry average
  const toolsCost = 15 + 99 + 30 + 30; // Canva + Hootsuite + Mailchimp + Video
  const traditionalTotal = traditionalEditingCost + toolsCost;
  
  const snaprProCost = 99 + (18 * listingCount);
  const snaprTeamCost = 299 + (12 * listingCount);
  const snaprBrokerageCost = 599;
  
  const getSnaprCost = () => {
    if (listingCount <= 30) return snaprProCost;
    if (listingCount <= 50) return snaprTeamCost;
    return snaprBrokerageCost;
  };

  const savings = traditionalTotal - getSnaprCost();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black text-lg">
              S
            </div>
            <span className="text-xl font-semibold">Snap<span className="text-[#D4A017]">R</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-white/70 hover:text-white transition">Pricing</Link>
            <Link href="/auth/login" className="text-white/70 hover:text-white transition">Log in</Link>
            <Link href="/auth/signup" className="bg-[#D4A017] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#B8860B] transition">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#D4A017]/10 text-[#D4A017] px-4 py-2 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Why SnapR?
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Photo Editors Stop at Delivery.
              <br />
              <span className="text-[#D4A017]">SnapR Takes You to Published.</span>
            </h1>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Why pay for photo editing AND separate marketing tools? SnapR is the all-in-one platform that replaces your photo editor + Canva + Hootsuite + Mailchimp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="bg-[#D4A017] text-black px-8 py-4 rounded-lg font-medium hover:bg-[#B8860B] transition flex items-center gap-2 text-lg"
              >
                Try Free - 3 Listings <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="https://calendly.com/rajesh-snap-r/30min"
                className="bg-white/10 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/20 transition text-lg"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">The Problem With Photo-Only Services</h2>
            <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
              Traditional photo editing services do one thing well - edit photos. But what happens after?
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Old Way */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                  <X className="w-8 h-8" />
                  The Traditional Workflow
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium">Upload to Photo Editor</p>
                      <p className="text-white/50 text-sm">Photos edited, delivered. Done... right?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium">Open Canva</p>
                      <p className="text-white/50 text-sm">Create social posts from scratch</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium">Open Hootsuite / Buffer</p>
                      <p className="text-white/50 text-sm">Schedule posts manually</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">4</div>
                    <div>
                      <p className="font-medium">Open Mailchimp</p>
                      <p className="text-white/50 text-sm">Build email campaign</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">5</div>
                    <div>
                      <p className="font-medium">Find Video Tool</p>
                      <p className="text-white/50 text-sm">Create property video somehow</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-red-500/30">
                  <p className="text-red-400 font-bold">5 tools. 3+ hours. $500+/month.</p>
                </div>
              </div>

              {/* SnapR Way */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-3">
                  <Check className="w-8 h-8" />
                  The SnapR Workflow
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium">Upload to SnapR</p>
                      <p className="text-white/50 text-sm">Photos enhanced automatically</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium">Click "Generate Marketing"</p>
                      <p className="text-white/50 text-sm">Social posts, emails, video - instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium">Click "Publish"</p>
                      <p className="text-white/50 text-sm">Post everywhere with one click</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 opacity-30">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">-</div>
                    <div>
                      <p className="font-medium line-through">No Canva needed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 opacity-30">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">-</div>
                    <div>
                      <p className="font-medium line-through">No scheduling tools needed</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-green-500/30">
                  <p className="text-green-400 font-bold">1 platform. 10 minutes. Save 35%+.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cost Calculator */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Calculate Your Savings</h2>
            <p className="text-white/60 text-center mb-12">See how much you'll save by consolidating your tools</p>

            {/* Slider */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <span className="text-white/60">Listings per month:</span>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={listingCount}
                onChange={(e) => setListingCount(parseInt(e.target.value))}
                className="w-48 accent-[#D4A017]"
              />
              <span className="text-4xl font-bold text-[#D4A017] w-16">{listingCount}</span>
            </div>

            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Traditional Stack */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4 text-white/70">Traditional Photo Editor + Marketing Tools</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-white/60">Photo editing ({listingCount} × ~$27)</span>
                    <span>${traditionalEditingCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Canva Pro</span>
                    <span>$15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Social scheduling</span>
                    <span>$99</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Email marketing</span>
                    <span>$30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Video tools</span>
                    <span>$30</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-red-400">${traditionalTotal}/mo</span>
                  </div>
                </div>
              </div>

              {/* SnapR */}
              <div className="bg-gradient-to-b from-[#D4A017]/20 to-transparent rounded-2xl p-6 border-2 border-[#D4A017]">
                <h3 className="text-xl font-bold mb-4 text-[#D4A017]">SnapR (All-in-One)</h3>
                <div className="space-y-3 mb-6">
                  {listingCount <= 30 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/60">Pro base</span>
                        <span>$99</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Listings ({listingCount} × $18)</span>
                        <span>${18 * listingCount}</span>
                      </div>
                    </>
                  ) : listingCount <= 50 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/60">Team plan</span>
                        <span>Custom</span>
                      </div>
                      <div className="flex justify-between text-white/40 text-sm">
                        <span>Contact sales for Team pricing</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/60">Brokerage plan</span>
                        <span>Custom</span>
                      </div>
                      <div className="flex justify-between text-white/40 text-sm">
                        <span>Contact sales for volume pricing</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-white/40">
                    <span className="line-through">Canva Pro</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span className="line-through">Social scheduling</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span className="line-through">Email marketing</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span className="line-through">Video creator</span>
                    <span>Included</span>
                  </div>
                </div>
                <div className="border-t border-[#D4A017]/30 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-green-400">
                      {listingCount <= 30 ? `$${getSnaprCost()}/mo` : 'Talk to Sales'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Badge */}
            {listingCount <= 30 && (
              <div className="mt-8 bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center">
                <p className="text-green-400 text-2xl font-bold mb-2">
                  You save ${savings}/month
                </p>
                <p className="text-white/60">
                  That's ${savings * 12}/year back in your pocket
                </p>
              </div>
            )}

            {listingCount > 30 && (
              <div className="mt-8 bg-[#D4A017]/20 border border-[#D4A017]/30 rounded-2xl p-6 text-center">
                <p className="text-[#D4A017] text-xl font-bold mb-2">
                  At {listingCount} listings, you qualify for volume pricing
                </p>
                <Link 
                  href="https://calendly.com/rajesh-snap-r/30min"
                  className="inline-flex items-center gap-2 text-white hover:text-[#D4A017] transition mt-2"
                >
                  Talk to sales for custom pricing <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Feature Comparison</h2>
            <p className="text-white/60 text-center mb-12">Photo-only services vs the all-in-one approach</p>
            
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
              <div className="grid grid-cols-3 bg-white/5 p-4 font-bold">
                <div>Feature</div>
                <div className="text-center text-white/60">Photo-Only Services</div>
                <div className="text-center text-[#D4A017]">SnapR</div>
              </div>
              {COMPARISON.map((row, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-3 p-4 border-t border-white/5 ${
                    row.note === 'SnapR exclusive' || row.note === 'SnapR advantage' ? 'bg-[#D4A017]/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {row.feature}
                    {row.note === 'SnapR exclusive' && (
                      <span className="text-xs bg-[#D4A017]/20 text-[#D4A017] px-2 py-0.5 rounded hidden sm:inline">Exclusive</span>
                    )}
                  </div>
                  <div className="text-center">
                    {row.traditional === true ? (
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    ) : row.traditional === false ? (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-white/60 text-sm">{row.traditional}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {row.snapr === true ? (
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    ) : row.snapr === false ? (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-[#D4A017] font-medium text-sm">{row.snapr}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">One Platform. Everything You Need.</h2>
            <p className="text-white/60 text-center mb-12">Photo enhancement AND listing marketing in one place</p>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Camera, title: 'AI Enhancement', desc: 'Sky, twilight, staging, HDR - all automated' },
                { icon: Palette, title: 'Content Studio', desc: '150+ templates for social, flyers, emails' },
                { icon: Share2, title: 'Social Posting', desc: 'Post to Instagram, Facebook, LinkedIn' },
                { icon: Mail, title: 'Email Marketing', desc: 'Property emails with one click' },
                { icon: Video, title: 'Video Creator', desc: 'AI-powered property videos' },
                { icon: Clock, title: '10-Minute Workflow', desc: 'From upload to published' },
                { icon: DollarSign, title: 'Save 35%+', desc: 'vs separate tools' },
                { icon: Layers, title: 'All-in-One', desc: 'No more tool juggling' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 transition border border-white/10">
                  <item.icon className="w-10 h-10 text-[#D4A017] mx-auto mb-4" />
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Teams Consolidate to SnapR</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, idx) => (
                <div key={idx} className="bg-black rounded-xl p-6 border border-white/10">
                  <p className="text-white/80 mb-6 italic">"{t.quote}"</p>
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-white/50 text-sm">{t.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Simplify Your Stack?</h2>
            <p className="text-xl text-white/60 mb-8">
              Start free with 3 listings. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="bg-[#D4A017] text-black px-8 py-4 rounded-lg font-medium hover:bg-[#B8860B] transition flex items-center gap-2 text-lg"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="bg-white/10 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/20 transition text-lg"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/50 text-sm">
          © 2026 SnapR. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
