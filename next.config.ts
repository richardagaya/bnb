import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
      },
      {
        protocol: "https",
        hostname: "assets.ctfassets.net",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/__/auth/action",
        destination: "/auth/action",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;