import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Native and binary packages that must stay out of the bundler.
   *
   * `sweph` is a native addon: its prebuilt binary plus the ephemeris data files
   * have to be traced into the serverless function, or Swiss Ephemeris silently
   * degrades to its lower-precision built-in mode at runtime with no visible
   * error.
   *
   * `@sparticuz/chromium` and `puppeteer-core` back the PDF route. Chromium
   * ships as a brotli archive that is unpacked to /tmp at cold start, which only
   * works if the bundler leaves the package alone.
   */
  serverExternalPackages: ['sweph', '@sparticuz/chromium', 'puppeteer-core'],

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
