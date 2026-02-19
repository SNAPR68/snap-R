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

interface ClosingCardProps {
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft?: number;
}

// ============================================
// CLOSING CARD COMPONENT
// ============================================

export const ClosingCard: React.FC<ClosingCardProps> = ({
  address,
  price,
  beds,
  baths,
  sqft,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  // Staggered fade-in animations
  const addressOpacity = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const priceOpacity = interpolate(frame, [10, 30], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const detailsOpacity = interpolate(frame, [20, 40], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  // Slide up animations
  const addressTranslateY = interpolate(frame, [0, 20], [20, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const priceTranslateY = interpolate(frame, [10, 30], [20, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const detailsTranslateY = interpolate(frame, [20, 40], [20, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const formattedPrice = `$${price.toLocaleString()}`;

  // Build details string
  const details = [
    `${beds} Bed${beds !== 1 ? 's' : ''}`,
    `${baths} Bath${baths !== 1 ? 's' : ''}`,
    ...(sqft ? [`${sqft.toLocaleString()} Sq Ft`] : []),
  ].join('  ·  ');

  // Percentage-based sizing
  const addressSize = height * 0.035;
  const priceSize = height * 0.06;
  const detailsSize = height * 0.025;
  const gap = height * 0.015;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      {/* Address */}
      <div
        style={{
          fontSize: addressSize,
          fontWeight: 600,
          color: 'white',
          opacity: addressOpacity,
          transform: `translateY(${addressTranslateY}px)`,
          textAlign: 'center',
          marginBottom: gap,
          letterSpacing: '0.02em',
        }}
      >
        {address}
      </div>

      {/* Price in gold */}
      <div
        style={{
          fontSize: priceSize,
          fontWeight: 800,
          color: '#D4A017',
          opacity: priceOpacity,
          transform: `translateY(${priceTranslateY}px)`,
          textAlign: 'center',
          marginBottom: gap,
        }}
      >
        {formattedPrice}
      </div>

      {/* Details: beds · baths · sqft */}
      <div
        style={{
          fontSize: detailsSize,
          fontWeight: 400,
          color: 'rgba(255, 255, 255, 0.8)',
          opacity: detailsOpacity,
          transform: `translateY(${detailsTranslateY}px)`,
          textAlign: 'center',
          letterSpacing: '0.05em',
        }}
      >
        {details}
      </div>
    </AbsoluteFill>
  );
};
