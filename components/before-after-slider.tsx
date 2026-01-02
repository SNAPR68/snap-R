'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

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
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeImgRef = useRef<HTMLImageElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove]);

  // Update before image width when container resizes
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current && beforeImgRef.current) {
        beforeImgRef.current.style.width = `${containerRef.current.offsetWidth}px`;
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [imageLoaded]);

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
    <div className={`flex flex-col ${className}`}>
      {/* Slider */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] overflow-hidden rounded-xl cursor-ew-resize select-none bg-black/20"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* After Image (Background - Enhanced) */}
        <div className="absolute inset-0">
          <img
            src={afterUrl}
            alt={afterLabel}
            className="w-full h-full object-contain bg-black"
            draggable={false}
            onLoad={() => setImageLoaded(true)}
          />
          <span className="absolute top-3 right-3 px-3 py-1.5 bg-[#D4A017] text-black text-xs font-bold rounded-md shadow-lg">
            {afterLabel} • Enhanced
          </span>
        </div>

        {/* Before Image (Clipped - Original) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            ref={beforeImgRef}
            src={beforeUrl}
            alt={beforeLabel}
            className="h-full object-contain bg-black"
            draggable={false}
          />
          <span className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 text-black text-xs font-bold rounded-md shadow-lg">
            {beforeLabel} • Original
          </span>
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-[3px] border-[#D4A017]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 6l-4 6 4 6"/>
              <path d="M16 6l4 6-4 6"/>
            </svg>
          </div>
        </div>

        {/* Drag hint (only at 50%) */}
        {!isDragging && sliderPosition === 50 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm animate-pulse">
            ← Drag to compare →
          </div>
        )}
      </div>

      {/* Tools Applied */}
      {toolsApplied.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {toolsApplied.map((tool) => (
            <span
              key={tool}
              className="px-2 py-1 bg-[#D4A017]/20 text-[#D4A017] text-xs font-medium rounded-md"
            >
              {formatToolName(tool)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
