'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, X, Zap, ChevronRight } from 'lucide-react';
import { trackEvent, SnapREvents } from '@/lib/analytics';

type UpgradeNudgeProps = {
  /** What the user tried to do that's gated */
  feature: string;
  /** Short description of what they'll unlock */
  description: string;
  /** Which tier unlocks this feature (defaults to 'Pro') */
  requiredTier?: string;
  /** Inline style (banner) vs overlay (modal) */
  variant?: 'banner' | 'modal' | 'inline';
  /** Called when the user dismisses */
  onDismiss?: () => void;
};

export function UpgradeNudge({
  feature,
  description,
  requiredTier = 'Pro',
  variant = 'banner',
  onDismiss,
}: UpgradeNudgeProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (variant !== 'modal' || dismissed) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [variant, dismissed, handleDismiss])

  if (dismissed) return null;

  const handleUpgradeClick = () => {
    trackEvent(SnapREvents.UPGRADE_CLICKED, { feature, requiredTier });
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#D4A017]/10 border border-[#D4A017]/20 rounded-xl">
        <Sparkles className="w-4 h-4 text-[#D4A017] flex-shrink-0" />
        <p className="text-sm text-white/70 flex-1">
          <span className="text-[#D4A017] font-medium">{feature}</span> — {description}
        </p>
        <Link
          href="/dashboard/billing"
          onClick={handleUpgradeClick}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#D4A017] hover:bg-[#B8860B] text-black text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          <Zap className="w-3 h-3" />
          Upgrade
        </Link>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Upgrade to ${requiredTier}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />
        <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 max-w-md w-full">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/40 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center mb-6">
            <Sparkles className="w-7 h-7 text-black" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Unlock {feature}</h3>
          <p className="text-white/50 mb-6">{description}</p>

          <div className="space-y-2 mb-8">
            {[
              'Marketing automation (descriptions, captions, MLS)',
              'Social media publishing',
              'Video generation with AI voiceover',
              'Lead management & CRM',
            ].map((perk, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                <Zap className="w-3.5 h-3.5 text-[#D4A017] flex-shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/billing"
            onClick={handleUpgradeClick}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Upgrade to {requiredTier}
            <ChevronRight className="w-4 h-4" />
          </Link>

          <button onClick={handleDismiss} className="w-full py-2 mt-3 text-sm text-white/40 hover:text-white/60 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  // Default: banner variant
  return (
    <div className="bg-gradient-to-r from-[#D4A017]/10 via-[#D4A017]/5 to-transparent border border-[#D4A017]/20 rounded-xl px-4 py-3 flex items-center gap-3">
      <Sparkles className="w-5 h-5 text-[#D4A017] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{feature}</p>
        <p className="text-xs text-white/50 truncate">{description}</p>
      </div>
      <Link
        href="/dashboard/billing"
        onClick={handleUpgradeClick}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] hover:bg-[#B8860B] text-black text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
      >
        Upgrade to {requiredTier}
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
      {onDismiss && (
        <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 ml-1" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
