import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { loadFont } from '@remotion/google-fonts/Inter';
import { z } from 'zod';
import { ClosingCard } from './ClosingCard';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700'],
  subsets: ['latin'],
});

// ============================================
// SCHEMA
// ============================================

export const propertyShowcaseSchema = z.object({
  listing: z.object({
    address: z.string(),
    price: z.number(),
    beds: z.number(),
    baths: z.number(),
    sqft: z.number().optional(),
    photos: z.array(z.string()).min(1),
  }),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
});

export type PropertyShowcaseProps = z.infer<typeof propertyShowcaseSchema>;

// ============================================
// CONSTANTS
// ============================================

const PHOTO_DISPLAY_FRAMES = 135; // 4.5s per photo
const CROSSFADE_FRAMES = 45; // 1.5s crossfade
const CLOSING_CARD_FRAMES = 90; // 3s closing card

/**
 * Calculate total duration in frames for a given photo count.
 * TransitionSeries shortens timeline by crossfade duration per transition.
 * N photos = N sequences + (N-1) transitions + closing card sequence + 1 transition to closing.
 * Total = N * PHOTO_DISPLAY_FRAMES - (N-1) * CROSSFADE_FRAMES + CLOSING_CARD_FRAMES - CROSSFADE_FRAMES
 *       = N * (PHOTO_DISPLAY_FRAMES - CROSSFADE_FRAMES) + CROSSFADE_FRAMES + CLOSING_CARD_FRAMES - CROSSFADE_FRAMES
 *       = N * 90 + CLOSING_CARD_FRAMES
 */
export function calculateDuration(photoCount: number): number {
  const effectivePerPhoto = PHOTO_DISPLAY_FRAMES - CROSSFADE_FRAMES;
  // N photos: sum of sequences minus overlaps, plus closing card minus its overlap
  return photoCount * effectivePerPhoto + CROSSFADE_FRAMES + CLOSING_CARD_FRAMES - CROSSFADE_FRAMES;
}

// ============================================
// PHOTO SLIDE COMPONENT
// ============================================

interface PhotoSlideProps {
  src: string;
  index: number;
}

const PhotoSlide: React.FC<PhotoSlideProps> = ({ src, index }) => {
  const frame = useCurrentFrame();

  // Ken Burns: alternating zoom in/out with subtle pan
  const isEven = index % 2 === 0;

  const scale = interpolate(
    frame,
    [0, PHOTO_DISPLAY_FRAMES],
    isEven ? [1.0, 1.1] : [1.1, 1.0],
    {
      easing: Easing.inOut(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const translateX = interpolate(
    frame,
    [0, PHOTO_DISPLAY_FRAMES],
    isEven ? [-0.02, 0.02] : [0.02, -0.02],
    {
      easing: Easing.inOut(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateX(${translateX * 100}%)`,
        }}
        onError={(e) => {
          // Fallback: hide broken image, gray bg shows through
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Dark gradient at bottom for text readability */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 30%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================
// ADDRESS OVERLAY
// ============================================

interface AddressOverlayProps {
  address: string;
}

const AddressOverlay: React.FC<AddressOverlayProps> = ({ address }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // Fade in over first 20 frames
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const fontSize = height * 0.035;
  const padding = width * 0.04;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        padding,
        paddingBottom: padding * 1.5,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 600,
          color: 'white',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
          letterSpacing: '0.02em',
        }}
      >
        {address}
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// MAIN COMPOSITION
// ============================================

export const PropertyShowcase: React.FC<PropertyShowcaseProps> = ({
  listing,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <TransitionSeries>
        {listing.photos.map((photoUrl, index) => [
          // Photo slide
          <TransitionSeries.Sequence
            key={`photo-${index}`}
            durationInFrames={PHOTO_DISPLAY_FRAMES}
          >
            <PhotoSlide src={photoUrl} index={index} />
          </TransitionSeries.Sequence>,

          // Crossfade transition after each photo (including before closing card)
          <TransitionSeries.Transition
            key={`transition-${index}`}
            presentation={fade()}
            timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
          />,
        ])}

        {/* Closing card */}
        <TransitionSeries.Sequence durationInFrames={CLOSING_CARD_FRAMES}>
          <ClosingCard
            address={listing.address}
            price={listing.price}
            beds={listing.beds}
            baths={listing.baths}
            sqft={listing.sqft}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent address overlay on top of slideshow (not on closing card) */}
      <Sequence
        durationInFrames={
          calculateDuration(listing.photos.length) - CLOSING_CARD_FRAMES
        }
      >
        <AddressOverlay address={listing.address} />
      </Sequence>
    </AbsoluteFill>
  );
};
