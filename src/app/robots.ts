import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/api/',
          '/auth/',
          // Tool addresses carry birth details in the query string. Indexing
          // them would publish someone's private data through search.
          '/tools/kundli?',
          '/tools/dasha?',
          '/tools/transits?',
          '/tools/matching?',
          '/tools/nakshatra?',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
