'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { castChart } from '@/lib/astro/chart';
import { buildResearchRow } from '@/lib/research/capture';
import { parseYears } from '@/lib/research/vocab';

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
 *
 * Every write here is checked. An earlier version threw the error away and
 * returned nothing, so when the column grant was missing the checkbox simply
 * sprang back with no explanation at all. A preference that cannot report its
 * own failure is worse than no preference.
 */
export async function setResearchConsent(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in first.' };

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

  const { error } = await supabase
    .from('profiles')
    .update({
      research_consent: consent,
      research_consent_at: consent ? new Date().toISOString() : null,
      research_subject_key: subjectKey,
    })
    .eq('id', user.id);

  if (error) {
    return { error: 'Could not save that preference. Please try again.' };
  }

  // Consenting after charts were already saved should contribute one of them.
  // Otherwise consent would appear to do nothing until the next chart was
  // saved, which is the state this feature was stuck in.
  if (consent) await ensureResearchRow(user.id);

  revalidatePath('/dashboard');

  return {
    message: consent
      ? 'Thank you. Your chart is now part of the research set.'
      : 'Research sharing is off, and your contribution has been deleted.',
  };
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
 *
 * First chart wins. The dataset holds one row per person, and the life events
 * on that row are the contributor's own, so letting each newly saved chart
 * overwrite it would eventually attach somebody's marriage year to their
 * friend's chart. Once a contribution exists it is left alone.
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

  const { data: existing } = await supabase
    .from('research_charts')
    .select('subject_key')
    .eq('subject_key', p.research_subject_key)
    .maybeSingle();

  if (existing) return;

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

    const { error } = await supabase
      .from('research_charts')
      .upsert(row, { onConflict: 'subject_key' });

    if (error) console.error('[research] contribution rejected', error.message);
  } catch (error) {
    // A research contribution must never break saving a chart. The person's
    // own data is the thing that matters here.
    console.error('[research] contribution failed', error);
  }
}

/**
 * Make sure a consenting person actually has a row in the research set.
 *
 * Consent on its own used to create nothing, so somebody who ticked the box
 * without afterwards saving a fresh chart had no row for their life details to
 * attach to, and the form reported success while writing nothing. The oldest
 * saved chart is used, on the reasoning that the first chart a person casts for
 * themselves is almost always their own.
 *
 * Returns true when a row exists afterwards.
 */
async function ensureResearchRow(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('research_consent, research_subject_key')
    .eq('id', userId)
    .maybeSingle();

  const p = profile as
    | { research_consent: boolean; research_subject_key: string | null }
    | null;

  if (!p?.research_consent || !p.research_subject_key) return false;

  const { data: existing } = await supabase
    .from('research_charts')
    .select('subject_key')
    .eq('subject_key', p.research_subject_key)
    .maybeSingle();

  if (existing) return true;

  const { data: saved } = await supabase
    .from('birth_profiles')
    .select('birth_date, birth_time, time_unknown, timezone, place_name, latitude, longitude, gender')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!saved) return false;

  const s = saved as {
    birth_date: string;
    birth_time: string | null;
    time_unknown: boolean;
    timezone: string;
    place_name: string;
    latitude: number;
    longitude: number;
    gender: string | null;
  };

  await contributeResearch(userId, {
    date: s.birth_date,
    time: s.birth_time ? s.birth_time.slice(0, 5) : null,
    timeUnknown: s.time_unknown,
    timezone: s.timezone,
    placeName: s.place_name,
    latitude: s.latitude,
    longitude: s.longitude,
    gender: s.gender,
  });

  const { data: after } = await supabase
    .from('research_charts')
    .select('subject_key')
    .eq('subject_key', p.research_subject_key)
    .maybeSingle();

  return Boolean(after);
}

// ---------------------------------------------------------------------------
// Life events
// ---------------------------------------------------------------------------

const lifeEventsSchema = z.object({
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  marriage_year: z.coerce.number().int().min(1800).max(2400).optional().nullable(),
  children_count: z.coerce.number().int().min(0).max(30).optional().nullable(),
  first_child_year: z.coerce.number().int().min(1800).max(2400).optional().nullable(),
  education_level: z.string().optional(),
  occupation_category: z.string().optional(),
});

/**
 * Save the optional life details that let the research set test a claim
 * rather than only describe distributions.
 *
 * Writes nothing unless the person has opted into research, and writes health
 * years only if they have also given the separate health consent.
 */
export async function saveLifeEvents(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Please sign in first.' };

  const healthConsent = formData.get('health_consent') === 'on';

  const { data: profile } = await supabase
    .from('profiles')
    .select('research_consent, research_subject_key')
    .eq('id', user.id)
    .maybeSingle();

  const p = profile as
    | { research_consent: boolean; research_subject_key: string | null }
    | null;

  // Checked before the health consent is written, so that somebody who has not
  // opted into research at all does not leave a health decision recorded.
  if (!p?.research_consent || !p.research_subject_key) {
    return {
      error:
        'Turn on research sharing above first, then these details can be saved.',
    };
  }

  // Record the health decision before the details, so that withdrawing it
  // clears the stored years through the database trigger.
  const { error: healthError } = await supabase
    .from('profiles')
    .update({ health_research_consent: healthConsent })
    .eq('id', user.id);

  if (healthError) {
    return { error: 'Could not save that. Please try again.' };
  }

  // There must be something to attach the details to. Consent alone creates no
  // row, and without this check the update below would match nothing, which
  // Postgres reports as success.
  const hasRow = await ensureResearchRow(user.id);
  if (!hasRow) {
    return {
      error:
        'Save a chart first, then these details have a chart to attach to.',
    };
  }

  const parsed = lifeEventsSchema.safeParse({
    gender: formData.get('gender') || undefined,
    marital_status: formData.get('marital_status') || undefined,
    marriage_year: formData.get('marriage_year') || null,
    children_count: formData.get('children_count') || null,
    first_child_year: formData.get('first_child_year') || null,
    education_level: formData.get('education_level') || undefined,
    occupation_category: formData.get('occupation_category') || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const { data: written, error } = await supabase
    .from('research_charts')
    .update({
      gender: d.gender || null,
      marital_status: d.marital_status || null,
      marriage_year: d.marriage_year ?? null,
      children_count: d.children_count ?? null,
      first_child_year: d.first_child_year ?? null,
      education_level: d.education_level || null,
      occupation_category: d.occupation_category || null,
      career_change_years: parseYears(formData.get('career_change_years') as string),
      relocation_years: parseYears(formData.get('relocation_years') as string),
      // Health years are written only with the separate consent. Without it
      // the array is cleared rather than left behind.
      major_health_years: healthConsent
        ? parseYears(formData.get('major_health_years') as string)
        : [],
      life_events_updated_at: new Date().toISOString(),
    })
    .eq('subject_key', p.research_subject_key)
    .select('subject_key');

  if (error) {
    return { error: 'Could not save those details. Please try again.' };
  }

  // An update that matches no rows is not an error in Postgres, so a null
  // error proves nothing on its own. Row security can filter the match away
  // and leave this looking like a clean success while writing nothing, which
  // is exactly how this form used to lie about having saved.
  if (!written || written.length === 0) {
    return {
      error: 'Those details did not save. Please try again in a moment.',
    };
  }

  revalidatePath('/dashboard');
  return { message: 'Details saved. Thank you, this is genuinely useful.' };
}

// ---------------------------------------------------------------------------
// Settings and notifications
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  chart_style: z.enum(['north', 'south']),
  ayanamsa: z.string().min(1),
  house_system: z.string().min(1),
  node_type: z.enum(['mean', 'true']),
  language: z.enum(['en', 'hi', 'bn']),
  theme: z.enum(['dark', 'light', 'system']),
  timezone: z.string().optional(),
});

/**
 * Save account settings.
 *
 * Upserted rather than updated, because somebody who has never opened this
 * page has no row. The alternative, creating a row for everyone at signup,
 * would fill the table with copies of the defaults.
 */
export async function saveSettings(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Please sign in.' };

  const parsed = settingsSchema.safeParse({
    chart_style: formData.get('chart_style'),
    ayanamsa: formData.get('ayanamsa'),
    house_system: formData.get('house_system'),
    node_type: formData.get('node_type'),
    language: formData.get('language'),
    theme: formData.get('theme'),
    timezone: formData.get('timezone') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Those settings were not valid.' };
  }

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      ...parsed.data,
      timezone: parsed.data.timezone ?? null,
    },
    { onConflict: 'user_id' },
  );

  if (error) return { error: error.message };

  revalidatePath('/dashboard/settings');
  revalidatePath('/tools/kundli');

  return { message: 'Settings saved.' };
}

const notificationSchema = z.object({
  email_enabled: z.coerce.boolean(),
  whatsapp_enabled: z.coerce.boolean(),
  sms_enabled: z.coerce.boolean(),
  phone: z.string().optional(),
  daily_reading: z.coerce.boolean(),
  weekly_reading: z.coerce.boolean(),
  monthly_reading: z.coerce.boolean(),
  transit_alerts: z.coerce.boolean(),
  newsletter: z.coerce.boolean(),
  send_hour: z.coerce.number().int().min(0).max(23),
});

export async function saveNotificationPreferences(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Please sign in.' };

  const bool = (name: string) => formData.get(name) === 'on';

  const parsed = notificationSchema.safeParse({
    email_enabled: bool('email_enabled'),
    whatsapp_enabled: bool('whatsapp_enabled'),
    sms_enabled: bool('sms_enabled'),
    phone: formData.get('phone') || undefined,
    daily_reading: bool('daily_reading'),
    weekly_reading: bool('weekly_reading'),
    monthly_reading: bool('monthly_reading'),
    transit_alerts: bool('transit_alerts'),
    newsletter: bool('newsletter'),
    send_hour: formData.get('send_hour') ?? 7,
  });

  if (!parsed.success) {
    return { error: 'Those preferences were not valid.' };
  }

  const phone = parsed.data.phone?.trim() || null;

  // A messaging channel cannot be switched on without somewhere to send to.
  // Silently storing an enabled channel with no number would produce a queue
  // full of undeliverable rows later.
  if ((parsed.data.whatsapp_enabled || parsed.data.sms_enabled) && !phone) {
    return { error: 'Add a phone number before turning on WhatsApp or SMS.' };
  }

  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('whatsapp_opt_in_at, sms_opt_in_at')
    .eq('user_id', user.id)
    .maybeSingle();

  const now = new Date().toISOString();

  const { error } = await supabase.from('notification_preferences').upsert(
    {
      user_id: user.id,
      ...parsed.data,
      phone,
      /*
        Consent is stamped the first time a channel is turned on and kept
        thereafter, so switching it off and on again does not rewrite history.
        A boolean alone cannot show when somebody agreed to be messaged, and
        for WhatsApp that record is the thing being asked for.
      */
      whatsapp_opt_in_at: parsed.data.whatsapp_enabled
        ? (existing?.whatsapp_opt_in_at ?? now)
        : null,
      sms_opt_in_at: parsed.data.sms_enabled
        ? (existing?.sms_opt_in_at ?? now)
        : null,
    },
    { onConflict: 'user_id' },
  );

  if (error) return { error: error.message };

  revalidatePath('/dashboard/settings');

  return { message: 'Preferences saved.' };
}
