import {
  AbsoluteFill,
  Sequence,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { z } from 'zod';
import { HookText } from './HookText';
import { StatsBar } from './StatsBar';
import { ShortFormCTA } from './ShortFormCTA';
import { AudioLayer } from './AudioLayer';
import { fontFamily } from './shared';

export const shortFormSchema = z.object({
  listing: z.object({
    address: z.string().optional(),
    title: z.string().optional(),
    price: z.number().optional(),
    beds: z.number().optional(),
    baths: z.number().optional(),
    sqft: z.number().optional(),
    photos: z.array(z.string()),
  }),
  hookText: z.string().optional(),
  template: z.enum(['teaser', 'reminder', 'alert', 'celebration', 'highlight']).optional(),
  aspectRatio: z.string().optional(),
  brand: z.object({
    agentName: z.string().optional(),
    brokerageName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    tagline: z.string().optional(),
  }).optional(),
  audio: z.object({
    musicTrack: z.string().optional(),
    musicVolume: z.number().optional(),
    voiceoverUrl: z.string().optional(),
    voiceoverVolume: z.number().optional(),
  }).optional(),
});

export type ShortFormProps = z.infer<typeof shortFormSchema>;

const TEMPLATE_STYLES: Record<string, { accentColor: string; badgeText: string }> = {
  teaser: { accentColor: '#D4A017', badgeText: '' },
  reminder: { accentColor: '#FF6B35', badgeText: 'OPEN HOUSE' },
  alert: { accentColor: '#FF3B30', badgeText: 'PRICE DROP' },
  celebration: { accentColor: '#34C759', badgeText: 'SOLD' },
  highlight: { accentColor: '#AF52DE', badgeText: 'FEATURED' },
};

const TOTAL_FRAMES = 450; // 15s at 30fps
const HOOK_FRAMES = 60; // 2s
const PHOTO_SECTION_FRAMES = 300; // 10s for photos
const STATS_START = 180; // Stats appear at 6s
const CTA_FRAMES = 75; // 2.5s

export function calculateShortFormDuration(): number {
  return TOTAL_FRAMES;
}

export const ShortFormTeaser: React.FC<ShortFormProps> = ({
  listing,
  hookText = 'Wait till you see this',
  template = 'teaser',
  brand,
  audio,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const photos = listing.photos.slice(0, 4);
  const templateStyle = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES.teaser;
  const photoDuration = Math.floor(PHOTO_SECTION_FRAMES / Math.max(photos.length, 1));

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', fontFamily }}>
      {/* Audio */}
      {audio && <AudioLayer audio={{
        musicTrack: audio.musicTrack,
        musicVolume: audio.musicVolume ?? 0.3,
        voiceoverUrl: audio.voiceoverUrl,
        voiceoverVolume: audio.voiceoverVolume ?? 1,
      }} />}

      {/* Badge */}
      {templateStyle.badgeText && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              backgroundColor: templateStyle.accentColor,
              color: 'white',
              fontWeight: 800,
              fontSize: height * 0.022,
              padding: '8px 24px',
              borderRadius: 8,
              letterSpacing: '0.15em',
              opacity: interpolate(frame, [0, 15], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `translateY(${interpolate(frame, [0, 15], [-20, 0], {
                easing: Easing.out(Easing.ease),
                extrapolateRight: 'clamp',
              })}px)`,
            }}
          >
            {templateStyle.badgeText}
          </div>
        </div>
      )}

      {/* Hook text overlay */}
      <Sequence from={0} durationInFrames={HOOK_FRAMES}>
        <HookText
          text={hookText}
          accentColor={templateStyle.accentColor}
        />
      </Sequence>

      {/* Photo slides with fast cuts */}
      {photos.map((photoUrl, index) => {
        const startFrame = HOOK_FRAMES + index * photoDuration;
        const transitionDuration = 8; // ~0.27s fade

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={photoDuration}
          >
            <AbsoluteFill>
              <Img
                src={photoUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: interpolate(
                    frame - startFrame,
                    [0, transitionDuration],
                    [0, 1],
                    { extrapolateRight: 'clamp' }
                  ),
                  transform: `scale(${interpolate(
                    frame - startFrame,
                    [0, photoDuration],
                    [1.05, 1.15],
                    { extrapolateRight: 'clamp' }
                  )})`,
                }}
              />
              {/* Gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Stats bar */}
      <Sequence from={STATS_START} durationInFrames={TOTAL_FRAMES - STATS_START - CTA_FRAMES}>
        <StatsBar
          price={listing.price}
          beds={listing.beds}
          baths={listing.baths}
          sqft={listing.sqft}
          accentColor={templateStyle.accentColor}
        />
      </Sequence>

      {/* CTA card */}
      <Sequence from={TOTAL_FRAMES - CTA_FRAMES} durationInFrames={CTA_FRAMES}>
        <ShortFormCTA
          address={listing.address ?? listing.title ?? 'Property'}
          brand={brand ? {
            businessName: brand.agentName,
            phone: brand.phone,
            website: brand.website,
            primaryColor: brand.primaryColor,
          } : undefined}
          accentColor={templateStyle.accentColor}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
