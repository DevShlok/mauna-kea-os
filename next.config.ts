import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse-new"],
  async redirects() {
    return [
      {
        source: "/OS",
        destination: "/sign-in",
        permanent: true,
      },
      {
        source: "/os",
        destination: "/sign-in",
        permanent: true,
      }
    ];
  },
};

export default nextConfig;
