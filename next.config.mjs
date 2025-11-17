/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",

  experimental: {
    optimizePackageImports: [],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
