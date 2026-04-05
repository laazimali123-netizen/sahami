import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-39d27c5d-35d9-42bb-820f-1bf26855ea54.space.z.ai",
  ],
};

export default nextConfig;
