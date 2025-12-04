'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Shield, Mail, Globe, Share2 } from 'lucide-react';
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
      <section className="pt-36 pb-12 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#D4A017]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#D4A017]/10 rounded-full blur-[80px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 text-sm bg-[#D4A017]/10 border border-[#D4A017]/30">
            <Sparkles className="w-4 h-4 text-[#D4A017]" />
            <span className="text-[#D4A017]">AI-Powered Real Estate Photo Enhancement</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-white">
            The <span className="text-gold-gradient">Gold Standard</span> in<br />Real Estate Photo Enhancement
          </h1>
          
          {/* Clean tagline - Apple style */}
          <p className="text-xl md:text-2xl text-white/50 mb-4">
            <span className="text-[#D4A017] font-semibold">30 seconds.</span> Not 24 hours.
          </p>
          
          {/* Photos that sell - Simple and bold */}
          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            <span className="text-white">Photos that </span>
            <span className="text-[#D4A017]">sell.</span>
          </h2>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/academy" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors">
              SnapR Academy
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 10 Free Credits</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> No Credit Card</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 30-Second Results</span>
          </div>
        </div>
      </section>

      {/* Industry First - Mobile PWA Feature */}
      <section id="how-it-works" className="py-12 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {/* Clean Industry First Badge */}
            <div className="inline-block relative mb-8">
              {/* Soft pulsing glow behind */}
              <div 
                className="absolute -inset-4 rounded-3xl bg-[#D4A017]/10 blur-2xl animate-pulse"
              />
              
              {/* Main badge */}
              <div className="relative flex items-center gap-4 px-8 py-4 rounded-2xl bg-[#1A1A1A] border border-[#D4A017]/40 overflow-hidden">
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                
                {/* 3D Phone mockup */}
                <div className="relative">
                  {/* Phone glow */}
                  <div className="absolute inset-0 bg-[#D4A017] rounded-xl blur-md opacity-30" />
                  
                  {/* Phone body */}
                  <div 
                    className="relative w-12 h-16 rounded-xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border-2 border-[#D4A017]/60 flex items-center justify-center overflow-hidden"
                    style={{ boxShadow: '0 0 20px rgba(212,160,23,0.2)' }}
                  >
                    {/* Screen content */}
                    <div className="w-8 h-10 rounded-md bg-gradient-to-b from-[#D4A017]/20 to-[#D4A017]/5 flex items-center justify-center">
                      <div className="text-[#D4A017] font-bold text-[10px]">
                        <span className="text-white">S</span>R
                      </div>
                    </div>
                    
                    {/* Home indicator */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#D4A017]/40 rounded-full" />
                  </div>
                </div>
                
                {/* Text content */}
                <div className="relative text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-lg font-black tracking-wider"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #D4A017 50%, #B8860B 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      INDUSTRY FIRST
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D4A017] text-black rounded-full">
                      NEW
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">Edit real estate photos from your phone browser</p>
                  <p className="text-[#D4A017]/80 text-xs font-medium mt-1">✓ No App Store &nbsp; ✓ No Download &nbsp; ✓ Instant Access</p>
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your Phone Is Now a <span className="text-[#D4A017]">Pro Editing Studio</span>
            </h2>
            <p className="text-xl md:text-2xl font-semibold mb-2">
              <span className="text-white">Upload Raw.</span>
              <span className="text-white font-bold ml-2">Snap</span><span className="text-[#D4A017] font-bold">R</span>
              <span className="text-white ml-2">It.</span>
              <span className="text-[#D4A017] font-bold ml-2">Download Gold.</span>
            </p>
            <p className="text-white/50 max-w-2xl mx-auto">
              No app store. No download. Add SnapR to your home screen and edit like a pro.
            </p>
          </div>
          
          {/* How It Works - 3 Steps */}
          <div className="bg-[#1A1A1A] border border-[#D4A017]/20 rounded-2xl p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl font-bold text-black">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Add to Home Screen</h3>
                <p className="text-white/50 text-sm">
                  Open <span className="text-[#D4A017]">snap-r.com</span> in Safari/Chrome → Tap Share → "Add to Home Screen". Done. It's now an app.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl font-bold text-black">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Snap & Upload</h3>
                <p className="text-white/50 text-sm">
                  Open SnapR → Tap "Snap & Enhance" → Camera opens instantly → Take photo → It uploads automatically.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl font-bold text-black">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Enhance & Share</h3>
                <p className="text-white/50 text-sm">
                  Choose AI tools (sky, twilight, staging) → Get results in 30 seconds → Download or share to MLS directly.
                </p>
              </div>
            </div>
          </div>
          
          {/* Key Differentiators */}
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[#D4A017] font-bold text-lg">Zero Download</p>
              <p className="text-white/50 text-sm">Works instantly in your browser</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[#D4A017] font-bold text-lg">Direct Camera Access</p>
              <p className="text-white/50 text-sm">Snap → Edit → Done. One flow.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[#D4A017] font-bold text-lg">Works Offline</p>
              <p className="text-white/50 text-sm">Upload when you have signal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">See the <span className="text-[#D4A017]">Transformation</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto">Hover over each image to see the before and after. Our AI delivers professional results in seconds.</p>
          </div>
          <LandingGallery />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-[#1A1A1A]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose SnapR?</h2>
            <p className="text-white/60">Everything you need to create stunning real estate photos</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: '30-Second Processing', desc: 'Get results instantly, not in 24-48 hours' },
              { icon: Camera, title: 'All AI Tools', desc: 'Sky replacement, twilight, staging & more' },
              { icon: Smartphone, title: 'Mobile Ready', desc: 'Edit on any device, anywhere' },
              { icon: Shield, title: 'Pro Quality', desc: 'Results that rival professional editors' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-[#1A1A1A] rounded-2xl border border-white/10 hover:border-[#D4A017]/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#D4A017]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#D4A017]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Interactive */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/60">Start free, upgrade when you need more</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div 
                  key={plan.id} 
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-b from-[#D4A017]/15 to-transparent border-[#D4A017] shadow-lg shadow-[#D4A017]/20' 
                      : 'bg-[#1A1A1A] border-white/10 hover:border-white/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4A017] text-black text-xs font-bold rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className={`text-3xl font-bold transition-colors ${isSelected ? 'text-[#D4A017]' : 'text-[#D4A017]/70'}`}>
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-white/60 mb-4">{plan.credits}</p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className={`w-4 h-4 transition-colors ${isSelected ? 'text-[#D4A017]' : 'text-[#D4A017]/50'}`} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href="/auth/signup" 
                    className={`block text-center py-3 rounded-xl font-semibold transition-all ${
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
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Listings?</h2>
          <p className="text-white/60 mb-8">Join thousands of photographers and agents already using SnapR</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90">
            Start Your Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer with Real Social Logos */}
      <footer className="py-10 px-6 border-t border-white/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
              <div>
                <span className="text-lg font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
                <p className="text-white/40 text-xs">AI Photo Enhancement for Real Estate</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/50">
              <Link href="/" className="hover:text-[#D4A017] transition-colors">Home</Link>
              <Link href="#features" className="hover:text-[#D4A017] transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-[#D4A017] transition-colors">Pricing</Link>
              <Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link>
              <Link href="/academy" className="hover:text-[#D4A017] transition-colors">Academy</Link>
              <Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms</Link>
            </div>
            
            {/* Social Icons with Original Brand Colors */}
            <div className="flex items-center gap-3">
              {/* Instagram - Gradient */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* Facebook - Blue */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#1877F2' }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* LinkedIn - Blue */}
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#0A66C2' }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* YouTube - Red */}
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#FF0000' }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
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
    </div>
  );
}