import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Easing,
} from 'remotion';
import { Audio } from '@remotion/media';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { z } from 'zod';
import { loadFont } from '@remotion/google-fonts/Inter';

// ============================================
// FONT
// ============================================

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

// ============================================
// SCHEMA
// ============================================

export const explainerVideoSchema = z.object({
  showCaptions: z.boolean().default(true),
});

export type ExplainerVideoProps = z.infer<typeof explainerVideoSchema>;

// ============================================
// FRAME DEFINITIONS
// ============================================

interface SceneConfig {
  id: string;
  label: string;
  caption: string;
  frames: string[];
  durationSec: number;
  kenBurns: {
    startScale: number;
    endScale: number;
    panX: number;
    panY: number;
  };
}

// All captured screenshot frames, organized by scene
const SCENES: SceneConfig[] = [
  {
    id: 'homepage-hero',
    label: 'Meet SnapR',
    caption: 'The AI-powered platform for real estate marketing',
    frames: [
      '0000_homepage_hero.png',
      '0001_homepage_scroll_0.png',
      '0002_homepage_scroll_1.png',
      '0003_homepage_scroll_2.png',
      '0004_homepage_scroll_3.png',
      '0005_homepage_scroll_4.png',
      '0006_homepage_scroll_5.png',
    ],
    durationSec: 11,
    kenBurns: { startScale: 1.05, endScale: 1.0, panX: 0, panY: -15 },
  },
  {
    id: 'features',
    label: 'Features & Gallery',
    caption: 'Fifteen AI enhancement tools at your fingertips',
    frames: [
      '0007_homepage_features_scroll_0.png',
      '0008_homepage_features_scroll_1.png',
      '0009_homepage_features_scroll_2.png',
      '0010_homepage_features_scroll_3.png',
      '0011_homepage_features_scroll_4.png',
      '0012_homepage_features_scroll_5.png',
      '0013_homepage_features_scroll_6.png',
      '0014_homepage_features_scroll_7.png',
      '0015_homepage_demo_scroll_0.png',
      '0016_homepage_demo_scroll_1.png',
      '0017_homepage_demo_scroll_2.png',
      '0018_homepage_demo_scroll_3.png',
      '0019_homepage_demo_scroll_4.png',
      '0020_homepage_demo_scroll_5.png',
      '0021_homepage_demo_scroll_6.png',
      '0022_homepage_demo_scroll_7.png',
      '0023_homepage_demo_scroll_8.png',
      '0024_homepage_demo_scroll_9.png',
    ],
    durationSec: 7,
    kenBurns: { startScale: 1.0, endScale: 1.05, panX: 0, panY: 10 },
  },
  {
    id: 'pricing',
    label: 'Pricing',
    caption: 'Choose the plan that fits your business',
    frames: [
      '0025_pricing_section.png',
      '0026_pricing_scroll_0.png',
      '0027_pricing_scroll_1.png',
      '0028_pricing_scroll_2.png',
      '0029_pricing_scroll_3.png',
    ],
    durationSec: 6,
    kenBurns: { startScale: 1.0, endScale: 1.03, panX: 0, panY: -5 },
  },
  {
    id: 'signup',
    label: 'Getting Started',
    caption: 'Set up your brand in under a minute',
    frames: [
      '0030_signup_page.png',
      '0031_signup_typing.png',
    ],
    durationSec: 7,
    kenBurns: { startScale: 1.02, endScale: 1.0, panX: 0, panY: 0 },
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    caption: 'Your complete view of every listing',
    frames: [
      '0053_login_clean.png',
      '0054_login_filled.png',
      '0055_dashboard_main.png',
      '0056_dashboard_scroll_0.png',
      '0057_dashboard_scroll_1.png',
      '0058_dashboard_scroll_2.png',
      '0059_dashboard_scroll_3.png',
      '0060_dashboard_scroll_4.png',
    ],
    durationSec: 10,
    kenBurns: { startScale: 1.0, endScale: 1.04, panX: 5, panY: 8 },
  },
  {
    id: 'studio',
    label: 'AI Studio',
    caption: 'Sky replacement, virtual twilight, staging — fifteen tools',
    frames: [
      '0061_listings_page.png',
      '0062_listings_scroll_0.png',
      '0063_listings_scroll_1.png',
      '0064_listings_scroll_2.png',
      '0065_studio_main.png',
      '0066_studio_scroll_0.png',
      '0067_studio_scroll_1.png',
      '0068_studio_scroll_2.png',
    ],
    durationSec: 15,
    kenBurns: { startScale: 1.03, endScale: 1.0, panX: -5, panY: 5 },
  },
  {
    id: 'marketing',
    label: 'Marketing & Content Studio',
    caption: 'AI generates descriptions, captions, and property websites',
    frames: [
      '0069_content_studio.png',
      '0070_content_studio_scroll_0.png',
      '0071_content_studio_scroll_1.png',
      '0072_content_studio_scroll_2.png',
    ],
    durationSec: 10,
    kenBurns: { startScale: 1.0, endScale: 1.04, panX: 0, panY: -8 },
  },
  {
    id: 'analytics',
    label: 'Analytics',
    caption: 'Schedule, publish, and track performance',
    frames: [
      '0073_analytics.png',
      '0074_analytics_scroll_0.png',
      '0075_analytics_scroll_1.png',
      '0076_analytics_scroll_2.png',
      '0077_campaigns.png',
      '0078_campaigns_scroll_0.png',
      '0079_campaigns_scroll_1.png',
    ],
    durationSec: 10,
    kenBurns: { startScale: 1.02, endScale: 1.0, panX: 5, panY: -5 },
  },
  {
    id: 'closing',
    label: 'Start Free Trial',
    caption: 'From photos to published listing in under ten minutes',
    frames: [
      '0052_final_cta.png',
    ],
    durationSec: 8,
    kenBurns: { startScale: 1.0, endScale: 1.08, panX: 0, panY: 0 },
  },
];

const FPS = 30;
const TRANSITION_FRAMES = 15;
const INTRO_DURATION = 3 * FPS;
const CLOSING_CARD_DURATION = 5 * FPS;

// ============================================
// DURATION CALCULATION
// ============================================

export function calculateExplainerDuration(): number {
  const sceneFrames = SCENES.reduce(
    (sum, scene) => sum + scene.durationSec * FPS,
    0,
  );
  // intro + scenes + closing, minus transitions between all
  const totalSequences = 1 + SCENES.length + 1; // intro + scenes + closing
  const transitionCount = totalSequences - 1;
  return INTRO_DURATION + sceneFrames + CLOSING_CARD_DURATION - transitionCount * TRANSITION_FRAMES;
}

// ============================================
// SLIDESHOW SCENE COMPONENT
// ============================================

const SlideshowScene: React.FC<{
  scene: SceneConfig;
  showCaptions: boolean;
}> = ({ scene, showCaptions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { frames, kenBurns, durationSec, caption, label } = scene;
  const totalFrames = durationSec * fps;

  // Ken Burns: smooth scale and pan over the scene duration
  const scale = interpolate(
    frame,
    [0, totalFrames],
    [kenBurns.startScale, kenBurns.endScale],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const panX = interpolate(frame, [0, totalFrames], [0, kenBurns.panX], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const panY = interpolate(frame, [0, totalFrames], [0, kenBurns.panY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Which frame of the screenshot sequence to show
  const framesPerShot = totalFrames / frames.length;
  const currentFrameIndex = Math.min(
    frames.length - 1,
    Math.floor(frame / framesPerShot),
  );

  // Crossfade between consecutive screenshots
  const positionInShot = frame - currentFrameIndex * framesPerShot;
  const nextFrameIndex = Math.min(frames.length - 1, currentFrameIndex + 1);
  const crossfadeDuration = Math.min(8, framesPerShot * 0.3);
  const crossfadeProgress =
    currentFrameIndex < frames.length - 1
      ? interpolate(
          positionInShot,
          [framesPerShot - crossfadeDuration, framesPerShot],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        )
      : 0;

  // Caption animation
  const captionOpacity = interpolate(
    frame,
    [10, 25, totalFrames - 15, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const captionY = interpolate(frame, [10, 25], [20, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', overflow: 'hidden' }}>
      {/* Current screenshot */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
          willChange: 'transform',
        }}
      >
        <Img
          src={staticFile(`explainer-frames/${frames[currentFrameIndex]}`)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Next screenshot (crossfade) */}
      {crossfadeProgress > 0 && nextFrameIndex !== currentFrameIndex && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: crossfadeProgress,
            transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
            willChange: 'transform',
          }}
        >
          <Img
            src={staticFile(`explainer-frames/${frames[nextFrameIndex]}`)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Step label badge */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: interpolate(frame, [0, 12], [0, 1], {
            extrapolateRight: 'clamp',
          }),
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 13,
            fontWeight: 800,
            color: '#0A0A0A',
            backgroundColor: '#D4A017',
            padding: '5px 12px',
            borderRadius: 6,
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </div>
      </div>

      {/* Caption overlay */}
      {showCaptions && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            opacity: captionOpacity,
            transform: `translateY(${captionY}px)`,
            zIndex: 10,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 12,
              padding: '12px 28px',
              maxWidth: '80%',
              textAlign: 'center',
              border: '1px solid rgba(212, 160, 23, 0.25)',
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: 28,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.01em',
              }}
            >
              {caption}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ============================================
// INTRO CARD
// ============================================

const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const logoScale = interpolate(frame, [0, 20], [0.7, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateRight: 'clamp',
  });
  const taglineOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taglineY = interpolate(frame, [25, 45], [15, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse at center, #1A1A1A 0%, #0A0A0A 70%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: '1px solid rgba(212, 160, 23, 0.08)',
          opacity: logoOpacity * 0.5,
          transform: `scale(${logoScale * 1.5})`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.02,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: height * 0.1,
            fontWeight: 800,
            color: 'white',
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            letterSpacing: '-0.02em',
          }}
        >
          Snap<span style={{ color: '#D4A017' }}>R</span>
        </div>

        <div
          style={{
            fontFamily,
            fontSize: height * 0.026,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          AI-Powered Real Estate Marketing
        </div>

        <div
          style={{
            fontFamily,
            fontSize: height * 0.02,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.45)',
            opacity: subOpacity,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Photos to published listing in under 10 minutes
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// CLOSING CTA CARD
// ============================================

const ClosingCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const logoScale = interpolate(frame, [0, 15], [0.6, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateRight: 'clamp',
  });
  const taglineOpacity = interpolate(frame, [18, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ctaOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ctaScale = interpolate(frame, [40, 55], [0.9, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse at center, #1A1A1A 0%, #0A0A0A 70%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.025,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: height * 0.09,
            fontWeight: 800,
            color: 'white',
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            letterSpacing: '-0.02em',
          }}
        >
          Snap<span style={{ color: '#D4A017' }}>R</span>
        </div>

        <div
          style={{
            fontFamily,
            fontSize: height * 0.026,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            opacity: taglineOpacity,
            textAlign: 'center',
            maxWidth: width * 0.7,
            lineHeight: 1.5,
          }}
        >
          From photos to published listing in under 10 minutes.
        </div>

        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            marginTop: height * 0.015,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: height * 0.024,
              fontWeight: 700,
              color: '#0A0A0A',
              backgroundColor: '#D4A017',
              padding: `${height * 0.014}px ${width * 0.04}px`,
              borderRadius: 12,
              letterSpacing: '0.02em',
            }}
          >
            Start Your Free Trial
          </div>
        </div>

        <div
          style={{
            fontFamily,
            fontSize: height * 0.017,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.4)',
            opacity: ctaOpacity,
            marginTop: 6,
          }}
        >
          snap-r.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================
// MAIN COMPOSITION
// ============================================

export const ExplainerVideo: React.FC<ExplainerVideoProps> = ({
  showCaptions,
}) => {
  // Build the scene sequence elements
  const sceneElements: React.ReactNode[] = [];

  SCENES.forEach((scene, i) => {
    sceneElements.push(
      <TransitionSeries.Sequence
        key={scene.id}
        durationInFrames={scene.durationSec * FPS}
      >
        <SlideshowScene scene={scene} showCaptions={showCaptions} />
      </TransitionSeries.Sequence>,
    );

    if (i < SCENES.length - 1) {
      sceneElements.push(
        <TransitionSeries.Transition
          key={`transition-${scene.id}`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      {/* Voiceover audio — plays full duration */}
      <Audio src={staticFile('explainer-voiceover.mp3')} volume={1} />

      <TransitionSeries>
        {/* Intro card */}
        <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
          <IntroCard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Screenshot scenes */}
        {sceneElements}

        {/* Closing CTA card */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={CLOSING_CARD_DURATION}>
          <ClosingCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
