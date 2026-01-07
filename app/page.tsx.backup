'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Shield, Mail, Globe, Share2, Wand2, Send, Bell } from 'lucide-react';
import { LandingGallery } from '@/components/landing-gallery';
import { Testimonials } from '@/components/testimonials';
import { trackEvent, SnapREvents } from '@/lib/analytics';

// Pricing data - Listing-based model (25% below Fotello)
const PRO_TIERS = [
  { listings: 10, perListing: 9, perListingAnnual: 7 },
  { listings: 20, perListing: 8.5, perListingAnnual: 6.75 },
  { listings: 30, perListing: 8, perListingAnnual: 6.5 },
  { listings: 50, perListing: 7.5, perListingAnnual: 6 },
  { listings: 75, perListing: 7, perListingAnnual: 5.5 },
  { listings: 100, perListing: null, perListingAnnual: null, enterprise: true },
] as const;
const AGENCY_PREMIUM = 2; // +$2/listing over Pro
const FREE_LISTINGS = 3;
const TEAM_OPTIONS = [
  { users: 5, monthly: 199, annual: 149 },
] as const;

const ADDONS = [
  { id: 'virtual_tour', name: 'Virtual Tours', price: 'From $50', icon: 'eye', tooltip: 'Interactive 360° walkthrough tours that let buyers explore properties remotely' },
  { id: 'virtual_renovation', name: 'Virtual Renovation', price: 'From $35', icon: 'brush', tooltip: 'Digitally remodel kitchens, bathrooms, flooring & more to show potential' },
  { id: 'ai_voiceover', name: 'AI Voiceovers', price: 'From $15', icon: 'mic', tooltip: 'Professional AI-generated narration for property videos in multiple voices' },
  { id: 'cma_report', name: 'CMA Reports', price: 'From $20', icon: 'file', tooltip: 'Comparative Market Analysis reports with your photos & branding' },
  { id: 'auto_campaigns', name: 'Auto Campaigns', price: 'From $30', icon: 'zap', tooltip: 'Automated social media posting schedules & email drip campaigns' },
  { id: 'white_label', name: 'White Label', price: '$99/mo', icon: 'tag', tooltip: 'Remove SnapR branding & use your own logo for client-facing deliverables' },
  { id: 'human_editing', name: 'Human Editing', price: 'From $5/image', icon: 'user', tooltip: 'Complex edits by professionals: object removal, compositing, retouching' },
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
  
  // Listings slider for pricing
  const [listings, setListings] = useState(30);
  const calculatePrice = (listingCount: number, annual: boolean) => {
    const basePrice = 49;
    const pricePerExtra = 6;
    const monthlyPrice = basePrice + (listingCount - 5) * pricePerExtra;
    return annual ? Math.round(monthlyPrice * 0.75) : monthlyPrice;
  };
  const sliderPrice = calculatePrice(listings, isAnnual);
  const sliderPerListing = (sliderPrice / listings).toFixed(2);
  const savingsVsBase = Math.round((1 - (sliderPrice / listings) / 9.80) * 100);
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
  // Agency = Pro + $2/listing
  const proCalc = useMemo(() => {
    if (isEnterprise) return { price: null, total: null, savings: 0, firstMonth: null };
    const perListing = isAnnual ? (currentTier as any).perListingAnnual : (currentTier as any).perListing;
    const listings = typeof currentTier.listings === "number" ? currentTier.listings : 0;
    const total = perListing ? listings * perListing : 0;
    const monthlyTotal = (currentTier as any).perListing ? listings * (currentTier as any).perListing : 0;
    const savings = isAnnual ? monthlyTotal : 0;
    const firstMonth = Math.round(total * 0.75);
    return { price: perListing, total, savings, firstMonth };
  }, [currentTier, isAnnual, isEnterprise]);

  const teamCalc = useMemo(() => {
    if (isEnterprise) return { price: null, total: null };
    const perListing = isAnnual ? (currentTier as any).perListingAnnual : (currentTier as any).perListing;
    const agencyPerListing = perListing ? perListing + AGENCY_PREMIUM : null;
    const listings = typeof currentTier.listings === "number" ? currentTier.listings : 0;
    const total = agencyPerListing ? listings * agencyPerListing : 0;
    return { price: agencyPerListing, total };
  }, [currentTier, isAnnual, isEnterprise]);
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
            <Link href="/pricing" onClick={() => trackEvent(SnapREvents.HOMEPAGE_PRICING_CLICK)} className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
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
          
          {/* Hero Text - Complete Marketing OS */}
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4">
              The Complete <span className="text-[#D4A017]">Real Estate Marketing</span> OS
            </h1>
            
            {/* Feature Stack */}
            <p className="text-sm md:text-base text-white/50 mb-4 max-w-3xl mx-auto">
              Photo enhancement • Content studio • Video + AI voiceovers • Virtual tours • CMA reports • Email marketing • Social publishing • Client approval
            </p>
            
            {/* Empowerment Hook */}
            <p className="text-lg text-white/80 font-medium mb-2">
              One upload. AI does everything. <span className="text-[#D4A017]">WhatsApp alerts you when clients engage.</span>
            </p>
            
            {/* Speed Line */}
            <p className="text-base text-[#D4A017] font-semibold mb-6">
              "Shot at 2pm. Listed, marketed & shared by 2:12."
            </p>
            
            {/* FREE Plan CTA */}
            <Link 
              href="/auth/signup" 
              onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)}
              className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-[#D4A017]/20 to-[#D4A017]/10 border-2 border-[#D4A017]/50 rounded-full mb-6 hover:border-[#D4A017] hover:scale-105 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center shadow-lg shadow-[#D4A017]/30 group-hover:scale-110 transition-transform">
                  <Check className="w-6 h-6 text-black" />
                </div>
                <div className="text-left">
                  <div className="text-[#D4A017] text-xs font-bold tracking-wide">FREE PLAN</div>
                  <div className="text-white text-xl font-black">3 Listings/month</div>
                </div>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="text-left">
                <div className="text-white/80 text-sm font-medium">All Features Included</div>
                <div className="text-white/50 text-xs">No credit card required</div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#D4A017] group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {/* Industry Firsts */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-5">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                <Smartphone className="w-3.5 h-3.5" />
                First-ever iOS & Android app
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400">
                <Bell className="w-3.5 h-3.5" />
                WhatsApp client alerts
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400">
                <Zap className="w-3.5 h-3.5" />
                60-sec AI (vs 48hr industry)
              </span>
            </div>
            
            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center items-center gap-5 text-xs">
              <span className="flex items-center gap-1.5 text-white/40">
                <Check className="w-3.5 h-3.5 text-green-500" />
                MLS-Ready
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
          
        </div>
      </section>

      {/* Pain Points Section - 6 Cards */}
      <section className="py-16 px-6 bg-[#0F0F0F]">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[#D4A017] text-sm font-semibold tracking-wider mb-3">THE INDUSTRY PROBLEM</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            The Real Estate Marketing Struggle
          </h2>
          <p className="text-lg text-white/60 text-center mb-12 max-w-2xl mx-auto">
            Every day, agents and photographers face these frustrations. Sound familiar?
          </p>

          {/* 6 Pain Point Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            
            {/* Pain 1: Wait Times */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">24-48 Hour Wait Times</h3>
              <p className="text-white/60 text-sm">Your listing goes live with terrible photos while you wait for edits to come back.</p>
            </div>
            
            {/* Pain 2: Cost */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">$400+/Month on Photo Editing</h3>
              <p className="text-white/60 text-sm">$2-4 per photo × 100+ photos = bleeding money on every listing.</p>
            </div>
            
            {/* Pain 3: Tool Juggling */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Juggling 5 Different Tools</h3>
              <p className="text-white/60 text-sm">Photo editor, Canva, Hootsuite, email platform, MLS upload... the chaos never ends.</p>
            </div>
            
            {/* Pain 4: No Quality Feedback */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">No Idea If Your Photos Are Good</h3>
              <p className="text-white/60 text-sm">Shoot 100 photos, hope some turn out okay. No guidance, no scoring, just guessing.</p>
            </div>
            
            {/* Pain 5: Social Media Guilt */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Social Media Guilt</h3>
              <p className="text-white/60 text-sm">Know you should post daily, actually post monthly. The content creation struggle is real.</p>
            </div>
            
            {/* Pain 6: Email Approval Chains */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Endless Email Approval Chains</h3>
              <p className="text-white/60 text-sm">"Can you resend photo #7?" "Which one did you approve?" Back and forth forever.</p>
            </div>
            
          </div>

          {/* Solutions Section Header */}
          <p className="text-center text-[#D4A017] text-sm font-semibold tracking-wider mb-3">THE SNAPR SOLUTION</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            SnapR Fixes Everything
          </h2>
          <p className="text-lg text-white/60 text-center mb-12 max-w-2xl mx-auto">
            One platform. Every problem solved. Here's how we do it differently.
          </p>

          {/* 6 Solution Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            {/* Solution 1: Speed */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">30-Second Enhancement</h3>
              <p className="text-white/60 text-sm">AI processes your photos instantly. No waiting, no delays, no excuses.</p>
            </div>
            
            {/* Solution 2: Free Enhancement */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">30 Free Enhancements/Month</h3>
              <p className="text-white/60 text-sm">All 15 AI enhancement tools included free. Upgrade for unlimited + listings.</p>
            </div>
            
            {/* Solution 3: All-in-One */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">One Platform Does It All</h3>
              <p className="text-white/60 text-sm">Photos, videos, social posts, emails, property sites — everything in one place.</p>
            </div>
            
            {/* Solution 4: AI Scoring */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">Listing Intelligence AI</h3>
              <p className="text-white/60 text-sm">AI scores your photos, picks the hero image, and tells you exactly what to improve.</p>
            </div>
            
            {/* Solution 5: Content Studio */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">150+ Ready Templates</h3>
              <p className="text-white/60 text-sm">Social posts, videos, emails — all auto-generated and ready to publish in seconds.</p>
            </div>
            
            {/* Solution 6: Client Approval */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">One-Click Client Approval</h3>
              <p className="text-white/60 text-sm">Share a link, client approves with one click. No more email chains or confusion.</p>
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

      {/* How It Works - 4 Step Workflow */}
      <section className="py-16 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#D4A017] text-sm font-semibold tracking-wider mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Four Steps to Listing Gold
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              From raw photos to published everywhere in under 12 minutes.
            </p>
          </div>
          
          {/* 4 Workflow Panels */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Panel 1: UPLOAD */}
            <div className="group">
              <div className="gold-border-animate mb-2">
                <div className="aspect-[4/3] relative p-1.5">
                  <div className="w-full h-full bg-[#0A0A0A] rounded-lg overflow-hidden relative flex flex-col items-center justify-center">
                    {/* Film strip / Upload visual */}
                    <div className="flex gap-1 mb-2">
                      <div className="w-6 h-8 bg-white/20 rounded-sm"></div>
                      <div className="w-6 h-8 bg-white/30 rounded-sm"></div>
                      <div className="w-6 h-8 bg-white/40 rounded-sm"></div>
                      <div className="w-6 h-8 bg-[#D4A017]/60 rounded-sm"></div>
                    </div>
                    {/* Upload Icon */}
                    <div className="w-8 h-8 rounded-full bg-[#D4A017]/20 border border-[#D4A017]/40 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-white/50 text-[8px] mt-1">Drop photos here</p>
                  </div>
                </div>
              </div>
              
              {/* Gold Button */}
              <div className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg">
                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-black font-semibold text-sm">Upload</span>
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
                  <p className="text-[#D4A017]/80 text-xs font-medium mt-1">✓ iOS App Soon &nbsp; ✓ Android App Soon &nbsp; ✓ Web App Now</p>
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
          
          {/* iOS + Android + Web App Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
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
            
            {/* Android App Card */}
            <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 overflow-hidden">
              {/* Coming Soon Banner */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-full">
                <span className="text-[#D4A017] text-xs font-semibold">COMING SOON</span>
              </div>
              
              {/* Phone Mockup - Android style */}
              <div className="flex justify-center mb-6 mt-4">
                <div className="relative">
                  <div className="w-32 h-56 bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] rounded-[1.5rem] border-4 border-[#3A3A3A] p-2 shadow-2xl">
                    <div className="w-full h-full bg-[#0A0A0A] rounded-[1rem] flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Camera punch hole */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2A2A2A] rounded-full"></div>
                      {/* App Screen */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center mb-2">
                          <Camera className="w-6 h-6 text-black" />
                        </div>
                        <span className="text-white text-[10px] font-semibold">SnapR</span>
                        <span className="text-white/40 text-[8px]">AI Director</span>
                      </div>
                      {/* Android nav bar */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-4">
                        <div className="w-3 h-3 border border-white/30 rounded-sm"></div>
                        <div className="w-3 h-3 border border-white/30 rounded-full"></div>
                        <div className="w-3 h-3 border-l-2 border-white/30"></div>
                      </div>
                    </div>
                  </div>
                  {/* Glow */}
                  <div className="absolute -inset-4 bg-[#3DDC84]/10 rounded-full blur-2xl -z-10"></div>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {/* Android Icon */}
                  <svg className="w-6 h-6 text-[#3DDC84]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.42-.59-3.02-.59-4.48 0L10.1 5.67c-.18-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85L10.85 9.48C7.58 11.05 5.45 14.27 5 18h14c-.45-3.73-2.58-6.95-5.85-8.52zM10 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                  </svg>
                  <h3 className="text-xl font-bold text-white">Android App</h3>
                </div>
                <p className="text-[#3DDC84] font-semibold mb-4">SnapR Camera with AI Director</p>
                
                {/* Features */}
                <ul className="space-y-2 text-left mb-6">
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#3DDC84]" />
                    AI guides you before the shot
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#3DDC84]" />
                    Real-time composition tips
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#3DDC84]" />
                    MLS compliance built-in
                  </li>
                  <li className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-[#3DDC84]" />
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
                <p className="text-white/30 text-xs mt-2">Launching in Play Store soon</p>
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
                <p className="text-white/30 text-xs mt-2">30 free enhancements/month • No credit card</p>
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D4A017] text-sm font-semibold tracking-wider mb-3">15 AI ENHANCEMENT TOOLS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See the Transformation
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              From dull to dazzling in 30 seconds. Drag the slider to see the magic.
            </p>
          </div>
        </div>
        <LandingGallery />
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-[#1A1A1A]/30">
        <Testimonials />
      </section>

      {/* Pricing Section - Simplified with hook */}
      <section id="pricing" className="py-20 px-6 bg-[#0F0F0F]">
        <div className="max-w-5xl mx-auto">
          {/* Hook */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-sm mb-6">
              <Zap className="w-4 h-4" />
              Stop paying $1,000+/mo for 8 different tools
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The <span className="text-[#D4A017]">Complete</span> Real Estate Marketing OS
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-4">
              Photo editing, content studio, video creator, virtual tours, email marketing, 
              social publishing, WhatsApp alerts — <span className="text-white font-semibold">ALL IN ONE</span>
            </p>
            <p className="text-lg">
              <span className="text-white/50">Fotello charges $12-14/listing for</span>{' '}
              <span className="text-red-400 line-through">just editing</span>{' '}
              <span className="text-white/50">→</span>{' '}
              <span className="text-[#D4A017] font-bold">SnapR: EVERYTHING for $7-9/listing</span>
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {['15 AI Tools', 'Content Studio', 'Video + Voiceovers', 'Virtual Tours', 'Email Marketing', 'Social Publishing', 'WhatsApp Alerts', 'Client Approval'].map((f) => (
              <span key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/70">✓ {f}</span>
            ))}
          </div>

          {/* Simple Toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-full">
              <button onClick={() => setIsAnnual(false)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-[#D4A017] text-black' : 'text-white/50'}`}>
                Monthly <span className="text-xs opacity-70">(1 week free)</span>
              </button>
              <button onClick={() => setIsAnnual(true)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${isAnnual ? 'bg-[#D4A017] text-black' : 'text-white/50'}`}>
                Annual <span className="text-xs opacity-70">(1 month free)</span>
              </button>
            </div>
          </div>


          {/* Pricing Slider */}
          <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm">How many listings per month?</h3>
                <p className="text-white/40 text-xs">Drag to see your price</p>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-xs text-white/40 mb-1"><span>5</span><span>15</span><span>25</span><span>30</span></div>
                <input type="range" min="5" max="30" step="1" value={listings} onChange={(e) => setListings(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-gold" />
                <div className="text-center mt-2 text-lg font-bold text-[#D4A017]">{listings} listings</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${sliderPrice}<span className="text-sm text-white/50">/mo</span></div>
                <div className="text-xs text-white/50">${sliderPerListing}/listing</div>
                {savingsVsBase > 0 && <div className="text-green-400 text-xs">Save {savingsVsBase}%</div>}
              </div>
            </div>
          </div>
          {/* Simplified 3 Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {/* Free */}
            <div onClick={() => setSelectedPlan('free')} className={`rounded-2xl p-6 cursor-pointer transition-all ${selectedPlan === 'free' ? 'bg-gradient-to-b from-[#D4A017]/20 to-transparent border-2 border-[#D4A017]' : 'bg-white/5 border border-white/10'}`}>
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <p className="text-white/50 text-sm mb-4">Try everything risk-free</p>
              <div className="text-4xl font-bold mb-4">$0</div>
              <ul className="space-y-2 mb-6 text-sm text-white/70">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 3 listings/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> All 15 AI tools</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Content Studio (limited)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-400" /> Watermarked exports</li>
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-center transition-all">
                Start Free
              </Link>
            </div>

            {/* Pro */}
            <div onClick={() => setSelectedPlan('pro')} className={`rounded-2xl p-6 cursor-pointer transition-all relative ${selectedPlan === 'pro' ? 'bg-gradient-to-b from-[#D4A017]/20 to-transparent border-2 border-[#D4A017]' : 'bg-white/5 border border-white/10'}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4A017] text-black text-xs font-bold rounded-full">Most Popular</div>
              <h3 className="text-xl font-bold mb-1">Pro</h3>
              <p className="text-white/50 text-sm mb-4">For agents & photographers</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-[#D4A017]">${sliderPerListing}</span>
                <span className="text-white/50">/listing</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-white/70">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 10-75 listings/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Priority processing (30 sec)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Full Content Studio</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Clean HD exports</li>
              </ul>
              <Link href="/auth/signup?plan=pro" className="block w-full py-3 bg-[#D4A017] hover:bg-[#B8860B] rounded-xl font-semibold text-black text-center transition-all">
                Start Pro Trial
              </Link>
            </div>

            {/* Agency */}
            <div onClick={() => setSelectedPlan('team')} className={`rounded-2xl p-6 cursor-pointer transition-all ${selectedPlan === 'team' ? 'bg-gradient-to-b from-[#D4A017]/20 to-transparent border-2 border-[#D4A017]' : 'bg-white/5 border border-white/10'}`}>
              <h3 className="text-xl font-bold mb-1">Agency</h3>
              <p className="text-white/50 text-sm mb-4">For teams & brokerages</p>
              <div className="mb-4">
                <span className="text-4xl font-bold">${isAnnual ? '8.50' : '10'}</span>
                <span className="text-white/50">/listing</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-white/70">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Unlimited listings</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Instant processing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 5 team members</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> White-label option</li>
              </ul>
              <Link href="/auth/signup?plan=agency" className="block w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-center transition-all">
                Start Agency Trial
              </Link>
            </div>
          </div>

          {/* CTA to full pricing */}
          <div className="text-center">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-[#D4A017] hover:text-[#B8860B] font-medium transition-colors">
              See complete feature comparison & pricing calculator
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

          {/* Premium Add-ons - Circular Layout */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold">Premium Add-ons</h3>
              <p className="text-sm text-white/50">Unlock advanced capabilities • Pay as you go</p>
            </div>
            
            {/* Circular Grid */}
            <div className="relative w-full max-w-3xl mx-auto h-[500px]">
              
              {/* Center - White Label */}
              <div 
                onClick={() => handleAddonPurchase('white_label')}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 group cursor-pointer z-10"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#D4A017]/20 via-[#1A1A1A] to-[#D4A017]/10 border-2 border-[#D4A017]/40 hover:border-[#D4A017] transition-all flex flex-col items-center justify-center text-center p-4 shadow-2xl shadow-[#D4A017]/10">
                  <div className="w-12 h-12 rounded-full bg-[#D4A017]/20 border border-[#D4A017]/40 flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.121.332a11.203 11.203 0 001.719-4.72l-3.75-3.75a3 3 0 00-4.243-4.243l-3.75-3.75z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">White Label</h4>
                  <p className="text-white/50 text-xs mb-2">Your brand everywhere</p>
                  <span className="text-[#D4A017] font-bold">$99/mo</span>
                </div>
              </div>
              
              {/* Connecting lines (decorative) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-dashed border-white/10" />
              
              {/* Position 1: Virtual Tours (Top) */}
              <div 
                onClick={() => handleAddonPurchase('virtual_tour')}
                className="absolute left-1/2 -translate-x-1/2 top-0 w-36 h-36 group cursor-pointer"
              >
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-400/30 hover:border-blue-400 transition-all flex flex-col items-center justify-center text-center p-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white text-xs mb-0.5">Virtual Tours</h4>
                  <p className="text-white/40 text-[10px] mb-1">360° walkthroughs</p>
                  <span className="text-[#D4A017] text-xs font-semibold">From $50</span>
                </div>
              </div>
              
              {/* Position 2: Virtual Renovation (Top Right) */}
              <div 
                onClick={() => handleAddonPurchase('virtual_renovation')}
                className="absolute right-8 top-16 w-36 h-36 group cursor-pointer"
              >
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-400/30 hover:border-orange-400 transition-all flex flex-col items-center justify-center text-center p-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white text-xs mb-0.5">Renovation</h4>
                  <p className="text-white/40 text-[10px] mb-1">Digital remodeling</p>
                  <span className="text-[#D4A017] text-xs font-semibold">From $35</span>
                </div>
              </div>
              
              {/* Position 3: AI Voiceovers (Bottom Right) */}
              <div 
                onClick={() => handleAddonPurchase('ai_voiceover')}
                className="absolute right-8 bottom-16 w-36 h-36 group cursor-pointer"
              >
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-400/30 hover:border-green-400 transition-all flex flex-col items-center justify-center text-center p-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white text-xs mb-0.5">AI Voiceovers</h4>
                  <p className="text-white/40 text-[10px] mb-1">Pro narration</p>
                  <span className="text-[#D4A017] text-xs font-semibold">From $15</span>
                </div>
              </div>
              
              {/* Position 4: Human Editing (Bottom) */}
              <div 
                onClick={() => handleAddonPurchase('human_editing')}
                className="absolute left-1/2 -translate-x-1/2 bottom-0 w-36 h-36 group cursor-pointer"
              >
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-400/30 hover:border-cyan-400 transition-all flex flex-col items-center justify-center text-center p-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white text-xs mb-0.5">Human Editing</h4>
                  <p className="text-white/40 text-[10px] mb-1">Pro retouching</p>
                  <span className="text-[#D4A017] text-xs font-semibold">From $5/img</span>
                </div>
              </div>
              
              {/* Position 5: Auto Campaigns (Bottom Left) */}
              <div 
                onClick={() => handleAddonPurchase('auto_campaigns')}
                className="absolute left-8 bottom-16 w-36 h-36 group cursor-pointer"
              >
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-400/30 hover:border-yellow-400 transition-all flex flex-col items-center justify-center text-center p-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white text-xs mb-0.5">Auto Campaigns</h4>
                  <p className="text-white/40 text-[10px] mb-1">Scheduled posts</p>
                  <span className="text-[#D4A017] text-xs font-semibold">From $30</span>
                </div>
              </div>
              
              {/* Position 6: CMA Reports (Top Left) */}
              <div 
                onClick={() => handleAddonPurchase('cma_report')}
                className="absolute left-8 top-16 w-36 h-36 group cursor-pointer"
              >
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 border border-indigo-400/30 hover:border-indigo-400 transition-all flex flex-col items-center justify-center text-center p-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white text-xs mb-0.5">CMA Reports</h4>
                  <p className="text-white/40 text-[10px] mb-1">Market analysis</p>
                  <span className="text-[#D4A017] text-xs font-semibold">From $20</span>
                </div>
              </div>
              
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
      </section>

      {/* Premium Add-ons */}
      <section className="py-16 px-6 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Premium Add-ons</h2>
            <p className="text-white/50">Unlock advanced capabilities • Pay as you go</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Virtual Tours', desc: '360° walkthroughs', price: 'From $50', color: 'blue' },
              { name: 'Renovation', desc: 'Digital remodeling', price: 'From $35', color: 'orange' },
              { name: 'AI Voiceovers', desc: 'Pro narration', price: 'From $15', color: 'green' },
              { name: 'CMA Reports', desc: 'Market analysis', price: 'From $20', color: 'purple' },
              { name: 'Human Editing', desc: 'Pro retouching', price: 'From $5/img', color: 'cyan' },
              { name: 'White Label', desc: 'Your brand', price: '$99/mo', color: 'yellow' },
            ].map((addon) => (
              <div key={addon.name} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4A017]/50 transition-all cursor-pointer text-center">
                <h4 className="font-semibold text-sm mb-1">{addon.name}</h4>
                <p className="text-white/40 text-xs mb-2">{addon.desc}</p>
                <span className="text-[#D4A017] text-sm font-medium">{addon.price}</span>
              </div>
            ))}
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
            <p className="text-center text-white/40 text-sm mt-3">30 free enhancements/month • No credit card required</p>
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