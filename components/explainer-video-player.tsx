'use client';

import { useRef } from 'react';

// The rendered explainer video URL — env var override or Cloudinary default
const EXPLAINER_VIDEO_URL =
  process.env.NEXT_PUBLIC_EXPLAINER_VIDEO_URL ||
  'https://res.cloudinary.com/drie9liyn/video/upload/v1771823926/snapr-explainer-video.mp4';

// Cloudinary auto-generated poster from a visible frame (4 seconds in)
const EXPLAINER_POSTER_URL =
  'https://res.cloudinary.com/drie9liyn/video/upload/so_4,f_jpg,q_80,w_1920/v1771823926/snapr-explainer-video.jpg';

export function ExplainerVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fallback: clicking anywhere on the container plays the video
  // (helps on mobile where native controls may not render until metadata loads)
  const handleContainerClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {
        // Silently ignore — browser may require muted autoplay
      });
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="w-full aspect-video bg-black rounded-2xl border border-white/10 cursor-pointer"
      onClick={handleContainerClick}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={EXPLAINER_VIDEO_URL}
        poster={EXPLAINER_POSTER_URL}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
