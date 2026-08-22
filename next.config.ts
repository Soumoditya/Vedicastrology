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

  /*
    Paged.js, forced onto its prebuilt bundle.

    Two separate problems, one alias. The package entry is ESM *source* that
    pulls in `event-emitter` and `es5-ext`; through Turbopack's interop that shim
    arrives with `contains.call` not a function, and Paged.js throws while
    constructing its handlers. And its `exports` map declares no subpath entries,
    so importing `pagedjs/dist/paged.esm.js` directly cannot resolve at all.

    `dist/paged.esm.js` is the same library with its dependencies already bundled
    in, which is the shape that works. Aliasing the bare specifier is the only
    way to reach it.
  */
  turbopack: {
    resolveAlias: {
      pagedjs: './node_modules/pagedjs/dist/paged.esm.js',
    },
  },

  experimental: {
    optimizePackageImports: ['motion'],
  },
};

export default nextConfig;
