import { createClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/site';
import type { Post } from '@/lib/supabase/types';

/**
 * RSS feed of published posts.
 *
 * The row policy already restricts this to posts whose publication time has
 * passed, so a scheduled post cannot leak through the feed ahead of its date.
 */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);

  const posts = (data as Post[] | null) ?? [];

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE.url}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE.url}/blog/${post.slug}</guid>
      ${post.published_at ? `<pubDate>${new Date(post.published_at).toUTCString()}</pubDate>` : ''}
      <description>${escapeXml(post.excerpt ?? '')}</description>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${SITE.url}/blog</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
