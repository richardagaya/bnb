import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Firebase default action path → our handler (forwards to /reset-password)
      {
        source: "/__/auth/action",
        destination: "/auth/action",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
