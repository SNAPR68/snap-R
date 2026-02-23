'use client';

// The rendered explainer video URL — env var override or Cloudinary default
const EXPLAINER_VIDEO_URL =
  process.env.NEXT_PUBLIC_EXPLAINER_VIDEO_URL ||
  'https://res.cloudinary.com/drie9liyn/video/upload/v1771823926/snapr-explainer-video.mp4';

// Cloudinary auto-generated poster from a visible frame (4 seconds in)
const EXPLAINER_POSTER_URL =
  'https://res.cloudinary.com/drie9liyn/video/upload/so_4,f_jpg,q_80,w_1920/v1771823926/snapr-explainer-video.jpg';

export function ExplainerVideoPlayer() {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={EXPLAINER_VIDEO_URL}
        poster={EXPLAINER_POSTER_URL}
        controls
        playsInline
        preload="auto"
        style={{
          width: '100%',
          display: 'block',
          backgroundColor: '#000',
          borderRadius: '16px',
        }}
      />
    </div>
  );
}
