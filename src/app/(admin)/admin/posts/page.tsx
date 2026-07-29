import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import type { Post } from '@/lib/supabase/types';

export const metadata = { title: 'Journal', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPosts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  const posts = (data as Post[] | null) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
            Journal
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Write, schedule and publish.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{
            background: 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
            color: '#160f00',
          }}
        >
          Write a post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="surface-card p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          Nothing written yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/admin/posts/${post.id}`}
                className="surface-card flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate" style={{ color: 'var(--text-primary)' }}>
                    {post.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                    /{post.slug}
                    {post.published_at &&
                      ` · ${new Date(post.published_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}`}
                    {post.reading_minutes ? ` · ${post.reading_minutes} min read` : ''}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-wider"
                  style={{
                    background:
                      post.status === 'published'
                        ? 'color-mix(in oklab, var(--color-benefic) 16%, transparent)'
                        : post.status === 'scheduled'
                          ? 'color-mix(in oklab, var(--color-gold-500) 16%, transparent)'
                          : 'color-mix(in oklab, var(--text-muted) 14%, transparent)',
                    color:
                      post.status === 'published'
                        ? 'var(--color-benefic)'
                        : post.status === 'scheduled'
                          ? 'var(--color-gold-300)'
                          : 'var(--text-muted)',
                  }}
                >
                  {post.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
