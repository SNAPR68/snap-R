import { defineConfig } from "next";

export default defineConfig({
  output: "standalone",

  experimental: {
    serverActions: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
});
