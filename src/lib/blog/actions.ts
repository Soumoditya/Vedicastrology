'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient, isAdmin } from '@/lib/supabase/server';
import {
  addHeadingIds,
  autoExcerpt,
  readingMinutes,
  renderMarkdown,
  slugify,
} from './markdown';

export interface PostState {
  error?: string;
  message?: string;
}

const postSchema = z.object({
  title: z.string().min(2, 'Give the post a title.'),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  body: z.string().min(1, 'The post is empty.'),
  category_id: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['draft', 'scheduled', 'published']),
  published_at: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

/**
 * Create or update a post.
 *
 * The markdown source is stored alongside the rendered HTML. Rendering at save
 * time rather than on every request keeps reading a post cheap, and keeping the
 * source means a post stays editable and portable.
 */
export async function savePost(
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  if (!(await isAdmin())) return { error: 'Not authorised.' };

  const parsed = postSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug') || undefined,
    excerpt: formData.get('excerpt') || undefined,
    body: formData.get('body'),
    category_id: formData.get('category_id') || '',
    status: formData.get('status') || 'draft',
    published_at: formData.get('published_at') || undefined,
    seo_title: formData.get('seo_title') || undefined,
    seo_description: formData.get('seo_description') || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const id = (formData.get('id') as string | null) || null;
  const supabase = await createClient();

  /*
    A published post must carry a publication date, and the database enforces
    that with a CHECK. Supplying it here rather than letting the insert fail
    means publishing never errors just because the field was left blank.
  */
  let publishedAt: string | null = null;
  if (d.status === 'published') {
    publishedAt = d.published_at
      ? new Date(d.published_at).toISOString()
      : new Date().toISOString();
  } else if (d.status === 'scheduled') {
    if (!d.published_at) {
      return { error: 'A scheduled post needs the date and time it should appear.' };
    }
    publishedAt = new Date(d.published_at).toISOString();
  }

  const row = {
    title: d.title,
    slug: d.slug?.trim() ? slugify(d.slug) : slugify(d.title),
    excerpt: d.excerpt?.trim() || autoExcerpt(d.body),
    content: { markdown: d.body },
    content_html: addHeadingIds(renderMarkdown(d.body)),
    category_id: d.category_id || null,
    status: d.status,
    published_at: publishedAt,
    reading_minutes: readingMinutes(d.body),
    seo_title: d.seo_title || null,
    seo_description: d.seo_description || null,
  };

  const result = id
    ? await supabase.from('posts').update(row).eq('id', id).select('id').single()
    : await supabase.from('posts').insert(row).select('id').single();

  if (result.error) {
    if (result.error.code === '23505') {
      return { error: 'Another post already uses that web address.' };
    }
    return { error: result.error.message };
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${row.slug}`);
  revalidatePath('/admin/posts');
  redirect(`/admin/posts/${result.data.id}?saved=1`);
}

export async function deletePost(formData: FormData): Promise<void> {
  if (!(await isAdmin())) throw new Error('Not authorised.');

  const supabase = await createClient();
  await supabase.from('posts').delete().eq('id', formData.get('id') as string);

  revalidatePath('/blog');
  revalidatePath('/admin/posts');
  redirect('/admin/posts');
}
