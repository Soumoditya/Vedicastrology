import 'server-only';

import { createClient, getUser } from '@/lib/supabase/server';
import { getSettings } from '@/lib/account/settings';
import { castChart } from '@/lib/astro/chart';
import type { BirthData } from '@/lib/astro/types';
import { extractSignals, type PeriodName, type SignalSet } from './signals';
import { narrate, narrationConfigured } from './narrate';
import type { ReadingState } from '@/lib/supabase/types';

/**
 * What a cache lookup returns.
 *
 * Deliberately not the whole `Reading` row. A page needs the state, and the
 * body only when it has been published, and giving it more than that would
 * invite showing something that has not been reviewed.
 */
export interface CachedReading {
  id: string;
  state: ReadingState;
  body: string | null;
  edited: boolean;
}

/**
 * Producing a reading.
 *
 * Order matters and is deliberate:
 *
 *   1. The engine extracts what is actually active. Deterministic.
 *   2. Your interpretation notes for those signals are looked up.
 *   3. The writer turns signals plus notes into prose.
 *   4. The safety filter runs over the result.
 *   5. The database decides whether it publishes or waits for review.
 *
 * Step five is not done here on purpose. `save_reading` derives the state from
 * the safety findings and the period, so a mistake in this file cannot release
 * unreviewed content.
 *
 * A reading is cached per person per chart per period per window. The unique
 * index is the cache key, so a second request for the same window returns the
 * existing row rather than paying for another generation.
 */

/** The window a period covers, aligned so everyone shares the same boundaries. */
export function periodWindow(period: PeriodName, at: Date = new Date()) {
  const start = new Date(at);
  start.setUTCHours(0, 0, 0, 0);

  if (period === 'week') {
    // Monday, because a week that starts on the day you signed up is not a week
    // anybody recognises, and it would also defeat the cache.
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  } else if (period === 'month') {
    start.setUTCDate(1);
  } else if (period === 'year') {
    start.setUTCMonth(0, 1);
  }

  const end = new Date(start);
  if (period === 'day') end.setUTCDate(end.getUTCDate() + 1);
  else if (period === 'week') end.setUTCDate(end.getUTCDate() + 7);
  else if (period === 'month') end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);

  return { start, end };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface ReadingResult {
  /** Null when nothing could be produced, with `note` saying why. */
  reading: CachedReading | null;
  /** Always present, so a page can show the working even with no prose. */
  signals: SignalSet;
  /** Whether prose is available at all in this deployment. */
  writerConfigured: boolean;
  note?: string;
}

/**
 * Your interpretation notes for a set of signals.
 *
 * Exact code first, then the prefix, so a note written for
 * `dasha.mahadasha.Saturn` beats a general one for `dasha`.
 */
async function editorialFor(codes: string[]): Promise<string | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from('interpretation_notes').select('code, label, note');
  if (!data || data.length === 0) return undefined;

  const notes = data as { code: string; label: string; note: string }[];
  const matched: string[] = [];
  const used = new Set<string>();

  for (const code of codes) {
    const exact = notes.find((n) => n.code === code);
    const prefix = notes
      .filter((n) => code.startsWith(n.code))
      .sort((a, b) => b.code.length - a.code.length)[0];

    const note = exact ?? prefix;
    if (note && !used.has(note.code)) {
      used.add(note.code);
      matched.push(`${note.label}: ${note.note}`);
    }
  }

  return matched.length > 0 ? matched.join('\n') : undefined;
}

export async function getOrCreateReading({
  period,
  birth,
  birthProfileId = null,
  at = new Date(),
}: {
  period: PeriodName;
  birth: BirthData;
  birthProfileId?: string | null;
  at?: Date;
}): Promise<ReadingResult> {
  const chart = castChart(birth);
  const { start, end } = periodWindow(period, at);

  // Signals are computed for the window's own start, not for right now, so the
  // cached reading and the breakdown beside it always describe the same period.
  const signals = extractSignals(chart, period, start);
  const writerConfigured = narrationConfigured();

  const user = await getUser();
  if (!user) {
    return { reading: null, signals, writerConfigured, note: 'not_signed_in' };
  }

  const supabase = await createClient();

  /*
    Cheap read first, and most requests land here.

    Through `find_reading` rather than a plain select, for two reasons. It scopes
    to the caller, so an administrator does not pick up somebody else's reading
    for the same window. And it finds a reading in any state, including one held
    for review, which a plain select cannot: the policy hides those, so the
    lookup missed them and the page paid for a fresh generation on every single
    view. The body still only comes back once published.
  */
  const { data: found } = await supabase.rpc('find_reading', {
    p_birth_profile_id: birthProfileId,
    p_period: period,
    p_period_start: isoDate(start),
  });

  const cached = (found as CachedReading[] | null)?.[0];

  if (cached) {
    return { reading: cached, signals, writerConfigured };
  }

  if (!writerConfigured) {
    return { reading: null, signals, writerConfigured, note: 'writer_unavailable' };
  }

  const settings = await getSettings();
  const editorial = await editorialFor(signals.signals.map((s) => s.code));

  const written = await narrate({ signals, editorial, language: settings.language });

  if (!written.text) {
    return { reading: null, signals, writerConfigured, note: written.detail ?? written.status };
  }

  /*
    A blocked reading is stored, not discarded. Something the filter refused is
    exactly what you want to see, both to judge the filter and to know what the
    writer produced. `save_reading` will hold it as pending regardless.
  */
  const findings =
    written.safety?.findings.map((f) => ({
      id: f.rule.id,
      reason: f.rule.reason,
      severity: f.rule.severity,
      excerpt: f.excerpt,
    })) ?? [];

  const { data: id, error } = await supabase.rpc('save_reading', {
    p_birth_profile_id: birthProfileId,
    p_period: period,
    p_period_start: isoDate(start),
    p_period_end: isoDate(end),
    p_signals: signals,
    p_body: written.text,
    p_model: written.model ?? null,
    // A blocked reading must never be treated as clean, so the block is carried
    // into the findings even if the pattern list somehow came back empty.
    p_safety: written.status === 'blocked' && findings.length === 0
      ? [{ id: 'blocked', reason: 'Blocked by the safety filter.', severity: 'block', excerpt: '' }]
      : findings,
  });

  if (error || !id) {
    return { reading: null, signals, writerConfigured, note: error?.message ?? 'save_failed' };
  }

  const { data: saved } = await supabase.rpc('find_reading', {
    p_birth_profile_id: birthProfileId,
    p_period: period,
    p_period_start: isoDate(start),
  });

  return {
    reading: (saved as CachedReading[] | null)?.[0] ?? null,
    signals,
    writerConfigured,
  };
}
