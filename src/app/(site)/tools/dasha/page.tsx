import type { Metadata } from 'next';
import { DateTime } from 'luxon';

import { castChart } from '@/lib/astro/chart';
import {
  buildVimshottari,
  dashaAt,
  formatBalance,
  upcomingDashaChanges,
} from '@/lib/astro/dasha';
import { NAKSHATRA_NAMES } from '@/lib/astro/constants';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { BirthForm } from '@/components/forms/BirthForm';
import { gateFor } from '@/components/site/FeatureGate';
import { JourneyRail } from '@/components/chart/JourneyRail';
import { PrintButton } from '@/components/chart/PrintButton';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';
import { Reveal } from '@/components/motion/Reveal';
import type { DashaPeriod } from '@/lib/astro/types';

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
    title: 'Vimshottari Dasha',
    description:
      'Your planetary periods to four levels, with the exact date each one ' +
      'begins and ends.',
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

export default async function DashaPage({ searchParams }: { searchParams: SearchParams }) {
  // Checked before any work: a page about to refuse should not cast a chart.
  const gate = await gateFor('dasha', '/tools/dasha');
  if (gate) return gate;

  const params = await searchParams;

  // A signed-in visitor with a saved default chart should never be shown

  // a blank form. `?new=1` is the way to one deliberately.

  await redirectToSavedChart(params, '/tools/dasha');


  if (!hasBirthQuery(params)) {
    return (
      <div className="relative">
        <Reveal />
        <div className="starfield" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-5 py-20 sm:py-28">
          <p className="eyebrow" data-reveal>Vimśottarī Daśā</p>
          <h1
            className="font-display mt-6 text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            The chapter
            <span className="text-gold-leaf block">you are in.</span>
          </h1>
          <p className="mt-7 text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }} data-reveal>
            Vimshottari divides a life into periods ruled by each graha in turn.
            Where you are in that sequence explains far more about a stretch of
            years than any transit does.
          </p>
          <div className="surface-card mt-10 p-6 sm:p-8" data-reveal="scale">
            <SavedChartPicker action="/tools/dasha" />
            <BirthForm action="/tools/dasha" submitLabel="Show my periods" />
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
  const tree = buildVimshottari(chart, { maxLevel: 3 });
  const active = dashaAt(tree, new Date());
  const upcoming = upcomingDashaChanges(tree, new Date(), 8);

  const zone = chart.meta.timezone;
  const fmt = (d: Date) => DateTime.fromJSDate(d).setZone(zone).toFormat('d LLL yyyy');
  const moon = chart.byGraha.Moon;

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-5 py-16 sm:py-20">
        <JourneyRail current="dasha" params={params} />
        <div className="mb-8 flex justify-end"><PrintButton /></div>
        <p className="eyebrow" data-reveal>Vimśottarī Daśā</p>
        <h1 className="font-display mt-4 text-3xl sm:text-4xl" style={{ color: 'var(--text-primary)' }} data-reveal>
          {parsed.displayName ? `${parsed.displayName}'s periods` : 'Your periods'}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Seeded from the Moon in {NAKSHATRA_NAMES[moon.nakshatra]}, pada {moon.pada}.
          {' '}{formatBalance(tree)}.
        </p>

        {active && (
          <div className="surface-card mt-8 p-7" data-reveal="scale">
            <p className="eyebrow">Running now</p>
            <p className="font-display mt-3 text-[clamp(2rem,6vw,3rem)] leading-tight" style={{ color: 'var(--color-gold-200)' }}>
              {active.maha.lord}
              {active.antar && (
                <span style={{ color: 'var(--text-secondary)' }}> / {active.antar.lord}</span>
              )}
              {active.pratyantar && (
                <span style={{ color: 'var(--text-muted)' }}> / {active.pratyantar.lord}</span>
              )}
            </p>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {active.maha.lord} mahadasha runs {fmt(active.maha.start)} to {fmt(active.maha.end)}.
              {active.antar && ` The ${active.antar.lord} sub-period ends ${fmt(active.antar.end)}.`}
            </p>
          </div>
        )}

        <section className="mt-12" data-reveal>
          <h2 className="eyebrow">The full sequence</h2>
          <ol className="mt-5 space-y-1">
            {tree.periods.map((maha) => (
              <MahadashaRow
                key={`${maha.lord}-${maha.start.toISOString()}`}
                maha={maha}
                isActive={active?.maha === maha}
                activeAntar={active?.antar}
                fmt={fmt}
              />
            ))}
          </ol>
        </section>

        {upcoming.length > 0 && (
          <section className="mt-12" data-reveal>
            <h2 className="eyebrow">Next changes</h2>
            <ul className="mt-5 space-y-1">
              {upcoming.map((event) => (
                <li
                  key={`${event.entering}-${event.date.toISOString()}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-t py-3 text-sm"
                >
                  <span style={{ color: 'var(--text-primary)' }}>{event.entering}</span>
                  <span className="tabular-nums text-xs" style={{ color: 'var(--color-gold-400)' }}>
                    {fmt(event.date)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 no-print">
          <h2 className="eyebrow">Another chart</h2>
          <div className="surface-card mt-5 max-w-xl p-6">
            <SavedChartPicker action="/tools/dasha" />
            <BirthForm action="/tools/dasha" submitLabel="Show periods" />
          </div>
        </section>
      </div>
    </div>
  );
}

/** One mahadasha, with its sub-periods opened when it is the running one. */
function MahadashaRow({
  maha,
  isActive,
  activeAntar,
  fmt,
}: {
  maha: DashaPeriod;
  isActive: boolean;
  activeAntar?: DashaPeriod;
  fmt: (d: Date) => string;
}) {
  return (
    <li
      className="border-t py-3"
      style={
        isActive
          ? { borderColor: 'var(--border-strong)', background: 'color-mix(in oklab, var(--color-gold-500) 5%, transparent)' }
          : undefined
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span
          className="font-display text-lg"
          style={{ color: isActive ? 'var(--color-gold-200)' : 'var(--text-primary)' }}
        >
          {maha.lord}
          {isActive && (
            <span className="ml-2 text-[0.65rem] uppercase tracking-[0.14em]" style={{ color: 'var(--color-gold-500)' }}>
              Running
            </span>
          )}
        </span>
        <span className="tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
          {fmt(maha.start)} to {fmt(maha.end)}
        </span>
      </div>

      {/* Sub-periods are shown only for the current mahadasha. Listing all
          eighty one at once is a wall of dates nobody reads. */}
      {isActive && maha.children && (
        <ul className="mt-3 space-y-0.5 pl-4">
          {maha.children.map((antar) => (
            <li
              key={`${antar.lord}-${antar.start.toISOString()}`}
              className="flex items-baseline justify-between gap-2 text-sm"
              style={{ opacity: antar === activeAntar ? 1 : 0.6 }}
            >
              <span style={{ color: antar === activeAntar ? 'var(--color-gold-300)' : 'var(--text-secondary)' }}>
                {maha.lord} / {antar.lord}
              </span>
              <span className="tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
                {fmt(antar.start)} to {fmt(antar.end)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
