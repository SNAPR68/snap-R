import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

// ============================================
// FONT
// ============================================

export const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

// ============================================
// TIMING CONSTANTS
// ============================================

export const PHOTO_DISPLAY_FRAMES = 90; // 3s per photo
export const CROSSFADE_FRAMES = 30; // 1s crossfade/transition
export const CLOSING_CARD_FRAMES = 90; // 3s closing card
export const INTRO_CARD_FRAMES = 75; // 2.5s intro card

// ============================================
// PHOTO SLIDE COMPONENT
// ============================================

interface PhotoSlideProps {
  src: string;
  index: number;
  displayFrames?: number;
}

export const PhotoSlide: React.FC<PhotoSlideProps> = ({
  src,
  index,
  displayFrames = PHOTO_DISPLAY_FRAMES,
}) => {
  const frame = useCurrentFrame();

  // Ken Burns: alternating zoom in/out with subtle pan
  const isEven = index % 2 === 0;

  const scale = interpolate(
    frame,
    [0, displayFrames],
    isEven ? [1.0, 1.1] : [1.1, 1.0],
    {
      easing: Easing.inOut(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const translateX = interpolate(
    frame,
    [0, displayFrames],
    isEven ? [-0.02, 0.02] : [0.02, -0.02],
    {
      easing: Easing.inOut(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateX(${translateX * 100}%)`,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Dark gradient at bottom for text readability */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 30%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================
// ADDRESS OVERLAY
// ============================================

interface AddressOverlayProps {
  address: string;
}

export const AddressOverlay: React.FC<AddressOverlayProps> = ({ address }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const fontSize = height * 0.035;
  const padding = width * 0.04;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        padding,
        paddingBottom: padding * 1.5,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 600,
          color: 'white',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
          letterSpacing: '0.02em',
        }}
      >
        {address}
      </div>
    </AbsoluteFill>
  );
};
