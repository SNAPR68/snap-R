import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { z } from 'zod';
import { fontFamily } from './shared';

// ============================================
// BRAND SCHEMA (shared across all compositions)
// ============================================

export const brandSchema = z.object({
  businessName: z.string().optional(),
  logoUrl: z.string().optional(),
  brokerageLogoUrl: z.string().optional(),
  primaryColor: z.string().default('#D4AF37'),
  secondaryColor: z.string().default('#1A1A1A'),
  phone: z.string().optional(),
  website: z.string().optional(),
  tagline: z.string().optional(),
});

export type BrandData = z.infer<typeof brandSchema>;

// ============================================
// BRAND WATERMARK — Logo in top-right during slideshow
// ============================================

interface BrandWatermarkProps {
  brand?: BrandData;
}

export const BrandWatermark: React.FC<BrandWatermarkProps> = ({ brand }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  if (!brand?.logoUrl) return null;

  const opacity = interpolate(frame, [10, 30], [0, 0.85], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const logoSize = height * 0.06;
  const margin = width * 0.04;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        padding: margin,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity,
          width: logoSize,
          height: logoSize,
          borderRadius: logoSize * 0.15,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Img
          src={brand.logoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// BRAND FOOTER — Agent info bar on closing card
// ============================================

interface BrandFooterProps {
  brand?: BrandData;
}

export const BrandFooter: React.FC<BrandFooterProps> = ({ brand }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  if (!brand) return null;

  const hasContent = brand.businessName || brand.phone || brand.website || brand.tagline;
  if (!hasContent) return null;

  const opacity = interpolate(frame, [30, 50], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [30, 50], [15, 0], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  const padding = width * 0.04;
  const primaryColor = brand.primaryColor || '#D4AF37';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: height * 0.06,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.008,
          padding: `${height * 0.015}px ${padding}px`,
        }}
      >
        {/* Divider line */}
        <div
          style={{
            width: width * 0.15,
            height: 2,
            backgroundColor: primaryColor,
            opacity: 0.6,
            marginBottom: height * 0.005,
          }}
        />

        {/* Tagline */}
        {brand.tagline && (
          <div
            style={{
              fontFamily,
              fontSize: height * 0.018,
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'rgba(255, 255, 255, 0.7)',
              letterSpacing: '0.02em',
              textAlign: 'center',
            }}
          >
            {brand.tagline}
          </div>
        )}

        {/* Business name */}
        {brand.businessName && (
          <div
            style={{
              fontFamily,
              fontSize: height * 0.022,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '0.03em',
              textAlign: 'center',
            }}
          >
            {brand.businessName}
          </div>
        )}

        {/* Contact row: phone | website */}
        {(brand.phone || brand.website) && (
          <div
            style={{
              fontFamily,
              fontSize: height * 0.016,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.02em',
              textAlign: 'center',
              display: 'flex',
              gap: width * 0.02,
            }}
          >
            {brand.phone && <span>{brand.phone}</span>}
            {brand.phone && brand.website && (
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
            )}
            {brand.website && <span>{brand.website}</span>}
          </div>
        )}

        {/* Brokerage logo */}
        {brand.brokerageLogoUrl && (
          <div
            style={{
              marginTop: height * 0.005,
              height: height * 0.03,
              opacity: 0.7,
            }}
          >
            <Img
              src={brand.brokerageLogoUrl}
              style={{
                height: '100%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
