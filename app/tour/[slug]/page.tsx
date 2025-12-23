'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2, ChevronLeft, ChevronRight, Home, Maximize2, Minimize2,
  Play, Pause, Volume2, VolumeX, Share2, Info, X, Grid,
  Copy, Check, Clock
} from 'lucide-react';

interface Scene {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  sort_order: number;
  is_start_scene: boolean;
  floor_name?: string;
  tour_hotspots?: any[];
}

interface Tour {
  id: string;
  name: string;
  description?: string;
  slug: string;
  tour_type: string;
  auto_rotate: boolean;
  logo_url?: string;
  brand_color: string;
  tour_scenes: Scene[];
}

const kenBurnsEffects = [
  { transform: 'scale(1) translate(0, 0)', endTransform: 'scale(1.1) translate(-2%, -1%)' },
  { transform: 'scale(1.1) translate(2%, 1%)', endTransform: 'scale(1) translate(0, 0)' },
  { transform: 'scale(1) translate(-1%, 1%)', endTransform: 'scale(1.1) translate(1%, -1%)' },
  { transform: 'scale(1.1) translate(0, -2%)', endTransform: 'scale(1) translate(0, 0)' },
  { transform: 'scale(1) translate(1%, 0)', endTransform: 'scale(1.1) translate(-1%, 1%)' },
];

export default function TourViewerPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'start' | 'end'>('start');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  
  const SCENE_DURATION = 6000;
  const TRANSITION_DURATION = 1000;

  useEffect(() => {
    if (slug) loadTour();
  }, [slug]);

  useEffect(() => {
    if (!tour || !isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    setAnimationPhase('start');
    setTimeout(() => setAnimationPhase('end'), 100);

    const progressInterval = 50;
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + (progressInterval / SCENE_DURATION) * 100;
      });
    }, progressInterval);

    intervalRef.current = setInterval(() => {
      goToNext();
    }, SCENE_DURATION);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [tour, isPlaying, currentIndex]);

  const loadTour = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tour/${slug}`);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Tour not found');
      }
      
      const data = await response.json();
      
      if (!data?.tour_scenes?.length) {
        throw new Error('Tour has no scenes');
      }
      
      setTour(data);
      const startIdx = data.tour_scenes.findIndex((s: Scene) => s.is_start_scene);
      setCurrentIndex(startIdx >= 0 ? startIdx : 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToNext = useCallback(() => {
    if (!tour) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % tour.tour_scenes.length);
      setIsTransitioning(false);
      setAnimationPhase('start');
      setTimeout(() => setAnimationPhase('end'), 100);
    }, TRANSITION_DURATION / 2);
  }, [tour]);

  const goToPrev = useCallback(() => {
    if (!tour) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + tour.tour_scenes.length) % tour.tour_scenes.length);
      setIsTransitioning(false);
      setAnimationPhase('start');
      setTimeout(() => setAnimationPhase('end'), 100);
    }, TRANSITION_DURATION / 2);
  }, [tour]);

  const goToScene = (index: number) => {
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
      setAnimationPhase('start');
      setTimeout(() => setAnimationPhase('end'), 100);
    }, TRANSITION_DURATION / 2);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
        <p className="text-white/50">Loading tour...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Tour Not Found</h1>
          <p className="text-white/50 mb-6">{error}</p>
          <a href="/" className="px-6 py-3 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const currentScene = tour.tour_scenes[currentIndex];
  const kenBurns = kenBurnsEffects[currentIndex % kenBurnsEffects.length];

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden select-none">
      {/* Background ambient layer */}
      <div 
        className="absolute inset-0 opacity-30 blur-3xl scale-110"
        style={{
          backgroundImage: `url(${currentScene.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Main Image with Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        {tour.tour_scenes.map((scene, index) => (
          <div
            key={scene.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div
              className="absolute inset-0 transition-transform ease-out"
              style={{
                transitionDuration: index === currentIndex ? '6000ms' : '0ms',
                transform: index === currentIndex 
                  ? (animationPhase === 'end' ? kenBurns.endTransform : kenBurns.transform)
                  : kenBurns.transform
              }}
            >
              <img
                src={scene.image_url}
                alt={scene.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-20 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tour.logo_url ? (
              <img src={tour.logo_url} alt="" className="h-8 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Home className="w-5 h-5 text-amber-400" />
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-lg md:text-xl">{tour.name}</h1>
              <p className="text-white/50 text-sm">{tour.tour_scenes.length} Scenes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-2.5 rounded-xl transition-all ${
                showThumbnails ? 'bg-amber-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2.5 rounded-xl transition-all ${
                showInfo ? 'bg-amber-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={copyLink}
              className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all hidden md:block"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Scene Info Overlay */}
      <div className="relative z-20 flex-1 flex flex-col justify-end pointer-events-none">
        <div className="p-4 md:p-6 pb-24 md:pb-32">
          <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <p className="text-amber-400 text-sm font-medium mb-1">
              {currentScene.floor_name || 'Scene'} {currentIndex + 1} of {tour.tour_scenes.length}
            </p>
            <h2 className="text-white text-2xl md:text-4xl font-bold mb-2">
              {currentScene.name}
            </h2>
            {currentScene.description && (
              <p className="text-white/70 text-sm md:text-base max-w-xl">
                {currentScene.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all group"
      >
        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all group"
      >
        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex gap-1">
            {tour.tour_scenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToScene(idx)}
                className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 hover:bg-white/30 transition-colors"
              >
                <div
                  className="h-full bg-amber-400 transition-all duration-100"
                  style={{
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-3 bg-amber-500 rounded-full text-black hover:bg-amber-400 transition-all hover:scale-105"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <span className="text-white/50 text-sm hidden md:block">
              <Clock className="w-4 h-4 inline mr-1" />
              {Math.ceil((tour.tour_scenes.length - currentIndex) * SCENE_DURATION / 1000)}s remaining
            </span>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-1.5 overflow-x-auto max-w-[50%] md:max-w-none scrollbar-hide">
            {tour.tour_scenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => goToScene(idx)}
                className={`flex-shrink-0 w-12 h-8 md:w-16 md:h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-amber-400 scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={scene.thumbnail_url || scene.image_url}
                  alt={scene.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnail Grid Modal */}
      {showThumbnails && (
        <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-xl p-4 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-xl font-bold">All Scenes</h3>
            <button onClick={() => setShowThumbnails(false)} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tour.tour_scenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => { goToScene(idx); setShowThumbnails(false); }}
                className={`relative aspect-video rounded-xl overflow-hidden group ${
                  idx === currentIndex ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                <img
                  src={scene.thumbnail_url || scene.image_url}
                  alt={scene.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-sm font-medium truncate">{scene.name}</p>
                  <p className="text-white/50 text-xs">{scene.floor_name}</p>
                </div>
                {idx === currentIndex && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 rounded text-xs font-bold text-black">
                    Playing
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute top-20 right-4 z-30 w-80 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Tour Details</h3>
            <button onClick={() => setShowInfo(false)}>
              <X className="w-5 h-5 text-white/50 hover:text-white" />
            </button>
          </div>
          
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-white/50 mb-1">Property</div>
              <div className="text-white font-medium">{tour.name}</div>
            </div>
            {tour.description && (
              <div>
                <div className="text-white/50 mb-1">Description</div>
                <div className="text-white/80">{tour.description}</div>
              </div>
            )}
            <div className="flex gap-4">
              <div>
                <div className="text-white/50 mb-1">Scenes</div>
                <div className="text-white font-medium">{tour.tour_scenes.length}</div>
              </div>
              <div>
                <div className="text-white/50 mb-1">Duration</div>
                <div className="text-white font-medium">{Math.ceil(tour.tour_scenes.length * SCENE_DURATION / 1000)}s</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="text-white/50 text-xs mb-2">Share Link</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors"
              >
                <Copy className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Powered By */}
      <a
        href="https://snap-r.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-24 md:bottom-28 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white/50 text-xs hover:text-white transition-colors"
      >
        Powered by <span className="font-bold text-amber-400">SnapR</span>
      </a>
    </div>
  );
}