import type { Metadata } from 'next';

import { castChart } from '@/lib/astro/chart';
import {
  NAKSHATRA_DEITY,
  NAKSHATRA_GANA,
  NAKSHATRA_LORD,
  NAKSHATRA_NADI,
  NAKSHATRA_NAMES,
  NAKSHATRA_SYMBOL,
  NAKSHATRA_YONI,
  RASHI_NAMES_EN,
} from '@/lib/astro/constants';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { formatDms, NAKSHATRA_SPAN } from '@/lib/astro/zodiac';
import { BirthForm } from '@/components/forms/BirthForm';
import { gateFor } from '@/components/site/FeatureGate';
import { ToolSwitcher } from '@/components/chart/ToolSwitcher';
import { PrintButton } from '@/components/chart/PrintButton';
import { SavedChartPicker } from '@/components/chart/SavedChartPicker';
import { Reveal } from '@/components/motion/Reveal';

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
    title: 'Nakshatra Finder',
    description:
      'Your birth star, its pada, ruling graha, deity and symbol, with what the ' +
      'classical texts record about it.',
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

export default async function NakshatraPage({ searchParams }: { searchParams: SearchParams }) {
  // Checked before any work: a page about to refuse should not cast a chart.
  const gate = await gateFor('nakshatra', '/tools/nakshatra');
  if (gate) return gate;

  const params = await searchParams;

  if (!hasBirthQuery(params)) {
    return (
      <div className="relative">
        <Reveal />
        <div className="starfield" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-5 py-20 sm:py-28">
          <p className="eyebrow" data-reveal>Nakṣatra</p>
          <h1
            className="font-display mt-6 text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02]"
            style={{ color: 'var(--text-primary)' }}
            data-reveal
          >
            Your birth star.
          </h1>
          <p className="mt-7 text-[1.0625rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }} data-reveal>
            The twenty seven nakshatras divide the zodiac more finely than the
            twelve rashis, and Indian tradition leans on them far more heavily.
            Yours is wherever the Moon stood at your birth.
          </p>
          <div className="surface-card mt-10 p-6 sm:p-8" data-reveal="scale">
            <SavedChartPicker action="/tools/nakshatra" />
            <BirthForm action="/tools/nakshatra" submitLabel="Find my nakshatra" />
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
  const moon = chart.byGraha.Moon;
  const n = moon.nakshatra;

  // Where within the nakshatra the Moon fell, which decides the pada.
  const start = n * NAKSHATRA_SPAN;
  const into = moon.longitude - start;

  return (
    <div className="relative">
      <Reveal />
      <div className="starfield" aria-hidden />

      <div className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <ToolSwitcher current="nakshatra" params={params} />
        <div className="mb-8 flex justify-end"><PrintButton /></div>
        <p className="eyebrow" data-reveal>Nakṣatra</p>
        <h1
          className="font-display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.02]"
          style={{ color: 'var(--text-primary)' }}
          data-reveal
        >
          <span className="text-gold-leaf">{NAKSHATRA_NAMES[n]}</span>
        </h1>
        <p className="mt-3 text-base" style={{ color: 'var(--text-secondary)' }}>
          Pada {moon.pada} · ruled by {NAKSHATRA_LORD[n]} · Moon in{' '}
          {RASHI_NAMES_EN[moon.rashi]} {formatDms(moon.degreeInRashi, false)}
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2" data-reveal>
          <Fact label="Ruling graha" value={NAKSHATRA_LORD[n]} note="Opens your Vimshottari dasha sequence" />
          <Fact label="Deity" value={NAKSHATRA_DEITY[n]} />
          <Fact label="Symbol" value={NAKSHATRA_SYMBOL[n]} />
          <Fact label="Yoni" value={NAKSHATRA_YONI[n]} note="Used in compatibility matching" />
          <Fact label="Gana" value={NAKSHATRA_GANA[n]} note="Temperament grouping" />
          <Fact label="Nadi" value={NAKSHATRA_NADI[n]} note="Constitution, the heaviest koot in matching" />
        </div>

        <section className="surface-card mt-10 p-6" data-reveal>
          <h2 className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
            Where exactly the Moon fell
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Each nakshatra spans 13°20′ and divides into four padas of 3°20′.
            Your Moon stood {formatDms(into, true)} into {NAKSHATRA_NAMES[n]},
            which places it in pada {moon.pada}.
          </p>

          {/* The four padas, with the Moon's position marked. */}
          <div className="mt-5 flex gap-1">
            {[1, 2, 3, 4].map((pada) => (
              <div key={pada} className="flex-1">
                <div
                  className="h-2 rounded-full"
                  style={{
                    background:
                      pada === moon.pada
                        ? 'linear-gradient(90deg, var(--color-gold-500), var(--color-gold-300))'
                        : 'var(--border-subtle)',
                  }}
                />
                <p
                  className="mt-1.5 text-center text-xs"
                  style={{
                    color: pada === moon.pada ? 'var(--color-gold-300)' : 'var(--text-muted)',
                  }}
                >
                  {pada}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            The pada matters more than it looks. It sets the navamsa sign, which
            is read alongside the birth chart for marriage and for the underlying
            strength of every graha.
          </p>
        </section>

        <section className="mt-12 no-print">
          <h2 className="eyebrow">Another chart</h2>
          <div className="surface-card mt-5 p-6">
            <SavedChartPicker action="/tools/nakshatra" />
            <BirthForm action="/tools/nakshatra" submitLabel="Find nakshatra" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-[0.65rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-gold-600)' }}>
        {label}
      </p>
      <p className="font-display mt-1.5 text-xl" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {note && (
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {note}
        </p>
      )}
    </div>
  );
}
