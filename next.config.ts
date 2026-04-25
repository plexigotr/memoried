import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@google-cloud/storage", "sharp"],
};

export default nextConfig;
