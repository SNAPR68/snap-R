'use client';

import { useEffect } from 'react';
import { useSession } from './session-provider';

// RevenueCat is loaded lazily to avoid SSR issues (uses browser APIs)
async function initRevenueCat(apiKey: string, appUserId: string) {
  const { Purchases } = await import('@revenuecat/purchases-js');
  Purchases.configure({ apiKey, appUserId });

  // Attach Stripe customer ID as a subscriber attribute so RevenueCat
  // dashboard can cross-reference with Stripe (non-blocking)
  try {
    const res = await fetch('/api/user/profile', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const { stripe_customer_id } = (await res.json()) as { stripe_customer_id?: string };
      if (stripe_customer_id) {
        const rc = Purchases.getSharedInstance();
        await rc.setAttributes({ $stripeCustomerId: stripe_customer_id });
      }
    }
  } catch {
    // Non-blocking — analytics attribution only
  }
}

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY;

  useEffect(() => {
    if (!apiKey || !user?.id) return;

    initRevenueCat(apiKey, user.id).catch(() => {
      // RevenueCat init failure is non-blocking — never crash the app
    });
  }, [user?.id, apiKey]);

  return <>{children}</>;
}
