import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.plugin-boutique.com" },
      { protocol: "https", hostname: "**.sweetwater.com" },
      { protocol: "https", hostname: "**.native-instruments.com" },
      { protocol: "https", hostname: "**.waves.com" },
      { protocol: "https", hostname: "**.arturia.com" },
      { protocol: "https", hostname: "**.fabfilter.com" },
      { protocol: "https", hostname: "**.izotope.com" },
      { protocol: "https", hostname: "**.xferrecords.com" },
      { protocol: "https", hostname: "**.spectrasonics.net" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
