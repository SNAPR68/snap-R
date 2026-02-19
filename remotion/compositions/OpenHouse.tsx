import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { z } from 'zod';
import { ClosingCard } from './ClosingCard';
import { IntroCard } from './IntroCard';
import { EventBadge } from './EventBadge';
import { AudioLayer, audioSchema } from './AudioLayer';
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

export const openHouseSchema = z.object({
  listing: z.object({
    address: z.string(),
    price: z.number(),
    beds: z.number(),
    baths: z.number(),
    sqft: z.number().optional(),
    photos: z.array(z.string()).min(1),
  }),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  openHouseDate: z.string().optional(),
  audio: audioSchema.optional(),
});

export type OpenHouseProps = z.infer<typeof openHouseSchema>;

// ============================================
// CONSTANTS — Faster pacing for urgency
// ============================================

const OH_PHOTO_FRAMES = 105; // 3.5s per photo (vs 4.5s in Showcase)
const OH_WIPE_FRAMES = 30; // 1s wipe transitions (vs 1.5s)
const INTRO_TRANSITION_FRAMES = 30;

// ============================================
// DURATION CALCULATION
// ============================================

/**
 * OpenHouse duration:
 * IntroCard + transition + fast photo slideshow + transition + ClosingCard
 */
export function calculateOpenHouseDuration(photoCount: number): number {
  const introSection = INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES;
  const slideshowSection =
    photoCount * OH_PHOTO_FRAMES - (photoCount - 1) * OH_WIPE_FRAMES;
  const closingTransition = -CROSSFADE_FRAMES;
  return introSection + slideshowSection + closingTransition + CLOSING_CARD_FRAMES;
}

// ============================================
// MAIN COMPOSITION
// ============================================

export const OpenHouse: React.FC<OpenHouseProps> = ({
  listing,
  openHouseDate,
  audio,
}) => {
  const dateText = openHouseDate || 'Open House This Weekend';
  const slideshowDuration =
    listing.photos.length * OH_PHOTO_FRAMES -
    (listing.photos.length - 1) * OH_WIPE_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <TransitionSeries>
        {/* Intro card: "OPEN HOUSE" with date */}
        <TransitionSeries.Sequence durationInFrames={INTRO_CARD_FRAMES}>
          <IntroCard title="Open House" subtitle={dateText} />
        </TransitionSeries.Sequence>

        {/* Wipe transition from intro to photos */}
        <TransitionSeries.Transition
          presentation={wipe({ direction: 'from-left' })}
          timing={linearTiming({ durationInFrames: INTRO_TRANSITION_FRAMES })}
        />

        {/* Fast-paced photo slideshow with wipe transitions */}
        {listing.photos.map((photoUrl, index) => [
          <TransitionSeries.Sequence
            key={`photo-${index}`}
            durationInFrames={OH_PHOTO_FRAMES}
          >
            <PhotoSlide
              src={photoUrl}
              index={index}
              displayFrames={OH_PHOTO_FRAMES}
            />
          </TransitionSeries.Sequence>,

          // Wipe transitions between photos, fade before closing card
          index < listing.photos.length - 1 ? (
            <TransitionSeries.Transition
              key={`transition-${index}`}
              presentation={wipe({
                direction: index % 2 === 0 ? 'from-left' : 'from-right',
              })}
              timing={linearTiming({ durationInFrames: OH_WIPE_FRAMES })}
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
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent address overlay during slideshow */}
      <Sequence
        from={INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES}
        durationInFrames={slideshowDuration}
      >
        <AddressOverlay address={listing.address} />
      </Sequence>

      {/* Event date badge at top during slideshow */}
      <Sequence
        from={INTRO_CARD_FRAMES - INTRO_TRANSITION_FRAMES}
        durationInFrames={slideshowDuration}
      >
        <EventBadge dateText={dateText} />
      </Sequence>

      {/* Audio layer: music, voiceover, silent fallback */}
      <AudioLayer audio={audio} />
    </AbsoluteFill>
  );
};
