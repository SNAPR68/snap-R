const nextConfig = {
  output: "standalone",

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  trailingSlash: false,
  skipMiddlewareUrlNormalize: true,
  optimizePackageImports: [],
  
  dynamicIo: true,
  dynamicParams: true,
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
