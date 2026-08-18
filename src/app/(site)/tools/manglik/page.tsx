import type { Metadata } from 'next';

import { castChart } from '@/lib/astro/chart';
import { mangalDosha } from '@/lib/astro/matching';
import { BHAVA_NAMES, RASHI_NAMES_EN } from '@/lib/astro/constants';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { gateFor } from '@/components/site/FeatureGate';
import { JourneyRail } from '@/components/chart/JourneyRail';
import { ReportCover, ReportFooter } from '@/components/chart/ReportChrome';
import { ToolIntro } from '@/components/chart/ToolIntro';
import { BirthForm } from '@/components/forms/BirthForm';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Manglik or not',
  description:
    'Whether Mars afflicts the chart, checked from the ascendant, the Moon ' +
    'and Venus alike, with every classical cancellation that applies.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** The six houses Mars afflicts, counted from each reference. */
const DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

export default async function ManglikPage({ searchParams }: { searchParams: SearchParams }) {
  const gate = await gateFor('manglik', '/tools/manglik');
  if (gate) return gate;

  const params = await searchParams;

  // A signed-in visitor with a saved default chart should never be shown

  // a blank form. `?new=1` is the way to one deliberately.

  await redirectToSavedChart(params, '/tools/manglik');


  if (!hasBirthQuery(params)) {
    return (
      <ToolIntro
        eyebrow="Maṅgala Doṣa"
        headline="Are you"
        highlight="Manglik?"
        action="/tools/manglik"
        submitLabel="Check my chart"
      >
        <p>
          Mangal dosha is the single most feared word in Indian matchmaking, and
          most of that fear is manufactured. A site that checks Mars from the
          ascendant alone will call roughly one chart in three Manglik, then sell
          you a remedy for it.
        </p>
        <p>
          This checks all three references the texts actually use, the ascendant,
          the Moon and Venus, and then applies the cancellations. A dosha that
          cancels is not a dosha, and the cancellations are the half of the rule
          that usually goes unmentioned.
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
  const dosha = mangalDosha(chart);
  const mars = chart.byGraha.Mars;

  const references = [
    { name: 'the ascendant', hit: dosha.fromAscendant },
    { name: 'the Moon', hit: dosha.fromMoon },
    { name: 'Venus', hit: dosha.fromVenus },
  ];
  const hits = references.filter((r) => r.hit);

  const verdict = !dosha.present
    ? 'Not Manglik'
    : dosha.cancelled
      ? 'Manglik, but cancelled'
      : 'Manglik';

  const verdictColour = dosha.present && !dosha.cancelled
    ? 'var(--color-malefic)'
    : dosha.present
      ? 'var(--color-gold-300)'
      : 'var(--color-benefic)';

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="report-body relative mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <ReportCover
          title="Mangal Doṣa"
          subtitle={parsed.displayName ?? undefined}
        />

        <JourneyRail current="manglik" params={params} />

        <p className="eyebrow" data-reveal>Maṅgala Doṣa</p>
        <h1
          className="font-display mt-4 text-3xl sm:text-4xl"
          style={{ color: 'var(--text-primary)' }}
          data-reveal
        >
          {parsed.displayName ? `${parsed.displayName}, checked` : 'Your chart, checked'}
        </h1>

        {/* The verdict ------------------------------------------------- */}
        <section className="surface-card mt-8 p-6 sm:p-8" data-reveal>
          <p className="font-display text-4xl" style={{ color: verdictColour }}>
            {verdict}
          </p>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Mars sits in {RASHI_NAMES_EN[mars.rashi]}, in the {ordinal(mars.house)}{' '}
            house from the ascendant, {BHAVA_NAMES[mars.house - 1].toLowerCase()}.
          </p>

          {dosha.present ? (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              That falls in a dosha house counted from{' '}
              {joinWords(hits.map((h) => h.name))}
              {hits.length === 1
                ? ', and from that reference only.'
                : `, ${hits.length} of the 3 references.`}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              That is outside the first, second, fourth, seventh, eighth and
              twelfth houses counted from the ascendant, from the Moon and from
              Venus alike. There is nothing here to cancel.
            </p>
          )}
        </section>

        {/* The three references, shown ---------------------------------- */}
        <section className="mt-10" data-reveal>
          <h2 className="eyebrow">The three references</h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The rule is counted from three points, not one. Charts flagged by a
            single reference are the ordinary case, and treating that as the same
            thing as a chart flagged by all three is how a mild placement turns
            into a broken engagement.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {references.map((r) => (
              <div key={r.name} className="surface-card p-5">
                <p
                  className="text-xs uppercase tracking-[0.14em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  From {r.name}
                </p>
                <p
                  className="font-display mt-2 text-2xl"
                  style={{ color: r.hit ? 'var(--color-malefic)' : 'var(--color-benefic)' }}
                >
                  {r.hit ? 'Afflicted' : 'Clear'}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Dosha houses: {DOSHA_HOUSES.map((h) => ordinal(h)).join(', ')}.
          </p>
        </section>

        {/* Cancellations ------------------------------------------------ */}
        {dosha.present && (
          <section className="mt-10" data-reveal>
            <h2 className="eyebrow">Cancellation</h2>
            <div className="surface-card mt-5 p-6">
              {dosha.cancellationReasons.length > 0 ? (
                <>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    The classical texts cancel the dosha under a number of
                    conditions. These apply here:
                  </p>
                  <ul className="mt-4 space-y-2">
                    {dosha.cancellationReasons.map((reason) => (
                      <li
                        key={reason}
                        className="flex gap-2.5 text-sm leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span style={{ color: 'var(--color-benefic)' }}>✓</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  None of the classical cancellations apply to this placement.
                  That does not make the chart unmarriageable. It means Mars is
                  a real factor in the seventh house matters and should be read
                  alongside everything else, not in place of it.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Honesty ------------------------------------------------------ */}
        <section className="mt-10" data-reveal>
          <div
            className="rounded-lg border-l-2 py-4 pl-5 pr-4"
            style={{
              borderColor: 'var(--color-gold-600)',
              background: 'color-mix(in oklab, var(--color-gold-500) 5%, transparent)',
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              What this is not: a verdict on whether you should marry someone.
              Mangal dosha is one factor among many, it is cancelled more often
              than it is upheld, and when both charts carry it the traditional
              position is that it does not apply at all. Anybody who tells you a
              Manglik chart requires an expensive ritual before marriage is
              selling the ritual.
            </p>
          </div>
        </section>

        <section className="mt-16 no-print">
          <h2 className="eyebrow">Another chart</h2>
          <div className="surface-card mt-5 max-w-xl p-6">
            <SavedChartPicker action="/tools/manglik" />
            <BirthForm action="/tools/manglik" submitLabel="Check this chart" />
          </div>
        </section>

        <ReportFooter />
      </div>
    </div>
  );
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
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
