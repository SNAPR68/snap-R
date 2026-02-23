import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { z } from 'zod';
import { loadFont } from '@remotion/google-fonts/Inter';

// ============================================
// FONT
// ============================================

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
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
// TIMING CONSTANTS (in frames at 30fps)
// ============================================

const FPS = 30;
const TRANSITION_FRAMES = 20;

// Scene durations (in frames)
const SCENE_DURATIONS = {
  intro: 4 * FPS,         // 4s — SnapR logo + tagline
  homepage: 5 * FPS,      // 5s — Homepage hero scroll
  upload: 5 * FPS,        // 5s — Drag & drop photos
  enhance: 6 * FPS,       // 6s — AI enhancement before/after
  marketing: 5 * FPS,     // 5s — Marketing pipeline auto-generates
  studio: 5 * FPS,        // 5s — Content studio with captions
  publish: 4 * FPS,       // 4s — Social platform publishing
  analytics: 4 * FPS,     // 4s — Analytics dashboard
  closing: 4 * FPS,       // 4s — CTA closing card
} as const;

// Calculate total duration accounting for transitions
export function calculateExplainerDuration(): number {
  const sceneDurations = Object.values(SCENE_DURATIONS);
  const totalSceneDuration = sceneDurations.reduce((sum, d) => sum + d, 0);
  const transitionCount = sceneDurations.length - 1;
  return totalSceneDuration - transitionCount * TRANSITION_FRAMES;
}

// ============================================
// SHARED COMPONENTS
// ============================================

// Animated caption overlay at the bottom
const Caption: React.FC<{ text: string; subtext?: string }> = ({
  text,
  subtext,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const slideUp = interpolate(frame, [0, 15], [30, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: height * 0.06,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${slideUp}px)`,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: `${height * 0.015}px ${width * 0.04}px`,
          maxWidth: width * 0.85,
          textAlign: 'center',
          border: '1px solid rgba(212, 160, 23, 0.3)',
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: height * 0.032,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.01em',
          }}
        >
          {text}
        </div>
        {subtext && (
          <div
            style={{
              fontFamily,
              fontSize: height * 0.02,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: height * 0.005,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Step badge in top-left
const StepBadge: React.FC<{ step: string; label: string }> = ({
  step,
  label,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const scale = interpolate(entrance, [0, 1], [0.8, 1]);
  const opacity = entrance;

  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity,
        transform: `scale(${scale})`,
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 14,
          fontWeight: 800,
          color: '#0A0A0A',
          backgroundColor: '#D4A017',
          padding: '6px 14px',
          borderRadius: 8,
          letterSpacing: '0.05em',
        }}
      >
        {step}
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 16,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Animated cursor for UI interactions
const AnimatedCursor: React.FC<{
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  clickFrame?: number;
  moveStartFrame?: number;
  moveDuration?: number;
}> = ({
  startX,
  startY,
  endX,
  endY,
  clickFrame = 60,
  moveStartFrame = 15,
  moveDuration = 30,
}) => {
  const frame = useCurrentFrame();

  const x = interpolate(
    frame,
    [moveStartFrame, moveStartFrame + moveDuration],
    [startX, endX],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const y = interpolate(
    frame,
    [moveStartFrame, moveStartFrame + moveDuration],
    [startY, endY],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const cursorOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Click ring effect
  const isClicking =
    frame >= clickFrame && frame < clickFrame + 15;
  const clickScale = isClicking
    ? interpolate(frame, [clickFrame, clickFrame + 15], [0, 1.5], {
        extrapolateRight: 'clamp',
      })
    : 0;
  const clickOpacity = isClicking
    ? interpolate(frame, [clickFrame, clickFrame + 15], [0.8, 0], {
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 200 }}>
      {/* Click ring */}
      <div
        style={{
          position: 'absolute',
          left: x - 20,
          top: y - 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid #D4A017',
          opacity: clickOpacity,
          transform: `scale(${clickScale})`,
        }}
      />
      {/* Cursor */}
      <svg
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 24,
          height: 24,
          opacity: cursorOpacity,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        }}
        viewBox="0 0 24 24"
        fill="white"
        stroke="black"
        strokeWidth="1"
      >
        <path d="M5 3l14 8-6 2-4 6z" />
      </svg>
    </AbsoluteFill>
  );
};

// ============================================
// SCENE 1: INTRO — Logo + Tagline
// ============================================

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo entrance
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const logoScale = interpolate(logoSpring, [0, 1], [0.5, 1]);
  const logoOpacity = logoSpring;

  // Tagline fade in
  const taglineOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const taglineY = interpolate(frame, [25, 45], [20, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle
  const subOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at center, #1A1A1A 0%, #0A0A0A 70%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Subtle gold accent ring */}
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          border: '1px solid rgba(212, 160, 23, 0.1)',
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
        {/* SnapR Logo Text */}
        <div
          style={{
            fontFamily,
            fontSize: height * 0.1,
            fontWeight: 900,
            color: 'white',
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            letterSpacing: '-0.02em',
          }}
        >
          Snap<span style={{ color: '#D4A017' }}>R</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily,
            fontSize: height * 0.028,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.8)',
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          AI-Powered Real Estate Marketing
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily,
            fontSize: height * 0.022,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.5)',
            opacity: subOpacity,
            textAlign: 'center',
            maxWidth: width * 0.7,
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
// SCENE 2: HOMEPAGE — Scrolling hero
// ============================================

const HomepageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Scroll animation — slowly scroll down the "homepage"
  const scrollY = interpolate(frame, [0, 150], [0, -400], {
    easing: Easing.inOut(Easing.ease),
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', overflow: 'hidden' }}>
      {/* Simulated browser chrome */}
      <div
        style={{
          width: '100%',
          height: 44,
          backgroundColor: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27C93F' }} />
        <div
          style={{
            marginLeft: 20,
            backgroundColor: '#0F0F0F',
            borderRadius: 6,
            padding: '4px 16px',
            fontFamily,
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          snap-r.com
        </div>
      </div>

      {/* Scrolling content */}
      <div style={{ transform: `translateY(${scrollY}px)` }}>
        {/* Hero section */}
        <div
          style={{
            height: height * 0.65,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: width * 0.08,
            background: 'radial-gradient(ellipse at top, rgba(212,160,23,0.05), transparent 70%)',
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: height * 0.012,
              fontWeight: 600,
              color: '#D4A017',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            AI-Powered Real Estate Marketing
          </div>
          <div
            style={{
              fontFamily,
              fontSize: height * 0.055,
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.15,
              maxWidth: width * 0.75,
              letterSpacing: '-0.02em',
            }}
          >
            Upload Photos.{'\n'}
            <span style={{ color: '#D4A017' }}>AI Does The Rest.</span>
          </div>
          <div
            style={{
              fontFamily,
              fontSize: height * 0.02,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              marginTop: 16,
              maxWidth: width * 0.55,
              lineHeight: 1.6,
            }}
          >
            SnapR enhances your photos, generates marketing copy, and publishes to every platform automatically.
          </div>
          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
            <div
              style={{
                fontFamily,
                fontSize: 15,
                fontWeight: 700,
                color: '#0A0A0A',
                backgroundColor: '#D4A017',
                padding: '12px 32px',
                borderRadius: 10,
              }}
            >
              Start Free Trial
            </div>
            <div
              style={{
                fontFamily,
                fontSize: 15,
                fontWeight: 600,
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '12px 32px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Watch Demo
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: width * 0.06,
            padding: `${height * 0.04}px ${width * 0.08}px`,
          }}
        >
          {[
            { value: '15+', label: 'AI Enhancement Tools' },
            { value: '4', label: 'Social Platforms' },
            { value: '<10 min', label: 'End to End' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily,
                  fontSize: height * 0.04,
                  fontWeight: 800,
                  color: '#D4A017',
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: height * 0.016,
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 4,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Before/After preview section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            padding: `${height * 0.03}px ${width * 0.1}px`,
          }}
        >
          {/* Before card */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#1A1A1A',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Before
            </div>
            <div
              style={{
                width: '100%',
                height: height * 0.2,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #2a2520 0%, #1f1a14 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 40,
                  color: 'rgba(255,255,255,0.15)',
                }}
              >
                🏠
              </div>
            </div>
          </div>

          {/* After card */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#1A1A1A',
              borderRadius: 16,
              padding: 16,
              border: '1px solid rgba(212,160,23,0.3)',
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: 12,
                fontWeight: 600,
                color: '#D4A017',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              After — AI Enhanced
            </div>
            <div
              style={{
                width: '100%',
                height: height * 0.2,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #2a2014 0%, #1f2420 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 40,
                  color: 'rgba(212,160,23,0.4)',
                }}
              >
                ✨
              </div>
            </div>
          </div>
        </div>
      </div>

      <Caption text="Your all-in-one real estate marketing platform" />
    </AbsoluteFill>
  );
};

// ============================================
// SCENE 3: UPLOAD — Drag & Drop Photos
// ============================================

const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Photos appearing one by one
  const photoCount = 6;
  const photosVisible = Math.min(
    photoCount,
    Math.floor(interpolate(frame, [30, 90], [0, photoCount], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }))
  );

  // Upload progress
  const progress = interpolate(frame, [30, 110], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <StepBadge step="STEP 1" label="Upload Your Photos" />

      {/* Dashboard mockup */}
      <AbsoluteFill
        style={{
          padding: `${height * 0.1}px ${width * 0.1}px`,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Upload zone */}
        <div
          style={{
            width: width * 0.7,
            backgroundColor: '#0F0F0F',
            borderRadius: 20,
            border: '2px dashed rgba(212, 160, 23, 0.4)',
            padding: height * 0.04,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Upload icon */}
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              opacity: frame < 30 ? 1 : 0.3,
            }}
          >
            📸
          </div>

          <div
            style={{
              fontFamily,
              fontSize: height * 0.025,
              fontWeight: 600,
              color: 'white',
              marginBottom: 8,
            }}
          >
            {frame < 30
              ? 'Drop your listing photos here'
              : `Uploading ${photosVisible} of ${photoCount} photos...`}
          </div>

          {/* Progress bar */}
          {frame >= 30 && (
            <div
              style={{
                width: '80%',
                height: 8,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                marginTop: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#D4A017',
                  borderRadius: 4,
                }}
              />
            </div>
          )}

          {/* Photo grid */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 24,
              justifyContent: 'center',
            }}
          >
            {Array.from({ length: photoCount }).map((_, i) => {
              const isVisible = i < photosVisible;
              const entrySpring = spring({
                frame: frame - 30 - i * 10,
                fps,
                config: { damping: 15 },
              });

              return (
                <div
                  key={i}
                  style={{
                    width: width * 0.12,
                    height: width * 0.08,
                    borderRadius: 8,
                    backgroundColor: isVisible
                      ? `hsl(${35 + i * 8}, 30%, ${18 + i * 3}%)`
                      : 'rgba(255,255,255,0.05)',
                    border: isVisible
                      ? '2px solid rgba(212,160,23,0.4)'
                      : '2px solid rgba(255,255,255,0.1)',
                    opacity: isVisible ? entrySpring : 0.3,
                    transform: `scale(${isVisible ? entrySpring : 0.9})`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {isVisible && (
                    <div
                      style={{
                        fontFamily,
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      IMG_{i + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* Animated cursor dragging files */}
      <AnimatedCursor
        startX={width * 0.2}
        startY={height * 0.15}
        endX={width * 0.5}
        endY={height * 0.4}
        clickFrame={28}
        moveStartFrame={5}
        moveDuration={20}
      />

      <Caption
        text="Drag & drop your listing photos"
        subtext="Upload up to 75 photos per listing"
      />
    </AbsoluteFill>
  );
};

// ============================================
// SCENE 4: AI ENHANCEMENT — Before/After
// ============================================

const EnhanceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Slider animation — moves from left to right
  const sliderPos = interpolate(frame, [30, 120], [25, 75], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Active tool animation
  const tools = [
    'Sky Replacement',
    'HDR Enhancement',
    'Virtual Twilight',
    'Declutter',
    'Virtual Staging',
    'Lawn Repair',
  ];

  const activeToolIndex = Math.min(
    tools.length - 1,
    Math.floor(
      interpolate(frame, [10, 150], [0, tools.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    )
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <StepBadge step="STEP 2" label="AI Enhancement" />

      <AbsoluteFill
        style={{
          padding: `${height * 0.1}px ${width * 0.06}px`,
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: width * 0.03, alignItems: 'center' }}>
          {/* Before / After comparison */}
          <div
            style={{
              flex: 2,
              height: height * 0.55,
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Before side */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, #3a3020 0%, #252018 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 60,
                  color: 'rgba(255,255,255,0.1)',
                }}
              >
                🏠
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  fontFamily,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '4px 10px',
                  borderRadius: 6,
                }}
              >
                BEFORE
              </div>
            </div>

            {/* After side (clip mask based on slider) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                background: 'linear-gradient(180deg, #1a3025 0%, #162a20 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 60,
                  color: 'rgba(212,160,23,0.3)',
                }}
              >
                ✨
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontFamily,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#D4A017',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '4px 10px',
                  borderRadius: 6,
                }}
              >
                AFTER
              </div>
            </div>

            {/* Slider line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPos}%`,
                width: 3,
                backgroundColor: '#D4A017',
                zIndex: 10,
              }}
            />
            {/* Slider handle */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${sliderPos}%`,
                transform: 'translate(-50%, -50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#D4A017',
                border: '3px solid white',
                zIndex: 11,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#0A0A0A',
                }}
              >
                ↔
              </div>
            </div>
          </div>

          {/* AI Tools sidebar */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: height * 0.02,
                fontWeight: 700,
                color: 'white',
                marginBottom: 8,
              }}
            >
              15 AI Tools
            </div>
            {tools.map((tool, i) => {
              const isActive = i === activeToolIndex;
              const isDone = i < activeToolIndex;
              return (
                <div
                  key={tool}
                  style={{
                    fontFamily,
                    fontSize: height * 0.016,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive
                      ? '#D4A017'
                      : isDone
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(255,255,255,0.3)',
                    padding: '8px 14px',
                    borderRadius: 8,
                    backgroundColor: isActive
                      ? 'rgba(212,160,23,0.1)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(212,160,23,0.3)'
                      : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>
                    {isDone ? '✓' : isActive ? '⚡' : '○'}
                  </span>
                  {tool}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      <Caption
        text="AI enhances every photo automatically"
        subtext="Sky replacement, HDR, virtual staging, and more"
      />
    </AbsoluteFill>
  );
};

// ============================================
// SCENE 5: MARKETING — Auto-generated content
// ============================================

const MarketingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Pipeline steps
  const steps = [
    { label: 'Property Description', icon: '📝', color: '#D4A017' },
    { label: 'Social Captions', icon: '💬', color: '#8B5CF6' },
    { label: 'MLS Package', icon: '📋', color: '#3B82F6' },
    { label: 'Property Website', icon: '🌐', color: '#10B981' },
    { label: 'Scheduled Posts', icon: '📅', color: '#F59E0B' },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <StepBadge step="STEP 3" label="Marketing Pipeline" />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: `${height * 0.1}px ${width * 0.08}px`,
        }}
      >
        <div
          style={{
            width: width * 0.8,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Header */}
          <div
            style={{
              fontFamily,
              fontSize: height * 0.028,
              fontWeight: 700,
              color: 'white',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            5-Step Marketing Pipeline
          </div>

          {/* Pipeline steps */}
          {steps.map((step, i) => {
            const delay = i * 20;
            const stepSpring = spring({
              frame: frame - delay - 15,
              fps,
              config: { damping: 200 },
            });

            const isActive = frame >= delay + 15;
            const isComplete = frame >= delay + 45;

            const progressWidth = interpolate(
              frame,
              [delay + 15, delay + 45],
              [0, 100],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }
            );

            return (
              <div
                key={step.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 20px',
                  borderRadius: 12,
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: interpolate(stepSpring, [0, 1], [0.3, 1]),
                  transform: `translateX(${interpolate(stepSpring, [0, 1], [-20, 0])}px)`,
                }}
              >
                <div style={{ fontSize: 24 }}>{step.icon}</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily,
                      fontSize: height * 0.02,
                      fontWeight: 600,
                      color: isComplete ? step.color : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {step.label}
                  </div>
                  {/* Progress bar */}
                  {isActive && (
                    <div
                      style={{
                        width: '100%',
                        height: 4,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        marginTop: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressWidth}%`,
                          height: '100%',
                          backgroundColor: step.color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontFamily,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isComplete ? '#10B981' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {isComplete ? '✓' : isActive ? '...' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <Caption
        text="AI generates all marketing content"
        subtext="Descriptions, captions, MLS packages — automatically"
      />
    </AbsoluteFill>
  );
};

// ============================================
// SCENE 6: CONTENT STUDIO — Edit & preview
// ============================================

const StudioScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Typing animation for caption
  const fullCaption =
    '✨ Just listed! Stunning 4BR home in Beverly Hills with panoramic views, a resort-style pool & designer kitchen. Schedule your private tour today! 🏡';
  const typedLength = Math.min(
    fullCaption.length,
    Math.floor(
      interpolate(frame, [20, 120], [0, fullCaption.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    )
  );
  const displayedCaption = fullCaption.slice(0, typedLength);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <StepBadge step="STEP 4" label="Content Studio" />

      <AbsoluteFill
        style={{
          padding: `${height * 0.1}px ${width * 0.05}px`,
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: width * 0.03 }}>
          {/* Left: Photo grid */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Enhanced Photos
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: height * 0.17,
                    borderRadius: 10,
                    background: `linear-gradient(${135 + i * 30}deg, hsl(${30 + i * 15}, 25%, 18%) 0%, hsl(${40 + i * 15}, 20%, 12%) 100%)`,
                    border:
                      i === 0
                        ? '2px solid #D4A017'
                        : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily,
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {i === 0 ? '🌅 Hero' : `Photo ${i + 1}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Caption + AI content */}
          <div
            style={{
              flex: 1.2,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Platform tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
              {['Instagram', 'Facebook', 'LinkedIn', 'TikTok'].map(
                (platform, i) => (
                  <div
                    key={platform}
                    style={{
                      fontFamily,
                      fontSize: 12,
                      fontWeight: i === 0 ? 700 : 500,
                      color: i === 0 ? '#D4A017' : 'rgba(255,255,255,0.4)',
                      padding: '6px 14px',
                      borderRadius: 8,
                      backgroundColor:
                        i === 0
                          ? 'rgba(212,160,23,0.1)'
                          : 'rgba(255,255,255,0.05)',
                      border:
                        i === 0
                          ? '1px solid rgba(212,160,23,0.3)'
                          : '1px solid transparent',
                    }}
                  >
                    {platform}
                  </div>
                )
              )}
            </div>

            {/* Caption area */}
            <div
              style={{
                backgroundColor: '#1A1A1A',
                borderRadius: 12,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.1)',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: 8,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                AI-Generated Caption
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: height * 0.018,
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.6,
                  minHeight: height * 0.12,
                }}
              >
                {displayedCaption}
                <span
                  style={{
                    color: '#D4A017',
                    opacity: frame % 30 < 15 ? 1 : 0,
                  }}
                >
                  |
                </span>
              </div>
            </div>

            {/* Hashtags */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {[
                '#JustListed',
                '#BeverlyHills',
                '#LuxuryHome',
                '#RealEstate',
                '#DreamHome',
              ].map((tag) => (
                <div
                  key={tag}
                  style={{
                    fontFamily,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#D4A017',
                    backgroundColor: 'rgba(212,160,23,0.1)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(212,160,23,0.2)',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <Caption
        text="Review AI-generated content for every platform"
        subtext="Edit captions, hashtags, and scheduling"
      />
    </AbsoluteFill>
  );
};

// ============================================
// SCENE 7: PUBLISH — Social platform distribution
// ============================================

const PublishScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const platforms = [
    { name: 'Instagram', color: '#E4405F', icon: '📸' },
    { name: 'Facebook', color: '#1877F2', icon: '👍' },
    { name: 'LinkedIn', color: '#0A66C2', icon: '💼' },
    { name: 'TikTok', color: '#FE2C55', icon: '🎵' },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <StepBadge step="STEP 5" label="Auto-Publish" />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: height * 0.04,
          }}
        >
          {/* Center icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: 'rgba(212,160,23,0.1)',
              border: '2px solid rgba(212,160,23,0.4)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 36,
            }}
          >
            🚀
          </div>

          {/* Platform cards */}
          <div
            style={{
              display: 'flex',
              gap: width * 0.03,
            }}
          >
            {platforms.map((platform, i) => {
              const delay = i * 15 + 20;
              const entrySpring = spring({
                frame: frame - delay,
                fps,
                config: { damping: 12, stiffness: 100 },
              });

              const isPublished = frame >= delay + 45;

              return (
                <div
                  key={platform.name}
                  style={{
                    width: width * 0.17,
                    backgroundColor: '#1A1A1A',
                    borderRadius: 16,
                    padding: '20px 16px',
                    border: isPublished
                      ? `2px solid ${platform.color}`
                      : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    opacity: entrySpring,
                    transform: `scale(${interpolate(entrySpring, [0, 1], [0.8, 1])}) translateY(${interpolate(entrySpring, [0, 1], [20, 0])}px)`,
                  }}
                >
                  <div style={{ fontSize: 32 }}>{platform.icon}</div>
                  <div
                    style={{
                      fontFamily,
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    {platform.name}
                  </div>
                  <div
                    style={{
                      fontFamily,
                      fontSize: 12,
                      fontWeight: 600,
                      color: isPublished ? '#10B981' : 'rgba(255,255,255,0.4)',
                      backgroundColor: isPublished
                        ? 'rgba(16,185,129,0.1)'
                        : 'rgba(255,255,255,0.05)',
                      padding: '4px 12px',
                      borderRadius: 6,
                    }}
                  >
                    {isPublished ? '✓ Published' : 'Scheduling...'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      <Caption
        text="One click publishes to all platforms"
        subtext="Auto-scheduled with UTM tracking"
      />
    </AbsoluteFill>
  );
};

// ============================================
// SCENE 8: ANALYTICS — Results dashboard
// ============================================

const AnalyticsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Animated stats
  const stats = [
    { label: 'Post Views', value: 12450, color: '#3B82F6', icon: '👁' },
    { label: 'Engagements', value: 847, color: '#8B5CF6', icon: '❤️' },
    { label: 'Link Clicks', value: 234, color: '#10B981', icon: '🔗' },
    { label: 'Leads', value: 18, color: '#D4A017', icon: '🏠' },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <StepBadge step="RESULTS" label="Track Performance" />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: `${height * 0.1}px ${width * 0.06}px`,
        }}
      >
        <div
          style={{
            width: width * 0.85,
            display: 'flex',
            flexDirection: 'column',
            gap: height * 0.03,
          }}
        >
          {/* Stats cards */}
          <div style={{ display: 'flex', gap: 16 }}>
            {stats.map((stat, i) => {
              const animatedValue = Math.floor(
                interpolate(frame, [10 + i * 8, 60 + i * 8], [0, stat.value], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.out(Easing.quad),
                })
              );

              return (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    backgroundColor: '#1A1A1A',
                    borderRadius: 14,
                    padding: '18px 16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
                  <div
                    style={{
                      fontFamily,
                      fontSize: height * 0.038,
                      fontWeight: 800,
                      color: stat.color,
                    }}
                  >
                    {animatedValue.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontFamily,
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: 4,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart mockup */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 14,
              padding: 24,
              border: '1px solid rgba(255,255,255,0.08)',
              height: height * 0.28,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 4,
              paddingBottom: 40,
            }}
          >
            {/* Chart label */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 20,
                fontFamily,
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Engagement Over Time
            </div>

            {/* Bar chart */}
            {Array.from({ length: 14 }).map((_, i) => {
              const barHeight = 30 + Math.sin(i * 0.8 + 1) * 40 + i * 3;
              const animatedHeight = interpolate(
                frame,
                [15 + i * 3, 45 + i * 3],
                [0, barHeight],
                {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.out(Easing.quad),
                }
              );

              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${animatedHeight}%`,
                    backgroundColor:
                      i >= 10
                        ? 'rgba(212,160,23,0.6)'
                        : 'rgba(59,130,246,0.4)',
                    borderRadius: '4px 4px 0 0',
                  }}
                />
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      <Caption
        text="Track performance across all platforms"
        subtext="Views, engagement, clicks, and leads in real-time"
      />
    </AbsoluteFill>
  );
};

// ============================================
// SCENE 9: CLOSING — CTA
// ============================================

const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const taglineOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaScale = interpolate(frame, [40, 60], [0.9, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at center, #1A1A1A 0%, #0A0A0A 70%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Subtle gold glow */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,160,23,0.08) 0%, transparent 70%)',
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
        {/* Logo */}
        <div
          style={{
            fontFamily,
            fontSize: height * 0.09,
            fontWeight: 900,
            color: 'white',
            opacity: logoSpring,
            transform: `scale(${interpolate(logoSpring, [0, 1], [0.5, 1])})`,
            letterSpacing: '-0.02em',
          }}
        >
          Snap<span style={{ color: '#D4A017' }}>R</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily,
            fontSize: height * 0.028,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            opacity: taglineOpacity,
            textAlign: 'center',
            maxWidth: width * 0.7,
            lineHeight: 1.5,
          }}
        >
          From photos to published listing in under 10 minutes.
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            marginTop: height * 0.02,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: height * 0.025,
              fontWeight: 700,
              color: '#0A0A0A',
              backgroundColor: '#D4A017',
              padding: `${height * 0.015}px ${width * 0.05}px`,
              borderRadius: 14,
              letterSpacing: '0.02em',
            }}
          >
            Start Your Free Trial →
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily,
            fontSize: height * 0.018,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.4)',
            opacity: ctaOpacity,
            marginTop: 8,
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

export const ExplainerVideo: React.FC<ExplainerVideoProps> = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <TransitionSeries>
        {/* Scene 1: Intro */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.intro}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 2: Homepage */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.homepage}>
          <HomepageScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 3: Upload */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.upload}>
          <UploadScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 4: AI Enhancement */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.enhance}>
          <EnhanceScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 5: Marketing Pipeline */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.marketing}>
          <MarketingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 6: Content Studio */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.studio}>
          <StudioScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 7: Auto-Publish */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.publish}>
          <PublishScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 8: Analytics */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.analytics}>
          <AnalyticsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 9: Closing CTA */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.closing}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
