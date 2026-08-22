import type { Metadata } from 'next';
import Link from 'next/link';
import { DateTime } from 'luxon';

import { createClient } from '@/lib/supabase/server';
import { Reveal } from '@/components/motion/Reveal';
import type { Category, Post } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Writing on Vedic astrology: how charts are read, what the classical ' +
    'texts actually say, and where the popular version goes wrong.',
};

export const dynamic = 'force-dynamic';

type Row = Post & { category: Pick<Category, 'name' | 'slug'> | null };

export default async function BlogPage() {
  const supabase = await createClient();

  // The row policy already limits this to published posts whose publication
  // time has passed, so scheduling is enforced by the database rather than by
  // a filter that could be forgotten here.
  const { data } = await supabase
    .from('posts')
    .select('*, category:categories(name, slug)')
    .order('published_at', { ascending: false });

  const posts = (data as unknown as Row[] | null) ?? [];

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
        <header className="max-w-xl">
          <p className="eyebrow" data-reveal>Journal</p>
          <h1
            className="font-display mt-5 text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.04]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            Notes on reading
            <span className="text-gold-leaf block">a chart.</span>
          </h1>
          <p
            className="mt-6 text-[1.0625rem] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
            data-reveal
          >
            What the classical texts actually say, where the popular version
            departs from them, and how to work through a chart yourself.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="surface-card mt-12 p-7" data-reveal>
            <p className="font-display text-xl" style={{ color: 'var(--color-gold-200)' }}>
              Nothing published yet
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The first pieces are being written. In the meantime, every
              calculation tool on the site is free and fully working.
            </p>
            <Link
              href="/tools"
              className="mt-5 inline-block text-sm underline underline-offset-4"
              style={{ color: 'var(--color-gold-400)' }}
            >
              See the tools
            </Link>
          </div>
        ) : (
          <ul className="mt-14">
            {posts.map((post, i) => (
              <li
                key={post.id}
                data-reveal
                style={{ '--reveal-delay': `${i * 60}ms` } as React.CSSProperties}
              >
                <Link href={`/blog/${post.slug}`} className="group block border-t py-8">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {post.category && (
                      <span className="eyebrow">{post.category.name}</span>
                    )}
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

                  <h2
                    className="font-display mt-2.5 text-2xl leading-snug transition-colors duration-300 group-hover:text-[var(--color-gold-200)] sm:text-3xl"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p
                      className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
