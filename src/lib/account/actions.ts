'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { castChart } from '@/lib/astro/chart';
import { buildResearchRow } from '@/lib/research/capture';

export interface AccountState {
  error?: string;
  message?: string;
}

const saveChartSchema = z.object({
  label: z.string().min(1, 'Give this chart a name so you can find it again.'),
  person_name: z.string().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.'),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  time_unknown: z.coerce.boolean().optional(),
  timezone: z.string().min(1),
  place_name: z.string().min(1),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  gender: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Save a chart to the signed-in person's account.
 *
 * Only the birth details are stored. The chart itself is recomputed on every
 * view, so a correction to the engine improves every saved chart rather than
 * leaving stale results behind.
 */
export async function saveBirthProfile(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Please sign in to save a chart.' };

  const parsed = saveChartSchema.safeParse({
    label: formData.get('label'),
    person_name: formData.get('person_name') || undefined,
    birth_date: formData.get('birth_date'),
    birth_time: formData.get('birth_time') || '',
    time_unknown: formData.get('time_unknown') === 'on',
    timezone: formData.get('timezone'),
    place_name: formData.get('place_name'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    gender: formData.get('gender') || undefined,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const timeUnknown = d.time_unknown ?? false;

  const { error } = await supabase.from('birth_profiles').insert({
    user_id: user.id,
    label: d.label,
    person_name: d.person_name ?? null,
    birth_date: d.birth_date,
    birth_time: timeUnknown ? null : d.birth_time || null,
    time_unknown: timeUnknown,
    timezone: d.timezone,
    place_name: d.place_name,
    latitude: d.latitude,
    longitude: d.longitude,
    gender: d.gender ?? null,
    notes: d.notes ?? null,
  });

  if (error) return { error: 'Could not save that chart. Please try again.' };

  // Contribute to research only if this person has opted in.
  await contributeResearch(user.id, {
    date: d.birth_date,
    time: timeUnknown ? null : d.birth_time || null,
    timeUnknown,
    timezone: d.timezone,
    placeName: d.place_name,
    latitude: d.latitude,
    longitude: d.longitude,
    gender: d.gender ?? null,
  });

  revalidatePath('/dashboard');
  return { message: 'Chart saved.' };
}

export async function deleteBirthProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const id = formData.get('id') as string;

  // The row policy restricts this to the owner's own rows, so no extra
  // ownership check is needed here.
  await supabase.from('birth_profiles').delete().eq('id', id);

  revalidatePath('/dashboard');
}

/**
 * Record or withdraw research consent.
 *
 * Withdrawal removes the contributed row, enforced by a database trigger so it
 * cannot be missed by application code.
 */
export async function setResearchConsent(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const consent = formData.get('consent') === 'on';

  const { data: profile } = await supabase
    .from('profiles')
    .select('research_subject_key')
    .eq('id', user.id)
    .maybeSingle();

  // The pseudonymous key is minted once and reused, so re-consenting updates
  // the same research row rather than creating a second one.
  const subjectKey =
    (profile as { research_subject_key: string | null } | null)?.research_subject_key ??
    randomUUID();

  await supabase
    .from('profiles')
    .update({
      research_consent: consent,
      research_consent_at: consent ? new Date().toISOString() : null,
      research_subject_key: subjectKey,
    })
    .eq('id', user.id);

  revalidatePath('/dashboard');
}

// ---------------------------------------------------------------------------

interface ContributionInput {
  date: string;
  time: string | null;
  timeUnknown: boolean;
  timezone: string;
  placeName: string;
  latitude: number;
  longitude: number;
  gender: string | null;
}

/**
 * Add a chart to the research set, but only with consent.
 *
 * Silently does nothing when consent has not been given. That is deliberate:
 * the caller should not have to remember to check, and the safe path is the
 * default one.
 */
async function contributeResearch(userId: string, input: ContributionInput) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('research_consent, research_subject_key')
    .eq('id', userId)
    .maybeSingle();

  const p = profile as
    | { research_consent: boolean; research_subject_key: string | null }
    | null;

  if (!p?.research_consent || !p.research_subject_key) return;

  const [year, month, day] = input.date.split('-').map(Number);
  const [hour, minute] = (input.time ?? '12:00').split(':').map(Number);

  try {
    const chart = castChart({
      year,
      month,
      day,
      hour,
      minute,
      timeUnknown: input.timeUnknown,
      place: {
        name: input.placeName,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezone,
      },
    });

    const row = buildResearchRow({
      subjectKey: p.research_subject_key,
      chart,
      local: { year, month, day, hour, minute },
      gender: input.gender,
    });

    await supabase
      .from('research_charts')
      .upsert(row, { onConflict: 'subject_key' });
  } catch (error) {
    // A research contribution must never break saving a chart. The person's
    // own data is the thing that matters here.
    console.error('[research] contribution failed', error);
  }
}
