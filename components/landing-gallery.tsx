'use client';

import { useState, useRef } from 'react';

const GALLERY_ITEMS = [
  {
    id: 'sky-replacement',
    title: 'Sky Replacement',
    description: 'Transform overcast skies into perfect blue',
    before: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    after: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  },
  {
    id: 'virtual-twilight',
    title: 'Virtual Twilight',
    description: 'Day to dusk conversion with glowing windows',
    before: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    after: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  },
  {
    id: 'lawn-repair',
    title: 'Lawn Enhancement',
    description: 'Brown grass to lush green perfection',
    before: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    after: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80',
  },
  {
    id: 'declutter',
    title: 'AI Declutter',
    description: 'Remove unwanted items instantly',
    before: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    after: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
  },
  {
    id: 'virtual-staging',
    title: 'Virtual Staging',
    description: 'Furnish empty rooms with AI',
    before: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    after: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
  },
  {
    id: 'hdr',
    title: 'HDR Enhancement',
    description: 'Perfect exposure and vibrant colors',
    before: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
    after: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
  },
];

function HoverSlider({ before, after, title }: { before: string; after: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-ew-resize group"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setSliderPosition(50);
      }}
    >
      <img src={before} alt={`${title} before`} className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
        <img
          src={after}
          alt={`${title} after`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${containerRef.current?.offsetWidth || 400}px`, maxWidth: 'none' }}
          draggable={false}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-opacity duration-200"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="text-gray-700 text-sm font-bold">↔</span>
        </div>
      </div>

      <div
        className={`absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium transition-opacity ${
          isHovering ? 'opacity-100' : 'opacity-70'
        }`}
      >
        Before
      </div>
      <div
        className={`absolute top-3 right-3 px-2 py-1 bg-[#D4A017] rounded text-xs text-black font-medium transition-opacity ${
          isHovering ? 'opacity-100' : 'opacity-70'
        }`}
      >
        After
      </div>
    </div>
  );
}

export function LandingGallery() {
  return (
    <section id="gallery" className="py-24 px-6 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            See the <span className="text-[#D4A017]">Transformation</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Hover over each image to see the before and after. Our AI delivers professional results in seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_ITEMS.map((item) => (
            <div key={item.id} className="group">
              <HoverSlider before={item.before} after={item.after} title={item.title} />
              <div className="mt-3">
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl font-semibold text-black hover:opacity-90 transition-opacity"
          >
            Try It Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

