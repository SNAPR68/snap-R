'use client';

import Link from 'next/link';
import { BarChart3, ChevronRight, Zap } from 'lucide-react';

type UsageWidgetProps = {
  listingsUsed: number;
  listingsLimit: number;
  tier: string;
};

export function UsageWidget({ listingsUsed, listingsLimit, tier }: UsageWidgetProps) {
  const percent = listingsLimit > 0 ? Math.min((listingsUsed / listingsLimit) * 100, 100) : 0;
  const isNearLimit = percent >= 80;
  const isAtLimit = percent >= 100;
  const isFree = tier === 'free';

  return (
    <div className="bg-surface-container-high border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">Usage This Month</span>
        </div>
        <span className="text-xs text-white/40 capitalize">{tier} plan</span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/60">Listings</span>
          <span className={isAtLimit ? 'text-red-400 font-semibold' : isNearLimit ? 'text-amber-400' : 'text-white/60'}>
            {listingsUsed} / {listingsLimit}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-400' : 'bg-accent-gold'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Contextual CTA */}
      {isAtLimit && (
        <Link
          href="/dashboard/billing"
          className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 bg-gradient-to-r from-gold to-gold-dark text-black text-xs font-semibold rounded-lg hover:opacity-90 transition-all"
        >
          <Zap className="w-3 h-3" />
          Upgrade for More Listings
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}

      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-amber-400/80 mt-2">
          Approaching your monthly limit — <Link href="/dashboard/billing" className="underline hover:text-amber-300">upgrade</Link> for more.
        </p>
      )}

      {isFree && !isNearLimit && (
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary mt-2 transition-colors"
        >
          Upgrade to unlock marketing automation
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
