import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { z } from 'zod';
import { ClosingCard } from './ClosingCard';
import { IntroCard } from './IntroCard';
import { SoldBadge } from './SoldBadge';
import { AudioLayer, audioSchema } from './AudioLayer';
import { BrandWatermark, BrandFooter, brandSchema } from './BrandOverlay';
import {
  PhotoSlide,
  AddressOverlay,
  PHOTO_DISPLAY_FRAMES,
  CROSSFADE_FRAMES,
  CLOSING_CARD_FRAMES,
  INTRO_CARD_FRAMES,
} from './shared';

// ============================================
// SCHEMA
// ============================================

export const soldSchema = z.object({
  listing: z.object({
    address: z.string(),
    price: z.number().optional(),
    beds: z.number().optional(),
    baths: z.number().optional(),
    sqft: z.number().optional(),
    photos: z.array(z.string()).min(1),
    daysOnMarket: z.number().optional(),
  }),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  audio: audioSchema.optional(),
  brand: brandSchema.optional(),
});

export type SoldProps = z.infer<typeof soldSchema>;

// ============================================
// CONSTANTS — Standard pacing (celebratory, not urgent)
// ============================================

const SOLD_PHOTO_FRAMES = PHOTO_DISPLAY_FRAMES; // 4.5s per photo (leisurely pace)
const SOLD_TRANSITION_FRAMES = CROSSFADE_FRAMES; // 1.5s slide transitions
const INTRO_TRANSITION_FRAMES = 30;

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * Sold duration:
 * IntroCard + transition + photo slideshow + transition + ClosingCard
 */
export function calculateSoldDuration(photoCount: number): number {
  const introSection = INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES;
  const slideshowSection =
    photoCount * SOLD_PHOTO_FRAMES -
    (photoCount - 1) * SOLD_TRANSITION_FRAMES;
  const closingTransition = -CROSSFADE_FRAMES;
  return introSection + slideshowSection + closingTransition + CLOSING_CARD_FRAMES;
}

// ============================================
// MAIN COMPOSITION
// ============================================

export const Sold: React.FC<SoldProps> = ({ listing, audio, brand }) => {
  const daysOnMarket = listing.daysOnMarket;
  const slideshowStart = INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES;
  const slideshowDuration =
    listing.photos.length * SOLD_PHOTO_FRAMES -
    (listing.photos.length - 1) * SOLD_TRANSITION_FRAMES;
  const closingStart = slideshowStart + slideshowDuration;

  // Build intro subtitle with social proof
  const introSubtitle = daysOnMarket
    ? `${listing.address} · Sold in ${daysOnMarket} Days`
    : listing.address;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <TransitionSeries>
        {/* Intro card: "SOLD" with celebration */}
        <TransitionSeries.Sequence durationInFrames={INTRO_CARD_FRAMES}>
          <IntroCard title="Sold" subtitle={introSubtitle} />
        </TransitionSeries.Sequence>

        {/* Slide transition from intro to photos */}
        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: INTRO_TRANSITION_FRAMES })}
        />

        {/* Photo slideshow with alternating slide directions */}
        {listing.photos.map((photoUrl, index) => [
          <TransitionSeries.Sequence
            key={`photo-${index}`}
            durationInFrames={SOLD_PHOTO_FRAMES}
          >
            <PhotoSlide src={photoUrl} index={index} />
          </TransitionSeries.Sequence>,

          // Slide transitions between photos, fade before closing card
          index < listing.photos.length - 1 ? (
            <TransitionSeries.Transition
              key={`transition-${index}`}
              presentation={slide({
                direction: index % 2 === 0 ? 'from-right' : 'from-left',
              })}
              timing={linearTiming({
                durationInFrames: SOLD_TRANSITION_FRAMES,
              })}
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
            primaryColor="#8B5CF6"
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

      {/* Sold badge at top during slideshow */}
      <Sequence from={slideshowStart} durationInFrames={slideshowDuration}>
        <SoldBadge daysOnMarket={daysOnMarket} />
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
