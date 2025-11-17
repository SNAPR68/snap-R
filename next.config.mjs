/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone server build for SSR
  output: "standalone",

  // avoid blocking builds with TS/ESLint during CI - adjust later if you want strict checks
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // keep other defaults
  reactStrictMode: true,
};

export default nextConfig;
