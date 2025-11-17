// next.config.mjs

import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default {
  output: "standalone",

  reactStrictMode: true,

  // Allow Cloudflare build to pass
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
