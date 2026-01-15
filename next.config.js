/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: '**.replicate.delivery' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://*.contentsquare.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https://*.supabase.co https://*.supabase.in",
              "connect-src 'self' blob: https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.stripe.com https://api.openai.com https://api.replicate.com https://api.runware.ai https://*.cloudinary.com https://*.r2.cloudflarestorage.com https://graph.facebook.com https://www.googletagmanager.com https://*.contentsquare.net https://unpkg.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
