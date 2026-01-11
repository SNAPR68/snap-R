'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BeforeAfterSlider } from '@/components/before-after-slider';

export default function MetaAdsLandingPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to signup with email prefilled
    window.location.href = `/auth/signup?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Floating CTA - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-50 md:hidden">
        <Link
          href="/pricing"
          className="block w-full py-4 px-6 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-center rounded-xl shadow-lg shadow-[#D4A017]/20"
        >
          Start Free Trial →
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
            <Link
              href="/pricing"
              className="hidden md:block px-6 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4A017]/20 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
              <span className="text-sm text-gray-300">Trusted by <span className="text-white font-semibold">2,000+</span> real estate professionals</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
              From Raw Photos to Market-Ready
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A017] to-[#F4C430]">
                in 2 Minutes 47 Seconds
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              AI photo enhancement + social posts + videos + property websites + email campaigns.
              <span className="text-white"> One platform. One price.</span>
            </p>

            {/* Single CTA */}
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
          </div>

          {/* Hero Before/After - THE PROOF */}
          <div className="relative max-w-4xl mx-auto">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#D4A017]/20 via-transparent to-[#D4A017]/20 rounded-3xl blur-2xl opacity-50"></div>
            
            {/* Main before/after */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <BeforeAfterSlider
                beforeUrl="/gallery/sky-before.jpg"
                afterUrl="/gallery/sky-after.jpg"
                beforeLabel="Before"
                afterLabel="After • 30 seconds"
              />
            </div>

            {/* Feature pills below image */}
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

      {/* Before/After Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              AI Enhancement in{' '}
              <span className="text-[#D4A017]">30 Seconds</span>
            </h2>
            <p className="text-gray-400 text-lg">Same quality as manual editing. 100x faster.</p>
          </div>

          {/* Before/After Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before/After Card 1 - Sky Replacement */}
            <div className="rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/5 p-4">
              <div className="relative aspect-video">
                <BeforeAfterSlider
                  beforeUrl="/gallery/sky-before.jpg"
                  afterUrl="/gallery/sky-after.jpg"
                  beforeLabel="Before"
                  afterLabel="After"
                  toolsApplied={['sky-replacement']}
                  className="h-full"
                />
              </div>
            </div>

            {/* Before/After Card 2 - Twilight */}
            <div className="rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/5 p-4">
              <div className="relative aspect-video">
                <BeforeAfterSlider
                  beforeUrl="/gallery/twilight-before.jpg"
                  afterUrl="/gallery/twilight-after.jpg"
                  beforeLabel="Before"
                  afterLabel="After"
                  toolsApplied={['virtual-twilight']}
                  className="h-full"
                />
              </div>
            </div>

            {/* Before/After Card 3 - Virtual Staging */}
            <div className="rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/5 p-4">
              <div className="relative aspect-video">
                <BeforeAfterSlider
                  beforeUrl="/gallery/staging-before.jpg"
                  afterUrl="/gallery/staging-after.jpg"
                  beforeLabel="Before"
                  afterLabel="After"
                  toolsApplied={['virtual-staging']}
                  className="h-full"
                />
              </div>
            </div>

            {/* Before/After Card 4 - HDR */}
            <div className="rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/5 p-4">
              <div className="relative aspect-video">
                <BeforeAfterSlider
                  beforeUrl="/gallery/hdr-before.jpg"
                  afterUrl="/gallery/hdr-after.jpg"
                  beforeLabel="Before"
                  afterLabel="After"
                  toolsApplied={['hdr']}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Your Current Workflow is{' '}
              <span className="text-red-400">Broken</span>
            </h2>
            <p className="text-gray-400 text-lg">You're paying for 6 tools that don't talk to each other</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Old Way */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-red-950/30 to-transparent border border-red-900/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-red-400">The Old Way</span>
              </div>
              
              <div className="space-y-4">
                {[
                  { tool: 'Lightroom/Fotello', price: '$10-20', time: '45 min' },
                  { tool: 'Canva', price: '$13', time: '30 min' },
                  { tool: 'Hootsuite', price: '$99', time: '15 min' },
                  { tool: 'InVideo', price: '$25', time: '25 min' },
                  { tool: 'Squarespace', price: '$16', time: '20 min' },
                  { tool: 'Mailchimp', price: '$13', time: '15 min' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">{item.tool}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-red-400">{item.price}/mo</span>
                      <span className="text-gray-500">{item.time}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4">
                  <span className="text-white font-semibold">Total</span>
                  <div className="flex gap-4">
                    <span className="text-red-400 font-bold">$176+/mo</span>
                    <span className="text-gray-400 font-bold">2hr 30min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* New Way */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#D4A017]/10 to-transparent border border-[#D4A017]/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#D4A017]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#D4A017]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-[#D4A017]">The SnapR Way</span>
              </div>

              <div className="space-y-4">
                {[
                  'AI Photo Enhancement',
                  '150+ Social Templates',
                  'Auto Video Creation',
                  'Property Websites',
                  'Email Campaigns',
                  'Client Approval System',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
                    <svg className="w-5 h-5 text-[#C8FCEA]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4">
                  <span className="text-white font-semibold">Total</span>
                  <div className="flex gap-4">
                    <span className="text-[#C8FCEA] font-bold">From $49/mo</span>
                    <span className="text-[#C8FCEA] font-bold">3 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Callout */}
          <div className="mt-12 text-center">
            <div className="inline-block px-8 py-4 rounded-2xl bg-[#C8FCEA]/10 border border-[#C8FCEA]/20">
              <span className="text-2xl font-bold text-[#C8FCEA]">
                Save $127/month + 2 hours per listing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Us vs Them Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              SnapR vs{' '}
              <span className="text-gray-500">Everyone Else</span>
            </h2>
            <p className="text-gray-400 text-lg">See why professionals are switching</p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                  <th className="py-4 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                        <span className="text-black font-bold text-sm">S</span>
                      </div>
                      <span className="text-[#D4A017] font-bold">SnapR</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 text-gray-400 font-medium">BoxBrownie</th>
                  <th className="py-4 px-4 text-gray-400 font-medium">Fotello</th>
                  <th className="py-4 px-4 text-gray-400 font-medium">PhotoUp</th>
                </tr>
              </thead>
              <tbody>
                {/* Speed */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">Processing Speed</td>
                  <td className="py-5 px-4 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#C8FCEA]/10 text-[#C8FCEA] text-sm font-medium">30 seconds</span>
                  </td>
                  <td className="py-5 px-4 text-center text-gray-500">24-48 hours</td>
                  <td className="py-5 px-4 text-center text-gray-500">~10 seconds</td>
                  <td className="py-5 px-4 text-center text-gray-500">24 hours</td>
                </tr>
                
                {/* Photo Enhancement */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">AI Photo Enhancement</td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center text-gray-500">Manual only</td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center text-gray-500">Manual only</td>
                </tr>

                {/* Social Media Templates */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">Social Media Templates</td>
                  <td className="py-5 px-4 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#C8FCEA]/10 text-[#C8FCEA] text-sm font-medium">150+</span>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>

                {/* Video Creation */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">Auto Video Creation</td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>

                {/* Property Websites */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">Property Websites</td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>

                {/* Email Marketing */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">Email Campaigns</td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>

                {/* AI Captions */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">AI Caption Writing</td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>

                {/* Client Approval */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">Client Approval System</td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <svg className="w-6 h-6 text-[#C8FCEA] mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>

                {/* Pricing */}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 text-white font-medium">Starting Price</td>
                  <td className="py-5 px-4 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#C8FCEA]/10 text-[#C8FCEA] text-sm font-bold">$49/mo</span>
                  </td>
                  <td className="py-5 px-4 text-center text-gray-500">$1.60/image</td>
                  <td className="py-5 px-4 text-center text-gray-500">~$20/listing</td>
                  <td className="py-5 px-4 text-center text-gray-500">$7/hour</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Line */}
          <div className="mt-12 text-center">
            <div className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4A017]/10 to-transparent border border-[#D4A017]/20">
              <p className="text-xl">
                <span className="text-gray-400">They do photo editing.</span>{' '}
                <span className="text-white font-semibold">We do everything else too.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need.{' '}
              <span className="text-[#D4A017]">One Platform.</span>
            </h2>
            <p className="text-gray-400 text-lg">From raw photos to market-ready in under 3 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'AI Photo Enhancement',
                description: '15 professional tools including sky replacement, twilight, HDR, declutter, and virtual staging. 30 seconds for 25 photos.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                ),
                title: 'Content Studio',
                description: '150+ social media templates for Instagram, Facebook, LinkedIn, TikTok. AI writes your captions automatically.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Auto Video Creation',
                description: 'One-click professional videos with transitions and music. Perfect for Reels, TikTok, and YouTube Shorts.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                ),
                title: 'Property Websites',
                description: 'Instant single-property websites. Beautiful galleries, contact forms, and virtual tours. Share anywhere.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Email Campaigns',
                description: '24 professional templates. Just Listed, Open House, Price Drop, Sold — all ready to customize and send.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Client Approval',
                description: 'Share galleries with clients. They approve or reject photos. You get notified. No more email back-and-forth.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/5 hover:border-[#D4A017]/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#D4A017]/10 flex items-center justify-center text-[#D4A017] mb-4 group-hover:bg-[#D4A017]/20 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by{' '}
              <span className="text-[#D4A017]">Real Estate Pros</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "SnapR cut my listing prep from 3 hours to 15 minutes. I've taken on twice as many clients this year.",
                name: 'Sarah M.',
                role: 'RE Photographer, Los Angeles',
              },
              {
                quote: "I canceled Canva, Hootsuite, and two other subscriptions. SnapR does everything I need in one place.",
                name: 'Mike T.',
                role: 'Real Estate Agent, Phoenix',
              },
              {
                quote: "The AI photo quality is incredible. My clients can't tell the difference from manual editing.",
                name: 'Jennifer L.',
                role: 'Broker, Miami',
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/5"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-[#D4A017]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16">
            {[
              { stat: '10,000+', label: 'Listings Processed' },
              { stat: '250,000+', label: 'Photos Enhanced' },
              { stat: '2+ Hours', label: 'Saved Per Listing' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#D4A017]">{item.stat}</div>
                <div className="text-gray-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Watch a complete listing workflow in under 3 minutes
          </p>

          {/* Video Placeholder */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-[#D4A017] flex items-center justify-center hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 rounded-full text-sm">
              2:47 • Full Workflow Demo
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#D4A017]/20 to-[#D4A017]/5 border border-[#D4A017]/30 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Save 2+ Hours Per Listing?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of real estate pros who've switched to SnapR. 
              Start your free trial today — no credit card required.
            </p>

            <Link
              href="/pricing"
              className="inline-block px-10 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-[#D4A017]/30 transition-all transform hover:scale-105"
            >
              Start Free Trial — No Credit Card
            </Link>

            <p className="text-gray-500 text-sm mt-6">
              14-day free trial • Cancel anytime • Full feature access
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
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
