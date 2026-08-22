import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DateTime } from 'luxon';

import { createClient } from '@/lib/supabase/server';
import { tableOfContents } from '@/lib/blog/markdown';
import { SITE } from '@/lib/site';
import { Reveal } from '@/components/motion/Reveal';
import type { Category, Post } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

type Row = Post & {
  content: { markdown?: string } | null;
  category: Pick<Category, 'name' | 'slug'> | null;
};

async function getPost(slug: string): Promise<Row | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('*, category:categories(name, slug)')
    .eq('slug', slug)
    .maybeSingle();
  return (data as unknown as Row | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: 'Not found' };

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const toc = post.content?.markdown ? tableOfContents(post.content.markdown) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
  };

  return (
    <div className="relative">
      <Reveal />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="relative mx-auto max-w-3xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
        <Link
          href="/blog"
          className="text-xs transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Journal
        </Link>

        <header className="mt-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {post.category && <span className="eyebrow">{post.category.name}</span>}
            {post.published_at && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {DateTime.fromISO(post.published_at).toFormat('d LLLL yyyy')}
              </span>
            )}
            {post.reading_minutes && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {post.reading_minutes} min read
              </span>
            )}
          </div>

          <h1
            className="font-display mt-4 text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.05]"
            style={{ color: 'var(--text-primary)' }}
          >
            {post.title}
          </h1>

          {post.excerpt && (
            <p
              className="mt-5 text-[1.125rem] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {post.excerpt}
            </p>
          )}
        </header>

        <div className="rule-gold my-10" />

        {/* Contents, only when the piece is long enough to need one. */}
        {toc.length >= 3 && (
          <nav
            className="surface-card mb-10 p-5"
            aria-label="Contents"
          >
            <p className="eyebrow">Contents</p>
            <ol className="mt-3 space-y-1.5">
              {toc.map((entry) => (
                <li key={entry.id} style={{ paddingLeft: entry.level === 3 ? '1rem' : 0 }}>
                  <a
                    href={`#${entry.id}`}
                    className="text-sm underline-offset-4 hover:underline"
                    style={{
                      color:
                        entry.level === 2 ? 'var(--text-secondary)' : 'var(--text-muted)',
                    }}
                  >
                    {entry.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Rendered at save time from markdown the administrator wrote. Row
            level security means nobody else can author a post. */}
        <div
          className="prose-vedic"
          dangerouslySetInnerHTML={{ __html: post.content_html ?? '' }}
        />

        <footer className="mt-16 border-t pt-8">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Want your own chart read properly?
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/tools/kundli"
              className="rounded-full border px-5 py-2.5 text-sm"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
            >
              Cast it free
            </Link>
            <Link
              href="/services"
              className="rounded-full px-5 py-2.5 text-sm font-medium"
              style={{
                background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
                color: '#150e00',
              }}
            >
              Book a reading
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
