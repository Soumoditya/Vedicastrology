import type { Metadata } from 'next';

import { castChart } from '@/lib/astro/chart';
import { matchCharts } from '@/lib/astro/matching';
import { NAKSHATRA_NAMES, RASHI_NAMES_EN } from '@/lib/astro/constants';
import { birthQuerySchema, toBirthQueryString } from '@/lib/astro/query';
import { MatchForm } from '@/components/forms/MatchForm';
import { gateFor } from '@/components/site/FeatureGate';
import { ToolSwitcher } from '@/components/chart/ToolSwitcher';
import { PrintButton } from '@/components/chart/PrintButton';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Kundli Matching',
  description:
    'Ashtakoot Guna Milan across all eight koots, with Mangal dosha and its ' +
    'classical cancellations. Free and accurate.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Pull one person's details out of the query, given a prefix. */
function parsePerson(
  params: Record<string, string | string[] | undefined>,
  prefix: 'a' | 'b',
) {
  const get = (key: string) => {
    const value = params[`${prefix}${key}`];
    return Array.isArray(value) ? value[0] : value;
  };

  const parsed = birthQuerySchema.safeParse({
    d: get('d'),
    t: get('t') ?? '12:00',
    lat: get('lat'),
    lon: get('lon'),
    tz: get('tz'),
    place: get('place') ?? 'Unknown place',
    name: get('name'),
  });

  if (!parsed.success) return null;

  const q = parsed.data;
  const [year, month, day] = q.d.split('-').map(Number);
  const [hour, minute] = q.t.split(':').map(Number);

  return {
    name: q.name,
    birth: {
      year, month, day, hour, minute,
      place: {
        name: q.place,
        latitude: q.lat,
        longitude: q.lon,
        timezone: q.tz,
      },
    },
  };
}

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Checked before any work: a page about to refuse should not cast a chart.
  const gate = await gateFor('matching', '/tools/matching');
  if (gate) return gate;

  const params = await searchParams;

  const bride = parsePerson(params, 'a');
  const groom = parsePerson(params, 'b');

  /*
    Arriving from another tool carries an unprefixed single chart query. That is
    almost always the visitor's own chart, and they are here to compare it with
    somebody, so it fills the first column and leaves only the second to enter.
  */
  const carried = parsePerson({ ...params, ad: params.d, at: params.t, alat: params.lat,
    alon: params.lon, atz: params.tz, aplace: params.place, aname: params.name }, 'a');

  const prefillA =
    !bride && carried
      ? {
          name: carried.name ?? undefined,
          date: `${carried.birth.year}-${String(carried.birth.month).padStart(2, '0')}-${String(carried.birth.day).padStart(2, '0')}`,
          time: `${String(carried.birth.hour).padStart(2, '0')}:${String(carried.birth.minute).padStart(2, '0')}`,
          /*
            Reconstructed from the query rather than geocoded again. The label
            is the only part shown, and the rest of PlaceResult exists for the
            autocomplete's own bookkeeping, so it is filled in consistently
            instead of sending a request for something already known.
          */
          place: {
            id: 'carried',
            name: carried.birth.place.name.split(',')[0].trim(),
            label: carried.birth.place.name,
            latitude: carried.birth.place.latitude,
            longitude: carried.birth.place.longitude,
            timezone: carried.birth.place.timezone ?? 'UTC',
            country: carried.birth.place.name.split(',').pop()!.trim(),
            countryCode: '',
          },
        }
      : undefined;

  if (!bride || !groom) {
    return (
      <div className="relative">
        <Reveal />
        <div className="starfield" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-5 py-20 sm:py-28">
          <header className="max-w-xl">
            <p className="eyebrow" data-reveal>Guṇa Milan</p>
            <h1
              className="font-display mt-6 text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02]"
              style={{ color: 'var(--text-primary)' }}
              data-reveal
            >
              Kundli matching,
              <span className="text-gold-leaf block">honestly scored.</span>
            </h1>
            <p
              className="mt-7 text-[1.0625rem] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
              data-reveal
            >
              All eight koots, the full thirty six points, with Mangal dosha
              checked from the ascendant, the Moon and Venus rather than the
              ascendant alone. Cancellations are applied where the classical
              rules say they apply.
            </p>
          </header>

          <div className="surface-card mt-12 p-6 sm:p-8" data-reveal="scale">
            <MatchForm prefillA={prefillA} />
          </div>

          <p className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Birth times are not needed for the score. Guna Milan rests entirely
            on each Moon's nakshatra and rashi, so a date and place is enough.
            A known time only sharpens the Mangal dosha check.
          </p>
        </div>
      </div>
    );
  }

  const brideChart = castChart(bride.birth);
  const groomChart = castChart(groom.birth);
  const result = matchCharts(brideChart, groomChart);

  const percent = Math.round((result.total / 36) * 100);

  const verdictColour =
    result.verdict === 'excellent' || result.verdict === 'good'
      ? 'var(--color-benefic)'
      : result.verdict === 'acceptable'
        ? 'var(--color-gold-300)'
        : 'var(--color-malefic)';

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-5 py-16 sm:py-20">
        {/* Two charts, so "the same chart" needs saying whose. Each person's
            own query is built rather than passing this page's prefixed params,
            which mean nothing to a single chart tool. */}
        <ToolSwitcher
          current="matching"
          heading={`${bride.name ?? 'First person'}, elsewhere`}
          query={toBirthQueryString({
            date: `${bride.birth.year}-${String(bride.birth.month).padStart(2, '0')}-${String(bride.birth.day).padStart(2, '0')}`,
            time: `${String(bride.birth.hour).padStart(2, '0')}:${String(bride.birth.minute).padStart(2, '0')}`,
            latitude: bride.birth.place.latitude,
            longitude: bride.birth.place.longitude,
            timezone: bride.birth.place.timezone,
            place: bride.birth.place.name,
            name: bride.name ?? undefined,
          })}
        />
        <ToolSwitcher
          current="matching"
          heading={`${groom.name ?? 'Second person'}, elsewhere`}
          query={toBirthQueryString({
            date: `${groom.birth.year}-${String(groom.birth.month).padStart(2, '0')}-${String(groom.birth.day).padStart(2, '0')}`,
            time: `${String(groom.birth.hour).padStart(2, '0')}:${String(groom.birth.minute).padStart(2, '0')}`,
            latitude: groom.birth.place.latitude,
            longitude: groom.birth.place.longitude,
            timezone: groom.birth.place.timezone,
            place: groom.birth.place.name,
            name: groom.name ?? undefined,
          })}
        />
        <div className="mb-8 flex justify-end"><PrintButton /></div>
        <p className="eyebrow" data-reveal>Guṇa Milan</p>
        <h1
          className="font-display mt-4 text-3xl sm:text-4xl"
          style={{ color: 'var(--text-primary)' }}
          data-reveal
        >
          {bride.name ?? 'First person'} and {groom.name ?? 'Second person'}
        </h1>

        {/* The score */}
        <div className="surface-card mt-10 p-8 text-center" data-reveal="scale">
          <p
            className="font-display text-[clamp(3.5rem,12vw,6rem)] leading-none"
            style={{ color: verdictColour }}
          >
            {result.total}
            <span className="text-2xl" style={{ color: 'var(--text-muted)' }}>
              {' '}/ 36
            </span>
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {result.summary}
          </p>

          <div
            className="mx-auto mt-6 h-1 max-w-sm overflow-hidden rounded-full"
            style={{ background: 'var(--border-subtle)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${percent}%`, background: verdictColour }}
            />
          </div>
        </div>

        {/* Both Moons */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <MoonCard label={bride.name ?? 'First person'} data={result.bride} />
          <MoonCard label={groom.name ?? 'Second person'} data={result.groom} />
        </div>

        {/* Koot by koot */}
        <section className="mt-12">
          <h2 className="eyebrow" data-reveal>The eight koots</h2>
          <ul className="mt-5 space-y-2">
            {result.koots.map((koot, i) => (
              <li
                key={koot.name}
                className="surface-card p-5"
                data-reveal
                style={{ '--reveal-delay': `${i * 40}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <span
                      className="font-display text-lg"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {koot.name}
                    </span>
                    <span
                      className="font-quote ml-2 text-sm italic"
                      style={{ color: 'var(--color-gold-500)' }}
                    >
                      {koot.sanskrit}
                    </span>
                  </div>
                  <span
                    className="font-display text-lg tabular-nums"
                    style={{
                      color:
                        koot.score === koot.maximum
                          ? 'var(--color-benefic)'
                          : koot.score === 0
                            ? 'var(--color-malefic)'
                            : 'var(--color-gold-300)',
                    }}
                  >
                    {koot.score} / {koot.maximum}
                  </span>
                </div>

                <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {koot.measures}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {koot.reason}
                </p>

                <div
                  className="mt-3 h-0.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--border-subtle)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(koot.score / koot.maximum) * 100}%`,
                      background:
                        'linear-gradient(90deg, var(--color-gold-600), var(--color-gold-300))',
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Mangal dosha */}
        <section className="mt-12">
          <h2 className="eyebrow" data-reveal>Mangal dosha</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MangalCard label={bride.name ?? 'First person'} dosha={result.mangal.bride} />
            <MangalCard label={groom.name ?? 'Second person'} dosha={result.mangal.groom} />
          </div>
          {!result.mangal.balanced && (
            <p
              className="mt-4 rounded-lg border px-4 py-3 text-sm leading-relaxed"
              style={{
                borderColor: 'color-mix(in oklab, var(--color-saffron-400) 34%, transparent)',
                background: 'color-mix(in oklab, var(--color-saffron-400) 7%, transparent)',
                color: 'var(--text-secondary)',
              }}
            >
              The dosha appears in one chart and not the other, which the
              classical rules treat as unbalanced. Worth discussing rather than
              treating as a verdict.
            </p>
          )}
        </section>

        {/* Honesty about what the number is worth */}
        <section className="surface-card mt-12 p-6" data-reveal>
          <h2 className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
            What this score is, and is not
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Guna Milan compares two Moons. That is all it does. It says nothing
            about the seventh house in either chart, the state of Venus and
            Jupiter, the dashas each person is running, or anything the two of
            you actually know about each other.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A high score is not a guarantee and a low one is not a verdict. It
            is one input among many, and it has been treated as the whole
            answer far too often.
          </p>
        </section>

        <section className="no-print mt-12">
          <h2 className="eyebrow">Match another pair</h2>
          <div className="surface-card mt-5 p-6">
            <MatchForm />
          </div>
        </section>
      </div>
    </div>
  );
}

function MoonCard({
  label,
  data,
}: {
  label: string;
  data: { nakshatra: number; rashi: number; pada: number };
}) {
  return (
    <div className="surface-card p-5">
      <p className="text-[0.65rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-gold-600)' }}>
        {label}
      </p>
      <p className="font-display mt-1.5 text-xl" style={{ color: 'var(--text-primary)' }}>
        {NAKSHATRA_NAMES[data.nakshatra]}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
        Pada {data.pada} · Moon in {RASHI_NAMES_EN[data.rashi]}
      </p>
    </div>
  );
}

function MangalCard({
  label,
  dosha,
}: {
  label: string;
  dosha: {
    present: boolean;
    fromAscendant: boolean;
    fromMoon: boolean;
    fromVenus: boolean;
    cancelled: boolean;
    cancellationReasons: string[];
  };
}) {
  const from = [
    dosha.fromAscendant && 'ascendant',
    dosha.fromMoon && 'Moon',
    dosha.fromVenus && 'Venus',
  ].filter(Boolean) as string[];

  return (
    <div className="surface-card p-5">
      <p className="text-[0.65rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-gold-600)' }}>
        {label}
      </p>
      <p
        className="font-display mt-1.5 text-lg"
        style={{
          color: !dosha.present
            ? 'var(--color-benefic)'
            : dosha.cancelled
              ? 'var(--color-gold-300)'
              : 'var(--color-malefic)',
        }}
      >
        {!dosha.present ? 'Not present' : dosha.cancelled ? 'Present but cancelled' : 'Present'}
      </p>
      {dosha.present && (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Mars falls in a dosha house from the {from.join(', the ')}.
          {dosha.cancelled && ` Cancelled because ${dosha.cancellationReasons.join(', and ')}.`}
        </p>
      )}
    </div>
  );
}
