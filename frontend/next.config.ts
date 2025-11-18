import type { NextConfig } from "next";

const NEXT_PUBLIC_API_TARGET = process.env.API_NEXT_PUBLIC_API_TARGETTARGET || "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${NEXT_PUBLIC_API_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
