const nextConfig = {
  output: "export",

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  trailingSlash: false,
  skipMiddlewareUrlNormalize: true,
  staticPageGenerationTimeout: 1,

  generateBuildId: async () => {
    return "build";
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
