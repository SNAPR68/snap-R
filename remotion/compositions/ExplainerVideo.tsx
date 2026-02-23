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
// FRAME DEFINITIONS — synced to v2 capture (51 frames: 0000-0050)
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

// Voiceover timing plan:
//   Intro card:         0-3s    (no voiceover — music intro)
//   Homepage hero:      3-14s   → "Meet SnapR — the AI-powered platform..."
//   Features/gallery:   14-23s  → "Scroll through stunning before-and-after..."
//   AI tools:           23-30s  → "Sky replacement, virtual twilight..."
//   Pricing:            30-38s  → "Choose the plan that fits..."
//   Signup:             38-43s  → "Getting started takes under a minute..."
//   Login+Dashboard:    43-55s  → "Sign in and your dashboard gives you..."
//   Listings+Studio:    55-68s  → "Browse your listings, then open the AI Studio..."
//   Content Studio:     68-78s  → "Once your photos are ready, head to..."
//   Analytics+Brand:    78-85s  → "Track performance in Analytics..."
//   Closing CTA:        85-92s  → "SnapR — from photos to published listing..."

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
    ],
    durationSec: 11,
    kenBurns: { startScale: 1.05, endScale: 1.0, panX: 0, panY: -12 },
  },
  {
    id: 'features-gallery',
    label: 'Before & After',
    caption: 'Stunning transformations that sell faster',
    frames: [
      '0005_features_scroll_0.png',
      '0006_features_scroll_1.png',
      '0007_features_scroll_2.png',
      '0008_features_scroll_3.png',
      '0009_features_scroll_4.png',
      '0010_gallery_scroll_0.png',
      '0011_gallery_scroll_1.png',
      '0012_gallery_scroll_2.png',
      '0013_gallery_scroll_3.png',
      '0014_gallery_scroll_4.png',
      '0015_gallery_scroll_5.png',
    ],
    durationSec: 9,
    kenBurns: { startScale: 1.0, endScale: 1.04, panX: 0, panY: 10 },
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    caption: 'Fifteen professional tools at your fingertips',
    frames: [
      '0016_tools_scroll_0.png',
      '0017_tools_scroll_1.png',
      '0018_tools_scroll_2.png',
      '0019_tools_scroll_3.png',
    ],
    durationSec: 7,
    kenBurns: { startScale: 1.02, endScale: 1.0, panX: -3, panY: 5 },
  },
  {
    id: 'pricing',
    label: 'Pricing',
    caption: 'Every plan includes all fifteen AI tools',
    frames: [
      '0020_pricing_top.png',
      '0021_pricing_scroll_0.png',
      '0022_pricing_scroll_1.png',
      '0023_pricing_scroll_2.png',
    ],
    durationSec: 8,
    kenBurns: { startScale: 1.0, endScale: 1.03, panX: 0, panY: -5 },
  },
  {
    id: 'signup',
    label: 'Getting Started',
    caption: 'Create your account in under a minute',
    frames: [
      '0024_signup_page.png',
    ],
    durationSec: 5,
    kenBurns: { startScale: 1.02, endScale: 1.0, panX: 0, panY: 0 },
  },
  {
    id: 'login-dashboard',
    label: 'Dashboard',
    caption: 'Your complete command center for every listing',
    frames: [
      '0025_login_clean.png',
      '0026_login_filled.png',
      '0027_dashboard_main.png',
      '0028_dashboard_scroll_0.png',
      '0029_dashboard_scroll_1.png',
      '0030_dashboard_scroll_2.png',
      '0031_dashboard_scroll_3.png',
    ],
    durationSec: 12,
    kenBurns: { startScale: 1.0, endScale: 1.04, panX: 4, panY: 6 },
  },
  {
    id: 'listings-studio',
    label: 'AI Studio',
    caption: 'Sky replacement, staging, twilight — in seconds',
    frames: [
      '0032_listings_page.png',
      '0033_listings_scroll_0.png',
      '0034_listings_scroll_1.png',
      '0035_studio_main.png',
      '0036_studio_scroll_0.png',
      '0037_studio_scroll_1.png',
      '0038_studio_scroll_2.png',
    ],
    durationSec: 13,
    kenBurns: { startScale: 1.03, endScale: 1.0, panX: -4, panY: 4 },
  },
  {
    id: 'content-studio',
    label: 'Content Studio',
    caption: 'AI generates descriptions, captions, and posts',
    frames: [
      '0039_content_studio_select.png',
      '0040_content_studio_listing.png',
      '0041_content_studio_scroll_0.png',
      '0042_content_studio_scroll_1.png',
      '0043_content_studio_scroll_2.png',
      '0044_content_library.png',
      '0045_content_calendar.png',
    ],
    durationSec: 10,
    kenBurns: { startScale: 1.0, endScale: 1.04, panX: 0, panY: -6 },
  },
  {
    id: 'analytics-brand',
    label: 'Analytics & Brand',
    caption: 'Track performance and customize your brand',
    frames: [
      '0046_analytics.png',
      '0047_analytics_scroll_0.png',
      '0048_analytics_scroll_1.png',
      '0049_brand_profile.png',
    ],
    durationSec: 7,
    kenBurns: { startScale: 1.02, endScale: 1.0, panX: 3, panY: -3 },
  },
  {
    id: 'closing',
    label: 'Start Free Trial',
    caption: 'From photos to published listing in under ten minutes',
    frames: [
      '0050_final_cta.png',
    ],
    durationSec: 7,
    kenBurns: { startScale: 1.0, endScale: 1.06, panX: 0, panY: 0 },
  },
];

const FPS = 30;
const TRANSITION_FRAMES = 18; // 0.6s crossfade — smoother than 0.5s
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

  // Smooth crossfade between consecutive screenshots
  const positionInShot = frame - currentFrameIndex * framesPerShot;
  const nextFrameIndex = Math.min(frames.length - 1, currentFrameIndex + 1);
  const crossfadeDuration = Math.min(10, framesPerShot * 0.35);
  const crossfadeProgress =
    currentFrameIndex < frames.length - 1
      ? interpolate(
          positionInShot,
          [framesPerShot - crossfadeDuration, framesPerShot],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        )
      : 0;

  // Caption animation — fade in and out with the scene
  const captionOpacity = interpolate(
    frame,
    [12, 28, totalFrames - 20, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const captionY = interpolate(frame, [12, 28], [15, 0], {
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
          opacity: interpolate(frame, [0, 15], [0, 1], {
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
