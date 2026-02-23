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

interface SoldBadgeProps {
  daysOnMarket?: number;
}

// ============================================
// SOLD BADGE COMPONENT
// ============================================

export const SoldBadge: React.FC<SoldBadgeProps> = ({ daysOnMarket }) => {
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

  const fontSize = height * 0.022;
  const paddingH = width * 0.035;
  const paddingV = height * 0.01;
  const topMargin = height * 0.05;

  // Social proof text
  const socialProof = daysOnMarket
    ? `Sold in ${daysOnMarket} Day${daysOnMarket !== 1 ? 's' : ''}`
    : undefined;

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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.006,
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {/* Main badge */}
        <div
          style={{
            fontSize,
            fontWeight: 700,
            color: 'white',
            backgroundColor: 'rgba(139, 92, 246, 0.9)',
            paddingLeft: paddingH,
            paddingRight: paddingH,
            paddingTop: paddingV,
            paddingBottom: paddingV,
            borderRadius: height * 0.006,
            letterSpacing: '0.03em',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: width * 0.012,
          }}
        >
          <span style={{ fontSize: fontSize * 1.1 }}>🎉</span>
          SOLD
        </div>

        {/* Social proof: days on market */}
        {socialProof && (
          <div
            style={{
              fontSize: fontSize * 0.85,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.85)',
              letterSpacing: '0.02em',
            }}
          >
            {socialProof}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
