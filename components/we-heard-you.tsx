'use client';

import { useState, useEffect, useCallback } from 'react';

const SCREENSHOTS = [
  {
    src: '/agent-voices/fstoppers-quotes.png',
    source: 'Fstoppers Community',
    platform: 'Forum',
    platformClass: 'bg-purple-500/15 text-purple-400',
    caption: 'Photographers frustrated with editing turnaround times',
  },
  {
    src: '/agent-voices/fstoppers-header.png',
    source: 'Fstoppers',
    platform: 'Industry Blog',
    platformClass: 'bg-orange-500/15 text-orange-400',
    caption: 'The real cost of real estate photo editing',
  },
  {
    src: '/agent-voices/photography-business.png',
    source: 'Photography Business Forum',
    platform: 'Forum',
    platformClass: 'bg-blue-500/15 text-blue-400',
    caption: 'Agents demanding faster turnaround & more content',
  },
  {
    src: '/agent-voices/propphy-costs.png',
    source: 'Propphy / Industry Data',
    platform: 'Industry',
    platformClass: 'bg-green-500/15 text-green-400',
    caption: 'The hidden costs eating into photographer margins',
  },
  {
    src: '/agent-voices/dan-header.png',
    source: 'Digital Agency Network',
    platform: 'Industry',
    platformClass: 'bg-green-500/15 text-green-400',
    caption: 'Agencies demand better real estate marketing tools',
  },
  {
    src: '/agent-voices/dan-video-stats.png',
    source: 'Digital Agency Network',
    platform: 'Industry',
    platformClass: 'bg-green-500/15 text-green-400',
    caption: 'Video content demand skyrocketing — no tools to meet it',
  },
  {
    src: '/agent-voices/rismedia-header.png',
    source: 'RISMedia',
    platform: 'Industry Press',
    platformClass: 'bg-yellow-500/15 text-yellow-400',
    caption: 'Agents overwhelmed by listing marketing workload',
  },
  {
    src: '/agent-voices/matterport-header.png',
    source: 'Matterport Research',
    platform: 'Survey',
    platformClass: 'bg-[#D4A017]/15 text-[#D4A017]',
    caption: 'Buyers expect rich media — agents can\'t keep up',
  },
  {
    src: '/agent-voices/matterport-stats.png',
    source: 'Matterport Research',
    platform: 'Survey',
    platformClass: 'bg-[#D4A017]/15 text-[#D4A017]',
    caption: 'Data showing the gap between buyer expectations and reality',
  },
];

export function WeHeardYou() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SCREENSHOTS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [isHovered, next]);

  const slide = SCREENSHOTS[current];

  return (
    <section className="py-16 px-6 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[#D4A017] text-xs font-semibold tracking-widest uppercase mb-2">
            The Industry Problem
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            We Heard You.{' '}
            <span className="text-[#D4A017]">That&apos;s Why We Built SnapR.</span>
          </h2>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            From Reddit threads to industry forums — photographers and agents have been screaming about the same problems for years.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main screenshot card */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#111111] shadow-2xl">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A1A1A] border-b border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <div className="flex-1 mx-3 h-5 rounded bg-white/5 flex items-center px-3">
                <span className="text-white/30 text-xs">Real feedback from photographers &amp; agents</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${slide.platformClass}`}>
                {slide.platform}
              </span>
            </div>

            {/* Screenshot — full image visible, natural height */}
            <div className="w-full bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current}
                src={slide.src}
                alt={slide.caption}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            {/* Caption bar */}
            <div className="px-4 py-3 flex items-center justify-between bg-[#111111] border-t border-white/10">
              <div>
                <p className="text-white text-sm font-semibold leading-snug">{slide.caption}</p>
                <p className="text-white/40 text-xs mt-0.5">Source: {slide.source}</p>
              </div>
              <span className="text-white/30 text-xs shrink-0 ml-4">{current + 1} / {SCREENSHOTS.length}</span>
            </div>
          </div>

          {/* Nav arrows */}
          <button
            onClick={prev}
            aria-label="Previous screenshot"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-[#D4A017]/50 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next screenshot"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-[#D4A017]/50 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {SCREENSHOTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to screenshot ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-5 bg-[#D4A017]'
                    : 'w-1 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <div className="text-2xl font-bold text-[#D4A017] mb-0.5">24–48h</div>
            <div className="text-white/50 text-xs">Avg. editing turnaround agents wait</div>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <div className="text-2xl font-bold text-[#D4A017] mb-0.5">5+ tools</div>
            <div className="text-white/50 text-xs">Juggled per listing just to market it</div>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <div className="text-2xl font-bold text-[#D4A017] mb-0.5">$400+/mo</div>
            <div className="text-white/50 text-xs">Spent on editing, Canva & scheduling</div>
          </div>
        </div>
      </div>
    </section>
  );
}
