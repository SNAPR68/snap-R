import { Audio } from '@remotion/media';
import { interpolate, staticFile, useVideoConfig } from 'remotion';
import { z } from 'zod';

// ============================================
// SCHEMA
// ============================================

export const audioSchema = z.object({
  musicTrack: z.string().optional(),
  musicUrl: z.string().optional(),
  musicVolume: z.number().min(0).max(1).default(0.3),
  voiceoverUrl: z.string().optional(),
  voiceoverVolume: z.number().min(0).max(1).default(1),
});

export type AudioProps = z.infer<typeof audioSchema>;

// ============================================
// CONSTANTS
// ============================================

const FADE_FRAMES = 30; // 1 second at 30fps

// Available static music tracks
const STATIC_TRACKS = ['upbeat', 'elegant', 'cinematic', 'ambient', 'corporate'];

// ============================================
// COMPONENT
// ============================================

interface AudioLayerProps {
  audio?: AudioProps;
}

export const AudioLayer: React.FC<AudioLayerProps> = ({ audio }) => {
  const { durationInFrames } = useVideoConfig();

  if (!audio) {
    // No audio config — render silent track for platform compatibility
    return (
      <Audio
        src={staticFile('music/silent.mp3')}
        loop
        volume={0}
      />
    );
  }

  const {
    musicTrack,
    musicUrl,
    musicVolume = 0.3,
    voiceoverUrl,
    voiceoverVolume = 1,
  } = audio;

  const hasMusic = musicTrack || musicUrl;
  const hasVoiceover = !!voiceoverUrl;

  // Resolve music source
  let musicSrc: string | undefined;
  if (musicUrl) {
    musicSrc = musicUrl;
  } else if (musicTrack && STATIC_TRACKS.includes(musicTrack)) {
    musicSrc = staticFile(`music/${musicTrack}.mp3`);
  }

  // Volume callback with fade in/out and voiceover ducking
  const makeMusicVolume = (baseVolume: number, duck: boolean) => {
    return (frame: number): number => {
      const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
        extrapolateRight: 'clamp',
      });
      const fadeOut = interpolate(
        frame,
        [durationInFrames - FADE_FRAMES, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp' }
      );
      const fade = Math.min(fadeIn, fadeOut);
      const duckMultiplier = duck ? 0.3 : 1.0;
      return baseVolume * fade * duckMultiplier;
    };
  };

  return (
    <>
      {/* Background music */}
      {musicSrc && (
        <Audio
          src={musicSrc}
          loop
          volume={makeMusicVolume(musicVolume, hasVoiceover)}
        />
      )}

      {/* Voiceover */}
      {voiceoverUrl && (
        <Audio
          src={voiceoverUrl}
          volume={voiceoverVolume}
        />
      )}

      {/* Silent track for platform compatibility when no audio */}
      {!hasMusic && !hasVoiceover && (
        <Audio
          src={staticFile('music/silent.mp3')}
          loop
          volume={0}
        />
      )}
    </>
  );
};
