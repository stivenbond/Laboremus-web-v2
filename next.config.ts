import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
});

const nextConfig: NextConfig = {
  // Suppress the Turbopack/webpack conflict warning from @ducanh2912/next-pwa.
  // The app works fine under Turbopack with no custom configuration.
  turbopack: {},
};

export default withPWA(nextConfig);
