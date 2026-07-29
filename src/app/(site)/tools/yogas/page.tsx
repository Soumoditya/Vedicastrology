import type { Metadata } from 'next';

import { castChart } from '@/lib/astro/chart';
import { detectYogas } from '@/lib/astro/yogas';
import { ashtakavarga, sarvaVerdict, AV_GRAHAS } from '@/lib/astro/ashtakavarga';
import { mangalDosha } from '@/lib/astro/matching';
import { GRAHA_ABBR, RASHI_NAMES_EN, RASHI_SYMBOLS } from '@/lib/astro/constants';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { BirthForm } from '@/components/forms/BirthForm';
import { Reveal } from '@/components/motion/Reveal';
import type { YogaResult } from '@/lib/astro/types';

export const metadata: Metadata = {
  title: 'Yogas, Doshas and Ashtakavarga',
  description:
    'Every yoga and dosha your chart forms, with the reason each one was ' +
    'found, plus Manglik, Kalsarpa and full Ashtakavarga bindu tables.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function YogaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (!hasBirthQuery(params)) {
    return (
      <div className="relative">
        <Reveal />
        <div className="starfield" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-5 py-20 sm:py-28">
          <p className="eyebrow" data-reveal>Yoga, Doṣa, Aṣṭakavarga</p>
          <h1
            className="font-display mt-6 text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            The combinations
            <span className="text-gold-leaf block">your chart makes.</span>
          </h1>
          <p
            className="mt-7 text-[1.0625rem] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
            data-reveal
          >
            A yoga is a specific arrangement of grahas that the classical texts
            name and describe. Most of them are rarer than the internet suggests,
            because most listings check half the conditions. This one shows you
            the reason each finding fired, so you can take it to a text and check
            it yourself.
          </p>
          <div className="surface-card mt-10 p-6 sm:p-8" data-reveal="scale">
            <BirthForm action="/tools/yogas" submitLabel="Read my chart" />
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
  const report = detectYogas(chart);
  const manglik = mangalDosha(chart);
  const av = ashtakavarga(chart);
  const sarpa = report.kalsarpa;

  const maxSarva = Math.max(...av.sarva);

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-5 py-16 sm:py-20">
        <p className="eyebrow" data-reveal>Yoga, Doṣa, Aṣṭakavarga</p>
        <h1
          className="font-display mt-4 text-3xl sm:text-4xl"
          style={{ color: 'var(--text-primary)' }}
          data-reveal
        >
          {parsed.displayName ? `${parsed.displayName}'s combinations` : 'Your combinations'}
        </h1>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3" data-reveal>
          <Count value={report.yogas.length} label={report.yogas.length === 1 ? 'yoga' : 'yogas'} />
          <Count
            value={report.doshas.length}
            label={report.doshas.length === 1 ? 'affliction' : 'afflictions'}
          />
          <Count
            value={manglik.present ? (manglik.cancelled ? 'Cancelled' : 'Yes') : 'No'}
            label="Manglik"
          />
          <Count
            value={sarpa.present ? (sarpa.partial ? 'Partial' : sarpa.typeName ?? 'Yes') : 'No'}
            label="Kalsarpa"
          />
        </div>

        {/* Yogas ------------------------------------------------------- */}
        <section className="mt-14" data-reveal>
          <h2 className="eyebrow">What forms</h2>
          {report.yogas.length === 0 ? (
            <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              No named yoga forms in this chart under the full conditions. That is
              an ordinary result, not a poor one. Named yogas are a small part of
              a reading, and a chart without one can be far stronger than a chart
              with three weak ones.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {report.yogas.map((y, i) => (
                <FindingCard key={`${y.name}-${i}`} finding={y} />
              ))}
            </div>
          )}
        </section>

        {/* Manglik ----------------------------------------------------- */}
        <section className="mt-14" data-reveal>
          <h2 className="eyebrow">Mangal doṣa</h2>
          <div className="surface-card mt-5 p-6 sm:p-7">
            <p
              className="font-display text-2xl"
              style={{
                color: manglik.present && !manglik.cancelled
                  ? 'var(--color-malefic)'
                  : 'var(--color-gold-200)',
              }}
            >
              {!manglik.present
                ? 'Not Manglik'
                : manglik.cancelled
                  ? 'Manglik, but cancelled'
                  : 'Manglik'}
            </p>

            {manglik.present ? (
              <>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Mars falls in one of the dosha houses counted from{' '}
                  {[
                    manglik.fromAscendant && 'the ascendant',
                    manglik.fromMoon && 'the Moon',
                    manglik.fromVenus && 'Venus',
                  ]
                    .filter(Boolean)
                    .join(', ')
                    .replace(/, ([^,]*)$/, ' and $1')}
                  . Checking all three references is the difference between an
                  honest reading and a scare: many charts flagged Manglik by one
                  reference are clear by the other two.
                </p>
                {manglik.cancellationReasons.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {manglik.cancellationReasons.map((reason) => (
                      <li key={reason} className="flex gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--color-benefic)' }}>✓</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Mars sits outside the first, second, fourth, seventh, eighth and
                twelfth houses counted from the ascendant, the Moon and Venus
                alike.
              </p>
            )}
          </div>
        </section>

        {/* Afflictions ------------------------------------------------- */}
        {report.doshas.length > 0 && (
          <section className="mt-14" data-reveal>
            <h2 className="eyebrow">Other afflictions</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {report.doshas.map((d, i) => (
                <FindingCard key={`${d.name}-${i}`} finding={d} />
              ))}
            </div>
          </section>
        )}

        {/* Kalsarpa ---------------------------------------------------- */}
        <section className="mt-14" data-reveal>
          <h2 className="eyebrow">Kālasarpa</h2>
          <div className="surface-card mt-5 p-6 sm:p-7">
            <p
              className="font-display text-2xl"
              style={{ color: sarpa.present ? 'var(--color-gold-200)' : 'var(--text-primary)' }}
            >
              {sarpa.present
                ? `${sarpa.partial ? 'Partial ' : ''}${sarpa.typeName} Kalsarpa`
                : 'No Kalsarpa'}
            </p>

            {sarpa.present ? (
              <>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {sarpa.partial
                    ? `All the grahas except ${sarpa.outside.join(' and ')} fall on one side of the Rahu Ketu axis.`
                    : 'Every graha from the Sun to Saturn falls on one side of the Rahu Ketu axis.'}{' '}
                  Rahu sits in the {ordinal(sarpa.rahuHouse)} house and Ketu in the{' '}
                  {ordinal(sarpa.ketuHouse)}, which names this form {sarpa.typeName}.
                </p>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  It is said to concern {sarpa.saidToSignify}.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                The grahas fall on both sides of the Rahu Ketu axis, so the
                configuration does not form.
              </p>
            )}

            {/* The disclaimer sits with the result, not in a footnote nobody
                reaches. This is the one place on the site where the honest
                answer is more useful than the confident one. */}
            <div
              className="mt-6 rounded-lg border-l-2 py-3 pl-4 pr-3"
              style={{
                borderColor: 'var(--color-gold-600)',
                background: 'color-mix(in oklab, var(--color-gold-500) 5%, transparent)',
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {sarpa.note}
              </p>
            </div>
          </div>
        </section>

        {/* Ashtakavarga ------------------------------------------------ */}
        <section className="mt-14" data-reveal>
          <h2 className="eyebrow">Aṣṭakavarga</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A scoring system, and the most practical thing in the whole toolkit.
            Each sign collects points from eight reference positions. A transit
            over a sign holding thirty two points reads very differently from the
            same transit over a sign holding twenty two. The seven totals always
            sum to 337, which is how the tables check themselves.
          </p>
          <p className="mt-2 text-xs sm:hidden" style={{ color: 'var(--text-muted)' }}>
            Both tables scroll sideways.
          </p>

          <div className="surface-card mt-6 overflow-x-auto p-5 sm:p-7">
            <p className="eyebrow">Sarvāṣṭakavarga</p>
            <div className="mt-5 flex min-w-[34rem] items-end gap-1.5">
              {av.sarva.map((bindus, rashi) => {
                const verdict = sarvaVerdict(bindus);
                return (
                  <div key={rashi} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className="tabular-nums text-xs"
                      style={{
                        color:
                          verdict === 'strong'
                            ? 'var(--color-benefic)'
                            : verdict === 'weak'
                              ? 'var(--color-malefic)'
                              : 'var(--text-secondary)',
                      }}
                    >
                      {bindus}
                    </span>
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        // Scaled against the chart's own maximum so the shape of
                        // the distribution is visible, not against 56 which would
                        // flatten every chart into the same low band.
                        height: `${Math.round((bindus / maxSarva) * 108)}px`,
                        background:
                          verdict === 'strong'
                            ? 'linear-gradient(180deg, var(--color-gold-300), var(--color-gold-600))'
                            : verdict === 'weak'
                              ? 'color-mix(in oklab, var(--color-malefic) 45%, transparent)'
                              : 'color-mix(in oklab, var(--color-gold-500) 30%, transparent)',
                      }}
                    />
                    <span className="text-[0.65rem]" style={{ color: 'var(--text-muted)' }}>
                      {RASHI_SYMBOLS[rashi]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>
                Strongest:{' '}
                <span style={{ color: 'var(--color-gold-300)' }}>
                  {av.strongest.map((s) => `${RASHI_NAMES_EN[s.rashi]} ${s.bindus}`).join(', ')}
                </span>
              </span>
              <span>
                Weakest:{' '}
                <span style={{ color: 'var(--color-malefic)' }}>
                  {av.weakest.map((s) => `${RASHI_NAMES_EN[s.rashi]} ${s.bindus}`).join(', ')}
                </span>
              </span>
            </div>
          </div>

          {/* Per graha bindu table */}
          <div className="surface-card mt-3 overflow-x-auto p-5 sm:p-7">
            <p className="eyebrow">Bhinnāṣṭakavarga</p>
            <table className="mt-5 w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="pb-2 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    <span className="sr-only">Graha</span>
                  </th>
                  {RASHI_SYMBOLS.map((symbol, rashi) => (
                    <th
                      key={rashi}
                      className="pb-2 text-center text-xs font-normal"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <abbr title={RASHI_NAMES_EN[rashi]} style={{ textDecoration: 'none' }}>
                        {symbol}
                      </abbr>
                    </th>
                  ))}
                  <th className="pb-2 text-right text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {av.charts.map((row) => (
                  <tr key={row.graha} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="py-2 pr-3 text-xs" style={{ color: 'var(--text-primary)' }}>
                      {row.graha}
                    </td>
                    {row.bindus.map((b, rashi) => (
                      <td
                        key={rashi}
                        className="py-2 text-center tabular-nums"
                        style={{
                          // Single graha scale is 0 to 8, so the bands differ
                          // from the Sarva ones above.
                          color:
                            b >= 5
                              ? 'var(--color-gold-300)'
                              : b <= 2
                                ? 'var(--text-muted)'
                                : 'var(--text-secondary)',
                        }}
                      >
                        {b}
                      </td>
                    ))}
                    <td className="py-2 text-right tabular-nums text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {row.total}
                    </td>
                  </tr>
                ))}
                <tr className="border-t" style={{ borderColor: 'var(--border-strong)' }}>
                  <td className="py-2 pr-3 text-xs" style={{ color: 'var(--color-gold-400)' }}>
                    Sarva
                  </td>
                  {av.sarva.map((b, rashi) => (
                    <td
                      key={rashi}
                      className="py-2 text-center tabular-nums text-xs"
                      style={{ color: 'var(--color-gold-400)' }}
                    >
                      {b}
                    </td>
                  ))}
                  <td className="py-2 text-right tabular-nums text-xs" style={{ color: 'var(--color-gold-400)' }}>
                    {av.sarvaTotal}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              Rahu and Ketu are absent by design. They have no Ashtakavarga in
              the Parashari system, so listing {GRAHA_ABBR.Rahu} and{' '}
              {GRAHA_ABBR.Ketu} rows of zeroes would only imply a measurement
              that was never taken. Seven grahas, {AV_GRAHAS.length * 12} cells,
              337 points.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="eyebrow">Another chart</h2>
          <div className="surface-card mt-5 max-w-xl p-6">
            <BirthForm action="/tools/yogas" submitLabel="Read this chart" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Count({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl leading-none" style={{ color: 'var(--color-gold-200)' }}>
        {value}
      </p>
      <p className="mt-1.5 text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  );
}

/**
 * One finding.
 *
 * The reason is shown at the same size as the name rather than hidden behind a
 * disclosure, because the reason is the point. Anyone can list yoga names; the
 * conditions that fired are what make the list checkable.
 */
function FindingCard({ finding }: { finding: YogaResult }) {
  const accent =
    finding.polarity === 'malefic'
      ? 'var(--color-malefic)'
      : finding.polarity === 'mixed'
        ? 'var(--color-gold-500)'
        : 'var(--color-gold-300)';

  return (
    <article className="surface-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg" style={{ color: accent }}>
          {finding.name}
        </h3>
        <Strength level={finding.strength} />
      </div>

      {finding.sanskrit && (
        <p className="font-quote mt-0.5 text-sm italic" style={{ color: 'var(--color-gold-600)' }}>
          {finding.sanskrit}
        </p>
      )}

      <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {finding.reason}
      </p>

      <p className="mt-3 text-[0.7rem] uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
        {finding.involvedGrahas.join(' · ')}
      </p>
    </article>
  );
}

/** Three pips rather than a word, so strength reads at a glance down a column. */
function Strength({ level }: { level: 'strong' | 'moderate' | 'weak' }) {
  const filled = level === 'strong' ? 3 : level === 'moderate' ? 2 : 1;

  return (
    <span className="flex shrink-0 items-center gap-1" title={`${level} strength`}>
      <span className="sr-only">{level}</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="block h-1.5 w-1.5 rounded-full"
          style={{
            background: i < filled ? 'var(--color-gold-400)' : 'var(--border-strong)',
          }}
        />
      ))}
    </span>
  );
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
