import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { fontFamily, PHOTO_DISPLAY_FRAMES } from './shared';

// ============================================
// TYPES
// ============================================

interface FeatureCalloutProps {
  feature: string;
}

// ============================================
// FEATURE CALLOUT COMPONENT
// ============================================

export const FeatureCallout: React.FC<FeatureCalloutProps> = ({ feature }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Fade in from bottom, hold, fade out
  const opacity = interpolate(
    frame,
    [15, 35, PHOTO_DISPLAY_FRAMES - 30, PHOTO_DISPLAY_FRAMES - 10],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const translateY = interpolate(frame, [15, 35], [10, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const fontSize = height * 0.022;
  const paddingH = width * 0.03;
  const paddingV = height * 0.008;
  const margin = width * 0.04;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: margin,
        paddingBottom: margin * 2.5,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 600,
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          paddingLeft: paddingH,
          paddingRight: paddingH,
          paddingTop: paddingV,
          paddingBottom: paddingV,
          borderRadius: height * 0.008,
          borderLeft: `3px solid #D4A017`,
          opacity,
          transform: `translateY(${translateY}px)`,
          letterSpacing: '0.01em',
        }}
      >
        {feature}
      </div>
    </AbsoluteFill>
  );
};
