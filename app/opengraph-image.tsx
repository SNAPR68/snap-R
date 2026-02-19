import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SnapR - AI Real Estate Photo Enhancement & Marketing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0F0F0F 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Gold accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #D4A017, transparent)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #D4A017, #B8860B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 800,
              color: '#000',
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '56px',
                fontWeight: 800,
                letterSpacing: '-1px',
                color: '#ffffff',
              }}
            >
              Snap
              <span style={{ color: '#D4A017' }}>R</span>
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '40px',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          AI-Powered Real Estate Photo Enhancement & Marketing
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {['Sky Replacement', 'Virtual Staging', 'Auto Marketing', 'Social Publishing'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background: 'rgba(212, 160, 23, 0.15)',
                  border: '1px solid rgba(212, 160, 23, 0.3)',
                  color: '#D4A017',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* URL at bottom */}
        <p
          style={{
            position: 'absolute',
            bottom: '24px',
            fontSize: '18px',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '2px',
          }}
        >
          snap-r.com
        </p>
      </div>
    ),
    { ...size }
  );
}
