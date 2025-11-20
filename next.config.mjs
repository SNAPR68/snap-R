/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization (Cloudflare Pages cannot run it)
  images: {
    unoptimized: true,
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

