/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  experimental: {
    optimizePackageImports: false,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
