'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CreditCard, Shield, Check } from 'lucide-react';
import Link from 'next/link';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const plan = searchParams.get('plan') || 'pro';
  const listings = searchParams.get('listings') || '30';
  const billing = searchParams.get('billing') || 'monthly';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function initiateCheckout() {
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signup');
        return;
      }

      // Free plan doesn't need Stripe
      if (plan === 'free') {
        router.push('/onboarding');
        return;
      }

      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, listings: parseInt(listings), billing }),
          signal: AbortSignal.timeout(15000),
        });

        const data = await res.json();

        if (data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        } else if (data.redirect) {
          router.push(data.redirect);
        } else {
          setError(data.error || 'Failed to create checkout session');
          setLoading(false);
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    }

    initiateCheckout();
  }, [plan, listings, billing, router, supabase]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Checkout Error</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setError(''); setLoading(true); window.location.reload(); }}
              className="px-6 py-3 bg-[#D4A017] text-black font-semibold rounded-xl hover:bg-[#B8860B]"
            >
              Try Again
            </button>
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20"
            >
              Back to Signup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4A017] mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Setting Up Your Plan</h1>
        <p className="text-white/60 mb-8">Redirecting to secure checkout...</p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 text-left">
          <p className="text-sm text-white/50 mb-1">Selected Plan</p>
          <p className="text-lg font-bold text-[#D4A017] capitalize">{plan} Plan</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
            <span>{listings} listings/mo</span>
            <span className="capitalize">{billing} billing</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
          <Shield className="w-4 h-4" />
          <span>Secured by Stripe</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
