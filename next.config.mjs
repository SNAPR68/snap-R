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

  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://*.sentry.io https://*.cloudinary.com https://js.stripe.com https://*.contentsquare.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.cloudinary.com https://*.workers.dev https://*.stripe.com",
              "media-src 'self' blob: https://*.supabase.co https://*.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.cloudinary.com https://*.sentry.io https://api.openai.com https://api.replicate.com https://api.runware.ai https://api.stripe.com https://open.tiktokapis.com https://graph.facebook.com https://*.workers.dev https://*.contentsquare.net",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
