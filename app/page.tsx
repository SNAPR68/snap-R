'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Shield, Mail, Globe, Share2, Wand2, Send, Bell, Upload } from 'lucide-react';
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

// NEW: Pricing slider options
const LISTING_OPTIONS = [10, 15, 20, 25, 30, 40, 50];

// Volume discount function
const getVolumeDiscount = (listings: number): number => {
  if (listings >= 50) return 3.00;
  if (listings >= 40) return 2.50;
  if (listings >= 30) return 2.00;
  if (listings >= 25) return 1.50;
  if (listings >= 20) return 1.00;
  if (listings >= 15) return 0.50;
  return 0;
};

// UPDATED: Corrected pricing - Property Gallery FREE, Virtual Renovation $15/$25/$50, AI Voiceover $2, removed Auto Campaigns
const ADDONS = [
  { id: 'property_gallery', name: 'Property Gallery', price: 'FREE', icon: 'eye', tooltip: 'Shareable photo galleries with contact form for every listing - included free' },
  { id: 'virtual_renovation', name: 'Virtual Renovation', price: '$15 / $25 / $50', icon: 'brush', tooltip: 'Digitally remodel kitchens, bathrooms, flooring & more to show potential' },
  { id: 'ai_voiceover', name: 'AI Voiceovers', price: '$2 flat', icon: 'mic', tooltip: 'Professional AI-generated narration for property videos - flat rate regardless of length' },
  { id: 'cma_report', name: 'CMA Reports', price: 'From $20', icon: 'file', tooltip: 'Comparative Market Analysis reports with your photos & branding' },
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
  
  // NEW: Pricing section state
  const [pricingSliderIndex, setPricingSliderIndex] = useState(4); // Default to 30 listings
  const [userType, setUserType] = useState<'photographer' | 'agent'>('photographer');
  
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
  
  // NEW: Pricing calculator
  const pricingListings = LISTING_OPTIONS[pricingSliderIndex];
  const calculateTierPrice = (basePrice: number) => {
    if (basePrice === 0) return 0;
    const volumeDiscount = getVolumeDiscount(pricingListings);
    const afterVolume = basePrice - volumeDiscount;
    const annualDiscount = isAnnual ? 0.20 : 0;
    const afterAnnual = afterVolume * (1 - annualDiscount);
    return Math.max(afterAnnual, basePrice * 0.5);
  };
  
  const photographerPrices = {
    ultimate: calculateTierPrice(12),
    complete: calculateTierPrice(14),
  };
  
  const agentPrices = {
    starter: calculateTierPrice(14),
    complete: calculateTierPrice(18),
  };
  
  const handleCheckout = async () => {
    if (selectedPlan === 'free') {
      trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK, { plan: 'free' });
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
            <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
            <span className="text-xl font-bold">
              <span className="text-white">Snap</span>
              <span className="text-[#D4A017]">R</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">Features</Link>
            <Link href="/pricing" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">Pricing</Link>
            <Link href="/faq" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">FAQ</Link>
            <Link href="/academy" className="text-white/70 hover:text-[#D4A017] transition-colors text-sm">Academy</Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-white/70 hover:text-white text-sm transition-colors">Log in</Link>
            <Link 
              href="/auth/signup" 
              onClick={() => trackEvent(SnapREvents.HOMEPAGE_CTA_CLICK)}
              className="px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - UPDATED */}
      <section className="pt-28 pb-8 px-6 lg:px-12 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#D4A017]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#D4A017]/10 rounded-full blur-[80px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Hero Text - AI Listing OS */}
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
            
            {/* Main Headline - UPDATED to AI Listing OS */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4">
              The Complete <span className="text-[#D4A017]">AI Listing</span> OS
            </h1>
            
            {/* Feature Stack - UPDATED: Property galleries instead of virtual tours, upload to social instead of social publishing */}
            <p className="text-sm md:text-base text-white/50 mb-4 max-w-3xl mx-auto">
              Photo enhancement • Content studio • Video + AI voiceovers • Property galleries • CMA reports • Email marketing • Upload to social • Client approval
            </p>
            
            {/* Empowerment Hook */}
            <p className="text-lg text-white/80 font-medium mb-2">
              One upload. AI does everything. <span className="text-[#D4A017]">WhatsApp alerts you when clients engage.</span>
            </p>
            
            {/* Speed Line */}
            <p className="text-base text-[#D4A017] font-semibold mb-6">
              "Shot at 2pm. Listed, marketed & shared by 2:12."
            </p>
            
            {/* FREE TRIAL CTA - UPDATED from 3 listings to 7-day trial */}
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
                  <div className="text-[#D4A017] text-xs font-bold tracking-wide">FREE TRIAL</div>
                  <div className="text-white text-xl font-black">7 Days • 1 Listing</div>
                </div>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="text-left">
                <div className="text-white/80 text-sm font-medium">All Features Included</div>
                <div className="text-white/50 text-xs">No credit card required</div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#D4A017] group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {/* Feature Badges - UPDATED: Removed iOS badge, changed colors to gold */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-5">
              {/* REMOVED: First-ever iOS & Android app badge */}
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-full text-xs text-[#D4A017]">
                <Bell className="w-3.5 h-3.5" />
                WhatsApp client alerts
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-full text-xs text-[#D4A017]">
                <Zap className="w-3.5 h-3.5" />
                60-sec AI (vs 48hr industry)
              </span>
            </div>
            
            {/* Trust Signals - UPDATED: Gold checkmarks */}
            <div className="flex flex-wrap justify-center items-center gap-5 text-xs">
              <span className="flex items-center gap-1.5 text-white/40">
                <Check className="w-3.5 h-3.5 text-[#D4A017]" />
                MLS-Ready
              </span>
              <span className="flex items-center gap-1.5 text-white/40">
                <Check className="w-3.5 h-3.5 text-[#D4A017]" />
                15 AI Tools
              </span>
              <span className="flex items-center gap-1.5 text-white/40">
                <Check className="w-3.5 h-3.5 text-[#D4A017]" />
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
            
            {/* Pain 5: Content Creation */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Hours on Social Posts</h3>
              <p className="text-white/60 text-sm">Every listing needs posts for 5 platforms. You spend hours on Canva instead of selling.</p>
            </div>
            
            {/* Pain 6: Client Chaos */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Photo Approval Nightmare</h3>
              <p className="text-white/60 text-sm">Endless email chains, lost files, missed feedback. Client communication is chaos.</p>
            </div>
            
          </div>
          
          {/* Solution intro */}
          <div className="text-center mb-12">
            <p className="text-[#D4A017] text-sm font-semibold tracking-wider mb-3">THE SOLUTION</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              SnapR Fixes Everything
            </h2>
          </div>
          
          {/* 6 Solution Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            
            {/* Solution 1: Speed */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">30-60 Second AI Processing</h3>
              <p className="text-white/60 text-sm">Photos enhanced before you finish your coffee. List immediately with stunning visuals.</p>
            </div>
            
            {/* Solution 2: Cost */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">96% Cost Reduction</h3>
              <p className="text-white/60 text-sm">From $400/month to under $20. Unlimited enhancements included in your plan.</p>
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
              <p className="text-white/60 text-sm">Social posts, videos, emails — all auto-generated and ready to upload in seconds.</p>
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

      {/* NEW: How It Works - Animated 3 Steps */}
      <section className="py-16 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D4A017] text-sm font-semibold tracking-wider mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Three Steps to Marketing Gold
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              From raw photos to fully marketed listing in 60 seconds.
            </p>
          </div>
          
          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4A017] via-[#D4A017]/50 to-[#D4A017]/20 hidden md:block"></div>
            
            {/* STEP 1: UPLOAD */}
            <div className="relative mb-8 md:ml-16">
              <div className="absolute -left-[52px] top-0 hidden md:block">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-bold text-lg pulse-gold">1</div>
              </div>
              <div className="rounded-2xl p-6 bg-[#1A1A1A] border border-[#D4A017]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="md:hidden w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-bold">1</div>
                  <h3 className="text-2xl font-bold">Upload Your Photos</h3>
                  <span className="px-3 py-1 bg-[#D4A017]/10 text-[#D4A017] text-xs rounded-full border border-[#D4A017]/30">10 seconds</span>
                </div>
                <p className="text-white/60">Drag & drop up to 75 photos. Create your listing in seconds.</p>
              </div>
            </div>
            
            {/* STEP 2: AI PREPARES (The Big One) */}
            <div className="relative mb-8 md:ml-16">
              <div className="absolute -left-[52px] top-0 hidden md:block">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-bold text-lg pulse-gold">2</div>
              </div>
              <div className="rounded-2xl p-6 bg-[#1A1A1A] border-2 border-[#D4A017]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="md:hidden w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-bold">2</div>
                  <h3 className="text-2xl font-bold">AI Prepares Everything</h3>
                  <span className="px-3 py-1 bg-[#D4A017]/10 text-[#D4A017] text-xs rounded-full border border-[#D4A017]/30">45 seconds</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>Processing...</span>
                    <span>100%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] progress-animate rounded-full"></div>
                  </div>
                </div>
                
                {/* What AI Does */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[#D4A017] mt-0.5">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Removes duplicates & bad shots</div>
                      <div className="text-sm text-white/40">Saved you <span className="text-[#D4A017]">10 min</span></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#D4A017] mt-0.5">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Replaces ugly skies with blue</div>
                      <div className="text-sm text-white/40">Saved you <span className="text-[#D4A017]">$4/photo</span></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#D4A017] mt-0.5">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Applies HDR & color correction</div>
                      <div className="text-sm text-white/40">Saved you <span className="text-[#D4A017]">$2/photo</span></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#D4A017] mt-0.5">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Creates twilight hero shot</div>
                      <div className="text-sm text-white/40">Saved you <span className="text-[#D4A017]">$25</span></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#D4A017] mt-0.5">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Writes MLS description</div>
                      <div className="text-sm text-white/40">Saved you <span className="text-[#D4A017]">15 min</span></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#D4A017] mt-0.5">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Generates social posts & video</div>
                      <div className="text-sm text-white/40">Saved you <span className="text-[#D4A017]">20 min</span></div>
                    </div>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="mt-6 pt-4 border-t border-[#D4A017]/20 text-center">
                  <span className="text-white/60">What takes editors 24-48 hours, SnapR does in</span>
                  <span className="text-[#D4A017] font-bold text-xl"> 60 seconds</span>
                </div>
              </div>
            </div>
            
            {/* STEP 3: REVIEW & PUBLISH */}
            <div className="relative md:ml-16">
              <div className="absolute -left-[52px] top-0 hidden md:block">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-bold text-lg pulse-gold">3</div>
              </div>
              <div className="rounded-2xl p-6 bg-[#1A1A1A] border border-[#D4A017]/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="md:hidden w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-bold">3</div>
                  <h3 className="text-2xl font-bold">Review & Publish</h3>
                  <span className="px-3 py-1 bg-[#D4A017]/10 text-[#D4A017] text-xs rounded-full border border-[#D4A017]/30">5 seconds</span>
                </div>
                <p className="text-white/60 mb-4">Everything's ready. Just approve and publish everywhere.</p>
                
                {/* What's Ready - HIGHLIGHTED MOAT */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-[#D4A017]/20 to-transparent border-2 border-[#D4A017]/50 rounded-2xl text-center hover:border-[#D4A017] hover:shadow-lg hover:shadow-[#D4A017]/20 transition-all group">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📱</div>
                    <div className="font-semibold text-white mb-1">Social Posts</div>
                    <div className="text-xs text-[#D4A017]">IG, FB, LinkedIn, TikTok</div>
                    <div className="text-[10px] text-white/50 mt-1">150+ templates</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-[#D4A017]/20 to-transparent borr-2 border-[#D4A017]/50 rounded-2xl text-center hover:border-[#D4A017] hover:shadow-lg hover:shadow-[#D4A017]/20 transition-all group">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎬</div>
                    <div className="font-semibold text-white mb-1">Video Reels</div>
                    <div className="text-xs text-[#D4A017]">+ AI Voiceover</div>
                    <div className="text-[10px] text-white/50 mt-1">Auto-generated</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-[#D4A017]/20 to-transparent border-2 border-[#D4A017]/50 rounded-2xl text-center hover:border-[#D4A017] hover:shadow-lg hover:shadow-[#D4A017]/20 transition-all group">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl groupover:scale-110 transition-transform">🌐</div>
                    <div className="font-semibold text-white mb-1">Property Site</div>
                    <div className="text-xs text-[#D4A017]">Shareable link</div>
                    <div className="text-[10px] text-white/50 mt-1">Instant landing page</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-[#D4A017]/20 to-transparent border-2 border-[#D4A017]/50 rounded-2xl text-center hover:border-[#D4A017] hover:shadow-lg hover:shadow-[#D4A017]/20 transition-all group">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✉️</div>
                    <div className="font-semibold text-white mb-1">Email Campaign</div>
                    <div className="text-xs text-[#D4A017]">Ready to send</div>
                    <div className="text-[10px] text-white/50 mt-1">Profel templates</div>
                  </div>
                </div>
                <p className="text-center text-[#D4A017]/80 text-sm mt-4 font-medium">⚡ No other platform gives you all this from one upload</p>
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

      {/* NEW: Features Grid - 15 AI Tools */}
      <section className="py-20 px-6 bg-[#0F0F0F]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D4A017] text-sm font-semibold tracking-wider mb-3">ALL 15 AI TOOLS INCLUDED</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Others Charge Extra For</h2>
            <p className="text-white/50">Every tool included in your subscription. No per-photo fees.</p>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { name: 'Sky Replace', price: '$4/photo' },
              { name: 'Twilight', price: '$8/photo' },
              { name: 'HDR', price: '$1.60/photo' },
              { name: 'Staging', price: '$24/room' },
              { name: 'Lawn Repair', price: '$4/photo' },
              { name: 'Declutter', price: '$4/photo' },
              { name: 'Fireplace', price: '$4/photo' },
              { name: 'Lights On', price: '$4/photo' },
              { name: 'TV Replace', price: '$4/photo' },
              { name: 'Pool', price: '$4/photo' },
              { name: 'Auto Enhance', price: '$2/photo' },
              { name: 'Perspective', price: '$2/photo' },
              { name: 'Color Fix', price: '$1.60/photo' },
              { name: 'Brightness', price: '$1.60/photo' },
              { name: 'Object Remove', price: '$4/photo' },
            ].map((tool) => (
              <div key={tool.name} className="group p-4 rounded-xl bg-[#1A1A1A] border border-[#D4A017]/20 hover:border-[#D4A017]/60 transition-all text-center">
                <p className="text-sm font-medium text-white mb-1">{tool.name}</p>
                <p className="text-xs text-white/40 line-through">{tool.price}</p>
                <p className="text-xs text-[#D4A017] font-semibold">INCLUDED</p>
              </div>
            ))}
          </div>
          
          {/* Total Savings */}
          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm">Traditional cost for 25 photos: <span className="text-red-400 line-through">$148+</span></p>
            <p className="text-white/70">With SnapR: <span className="text-[#D4A017] font-bold">All included in your listing price</span></p>
          </div>
        </div>
      </section>

      {/* NEW: Do The Math Comparison */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D4A017] text-sm font-semibold tracking-wider mb-3">THE NUMBERS</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Do The Math. Then Switch.</h2>
            <p className="text-white/50">Cost for 1 listing (25 photos) with full marketing</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional */}
            <div className="rounded-2xl p-8 bg-[#1A1A1A] border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white/70">Traditional Services</h3>
                <span className="text-xs text-white/30">BoxBrownie, PhotoUp, Styldod</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Basic enhancement (25 × $1.60)</span>
                  <span>$40</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Sky replacement (5 × $4)</span>
                  <span>$20</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Virtual twilight (2 × $8)</span>
                  <span>$16</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Virtual staging (3 × $24)</span>
                  <span>$72</span>
                </div>
                <div className="border-t border-white/10 my-3 pt-3">
                  <div className="flex justify-between text-white/50">
                    <span>Photo editing subtotal</span>
                    <span className="font-medium text-white/70">$148</span>
                  </div>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Social media graphics (5 posts)</span>
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
                  <span className="text-3xl font-bold text-white/50">$373+</span>
                </div>
                <p className="text-white/30 text-sm mt-2">⏱ 2-3 days turnaround</p>
              </div>
            </div>
            
            {/* SnapR */}
            <div className="rounded-2xl p-8 bg-[#1A1A1A] border-2 border-[#D4A017] relative">
              <div className="absolute -top-3 right-6 px-4 py-1 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black text-xs font-bold rounded-full">BEST VALUE</div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#D4A017]">SnapR</h3>
                <span className="text-xs text-[#D4A017]/70">Everything Included</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>All 15 AI tools (unlimited)</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Sky replacement (unlimited)</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Virtual twilight (unlimited)</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Virtual staging</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="border-t border-[#D4A017]/20 my-3 pt-3">
                  <div className="flex justify-between text-white/70">
                    <span>150+ social templates</span>
                    <span className="text-[#D4A017]">✓</span>
                  </div>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Video creator + AI voiceover</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Property website</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>AI MLS description</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Email campaigns</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Client approval system</span>
                  <span className="text-[#D4A017]">✓</span>
                </div>
              </div>
              <div className="border-t border-[#D4A017]/30 pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">TOTAL</span>
                  <span className="text-4xl font-bold text-[#D4A017]">From $8</span>
                </div>
                <p className="text-[#D4A017]/70 text-sm mt-2">⚡ 60 seconds turnaround</p>
              </div>
            </div>
          </div>
          
          {/* Savings Summary */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-6 px-8 py-4 bg-[#1A1A1A] border border-[#D4A017]/30 rounded-2xl">
              <div>
                <p className="text-3xl font-bold text-[#D4A017]">$365+</p>
                <p className="text-xs text-white/50">Saved per listing</p>
              </div>
              <div className="h-12 w-px bg-[#D4A017]/20"></div>
              <div>
                <p className="text-3xl font-bold text-[#D4A017]">46x</p>
                <p className="text-xs text-white/50">Cheaper</p>
              </div>
              <div className="h-12 w-px bg-[#D4A017]/20"></div>
              <div>
                <p className="text-3xl font-bold text-[#D4A017]">2880x</p>
                <p className="text-xs text-white/50">Faster</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-[#1A1A1A]/30">
        <Testimonials />
      </section>

      {/* NEW: 3-Tier Pricing Section */}
      <section className="py-20 px-6 bg-[#0F0F0F]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#D4A017] text-sm font-semibold tracking-wider mb-3">SIMPLE PRICING</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pay Per Listing. Scale As You Grow.</h2>
          </div>
          
          {/* Role Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 bg-white/5 border border-white/10 rounded-full">
              <button
                onClick={() => setUserType('photographer')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  userType === 'photographer'
                    ? 'bg-[#D4A017] text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Camera className="w-5 h-5" />
                I'm a Photographer
              </button>
              <button
                onClick={() => setUserType('agent')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  userType === 'agent'
                    ? 'bg-[#D4A017] text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Globe className="w-5 h-5" />
                I'm an Agent / Broker
              </button>
            </div>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-full">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !isAnnual ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  isAnnual ? 'bg-[#D4A017] text-black' : 'text-white/50 hover:text-white'
                }`}
              >
                Annual
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
          
          {/* Listings Slider */}
          <div className="max-w-xl mx-auto mb-10 p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold">How many listings per month?</h3>
                <p className="text-sm text-white/50">More listings = lower price per listing</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#D4A017]">{pricingListings}</div>
                <div className="text-sm text-white/50">listings/mo</div>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max={LISTING_OPTIONS.length - 1}
              value={pricingSliderIndex}
              onChange={(e) => setPricingSliderIndex(Number(e.target.value))}
              className="pricing-slider w-full"
              style={{
                background: `linear-gradient(to right, #D4A017 ${(pricingSliderIndex / (LISTING_OPTIONS.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(pricingSliderIndex / (LISTING_OPTIONS.length - 1)) * 100}%)`
              }}
            />
            <div className="flex justify-between text-sm text-white/40 mt-2">
              {LISTING_OPTIONS.map((opt, i) => (
                <span key={opt} className={i === pricingSliderIndex ? 'text-[#D4A017] font-bold' : ''}>
                  {opt}
                </span>
              ))}
            </div>
          </div>
          
          {/* 3 Pricing Tiers */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Free Tier */}
            <div className="rounded-2xl p-6 h-full flex flex-col bg-[#1A1A1A] border border-[#D4A017]/20">
              <h3 className="text-xl font-bold mb-2">Free Trial</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">$0</span>
              </div>
              <p className="text-white/50 text-sm mb-4">7-day trial</p>
              <ul className="space-y-2 text-sm flex-1">
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> 1 listing (7 days)</li>
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> 30 photos</li>
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> All 15 AI tools</li>
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> Watermarked exports</li>
                <li className="flex items-center gap-2 text-white/40"><span className="text-white/30">✗</span> HD exports</li>
              </ul>
              <Link href="/auth/signup" className="w-full mt-6 py-3 bg-white/5 border border-[#D4A017]/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-[#D4A017]/50 transition-all text-center block">
                Start Free Trial
              </Link>
            </div>
            
            {/* Middle Tier (Popular) */}
            <div className="relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black text-xs font-bold rounded-full z-10">MOST POPULAR</div>
              <div className="rounded-2xl p-6 h-full flex flex-col bg-[#1A1A1A] border-2 border-[#D4A017]">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-[#D4A017]">
                    ${userType === 'photographer' ? photographerPrices.ultimate.toFixed(2) : agentPrices.starter.toFixed(2)}
                  </span>
                  <span className="text-white/50">/listing</span>
                </div>
                <p className="text-white/50 text-sm mb-4">{userType === 'photographer' ? 'For photographers' : 'For agents'}</p>
                <ul className="space-y-2 text-sm flex-1">
                  <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> {userType === 'photographer' ? '75' : '60'} photos per listing</li>
                  <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> All 15 AI tools</li>
                  <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> {userType === 'photographer' ? 'Unlimited Twilight' : '2 Twilight per listing'}</li>
                  <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> 2 Virtual Staging/listing</li>
                  <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> HD exports (no watermark)</li>
                  <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> Client delivery portal</li>
                  <li className="flex items-center gap-2 text-white/50"><span className="text-white/30">+</span> Human revision (add-on)</li>
                </ul>
                <Link href="/auth/signup" className="w-full mt-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl hover:opacity-90 transition-opacity text-center block">
                  Get Started
                </Link>
                <p className="text-center text-xs text-white/40 mt-2">
                  ${Math.round((userType === 'photographer' ? photographerPrices.ultimate : agentPrices.starter) * pricingListings)}/mo for {pricingListings} listings
                </p>
              </div>
            </div>
            
            {/* Complete Tier */}
            <div className="rounded-2xl p-6 h-full flex flex-col bg-[#1A1A1A] border border-[#D4A017]/20">
              <h3 className="text-xl font-bold mb-2">Agency</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">
                  ${userType === 'photographer' ? photographerPrices.complete.toFixed(2) : agentPrices.complete.toFixed(2)}
                </span>
                <span className="text-white/50">/listing</span>
              </div>
              <p className="text-white/50 text-sm mb-4">Full marketing suite</p>
              <ul className="space-y-2 text-sm flex-1">
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> Everything in Pro</li>
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> Content Studio (150+ templates)</li>
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> Email Marketing</li>
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> Upload to Social Media</li>
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> Property Sites</li>
                <li className="flex items-center gap-2 text-white/70"><span className="text-[#D4A017]">✓</span> Priority Support</li>
              </ul>
              <Link href="/auth/signup" className="w-full mt-6 py-3 bg-white/5 border border-[#D4A017]/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-[#D4A017]/50 transition-all text-center block">
                Get Started
              </Link>
              <p className="text-center text-xs text-white/40 mt-2">
                ${Math.round((userType === 'photographer' ? photographerPrices.complete : agentPrices.complete) * pricingListings)}/mo for {pricingListings} listings
              </p>
            </div>
          </div>
          
          {/* View Full Pricing */}
          <div className="mt-10 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-[#D4A017] font-medium hover:underline">
              View full pricing details
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Add-ons - UPDATED with correct pricing */}
      <section className="py-16 px-6 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Premium Add-ons</h2>
            <p className="text-white/50">Unlock advanced capabilities • Pay as you go</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Property Gallery', desc: 'Shareable galleries', price: 'FREE', color: 'green' },
              { name: 'Renovation', desc: 'Digital remodeling', price: '$15 / $25 / $50', color: 'orange' },
              { name: 'AI Voiceovers', desc: 'Pro narration', price: '$2 flat', color: 'blue' },
              { name: 'CMA Reports', desc: 'Market analysis', price: 'From $20', color: 'purple' },
              { name: 'Human Editing', desc: 'Pro retouching', price: 'From $5/img', color: 'cyan' },
              { name: 'White Label', desc: 'Your brand', price: '$99/mo', color: 'yellow' },
            ].map((addon) => (
              <div key={addon.name} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4A017]/50 transition-all cursor-pointer text-center">
                <h4 className="font-semibold text-sm mb-1">{addon.name}</h4>
                <p className="text-white/40 text-xs mb-2">{addon.desc}</p>
                <span className={`text-sm font-medium ${addon.price === 'FREE' ? 'text-green-400' : 'text-[#D4A017]'}`}>{addon.price}</span>
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
