'use client';

import { useState, useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  toolsApplied?: string[];
  className?: string;
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  toolsApplied = [],
  className = '',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // Hover to move slider
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const formatToolName = (tool: string) => {
    const names: Record<string, string> = {
      'sky-replacement': 'Sky Replacement',
      'virtual-twilight': 'Virtual Twilight',
      'lawn-repair': 'Lawn Repair',
      'pool-enhance': 'Pool Enhancement',
      'hdr': 'HDR',
      'auto-enhance': 'Auto Enhance',
      'declutter': 'Declutter',
      'virtual-staging': 'Virtual Staging',
      'fire-fireplace': 'Fireplace Glow',
      'tv-screen': 'TV Screen',
      'lights-on': 'Lights On',
      'window-masking': 'Window Balance',
      'perspective-correction': 'Perspective Fix',
    };
    return names[tool] || tool.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-xl cursor-ew-resize select-none bg-black"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* After Image - Full background */}
        <img
          src={afterUrl}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
        <span className="absolute top-3 right-3 px-3 py-1.5 bg-[#D4A017] text-black text-xs font-bold rounded-md shadow-lg z-20">
          {afterLabel} • Enhanced
        </span>

        {/* Before Image - Clipped overlay (same size, clipped by container width) */}
        <div
          className="absolute top-0 left-0 bottom-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeUrl}
            alt={beforeLabel}
            className="absolute top-0 left-0 h-full object-contain"
            style={{ 
              width: containerRef.current?.offsetWidth || '100vw',
              maxWidth: 'none'
            }}
            draggable={false}
          />
          <span className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 text-black text-xs font-bold rounded-md shadow-lg z-20">
            {beforeLabel} • Original
          </span>
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-white z-10 pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-[3px] border-[#D4A017]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 6l-4 6 4 6"/>
              <path d="M16 6l4 6-4 6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Tools Applied */}
      {toolsApplied.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 flex-shrink-0">
          {toolsApplied.map((tool) => (
            <span key={tool} className="px-2 py-1 bg-[#D4A017]/20 text-[#D4A017] text-xs font-medium rounded-md">
              {formatToolName(tool)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
