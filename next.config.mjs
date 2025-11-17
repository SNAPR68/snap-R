/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",

  experimental: {
    optimizeCss: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
