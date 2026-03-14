import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { fontFamily } from './shared';

interface StatsBarProps {
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  accentColor?: string;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return `$${(price / 1_000).toFixed(0)}K`;
}

function formatSqft(sqft: number): string {
  return `${sqft.toLocaleString()} sf`;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  price,
  beds,
  baths,
  sqft,
  accentColor = '#D4A017',
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Build stat pills
  const stats: Array<{ label: string; value: string }> = [];
  if (price != null) stats.push({ label: '', value: formatPrice(price) });
  if (beds != null) stats.push({ label: 'BD', value: String(beds) });
  if (baths != null) stats.push({ label: 'BA', value: String(baths) });
  if (sqft != null) stats.push({ label: '', value: formatSqft(sqft) });

  if (stats.length === 0) return null;

  // Staggered entrance (left to right)
  const pillSize = width * 0.032;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 120,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {stats.map((stat, index) => {
          const delay = index * 4;
          const pillOpacity = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const pillTranslateY = interpolate(frame, [delay, delay + 10], [20, 0], {
            easing: Easing.out(Easing.ease),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={index}
              style={{
                fontFamily,
                fontSize: pillSize,
                fontWeight: 700,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${accentColor}40`,
                borderRadius: 12,
                padding: '10px 18px',
                opacity: pillOpacity,
                transform: `translateY(${pillTranslateY}px)`,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: accentColor }}>{stat.value}</span>
              {stat.label && (
                <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 4, fontSize: pillSize * 0.75 }}>
                  {stat.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
