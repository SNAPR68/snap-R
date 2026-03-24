/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization with remote patterns (deployed on Vercel)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: '*.workers.dev' },
    ],
  },

  // Enforce ESLint and TypeScript strictness during build
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Exclude Remotion Lambda + AWS SDK from Next.js bundling.
  // These packages bundle their own dependencies (including the AWS SDK)
  // and break when re-bundled by webpack/turbopack.
  serverExternalPackages: [
    '@remotion/lambda',
    '@remotion/lambda-client',
    '@remotion/serverless',
  ],

  // 301 redirects for legacy/retired URLs
  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/features',
        destination: '/#features',
        permanent: true,
      },
    ];
  },

  // Security headers — split for embed routes (allow iframe) vs everything else (deny)
  async headers() {
    const commonHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    return [
      // All other routes — deny iframe embedding (catch-all listed first)
      {
        source: '/(.*)',
        headers: [
          ...commonHeaders,
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://*.sentry.io https://*.cloudinary.com https://js.stripe.com https://*.contentsquare.net https://assets.calendly.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://assets.calendly.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.cloudinary.com https://*.workers.dev https://*.stripe.com",
              "media-src 'self' blob: https://*.supabase.co https://*.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.cloudinary.com https://*.sentry.io https://api.openai.com https://api.stripe.com https://open.tiktokapis.com https://*.workers.dev https://calendly.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://calendly.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      // Embed routes — allow iframe embedding from any origin (later rule overrides catch-all)
      {
        source: '/embed/:path*',
        headers: [
          ...commonHeaders,
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.cloudinary.com https://*.workers.dev",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors *",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
