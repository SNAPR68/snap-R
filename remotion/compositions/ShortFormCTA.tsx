import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { fontFamily } from './shared';

interface ShortFormCTAProps {
  address: string;
  brand?: {
    businessName?: string;
    phone?: string;
    website?: string;
    primaryColor?: string;
  };
  accentColor?: string;
}

export const ShortFormCTA: React.FC<ShortFormCTAProps> = ({
  address,
  brand,
  accentColor = '#D4A017',
}) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  // Fade in
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  // Scale up
  const scale = interpolate(frame, [0, 12], [0.9, 1.0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  // Gold line grows
  const lineWidth = interpolate(frame, [10, 30], [0, 100], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const addressSize = height * 0.032;
  const brandSize = height * 0.022;
  const ctaSize = height * 0.026;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Address */}
      <div
        style={{
          fontSize: addressSize,
          fontWeight: 700,
          color: 'white',
          textAlign: 'center',
          maxWidth: width * 0.85,
          letterSpacing: '0.02em',
        }}
      >
        {address}
      </div>

      {/* Gold divider */}
      <div
        style={{
          width: width * 0.3,
          height: 3,
          marginTop: height * 0.02,
          marginBottom: height * 0.02,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: `${lineWidth}%`,
            height: '100%',
            backgroundColor: accentColor,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Brand info */}
      {brand?.businessName && (
        <div
          style={{
            fontSize: brandSize,
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: height * 0.01,
          }}
        >
          {brand.businessName}
        </div>
      )}

      {brand?.phone && (
        <div
          style={{
            fontSize: brandSize * 0.9,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {brand.phone}
        </div>
      )}

      {/* CTA text */}
      <div
        style={{
          fontSize: ctaSize,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: height * 0.04,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Link in Bio
      </div>
    </AbsoluteFill>
  );
};
