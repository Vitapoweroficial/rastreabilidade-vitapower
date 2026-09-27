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
      },
      {
        source: "/adiv-direcoes",
        destination: "/adiv-direcoes.html"
      }
    ];
  }
};

export default nextConfig;
