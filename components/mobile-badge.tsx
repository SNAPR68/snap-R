
'use client';

import { Smartphone } from 'lucide-react';



export function MobileBadge() {

  const scrollToSection = () => {

    document.getElementById('mobile-section')?.scrollIntoView({ behavior: 'smooth' });

  };



  return (

    <button 

      onClick={scrollToSection}

      className="group relative"

    >

      {/* Apple-style badge */}

      <div className="flex items-center gap-3 px-5 py-2.5 bg-black border border-white/20 rounded-xl hover:bg-white/5 transition-colors">

        <Smartphone className="w-8 h-8 text-white" />

        <div className="text-left">

          <div className="text-[10px] text-white/70 uppercase tracking-wide">Open on</div>

          <div className="text-white font-semibold text-lg -mt-0.5">Mobile Web</div>

        </div>

      </div>

    </button>

  );

}

