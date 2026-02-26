'use client';

import { useEffect } from 'react';
import { useSession } from '@/app/providers/session-provider';
import { identifyUser } from '@/lib/analytics';

// Renders nothing — purely fires user identification into ContentSquare and
// Hotjar once the authenticated user is known, so session recordings and
// heatmaps are attributed to real users with their plan tier.
export function AnalyticsIdentifier() {
  const { user } = useSession();

  useEffect(() => {
    if (!user?.id) return;

    fetch('/api/user/profile', { signal: AbortSignal.timeout(5000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((profile: { plan?: string; subscription_tier?: string } | null) => {
        identifyUser(user.id, {
          email: user.email,
          plan: profile?.plan ?? profile?.subscription_tier ?? 'free',
        });
      })
      .catch(() => {
        // Fallback: identify with just user ID and email
        identifyUser(user.id, { email: user.email });
      });
  }, [user?.id, user?.email]);

  return null;
}
