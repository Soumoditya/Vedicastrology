import type { Metadata } from 'next';
import { DateTime } from 'luxon';

import { castChart } from '@/lib/astro/chart';
import {
  currentRetrogrades,
  currentTransits,
  gocharaVerdict,
  sadeSati,
  upcomingIngresses,
} from '@/lib/astro/transits';
import { NAKSHATRA_NAMES, RASHI_NAMES_EN } from '@/lib/astro/constants';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { formatDms } from '@/lib/astro/zodiac';
import { BirthForm } from '@/components/forms/BirthForm';
import { gateFor } from '@/components/site/FeatureGate';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';
import { Reveal } from '@/components/motion/Reveal';
import { ToolResult } from '@/components/chart/ToolResult';

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
    title: 'Transits and Sade Sati',
    description:
      'Where the grahas stand now relative to your chart, with Sade Sati phase ' +
      'dates solved against the ephemeris rather than estimated.',
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
        <div className="relative mx-auto max-w-2xl px-5 py-20 sm:py-28">
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
            Read against your own chart, not in the abstract. Includes Sade Sati
            with its real phase dates, solved against the ephemeris, so a leg
            Saturn retrogrades back out of is reported at its true boundaries.
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
  const sade = sadeSati(chart, now);
  const retrogrades = currentRetrogrades(chart, now);
  const ingresses = upcomingIngresses(chart, now, 5).slice(0, 10);

  const zone = chart.meta.timezone;
  const fmt = (d: Date) => DateTime.fromJSDate(d).setZone(zone).toFormat('d LLL yyyy');

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

        {/* Sade Sati, first because it is what people came for */}
        <section className="mt-10" data-reveal>
          <h2 className="eyebrow">Sade Sati</h2>

          <div
            className="surface-card mt-4 p-6"
            style={
              sade.active
                ? { borderColor: 'color-mix(in oklab, var(--color-saffron-400) 40%, transparent)' }
                : undefined
            }
          >
            {sade.active && sade.currentPhase ? (
              <>
                <p
                  className="font-display text-2xl"
                  style={{ color: 'var(--color-saffron-300)' }}
                >
                  Running now, {sade.currentPhase.phase} phase
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Saturn is in {RASHI_NAMES_EN[sade.currentPhase.rashi]}, from{' '}
                  {fmt(sade.currentPhase.start)} to {fmt(sade.currentPhase.end)}.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl" style={{ color: 'var(--color-benefic)' }}>
                  Not running
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Saturn is not currently transiting the signs around your Moon.
                </p>
              </>
            )}

            {sade.dhaiya.active && (
              <p className="mt-3 text-sm" style={{ color: 'var(--color-gold-300)' }}>
                Saturn is also in {sade.dhaiya.type === 'kantaka' ? 'the 4th' : 'the 8th'} from
                your Moon, the smaller {sade.dhaiya.type} panoti.
              </p>
            )}

            {sade.phases.length > 0 && (
              <ol className="mt-6 space-y-2">
                {sade.phases.map((phase) => {
                  const past = phase.end.getTime() < now.getTime();
                  const current = sade.currentPhase === phase;
                  return (
                    <li
                      key={`${phase.phase}-${phase.start.toISOString()}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-t py-2.5 text-sm"
                      style={{ opacity: past ? 0.45 : 1 }}
                    >
                      <span style={{ color: current ? 'var(--color-saffron-300)' : 'var(--text-secondary)' }}>
                        {phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)} ·{' '}
                        {RASHI_NAMES_EN[phase.rashi]}
                      </span>
                      <span className="tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
                        {fmt(phase.start)} to {fmt(phase.end)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
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
