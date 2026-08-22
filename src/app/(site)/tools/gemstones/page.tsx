import type { Metadata } from 'next';

import { castChart } from '@/lib/astro/chart';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { gemstones, type GrahaCondition } from '@/lib/predictions/remedies';
import { gateFor } from '@/components/site/FeatureGate';
import { ToolIntro } from '@/components/chart/ToolIntro';
import { ToolResult } from '@/components/chart/ToolResult';
import { GrahaMark } from '@/components/ornament/GrahaMark';

export const metadata: Metadata = {
  title: 'Gemstones',
  description:
    'Which stones your chart would traditionally be given, how each is worn, ' +
    'and a plain account of why no classical text makes a stone the primary ' +
    'remedy.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const CONDITION_NOTE: Record<GrahaCondition, string> = {
  strained: 'Indicated',
  mixed: 'Not indicated',
  supported: 'Not indicated',
};

/**
 * Gemstones, given a page of their own.
 *
 * They were a greyed-out fifth card under every graha on the remedies page,
 * carrying the same paragraph of caveat nine times over. Repetition is how a
 * warning becomes wallpaper, and the warning is the point here: a stone is the
 * only remedy in the tradition with a price attached, which is most of why it
 * is the one people are sold. The subject needs somewhere it can be set out
 * once and argued properly, and this is it.
 *
 * What the page will not do is refuse to answer. Somebody who came to find out
 * which stone their chart names should find out — with the conventions, the
 * substitutes, and the reason the tradition itself puts stones last.
 */
export default async function GemstonesPage({ searchParams }: { searchParams: SearchParams }) {
  /*
    Gated on `remedies`, not on a key of its own.

    A gemstone reading is a remedies reading — it is computed from the same
    graha conditions and it belongs to the same tier — so it answers to the same
    flag. `canUse` refuses an unknown key by design, so inventing `gemstones`
    here would make this page unreachable until a row was hand-added to the
    database, which is a deployment trap for a page that has no separate
    business meaning.
  */
  const gate = await gateFor('remedies', '/tools/gemstones');
  if (gate) return gate;

  const params = await searchParams;

  await redirectToSavedChart(params, '/tools/gemstones');

  if (!hasBirthQuery(params)) {
    return (
      <ToolIntro
        eyebrow="Ratna"
        headline="Which stone,"
        highlight="and whether at all."
        action="/tools/gemstones"
        submitLabel="Show my stones"
      >
        <p>
          Every graha has a stone, and a traditional prescription names one for
          the grahas a chart holds under pressure. Your chart is read for that
          here, with the metal, the finger and the day each stone is
          conventionally set and worn on, and the cheaper substitute the
          tradition accepts in its place.
        </p>
        <p>
          It is also read honestly. No classical text makes a stone the primary
          remedy, the prescriptions disagree with one another, and stones are
          expensive — which is a large part of why they are recommended so
          often. That is worth knowing before a price is quoted, not after.
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
  const report = gemstones(chart);

  return (
    <ToolResult
      feature="remedies"
      params={params}
      footer
      cover={{ title: 'Ratna', subtitle: parsed.displayName ?? undefined }}
      eyebrow="Ratna"
      title={parsed.displayName ? `Stones for ${parsed.displayName}` : 'Your stones'}
      action="/tools/gemstones"
      submitLabel="Show these stones"
    >

        {/* Read this first, and it is placed first deliberately. */}
        <section className="mt-8" data-reveal>
          <div
            className="rounded-lg border-l-2 py-5 pl-5 pr-4"
            style={{
              borderColor: 'var(--color-gold-600)',
              background: 'color-mix(in oklab, var(--color-gold-500) 5%, transparent)',
            }}
          >
            <p className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
              Before the list
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {report.caveat}
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {report.note}
            </p>
          </div>
        </section>

        {/* What this chart actually names */}
        <section className="mt-12" data-reveal>
          <h2 className="eyebrow">What this chart names</h2>

          {report.indicated.length === 0 ? (
            <div className="surface-card mt-5 p-6">
              <p className="font-display text-2xl" style={{ color: 'var(--color-benefic)' }}>
                None
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                A strengthening stone is prescribed for a graha under pressure —
                debilitated, combust, in a difficult house, or named in an
                affliction. No graha in this chart is any of those. The full
                reference below is there because it is worth knowing; nothing in
                it is being recommended to you.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {report.indicated.map((entry) => (
                <div key={entry.graha} className="surface-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display flex items-center gap-2.5 text-xl" style={{ color: 'var(--color-gold-200)' }}>
                      <GrahaMark graha={entry.graha} size={30} ns="gi" decorative />
                      {entry.convention.stone}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                      for {entry.graha}
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {entry.because}
                  </p>

                  <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <Row label="Metal">{entry.convention.metal}</Row>
                    <Row label="Finger">{entry.convention.finger}</Row>
                    <Row label="Day">{entry.convention.day}</Row>
                    <Row label="In its place">{entry.convention.substitute}</Row>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* The full nine, as reference */}
        <section className="mt-12" data-reveal>
          <h2 className="eyebrow">All nine</h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The complete table, with what this chart says about each. The
            conventions are the ones most commonly given; sources differ, and
            where a stone has a widely accepted cheaper substitute it is named
            rather than left out.
          </p>

          <div className="surface-card mt-5 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr
                  className="border-b text-left text-xs uppercase tracking-[0.1em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <th className="px-4 py-2.5 font-medium">Graha</th>
                  <th className="px-4 py-2.5 font-medium">Stone</th>
                  <th className="px-4 py-2.5 font-medium">Metal</th>
                  <th className="px-4 py-2.5 font-medium">Finger</th>
                  <th className="px-4 py-2.5 font-medium">Day</th>
                  <th className="px-4 py-2.5 font-medium">In its place</th>
                  <th className="px-4 py-2.5 font-medium">This chart</th>
                </tr>
              </thead>
              <tbody>
                {report.entries.map((entry) => (
                  <tr
                    key={entry.graha}
                    className="border-b last:border-0"
                    style={{ opacity: entry.indicated ? 1 : 0.6 }}
                  >
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                      <span className="flex items-center gap-2">
                        <GrahaMark graha={entry.graha} size={22} ns="gt" decorative />
                        {entry.graha}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {entry.convention.stone}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {entry.convention.metal}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {entry.convention.finger}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {entry.convention.day}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>
                      {entry.convention.substitute}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        style={{
                          color: entry.indicated
                            ? 'var(--color-gold-300)'
                            : 'var(--text-muted)',
                        }}
                      >
                        {CONDITION_NOTE[entry.condition]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* The order the tradition puts them in */}
        <section className="mt-12" data-reveal>
          <div className="surface-card p-6 sm:p-8">
            <h2 className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
              Why stones come last
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The classical ordering of remedies is conduct, then charity and
              fasting, then mantra, and only then a stone. Conduct is first
              because cultivating the quality a graha governs is what every
              source treats as the actual remedy — and it is free, immediate, and
              impossible to sell anybody. That last part is not a small detail.
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Nothing bad follows from wearing no stone at all. If a reading has
              ever been put to you the other way round, that was a sales
              technique rather than a tradition.
            </p>
          </div>
        </section>
    </ToolResult>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 text-xs uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </dt>
      <dd style={{ color: 'var(--text-primary)' }}>{children}</dd>
    </div>
  );
}
