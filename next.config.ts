import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId: process.env.DEPLOYMENT_VERSION,
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["@aws-sdk/client-s3", "sharp"],
  outputFileTracingExcludes: {
    "/api/magnets/*/upload-video": [
      "./.env",
      "./*.md",
      "./*.sql",
      "./*.zip",
      "./app/**/*",
      "./components/**/*",
      "./eslint.config.mjs",
      "./lib/**/*",
      "./memoried/**/*",
      "./next.config.ts",
      "./postcss.config.mjs",
      "./prisma/**/*",
      "./prisma.config.ts",
      "./proxy.ts",
      "./public/**/*",
      "./tsconfig*.json",
    ],
  },
};

export default nextConfig;
