import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { z } from 'zod';
import { ClosingCard } from './ClosingCard';
import { IntroCard } from './IntroCard';
import { PriceDropBadge } from './PriceDropBadge';
import { AudioLayer, audioSchema } from './AudioLayer';
import { BrandWatermark, BrandFooter, brandSchema } from './BrandOverlay';
import {
  PhotoSlide,
  AddressOverlay,
  CROSSFADE_FRAMES,
  CLOSING_CARD_FRAMES,
  INTRO_CARD_FRAMES,
} from './shared';

// ============================================
// SCHEMA
// ============================================

export const priceDropSchema = z.object({
  listing: z.object({
    address: z.string(),
    price: z.number().optional(),
    beds: z.number().optional(),
    baths: z.number().optional(),
    sqft: z.number().optional(),
    photos: z.array(z.string()).min(1),
    previousPrice: z.number().optional(),
  }),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  audio: audioSchema.optional(),
  brand: brandSchema.optional(),
});

export type PriceDropProps = z.infer<typeof priceDropSchema>;

// ============================================
// CONSTANTS — Urgency pacing (same as OpenHouse)
// ============================================

const PD_PHOTO_FRAMES = 75; // 2.5s per photo (urgency)
const PD_SLIDE_FRAMES = 20; // 0.67s slide transitions
const INTRO_TRANSITION_FRAMES = 30;

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * PriceDrop duration:
 * IntroCard + transition + fast photo slideshow + transition + ClosingCard
 */
export function calculatePriceDropDuration(photoCount: number): number {
  const introSection = INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES;
  const slideshowSection =
    photoCount * PD_PHOTO_FRAMES - (photoCount - 1) * PD_SLIDE_FRAMES;
  const closingTransition = -CROSSFADE_FRAMES;
  return introSection + slideshowSection + closingTransition + CLOSING_CARD_FRAMES;
}

// ============================================
// MAIN COMPOSITION
// ============================================

export const PriceDrop: React.FC<PriceDropProps> = ({ listing, audio, brand }) => {
  const previousPrice = listing.previousPrice;
  const slideshowStart = INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES;
  const slideshowDuration =
    listing.photos.length * PD_PHOTO_FRAMES -
    (listing.photos.length - 1) * PD_SLIDE_FRAMES;
  const closingStart = slideshowStart + slideshowDuration;

  // Calculate savings for badge
  const currentPrice = listing.price ?? 0;
  const savings =
    previousPrice && currentPrice && previousPrice > currentPrice
      ? previousPrice - currentPrice
      : undefined;

  // Build intro subtitle with price drop info
  const introSubtitle = savings && currentPrice
    ? `Now $${currentPrice.toLocaleString()} · Save $${savings.toLocaleString()}`
    : listing.address;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <TransitionSeries>
        {/* Intro card: "PRICE REDUCED" */}
        <TransitionSeries.Sequence durationInFrames={INTRO_CARD_FRAMES}>
          <IntroCard title="Price Reduced" subtitle={introSubtitle} />
        </TransitionSeries.Sequence>

        {/* Slide transition from intro to photos */}
        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: INTRO_TRANSITION_FRAMES })}
        />

        {/* Fast-paced photo slideshow with alternating slide directions */}
        {listing.photos.map((photoUrl, index) => [
          <TransitionSeries.Sequence
            key={`photo-${index}`}
            durationInFrames={PD_PHOTO_FRAMES}
          >
            <PhotoSlide
              src={photoUrl}
              index={index}
              displayFrames={PD_PHOTO_FRAMES}
            />
          </TransitionSeries.Sequence>,

          // Slide transitions between photos, fade before closing card
          index < listing.photos.length - 1 ? (
            <TransitionSeries.Transition
              key={`transition-${index}`}
              presentation={slide({
                direction: index % 2 === 0 ? 'from-right' : 'from-left',
              })}
              timing={linearTiming({ durationInFrames: PD_SLIDE_FRAMES })}
            />
          ) : (
            <TransitionSeries.Transition
              key={`transition-${index}`}
              presentation={fade()}
              timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
            />
          ),
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

      {/* Persistent address overlay during slideshow */}
      <Sequence from={slideshowStart} durationInFrames={slideshowDuration}>
        <AddressOverlay address={listing.address} />
      </Sequence>

      {/* Brand watermark (logo) during slideshow */}
      <Sequence from={slideshowStart} durationInFrames={slideshowDuration}>
        <BrandWatermark brand={brand} />
      </Sequence>

      {/* Price drop badge at top during slideshow */}
      <Sequence from={slideshowStart} durationInFrames={slideshowDuration}>
        <PriceDropBadge
          currentPrice={currentPrice}
          previousPrice={previousPrice}
        />
      </Sequence>

      {/* Brand footer on closing card */}
      <Sequence from={closingStart} durationInFrames={CLOSING_CARD_FRAMES}>
        <BrandFooter brand={brand} />
      </Sequence>

      {/* Audio layer: music, voiceover, silent fallback */}
      <AudioLayer audio={audio} />
    </AbsoluteFill>
  );
};
