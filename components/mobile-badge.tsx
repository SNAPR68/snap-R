'use client';

import { Smartphone, ChevronDown } from 'lucide-react';

export function MobileBadge() {
  const scrollToMobile = () => {
    const section = document.getElementById('mobile-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
        Industry First
      </span>
      
      <p className="text-white/70 text-sm md:text-base text-center max-w-md">
        World's first real estate photo app that works on mobile
      </p>
      
      <button
        onClick={scrollToMobile}
        className="group relative mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/20 transition-all duration-300 cursor-pointer"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <div className="absolute inset-0 animate-ping">
            <Smartphone className="w-5 h-5 text-emerald-400 opacity-40" />
          </div>
        </div>
        
        <span className="relative text-emerald-400 font-semibold text-sm">
          See How It Works
        </span>
        
        <ChevronDown className="relative w-4 h-4 text-emerald-400 animate-bounce" />
      </button>
    </div>
  );
}
