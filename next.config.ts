import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The map is hand-generated SVG; there are no raster assets in the critical
  // path. Keep the image pipeline configured for the photographs that arrive
  // in a later phase.
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
