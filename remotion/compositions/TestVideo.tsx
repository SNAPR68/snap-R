import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { z } from 'zod';

export const testVideoSchema = z.object({
  listing: z.object({
    address: z.string(),
    price: z.number(),
    beds: z.number(),
    baths: z.number(),
    photos: z.array(z.string()),
  }),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
});

export type TestVideoProps = z.infer<typeof testVideoSchema>;

export const TestVideo = ({ listing }: TestVideoProps) => {
  const frame = useCurrentFrame();

  // Fade-in animation over first 30 frames
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Format price with locale string
  const formattedPrice = `$${listing.price.toLocaleString()}`;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      {/* Background photo with fade-in */}
      {listing.photos.length > 0 && (
        <Img
          src={listing.photos[0]}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity,
          }}
        />
      )}

      {/* Text overlay at bottom */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          padding: '40px',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '8px' }}>
            {listing.address}
          </div>
          <div style={{ fontSize: '64px', fontWeight: 900, marginBottom: '12px' }}>
            {formattedPrice}
          </div>
          <div style={{ fontSize: '36px', fontWeight: 500 }}>
            {listing.beds} Beds · {listing.baths} Baths
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
