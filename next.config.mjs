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
};

export default nextConfig;
