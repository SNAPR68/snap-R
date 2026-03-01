import React from 'react';
import { interpolate, useCurrentFrame, Easing, spring, useVideoConfig } from 'remotion';

interface CursorWaypoint {
  x: number;
  y: number;
  frame: number;
  click?: boolean;
}

interface AnimatedCursorProps {
  waypoints: CursorWaypoint[];
}

export const AnimatedCursor: React.FC<AnimatedCursorProps> = ({ waypoints }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (waypoints.length === 0) return null;

  // Interpolate position along waypoints
  const frames = waypoints.map((w) => w.frame);
  const xs = waypoints.map((w) => w.x);
  const ys = waypoints.map((w) => w.y);

  const x = interpolate(frame, frames, xs, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const y = interpolate(frame, frames, ys, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Only show cursor when within waypoint time range
  const visible = frame >= frames[0] && frame <= frames[frames.length - 1];
  if (!visible) return null;

  // Check if currently clicking (within 12 frames of a click waypoint)
  const clickWaypoint = waypoints.find(
    (w) => w.click && frame >= w.frame && frame < w.frame + 12,
  );

  const clickRippleScale = clickWaypoint
    ? spring({
        frame: frame - clickWaypoint.frame,
        fps,
        config: { damping: 12, stiffness: 100 },
      })
    : 0;

  const clickRippleOpacity = clickWaypoint
    ? interpolate(frame - clickWaypoint.frame, [0, 12], [0.8, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <>
      {/* Click ripple */}
      {clickWaypoint && clickRippleOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: x - 20,
            top: y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid #D4A017',
            transform: `scale(${1 + clickRippleScale * 1.5})`,
            opacity: clickRippleOpacity,
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}

      {/* Cursor */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 24,
          height: 24,
          pointerEvents: 'none',
          zIndex: 1001,
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
        }}
      >
        {/* Default macOS cursor SVG */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
            fill="white"
            stroke="black"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    </>
  );
};
