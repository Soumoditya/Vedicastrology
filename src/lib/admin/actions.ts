'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient, isAdmin } from '@/lib/supabase/server';

/**
 * Admin server actions.
 *
 * Every one calls `requireAdmin()` first. Row level security would refuse an
 * unauthorised write anyway, but failing here gives a clear error instead of a
 * silent no-op, and keeps the authorisation decision visible in the code rather
 * than buried in a policy.
 */

export interface ActionState {
  error?: string;
  message?: string;
}

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error('Not authorised.');
  }
  return createClient();
}

/** Turn a title into a URL-safe slug. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

const serviceSchema = z.object({
  title: z.string().min(2, 'Give the service a title.'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().int().positive().optional().nullable(),
  deliverables: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  is_featured: z.coerce.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
});

export async function saveService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const parsed = serviceSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug') || undefined,
    summary: formData.get('summary') || undefined,
    description: formData.get('description') || undefined,
    duration_minutes: formData.get('duration_minutes') || undefined,
    deliverables: formData.get('deliverables') || undefined,
    is_active: formData.get('is_active') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    sort_order: formData.get('sort_order') || 0,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = (formData.get('id') as string | null) || null;
  const data = parsed.data;

  const row = {
    title: data.title,
    slug: data.slug?.trim() ? slugify(data.slug) : slugify(data.title),
    summary: data.summary ?? null,
    description: data.description ?? null,
    duration_minutes: data.duration_minutes ?? null,
    // One deliverable per line, a plain textarea is far easier to edit than a
    // repeating field, and this is the only transformation it needs.
    deliverables: (data.deliverables ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    is_active: data.is_active ?? false,
    is_featured: data.is_featured ?? false,
    sort_order: data.sort_order ?? 0,
  };

  const result = id
    ? await supabase.from('services').update(row).eq('id', id).select('id').single()
    : await supabase.from('services').insert(row).select('id').single();

  if (result.error) {
    if (result.error.code === '23505') {
      return { error: 'Another service already uses that web address (slug).' };
    }
    return { error: result.error.message };
  }

  revalidatePath('/admin/services');
  revalidatePath('/services');
  redirect(`/admin/services/${result.data.id}?saved=1`);
}

export async function deleteService(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;

  await supabase.from('services').delete().eq('id', id);

  revalidatePath('/admin/services');
  revalidatePath('/services');
  redirect('/admin/services');
}

/**
 * Save the price grid for one service.
 *
 * The form posts a field per region. A blank field means "no price in this
 * region", which deletes the row rather than storing zero, zero would display
 * as a free consultation.
 */
export async function saveServicePrices(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const serviceId = formData.get('service_id') as string;

  if (!serviceId) return { error: 'Missing service.' };

  const { data: regions } = await supabase.from('regions').select('id');
  if (!regions) return { error: 'Could not load regions.' };

  for (const region of regions as { id: string }[]) {
    const raw = (formData.get(`price_${region.id}`) as string | null)?.trim();
    const compareRaw = (formData.get(`compare_${region.id}`) as string | null)?.trim();

    if (!raw) {
      await supabase
        .from('service_prices')
        .delete()
        .eq('service_id', serviceId)
        .eq('region_id', region.id);
      continue;
    }

    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: `"${raw}" is not a valid amount.` };
    }

    const compareAt = compareRaw ? Number(compareRaw) : null;
    if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt < amount)) {
      return {
        error: 'The "was" price must be higher than the price you are charging.',
      };
    }

    const { error } = await supabase.from('service_prices').upsert(
      {
        service_id: serviceId,
        region_id: region.id,
        amount,
        compare_at: compareAt,
      },
      { onConflict: 'service_id,region_id' },
    );

    if (error) return { error: error.message };
  }

  revalidatePath('/admin/services');
  revalidatePath('/services');
  return { message: 'Prices saved.' };
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

const regionSchema = z.object({
  code: z.string().min(2, 'Give the region a short code, such as UK.').max(12),
  name: z.string().min(2, 'Give the region a name.'),
  currency: z
    .string()
    .length(3, 'Use the three-letter currency code, such as GBP.')
    .transform((v) => v.toUpperCase()),
  symbol: z.string().min(1, 'Give the currency symbol, such as £.').max(4),
  country_codes: z.string().optional(),
  sort_order: z.coerce.number().int().optional(),
});

export async function saveRegion(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const parsed = regionSchema.safeParse({
    code: formData.get('code'),
    name: formData.get('name'),
    currency: formData.get('currency'),
    symbol: formData.get('symbol'),
    country_codes: formData.get('country_codes') || '',
    sort_order: formData.get('sort_order') || 0,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = (formData.get('id') as string | null) || null;
  const makeDefault = formData.get('is_default') === 'on';

  const row = {
    code: parsed.data.code.trim().toUpperCase(),
    name: parsed.data.name.trim(),
    currency: parsed.data.currency,
    symbol: parsed.data.symbol.trim(),
    // Accepts "GB, IE, FR" or "GB IE FR" or one per line, whatever is easiest
    // to paste in.
    country_codes: (parsed.data.country_codes ?? '')
      .split(/[\s,]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c)),
    sort_order: parsed.data.sort_order ?? 0,
  };

  // Only one region may be the default, and the database enforces it with a
  // unique index. Clear the old one first or the write is rejected.
  if (makeDefault) {
    await supabase.from('regions').update({ is_default: false }).eq('is_default', true);
  }

  const result = id
    ? await supabase
        .from('regions')
        .update({ ...row, is_default: makeDefault })
        .eq('id', id)
    : await supabase.from('regions').insert({ ...row, is_default: makeDefault });

  if (result.error) {
    if (result.error.code === '23505') {
      return { error: 'A region with that code already exists.' };
    }
    return { error: result.error.message };
  }

  revalidatePath('/admin/regions');
  revalidatePath('/services');
  return { message: `Region "${row.name}" saved.` };
}

export async function deleteRegion(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;

  // Deleting the default would leave visitors whose country matches nothing
  // with no price at all, so it is refused here.
  const { data: region } = await supabase
    .from('regions')
    .select('is_default')
    .eq('id', id)
    .single();

  if (!region?.is_default) {
    await supabase.from('regions').delete().eq('id', id);
  }

  revalidatePath('/admin/regions');
  redirect('/admin/regions');
}

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

const flagSchema = z.object({
  key: z.string().min(1),
  tier: z.enum(['free', 'account', 'premium']),
  enabled: z.coerce.boolean(),
});

/**
 * Move one capability between tiers, or switch it off.
 *
 * Revalidates the whole site rather than a single path, because a flag can be
 * read on any page and a stale cached copy of one page is exactly the sort of
 * half-applied change that makes gating feel broken.
 */
export async function saveFeatureFlag(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const parsed = flagSchema.safeParse({
    key: formData.get('key'),
    tier: formData.get('tier'),
    enabled: formData.get('enabled') === 'on',
  });

  if (!parsed.success) {
    return { error: 'That was not a valid change.' };
  }

  const { key, tier, enabled } = parsed.data;

  const { error } = await supabase
    .from('feature_flags')
    .update({ tier, enabled })
    .eq('key', key);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');

  return { message: 'Saved.' };
}
