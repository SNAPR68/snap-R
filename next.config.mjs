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

  // ABSOLUTELY REQUIRED — disables ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ABSOLUTELY REQUIRED — disables TS errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
