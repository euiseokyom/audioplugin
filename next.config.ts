import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": ["./public/images/**/*"],
  },
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
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
