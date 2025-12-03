'use client';
import { Smartphone, ChevronDown } from 'lucide-react';

export function MobileBadge() {
  const scrollToSection = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const section = document.getElementById('mobile-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={scrollToSection}
      onTouchStart={scrollToSection}
      onKeyDown={(e) => e.key === 'Enter' && scrollToSection(e as any)}
      className="relative z-50 cursor-pointer select-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Glowing background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#D4A017]/20 to-[#B8860B]/20 rounded-2xl blur-xl animate-pulse" />
      
      {/* Main badge */}
      <div className="relative flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-[#1A1A1A] to-[#0D0D0D] border border-[#D4A017]/50 rounded-2xl hover:border-[#D4A017] transition-all duration-300 group hover:shadow-lg hover:shadow-[#D4A017]/20">
        {/* Phone icon with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#D4A017]/30 rounded-full blur-md group-hover:bg-[#D4A017]/50 transition-all" />
          <div className="relative w-12 h-12 bg-gradient-to-br from-[#D4A017] to-[#B8860B] rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-black" />
          </div>
        </div>
        
        {/* Text */}
        <div className="text-left">
          <div className="text-xs text-[#D4A017] font-medium tracking-wider uppercase">Works on</div>
          <div className="text-white font-bold text-lg">Mobile & Desktop</div>
        </div>
        
        {/* Arrow indicator */}
        <ChevronDown className="w-5 h-5 text-[#D4A017] animate-bounce ml-2" />
      </div>
    </div>
  );
}
