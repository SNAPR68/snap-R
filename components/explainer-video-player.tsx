'use client';

import { useRef, useState } from 'react';

// The rendered explainer video URL — env var override or Cloudinary default
const EXPLAINER_VIDEO_URL =
  process.env.NEXT_PUBLIC_EXPLAINER_VIDEO_URL ||
  'https://res.cloudinary.com/drie9liyn/video/upload/v1771823926/snapr-explainer-video.mp4';

// Cloudinary auto-generated poster from a visible frame (4 seconds in)
const EXPLAINER_POSTER_URL =
  'https://res.cloudinary.com/drie9liyn/video/upload/so_4,f_jpg,q_80,w_1920/v1771823926/snapr-explainer-video.jpg';

export function ExplainerVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  };

  return (
    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative isolate">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={EXPLAINER_VIDEO_URL}
        poster={EXPLAINER_POSTER_URL}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full block relative"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {/* Play overlay — high z-index so it stays above analytics/chat overlays */}
      {!isPlaying && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 z-[100] flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-inset"
          aria-label="Play video"
        >
          <span className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
            <svg
              className="w-10 h-10 text-[#D4A017] ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
