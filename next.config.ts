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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
