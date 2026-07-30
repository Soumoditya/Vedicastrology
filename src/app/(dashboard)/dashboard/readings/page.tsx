import Link from 'next/link';

import { createClient, getUser } from '@/lib/supabase/server';
import { canUseAll } from '@/lib/features/flags';
import { narrationConfigured } from '@/lib/predictions/narrate';
import type { BirthProfile } from '@/lib/supabase/types';

export const metadata = { title: 'Readings', robots: { index: false } };
export const dynamic = 'force-dynamic';

const PERIODS = [
  {
    slug: 'day',
    feature: 'daily_reading',
    label: 'Today',
    sanskrit: 'Dina',
    blurb: 'The day ahead, short. What is running and what it touches.',
  },
  {
    slug: 'week',
    feature: 'weekly_reading',
    label: 'This week',
    sanskrit: 'Saptāha',
    blurb: 'The week, by dasha and by the transits that matter over seven days.',
  },
  {
    slug: 'month',
    feature: 'monthly_reading',
    label: 'This month',
    sanskrit: 'Māsa',
    blurb: 'Longer, and reviewed before you see it.',
  },
  {
    slug: 'year',
    feature: 'yearly_reading',
    label: 'This year',
    sanskrit: 'Varṣa',
    blurb: 'The arc of the year, period by period. Reviewed before you see it.',
  },
] as const;

export default async function ReadingsIndex() {
  const user = await getUser();
  const supabase = await createClient();

  const [access, { data: chartRows }] = await Promise.all([
    canUseAll(PERIODS.map((p) => p.feature)),
    supabase
      .from('birth_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at')
      .limit(1),
  ]);

  const chart = ((chartRows as BirthProfile[] | null) ?? [])[0] ?? null;

  return (
    <div>
      <h1 className="font-display text-3xl" style={{ color: 'var(--text-primary)' }}>
        Readings
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Each of these is built from your chart by the same engine the free tools
        use. The findings it worked from are shown alongside the writing, with
        the classical rule for each one, so you can check any claim rather than
        take it on trust.
      </p>

      {!chart && (
        <div className="surface-card mt-8 p-6">
          <p className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
            Save a chart first
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A reading needs a chart to read. Cast yours and choose save, then
            these will work.
          </p>
          <Link
            href="/tools/kundli"
            className="mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-medium"
            style={{
              background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
              color: '#150e00',
            }}
          >
            Cast a chart
          </Link>
        </div>
      )}

      {chart && (
        <>
          <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            Cast for {chart.label}, {chart.place_name}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {PERIODS.map((period) => {
              const allowed = access[period.feature].allowed;

              return (
                <Link
                  key={period.slug}
                  href={`/dashboard/readings/${period.slug}`}
                  className="surface-card group p-5 transition-all duration-500"
                  style={{
                    transitionTimingFunction: 'var(--ease-out-soft)',
                    opacity: allowed ? 1 : 0.72,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className="font-quote text-sm italic"
                      style={{ color: 'var(--color-gold-600)' }}
                    >
                      {period.sanskrit}
                    </p>
                    {!allowed && (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em]"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--color-gold-500)',
                        }}
                      >
                        Members
                      </span>
                    )}
                  </div>
                  <h2 className="font-display mt-1 text-xl" style={{ color: 'var(--text-primary)' }}>
                    {period.label}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {period.blurb}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/*
        Stated plainly rather than left as a mysteriously missing feature. If the
        writer is not configured the findings still render, and those are the
        substance.
      */}
      {!narrationConfigured() && (
        <p
          className="mt-8 max-w-2xl rounded-lg border-l-2 py-3 pl-4 pr-3 text-sm leading-relaxed"
          style={{
            borderColor: 'var(--color-gold-600)',
            background: 'color-mix(in oklab, var(--color-gold-500) 5%, transparent)',
            color: 'var(--text-secondary)',
          }}
        >
          The written summaries are switched off in this deployment. The findings
          themselves, which are what the writing is based on, still appear in
          full.
        </p>
      )}
    </div>
  );
}
