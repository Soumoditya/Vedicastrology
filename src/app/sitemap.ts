import type { MetadataRoute } from 'next';

import { createClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/site';

/**
 * Sitemap.
 *
 * Tool result pages are deliberately excluded. Their addresses carry someone's
 * birth details, and submitting those to a search engine would publish private
 * information. Only the empty tool pages are listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/tools`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/tools/kundli`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/tools/panchang`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/tools/dasha`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/transits`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/matching`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/yogas`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/tools/remedies`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tools/nakshatra`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/services`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/testimonials`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/method`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/legal/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/refund`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    const [services, posts] = await Promise.all([
      supabase.from('services').select('slug, updated_at').eq('is_active', true),
      supabase.from('posts').select('slug, updated_at'),
    ]);

    for (const s of (services.data ?? []) as { slug: string; updated_at: string }[]) {
      staticPages.push({
        url: `${base}/services/${s.slug}`,
        lastModified: new Date(s.updated_at),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }

    for (const p of (posts.data ?? []) as { slug: string; updated_at: string }[]) {
      staticPages.push({
        url: `${base}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch {
    // A database hiccup should not produce an empty sitemap; the static pages
    // are still worth serving.
  }

  return staticPages;
}
