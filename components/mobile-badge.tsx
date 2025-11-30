'use client';

import { Smartphone, ChevronDown, Sparkles } from 'lucide-react';

export function MobileBadge() {
  const scrollToSection = () => {
    document.getElementById('mobile-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button 
      onClick={scrollToSection}
      className="group relative animate-float"
    >
      <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-xl animate-pulse-glow"></div>
      
      <div className="relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/50 rounded-2xl backdrop-blur-sm">
        <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
        
        <div className="relative">
          <Smartphone className="w-6 h-6 text-emerald-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
        </div>
        
        <div className="text-left">
          <div className="text-emerald-400 font-semibold text-sm">Mobile Ready</div>
          <div className="text-emerald-400/70 text-xs">Snap & Enhance on the go</div>
        </div>
        
        <ChevronDown className="w-5 h-5 text-emerald-400 animate-bounce" />
      </div>
    </button>
  );
}
