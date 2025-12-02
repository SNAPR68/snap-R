"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, CreditCard, Sparkles } from 'lucide-react';

const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 50, price: 29, priceDisplay: '$29/mo' },
  { id: 'pro', name: 'Pro', credits: 200, price: 79, priceDisplay: '$79/mo', popular: true },
  { id: 'enterprise', name: 'Enterprise', credits: 500, price: 199, priceDisplay: '$199/mo' },
];

export default function BillingClient({ profile }: { profile: any }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start checkout');
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Upgrade Your Plan</h1>
          <p className="text-white/60 text-sm mt-1">Choose a plan that works for you</p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400">Payment successful! Your credits have been added.</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Current Credits Card */}
        <div className="bg-gradient-to-r from-[#D4A017]/20 to-transparent rounded-2xl p-6 border border-[#D4A017]/30 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#D4A017]/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[#D4A017]" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Available Credits</p>
                <p className="text-4xl font-bold text-[#D4A017]">{profile?.credits || 0}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Current Plan</p>
              <p className="text-xl font-semibold capitalize">{profile?.plan || 'Free Trial'}</p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <h2 className="text-xl font-bold mb-6">Choose Your Plan</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-[#1A1A1A] rounded-2xl p-6 border ${
                pkg.popular ? 'border-[#D4A017]' : 'border-white/10'
              } hover:border-[#D4A017]/50 transition-colors`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4A017] text-black text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-[#D4A017]">{pkg.priceDisplay}</span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-white/40" />
                <span className="text-white/80">{pkg.credits} credits/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <Check className="w-4 h-4 text-[#D4A017]" /> All AI enhancement tools
                </li>
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <Check className="w-4 h-4 text-[#D4A017]" /> Instant delivery
                </li>
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <Check className="w-4 h-4 text-[#D4A017]" /> {pkg.id === 'starter' ? 'Email support' : pkg.id === 'pro' ? 'Priority support' : 'Dedicated support'}
                </li>
                {pkg.id !== 'starter' && (
                  <li className="flex items-center gap-2 text-sm text-white/60">
                    <Check className="w-4 h-4 text-[#D4A017]" /> {pkg.id === 'pro' ? 'Team sharing' : 'API access'}
                  </li>
                )}
              </ul>
              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading === pkg.id}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black hover:opacity-90'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                } disabled:opacity-50`}
              >
                {loading === pkg.id ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Credit Usage Info */}
        <div className="mt-12 bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold mb-4">Credit Usage</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-white/60 text-sm mb-1">Basic Enhancements</p>
              <p className="text-xl font-bold">1 credit</p>
              <p className="text-white/40 text-xs mt-1">Sky, HDR, Lawn, Auto</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-white/60 text-sm mb-1">Advanced Edits</p>
              <p className="text-xl font-bold">2 credits</p>
              <p className="text-white/40 text-xs mt-1">Twilight, Declutter</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-white/60 text-sm mb-1">Premium Features</p>
              <p className="text-xl font-bold">3 credits</p>
              <p className="text-white/40 text-xs mt-1">Virtual Staging</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
