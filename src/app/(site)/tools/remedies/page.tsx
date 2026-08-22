import type { Metadata } from 'next';
import Link from 'next/link';

import { castChart } from '@/lib/astro/chart';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import {
  gemstones,
  remedies,
  type GrahaCondition,
  type Remedy,
} from '@/lib/predictions/remedies';
import { BirthForm } from '@/components/forms/BirthForm';
import { gateFor } from '@/components/site/FeatureGate';
import { ToolResult } from '@/components/chart/ToolResult';
import { Reveal } from '@/components/motion/Reveal';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';
import { GrahaMark } from '@/components/ornament/GrahaMark';

export const metadata: Metadata = {
  title: 'Remedies',
  description:
    'The traditional measures for every graha in your chart, with the reason ' +
    'each one appears, practical advice for the house it occupies, and habits ' +
    'small enough to keep.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const KIND_LABEL: Record<Remedy['kind'], string> = {
  conduct: 'Conduct',
  charity: 'Charity',
  fasting: 'Fasting',
  mantra: 'Mantra',
};

const CONDITION_LABEL: Record<GrahaCondition, string> = {
  strained: 'Under pressure',
  mixed: 'Neither strong nor afflicted',
  supported: 'Well placed',
};

const CONDITION_COLOUR: Record<GrahaCondition, string> = {
  strained: 'var(--color-malefic)',
  mixed: 'var(--color-gold-300)',
  supported: 'var(--color-benefic)',
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
        <div className="relative mx-auto max-w-2xl px-5 pt-10 pb-20 sm:pt-12 sm:pb-28">
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
            Every graha in your chart, not only the afflicted ones: what each is
            doing, what that means for the part of life it sits in, and the
            classical measure for it. Conduct first, then charity, then mantra.
            Gemstones have their own page, and their own argument.
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
  const stones = gemstones(chart);

  const strained = report.grahas.filter((g) => g.condition === 'strained');

  // This page's own params, so the gemstone page keeps the chart.
  const carried = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    carried.set(key, Array.isArray(value) ? value[0] : value);
  }

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

        {/*
          Where the chart actually stands, before the list.

          The page used to open straight into whichever grahas had failed a
          check, which meant a chart with nothing wrong opened into an empty
          state and a chart with three problems opened as though the other six
          grahas were not there. One line of arithmetic first is a better
          introduction than either.
        */}
        <p
          className="mt-3 max-w-2xl text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
          data-reveal
        >
          {strained.length === 0
            ? 'No graha in this chart is debilitated, combust, in a difficult house or named in an affliction. Nothing below is repair work — it is all practice.'
            : strained.length === 1
              ? 'One graha in this chart is under pressure, and it is listed first.'
              : `${strained.length} grahas in this chart are under pressure, and they are listed first.`}
        </p>

        <div className="mt-10 space-y-10">
          {report.grahas.map(({ graha, condition, reasons, practical, tips, measures }) => (
            <section key={graha} data-reveal>
              {/*
                A mark at the head of each block. Nine near-identical sections
                is a lot to scan, and a lit sphere gives the eye something to
                count by that a heading alone does not.
              */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <GrahaMark graha={graha} size={34} decorative />
                <h2 className="font-display text-2xl" style={{ color: 'var(--color-gold-200)' }}>
                  {graha}
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.14em]"
                  style={{
                    color: CONDITION_COLOUR[condition],
                    background: `color-mix(in oklab, ${CONDITION_COLOUR[condition]} 12%, transparent)`,
                  }}
                >
                  {CONDITION_LABEL[condition]}
                </span>
              </div>

              <ul className="mt-2 space-y-1">
                {reasons.map((reason) => (
                  <li key={reason} className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {reason}
                  </li>
                ))}
              </ul>

              {/* What this placement means for a part of life. */}
              <p
                className="mt-4 border-l-2 pl-4 text-sm leading-relaxed"
                style={{
                  color: 'var(--text-secondary)',
                  borderColor: CONDITION_COLOUR[condition],
                }}
              >
                {practical}
              </p>

              {tips.length > 0 && (
                <div className="mt-4">
                  <p
                    className="text-[0.65rem] uppercase tracking-[0.18em]"
                    style={{ color: 'var(--color-gold-600)' }}
                  >
                    Tips
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {tips.map((tip) => (
                      <li
                        key={tip}
                        className="flex gap-2 text-sm leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span aria-hidden style={{ color: 'var(--color-gold-600)' }}>·</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {measures.map((measure, i) => (
                  <div key={`${measure.kind}-${i}`} className="surface-card p-4">
                    <p
                      className="text-[0.65rem] uppercase tracking-[0.18em]"
                      style={{ color: 'var(--color-gold-600)' }}
                    >
                      {KIND_LABEL[measure.kind]}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {measure.action}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/*
          Gemstones, at the end and on their own page.

          They used to be a fifth card under every graha, greyed out, with the
          same caveat repeated nine times underneath a recommendation — which is
          exactly the shape of fine print, and this is not fine print. It is the
          most important thing the site has to say on the subject, and it needs
          somewhere it can be said once, properly.
        */}
        <section className="mt-16" data-reveal>
          <h2 className="eyebrow">And the stones</h2>

          <div className="surface-card mt-5 p-6 sm:p-8">
            <p className="font-display text-xl" style={{ color: 'var(--color-gold-200)' }}>
              {stones.indicated.length === 0
                ? 'No stone is indicated by this chart'
                : stones.indicated.length === 1
                  ? `One stone would traditionally be named: ${stones.indicated[0].convention.stone.toLowerCase()}`
                  : `${stones.indicated.length} stones would traditionally be named`}
            </p>

            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {stones.indicated.length === 0
                ? 'A strengthening stone is prescribed for a graha under pressure, and this chart holds none. Anyone selling you one on the strength of this chart is not reading it.'
                : `Named for ${stones.indicated
                    .map((e) => e.graha)
                    .join(', ')}, because those are the grahas this chart holds under pressure. That is a statement about what the tradition does, not a recommendation to buy anything.`}
            </p>

            <p
              className="mt-4 border-l pl-4 text-xs leading-relaxed"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
            >
              {stones.caveat}
            </p>

            <Link
              href={`/tools/gemstones?${carried.toString()}`}
              className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-full border px-5 text-sm
                         font-medium transition-colors duration-300"
              style={{
                borderColor: 'var(--color-gold-600)',
                background: 'color-mix(in oklab, var(--color-gold-500) 10%, transparent)',
                color: 'var(--color-gold-200)',
              }}
            >
              Every stone, and how they are worn <span aria-hidden>→</span>
            </Link>
          </div>
        </section>


    </ToolResult>
  );
}
