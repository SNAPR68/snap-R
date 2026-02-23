'use client';

import { useState, useRef } from 'react';
import { Play } from 'lucide-react';

// The rendered explainer video URL — env var override or Cloudinary default
const EXPLAINER_VIDEO_URL =
  process.env.NEXT_PUBLIC_EXPLAINER_VIDEO_URL ||
  'https://res.cloudinary.com/drie9liyn/video/upload/v1771823926/snapr-explainer-video.mp4';

// Cloudinary auto-generated poster from a visible frame (4 seconds in)
const EXPLAINER_POSTER_URL =
  'https://res.cloudinary.com/drie9liyn/video/upload/so_4,f_jpg,q_80,w_1920/v1771823926/snapr-explainer-video.jpg';

export function ExplainerVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasClicked, setHasClicked] = useState(false);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    setHasClicked(true);
    video.play().catch(() => {
      // If autoplay fails, at least show the native controls
      setHasClicked(true);
    });
  };

  if (!EXPLAINER_VIDEO_URL) {
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

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={EXPLAINER_VIDEO_URL}
        poster={EXPLAINER_POSTER_URL}
        controls={hasClicked}
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-contain bg-black"
        style={{ display: 'block' }}
      />

      {/* Custom play button overlay — only shown before first click */}
      {!hasClicked && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer group"
          aria-label="Play explainer video"
          type="button"
        >
          <div className="w-20 h-20 rounded-full bg-[#D4A017] flex items-center justify-center shadow-2xl shadow-[#D4A017]/20 group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-[#0A0A0A] ml-1" fill="#0A0A0A" />
          </div>
        </button>
      )}
    </div>
  );
}
