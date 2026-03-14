import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { fontFamily } from './shared';

interface HookTextProps {
  text: string;
  accentColor?: string;
}

export const HookText: React.FC<HookTextProps> = ({
  text,
  accentColor = '#D4A017',
}) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  // Scale-up bounce entrance
  const scale = interpolate(frame, [0, 15], [0.7, 1.0], {
    easing: Easing.out(Easing.back(1.5)),
    extrapolateRight: 'clamp',
  });

  // Fade in
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out at end
  const fadeOut = interpolate(frame, [45, 60], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gold accent line
  const lineWidth = interpolate(frame, [10, 30], [0, 100], {
    easing: Easing.out(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fontSize = height * 0.055;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        opacity: opacity * fadeOut,
        transform: `scale(${scale})`,
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: 800,
          color: 'white',
          textAlign: 'center',
          textShadow: '0 4px 20px rgba(0,0,0,0.8)',
          maxWidth: width * 0.85,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}
      >
        {text}
      </div>

      {/* Gold accent line */}
      <div
        style={{
          width: width * 0.25,
          height: 4,
          marginTop: height * 0.02,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: `${lineWidth}%`,
            height: '100%',
            backgroundColor: accentColor,
            borderRadius: 2,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
