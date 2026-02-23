'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react';

// The rendered explainer video URL — update after Remotion render
const EXPLAINER_VIDEO_URL = process.env.NEXT_PUBLIC_EXPLAINER_VIDEO_URL || '';

export function ExplainerVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      // Hide controls after 2s
      setTimeout(() => setShowControls(false), 2000);
    } else {
      video.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = clickX / rect.width;
      video.currentTime = pct * video.duration;
    },
    []
  );

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, []);

  // If no video URL is configured, show a placeholder
  if (!EXPLAINER_VIDEO_URL) {
    return <ExplainerVideoPlaceholder />;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/10 group cursor-pointer"
      onClick={togglePlay}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={EXPLAINER_VIDEO_URL}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
      />

      {/* Play button overlay (when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-20 h-20 rounded-full bg-[#D4A017] flex items-center justify-center shadow-2xl shadow-[#D4A017]/20 hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-[#0A0A0A] ml-1" fill="#0A0A0A" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-[#D4A017] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#D4A017] transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="text-white hover:text-[#D4A017] transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-[#D4A017] transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Placeholder shown when no video URL is set
function ExplainerVideoPlaceholder() {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-white/10 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[#D4A017]/10 border-2 border-[#D4A017]/30 flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 text-[#D4A017] ml-1" />
        </div>
        <p className="text-white/60 text-sm font-medium">Explainer video coming soon</p>
        <p className="text-white/30 text-xs mt-1">See SnapR in action</p>
      </div>
    </div>
  );
}
