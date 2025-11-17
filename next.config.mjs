/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  experimental: {
    optimizePackageImports: [],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
