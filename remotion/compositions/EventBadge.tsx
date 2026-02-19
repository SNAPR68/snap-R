import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { fontFamily } from './shared';

// ============================================
// TYPES
// ============================================

interface EventBadgeProps {
  dateText: string;
}

// ============================================
// EVENT BADGE COMPONENT
// ============================================

export const EventBadge: React.FC<EventBadgeProps> = ({ dateText }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Fade in over first 20 frames
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, 20], [-10, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const fontSize = height * 0.024;
  const paddingH = width * 0.04;
  const paddingV = height * 0.012;
  const topMargin = height * 0.05;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: topMargin,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 700,
          color: 'white',
          backgroundColor: 'rgba(212, 160, 23, 0.9)',
          paddingLeft: paddingH,
          paddingRight: paddingH,
          paddingTop: paddingV,
          paddingBottom: paddingV,
          borderRadius: height * 0.006,
          opacity,
          transform: `translateY(${translateY}px)`,
          letterSpacing: '0.03em',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: width * 0.015,
        }}
      >
        <span style={{ fontSize: fontSize * 1.1 }}>📅</span>
        {dateText}
      </div>
    </AbsoluteFill>
  );
};
