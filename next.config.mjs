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
};

export default nextConfig;
