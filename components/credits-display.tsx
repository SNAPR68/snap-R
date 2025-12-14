'use client';

import { Coins, AlertTriangle } from 'lucide-react';

interface CreditsDisplayProps {
  credits: number;
  requiredCredits?: number;
  showWarning?: boolean;
}

export function CreditsDisplay({ credits, requiredCredits = 0, showWarning = true }: CreditsDisplayProps) {
  const isLow = credits <= 5;
  const isInsufficient = requiredCredits > 0 && credits < requiredCredits;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      isInsufficient ? 'bg-red-500/20 border border-red-500/30' :
      isLow ? 'bg-yellow-500/20 border border-yellow-500/30' :
      'bg-white/5 border border-white/10'
    }`}>
      {isInsufficient || (isLow && showWarning) ? (
        <AlertTriangle className={`w-4 h-4 ${isInsufficient ? 'text-red-400' : 'text-yellow-400'}`} />
      ) : (
        <Coins className="w-4 h-4 text-[#D4A017]" />
      )}
      <span className={`text-sm font-medium ${
        isInsufficient ? 'text-red-400' :
        isLow ? 'text-yellow-400' :
        'text-white'
      }`}>
        {credits} credits
      </span>
      {isInsufficient && (
        <span className="text-xs text-red-400/60">(need {requiredCredits})</span>
      )}
    </div>
  );
}
