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

interface PriceDropBadgeProps {
  currentPrice: number;
  previousPrice?: number;
}

// ============================================
// PRICE DROP BADGE COMPONENT
// ============================================

export const PriceDropBadge: React.FC<PriceDropBadgeProps> = ({
  currentPrice,
  previousPrice,
}) => {
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

  // Calculate percentage drop
  const percentDrop =
    previousPrice && previousPrice > currentPrice
      ? Math.round(((previousPrice - currentPrice) / previousPrice) * 100)
      : undefined;

  // Build badge text
  const badgeText = percentDrop
    ? `${percentDrop}% Price Drop`
    : 'Price Reduced';

  // Show previous price crossed out if available
  const previousPriceText = previousPrice
    ? `$${previousPrice.toLocaleString()}`
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
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
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
          <span style={{ fontSize: fontSize * 1.1 }}>💰</span>
          {badgeText}
        </div>

        {/* Previous price (crossed out) → new price */}
        {previousPriceText && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: width * 0.015,
              fontSize: fontSize * 0.85,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                textDecoration: 'line-through',
              }}
            >
              {previousPriceText}
            </span>
            <span style={{ color: '#D4A017' }}>
              →
            </span>
            <span style={{ color: '#22C55E', fontWeight: 700 }}>
              ${currentPrice.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
