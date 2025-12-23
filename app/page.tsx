'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Shield, Mail, Globe, Share2, Wand2, Send, Bell } from 'lucide-react';
import { LandingGallery } from '@/components/landing-gallery';
import { Testimonials } from '@/components/testimonials';
import { AnimatedBackground } from '@/components/animated-background';
import { trackEvent, SnapREvents } from '@/lib/analytics';

// Pricing data
const PRO_TIERS = [
  { listings: 10, monthly: 25, annual: 20 },
  { listings: 20, monthly: 22, annual: 18 },
  { listings: 30, monthly: 19, annual: 15 },
  { listings: 50, monthly: 17, annual: 13 },
  { listings: 75, monthly: 15, annual: 12 },
  { listings: 100, monthly: 14, annual: 11 },
  { listings: 125, monthly: 13, annual: 10 },
  { listings: 150, monthly: 12, annual: 9 },
  { listings: '150+', monthly: null, annual: null, enterprise: true },
] as const;

const TEAM_OPTIONS = [
  { users: 5, monthly: 199, annual: 149 },
  { users: 10, monthly: 399, annual: 299 },
  { users: 25, monthly: 649, annual: 499 },
] as const;

const ADDONS = [
  { id: 'virtual_tour', name: 'Virtual Tours', price: 'From $50', icon: 'eye' },
  { id: 'virtual_renovation', name: 'Virtual Renovation', price: 'From $35', icon: 'brush' },
  { id: 'ai_voiceover', name: 'AI Voiceovers', price: 'From $15', icon: 'mic' },
  { id: 'cma_report', name: 'CMA Reports', price: 'From $20', icon: 'file' },
  { id: 'auto_campaigns', name: 'Auto Campaigns', price: 'From $30', icon: 'zap' },
  { id: 'white_label', name: 'White Label', price: '$99/mo', icon: 'tag' },
  { id: 'human_editing', name: 'Human Editing', price: 'From $5/image', icon: 'user' },
] as const;

const GOLD = '#D4A017';

const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const AddonIcon = ({ type }: { type: string }) => {
  if (type === 'grid') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
  if (type === 'eye') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  if (type === 'brush') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  );
  if (type === 'mic') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
  if (type === 'file') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
  if (type === 'zap') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
  if (type === 'tag') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.121.332a11.203 11.203 0 001.719-4.72l-3.75-3.75a3 3 0 00-4.243-4.243l-3.75-3.75z" />
    </svg>
  );
  if (type === 'user') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
  return null;
};

const LoadingSpinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function HomePage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(4);
  const [teamSizeIndex, setTeamSizeIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'team'>('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSnapEnhanceModal, setShowSnapEnhanceModal] = useState(false);
  const [showIOSNotifyModal, setShowIOSNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const currentTier = PRO_TIERS[sliderIndex];
  const isEnterprise = (currentTier as any).enterprise === true;
  const teamOption = TEAM_OPTIONS[teamSizeIndex];

  const proCalc = useMemo(() => {
    if (isEnterprise) return { price: null, total: null, savings: 0 };
    const price = isAnnual ? currentTier.annual : currentTier.monthly;
    const listings = currentTier.listings as number;
    const total = listings * (price as number);
    const savings = isAnnual ? ((currentTier.monthly as number) - (currentTier.annual as number)) * listings * 12 : 0;
    return { price, total, savings };
  }, [currentTier, isAnnual, isEnterprise]);

  const teamCalc = useMemo(() => {
    if (isEnterprise) return { base: null, price: null, listingCost: null, total: null };
    const base = isAnnual ? teamOption.annual : teamOption.monthly;
    const price = isAnnual ? currentTier.annual : currentTier.monthly;
    const listings = currentTier.listings as number;
    const listingCost = listings * (price as number);
    const total = base + listingCost;
    return { base, price, listingCost, total };
  }, [teamOption, currentTier, isAnnual, isEnterprise]);

  const handleCheckout = async () => {
    if (selectedPlan === 'free') {
      trackEvent(SnapREvents.CHECKOUT_STARTED, { plan: 'free' });
      window.location.href = '/auth/signup';
      return;
    }

    if (isEnterprise) {
      window.location.href = '/contact';
      return;
    }

    trackEvent(SnapREvents.CHECKOUT_STARTED, { plan: selectedPlan });
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billing: isAnnual ? 'annual' : 'monthly',
          listings: currentTier.listings as number,
          teamSize: selectedPlan === 'team' ? TEAM_OPTIONS[teamSizeIndex].users : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAddonPurchase = async (addonId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/addon-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonType: addonId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getCardStyle = (plan: 'free' | 'pro' | 'team') => {
    const isSelected = selectedPlan === plan;
    if (isSelected) {
      return {
        backgroundColor: plan === 'pro' ? undefined : 'rgba(255,255,255,0.02)',
        background: plan === 'pro' ? 'linear-gradient(180deg, rgba(212,160,23,0.1) 0%, rgba(212,160,23,0.03) 50%, transparent 100%)' : undefined,
        border: `2px solid ${GOLD}`,
        boxShadow: '0 0 40px rgba(212, 160, 23, 0.2)',
      };
    }
    return {
      backgroundColor: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.1)',
    };
  };

  const getCtaStyle = (plan: 'free' | 'pro' | 'team') => {
    const isSelected = selectedPlan === plan;
    if (isSelected) {
      return { backgroundColor: GOLD, color: '#000' };
    }
    return { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' };
  };

  const getBonusStyle = (plan: 'pro' | 'team') => {
    const isSelected = selectedPlan === plan;
    if (isSelected) {
      return { backgroundColor: 'rgba(0,0,0,0.2)', color: '#000' };
    }
    return { backgroundColor: 'rgba(212,160,23,0.2)', color: GOLD };
  };

  const ctaText = isEnterprise ? 'Contact Sales' : 'Get started';
  const bonusText = isAnnual ? '+1 month free' : '+1 week free';

  const sliderStyles: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '128px',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255,255,255,0.1)',
    outline: 'none',
    cursor: 'pointer',
  };

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
            <Link href="#pricing" onClick={() => trackEvent(SnapREvents.HOMEPAGE_PRICING_CLICK)} className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
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
              onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)}
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
              One Platform. Upload to Published.
            </p>
            
            {/* Tagline */}
            <p className="text-lg text-[#D4A017] font-semibold mb-6">
              Shot at 2pm. Posted by 2:12.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3 mb-5">
              <Link 
                href="/auth/signup" 
                onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)}
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

      {/* Pain Points Section */}
      <section className="py-16 px-6 bg-[#0F0F0F]">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-white/30 text-sm mb-3">The Problem</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Listing marketing shouldn't take all day.
          </h2>
          <p className="text-lg text-white/60 text-center mb-12 max-w-2xl mx-auto">
            Right now, getting a listing from photos to published means juggling tools, waiting days, and spending hundreds.
          </p>

          {/* Two Column Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* LEFT: Without SnapR */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-red-400 mb-6">Without SnapR</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Photo editing service:</span>
                  <span className="text-white font-semibold">$125 - $625</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Wait time:</span>
                  <span className="text-white font-semibold">24 - 48 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Social graphics (Canva):</span>
                  <span className="text-white font-semibold">45 min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Video slideshow:</span>
                  <span className="text-white font-semibold">30 min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Email campaign:</span>
                  <span className="text-white font-semibold">20 min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Description writing:</span>
                  <span className="text-white font-semibold">15 min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Scheduling & posting:</span>
                  <span className="text-white font-semibold">20 min</span>
                </div>
                <div className="pt-4 mt-4 border-t border-red-500/30 flex justify-between text-lg font-bold">
                  <span className="text-white">Total:</span>
                  <span className="text-red-400">$300+ & 2-3 days</span>
                </div>
              </div>
            </div>

            {/* RIGHT: With SnapR */}
            <div className="bg-gradient-to-br from-[#D4A017]/20 to-[#B8860B]/10 border-2 border-[#D4A017] rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4A017] text-black text-xs font-bold rounded-full">
                RECOMMENDED
              </div>
              <h3 className="text-xl font-bold text-[#D4A017] mb-6 mt-2">With SnapR</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-white/70">Upload photos:</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    Instant <Check className="w-4 h-4 text-green-400" />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">AI Enhancement (all 15 tools):</span>
                  <span className="text-white font-semibold">30 sec</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Social posts (150+ templates):</span>
                  <span className="text-white font-semibold">2 min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Video created:</span>
                  <span className="text-white font-semibold">Auto</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Email campaign ready:</span>
                  <span className="text-white font-semibold">Auto</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">AI description written:</span>
                  <span className="text-white font-semibold">Auto</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Published everywhere:</span>
                  <span className="text-white font-semibold">1 click</span>
                </div>
                <div className="pt-4 mt-4 border-t border-[#D4A017]/30 flex justify-between text-lg font-bold">
                  <span className="text-white">Total:</span>
                  <span className="text-[#D4A017]">$12 & 12 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-[#D4A017] mb-2">96%</div>
              <div className="text-white/60 text-sm">Less cost per listing</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#D4A017] mb-2">99%</div>
              <div className="text-white/60 text-sm">Faster turnaround</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#D4A017] mb-2">1</div>
              <div className="text-white/60 text-sm">Platform for everything</div>
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
      <section id="pricing" className="py-16 px-6 bg-[#0F0F0F]">
        <style dangerouslySetInnerHTML={{ __html: `
          .pricing-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #D4A017;
            cursor: pointer;
            border: 2px solid #fff;
            box-shadow: 0 0 10px rgba(212,160,23,0.5);
          }
          .pricing-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #D4A017;
            cursor: pointer;
            border: 2px solid #fff;
            box-shadow: 0 0 10px rgba(212,160,23,0.5);
          }
        `}} />
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-1">Choose your plan</h2>
            <p className="text-sm text-white/50">Simple, transparent pricing. No hidden fees.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-center text-sm bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {/* Controls Row */}
          <div className="flex items-center justify-center gap-6 mb-8">
            {/* Billing Toggle */}
            <div className="inline-flex items-center p-1 rounded-full bg-white/5 border border-white/10">
              <button onClick={() => setIsAnnual(false)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-[#D4A017] text-black' : 'bg-transparent text-white/50'}`}>Monthly</button>
              <button onClick={() => setIsAnnual(true)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isAnnual ? 'bg-[#D4A017] text-black' : 'bg-transparent text-white/50'}`}>
                Annual
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-green-500 text-white">−20%</span>
              </button>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/5 border border-white/10">
              <span className="text-sm font-medium text-[#D4A017]">Listings:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/80">10</span>
                <input type="range" min="0" max="8" value={sliderIndex} onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  setSliderIndex(newValue);
                  trackEvent(SnapREvents.PRICING_SLIDER_USED, { value: newValue });
                }} className="pricing-slider" style={sliderStyles} />
                <span className="text-xs font-medium text-white/80">150+</span>
              </div>
              <span className="text-xl font-bold w-12 text-[#D4A017]">{currentTier.listings}</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-5 mb-8">
            {/* FREE */}
            <div onClick={() => {
              setSelectedPlan('free');
              trackEvent(SnapREvents.PLAN_SELECTED, { plan: 'free' });
            }} className="rounded-2xl p-5 relative cursor-pointer transition-all duration-300" style={getCardStyle('free')}>
              {selectedPlan === 'free' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#D4A017] text-black">Selected</div>}
              <div style={{ height: '60px' }}><h3 className="text-xl font-bold">Free</h3><p className="text-sm text-white/50">Try SnapR risk-free</p></div>
              <div style={{ height: '50px' }} className="flex items-baseline"><span className="text-4xl font-bold">$0</span></div>
              <div style={{ height: '100px' }}>
                <div className="p-3 rounded-xl h-full bg-white/5">
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-white/50">Listings</span><span className="font-semibold">3</span></div>
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-white/50">Photos per listing</span><span className="font-semibold">10</span></div>
                  <div className="flex justify-between text-sm"><span className="text-white/50">Total downloads</span><span className="font-semibold">30 images</span></div>
                </div>
              </div>
              <div style={{ height: '50px' }} className="flex items-center">
                <button onClick={(e) => { e.stopPropagation(); if (selectedPlan === 'free') handleCheckout(); }} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2" style={getCtaStyle('free')}>
                  {loading && selectedPlan === 'free' ? <LoadingSpinner /> : (isEnterprise ? 'Contact Sales' : 'Get started free')}
                </button>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10">
                <ul className="space-y-2">
                  {['15 AI enhancement tools', 'Content Studio (limited)', 'Basic photo scoring', 'Watermarked exports'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70"><CheckIcon />{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* PRO */}
            <div onClick={() => {
              setSelectedPlan('pro');
              trackEvent(SnapREvents.PLAN_SELECTED, { plan: 'pro' });
            }} className="rounded-2xl p-5 relative cursor-pointer transition-all duration-300" style={getCardStyle('pro')}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#D4A017] text-black">{selectedPlan === 'pro' ? 'Selected' : 'Most Popular'}</div>
              <div style={{ height: '60px' }}><h3 className="text-xl font-bold">Pro</h3><p className="text-sm text-white/50">For agents & photographers</p></div>
              <div style={{ height: '50px' }} className="flex items-baseline">
                <span className="text-4xl font-bold text-[#D4A017]">{isEnterprise ? 'Custom' : `$${proCalc.price}`}</span>
                {!isEnterprise && <span className="text-base ml-1 text-white/50">/listing</span>}
              </div>
              <div style={{ height: '100px' }}>
                <div className="p-3 rounded-xl h-full bg-black/20">
                  {isEnterprise ? (
                    <><div className="text-sm mb-1 text-white/50">High-volume pricing</div><div className="text-lg font-bold">Contact us</div></>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-white/50">{currentTier.listings} listings × ${proCalc.price}</span>
                        <span className="text-lg font-bold">${proCalc.total}<span className="text-xs font-normal text-white/40">/mo</span></span>
                      </div>
                      {isAnnual && proCalc.savings > 0 && <div className="text-xs text-right text-green-400">Save ${proCalc.savings.toLocaleString()}/year</div>}
                      <div className="text-xs mt-1 text-white/40">75 photos per listing included</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ height: '50px' }} className="flex items-center">
                <button onClick={(e) => { e.stopPropagation(); if (selectedPlan === 'pro') handleCheckout(); }} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all" style={getCtaStyle('pro')}>
                  {loading && selectedPlan === 'pro' ? <LoadingSpinner /> : ctaText}
                  {!isEnterprise && !loading && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={getBonusStyle('pro')}>{bonusText}</span>}
                </button>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10">
                <ul className="space-y-2">
                  {['Listing Intelligence AI', 'Photo Culling AI', 'Content Studio — 150+ templates', 'Video, Email, Property Sites'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70"><CheckIcon />{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* TEAM */}
            <div onClick={() => {
              setSelectedPlan('team');
              trackEvent(SnapREvents.PLAN_SELECTED, { plan: 'team' });
            }} className="rounded-2xl p-5 relative cursor-pointer transition-all duration-300" style={getCardStyle('team')}>
              {selectedPlan === 'team' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#D4A017] text-black">Selected</div>}
              <div style={{ height: '60px' }}><h3 className="text-xl font-bold">Team</h3><p className="text-sm text-white/50">For brokerages & teams</p></div>
              <div style={{ height: '50px' }} className="flex items-baseline">
                <span className="text-4xl font-bold text-[#D4A017]">{isEnterprise ? 'Custom' : `$${teamCalc.price}`}</span>
                {!isEnterprise && <span className="text-base ml-1 text-white/50">/listing + base</span>}
              </div>
              <div style={{ height: '100px' }}>
                <div className="p-3 rounded-xl h-full bg-white/5">
                  <div className="flex gap-1.5 mb-2">
                    {TEAM_OPTIONS.map((opt, i) => (
                      <button key={opt.users} onClick={(e) => { e.stopPropagation(); setTeamSizeIndex(i); }} className={`flex-1 py-1 rounded text-xs font-medium transition-all ${i === teamSizeIndex ? 'bg-[#D4A017] text-black' : 'bg-white/5 text-white/50'}`}>
                        {i === 0 ? `${opt.users} users` : opt.users}
                      </button>
                    ))}
                  </div>
                  {isEnterprise ? (
                    <><div className="text-xs text-white/40">High-volume pricing</div><div className="font-semibold">Contact us</div></>
                  ) : (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">${teamCalc.base} base + {currentTier.listings}×${teamCalc.price}</span>
                      <span className="font-semibold">${teamCalc.total?.toLocaleString()}/mo</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ height: '50px' }} className="flex items-center">
                <button onClick={(e) => { e.stopPropagation(); if (selectedPlan === 'team') handleCheckout(); }} disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all" style={getCtaStyle('team')}>
                  {loading && selectedPlan === 'team' ? <LoadingSpinner /> : ctaText}
                  {!isEnterprise && !loading && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={getBonusStyle('team')}>{bonusText}</span>}
                </button>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10">
                <p className="text-xs mb-2 text-white/40">Everything in Pro, plus:</p>
                <ul className="space-y-2">
                  {['Up to 25 team members', 'Roles, permissions & analytics', 'Shared assets & brand enforcement', 'Dedicated account manager'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70"><CheckIcon />{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Premium Add-ons</h3>
              <span className="text-sm text-white/40">Pay as you go</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {ADDONS.map((addon) => (
                <div key={addon.name} onClick={() => handleAddonPurchase(addon.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:border-amber-500/50 bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-[#D4A017]/10"><AddonIcon type={addon.icon} /></div>
                  <h4 className="font-semibold text-sm mb-1">{addon.name}</h4>
                  <p className="text-xs text-[#D4A017]">{addon.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between py-4 border-t border-white/10">
            <div className="flex items-center gap-6 opacity-40">
              {['RE/MAX', 'Keller Williams', 'Coldwell Banker', 'Century 21'].map((brand) => (
                <span key={brand} className="text-sm font-medium">{brand}</span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/50">Questions?</span>
              <Link href="/contact" className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10">Contact sales</Link>
            </div>
          </div>
        </div>
      </section>

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
            
            <Link href="/auth/signup" onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)} className="block w-full text-center py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-opacity">Get Started Free →</Link>
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