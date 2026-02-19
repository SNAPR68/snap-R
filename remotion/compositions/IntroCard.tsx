import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { fontFamily, INTRO_CARD_FRAMES } from './shared';

// ============================================
// TYPES
// ============================================

interface IntroCardProps {
  title: string;
  subtitle?: string;
}

// ============================================
// INTRO CARD COMPONENT
// ============================================

export const IntroCard: React.FC<IntroCardProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  // Title: scale up + fade in
  const titleScale = interpolate(frame, [0, 20], [0.8, 1.0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  // Gold accent line: width from 0% to 100%
  const accentWidth = interpolate(frame, [10, 35], [0, 100], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Subtitle: fade in + slide up, delayed
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const subtitleTranslateY = interpolate(frame, [20, 40], [15, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [INTRO_CARD_FRAMES - 15, INTRO_CARD_FRAMES],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const titleSize = height * 0.08;
  const subtitleSize = height * 0.032;
  const accentMaxWidth = width * 0.3;
  const accentHeight = height * 0.004;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        opacity: fadeOut,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: titleSize,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textAlign: 'center',
        }}
      >
        {title}
      </div>

      {/* Gold accent line */}
      <div
        style={{
          width: accentMaxWidth,
          height: accentHeight,
          marginTop: height * 0.02,
          marginBottom: height * 0.02,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: `${accentWidth}%`,
            height: '100%',
            backgroundColor: '#D4A017',
            borderRadius: accentHeight,
          }}
        />
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: subtitleSize,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.85)',
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleTranslateY}px)`,
            textAlign: 'center',
            letterSpacing: '0.02em',
            maxWidth: width * 0.8,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
