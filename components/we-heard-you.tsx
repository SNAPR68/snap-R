'use client';

import { useState, useEffect, useCallback } from 'react';

const VOICES = [
  {
    quote: 'I became an agent to sell homes and build relationships — not to spend my evenings editing photos, writing descriptions, designing social posts, building property websites, and trying to figure out which of my 7 subscriptions is worth keeping.',
    source: 'Real Estate Agent',
    platform: 'Reddit',
    platformClass: 'bg-orange-500/15 text-orange-400',
    category: 'Time Crisis',
  },
  {
    quote: 'Real estate agents and brokers are juggling compliance requirements, client expectations, and razor-thin timelines, and a bloated tech stack isn\'t just inconvenient — it\'s costing business.',
    source: 'RISMedia',
    platform: 'Industry',
    platformClass: 'bg-blue-500/15 text-blue-400',
    category: 'Tool Overload',
  },
  {
    quote: 'If it\'s taking you 3 hours to shoot a home and 3 or 4 hours to edit, then you can only do 1 or 2 jobs a day.',
    source: 'Build A Photography Business',
    platform: 'Industry',
    platformClass: 'bg-purple-500/15 text-purple-400',
    category: 'Editing Backlog',
  },
  {
    quote: 'Clients expect 2015 prices with 2025 deliverables, turnaround times, and production values.',
    source: 'Fstoppers',
    platform: 'Industry Blog',
    platformClass: 'bg-green-500/15 text-green-400',
    category: 'Cost Crisis',
  },
  {
    quote: 'Every hour I spend on marketing is an hour I\'m not spending with clients. And I still can\'t do it as well as someone who does it full-time.',
    source: 'Real Estate Agent',
    platform: 'Forum',
    platformClass: 'bg-yellow-500/15 text-yellow-400',
    category: 'Marketing Burnout',
  },
  {
    quote: 'Only 35% of agents use professional photographers — yet properties with professional photos sell 50% faster and get 118% more online views.',
    source: 'NAR Research',
    platform: 'Survey',
    platformClass: 'bg-[#D4A017]/15 text-[#D4A017]',
    category: 'Photography Gap',
  },
  {
    quote: 'The job of a Realtor IS MARKETING. People think you just take a listing and put it on the MLS. NO no no no no.',
    source: 'r/RealEstateTechnology',
    platform: 'Reddit',
    platformClass: 'bg-orange-500/15 text-orange-400',
    category: 'Marketing Reality',
  },
  {
    quote: 'Almost all photographers have experienced folders of unedited shoots piling up in Lightroom, creating a mountain of work.',
    source: 'Fstoppers',
    platform: 'Industry Blog',
    platformClass: 'bg-green-500/15 text-green-400',
    category: 'Editing Backlog',
  },
  {
    quote: 'Listings with video receive 403% more inquiries compared to those without.',
    source: 'Digital Agency Network',
    platform: 'Survey',
    platformClass: 'bg-[#D4A017]/15 text-[#D4A017]',
    category: 'Video Gap',
  },
  {
    quote: 'Creating consistent, high-quality video content every week is exhausting, involving filming, editing, retakes, lighting, and scheduling.',
    source: 'Placester',
    platform: 'Industry',
    platformClass: 'bg-blue-500/15 text-blue-400',
    category: 'Content Fatigue',
  },
  {
    quote: '73% of homeowners prefer agents who use video marketing — yet only 63% of agents use video at all, and just 26% use YouTube.',
    source: 'NAR Research',
    platform: 'Survey',
    platformClass: 'bg-[#D4A017]/15 text-[#D4A017]',
    category: 'Video Gap',
  },
  {
    quote: 'Writing the best MLS property descriptions is not your favorite part of being a REALTOR — and you\'re not alone.',
    source: 'The Nest Press',
    platform: 'Blog',
    platformClass: 'bg-purple-500/15 text-purple-400',
    category: 'Listing Descriptions',
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  'Time Crisis': '\u23F1',
  'Tool Overload': '\u2699',
  'Editing Backlog': '\uD83D\uDCF7',
  'Cost Crisis': '\uD83D\uDCB8',
  'Marketing Burnout': '\uD83D\uDD25',
  'Photography Gap': '\uD83D\uDCC9',
  'Marketing Reality': '\uD83D\uDCE2',
  'Video Gap': '\uD83C\uDFA5',
  'Content Fatigue': '\uD83D\uDE29',
  'Listing Descriptions': '\u270D',
};

export function WeHeardYou() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % VOICES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + VOICES.length) % VOICES.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [isHovered, next]);

  const voice = VOICES[current];

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
            From Reddit threads to industry surveys — photographers and agents have been screaming about the same problems for years.
          </p>
        </div>

        {/* Quote Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main quote card */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#111111] shadow-2xl">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#1A1A1A] border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORY_ICONS[voice.category] ?? '\uD83D\uDCAC'}</span>
                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  {voice.category}
                </span>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${voice.platformClass}`}>
                {voice.platform}
              </span>
            </div>

            {/* Quote body */}
            <div className="px-8 py-10 md:px-12 md:py-12 min-h-[200px] flex items-center">
              <div>
                <svg className="w-8 h-8 text-[#D4A017]/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
                </svg>
                <p className="text-white text-lg md:text-xl leading-relaxed font-light">
                  {voice.quote}
                </p>
              </div>
            </div>

            {/* Source bar */}
            <div className="px-5 py-3 flex items-center justify-between bg-[#0D0D0D] border-t border-white/10">
              <p className="text-white/40 text-sm">
                — {voice.source}
              </p>
              <span className="text-white/25 text-xs shrink-0 ml-4">
                {current + 1} / {VOICES.length}
              </span>
            </div>
          </div>

          {/* Nav arrows */}
          <button
            onClick={prev}
            aria-label="Previous quote"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-[#D4A017]/50 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next quote"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-[#D4A017]/50 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {VOICES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to quote ${i + 1}`}
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
