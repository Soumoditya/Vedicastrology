import type { Metadata } from 'next';
import { DateTime } from 'luxon';

import { castChart } from '@/lib/astro/chart';
import {
  currentRetrogrades,
  currentTransits,
  gocharaVerdict,
  upcomingIngresses,
} from '@/lib/astro/transits';
import { gocharaReading } from '@/lib/predictions/gochara';
import { transitsToRenderData } from '@/lib/chart-render/adapt';
import { chartStyleFor, getSettings } from '@/lib/account/settings';
import { VedicChart } from '@/components/chart/VedicChart';
import { NAKSHATRA_NAMES, RASHI_NAMES_EN } from '@/lib/astro/constants';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { formatDms } from '@/lib/astro/zodiac';
import { BirthForm } from '@/components/forms/BirthForm';
import { gateFor } from '@/components/site/FeatureGate';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';
import { Reveal } from '@/components/motion/Reveal';
import { ToolResult } from '@/components/chart/ToolResult';
import Link from 'next/link';

/**
 * The share card is built from the birth details in the query, so a link to
 * somebody's chart previews as that chart rather than as a generic card. The
 * file convention cannot do this because it never sees the query string.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    query.set(key, Array.isArray(value) ? value[0] : value);
  }

  const base: Metadata = {
    title: 'Transits',
    description:
      'Where the grahas stand today, drawn on your own chart from the ascendant ' +
      'and from the Moon, graded by ashtakavarga and read against both.',
  };

  const card = `/api/og/chart?${query.toString()}`;

  return {
    ...base,
    openGraph: { ...base.openGraph, images: [{ url: card, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [card] },
  };
}

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TransitsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Checked before any work: a page about to refuse should not cast a chart.
  const gate = await gateFor('transits', '/tools/transits');
  if (gate) return gate;

  const params = await searchParams;

  // A signed-in visitor with a saved default chart should never be shown

  // a blank form. `?new=1` is the way to one deliberately.

  await redirectToSavedChart(params, '/tools/transits');


  if (!hasBirthQuery(params)) {
    return (
      <div className="relative">
        <Reveal />
        <div className="starfield" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-5 pt-10 pb-20 sm:pt-12 sm:pb-28">
          <p className="eyebrow" data-reveal>Gochara</p>
          <h1
            className="font-display mt-6 text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            Where the grahas
            <span className="text-gold-leaf block">stand today.</span>
          </h1>
          <p
            className="mt-7 text-[1.0625rem] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
            data-reveal
          >
            Read against your own chart, not in the abstract. Today&rsquo;s
            positions are drawn twice — counted from your ascendant, and counted
            from your Moon, which is the frame the classical transit rules were
            actually written for — and graded by the bindus each sign holds.
          </p>

          <div className="surface-card mt-10 p-6 sm:p-8" data-reveal="scale">
            <SavedChartPicker action="/tools/transits" />
            <BirthForm action="/tools/transits" submitLabel="Show my transits" />
          </div>
        </div>
      </div>
    );
  }

  let parsed;
  try {
    parsed = parseBirthQuery(params);
  } catch {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p style={{ color: 'var(--color-malefic)' }}>
          Those birth details were not valid. Please enter them again.
        </p>
      </div>
    );
  }

  const chart = castChart(parsed.birth, { settings: parsed.settings });
  const now = new Date();

  const positions = currentTransits(chart, now);
  const retrogrades = currentRetrogrades(chart, now);
  const ingresses = upcomingIngresses(chart, now, 5).slice(0, 10);
  const reading = gocharaReading(chart, now);
  const chartStyle = chartStyleFor(await getSettings());

  const moonRashi = chart.byGraha.Moon.rashi;

  /*
    The same nine positions, counted from two different points of the birth
    chart. Neither is a second calculation: `currentTransits` already returns
    both counts for every graha, so this is only a question of which one the
    twelve houses are laid out against.
  */
  const lagnaChart = transitsToRenderData(
    positions,
    'ascendant',
    chart.ascendant.rashi,
    'From the ascendant',
    RASHI_NAMES_EN[chart.ascendant.rashi] + ' lagna',
  );
  const chandraChart = transitsToRenderData(
    positions,
    'moon',
    moonRashi,
    'From the Moon',
    RASHI_NAMES_EN[moonRashi] + ' chandra lagna',
  );

  const zone = chart.meta.timezone;
  const fmt = (d: Date) => DateTime.fromJSDate(d).setZone(zone).toFormat('d LLL yyyy');

  // This page's own params, so a link out keeps the chart in hand.
  const carried = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    carried.set(key, Array.isArray(value) ? value[0] : value);
  }
  const railQuery = carried.toString();

  return (
    <ToolResult
      feature="transits"
      params={params}
      eyebrow="Gochara"
      title={parsed.displayName ? `${parsed.displayName}'s transits` : 'Your transits'}
      meta={
        <>
          {DateTime.now().setZone(zone).toFormat('cccc, d LLLL yyyy')} · read from
          your Moon in {RASHI_NAMES_EN[chart.byGraha.Moon.rashi]}
        </>
      }
      action="/tools/transits"
      submitLabel="Show transits"
    >

        {/*
          The day, drawn.

          Sade Sati used to open this page — a full panel of phase dates for a
          cycle that has its own tool, one click away in the rail above, and that
          is about Saturn rather than about today. What a transit page is for is
          this: where the grahas actually stand, on your own frame, now.

          Two frames, because gochara has two. The ascendant is the one people
          expect, since it is how a birth chart is drawn. The Moon is the one the
          classical table of favourable houses was written for, and reading that
          table from the ascendant instead is the commonest way to get a transit
          reading quietly wrong. Both are shown; the reading underneath says
          which frame each statement came from.
        */}
        <section className="mt-10" data-reveal>
          <h2 className="eyebrow">Today, on your chart</h2>

          <div className="mt-5 grid gap-8 sm:grid-cols-2">
            {[chandraChart, lagnaChart].map((data) => (
              <div key={data.title}>
                <h3
                  className="font-display text-lg"
                  style={{ color: 'var(--color-gold-200)' }}
                >
                  {data.title}
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {data.subtitle}
                </p>
                {/*
                  Animation off, deliberately. Two charts drawing themselves in
                  line by line, side by side, is twice the theatre for the same
                  information, and this page is read rather than unveiled.
                */}
                <div className="mt-3">
                  <VedicChart data={data} style={chartStyle} animate={false} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-14 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            The grahas shown are today&rsquo;s positions, laid on the houses of
            your birth chart. The numeral in each house is the rashi, as
            everywhere else on the site.
          </p>
        </section>

        {/* What it reads as */}
        <section className="mt-12" data-reveal>
          <h2 className="eyebrow">What today reads as</h2>

          <div className="surface-card mt-5 p-6 sm:p-8">
            <ul className="flex flex-wrap gap-2">
              {reading.headline.map((line) => (
                <li
                  key={line}
                  className="rounded-full border px-3.5 py-1.5 text-xs"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-4">
              {reading.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <p
              className="mt-6 border-l pl-4 text-xs leading-relaxed"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
            >
              {reading.note}
            </p>
          </div>

          {/* Saturn over the Moon is its own subject, and has its own tool. */}
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            Looking for Sade Sati?{' '}
            <Link
              href={`/tools/sade-sati?${railQuery}`}
              style={{ color: 'var(--color-gold-300)' }}
            >
              Saturn&rsquo;s seven and a half years over your Moon
            </Link>{' '}
            is dated to the day on its own page.
          </p>
        </section>

        {/* Where everything is */}
        <section className="mt-12" data-reveal>
          <h2 className="eyebrow">Today</h2>
          <div className="surface-card mt-4 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr
                  className="border-b text-left text-xs uppercase tracking-[0.1em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <th className="px-4 py-2.5 font-medium">Graha</th>
                  <th className="px-4 py-2.5 font-medium">Position</th>
                  <th className="px-4 py-2.5 font-medium">From Moon</th>
                  <th className="px-4 py-2.5 font-medium">From ascendant</th>
                  <th className="px-4 py-2.5 font-medium">Gochara</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const verdict = gocharaVerdict(p.graha, p.houseFromMoon);
                  return (
                    <tr key={p.graha} className="border-b last:border-0">
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                        {p.graha}
                        {p.retrograde && p.graha !== 'Rahu' && p.graha !== 'Ketu' && (
                          <span className="ml-1.5 text-xs" style={{ color: 'var(--color-saffron-400)' }}>
                            ℞
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {RASHI_NAMES_EN[p.rashi]} {formatDms(p.degreeInRashi, false)}
                        <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {NAKSHATRA_NAMES[p.nakshatra]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                        {p.houseFromMoon}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                        {p.houseFromAscendant}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          style={{
                            color:
                              verdict === 'favourable'
                                ? 'var(--color-benefic)'
                                : verdict === 'difficult'
                                  ? 'var(--color-malefic)'
                                  : 'var(--text-muted)',
                          }}
                        >
                          {verdict}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {retrogrades.length > 0 && (
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              Retrograde today: {retrogrades.join(', ')}. Rahu and Ketu are left
              out, since the mean node is always retrograde and saying so daily
              is noise.
            </p>
          )}
        </section>

        {/* What is coming */}
        {ingresses.length > 0 && (
          <section className="mt-12" data-reveal>
            <h2 className="eyebrow">Coming up</h2>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Only the slow grahas. The Moon changes sign every two and a half
              days, which would bury the changes that actually mark a chapter.
            </p>
            <ul className="mt-4 space-y-1">
              {ingresses.map((event) => (
                <li
                  key={`${event.graha}-${event.date.toISOString()}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-t py-3 text-sm"
                >
                  <span style={{ color: 'var(--text-primary)' }}>{event.description}</span>
                  <span className="tabular-nums text-xs" style={{ color: 'var(--color-gold-400)' }}>
                    {fmt(event.date)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}


    </ToolResult>
  );
}
