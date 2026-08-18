import type { Metadata } from 'next';

import { castChart } from '@/lib/astro/chart';
import { kalsarpa, KALSARPA_TYPES } from '@/lib/astro/yogas';
import { BHAVA_NAMES, RASHI_NAMES_EN } from '@/lib/astro/constants';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { gateFor } from '@/components/site/FeatureGate';
import { ToolIntro } from '@/components/chart/ToolIntro';
import { ToolResult } from '@/components/chart/ToolResult';

export const metadata: Metadata = {
  title: 'Kalsarpa dosha and its type',
  description:
    'Whether every graha falls on one side of the Rahu Ketu axis, which of ' +
    'the twelve named forms it makes, and an honest note on where the ' +
    'doctrine actually comes from.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function KalsarpaPage({ searchParams }: { searchParams: SearchParams }) {
  const gate = await gateFor('kalsarpa', '/tools/kalsarpa');
  if (gate) return gate;

  const params = await searchParams;

  // A signed-in visitor with a saved default chart should never be shown

  // a blank form. `?new=1` is the way to one deliberately.

  await redirectToSavedChart(params, '/tools/kalsarpa');


  if (!hasBirthQuery(params)) {
    return (
      <ToolIntro
        eyebrow="Kālasarpa"
        headline="Kalsarpa dosha,"
        highlight="and which of the twelve."
        action="/tools/kalsarpa"
        submitLabel="Check my chart"
      >
        <p>
          Kalsarpa forms when every graha from the Sun to Saturn falls on one
          side of the axis between Rahu and Ketu. Where Rahu sits decides which
          of the twelve named forms it is, and the forms are not
          interchangeable: Ananta concerns one part of life, Takshaka another.
        </p>
        <p>
          This measures it by the actual arc from Rahu, not by house numbers,
          which is where most calculators go wrong and report a dosha that is
          not there.
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
  const sarpa = kalsarpa(chart);
  const rahu = chart.byGraha.Rahu;
  const ketu = chart.byGraha.Ketu;

  return (
    <ToolResult
      feature="kalsarpa"
      params={params}
      footer
      cover={{ title: 'Kālasarpa', subtitle: parsed.displayName ?? undefined }}
      eyebrow="Kālasarpa"
      title={parsed.displayName ? `${parsed.displayName}, checked` : 'Your chart, checked'}
      action="/tools/kalsarpa"
      submitLabel="Check this chart"
    >

        {/* Verdict ------------------------------------------------------ */}
        <section className="surface-card mt-8 p-6 sm:p-8" data-reveal>
          <p
            className="font-display text-4xl"
            style={{ color: sarpa.present ? 'var(--color-gold-300)' : 'var(--color-benefic)' }}
          >
            {sarpa.present
              ? `${sarpa.partial ? 'Partial ' : ''}${sarpa.typeName} Kalsarpa`
              : 'No Kalsarpa'}
          </p>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Rahu is in {RASHI_NAMES_EN[rahu.rashi]}, the {ordinal(sarpa.rahuHouse)} house,
            and Ketu in {RASHI_NAMES_EN[ketu.rashi]}, the {ordinal(sarpa.ketuHouse)}.
          </p>

          {sarpa.present ? (
            <>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {sarpa.partial
                  ? `Every graha except ${joinWords(sarpa.outside)} falls in the arc from Rahu to Ketu. A single graha outside the axis is what makes this partial rather than complete, and it matters: the classical claim is made about the complete form.`
                  : 'Every graha from the Sun to Saturn falls in the arc running from Rahu to Ketu, which is the complete form.'}
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Rahu in the {ordinal(sarpa.rahuHouse)} house names this form{' '}
                <strong style={{ color: 'var(--color-gold-200)' }}>{sarpa.typeName}</strong>,
                which is said to concern {sarpa.saidToSignify}.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The grahas fall on both sides of the Rahu Ketu axis, so the
              configuration does not form. If another site has told you
              otherwise, it almost certainly counted houses rather than measuring
              the arc, which produces a false positive whenever a graha sits in
              the same house as Rahu but behind it in longitude.
            </p>
          )}
        </section>

        {/* The twelve --------------------------------------------------- */}
        <section className="mt-12" data-reveal>
          <h2 className="eyebrow">The twelve forms</h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Named for the house Rahu occupies. The one that applies to this
            chart is marked.
          </p>

          <div className="surface-card mt-5 overflow-x-auto p-5 sm:p-6">
            <table className="w-full min-w-[30rem] border-collapse text-sm">
              <tbody>
                {KALSARPA_TYPES.map((type, i) => {
                  // typeIndex is the house Rahu occupies, so 1 based.
                  const isThis = sarpa.present && sarpa.typeIndex === i + 1;
                  return (
                    <tr
                      key={type.name}
                      className="border-t"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        background: isThis
                          ? 'color-mix(in oklab, var(--color-gold-500) 8%, transparent)'
                          : undefined,
                      }}
                    >
                      <td
                        className="py-2.5 pr-3 text-xs tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {ordinal(i + 1)}
                      </td>
                      <td
                        className="py-2.5 pr-4 font-medium"
                        style={{ color: isThis ? 'var(--color-gold-200)' : 'var(--text-primary)' }}
                      >
                        {type.name}
                      </td>
                      <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                        {type.said}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            Houses named: {BHAVA_NAMES[0]} through {BHAVA_NAMES[11]}.
          </p>
        </section>

        {/* The honest note ---------------------------------------------- */}
        <section className="mt-12" data-reveal>
          <h2 className="eyebrow">Where this comes from</h2>
          <div
            className="mt-5 rounded-lg border-l-2 py-4 pl-5 pr-4"
            style={{
              borderColor: 'var(--color-gold-600)',
              background: 'color-mix(in oklab, var(--color-gold-500) 5%, transparent)',
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {sarpa.note}
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            It is calculated here because people ask for it and deserve an
            accurate answer rather than a frightening one. It is not weighted
            heavily in a reading, and no reading on this site will ever tell you
            that a ritual at a particular temple is the only way out of it.
          </p>
        </section>
    </ToolResult>
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
