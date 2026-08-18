import type { Metadata } from 'next';

import { castChart } from '@/lib/astro/chart';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { remedies, type Remedy } from '@/lib/predictions/remedies';
import { BirthForm } from '@/components/forms/BirthForm';
import { gateFor } from '@/components/site/FeatureGate';
import { ToolResult } from '@/components/chart/ToolResult';
import { Reveal } from '@/components/motion/Reveal';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';

export const metadata: Metadata = {
  title: 'Remedies',
  description:
    'The traditional measures for the grahas your chart shows as needing ' +
    'support, with the reason each one appears and an honest note on gemstones.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const KIND_LABEL: Record<Remedy['kind'], string> = {
  conduct: 'Conduct',
  charity: 'Charity',
  fasting: 'Fasting',
  mantra: 'Mantra',
  gemstone: 'Gemstone',
};

export default async function RemediesPage({ searchParams }: { searchParams: SearchParams }) {
  const gate = await gateFor('remedies', '/tools/remedies');
  if (gate) return gate;

  const params = await searchParams;

  // A signed-in visitor with a saved default chart should never be shown

  // a blank form. `?new=1` is the way to one deliberately.

  await redirectToSavedChart(params, '/tools/remedies');


  if (!hasBirthQuery(params)) {
    return (
      <div className="relative">
        <Reveal />
        <div className="starfield" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-5 py-20 sm:py-28">
          <p className="eyebrow" data-reveal>Upāya</p>
          <h1
            className="font-display mt-6 text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            What the tradition
            <span className="text-gold-leaf block">actually suggests.</span>
          </h1>
          <p
            className="mt-7 text-[1.0625rem] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
            data-reveal
          >
            Conduct first, then charity, then mantra, and gemstones last with a
            plain note about why they are last. Every suggestion says which graha
            it is for and what in your chart put it there.
          </p>
          <div className="surface-card mt-10 p-6 sm:p-8" data-reveal="scale">
            <SavedChartPicker action="/tools/remedies" />
            <BirthForm action="/tools/remedies" submitLabel="Show my remedies" />
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
  const report = remedies(chart);

  // Grouped by graha, since a person acts graha by graha rather than measure by
  // measure.
  const byGraha = report.grahas.map((entry) => ({
    ...entry,
    measures: report.remedies.filter((r) => r.graha === entry.graha),
  }));

  return (
    <ToolResult
      feature="remedies"
      params={params}
      eyebrow="Upāya"
      title={parsed.displayName ? `Remedies for ${parsed.displayName}` : 'Your remedies'}
      action="/tools/remedies"
      submitLabel="Show remedies"
    >

        <p
          className="mt-5 max-w-2xl text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
          data-reveal
        >
          {report.note}
        </p>

        {byGraha.length === 0 ? (
          <div className="surface-card mt-10 p-6" data-reveal>
            <p className="font-display text-xl" style={{ color: 'var(--color-gold-200)' }}>
              Nothing here needs propping up
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              No graha in this chart is debilitated, combust, in an unfriendly
              sign, in a difficult house or named in an affliction. That is a
              good result, and inventing remedies for it would be dishonest.
              Nothing to do.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {byGraha.map(({ graha, reasons, measures }) => (
              <section key={graha} data-reveal>
                <h2 className="font-display text-2xl" style={{ color: 'var(--color-gold-200)' }}>
                  {graha}
                </h2>

                <ul className="mt-2 space-y-1">
                  {reasons.map((reason) => (
                    <li key={reason} className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {reason}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 space-y-3">
                  {measures.map((measure, i) => (
                    <div
                      key={`${measure.kind}-${i}`}
                      className="surface-card p-4"
                      style={{ opacity: measure.kind === 'gemstone' ? 0.82 : 1 }}
                    >
                      <p
                        className="text-[0.65rem] uppercase tracking-[0.18em]"
                        style={{
                          color:
                            measure.kind === 'gemstone'
                              ? 'var(--text-muted)'
                              : 'var(--color-gold-600)',
                        }}
                      >
                        {KIND_LABEL[measure.kind]}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {measure.action}
                      </p>
                      {measure.caveat && (
                        <p
                          className="mt-2.5 border-l pl-3 text-xs leading-relaxed"
                          style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
                        >
                          {measure.caveat}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}


    </ToolResult>
  );
}
