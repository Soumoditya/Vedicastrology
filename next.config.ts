import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * `sweph` is a native addon. It must stay external to the bundler, and its
   * prebuilt binary plus the ephemeris data files must be traced into the
   * serverless function — otherwise Swiss Ephemeris silently degrades to its
   * lower-precision built-in mode at runtime, with no visible error.
   */
  serverExternalPackages: ['sweph'],

  outputFileTracingIncludes: {
    '/**': ['./ephe/**/*', './node_modules/sweph/prebuilds/**/*'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    optimizePackageImports: ['motion'],
  },
};

export default nextConfig;
