import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { getUser, createClient } from '@/lib/supabase/server';
import { toBirthQueryString } from '@/lib/astro/query';
import type { BirthProfile } from '@/lib/supabase/types';

/**
 * The chart in hand.
 *
 * A signed-in visitor who has saved a chart should never be shown a blank birth
 * form again, and until now they always were. Saving worked; what was missing
 * was any answer to "which chart does this person mean". Every link in the
 * header, on the home page, on the tool index and along the journey rail was a
 * bare path with no birth details on it, so each one landed on an empty form,
 * and the saved chart could only be reached by spotting a row of small pills
 * above that form.
 *
 * So there is now one answer, resolved once per request and shared:
 *
 *   1. Birth details in the URL win, always. They are explicit, they are what
 *      makes a result shareable and bookmarkable, and somebody reading a
 *      friend's chart must not have their own substituted underneath them.
 *   2. Otherwise the account's default chart.
 *   3. Otherwise nothing, and the form is the right thing to show.
 *
 * `cache` so that a page rendering a header, a rail and a tool body resolves it
 * once rather than three times.
 */
export const getDefaultChart = cache(async (): Promise<BirthProfile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('birth_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .maybeSingle();

  return (data as BirthProfile | null) ?? null;
});

/** Every saved chart, for the header switcher and the pickers. */
export const getSavedCharts = cache(async (): Promise<BirthProfile[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('birth_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(24);

  return (data as BirthProfile[] | null) ?? [];
});

/**
 * A saved chart as a birth query string.
 *
 * Noon when the time was never known, matching how the chart is cast
 * everywhere else, and `unknown` carried through so everything depending on the
 * ascendant stays marked as unreliable rather than quietly presented as fact.
 */
export function chartQueryString(chart: BirthProfile): string {
  return toBirthQueryString({
    date: chart.birth_date,
    time: (chart.birth_time ?? '12:00').slice(0, 5),
    latitude: chart.latitude,
    longitude: chart.longitude,
    timezone: chart.timezone,
    place: chart.place_name,
    name: chart.person_name ?? chart.label,
    timeUnknown: chart.time_unknown,
    gender: chart.gender ?? undefined,
  });
}

/**
 * Stamp a chart onto a tool link.
 *
 * Used for the header, the home page cards, the tool index and the rail, so
 * that arriving at a tool from anywhere carries the chart with it. A link that
 * already has a query string is left alone.
 */
export function withChart(href: string, chart: BirthProfile | null): string {
  if (!chart) return href;
  if (href.includes('?')) return href;
  return `${href}?${chartQueryString(chart)}`;
}

/**
 * The chart a page should use, given its own search params.
 *
 * Returns the query string to build links with and the profile it came from, so
 * a page can say whose chart it is showing without querying again.
 */
export async function resolveChart(
  params: Record<string, string | string[] | undefined>,
): Promise<{ query: string; profile: BirthProfile | null; fromUrl: boolean }> {
  const explicit = Boolean(params.d && params.lat && params.lon);

  if (explicit) {
    const built = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      built.set(key, Array.isArray(value) ? value[0] : value);
    }
    return { query: built.toString(), profile: null, fromUrl: true };
  }

  const profile = await getDefaultChart();
  return {
    query: profile ? chartQueryString(profile) : '',
    profile,
    fromUrl: false,
  };
}

/**
 * Send a signed-in visitor to their own chart instead of a blank form.
 *
 * Called at the top of every tool that reads a single chart. The redirect is
 * deliberate rather than rendering the chart in place: it puts the birth details
 * in the address bar, so the result stays shareable, bookmarkable and
 * cacheable, and the page below can keep its single code path that trusts the
 * query string.
 *
 * `?new=1` is the way back to an empty form, for casting somebody else's chart.
 * Without an escape hatch, a person with a saved default could never reach the
 * blank form from a link again, which would trade one trap for another.
 */
export async function redirectToSavedChart(
  params: Record<string, string | string[] | undefined>,
  basePath: string,
): Promise<void> {
  // Explicit details in the URL always win. Somebody reading a friend's chart
  // must not have their own quietly substituted underneath them.
  if (params.d && params.lat && params.lon) return;
  if (params.new === '1') return;

  const chart = await getDefaultChart();
  if (!chart) return;

  redirect(`${basePath}?${chartQueryString(chart)}`);
}
