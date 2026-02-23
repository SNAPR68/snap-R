import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { z } from 'zod';
import { ClosingCard } from './ClosingCard';
import { AudioLayer, audioSchema } from './AudioLayer';
import { BrandWatermark, BrandFooter, brandSchema } from './BrandOverlay';
import {
  PhotoSlide,
  AddressOverlay,
  PHOTO_DISPLAY_FRAMES,
  CROSSFADE_FRAMES,
  CLOSING_CARD_FRAMES,
} from './shared';

// ============================================
// SCHEMA
// ============================================

export const propertyShowcaseSchema = z.object({
  listing: z.object({
    address: z.string(),
    price: z.number().optional(),
    beds: z.number().optional(),
    baths: z.number().optional(),
    sqft: z.number().optional(),
    photos: z.array(z.string()).min(1),
  }),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  audio: audioSchema.optional(),
  brand: brandSchema.optional(),
});

export type PropertyShowcaseProps = z.infer<typeof propertyShowcaseSchema>;

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * Calculate total duration in frames for a given photo count.
 * TransitionSeries shortens timeline by crossfade duration per transition.
 */
export function calculateDuration(photoCount: number): number {
  const effectivePerPhoto = PHOTO_DISPLAY_FRAMES - CROSSFADE_FRAMES;
  return photoCount * effectivePerPhoto + CROSSFADE_FRAMES + CLOSING_CARD_FRAMES - CROSSFADE_FRAMES;
}

// ============================================
// MAIN COMPOSITION
// ============================================

export const PropertyShowcase: React.FC<PropertyShowcaseProps> = ({
  listing,
  audio,
  brand,
}) => {
  const slideshowDuration = calculateDuration(listing.photos.length) - CLOSING_CARD_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <TransitionSeries>
        {listing.photos.map((photoUrl, index) => [
          <TransitionSeries.Sequence
            key={`photo-${index}`}
            durationInFrames={PHOTO_DISPLAY_FRAMES}
          >
            <PhotoSlide src={photoUrl} index={index} />
          </TransitionSeries.Sequence>,

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
            primaryColor={brand?.primaryColor}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent address overlay on top of slideshow (not on closing card) */}
      <Sequence durationInFrames={slideshowDuration}>
        <AddressOverlay address={listing.address} />
      </Sequence>

      {/* Brand watermark (logo) during slideshow */}
      <Sequence durationInFrames={slideshowDuration}>
        <BrandWatermark brand={brand} />
      </Sequence>

      {/* Brand footer on closing card */}
      <Sequence from={slideshowDuration} durationInFrames={CLOSING_CARD_FRAMES}>
        <BrandFooter brand={brand} />
      </Sequence>

      {/* Audio layer: music, voiceover, silent fallback */}
      <AudioLayer audio={audio} />
    </AbsoluteFill>
  );
};
