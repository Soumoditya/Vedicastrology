import type { Metadata } from 'next';
import { DateTime } from 'luxon';

import { castChart } from '@/lib/astro/chart';
import { sadeSati, currentTransits } from '@/lib/astro/transits';
import { RASHI_NAMES_EN } from '@/lib/astro/constants';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { gateFor } from '@/components/site/FeatureGate';
import { ToolIntro } from '@/components/chart/ToolIntro';
import type { SadeSatiPhase } from '@/lib/astro/types';
import { ToolResult } from '@/components/chart/ToolResult';

export const metadata: Metadata = {
  title: 'Sade Sati and Kantaka Shani',
  description:
    "Saturn's seven and a half years over the Moon, with the real start and " +
    'end date of each phase solved from the ephemeris, plus the two and a ' +
    'half year Kantaka and Ashtama transits.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PHASE_LABEL: Record<SadeSatiPhase['phase'], string> = {
  rising: 'Rising',
  peak: 'Peak',
  setting: 'Setting',
};

const PHASE_MEANING: Record<SadeSatiPhase['phase'], string> = {
  rising:
    'Saturn crosses the sign before the Moon. This phase is felt as pressure ' +
    'arriving rather than pressure landing: obligations accumulate, sleep and ' +
    'money get tighter, and the first things to give way are whatever was ' +
    'already held together loosely.',
  peak:
    'Saturn crosses the Moon itself. The middle phase is the one people mean ' +
    'when they say Sade Sati. It asks for endurance rather than cleverness, ' +
    'and what it takes away is usually what was being carried out of habit.',
  setting:
    'Saturn crosses the sign after the Moon. The weight lifts unevenly. What ' +
    'survived the middle phase tends to become the settled shape of the next ' +
    'twenty years, which is the part nobody mentions.',
};

export default async function SadeSatiPage({ searchParams }: { searchParams: SearchParams }) {
  const gate = await gateFor('sade_sati', '/tools/sade-sati');
  if (gate) return gate;

  const params = await searchParams;

  // A signed-in visitor with a saved default chart should never be shown

  // a blank form. `?new=1` is the way to one deliberately.

  await redirectToSavedChart(params, '/tools/sade-sati');


  if (!hasBirthQuery(params)) {
    return (
      <ToolIntro
        eyebrow="Sāḍe Sātī"
        headline="Saturn over"
        highlight="your Moon."
        action="/tools/sade-sati"
        submitLabel="Find my dates"
      >
        <p>
          Seven and a half years in which Saturn crosses the sign before your
          Moon, your Moon itself, and the sign after. It comes round roughly
          every thirty years, so most people meet it two or three times.
        </p>
        <p>
          The dates here are solved against the ephemeris rather than estimated
          from average speed. Saturn is slow and its speed varies, so an
          estimate can be weeks out, and a start date that is weeks out is worse
          than no date at all.
        </p>
      </ToolIntro>
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
  const result = sadeSati(chart, now, 90);
  const transits = currentTransits(chart, now);
  const saturn = transits.find((t) => t.graha === 'Saturn');
  const moonRashi = chart.byGraha.Moon.rashi;

  // Grouped into cycles, because three consecutive phases are one visit and
  // showing nine loose rows hides which visit is which.
  const cycles = groupIntoCycles(result.phases);

  return (
    <ToolResult
      feature="sade_sati"
      params={params}
      footer
      cover={{ title: 'Sāḍe Sātī', subtitle: parsed.displayName ?? undefined }}
      eyebrow="Sāḍe Sātī"
      title={parsed.displayName ? `${parsed.displayName}, and Saturn` : 'You, and Saturn'}
      action="/tools/sade-sati"
      submitLabel="Find these dates"
    >

        {/* Now ---------------------------------------------------------- */}
        <section className="surface-card mt-8 p-6 sm:p-8" data-reveal>
          <p
            className="font-display text-4xl"
            style={{ color: result.active ? 'var(--color-gold-300)' : 'var(--color-benefic)' }}
          >
            {result.active
              ? `In Sade Sati, ${PHASE_LABEL[result.currentPhase!.phase].toLowerCase()} phase`
              : 'Not in Sade Sati'}
          </p>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your Moon is in {RASHI_NAMES_EN[moonRashi]}.
            {saturn && ` Saturn is currently in ${RASHI_NAMES_EN[saturn.rashi]}, the ${ordinal(saturn.houseFromMoon)} sign from it.`}
          </p>

          {result.active && result.currentPhase && (
            <>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                This phase runs from {fmt(result.currentPhase.start)} to{' '}
                {fmt(result.currentPhase.end)}.
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {PHASE_MEANING[result.currentPhase.phase]}
              </p>
            </>
          )}

          {!result.active && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Saturn is not in the three signs that make up the cycle. The table
              below shows when it last was and when it will be again.
            </p>
          )}
        </section>

        {/* Dhaiya ------------------------------------------------------- */}
        <section className="mt-10" data-reveal>
          <h2 className="eyebrow">Kaṇṭaka and Aṣṭama Śani</h2>
          <div className="surface-card mt-5 p-6">
            <p
              className="font-display text-2xl"
              style={{
                color: result.dhaiya.active ? 'var(--color-gold-300)' : 'var(--color-benefic)',
              }}
            >
              {result.dhaiya.active
                ? result.dhaiya.type === 'kantaka'
                  ? 'Kantaka Shani, running now'
                  : 'Ashtama Shani, running now'
                : 'Neither running'}
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Sometimes called the small panoti, two and a half years rather than
              seven and a half. Kantaka is Saturn transiting the fourth sign from
              the Moon and tends to show as pressure on home, comfort and the
              mother. Ashtama is the eighth and tends to show as things going
              slowly wrong in the background before anybody names the problem.
            </p>
            {!result.dhaiya.active && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Saturn is in neither the fourth nor the eighth sign from your
                Moon at the moment.
              </p>
            )}
          </div>
        </section>

        {/* Every cycle -------------------------------------------------- */}
        <section className="mt-12" data-reveal>
          <h2 className="eyebrow">Every cycle</h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Each visit, with its three phases. Dates are solved to the day from
            the ephemeris.
          </p>

          <div className="mt-6 space-y-6">
            {cycles.map((cycle, i) => {
              const first = cycle[0];
              const last = cycle[cycle.length - 1];
              const isNow = cycle.some((p) => p.start <= now && now <= p.end);
              const isPast = last.end < now;

              return (
                <div
                  key={i}
                  className="surface-card p-5 sm:p-6"
                  style={{
                    borderColor: isNow ? 'var(--color-gold-500)' : undefined,
                    opacity: isPast ? 0.72 : 1,
                  }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p
                      className="font-display text-lg"
                      style={{ color: isNow ? 'var(--color-gold-200)' : 'var(--text-primary)' }}
                    >
                      {fmt(first.start)} to {fmt(last.end)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                      {isNow ? 'Running now' : isPast ? 'Passed' : 'To come'}
                      {' · '}
                      {years(first.start, last.end)}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    {cycle.map((phase) => {
                      const phaseNow = phase.start <= now && now <= phase.end;
                      return (
                        <div
                          key={`${phase.phase}-${phase.start.toISOString()}`}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t pt-2 text-sm"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <span
                            className="w-16 shrink-0 text-xs uppercase tracking-[0.12em]"
                            style={{
                              color: phaseNow ? 'var(--color-gold-300)' : 'var(--text-muted)',
                            }}
                          >
                            {PHASE_LABEL[phase.phase]}
                          </span>
                          <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                            {fmt(phase.start)} to {fmt(phase.end)}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Saturn in {RASHI_NAMES_EN[phase.rashi]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {cycles.length === 0 && (
            <p className="mt-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No cycle falls inside the ninety year window examined.
            </p>
          )}
        </section>

        {/* Honesty ------------------------------------------------------ */}
        <section className="mt-12" data-reveal>
          <div
            className="rounded-lg border-l-2 py-4 pl-5 pr-4"
            style={{
              borderColor: 'var(--color-gold-600)',
              background: 'color-mix(in oklab, var(--color-gold-500) 5%, transparent)',
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Sade Sati is not a sentence. Roughly one person in four is in it at
              any moment, which is far too many for it to explain a single
              person&rsquo;s difficulty on its own. It describes a period of weight and
              consolidation, and it is read alongside the running dasha and the
              rest of the chart, never instead of them.
            </p>
          </div>
        </section>
    </ToolResult>
  );
}

/**
 * Group consecutive phases into visits.
 *
 * A phase belongs to the previous cycle when it starts within about two years
 * of the last one ending. Saturn takes roughly thirty years to come back, so
 * the gap between cycles is enormous compared with the gap inside one, and no
 * finer rule is needed.
 */
function groupIntoCycles(phases: SadeSatiPhase[]): SadeSatiPhase[][] {
  const sorted = [...phases].sort((a, b) => a.start.getTime() - b.start.getTime());
  const cycles: SadeSatiPhase[][] = [];
  const TWO_YEARS = 2 * 365.25 * 86_400_000;

  for (const phase of sorted) {
    const current = cycles[cycles.length - 1];
    const previous = current?.[current.length - 1];

    if (previous && phase.start.getTime() - previous.end.getTime() < TWO_YEARS) {
      current.push(phase);
    } else {
      cycles.push([phase]);
    }
  }

  return cycles;
}

function fmt(date: Date): string {
  return DateTime.fromJSDate(date).toFormat('d LLL yyyy');
}

function years(from: Date, to: Date): string {
  const value = (to.getTime() - from.getTime()) / (365.25 * 86_400_000);
  return `${value.toFixed(1)} years`;
}

function ordinal(n: number): string {
  const suffix =
    n % 10 === 1 && n % 100 !== 11
      ? 'st'
      : n % 10 === 2 && n % 100 !== 12
        ? 'nd'
        : n % 10 === 3 && n % 100 !== 13
          ? 'rd'
          : 'th';
  return `${n}${suffix}`;
}
