'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Shield, Mail, Globe, Share2, Wand2, Send, Bell } from 'lucide-react';
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
  const [showSnapEnhanceModal, setShowSnapEnhanceModal] = useState(false);
  const [showIOSNotifyModal, setShowIOSNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add email to waitlist (Supabase)
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
      
      {/* CSS for animated gold border */}
      <style jsx global>{`
        /* Fixed gold border with white light animation */
        .gold-border-animate {
          position: relative;
          background: #111;
          border-radius: 12px;
          border: 1.5px solid #D4A017;
          overflow: visible;
        }
        
        .gold-border-animate::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 14px;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 340deg,
            rgba(255,255,255,0.8) 350deg,
            white 355deg,
            rgba(255,255,255,0.8) 360deg
          );
          animation: whiteGlow 6s linear infinite;
          opacity: 0.7;
          filter: blur(1px);
        }
        
        .gold-border-animate::after {
          content: '';
          position: absolute;
          inset: 0;
          background: #111;
          border-radius: 11px;
        }
        
        @keyframes whiteGlow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        /* Ensure content is above the pseudo-elements */
        .gold-border-animate > * {
          position: relative;
          z-index: 1;
        }
      `}</style>
      
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4A017]/30 bg-[#0F0F0F]/95 backdrop-blur-md">
        <div className="max-w-full mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/snapr-logo.png" alt="SnapR" className="w-20 h-20" />
            <span className="text-2xl font-bold">
              <span className="text-white">Snap</span>
              <span className="text-[#D4A017]">R</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <Link href="#features" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
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

      {/* NEW HERO SECTION - Horizontal Split */}
      <section className="pt-28 pb-8 px-6 lg:px-12 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#D4A017]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#D4A017]/10 rounded-full blur-[80px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Hero Text - Centered & Compact */}
          <div className="text-center mb-10">
            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-5">
              <span className="text-white/50 text-xs">For</span>
              <span className="text-white text-xs font-medium">Agents</span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white text-xs font-medium">Photographers</span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white text-xs font-medium">Brokers</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-3">
              The <span className="text-[#D4A017]">Gold Standard</span> in Listing Visuals.
            </h1>
            
            {/* Sub-headline */}
            <p className="text-lg text-white/40 mb-4">
              The Complete Real Estate Photo Engine.
            </p>
            
            {/* Value Prop */}
            <p className="text-lg text-white/70 mb-2">
              <span className="text-white font-medium">SnapR</span> directs your shots, enhances your photos, creates stunning content, and publishes everywhere.
            </p>
            <p className="text-sm text-[#D4A017] font-semibold tracking-widest uppercase mb-4">
              All In One Workflow
            </p>
            
            {/* Tagline */}
            <p className="text-lg text-[#D4A017] font-semibold mb-6">
              Shot at 2pm. Posted by 2:12.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3 mb-5">
              <Link 
                href="/auth/signup" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 transition-all text-sm"
              >
                <Globe className="w-4 h-4" />
                Try Free on Web
              </Link>
              <button 
                onClick={() => setShowIOSNotifyModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                iOS Coming Soon
                <Bell className="w-4 h-4" />
              </button>
            </div>
            
            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center items-center gap-5 text-xs">
              <span className="flex items-center gap-1.5 text-white/40">
                <Check className="w-3.5 h-3.5 text-green-500" />
                MLS Compliant
              </span>
              <span className="flex items-center gap-1.5 text-white/40">
                <Check className="w-3.5 h-3.5 text-green-500" />
                15 AI Tools
              </span>
              <span className="flex items-center gap-1.5 text-white/40">
                <Check className="w-3.5 h-3.5 text-green-500" />
                No Credit Card
              </span>
            </div>
          </div>
          
          {/* 4 Workflow Panels - Compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Panel 1: CAPTURE */}
            <div className="group">
              <div className="gold-border-animate mb-2">
                <div className="aspect-[4/3] relative p-1.5">
                  <div className="w-full h-full bg-[#0A0A0A] rounded-lg overflow-hidden relative">
                    <img 
                      src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300" 
                      className="w-full h-full object-cover opacity-75" 
                      alt="Camera view"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0">
                      {/* Grid */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                        <div className="border-r border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-b border-white"></div>
                        <div className="border-r border-white"></div>
                        <div className="border-r border-white"></div>
                      </div>
                      
                      {/* AI Bubble */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 bg-black/80 rounded p-1.5 border border-[#D4A017]/30">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-[#D4A017] flex items-center justify-center">
                            <span className="text-black text-[6px] font-bold">AI</span>
                          </div>
                          <p className="text-white text-[8px]">Move left for framing</p>
                        </div>
                      </div>
                      
                      {/* Capture btn */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-white/40"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gold Button */}
              <div className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg">
                <Camera className="w-4 h-4 text-black" />
                <span className="text-black font-semibold text-sm">Capture</span>
              </div>
            </div>
            
            {/* Panel 2: ENHANCE */}
            <div className="group">
              <div className="gold-border-animate mb-2">
                <div className="aspect-[4/3] relative p-1.5">
                  <div className="w-full h-full rounded-lg overflow-hidden relative">
                    {/* After */}
                    <img 
                      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300" 
                      className="w-full h-full object-cover" 
                      alt="Enhanced"
                    />
                    
                    {/* Before (left) */}
                    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                      <img 
                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300" 
                        className="w-full h-full object-cover grayscale brightness-[0.6]" 
                        alt="Original"
                      />
                    </div>
                    
                    {/* Divider */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#D4A017]">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#D4A017] flex items-center justify-center">
                        <span className="text-black text-[8px] font-bold">↔</span>
                      </div>
                    </div>
                    
                    {/* Labels */}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[7px] rounded">Before</div>
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#D4A017] text-black text-[7px] rounded font-medium">After</div>
                    
                    {/* Badge */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/70 rounded-full">
                      <span className="text-white text-[7px]">✨ Sky Replace</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gold Button */}
              <div className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg">
                <Sparkles className="w-4 h-4 text-black" />
                <span className="text-black font-semibold text-sm">Enhance</span>
              </div>
            </div>
            
            {/* Panel 3: CREATE */}
            <div className="group">
              <div className="gold-border-animate mb-2">
                <div className="aspect-[4/3] relative p-1.5">
                  <div className="w-full h-full bg-[#0A0A0A] rounded-lg overflow-hidden p-2 flex flex-col">
                    
                    {/* Header */}
                    <div className="text-center mb-2">
                      <span className="text-[#D4A017] text-[10px] font-bold uppercase tracking-wider">Content Studio</span>
                    </div>
                    
                    {/* Platform Icons - Single Row */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        {/* Instagram */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </div>
                        {/* Facebook */}
                        <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </div>
                        {/* LinkedIn */}
                        <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </div>
                        {/* TikTok */}
                        <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Features Band */}
                    <div className="py-1.5 bg-[#D4A017]/10 border border-[#D4A017]/20 rounded text-center">
                      <span className="text-[#D4A017] text-[7px] font-medium">✨ Captions • Posts • Hashtags</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gold Button */}
              <div className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg">
                <Share2 className="w-4 h-4 text-black" />
                <span className="text-black font-semibold text-sm">Create</span>
              </div>
            </div>
            
            {/* Panel 4: PUBLISH */}
            <div className="group">
              <div className="gold-border-animate mb-2">
                <div className="aspect-[4/3] relative p-1.5">
                  <div className="w-full h-full bg-[#0A0A0A] rounded-lg overflow-hidden p-2 flex flex-col">
                    
                    {/* Header */}
                    <div className="text-center mb-2">
                      <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">All Platforms</span>
                    </div>
                    
                    {/* Platform Icons - Single Row with green checks */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        {/* Instagram */}
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                          </div>
                        </div>
                        {/* Facebook */}
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                          </div>
                        </div>
                        {/* LinkedIn */}
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                          </div>
                        </div>
                        {/* TikTok */}
                        <div className="relative">
                          <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Published Band */}
                    <div className="py-1.5 bg-green-500/10 border border-green-500/20 rounded text-center">
                      <span className="text-green-400 text-[7px] font-medium">✓ Published • MLS Compliant</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gold Button */}
              <div className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg">
                <Send className="w-4 h-4 text-black" />
                <span className="text-black font-semibold text-sm">Publish</span>
              </div>
            </div>
            
          </div>
          
        </div>
      </section>

      {/* Industry First - Mobile PWA Feature */}
      <section id="how-it-works" className="py-12 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {/* Clean Industry First Badge */}
            <div className="inline-block relative mb-8">
              <div className="absolute -inset-4 rounded-3xl bg-[#D4A017]/10 blur-2xl animate-pulse" />
              
              <div className="relative flex items-center gap-4 px-8 py-4 rounded-2xl bg-[#1A1A1A] border border-[#D4A017]/40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                
                <div className="relative">
                  <div className="absolute inset-0 bg-[#D4A017] rounded-xl blur-md opacity-30" />
                  <div 
                    className="relative w-12 h-16 rounded-xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border-2 border-[#D4A017]/60 flex items-center justify-center overflow-hidden"
                    style={{ boxShadow: '0 0 20px rgba(212,160,23,0.2)' }}
                  >
                    <div className="w-8 h-10 rounded-md bg-gradient-to-b from-[#D4A017]/20 to-[#D4A017]/5 flex items-center justify-center">
                      <div className="text-[#D4A017] font-bold text-[10px]">
                        <span className="text-white">S</span>R
                      </div>
                    </div>
                  </div>
                </div>
                
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
                  <p className="text-white/70 text-sm">Edit real estate photos from any device</p>
                  <p className="text-[#D4A017]/80 text-xs font-medium mt-1">✓ iOS App Soon &nbsp; ✓ Web App Now &nbsp; ✓ Same AI Tools</p>
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
            <p className="text-white/50 max-w-2xl mx-auto mb-6">
              iOS app launching soon in the App Store. Web app available now — add to home screen and start editing.
            </p>
            
          </div>
          
          {/* iOS + Web App Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            
            {/* iOS App Card */}
            <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 overflow-hidden">
              {/* Coming Soon Banner */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full">
                <span className="text-[#D4A017] text-xs font-semibold">COMING SOON</span>
              </div>
              
              {/* Phone Mockup */}
              <div className="flex justify-center mb-6 mt-4">
                <div className="relative">
                  <div className="w-32 h-56 bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] rounded-[2rem] border-4 border-[#3A3A3A] p-2 shadow-2xl">
                    <div className="w-full h-full bg-[#0A0A0A] rounded-[1.5rem] flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#2A2A2A] rounded-b-xl"></div>
                      {/* App Screen */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center mb-2">
                          <Camera className="w-6 h-6 text-black" />
                        </div>
                        <span className="text-white text-[10px] font-semibold">SnapR</span>
                        <span className="text-white/40 text-[8px]">AI Director</span>
                      </div>
                    </div>
                  </div>
                  {/* Glow */}
                  <div className="absolute -inset-4 bg-[#D4A017]/10 rounded-full blur-2xl -z-10"></div>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <h3 className="text-xl font-bold text-white">iOS App</h3>
                </div>
                <p className="text-[#D4A017] font-semibold mb-4">SnapR Camera with AI Director</p>
                
                {/* Features */}
                <ul className="space-y-2 text-left mb-6">
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#D4A017]" />
                    AI guides you before the shot
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#D4A017]" />
                    Real-time composition tips
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#D4A017]" />
                    MLS compliance built-in
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#D4A017]" />
                    All 15 AI enhancement tools
                  </li>
                </ul>
                
                {/* Notify Button */}
                <button 
                  onClick={() => setShowIOSNotifyModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notify Me When Available
                </button>
                <p className="text-white/30 text-xs mt-2">Launching in App Store soon</p>
              </div>
            </div>
            
            {/* Web App Card */}
            <div className="relative bg-gradient-to-br from-[#D4A017]/10 to-transparent border border-[#D4A017]/30 rounded-2xl p-6 overflow-hidden">
              {/* Available Now Banner */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full">
                <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  AVAILABLE NOW
                </span>
              </div>
              
              {/* Browser Mockup */}
              <div className="flex justify-center mb-6 mt-4">
                <div className="relative">
                  <div className="w-44 h-56 bg-[#1A1A1A] rounded-xl border border-[#D4A017]/30 overflow-hidden shadow-2xl">
                    {/* Browser Bar */}
                    <div className="h-6 bg-[#2A2A2A] flex items-center px-2 gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div className="flex-1 mx-2 h-3 bg-[#1A1A1A] rounded text-[6px] text-white/40 flex items-center justify-center">snap-r.com</div>
                    </div>
                    {/* Content */}
                    <div className="p-3 flex flex-col items-center justify-center h-[calc(100%-1.5rem)]">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center mb-2">
                        <Camera className="w-5 h-5 text-black" />
                      </div>
                      <span className="text-white text-[10px] font-semibold">Snap & Enhance</span>
                      <span className="text-white/40 text-[8px] mb-2">Browser-Based</span>
                      <div className="w-full h-16 bg-[#0A0A0A] rounded mt-1 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-[#D4A017]/50" />
                      </div>
                    </div>
                  </div>
                  {/* Glow */}
                  <div className="absolute -inset-4 bg-[#D4A017]/10 rounded-full blur-2xl -z-10"></div>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Globe className="w-6 h-6 text-[#D4A017]" />
                  <h3 className="text-xl font-bold text-white">Web App</h3>
                </div>
                <p className="text-[#D4A017] font-semibold mb-4">Snap & Enhance in Your Browser</p>
                
                {/* Features */}
                <ul className="space-y-2 text-left mb-6">
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    No download required
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    Add to home screen (PWA)
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    Same AI tools as iOS app
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    Works on any device
                  </li>
                </ul>
                
                {/* Open Web App Button */}
                <Link 
                  href="/auth/signup"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-all"
                >
                  Open Web App
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-white/30 text-xs mt-2">10 free credits • No credit card</p>
              </div>
            </div>
            
          </div>
          
          {/* How to Use Web App - 3 Steps */}
          <div className="mt-10 max-w-4xl mx-auto">
            <h3 className="text-center text-white/50 text-sm uppercase tracking-wider mb-6">How to use on your phone</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-lg font-bold text-black">1</div>
                <h4 className="text-white font-semibold mb-1">Add to Home Screen</h4>
                <p className="text-white/40 text-sm">Open <span className="text-[#D4A017]">snap-r.com</span> → Tap Share → "Add to Home Screen"</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-lg font-bold text-black">2</div>
                <h4 className="text-white font-semibold mb-1">Snap & Upload</h4>
                <p className="text-white/40 text-sm">Take photos directly or upload from your gallery</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-lg font-bold text-black">3</div>
                <h4 className="text-white font-semibold mb-1">AI Does the Rest</h4>
                <p className="text-white/40 text-sm">30-second processing. Download & share instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="features" className="py-16 px-6">
        <LandingGallery />
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-[#1A1A1A]/30">
        <Testimonials />
      </section>

      {/* Pricing Section */}
      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
              <span className="text-xl font-bold"><span className="text-white">Snap</span><span className="text-[#D4A017]">R</span></span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-white/50">
              <Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link>
              <Link href="/academy" className="hover:text-[#D4A017] transition-colors">Academy</Link>
              <Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms</Link>
            </div>
            
            <div className="flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#1877F2' }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#0A66C2' }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: '#FF0000' }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
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

      {/* Snap Enhance Info Modal */}
      {showSnapEnhanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowSnapEnhanceModal(false); }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#1A1A1A] rounded-3xl border border-[#D4A017]/30 p-8 max-w-lg w-full shadow-2xl">
            <button onClick={() => setShowSnapEnhanceModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Camera className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white">Snap Enhance</h3>
              <p className="text-[#D4A017]">Your pocket photo studio</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center flex-shrink-0"><Camera className="w-5 h-5 text-[#D4A017]" /></div>
                <div><h4 className="font-semibold text-white">Instant Camera Access</h4><p className="text-white/60 text-sm">Tap to open your phone camera and capture property photos directly</p></div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5 text-[#D4A017]" /></div>
                <div><h4 className="font-semibold text-white">AI Enhancement</h4><p className="text-white/60 text-sm">Sky replacement, virtual twilight, HDR, declutter - all in 30 seconds</p></div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-[#D4A017]" /></div>
                <div><h4 className="font-semibold text-white">Instant Download</h4><p className="text-white/60 text-sm">Enhanced photos ready to share or upload to MLS immediately</p></div>
              </div>
            </div>
            
            <Link href="/auth/signup" className="block w-full text-center py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-opacity">Get Started Free →</Link>
            <p className="text-center text-white/40 text-sm mt-3">10 free credits • No credit card required</p>
          </div>
        </div>
      )}

      {/* iOS Notify Modal */}
      {showIOSNotifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowIOSNotifyModal(false); }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#1A1A1A] rounded-3xl border border-[#D4A017]/30 p-8 max-w-md w-full shadow-2xl">
            <button onClick={() => setShowIOSNotifyModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            {notifySubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
                <p className="text-white/60">We'll notify you when the iOS app launches.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                    <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">iOS App Coming Soon</h3>
                  <p className="text-white/60">Get notified when SnapR launches on the App Store</p>
                </div>
                
                <form onSubmit={handleNotifySubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-[#D4A017] focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Bell className="w-4 h-4" />
                    Notify Me
                  </button>
                </form>
                
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-white/40 text-sm mb-2">Can't wait?</p>
                  <Link 
                    href="/auth/signup"
                    onClick={() => setShowIOSNotifyModal(false)}
                    className="text-[#D4A017] font-semibold hover:underline"
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