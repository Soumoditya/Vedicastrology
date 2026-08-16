'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient, isAdmin } from '@/lib/supabase/server';
import type { ModerationStatus } from '@/lib/supabase/types';

export interface TestimonialState {
  error?: string;
  message?: string;
}

const schema = z.object({
  author_name: z.string().min(2, 'Please give a name to publish this under.'),
  author_location: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(20, 'A couple of sentences helps more than a few words.'),
  service_id: z.string().uuid().optional().or(z.literal('')),
});

/**
 * Submit a testimonial.
 *
 * Always lands as `pending`. The row policy enforces that independently, so a
 * mistake here cannot put unreviewed text on the site.
 */
export async function submitTestimonial(
  _prev: TestimonialState,
  formData: FormData,
): Promise<TestimonialState> {
  const parsed = schema.safeParse({
    author_name: formData.get('author_name'),
    author_location: formData.get('author_location') || undefined,
    rating: formData.get('rating'),
    body: formData.get('body'),
    service_id: formData.get('service_id') || '',
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('testimonials').insert({
    user_id: user?.id ?? null,
    author_name: parsed.data.author_name,
    author_location: parsed.data.author_location ?? null,
    rating: parsed.data.rating,
    body: parsed.data.body,
    service_id: parsed.data.service_id || null,
    status: 'pending',
    is_featured: false,
  });

  if (error) return { error: 'Could not send that. Please try again in a moment.' };

  return {
    message:
      'Thank you. It will appear once it has been read, which is usually within a day or two.',
  };
}

export async function moderateTestimonial(formData: FormData): Promise<void> {
  if (!(await isAdmin())) throw new Error('Not authorised.');

  const id = formData.get('id') as string;
  const status = formData.get('status') as ModerationStatus;
  const feature = formData.get('feature');

  const supabase = await createClient();

  const update: Record<string, unknown> = { status };
  if (feature !== null) update.is_featured = feature === 'on';

  await supabase.from('testimonials').update(update).eq('id', id);

  revalidatePath('/admin/testimonials');
  revalidatePath('/testimonials');
}
