'use client';

import { useState, useEffect, useCallback } from 'react';

// Scene definitions
const SCENES = [
  {
    id: 'upload',
    title: 'Drop Your Photos',
    subtitle: '25 photos uploaded in seconds',
    badge: 'Step 1',
    badgeColor: 'bg-white/10 text-white/70',
  },
  {
    id: 'enhance',
    title: 'AI Does the Heavy Lifting',
    subtitle: '15 AI tools enhance every photo automatically',
    badge: 'Step 2',
    badgeColor: 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30',
  },
  {
    id: 'marketing',
    title: 'Marketing Writes Itself',
    subtitle: 'Descriptions, social posts, MLS copy — all generated',
    badge: 'Step 3',
    badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  },
  {
    id: 'publish',
    title: 'One-Click Distribution',
    subtitle: 'Schedule & auto-publish to all platforms',
    badge: 'Step 4',
    badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
  {
    id: 'results',
    title: 'Watch Leads Roll In',
    subtitle: 'Track views, engagement, and leads in real-time',
    badge: 'Complete',
    badgeColor: 'bg-green-500/20 text-green-400 border border-green-500/30',
  },
];

const SCENE_DURATION = 4000; // 4 seconds per scene

const AI_TOOLS = [
  'Sky Replacement', 'HDR Enhancement', 'Virtual Twilight',
  'Declutter', 'Virtual Staging', 'Lawn Repair',
  'Color Balance', 'Perspective Fix', 'Lens Correction',
];

const PLATFORMS = [
  { name: 'Facebook', icon: 'f', color: 'bg-blue-600' },
  { name: 'Instagram', icon: 'ig', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { name: 'LinkedIn', icon: 'in', color: 'bg-blue-700' },
  { name: 'MLS', icon: 'M', color: 'bg-emerald-600' },
];

export function ProductExplainer() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Scene-specific state
  const [uploadCount, setUploadCount] = useState(0);
  const [aiToolIndex, setAiToolIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [typedText, setTypedText] = useState('');
  const [platformsChecked, setPlatformsChecked] = useState(0);
  const [statsValues, setStatsValues] = useState({ views: 0, leads: 0, engagement: 0 });

  const scene = SCENES[sceneIndex];
  const mlsDescription = 'Stunning 4-bedroom home featuring panoramic views, designer kitchen with quartz countertops, and a resort-style pool...';

  // Reset scene-specific state
  const resetSceneState = useCallback(() => {
    setUploadCount(0);
    setAiToolIndex(0);
    setSliderPos(50);
    setTypedText('');
    setPlatformsChecked(0);
    setStatsValues({ views: 0, leads: 0, engagement: 0 });
  }, []);

  // Auto-advance scenes
  useEffect(() => {
    setFadeIn(true);
    setProgress(0);
    resetSceneState();

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + (100 / (SCENE_DURATION / 50));
      });
    }, 50);

    const sceneTimer = setTimeout(() => {
      setFadeIn(false);
      setTimeout(() => {
        setSceneIndex((prev) => (prev + 1) % SCENES.length);
      }, 300);
    }, SCENE_DURATION);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(sceneTimer);
    };
  }, [sceneIndex, resetSceneState]);

  // Scene 1: Upload animation
  useEffect(() => {
    if (scene.id !== 'upload') return;
    const timer = setInterval(() => {
      setUploadCount((prev) => (prev >= 25 ? 25 : prev + 1));
    }, 120);
    return () => clearInterval(timer);
  }, [scene.id]);

  // Scene 2: AI enhancement animation
  useEffect(() => {
    if (scene.id !== 'enhance') return;
    const toolTimer = setInterval(() => {
      setAiToolIndex((prev) => (prev + 1) % AI_TOOLS.length);
    }, 400);
    // Slider animation
    const sliderAnim = setTimeout(() => {
      setSliderPos(20);
      setTimeout(() => setSliderPos(80), 1200);
      setTimeout(() => setSliderPos(50), 2400);
    }, 300);
    return () => {
      clearInterval(toolTimer);
      clearTimeout(sliderAnim);
    };
  }, [scene.id]);

  // Scene 3: Typing animation
  useEffect(() => {
    if (scene.id !== 'marketing') return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedText(mlsDescription.slice(0, i));
      if (i >= mlsDescription.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [scene.id]);

  // Scene 4: Platform check animation
  useEffect(() => {
    if (scene.id !== 'publish') return;
    const timer = setInterval(() => {
      setPlatformsChecked((prev) => (prev >= PLATFORMS.length ? PLATFORMS.length : prev + 1));
    }, 600);
    return () => clearInterval(timer);
  }, [scene.id]);

  // Scene 5: Stats counter animation
  useEffect(() => {
    if (scene.id !== 'results') return;
    const timer = setInterval(() => {
      setStatsValues((prev) => ({
        views: Math.min(prev.views + 47, 2847),
        leads: Math.min(prev.leads + 1, 38),
        engagement: Math.min(prev.engagement + 0.3, 12.4),
      }));
    }, 60);
    return () => clearInterval(timer);
  }, [scene.id]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Container */}
      <div
        className="relative rounded-2xl md:rounded-3xl overflow-hidden border-2 border-[#D4A017]/40 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] shadow-2xl shadow-[#D4A017]/10"
        style={{ aspectRatio: '16/9', minHeight: '380px' }}
      >
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none">
          <div className="absolute inset-[-2px] rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#D4A017]/0 via-[#D4A017]/20 to-[#D4A017]/0 animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full p-4 md:p-8 flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${scene.badgeColor}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>{scene.badge}</span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className={`flex-1 flex items-center justify-center transition-all duration-300 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* SCENE 1: Upload */}
            {scene.id === 'upload' && (
              <div className="w-full grid md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left">
                  <h3 className="text-xl md:text-3xl font-bold text-white mb-2">{scene.title}</h3>
                  <p className="text-white/50 text-sm md:text-base mb-4">{scene.subtitle}</p>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <div className="w-12 h-12 rounded-xl border-2 border-dashed border-[#D4A017]/50 flex items-center justify-center bg-[#D4A017]/5 animate-explainer-bounce">
                      <svg className="w-6 h-6 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#D4A017]">{uploadCount}</p>
                      <p className="text-white/40 text-xs">of 25 photos</p>
                    </div>
                  </div>
                </div>
                {/* Thumbnail grid */}
                <div className="hidden md:grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg transition-all duration-200 ${
                        i < uploadCount
                          ? 'bg-gradient-to-br from-[#D4A017]/30 to-[#D4A017]/10 border border-[#D4A017]/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      {i < uploadCount && (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-[#D4A017]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {uploadCount > 15 && (
                    <div className="aspect-square rounded-lg bg-[#D4A017]/20 border border-[#D4A017]/30 flex items-center justify-center text-[#D4A017] text-xs font-bold">
                      +{uploadCount - 15}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCENE 2: AI Enhancement */}
            {scene.id === 'enhance' && (
              <div className="w-full grid md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left">
                  <h3 className="text-xl md:text-3xl font-bold text-white mb-2">{scene.title}</h3>
                  <p className="text-white/50 text-sm md:text-base mb-4">{scene.subtitle}</p>
                  {/* Current AI tool */}
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-lg mb-3">
                    <div className="w-5 h-5 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[#D4A017] font-medium">{AI_TOOLS[aiToolIndex]}</span>
                  </div>
                  {/* Tool dots */}
                  <div className="flex gap-1 flex-wrap justify-center md:justify-start">
                    {AI_TOOLS.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          i <= aiToolIndex ? 'bg-[#D4A017]' : 'bg-white/20'
                        } ${i === aiToolIndex ? 'scale-150' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                {/* Before/After slider */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#D4A017]/40">
                  {/* Before */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-500/60 to-gray-700/60">
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
                      Dull Sky &bull; Low Contrast
                    </div>
                  </div>
                  {/* After */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-sky-400/30 via-amber-500/20 to-orange-400/30 transition-all duration-700"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-[#D4A017] text-sm font-semibold">
                      Enhanced
                    </div>
                  </div>
                  {/* Slider handle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-700"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white/70">Before</div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#D4A017] rounded text-[10px] text-black font-semibold">After</div>
                </div>
              </div>
            )}

            {/* SCENE 3: Marketing */}
            {scene.id === 'marketing' && (
              <div className="w-full grid md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left">
                  <h3 className="text-xl md:text-3xl font-bold text-white mb-2">{scene.title}</h3>
                  <p className="text-white/50 text-sm md:text-base mb-4">{scene.subtitle}</p>
                  {/* Generated content tags */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {['MLS Description', 'Social Captions', 'Property Site', 'Email Campaign'].map((item, i) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 rounded-full text-xs text-purple-300 font-medium animate-explainer-fadeIn"
                        style={{ animationDelay: `${i * 200}ms` }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Typing animation */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-white/40 text-xs font-semibold tracking-wider">MLS DESCRIPTION</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed font-serif min-h-[60px]">
                    {typedText}
                    <span className="inline-block w-0.5 h-4 bg-[#D4A017] animate-pulse ml-0.5 align-middle" />
                  </p>
                  {typedText.length > 80 && (
                    <div className="flex gap-2 mt-3">
                      <span className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] rounded text-[10px] font-bold">4 Bed</span>
                      <span className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] rounded text-[10px] font-bold">3 Bath</span>
                      <span className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] rounded text-[10px] font-bold">Pool</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCENE 4: Publish */}
            {scene.id === 'publish' && (
              <div className="w-full grid md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left">
                  <h3 className="text-xl md:text-3xl font-bold text-white mb-2">{scene.title}</h3>
                  <p className="text-white/50 text-sm md:text-base mb-4">{scene.subtitle}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold text-sm shadow-lg shadow-[#D4A017]/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Publish All
                  </div>
                </div>
                {/* Platform cards */}
                <div className="grid grid-cols-2 gap-3">
                  {PLATFORMS.map((platform, i) => (
                    <div
                      key={platform.name}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                        i < platformsChecked
                          ? 'bg-white/5 border-green-500/30'
                          : 'bg-white/[0.02] border-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {platform.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{platform.name}</p>
                        <p className="text-[10px] text-white/40">
                          {i < platformsChecked ? 'Scheduled' : 'Pending'}
                        </p>
                      </div>
                      {i < platformsChecked && (
                        <svg className="w-5 h-5 text-green-400 animate-explainer-scaleIn" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCENE 5: Results */}
            {scene.id === 'results' && (
              <div className="w-full grid md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left">
                  <h3 className="text-xl md:text-3xl font-bold text-white mb-2">{scene.title}</h3>
                  <p className="text-white/50 text-sm md:text-base mb-4">{scene.subtitle}</p>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-sm font-medium">Live analytics dashboard</span>
                  </div>
                </div>
                {/* Stats dashboard mockup */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl md:text-3xl font-bold text-white">
                      {statsValues.views.toLocaleString()}
                    </p>
                    <p className="text-white/40 text-xs mt-1">Views</p>
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4A017] rounded-full transition-all duration-100"
                        style={{ width: `${Math.min((statsValues.views / 2847) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl md:text-3xl font-bold text-green-400">
                      {statsValues.leads}
                    </p>
                    <p className="text-white/40 text-xs mt-1">Leads</p>
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all duration-100"
                        style={{ width: `${Math.min((statsValues.leads / 38) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl md:text-3xl font-bold text-blue-400">
                      {statsValues.engagement.toFixed(1)}%
                    </p>
                    <p className="text-white/40 text-xs mt-1">Engagement</p>
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-100"
                        style={{ width: `${Math.min((statsValues.engagement / 12.4) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom: Scene progress + dots */}
          <div className="mt-4">
            {/* Progress bar */}
            <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Scene dots */}
            <div className="flex items-center justify-center gap-2">
              {SCENES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSceneIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === sceneIndex
                      ? 'bg-[#D4A017] scale-150'
                      : i < sceneIndex
                      ? 'bg-[#D4A017]/50'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="flex justify-center mt-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#1A1A1A]/80 border border-white/10 rounded-full">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
            <span className="text-white/50 text-xs">Interactive Demo</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <span className="text-white/70 text-xs">From photos to published listing in under 10 minutes</span>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes explainer-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes explainer-scaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes explainer-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-explainer-fadeIn {
          animation: explainer-fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
        .animate-explainer-scaleIn {
          animation: explainer-scaleIn 0.3s ease-out forwards;
        }
        .animate-explainer-bounce {
          animation: explainer-bounce 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default ProductExplainer;
