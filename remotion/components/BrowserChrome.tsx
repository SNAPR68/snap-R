import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500'],
  subsets: ['latin'],
});

const CHROME_HEIGHT = 40;

interface BrowserChromeProps {
  url: string;
  children: React.ReactNode;
}

export const BrowserChrome: React.FC<BrowserChromeProps> = ({ url, children }) => {
  const frame = useCurrentFrame();

  // Subtle fade-in of chrome on scene start
  const chromeOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        overflow: 'hidden',
        borderRadius: 16,
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        opacity: chromeOpacity,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: CHROME_HEIGHT,
          background: 'linear-gradient(180deg, #2D2D2D 0%, #252525 100%)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 14,
          paddingRight: 14,
          gap: 7,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Traffic lights */}
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />

        {/* URL bar */}
        <div
          style={{
            marginLeft: 16,
            flex: 1,
            height: 26,
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          {/* Lock icon */}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6, flexShrink: 0 }}>
            <path
              d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontFamily,
              fontSize: 12,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.4)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {url}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
};

export const BROWSER_CHROME_HEIGHT = CHROME_HEIGHT;
