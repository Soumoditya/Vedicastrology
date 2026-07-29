import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { deletePost } from '@/lib/blog/actions';
import { PostEditor } from '@/components/admin/PostEditor';
import type { Category, Post } from '@/lib/supabase/types';

export const metadata = { title: 'Edit post', robots: { index: false } };

export default async function EditPost({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const supabase = await createClient();
  const [postResult, categoriesResult] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).maybeSingle(),
    supabase.from('categories').select('*').order('sort_order'),
  ]);

  const post = postResult.data as (Post & { content: { markdown?: string } | null }) | null;
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-display mb-1.5 text-2xl" style={{ color: 'var(--text-primary)' }}>
        {post.title}
      </h1>
      {post.status === 'published' && (
        <a
          href={`/blog/${post.slug}`}
          className="mb-6 inline-block text-xs underline underline-offset-4"
          style={{ color: 'var(--color-gold-400)' }}
        >
          View on the site
        </a>
      )}

      {saved && (
        <p
          role="status"
          className="mb-5 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'color-mix(in oklab, var(--color-benefic) 40%, transparent)',
            background: 'color-mix(in oklab, var(--color-benefic) 8%, transparent)',
            color: 'var(--color-benefic)',
          }}
        >
          Saved.
        </p>
      )}

      <PostEditor post={post} categories={(categoriesResult.data as Category[] | null) ?? []} />

      <form action={deletePost} className="mt-10 border-t pt-6">
        <input type="hidden" name="id" value={post.id} />
        <button
          type="submit"
          className="text-xs underline underline-offset-4"
          style={{ color: 'var(--color-malefic)' }}
        >
          Delete this post permanently
        </button>
      </form>
    </div>
  );
}
