import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { z } from 'zod';
import { ClosingCard } from './ClosingCard';
import { IntroCard } from './IntroCard';
import { FeatureCallout } from './FeatureCallout';
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

export const justListedSchema = z.object({
  listing: z.object({
    address: z.string(),
    price: z.number().optional(),
    beds: z.number().optional(),
    baths: z.number().optional(),
    sqft: z.number().optional(),
    photos: z.array(z.string()).min(1),
    features: z.array(z.string()).optional(),
  }),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  audio: audioSchema.optional(),
  brand: brandSchema.optional(),
});

export type JustListedProps = z.infer<typeof justListedSchema>;

// ============================================
// CONSTANTS
// ============================================

const INTRO_TRANSITION_FRAMES = 30; // 1s transition from intro to slideshow
const SLIDE_TRANSITION_FRAMES = CROSSFADE_FRAMES; // 1s slide transitions

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * JustListed duration:
 * IntroCard + transition + photo slideshow + transition + ClosingCard
 * IntroCard: INTRO_CARD_FRAMES (75)
 * Transition into slideshow: INTRO_TRANSITION_FRAMES (30) — overlaps
 * N photos with slide transitions: N * PHOTO_DISPLAY_FRAMES - (N-1) * SLIDE_TRANSITION_FRAMES
 * Transition into closing: CROSSFADE_FRAMES (30) — overlaps
 * ClosingCard: CLOSING_CARD_FRAMES (90)
 */
export function calculateJustListedDuration(photoCount: number): number {
  const introSection = INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES;
  const slideshowSection =
    photoCount * PHOTO_DISPLAY_FRAMES -
    (photoCount - 1) * SLIDE_TRANSITION_FRAMES;
  const closingTransition = -CROSSFADE_FRAMES;
  return introSection + slideshowSection + closingTransition + CLOSING_CARD_FRAMES;
}

// ============================================
// MAIN COMPOSITION
// ============================================

export const JustListed: React.FC<JustListedProps> = ({ listing, audio, brand }) => {
  const features = listing.features ?? [];
  const slideshowStart = INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES;
  const slideshowDuration =
    listing.photos.length * PHOTO_DISPLAY_FRAMES -
    (listing.photos.length - 1) * SLIDE_TRANSITION_FRAMES;
  const closingStart = slideshowStart + slideshowDuration;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <TransitionSeries>
        {/* Intro card: "JUST LISTED" */}
        <TransitionSeries.Sequence durationInFrames={INTRO_CARD_FRAMES}>
          <IntroCard title="Just Listed" subtitle={listing.address} />
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
            durationInFrames={PHOTO_DISPLAY_FRAMES}
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
                durationInFrames: SLIDE_TRANSITION_FRAMES,
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
            primaryColor={brand?.primaryColor}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent address overlay during slideshow (after intro, before closing) */}
      <Sequence
        from={slideshowStart}
        durationInFrames={slideshowDuration}
      >
        <AddressOverlay address={listing.address} />
      </Sequence>

      {/* Brand watermark (logo) during slideshow */}
      <Sequence
        from={slideshowStart}
        durationInFrames={slideshowDuration}
      >
        <BrandWatermark brand={brand} />
      </Sequence>

      {/* Feature callouts overlaid on photos (one feature per photo) */}
      {features.length > 0 &&
        listing.photos.map((_, index) => {
          const feature = features[index % features.length];
          const photoStart =
            slideshowStart +
            index * (PHOTO_DISPLAY_FRAMES - SLIDE_TRANSITION_FRAMES);
          return (
            <Sequence
              key={`feature-${index}`}
              from={photoStart}
              durationInFrames={PHOTO_DISPLAY_FRAMES}
            >
              <FeatureCallout feature={feature} />
            </Sequence>
          );
        })}

      {/* Brand footer on closing card */}
      <Sequence from={closingStart} durationInFrames={CLOSING_CARD_FRAMES}>
        <BrandFooter brand={brand} />
      </Sequence>

      {/* Audio layer: music, voiceover, silent fallback */}
      <AudioLayer audio={audio} />
    </AbsoluteFill>
  );
};
