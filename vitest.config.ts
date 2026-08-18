import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only` is a build-time guard for Next.js; under test it is a no-op.
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    /*
      Twenty seconds, not the default five.

      These are not slow by accident. A single signal-extraction case casts
      charts with the Swiss Ephemeris across four periods, and the accuracy suite
      compares hundreds of longitudes to the arc-second. On a machine with little
      memory to spare — or a CI runner sharing a box — individual cases sit close
      enough to five seconds that the suite failed intermittently, and an
      intermittent suite is worse than a slow one: it stops being usable as
      evidence that a change is safe, which is the whole reason this suite exists.
    */
    testTimeout: 20_000,
  },
});
