import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb"
    }
  },
  async rewrites() {
    return [
      {
        source: "/adiv",
        destination: "/adiv.html"
      }
    ];
  }
};

export default nextConfig;
