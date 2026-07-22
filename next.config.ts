import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the build-time env snapshot is included in serverless function bundles.
  outputFileTracingIncludes: {
    "/api/**/*": ["./.runtime-env.json"],
    "/*": ["./.runtime-env.json"],
  },
};

export default nextConfig;
