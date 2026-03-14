import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Easing,
  Sequence,
  spring,
} from 'remotion';
import { Audio } from '@remotion/media';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { z } from 'zod';
import { loadFont } from '@remotion/google-fonts/Inter';
import { BrowserChrome } from '../components/BrowserChrome';
import { AnimatedCursor } from '../components/AnimatedCursor';

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
// SCENE DEFINITIONS — Full-page scroll approach
// ============================================

interface CursorWaypoint {
  x: number;
  y: number;
  /** Frame offset within this scene */
  frame: number;
  click?: boolean;
}

interface ZoomTarget {
  /** Scroll % at which zoom starts (0-1) */
  atPercent: number;
  /** Focal point X (px from left of 1920) */
  x: number;
  /** Focal point Y (px from top of viewport) */
  y: number;
  /** Zoom scale */
  scale: number;
  /** Duration in frames */
  durationFrames: number;
}

interface SceneConfig {
  id: string;
  label: string;
  caption: string;
  /** Image filename in public/explainer-frames-v3/ */
  image: string;
  /** Full page height in px (from manifest) */
  imageHeight: number;
  /** Scene duration in seconds */
  durationSec: number;
  /** Scroll behavior */
  scroll: 'smooth' | 'pauseAtTop' | 'none';
  /** URL to show in browser chrome */
  url: string;
  /** Start scroll offset in px (for scenes sharing one tall image) */
  scrollStartPx?: number;
  /** End scroll offset in px */
  scrollEndPx?: number;
  /** Optional zoom target */
  zoomTarget?: ZoomTarget;
  /** Optional cursor waypoints */
  cursorWaypoints?: CursorWaypoint[];
}

// Content viewport height (1080 minus browser chrome bar)
const CONTENT_HEIGHT = 1040;

const SCENES: SceneConfig[] = [
  // ── 1. Homepage (10s) — Opening hook ──────────────────────────────────────
  {
    id: 'homepage',
    label: 'Meet SnapR',
    caption: 'The AI platform that turns property photos into a full marketing engine',
    image: 'homepage.png',
    imageHeight: 9136,
    durationSec: 10,
    scroll: 'smooth',
    url: 'snap-r.com',
    scrollStartPx: 0,
    scrollEndPx: 3200,
  },
  // ── 2. Dashboard (10s) — Command center ───────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    caption: 'Your command center — every listing, status, and activity in one place',
    image: 'dashboard.png',
    imageHeight: 1392,
    durationSec: 10,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/dashboard',
  },
  // ── 3. AI Studio (12s) — Enhancement tools ────────────────────────────────
  {
    id: 'ai-studio',
    label: 'AI Studio',
    caption: '15 AI tools — sky replacement, staging, twilight, declutter, and more',
    image: 'studio.png',
    imageHeight: 1265,
    durationSec: 12,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/dashboard/studio',
    cursorWaypoints: [
      { x: 120, y: 400, frame: 80 },
      { x: 120, y: 500, frame: 140, click: true },
      { x: 960, y: 540, frame: 220 },
    ],
  },
  // ── 4. Content Studio (10s) — Marketing automation ────────────────────────
  {
    id: 'content-studio',
    label: 'Content Studio',
    caption: 'Descriptions, captions, hashtags, and a property website — all automated',
    image: 'content-studio.png',
    imageHeight: 1267,
    durationSec: 10,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/dashboard/content-studio',
    cursorWaypoints: [
      { x: 400, y: 350, frame: 90 },
      { x: 700, y: 400, frame: 160, click: true },
    ],
  },
  // ── 5. Video Creator (8s) — AI videos ─────────────────────────────────────
  {
    id: 'video-creator',
    label: 'Video Creator',
    caption: 'Cinematic property videos with AI voiceover — four styles, six voices',
    image: 'video-creator.png',
    imageHeight: 1080,
    durationSec: 8,
    scroll: 'none',
    url: 'snap-r.com/dashboard/content-studio/video',
  },
  // ── 6. Social Publish (9s) — 5 platforms ──────────────────────────────────
  {
    id: 'social-publish',
    label: 'Social Publish',
    caption: 'Facebook, Instagram, LinkedIn, TikTok, and Twitter — all connected',
    image: 'social-settings.png',
    imageHeight: 1080,
    durationSec: 9,
    scroll: 'none',
    url: 'snap-r.com/dashboard/settings/social',
  },
  // ── 7. Calendar (8s) — Scheduling ─────────────────────────────────────────
  {
    id: 'calendar',
    label: 'Calendar',
    caption: 'Drag-and-drop scheduling — every post, every platform, every date',
    image: 'calendar.png',
    imageHeight: 1080,
    durationSec: 8,
    scroll: 'none',
    url: 'snap-r.com/dashboard/content-studio/calendar',
  },
  // ── 8. Analytics (10s) — Performance tracking ─────────────────────────────
  {
    id: 'analytics',
    label: 'Analytics',
    caption: 'Impressions, engagement, clicks, and cost per lead — by platform and listing',
    image: 'analytics.png',
    imageHeight: 1267,
    durationSec: 10,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/dashboard/analytics',
  },
  // ── 9. Lead CRM (10s) — Lead management ───────────────────────────────────
  {
    id: 'leads',
    label: 'Lead CRM',
    caption: 'Kanban pipeline, auto-scoring, drip sequences, and bulk email — built in',
    image: 'leads.png',
    imageHeight: 1311,
    durationSec: 10,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/dashboard/leads',
  },
  // ── 10. Open Houses (8s) — Event management ───────────────────────────────
  {
    id: 'open-houses',
    label: 'Open Houses',
    caption: 'Guest check-in pages, attendee tracking, and automatic lead capture',
    image: 'open-houses.png',
    imageHeight: 1267,
    durationSec: 8,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/dashboard/open-houses',
  },
  // ── 11. Broker Dashboard (12s) — Team oversight ───────────────────────────
  {
    id: 'broker',
    label: 'Broker Dashboard',
    caption: 'Team command center — agent roster, listings, leads, and performance charts',
    image: 'broker.png',
    imageHeight: 1267,
    durationSec: 12,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/dashboard/broker',
  },
  // ── 12. Photographer Portal (10s) — Delivery & booking ────────────────────
  {
    id: 'photographer',
    label: 'Photographer Portal',
    caption: 'Booking pipeline, delivery tracking, and package management — all in one place',
    image: 'photographer.png',
    imageHeight: 1267,
    durationSec: 10,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/dashboard/photographer/bookings',
  },
  // ── 13. Booking Form (8s) — Public booking page ───────────────────────────
  {
    id: 'booking-form',
    label: 'Booking Form',
    caption: 'Agents book shoots through your branded public page — you manage the pipeline',
    image: 'booking-form.png',
    imageHeight: 1080,
    durationSec: 8,
    scroll: 'none',
    url: 'snap-r.com/book/demo',
  },
  // ── 14. Pricing (8s) — Plans ──────────────────────────────────────────────
  {
    id: 'pricing',
    label: 'Pricing',
    caption: 'All 15 AI tools on every plan — start free, upgrade when ready',
    image: 'pricing.png',
    imageHeight: 2273,
    durationSec: 8,
    scroll: 'pauseAtTop',
    url: 'snap-r.com/pricing',
  },
];

const FPS = 30;
const TRANSITION_FRAMES = 18; // 0.6s crossfade between scenes
const INTRO_DURATION = 4 * FPS; // 4s intro
const CLOSING_CARD_DURATION = 6 * FPS; // 6s closing CTA

// ============================================
// DURATION CALCULATION
// ============================================

export function calculateExplainerDuration(): number {
  const sceneFrames = SCENES.reduce(
    (sum, scene) => sum + scene.durationSec * FPS,
    0,
  );
  const totalSequences = 1 + SCENES.length + 1; // intro + scenes + closing
  const transitionCount = totalSequences - 1;
  return INTRO_DURATION + sceneFrames + CLOSING_CARD_DURATION - transitionCount * TRANSITION_FRAMES;
}

// ============================================
// SCROLL SCENE COMPONENT
// ============================================

const ScrollScene: React.FC<{
  scene: SceneConfig;
  showCaptions: boolean;
}> = ({ scene, showCaptions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { image, imageHeight, durationSec, caption, label, scroll, url, zoomTarget } = scene;
  const totalFrames = durationSec * fps;

  // Determine scroll range — use explicit px offsets if provided, else full page
  const scrollStart = scene.scrollStartPx ?? 0;
  const scrollEnd = scene.scrollEndPx ?? Math.max(0, imageHeight - CONTENT_HEIGHT);
  const scrollDistance = scrollEnd - scrollStart;

  // Compute scroll Y offset based on scroll mode
  let scrollY = -scrollStart; // Start at scrollStartPx
  if (scroll === 'smooth' && scrollDistance > 0) {
    scrollY = interpolate(
      frame,
      [0, totalFrames],
      [-scrollStart, -scrollEnd],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );
  } else if (scroll === 'pauseAtTop' && scrollDistance > 0) {
    // Hold at top for 1.5s, then scroll
    const pauseFrames = Math.round(1.5 * fps);
    scrollY = interpolate(
      frame,
      [0, pauseFrames, totalFrames],
      [-scrollStart, -scrollStart, -scrollEnd],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );
  }

  // Ken Burns for non-scrolling scenes
  let kenBurnsScale = 1;
  if (scroll === 'none') {
    kenBurnsScale = interpolate(
      frame,
      [0, totalFrames],
      [1.02, 1.0],
      {
        easing: Easing.inOut(Easing.ease),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );
  }

  // Zoom target animation
  let zoomScale = 1;
  let zoomX = 0;
  let zoomY = 0;
  if (zoomTarget && scrollDistance > 0) {
    const scrollProgress = frame / totalFrames;
    const zoomStart = zoomTarget.atPercent;
    const zoomEnd = zoomStart + (zoomTarget.durationFrames / totalFrames);
    const zoomMid = zoomStart + (zoomEnd - zoomStart) * 0.5;

    if (scrollProgress >= zoomStart && scrollProgress <= zoomEnd) {
      // Zoom in then back out
      const zoomProgress = scrollProgress <= zoomMid
        ? interpolate(scrollProgress, [zoomStart, zoomMid], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        : interpolate(scrollProgress, [zoomMid, zoomEnd], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

      const springVal = spring({
        frame: Math.round(zoomProgress * zoomTarget.durationFrames),
        fps,
        config: { damping: 15, stiffness: 80 },
      });

      zoomScale = 1 + (zoomTarget.scale - 1) * springVal;
      // Shift to keep focal point centered
      zoomX = -(zoomTarget.x - 960) * (zoomScale - 1);
      zoomY = -(zoomTarget.y - 540) * (zoomScale - 1);
    }
  }

  // Caption animation
  const captionOpacity = interpolate(
    frame,
    [12, 28, totalFrames - 20, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const captionSlideY = interpolate(frame, [12, 28], [12, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Label badge animation
  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <BrowserChrome url={url}>
        {/* Scrolling content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            transform: `scale(${kenBurnsScale * zoomScale}) translate(${zoomX}px, ${zoomY}px)`,
            willChange: 'transform',
          }}
        >
          <Img
            src={staticFile(`explainer-frames-v3/${image}`)}
            style={{
              width: 1920,
              height: 'auto',
              transform: `translateY(${scrollY}px)`,
              willChange: 'transform',
            }}
          />
        </div>

        {/* Cursor overlay */}
        {scene.cursorWaypoints && scene.cursorWaypoints.length > 0 && (
          <AnimatedCursor waypoints={scene.cursorWaypoints} />
        )}
      </BrowserChrome>

      {/* Step label badge */}
      <div
        style={{
          position: 'absolute',
          top: 58,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: labelOpacity,
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
            transform: `translateY(${captionSlideY}px)`,
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
          Photos to published listing in under ten minutes
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
          From photos to fully published listing in under ten minutes.
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
        <ScrollScene scene={scene} showCaptions={showCaptions} />
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
      {/* Voiceover audio — delayed past intro card */}
      <Sequence from={INTRO_DURATION - TRANSITION_FRAMES}>
        <Audio src={staticFile('explainer-voiceover.mp3')} volume={1} />
      </Sequence>

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
