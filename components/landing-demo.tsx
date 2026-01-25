'use client';

import { useState, useEffect, useCallback } from 'react';

const AI_STEPS = [
  { label: 'Analyzing photos...', icon: '🔍' },
  { label: 'Detecting room types...', icon: '🏠' },
  { label: 'Identifying deficiencies...', icon: '⚡' },
  { label: 'Replacing dull skies...', icon: '☁️' },
  { label: 'Applying HDR enhancement...', icon: '✨' },
  { label: 'Creating twilight hero...', icon: '🌅' },
  { label: 'Writing MLS description...', icon: '📝' },
  { label: 'Generating social posts...', icon: '📱' },
  { label: 'Building property video...', icon: '🎬' },
  { label: 'Finalizing listing...', icon: '✅' },
];

const CONTENT_OUTPUTS = [
  { type: 'Enhanced Photos', count: 25, icon: '📸' },
  { type: 'Social Posts', count: 12, icon: '📱' },
  { type: 'Property Video', count: 1, icon: '🎬' },
  { type: 'Email Campaign', count: 4, icon: '✉️' },
  { type: 'Property Website', count: 1, icon: '🌐' },
  { type: 'MLS Description', count: 1, icon: '📝' },
];

type Phase = 'upload' | 'processing' | 'complete';

export function LandingDemo() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [aiStepIndex, setAiStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [seconds, setSeconds] = useState(0);
  const [contentRevealed, setContentRevealed] = useState(0);

  const runDemo = useCallback(() => {
    // Reset everything
    setPhase('upload');
    setUploadProgress(0);
    setUploadedCount(0);
    setAiStepIndex(0);
    setOverallProgress(0);
    setSliderPos(50);
    setSeconds(0);
    setContentRevealed(0);
  }, []);

  // Phase 1: Upload
  useEffect(() => {
    if (phase !== 'upload') return;

    const uploadTimer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadTimer);
          setTimeout(() => setPhase('processing'), 300);
          return 100;
        }
        return prev + 5;
      });
    }, 40);

    const countTimer = setInterval(() => {
      setUploadedCount(prev => {
        if (prev >= 25) {
          clearInterval(countTimer);
          return 25;
        }
        return prev + 1;
      });
    }, 80);

    return () => {
      clearInterval(uploadTimer);
      clearInterval(countTimer);
    };
  }, [phase]);

  // Phase 2: Processing
  useEffect(() => {
    if (phase !== 'processing') return;

    let step = 0;
    const stepTimer = setInterval(() => {
      step++;
      if (step >= AI_STEPS.length) {
        clearInterval(stepTimer);
        setTimeout(() => setPhase('complete'), 500);
        return;
      }
      setAiStepIndex(step);
      setOverallProgress(Math.round((step / AI_STEPS.length) * 100));
    }, 600);

    const secondTimer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 100);

    return () => {
      clearInterval(stepTimer);
      clearInterval(secondTimer);
    };
  }, [phase]);

  // Phase 3: Complete
  useEffect(() => {
    if (phase !== 'complete') return;

    // Animate slider
    const sliderAnim = setTimeout(() => {
      setSliderPos(15);
      setTimeout(() => setSliderPos(85), 800);
      setTimeout(() => setSliderPos(50), 1600);
    }, 400);

    // Reveal content items
    const contentTimer = setInterval(() => {
      setContentRevealed(prev => {
        if (prev >= CONTENT_OUTPUTS.length) {
          clearInterval(contentTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 150);

    // Restart loop
    const restartTimer = setTimeout(runDemo, 10000);

    return () => {
      clearTimeout(sliderAnim);
      clearInterval(contentTimer);
      clearTimeout(restartTimer);
    };
  }, [phase, runDemo]);

  // Start on mount
  useEffect(() => {
    const timer = setTimeout(runDemo, 500);
    return () => clearTimeout(timer);
  }, [runDemo]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Main Container */}
      <div 
        className="relative rounded-2xl md:rounded-3xl overflow-hidden border-2 border-[#D4A017]/40 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] shadow-2xl shadow-[#D4A017]/10"
        style={{ aspectRatio: '16/9', minHeight: '400px' }}
      >
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none">
          <div className="absolute inset-[-2px] rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#D4A017]/0 via-[#D4A017]/30 to-[#D4A017]/0 animate-pulse" />
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
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
              phase === 'upload' ? 'bg-white/10 text-white/70' :
              phase === 'processing' ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30' :
              'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {phase === 'upload' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
                  <span>Step 1: Upload</span>
                </>
              )}
              {phase === 'processing' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
                  <span>Step 2: AI Processing</span>
                </>
              )}
              {phase === 'complete' && (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Complete in 58s</span>
                </>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-center justify-center">
            
            {/* UPLOAD PHASE */}
            {phase === 'upload' && (
              <div className="text-center w-full max-w-md animate-fadeIn">
                {/* Upload icon */}
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-2xl border-2 border-dashed border-[#D4A017]/50 flex items-center justify-center bg-[#D4A017]/5 animate-bounce-slow">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Uploading Photos</h3>
                <p className="text-white/50 text-sm md:text-base mb-4">{uploadedCount} of 25 photos</p>

                {/* Progress bar */}
                <div className="h-2 md:h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-full transition-all duration-100"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {/* Thumbnail grid */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {Array.from({ length: Math.min(uploadedCount, 12) }).map((_, i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/10 animate-scaleIn"
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                  ))}
                  {uploadedCount > 12 && (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#D4A017]/20 border border-[#D4A017]/30 flex items-center justify-center text-[#D4A017] text-xs font-bold">
                      +{uploadedCount - 12}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROCESSING PHASE */}
            {phase === 'processing' && (
              <div className="w-full grid md:grid-cols-2 gap-6 md:gap-8 animate-fadeIn">
                {/* Left: Current AI step */}
                <div className="text-center md:text-left">
                  <div className="text-4xl md:text-5xl mb-3 animate-bounce-slow">
                    {AI_STEPS[aiStepIndex]?.icon}
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-1">
                    {AI_STEPS[aiStepIndex]?.label}
                  </h3>
                  <p className="text-white/40 text-sm mb-4">
                    Step {aiStepIndex + 1} of {AI_STEPS.length}
                  </p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs md:text-sm mb-1">
                      <span className="text-white/50">Overall Progress</span>
                      <span className="text-[#D4A017] font-semibold">{overallProgress}%</span>
                    </div>
                    <div className="h-2 md:h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-full transition-all duration-300"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Step dots */}
                  <div className="flex gap-1 justify-center md:justify-start">
                    {AI_STEPS.map((_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          i < aiStepIndex ? 'bg-[#D4A017]' : 
                          i === aiStepIndex ? 'bg-[#D4A017] animate-pulse scale-125' : 
                          'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Timer */}
                  <div className="mt-4 text-white/30 text-sm">
                    ⏱️ {(seconds / 10).toFixed(1)}s elapsed
                  </div>
                </div>

                {/* Right: Photo grid being processed */}
                <div className="hidden md:grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const isComplete = i <= Math.floor(aiStepIndex / 2);
                    const isActive = i === Math.floor(aiStepIndex / 2) + 1;
                    return (
                      <div 
                        key={i}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          isComplete ? 'border-[#D4A017] bg-[#D4A017]/10' :
                          isActive ? 'border-[#D4A017]/50 bg-white/5' :
                          'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          {isComplete && (
                            <svg className="w-8 h-8 text-[#D4A017]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {isActive && (
                            <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COMPLETE PHASE */}
            {phase === 'complete' && (
              <div className="w-full grid md:grid-cols-2 gap-6 md:gap-8 animate-fadeIn">
                {/* Left: Before/After */}
                <div>
                  <p className="text-white/40 text-xs font-semibold tracking-wider mb-2 text-center md:text-left">BEFORE → AFTER</p>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#D4A017]/50 bg-gradient-to-br from-gray-700 to-gray-900">
                    {/* Before side */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-700">
                      <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                        Dull Sky • Low Contrast
                      </div>
                    </div>
                    
                    {/* After side - clips based on slider */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-sky-400/30 via-amber-500/20 to-orange-400/30 transition-all duration-500"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-[#D4A017] text-sm font-semibold">
                        ✨ Enhanced
                      </div>
                    </div>

                    {/* Slider handle */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-500"
                      style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-xl flex items-center justify-center">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] md:text-xs text-white/70">Before</div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-[#D4A017] rounded text-[10px] md:text-xs text-black font-semibold">After</div>
                  </div>
                </div>

                {/* Right: Generated content */}
                <div>
                  <p className="text-white/40 text-xs font-semibold tracking-wider mb-2">READY TO PUBLISH</p>
                  <div className="space-y-2">
                    {CONTENT_OUTPUTS.map((item, i) => (
                      <div 
                        key={item.type}
                        className={`flex items-center justify-between p-2.5 md:p-3 bg-white/5 rounded-lg border border-white/10 transition-all duration-300 ${
                          i < contentRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                        }`}
                        style={{ transitionDelay: `${i * 100}ms` }}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-lg md:text-xl">{item.icon}</span>
                          <span className="text-white text-sm md:text-base font-medium">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.count > 1 && (
                            <span className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] rounded text-xs font-bold">
                              ×{item.count}
                            </span>
                          )}
                          <svg className="w-4 h-4 md:w-5 md:h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold text-sm md:text-base shadow-lg shadow-[#D4A017]/20">
                      <span>One-Click Publish</span>
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom tagline */}
          <div className="text-center mt-4">
            <p className="text-white/30 text-xs md:text-sm">
              {phase === 'complete' 
                ? '⚡ What takes editors 24-48 hours, SnapR did in 58 seconds'
                : '⚡ Watch the magic happen in real-time'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex justify-center mt-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#1A1A1A]/80 border border-white/10 rounded-full">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/50 text-xs">Live Demo</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <span className="text-white/70 text-xs">Loops automatically</span>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default LandingDemo;
