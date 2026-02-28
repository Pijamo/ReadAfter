import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/isbn/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source:
          "/:category(entrepreneurship|productivity|personal-finance|leadership|self-help|career-growth)/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
