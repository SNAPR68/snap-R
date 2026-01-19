'use client';

import { useState, useRef, useEffect } from 'react';

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
  const [width, setWidth] = useState(400);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[2/1] rounded-xl overflow-hidden cursor-ew-resize select-none bg-neutral-800"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseLeave={() => setPosition(50)}
    >
      <img
        src={item.after}
        alt={`${item.title} after`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      <div className="absolute top-0 left-0 h-full overflow-hidden" style={{ width: `${position}%` }}>
        <img
          src={item.before}
          alt={`${item.title} before`}
          className="absolute top-0 left-0 h-full object-cover"
          style={{ width: `${width}px` }}
          draggable={false}
        />
      </div>

      <div className="absolute top-0 h-full w-0.5 bg-white pointer-events-none" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </div>
      </div>

      <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">Before</div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-[#D4A017] rounded text-xs text-black font-semibold">After</div>
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