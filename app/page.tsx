'use client';

import PricingSection from '@/components/pricing-section';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Check, Camera, Mail, Bell, Menu, X, Shield, Lock, CheckCircle, BarChart3, Share2 } from 'lucide-react';
import { LandingGallery } from '@/components/landing-gallery';
import { WeHeardYou } from '@/components/we-heard-you';
import { Testimonials } from '@/components/testimonials';
import { ExplainerVideoPlayer } from '@/components/explainer-video-player';
import { GuideRequestForm } from '@/components/guide-request-form';
import { trackEvent, SnapREvents } from '@/lib/analytics';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSnapEnhanceModal, setShowSnapEnhanceModal] = useState(false);
  const [showIOSNotifyModal, setShowIOSNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Show mobile sticky CTA after scrolling past hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileCTA(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail }),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      // silently ignore — still show success UI
    }
    setNotifySubmitted(true);
    setTimeout(() => {
      setShowIOSNotifyModal(false);
      setNotifySubmitted(false);
      setNotifyEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] font-['Outfit']">
      
      {/* CSS for animated gold border + NEW animations */}
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
        
        /* NEW: Progress bar animation */
        @keyframes progressFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .progress-animate {
          animation: progressFill 3s ease-out forwards;
        }
        
        /* NEW: Pulse animation for step numbers */
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(212, 160, 23, 0); }
        }
        
        .pulse-gold {
          animation: pulse 2s infinite;
        }
        
        /* NEW: Pricing slider styling */
        .pricing-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #D4A017 0%, rgba(255,255,255,0.1) 0%);
          outline: none;
          cursor: pointer;
        }
        
        .pricing-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4A017, #B8860B);
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(212, 160, 23, 0.5);
        }
        
        .pricing-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4A017, #B8860B);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 10px rgba(212, 160, 23, 0.5);
        }
      `}</style>
      
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4A017]/30 bg-[#0F0F0F]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-white">Snap</span>
              <span className="text-[#D4A017]">R</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#see-demo" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">See Demo</Link>
            <Link href="/pricing" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">Pricing</Link>
            <Link href="/faq" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">FAQ</Link>
            <Link href="/academy" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">Academy</Link>
            <Link href="/guide" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">Free Guide</Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="md:hidden text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/auth/login" className="text-white/70 hover:text-white text-sm transition-colors hidden sm:block">Log in</Link>
            <Link
              href="/auth/signup"
              onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)}
              className="px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Start Free
            </Link>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0F0F0F]/98 border-t border-[#D4A017]/20 backdrop-blur-md px-6 py-4 flex flex-col gap-3">
            <Link href="#see-demo" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-[#D4A017] transition-colors text-sm py-2">See Demo</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-[#D4A017] transition-colors text-sm py-2">Pricing</Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-[#D4A017] transition-colors text-sm py-2">FAQ</Link>
            <Link href="/academy" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-[#D4A017] transition-colors text-sm py-2">Academy</Link>
            <Link href="/guide" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-[#D4A017] transition-colors text-sm py-2">Free Guide</Link>
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white transition-colors text-sm py-2 sm:hidden">Log in</Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION - UPDATED */}
      <section ref={heroRef} className="pt-28 pb-8 px-6 lg:px-12 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#D4A017]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#D4A017]/10 rounded-full blur-[80px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Hero Text - New Messaging */}
          <div className="text-center mb-10">
            {/* Platform Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#D4A017]/20 to-[#D4A017]/10 border border-[#D4A017]/40 rounded-full mb-6">
              <span className="text-[#D4A017] text-xs md:text-sm font-semibold tracking-wide uppercase">
                World&apos;s First AI-Powered Real Estate Media & Marketing Platform
              </span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
              Upload Your Photos.<br className="hidden sm:block" />
              <span className="text-[#D4A017]">We Handle the Rest.</span>
            </h1>

            {/* One clean sub — what SnapR does */}
            <p className="text-base md:text-lg text-white/50 mb-6 max-w-2xl mx-auto leading-relaxed">
              Enhanced photos. Descriptions. Social posts. Property site. Video — all from one upload, in under 10 minutes.
            </p>

            {/* Tagline */}
            <p className="text-2xl md:text-3xl lg:text-4xl text-[#D4A017] font-bold mb-8">
              Stop marketing listings. Start closing them.
            </p>
            
            {/* CTA Buttons - Start Free | Book a Demo */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
              <Link 
                href="/auth/signup" 
                onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)}
                className="px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-full hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-[#D4A017]/30"
              >
                Start Free
              </Link>
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-white/5 border border-white/20 text-white font-semibold text-lg rounded-full hover:bg-white/10 hover:border-white/30 transition-all"
              >
                Book a Demo
              </Link>
            </div>
            
            {/* Footer Line */}
            <p className="text-white/40 text-sm mb-8">
              No credit card · Join 500+ professionals · ⭐ 4.9/5 rating
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-5">
              <span className="flex items-center gap-1.5 px-4 py-2 glass-luxury rounded-full text-xs text-white/70 hover:scale-105 transition-transform cursor-default">
                <Check className="w-3.5 h-3.5 text-[#D4A017]" />
                MLS-ready photos
              </span>
              <span className="flex items-center gap-1.5 px-4 py-2 glass-luxury rounded-full text-xs text-white/70 hover:scale-105 transition-transform cursor-default">
                <Check className="w-3.5 h-3.5 text-[#D4A017]" />
                Social content
              </span>
              <span className="flex items-center gap-1.5 px-4 py-2 glass-luxury rounded-full text-xs text-white/70 hover:scale-105 transition-transform cursor-default">
                <Check className="w-3.5 h-3.5 text-[#D4A017]" />
                Email campaigns
              </span>
              <span className="flex items-center gap-1.5 px-4 py-2 glass-luxury rounded-full text-xs text-white/70 hover:scale-105 transition-transform cursor-default">
                <Check className="w-3.5 h-3.5 text-[#D4A017]" />
                Property sites
              </span>
              <span className="flex items-center gap-1.5 px-4 py-2 glass-luxury rounded-full text-xs text-white/70 hover:scale-105 transition-transform cursor-default">
                <Check className="w-3.5 h-3.5 text-[#D4A017]" />
                Video
              </span>
            </div>
          </div>
          
        </div>
      </section>

      {/* Trust & Social Proof Section */}
      <section className="py-10 px-6 bg-[#0F0F0F]">
        <div className="max-w-5xl mx-auto">
          <div className="glass-luxury glossy-top p-8 rounded-3xl">
            <p className="text-center text-white/40 text-sm mb-6">
              Trusted by 500+ real estate professionals across 8 countries
            </p>
            <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap mb-8 opacity-40">
              {['Keller Williams', 'RE/MAX', 'Century 21', 'Coldwell Banker', 'Sotheby\'s', 'Compass'].map((name) => (
                <span key={name} className="text-white text-sm font-bold tracking-widest uppercase whitespace-nowrap">{name}</span>
              ))}
            </div>
            <div className="flex justify-center items-center gap-4 flex-wrap">
              <div className="glow-card flex items-center gap-2 px-5 py-3 text-white/60 text-xs">
                <Shield className="w-4 h-4 text-[#D4A017]" />
                <span>Enterprise Security</span>
              </div>
              <div className="glow-card flex items-center gap-2 px-5 py-3 text-white/60 text-xs">
                <Lock className="w-4 h-4 text-[#D4A017]" />
                <span>Data Encrypted</span>
              </div>
              <div className="glow-card flex items-center gap-2 px-5 py-3 text-white/60 text-xs">
                <CheckCircle className="w-4 h-4 text-[#D4A017]" />
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Section - Luxury */}
      <section className="py-16 px-6 bg-[#0F0F0F]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#D4A017] text-sm font-semibold tracking-wider mb-3">THE PROBLEM → THE FIX</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              What You Deal With vs. What <span className="shimmer-text">SnapR</span> Does
            </h2>
          </div>

          <div className="glass-luxury glossy-top overflow-hidden">
            {[
              { problem: '24-48 hour wait for edited photos', solution: 'Enhanced in 30-60 seconds by AI' },
              { problem: '$400+/month on photo editing alone', solution: 'Unlimited edits from $16/listing' },
              { problem: '5 different tools for one listing', solution: 'One platform — photos to published' },
              { problem: 'No idea which photos will sell', solution: 'AI scores and picks your best shots' },
              { problem: 'Hours creating social posts on Canva', solution: '150+ templates auto-generated instantly' },
              { problem: 'Endless email chains for approvals', solution: 'One-click client approval link' },
            ].map((row, i) => (
              <div key={row.problem} className={`grid md:grid-cols-2 gap-0 ${i < 5 ? 'border-b border-white/5' : ''}`}>
                <div className="flex items-center gap-3 px-6 py-4 bg-red-500/5 backdrop-blur-sm md:border-r border-white/5">
                  <span className="text-red-400 text-base flex-shrink-0">✕</span>
                  <span className="text-white/55 text-sm">{row.problem}</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 border-l-2 border-[#D4A017]/30 bg-[#D4A017]/3">
                  <span className="text-[#D4A017] text-base flex-shrink-0">✓</span>
                  <span className="text-white/80 text-sm font-medium">{row.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Luxury Bento */}
      <section className="py-16 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#D4A017] text-xs font-semibold tracking-wider mb-2">HOW IT WORKS</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Three Steps to Marketing Gold
            </h2>
            <p className="text-sm text-white/60 max-w-2xl mx-auto">
              From raw photos to fully marketed listing in 60 seconds.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="bento-grid">
            {/* STEP 1 — wide */}
            <div className="bento-span-2 glass-luxury glossy-top p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="glow-card w-10 h-10 flex items-center justify-center text-black font-bold text-sm shrink-0" style={{ background: 'linear-gradient(135deg,#D4A017,#B8860B)', borderRadius: '50%' }}>1</div>
                <h3 className="text-lg font-bold">Upload Your Photos</h3>
                <span className="px-3 py-1 bg-[#D4A017]/10 text-[#D4A017] text-xs rounded-full border border-[#D4A017]/30">10 seconds</span>
              </div>
              <p className="text-white/60 mb-4">Drag & drop up to 75 photos. Create your listing in seconds — no training needed.</p>
              <div className="grid grid-cols-3 gap-2">
                {['📷 RAW Photos', '🏡 Add Details', '🚀 Hit Go'].map((s) => (
                  <div key={s} className="glass-gold-luxury px-3 py-2 text-center text-xs text-white/70 font-medium">{s}</div>
                ))}
              </div>
            </div>

            {/* STEP 2 — tall right side spanning 2 rows */}
            <div className="bento-row-2 glass-gold-luxury glossy-top p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="glow-card w-10 h-10 flex items-center justify-center text-black font-bold text-sm shrink-0" style={{ background: 'linear-gradient(135deg,#D4A017,#B8860B)', borderRadius: '50%' }}>2</div>
                <h3 className="text-lg font-bold">AI Prepares Everything</h3>
              </div>
              <span className="inline-flex self-start px-3 py-1 bg-[#D4A017]/10 text-[#D4A017] text-xs rounded-full border border-[#D4A017]/30 mb-4">45 seconds</span>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-white/50 mb-2"><span>Processing...</span><span>100%</span></div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] progress-animate rounded-full"></div>
                </div>
              </div>

              <div className="space-y-3 text-sm flex-1">
                {[
                  { label: 'Removes duplicates & bad shots', saving: '10 min' },
                  { label: 'Replaces ugly skies with blue', saving: '$4/photo' },
                  { label: 'Applies HDR & color correction', saving: '$2/photo' },
                  { label: 'Creates twilight hero shot', saving: '$25' },
                  { label: 'Writes MLS description', saving: '15 min' },
                  { label: 'Generates social posts & video', saving: '20 min' },
                ].map(({ label, saving }) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="text-[#D4A017] mt-0.5 shrink-0">✓</span>
                    <div>
                      <div className="font-medium text-white/90 text-xs">{label}</div>
                      <div className="text-[10px] text-white/40">Saved you <span className="text-[#D4A017]">{saving}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[#D4A017]/20 text-center text-sm">
                <span className="text-white/60">What takes editors 2 days, SnapR does in</span>
                <span className="text-[#D4A017] font-bold text-xl stat-glow"> 60s</span>
              </div>
            </div>

            {/* STEP 3 — spans 2 cols bottom */}
            <div className="bento-span-2 glass-luxury glossy-top p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="glow-card w-10 h-10 flex items-center justify-center text-black font-bold text-sm shrink-0" style={{ background: 'linear-gradient(135deg,#D4A017,#B8860B)', borderRadius: '50%' }}>3</div>
                <h3 className="text-lg font-bold">Review & Publish</h3>
                <span className="px-3 py-1 bg-[#D4A017]/10 text-[#D4A017] text-xs rounded-full border border-[#D4A017]/30">5 seconds</span>
              </div>
              <p className="text-white/60 mb-4 text-sm">Everything&apos;s ready. Just approve and publish everywhere.</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: '📱', label: 'Social Posts', sub: 'IG, FB, LinkedIn, TikTok' },
                  { icon: '🎬', label: 'Video Reels', sub: '+ AI Voiceover' },
                  { icon: '🌐', label: 'Property Site', sub: 'Shareable link' },
                  { icon: '✉️', label: 'Email Campaign', sub: 'Ready to send' },
                ].map(({ icon, label, sub }) => (
                  <div key={label} className="glass-gold-luxury p-3 text-center hover:scale-105 transition-transform">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-semibold text-white text-xs mb-1">{label}</div>
                    <div className="text-[10px] text-[#D4A017]">{sub}</div>
                  </div>
                ))}
              </div>
              <p className="text-center text-[#D4A017]/80 text-xs mt-4 font-medium">⚡ No other platform gives you all this from one upload</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="features" className="py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-[#D4A017] text-xs font-semibold tracking-wider mb-2">15 AI ENHANCEMENT TOOLS</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              See the Transformation
            </h2>
            <p className="text-sm text-white/60 max-w-2xl mx-auto">
              From dull to dazzling in 30 seconds. Drag the slider to see the magic.
            </p>
          </div>
        </div>
        <LandingGallery />
      </section>

      {/* We Heard You */}
      <WeHeardYou />

      {/* See Demo - Interactive Product Walkthrough */}
      <section id="see-demo" className="py-16 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#D4A017] text-xs font-semibold tracking-wider mb-2">SEE IT IN ACTION</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              From Photos to Published Listing
            </h2>
            <p className="text-sm text-white/60 max-w-xl mx-auto">
              Watch how SnapR transforms raw property photos into a fully marketed listing — automatically.
            </p>
          </div>

          <ExplainerVideoPlayer />

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="glow-card text-center p-5">
              <p className="text-[#D4A017] font-bold text-xl mb-1 stat-glow">5 Steps</p>
              <p className="text-white/50 text-xs">Fully automated</p>
            </div>
            <div className="glow-card text-center p-5">
              <p className="text-[#D4A017] font-bold text-xl mb-1 stat-glow">Under 10 min</p>
              <p className="text-white/50 text-xs">End to end</p>
            </div>
            <div className="glow-card text-center p-5">
              <p className="text-[#D4A017] font-bold text-xl mb-1 stat-glow">Zero Effort</p>
              <p className="text-white/50 text-xs">AI handles everything</p>
            </div>
          </div>
        </div>
      </section>

      {/* Do The Math Comparison */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D4A017] text-xs font-semibold tracking-wider mb-2">THE NUMBERS</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Do The Math. Then Switch.</h2>
            <p className="text-white/50 text-sm">Cost for 1 listing (25 photos) with full marketing</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pay Per Service */}
            <div className="glass-luxury p-8 border-red-500/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white/70">Pay-Per-Service</h3>
                <span className="text-xs text-white/30">Industry Average</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>HDR Enhancement (25 photos)</span>
                  <span>$40</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Sky Replacement (5 photos)</span>
                  <span>$20</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Virtual Twilight (2 photos)</span>
                  <span>$16</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Virtual Staging (3 rooms)</span>
                  <span>$72</span>
                </div>
                <div className="border-t border-white/10 my-3 pt-3">
                  <div className="flex justify-between text-white/50">
                    <span>Photo editing subtotal</span>
                    <span className="font-medium text-white/70">$148</span>
                  </div>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Social media graphics</span>
                  <span>$75+</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Video slideshow</span>
                  <span>$75+</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Property website</span>
                  <span>$50+</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>MLS description</span>
                  <span>$25+</span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white/70">TOTAL</span>
                  <span className="text-3xl font-bold text-red-400">$373+</span>
                </div>
                <p className="text-white/30 text-sm mt-2">⏱ 2-3 days turnaround</p>
              </div>
            </div>
            
            {/* SnapR Gold */}
            <div className="glass-gold-luxury glossy-top p-8 relative">
              <div className="absolute -top-3 right-6 px-4 py-1 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black text-xs font-bold rounded-full">BEST VALUE</div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#D4A017]">SnapR Gold</h3>
                <span className="text-xs text-[#D4A017]/70">Everything Included</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>HDR Enhancement (unlimited)</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Sky Replacement (unlimited)</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Virtual Twilight (unlimited)</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Virtual Staging (2/listing)</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="border-t border-[#D4A017]/20 my-3 pt-3">
                  <div className="flex justify-between text-white/70">
                    <span>150+ Social Templates</span>
                    <span className="text-[#D4A017]">✓</span>
                  </div>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Video Creator + AI Voiceover</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Property Website</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>AI MLS Description</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Email Campaigns</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Client Approval System</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
              </div>
              <div className="border-t border-[#D4A017]/30 pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">PER LISTING</span>
                  <span className="text-4xl font-bold shimmer-text">$16-$28</span>
                </div>
                <p className="text-[#D4A017]/70 text-sm mt-2">⚡ 60 seconds turnaround • Volume discounts available</p>
              </div>
            </div>
          </div>
          
          {/* Savings Summary */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-6 px-8 py-5 glass-gold-luxury glossy-top">
              <div>
                <p className="text-3xl font-bold text-[#D4A017] stat-glow">$365+</p>
                <p className="text-xs text-white/50">Saved per listing</p>
              </div>
              <div className="h-12 w-px bg-[#D4A017]/20"></div>
              <div>
                <p className="text-3xl font-bold text-[#D4A017] stat-glow">46x</p>
                <p className="text-xs text-white/50">Cheaper</p>
              </div>
              <div className="h-12 w-px bg-[#D4A017]/20"></div>
              <div>
                <p className="text-3xl font-bold text-[#D4A017] stat-glow">2880x</p>
                <p className="text-xs text-white/50">Faster</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 px-6 bg-[#1A1A1A]/30">
        <Testimonials />
      </section>

      {/* Free Marketing Guide */}
      <section className="py-16 px-6 bg-gradient-to-b from-[#1A1A1A]/30 to-[#0F0F0F]">
        <div className="max-w-4xl mx-auto">
          <div className="glass-gold-luxury glossy-top p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-[#D4A017] text-xs font-semibold tracking-wider mb-2 uppercase">Free Guide</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  The Real Estate Photo Marketing Guide
                </h2>
                <p className="text-white/60 text-sm mb-6">
                  Learn the strategies top agents use to market listings faster. 6 chapters of actionable tips, delivered to your inbox.
                </p>
                <ul className="space-y-3 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#D4A017] shrink-0" />
                    Why professional photos sell 32% faster
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4A017] shrink-0" />
                    The 5-step AI-powered workflow
                  </li>
                  <li className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#D4A017] shrink-0" />
                    Social media playbook by platform
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#D4A017] shrink-0" />
                    Analytics and ROI tracking
                  </li>
                </ul>
              </div>
              <GuideRequestForm source="homepage" variant="card" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 px-6 bg-[#0F0F0F]" id="pricing">
        <div className="max-w-5xl mx-auto">
          <PricingSection showHeadline={true} showFAQ={false} showCTA={false} showAddons={true} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black text-xl">S</div>
              <span className="text-xl font-bold"><span className="text-white">Snap</span><span className="text-[#D4A017]">R</span></span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/50">
              <Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link>
              <Link href="/academy" className="hover:text-[#D4A017] transition-colors">Academy</Link>
              <Link href="/guide" className="hover:text-[#D4A017] transition-colors">Free Guide</Link>
              <Link href="/partners" className="hover:text-[#D4A017] transition-colors">Partner with us</Link>
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
          
          {/* Lead Capture */}
          <div className="py-8 border-t border-white/5">
            <GuideRequestForm source="homepage" variant="inline" />
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-xs">© 2026 SnapR. All rights reserved.</p>
            <a href="mailto:support@snap-r.com" className="flex items-center gap-2 text-white/30 text-xs hover:text-[#D4A017] transition-colors">
              <Mail className="w-3 h-3" /> support@snap-r.com
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#D4A017]/30 px-4 py-3 transition-transform duration-300 ${showMobileCTA ? 'translate-y-0' : 'translate-y-full'}`}>
        <Link
          href="/auth/signup"
          onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)}
          className="block w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-center rounded-lg"
        >
          Start Free — No Credit Card
        </Link>
      </div>

      {/* Snap Enhance Info Modal */}
      {showSnapEnhanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowSnapEnhanceModal(false); }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative glass-luxury glossy-top p-8 max-w-lg w-full shadow-2xl border-[#D4A017]/20">
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
              <div className="flex items-start gap-4 p-4 glass-luxury">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center flex-shrink-0"><Camera className="w-5 h-5 text-[#D4A017]" /></div>
                <div><h4 className="font-semibold text-white">Instant Camera Access</h4><p className="text-white/60 text-sm">Tap to open your phone camera and capture property photos directly</p></div>
              </div>
              <div className="flex items-start gap-4 p-4 glass-luxury">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5 text-[#D4A017]" /></div>
                <div><h4 className="font-semibold text-white">AI Enhancement</h4><p className="text-white/60 text-sm">Sky replacement, virtual twilight, HDR, declutter - all in 30 seconds</p></div>
              </div>
              <div className="flex items-start gap-4 p-4 glass-luxury">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-[#D4A017]" /></div>
                <div><h4 className="font-semibold text-white">Instant Download</h4><p className="text-white/60 text-sm">Enhanced photos ready to share or upload to MLS immediately</p></div>
              </div>
            </div>
            
            <Link href="/auth/signup" onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)} className="block w-full text-center py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-opacity">Get Started Free →</Link>
            <p className="text-center text-white/40 text-sm mt-3">30 free enhancements/month • No credit card required</p>
          </div>
        </div>
      )}

      {/* iOS Notify Modal */}
      {showIOSNotifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowIOSNotifyModal(false); }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative glass-luxury glossy-top p-8 max-w-md w-full shadow-2xl border-[#D4A017]/20">
            <button onClick={() => setShowIOSNotifyModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            {notifySubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">You&apos;re on the list!</h3>
                <p className="text-white/60">We&apos;ll notify you when the iOS app launches.</p>
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
                      aria-label="Email for iOS app notification"
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
                  <p className="text-white/40 text-sm mb-2">Can&apos;t wait?</p>
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
