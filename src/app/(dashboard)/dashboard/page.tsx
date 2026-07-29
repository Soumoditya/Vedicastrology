import Link from 'next/link';
import { DateTime } from 'luxon';

import { createClient, getProfile } from '@/lib/supabase/server';
import { castChart } from '@/lib/astro/chart';
import { buildVimshottari, dashaAt, formatDashaChain } from '@/lib/astro/dasha';
import { NAKSHATRA_NAMES, RASHI_NAMES_EN } from '@/lib/astro/constants';
import { toBirthQueryString } from '@/lib/astro/query';
import { deleteBirthProfile, setResearchConsent } from '@/lib/account/actions';
import { ResearchProfileForm } from '@/components/account/ResearchProfileForm';
import type { BirthProfile, Profile } from '@/lib/supabase/types';

export const metadata = { title: 'Your charts', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = (await getProfile()) as Profile & {
    research_consent: boolean;
    health_research_consent: boolean;
    research_subject_key: string | null;
  };

  const supabase = await createClient();
  const { data } = await supabase
    .from('birth_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const charts = (data as BirthProfile[] | null) ?? [];

  // The person's own contributed row, so the life event form comes back filled
  // in rather than blank every visit. Readable here only because the query is
  // keyed by their own subject key.
  let lifeEvents = null;
  if (profile.research_consent && profile.research_subject_key) {
    const { data: row } = await supabase
      .from('research_charts')
      .select(
        'gender, marital_status, marriage_year, children_count, first_child_year, ' +
          'education_level, occupation_category, career_change_years, ' +
          'relocation_years, major_health_years',
      )
      .eq('subject_key', profile.research_subject_key)
      .maybeSingle();
    lifeEvents = row as never;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl" style={{ color: 'var(--text-primary)' }}>
            {profile.display_name ? `Welcome back, ${profile.display_name}` : 'Your charts'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Everything you save is here whenever you come back.
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="rounded-full border px-4 py-2 text-xs"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          Settings
        </Link>
      </div>

      {charts.length === 0 ? (
        <div className="surface-card mt-8 p-6">
          <p className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
            Nothing saved yet
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Cast a chart and choose “Save to my account”. You can keep as many as
            you like, for yourself, your family, or anyone whose chart you study.
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
      ) : (
        <ul className="mt-8 space-y-3">
          {charts.map((saved) => (
            <SavedChart key={saved.id} saved={saved} />
          ))}
        </ul>
      )}

      {/* Research consent. Stated plainly, opt-in, and reversible. */}
      <section className="surface-card mt-12 p-6">
        <h2 className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
          Help with research
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Classical Jyotisha rests on rules written down centuries ago, and very
          few of them have ever been checked against a large body of real
          charts. If you are willing, your chart can be added to a research set
          used for exactly that.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          What is contributed: your birth date, time and coordinates, the country
          only, and the resulting chart. What is never contributed: your name,
          your email, your exact birthplace, or anything linking the chart back
          to you. You can withdraw at any time and the contribution is deleted
          immediately.
        </p>

        <form action={setResearchConsent} className="mt-5 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="consent"
              defaultChecked={profile.research_consent}
              className="h-4 w-4 accent-[var(--color-gold-500)]"
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              Include my charts in the research set
            </span>
          </label>
          <button
            type="submit"
            className="rounded-full border px-4 py-2 text-xs"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
          >
            Save preference
          </button>
        </form>

        {profile.research_consent && (
          <>
            <div className="rule-gold my-8" />
            <h3 className="font-display text-base" style={{ color: 'var(--color-gold-200)' }}>
              A little more, if you are willing
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Chart positions alone can only show what is common. To test whether
              a classical rule actually holds, the research needs something to
              test it against. Every field below is optional, and you can change
              or clear any of them at any time.
            </p>
            <ResearchProfileForm
              values={lifeEvents}
              healthConsent={profile.health_research_consent}
            />
          </>
        )}
      </section>
    </div>
  );
}

/**
 * One saved chart, with the dasha running right now.
 *
 * Recomputed on every view rather than stored, so an engine improvement
 * reaches every saved chart without a migration.
 */
function SavedChart({ saved }: { saved: BirthProfile }) {
  const [year, month, day] = saved.birth_date.split('-').map(Number);
  const [hour, minute] = (saved.birth_time ?? '12:00').split(':').map(Number);

  let summary: string | null = null;
  let dasha: string | null = null;
  let query = '';

  try {
    const chart = castChart({
      year, month, day, hour, minute,
      timeUnknown: saved.time_unknown,
      place: {
        name: saved.place_name,
        latitude: saved.latitude,
        longitude: saved.longitude,
        timezone: saved.timezone,
      },
    });

    const moon = chart.byGraha.Moon;
    summary = `${RASHI_NAMES_EN[chart.ascendant.rashi]} ascendant · Moon in ${RASHI_NAMES_EN[moon.rashi]} · ${NAKSHATRA_NAMES[moon.nakshatra]}`;

    const active = dashaAt(buildVimshottari(chart, { maxLevel: 2 }), new Date());
    if (active) dasha = formatDashaChain(active);

    query = toBirthQueryString({
      date: saved.birth_date,
      time: saved.birth_time ?? '12:00',
      latitude: saved.latitude,
      longitude: saved.longitude,
      timezone: saved.timezone,
      place: saved.place_name,
      name: saved.person_name ?? saved.label,
      timeUnknown: saved.time_unknown,
    });
  } catch {
    // A chart that cannot be cast still has to be listed, so the person can
    // see it and delete or correct it rather than losing it silently.
    summary = 'This chart could not be calculated. Check the birth details.';
  }

  return (
    <li className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-xl" style={{ color: 'var(--text-primary)' }}>
            {saved.label}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {DateTime.fromISO(saved.birth_date).toFormat('d LLLL yyyy')}
            {!saved.time_unknown && saved.birth_time && ` · ${saved.birth_time.slice(0, 5)}`}
            {' · '}
            {saved.place_name}
          </p>
          {summary && (
            <p className="mt-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {summary}
            </p>
          )}
          {dasha && (
            <p className="mt-1 text-sm" style={{ color: 'var(--color-gold-300)' }}>
              Running now: {dasha}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {query && (
            <Link
              href={`/tools/kundli?${query}`}
              className="rounded-full border px-4 py-2 text-xs"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--color-gold-200)' }}
            >
              Open chart
            </Link>
          )}
          <form action={deleteBirthProfile}>
            <input type="hidden" name="id" value={saved.id} />
            <button
              type="submit"
              className="text-xs underline underline-offset-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Remove
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
