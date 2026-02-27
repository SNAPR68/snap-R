'use client';

import { useState, useRef, useCallback } from 'react';

const GALLERY_ITEMS = [
  {
    id: 'sky-replacement',
    title: 'Sky Replacement',
    description: 'Transform overcast skies into perfect blue',
    before: '/gallery/sky-before.jpg',
    after: '/gallery/sky-after.jpg',
  },
  {
    id: 'virtual-twilight',
    title: 'Virtual Twilight',
    description: 'Day to dusk conversion with glowing windows',
    before: '/gallery/twilight-before.jpg',
    after: '/gallery/twilight-after.jpg',
  },
  {
    id: 'lawn-repair',
    title: 'Lawn Enhancement',
    description: 'Brown grass to lush green perfection',
    before: '/gallery/lawn-before.jpg',
    after: '/gallery/lawn-after.jpg',
  },
  {
    id: 'declutter',
    title: 'AI Declutter',
    description: 'Remove unwanted items instantly',
    before: '/gallery/declutter-before.jpg',
    after: '/gallery/declutter-after.jpg',
  },
  {
    id: 'virtual-staging',
    title: 'Virtual Staging',
    description: 'Furnish empty rooms with AI',
    before: '/gallery/staging-before.jpg',
    after: '/gallery/staging-after.jpg',
  },
  {
    id: 'hdr',
    title: 'HDR Enhancement',
    description: 'Perfect exposure and vibrant colors',
    before: '/gallery/hdr-before.jpg',
    after: '/gallery/hdr-after.jpg',
  },
];

function HoverSlider({ item }: { item: typeof GALLERY_ITEMS[0] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    setPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    updatePosition(e.touches[0].clientX);
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[2/1] rounded-xl overflow-hidden cursor-ew-resize select-none bg-neutral-800"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* AFTER — full size, always visible underneath */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.after}
        alt={`${item.title} after`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* BEFORE — clipped by a div that narrows from the right as slider moves */}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.before}
          alt={`${item.title} before`}
          className="absolute inset-0 h-full object-cover"
          style={{ width: containerRef.current?.offsetWidth ?? 800 }}
          draggable={false}
        />
      </div>

      {/* Divider line + handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-[#D4A017]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round">
            <path d="M8 6l-4 6 4 6" />
            <path d="M16 6l4 6-4 6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium pointer-events-none z-10">Before</div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-[#D4A017] rounded text-xs text-black font-semibold pointer-events-none z-10">After</div>
    </div>
  );
}

export function LandingGallery() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {GALLERY_ITEMS.map((item) => (
        <div key={item.id}>
          <HoverSlider item={item} />
          <div className="mt-1">
            <h3 className="text-white font-semibold text-sm">{item.title}</h3>
            <p className="text-white/50 text-xs">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
