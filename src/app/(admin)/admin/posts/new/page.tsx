import { createClient } from '@/lib/supabase/server';
import { PostEditor } from '@/components/admin/PostEditor';
import type { Category } from '@/lib/supabase/types';

export const metadata = { title: 'Write a post', robots: { index: false } };

export default async function NewPost() {
  const supabase = await createClient();
  const { data } = await supabase.from('categories').select('*').order('sort_order');

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl" style={{ color: 'var(--text-primary)' }}>
        Write a post
      </h1>
      <PostEditor post={null} categories={(data as Category[] | null) ?? []} />
    </div>
  );
}
