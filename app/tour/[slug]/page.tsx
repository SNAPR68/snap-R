'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2, ChevronLeft, ChevronRight, Home, Maximize2, Minimize2,
  RotateCcw, Compass, Volume2, VolumeX, Share2, Info, X,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Play, Pause,
  Grid, Eye, Clock, MapPin, Copy, Check, ExternalLink
} from 'lucide-react';

interface Scene {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  is_360: boolean;
  initial_yaw: number;
  initial_pitch: number;
  initial_zoom: number;
  sort_order: number;
  is_start_scene: boolean;
  floor_name?: string;
  tour_hotspots?: Hotspot[];
}

interface Hotspot {
  id: string;
  yaw: number;
  pitch: number;
  hotspot_type: string;
  target_scene_id?: string;
  title?: string;
  content?: string;
  icon: string;
}

interface Tour {
  id: string;
  name: string;
  description?: string;
  slug: string;
  tour_type: 'regular' | '360';
  auto_rotate: boolean;
  show_compass: boolean;
  logo_url?: string;
  brand_color: string;
  tour_scenes: Scene[];
}

// Simple 360 Viewer Component (CSS-based for compatibility)
function PanoramaViewer({
  imageUrl,
  autoRotate,
  onNavigate,
}: {
  imageUrl: string;
  autoRotate: boolean;
  onNavigate?: (direction: 'left' | 'right') => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);

  // Auto-rotate effect
  useEffect(() => {
    if (!isAutoRotating) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({ ...prev, y: prev.y + 0.1 }));
    }, 50);

    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Mouse/touch handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    setRotation(prev => ({
      x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.2)),
      y: prev.y + deltaX * 0.2,
    }));
    
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - startPos.x;
    const deltaY = e.touches[0].clientY - startPos.y;
    
    setRotation(prev => ({
      x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.2)),
      y: prev.y + deltaX * 0.2,
    }));
    
    setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing relative bg-black"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Panorama Image with CSS 3D transform */}
      <div
        className="absolute inset-0 transition-transform duration-75"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg)`,
        }}
      >
        <div
          className="w-[300%] h-full flex"
          style={{
            transform: `translateX(${-rotation.y % 360}px)`,
          }}
        >
          <img
            src={imageUrl}
            alt="360 View"
            className="h-full object-cover"
            style={{ width: '100%' }}
            draggable={false}
          />
          <img
            src={imageUrl}
            alt="360 View"
            className="h-full object-cover"
            style={{ width: '100%' }}
            draggable={false}
          />
          <img
            src={imageUrl}
            alt="360 View"
            className="h-full object-cover"
            style={{ width: '100%' }}
            draggable={false}
          />
        </div>
      </div>

      {/* Navigation Arrows */}
      {onNavigate && (
        <>
          <button
            onClick={() => onNavigate('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => onNavigate('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Auto-rotate toggle */}
      <button
        onClick={() => setIsAutoRotating(!isAutoRotating)}
        className="absolute bottom-4 right-4 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
      >
        {isAutoRotating ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Drag hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white/70 text-sm pointer-events-none">
        Drag to look around
      </div>
    </div>
  );
}

// Scene Thumbnail Strip
function SceneStrip({
  scenes,
  currentIndex,
  onSelect,
}: {
  scenes: Scene[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 p-2 overflow-x-auto">
      {scenes.map((scene, index) => (
        <button
          key={scene.id}
          onClick={() => onSelect(index)}
          className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
            index === currentIndex
              ? 'border-purple-500 ring-2 ring-purple-500/50'
              : 'border-transparent hover:border-white/30'
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
  );
}

// Regular Photo Gallery Viewer
function RegularGalleryViewer({
  scenes,
  currentIndex,
  onNavigate,
}: {
  scenes: Scene[];
  currentIndex: number;
  onNavigate: (direction: 'left' | 'right') => void;
}) {
  const [transition, setTransition] = useState<'fade' | 'slide'>('fade');

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div className="relative w-full h-full">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={scene.image_url}
              alt={scene.name}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      {scenes.length > 1 && (
        <>
          <button
            onClick={() => onNavigate('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-20"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => onNavigate('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-20"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Photo Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white/70 text-sm z-20">
        {currentIndex + 1} / {scenes.length}
      </div>
    </div>
  );
}

// Main Tour Viewer Page
export default function TourViewerPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      loadTour();
    }
  }, [slug]);

  const loadTour = async () => {
    if (!slug) {
      setError('Tour slug is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch tour from API
      const response = await fetch(`/api/tour/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tour not found');
        }
        throw new Error('Failed to load tour');
      }
      
      const data = await response.json();
      
      if (!data || !data.id) {
        throw new Error('Invalid tour data');
      }
      
      setTour(data);
      
      // Find start scene
      const startIndex = data.tour_scenes?.findIndex((s: Scene) => s.is_start_scene) || 0;
      setCurrentSceneIndex(Math.max(0, startIndex));
      
    } catch (err: any) {
      console.error('Load tour error:', err);
      setError(err.message || 'Failed to load tour');
    } finally {
      setLoading(false);
    }
  };

  const currentScene = tour?.tour_scenes?.[currentSceneIndex];

  const navigateScene = (direction: 'left' | 'right') => {
    if (!tour?.tour_scenes) return;
    
    if (direction === 'left') {
      setCurrentSceneIndex(prev => 
        prev === 0 ? tour.tour_scenes.length - 1 : prev - 1
      );
    } else {
      setCurrentSceneIndex(prev => 
        prev === tour.tour_scenes.length - 1 ? 0 : prev + 1
      );
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white">
        <div className="text-center">
          <Home className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tour Not Found</h1>
          <p className="text-white/50 mb-6">{error || 'This tour may have been removed or is not public.'}</p>
          <a
            href="/"
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-400 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tour.logo_url && (
              <img src={tour.logo_url} alt="" className="h-8 w-auto" />
            )}
            <div>
              <h1 className="text-white font-bold">{tour.name}</h1>
              <p className="text-white/50 text-sm">
                {currentScene?.name} • {currentSceneIndex + 1} of {tour.tour_scenes?.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Info className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={copyLink}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Share2 className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewer */}
      <div className="flex-1 relative">
        {currentScene && tour.tour_type === '360' ? (
          <PanoramaViewer
            imageUrl={currentScene.image_url}
            autoRotate={tour.auto_rotate}
            onNavigate={tour.tour_scenes.length > 1 ? navigateScene : undefined}
          />
        ) : tour.tour_scenes && tour.tour_scenes.length > 0 ? (
          <RegularGalleryViewer
            scenes={tour.tour_scenes}
            currentIndex={currentSceneIndex}
            onNavigate={navigateScene}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            No scenes available
          </div>
        )}
      </div>

      {/* Scene Strip */}
      {tour.tour_scenes && tour.tour_scenes.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent">
          <SceneStrip
            scenes={tour.tour_scenes}
            currentIndex={currentSceneIndex}
            onSelect={setCurrentSceneIndex}
          />
        </div>
      )}

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute top-20 right-4 z-30 w-80 bg-black/90 backdrop-blur rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Tour Info</h3>
            <button onClick={() => setShowInfo(false)}>
              <X className="w-5 h-5 text-white/50 hover:text-white" />
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-white/50">Tour Name</div>
              <div className="text-white">{tour.name}</div>
            </div>
            {tour.description && (
              <div>
                <div className="text-white/50">Description</div>
                <div className="text-white">{tour.description}</div>
              </div>
            )}
            <div>
              <div className="text-white/50">Scenes</div>
              <div className="text-white">{tour.tour_scenes?.length || 0}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-white/50 text-xs mb-2">Share Link</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 transition-colors"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Powered By */}
      <div className="absolute bottom-20 right-4 z-10">
        <a
          href="https://snap-r.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-full text-white/50 text-xs hover:text-white transition-colors"
        >
          Powered by <span className="font-bold text-amber-400">SnapR</span>
        </a>
      </div>
    </div>
  );
}
