'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Shield, Mail, Globe, Share2, Bell, X, Wand2, Send } from 'lucide-react';
import { LandingGallery } from '@/components/landing-gallery';
import { Testimonials } from '@/components/testimonials';
import { AnimatedBackground } from '@/components/animated-background';

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', credits: '10 credits', features: ['7-day trial', 'All AI tools', 'Watermarked exports'] },
  { id: 'starter', name: 'Starter', price: '$29/mo', credits: '50 credits', features: ['All AI tools', 'Instant delivery', 'Email support'] },
  { id: 'pro', name: 'Pro', price: '$79/mo', credits: '200 credits', features: ['All AI tools', 'Instant delivery', 'Priority support', 'Team sharing'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: '$199/mo', credits: '500 credits', features: ['All AI tools', 'Instant delivery', 'Dedicated support', 'API access'] },
];

export default function HomePage() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [showIOSNotifyModal, setShowIOSNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifySubmitted(true);
    setTimeout(() => {
      setShowIOSNotifyModal(false);
      setNotifySubmitted(false);
      setNotifyEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] font-['Outfit']">
      <AnimatedBackground />
      
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4A017]/30 bg-[#0F0F0F]/95 backdrop-blur-md">
        <div className="max-w-full mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
            <span className="text-2xl font-bold">
              <span className="text-white">Snap</span>
              <span className="text-[#D4A017]">R</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <Link href="#features" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              Pricing
            </Link>
            <Link href="/faq" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              Contact
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/auth/login" 
              className="px-5 py-2.5 text-white font-medium border border-white/20 rounded-xl hover:border-[#D4A017] hover:text-[#D4A017] transition-all"
            >
              Log in
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-5 py-2.5 font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black rounded-xl hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#D4A017]/5 rounded-full blur-[150px]"></div>
        
        <div className="max-w-7xl mx-auto w-full text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 text-sm bg-[#D4A017]/10 border border-[#D4A017]/30">
            <Sparkles className="w-4 h-4 text-[#D4A017]" />
            <span className="text-[#D4A017] font-medium">AI-Powered Real Estate Photo Editing</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-5 leading-tight text-white">
            The <span className="text-[#D4A017]">Gold Standard</span> in<br />Real Estate Photo Editing.
          </h1>
          
          {/* Hook Line */}
          <p className="text-xl md:text-2xl text-white/60 mb-8">
            <span className="text-[#D4A017] font-semibold">Shot at 2pm.</span> Posted by 2:12.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity text-lg">
              <Globe className="w-5 h-5" />
              Try Free on Web
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => setShowIOSNotifyModal(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              iOS Coming Soon
              <Bell className="w-4 h-4" />
            </button>
          </div>
          
          {/* Pipeline - Elegant Sizing */}
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
            
            {/* Step 1: Capture */}
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
                <Camera className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-semibold text-sm md:text-base">Capture</h3>
              <p className="text-[#D4A017] text-xs md:text-sm">AI Director</p>
            </div>
            
            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-white/20 hidden md:block" />
            
            {/* Step 2: Enhance */}
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 group-hover:scale-105 transition-all duration-300">
                <Wand2 className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-semibold text-sm md:text-base">Enhance</h3>
              <p className="text-[#D4A017] text-xs md:text-sm">30 Seconds</p>
            </div>
            
            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-white/20 hidden md:block" />
            
            {/* Step 3: Create */}
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#E8B923] to-[#B8860B] flex items-center justify-center mb-3 shadow-lg shadow-[#D4A017]/25 group-hover:shadow-[#D4A017]/40 group-hover:scale-105 transition-all duration-300">
                <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-semibold text-sm md:text-base">Create</h3>
              <p className="text-[#D4A017] text-xs md:text-sm">AI Content</p>
            </div>
            
            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-white/20 hidden md:block" />
            
            {/* Step 4: Publish */}
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-300">
                <Send className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-semibold text-sm md:text-base">Publish</h3>
              <p className="text-[#D4A017] text-xs md:text-sm">Everywhere</p>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 10 Free Credits</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> No Credit Card</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 30-Second Results</span>
          </div>
        </div>
      </section>

      {/* Two Paths Section - iOS & Android */}
      <section id="platforms" className="py-20 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Choose Your <span className="text-[#D4A017]">Platform</span>
            </h2>
            <p className="text-white/50">Same powerful AI. Two ways to access.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* iOS Card - Coming Soon */}
            <div className="relative p-6 bg-[#1A1A1A] rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/10 text-white/70 text-xs font-medium rounded-full flex items-center gap-1">
                <Bell className="w-3 h-3" />
                COMING SOON
              </div>
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">SnapR Camera</h3>
                  <p className="text-white/50 text-sm">iPhone App with AI Director</p>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-white/70">
                  <Check className="w-4 h-4 text-[#D4A017]" />
                  AI Director — Real-time guidance
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <Check className="w-4 h-4 text-[#D4A017]" />
                  15 professional enhancement tools
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <Check className="w-4 h-4 text-[#D4A017]" />
                  MLS compliance built-in
                </li>
              </ul>
              
              <button 
                onClick={() => setShowIOSNotifyModal(true)}
                className="w-full py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Bell className="w-4 h-4" />
                Notify Me When It's Live
              </button>
            </div>
            
            {/* Android/Web Card - Available Now */}
            <div className="relative p-6 bg-gradient-to-br from-[#D4A017]/10 to-[#1A1A1A] rounded-2xl border-2 border-[#D4A017]/40 overflow-hidden">
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                AVAILABLE NOW
              </div>
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                  <Globe className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Snap & Enhance</h3>
                  <p className="text-[#D4A017] text-sm">Web App — No Download</p>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2 text-white/70">
                  <Check className="w-4 h-4 text-[#D4A017]" />
                  Works in any browser instantly
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <Check className="w-4 h-4 text-[#D4A017]" />
                  15 professional enhancement tools
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <Check className="w-4 h-4 text-[#D4A017]" />
                  Content Studio for social posts
                </li>
              </ul>
              
              <Link 
                href="/auth/signup"
                className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
              >
                Start Free Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">See the <span className="text-[#D4A017]">Transformation</span></h2>
            <p className="text-white/50">Hover over each image to see before and after</p>
          </div>
          <LandingGallery />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-[#1A1A1A]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Why Choose SnapR?</h2>
            <p className="text-white/50">Everything you need to create stunning real estate photos</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Zap, title: '30-Second Processing', desc: 'Get results instantly, not in 24-48 hours' },
              { icon: Camera, title: 'All AI Tools', desc: 'Sky replacement, twilight, staging & more' },
              { icon: Smartphone, title: 'Mobile Ready', desc: 'Edit on any device, anywhere' },
              { icon: Shield, title: 'Pro Quality', desc: 'Results that rival professional editors' },
            ].map((feature, i) => (
              <div key={i} className="p-5 bg-[#1A1A1A] rounded-xl border border-white/10 hover:border-[#D4A017]/50 transition-colors">
                <div className="w-11 h-11 rounded-lg bg-[#D4A017]/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-[#D4A017]" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Simple, Transparent Pricing</h2>
            <p className="text-white/50">Start free, upgrade when you need more</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div 
                  key={plan.id} 
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-b from-[#D4A017]/15 to-transparent border-[#D4A017] shadow-lg shadow-[#D4A017]/20' 
                      : 'bg-[#1A1A1A] border-white/10 hover:border-white/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4A017] text-black text-xs font-bold rounded-full">
                      POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <div className="mb-3">
                    <span className={`text-2xl font-bold transition-colors ${isSelected ? 'text-[#D4A017]' : 'text-[#D4A017]/70'}`}>
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mb-3">{plan.credits}</p>
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-white/60">
                        <Check className={`w-3 h-3 transition-colors ${isSelected ? 'text-[#D4A017]' : 'text-[#D4A017]/50'}`} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href="/auth/signup" 
                    className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Ready to Transform Your Listings?</h2>
          <p className="text-white/50 mb-8">Join thousands of photographers and agents already using SnapR</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90">
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
              <div>
                <span className="text-lg font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
                <p className="text-white/40 text-xs">AI Photo Enhancement for Real Estate</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
              <Link href="/" className="hover:text-[#D4A017] transition-colors">Home</Link>
              <Link href="#features" className="hover:text-[#D4A017] transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-[#D4A017] transition-colors">Pricing</Link>
              <Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link>
              <Link href="/academy" className="hover:text-[#D4A017] transition-colors">Academy</Link>
              <Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms</Link>
            </div>
            
            <div className="flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#1877F2' }}>
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#0A66C2' }}>
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#FF0000' }}>
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-xs">© 2025 SnapR. All rights reserved.</p>
            <a href="mailto:support@snap-r.com" className="flex items-center gap-2 text-white/30 text-xs hover:text-[#D4A017] transition-colors">
              <Mail className="w-3 h-3" /> support@snap-r.com
            </a>
          </div>
        </div>
      </footer>

      {/* iOS Notify Modal */}
      {showIOSNotifyModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowIOSNotifyModal(false);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#1A1A1A] rounded-2xl border border-[#D4A017]/30 p-6 max-w-md w-full shadow-2xl">
            <button 
              onClick={() => setShowIOSNotifyModal(false)}
              className="absolute top-3 right-3 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">SnapR for iPhone</h3>
              <p className="text-[#D4A017] text-sm">Coming to App Store soon</p>
            </div>
            
            {notifySubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-500" />
                </div>
                <p className="text-white font-semibold">You're on the list!</p>
                <p className="text-white/50 text-sm">We'll notify you when SnapR launches.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-5 text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <Check className="w-4 h-4 text-[#D4A017]" />
                    AI Director — Real-time shooting guidance
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Check className="w-4 h-4 text-[#D4A017]" />
                    15 professional enhancement tools
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Check className="w-4 h-4 text-[#D4A017]" />
                    MLS compliance built-in
                  </div>
                </div>
                
                <form onSubmit={handleNotifySubmit} className="space-y-3">
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="Enter your email..."
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#D4A017] text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Notify Me When It's Live
                  </button>
                </form>
                
                <div className="mt-5 pt-5 border-t border-white/10 text-center">
                  <p className="text-white/40 text-xs mb-1">Can't wait?</p>
                  <Link 
                    href="/auth/signup"
                    onClick={() => setShowIOSNotifyModal(false)}
                    className="text-[#D4A017] font-semibold text-sm hover:underline"
                  >
                    Try the web app now →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}