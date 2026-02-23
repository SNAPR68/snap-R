'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Maximize2, Volume2, VolumeX, Loader2 } from 'lucide-react';

// The rendered explainer video URL — env var override or Cloudinary default
const EXPLAINER_VIDEO_URL =
  process.env.NEXT_PUBLIC_EXPLAINER_VIDEO_URL ||
  'https://res.cloudinary.com/drie9liyn/video/upload/v1771823926/snapr-explainer-video.mp4';

// Cloudinary auto-generated poster from first frame
const EXPLAINER_POSTER_URL =
  'https://res.cloudinary.com/drie9liyn/video/upload/so_0,f_jpg,q_80/v1771823926/snapr-explainer-video.jpg';

export function ExplainerVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Listen for video events to sync state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setHasStarted(true);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      setIsLoading(true);
      video.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    } else {
      video.pause();
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
    setIsLoading(false);
    setShowControls(true);
    setProgress(0);
    setHasStarted(false);
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
      onMouseLeave={() => isPlaying && !isLoading && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={EXPLAINER_VIDEO_URL}
        poster={EXPLAINER_POSTER_URL}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
      />

      {/* Play button overlay (when not playing) */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-20 h-20 rounded-full bg-[#D4A017] flex items-center justify-center shadow-2xl shadow-[#D4A017]/20 hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-[#0A0A0A] ml-1" fill="#0A0A0A" />
          </div>
        </div>
      )}

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="w-12 h-12 text-[#D4A017] animate-spin" />
        </div>
      )}

      {/* Controls bar (visible when hovering or paused) */}
      {hasStarted && (
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
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[#D4A017] rounded-full"
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
      )}
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
