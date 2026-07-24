import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include build-time env snapshot in serverless bundles for auth/health routes.
  outputFileTracingIncludes: {
    "/api/auth/[...nextauth]": ["./.runtime-env.json"],
    "/api/health/auth": ["./.runtime-env.json"],
  },
  serverExternalPackages: ["@prisma/client", "prisma", "pg", "bcryptjs"],
};

export default nextConfig;
