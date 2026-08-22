import type { Metadata } from 'next';
import Link from 'next/link';

import { buildFullReport } from '@/lib/report/build';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { redirectToSavedChart } from '@/lib/astro/current-chart';
import { screenCss } from '@/lib/report/pagedCss';
import { resolveTheme, THEME_LIST } from '@/lib/report/themes';
import { getNames } from '@/lib/i18n/server';
import { gateFor } from '@/components/site/FeatureGate';
import { JourneyRail } from '@/components/chart/JourneyRail';
import { ToolIntro } from '@/components/chart/ToolIntro';
import { ReportDocument } from '@/components/report/ReportDocument';

export const metadata: Metadata = {
  title: 'Full written report',
  description:
    'Everything about a chart in one document: birth details, panchang, ' +
    'Avakhada Chakra, your lagna, rashi and nakshatra read in full, D1, D9 and ' +
    'D10, yogas, doshas, dasha, gochara, Sade Sati, Ashtakavarga, twelve areas ' +
    'of life, and remedies.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The report, to read.
 *
 * This renders the same `ReportDocument` the print route does, so the thing
 * somebody reads and the thing they print cannot drift — which the old pair had
 * already begun to, the screen and print versions of the covers disagreeing
 * about their own height.
 *
 * What it deliberately does *not* do is paginate. Fragmenting forty-odd pages
 * costs a second or two of main-thread work, which is a fine price for a
 * document somebody asked to print and a poor one for a page they only wanted
 * to scroll. That happens on `/report/print`, behind the download button.
 */
export default async function ReportPage({ searchParams }: { searchParams: SearchParams }) {
  const gate = await gateFor('full_report', '/report');
  if (gate) return gate;

  const params = await searchParams;

  // A signed-in visitor with a saved default chart should never be shown a
  // blank form. `?new=1` is the way to one deliberately.
  await redirectToSavedChart(params, '/report');

  if (!hasBirthQuery(params)) {
    return (
      <ToolIntro
        eyebrow="Sampūrṇa Phala"
        headline="The whole chart,"
        highlight="in one document."
        action="/report"
        submitLabel="Build my report"
      >
        <p>
          Around forty pages, numbered, with a contents page that knows what page
          everything landed on. Birth details and the times a traditional kundli
          opens with, the panchang of your birth, the Avakhada Chakra, your
          ascendant, moon sign and birth star each read in full, the D1, D9 and
          D10 charts with a reading apiece, every yoga and dosha the chart forms,
          the whole Vimshottari dasha, today&rsquo;s transits drawn twice and
          read, Sade Sati, Ashtakavarga, twelve areas of life, and every graha
          with what helps it.
        </p>
        <p>
          Four grounds to choose from, three of them on paper rather than on a
          night sky. Made to be printed or saved as a PDF.
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

  const r = buildFullReport(parsed.birth, {
    displayName: parsed.displayName,
    settings: parsed.settings,
  });

  // Names in the reader's own script. The prose around them is still English
  // for now; the vocabulary is what fills a page, so it goes first.
  const { n } = await getNames();

  const theme = resolveTheme(params.theme);

  const carried = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || key === 'theme') continue;
    carried.set(key, Array.isArray(value) ? value[0] : value);
  }
  const query = carried.toString();

  return (
    <div className="mx-auto max-w-5xl px-5 pt-10 pb-16 sm:pt-12 sm:pb-24">
      <JourneyRail current="full_report" params={params} />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Sampūrṇa Phala</p>
          <h1 className="font-display mt-2 text-3xl" style={{ color: 'var(--text-primary)' }}>
            {r.displayName ? `${r.displayName}’s full report` : 'Your full report'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Read it here, or open the paginated version to print or save it.
          </p>
        </div>

        <Link
          href={`/report/print?${query}&theme=${theme.key}&auto=1`}
          className="rounded-full px-5 py-2.5 text-sm font-medium"
          style={{
            background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
            color: '#150e00',
          }}
        >
          Download as PDF
        </Link>
      </div>

      {/*
        Four grounds, switchable. Asked for as a set to compare rather than a
        single choice, so the switch carries the chart with it — comparing four
        does not mean entering the birth details four times.
      */}
      <div className="mb-10 flex flex-wrap items-center gap-2 text-xs">
        <span style={{ color: 'var(--text-muted)' }}>Ground:</span>
        {THEME_LIST.map((t) => (
          <Link
            key={t.key}
            href={`/report?${query}&theme=${t.key}`}
            title={t.note}
            className="rounded-full border px-3 py-1.5 transition-colors duration-300"
            style={{
              borderColor: t.key === theme.key ? 'var(--color-gold-500)' : 'var(--border-subtle)',
              background:
                t.key === theme.key
                  ? 'color-mix(in oklab, var(--color-gold-500) 14%, transparent)'
                  : 'transparent',
              color: t.key === theme.key ? 'var(--color-gold-200)' : 'var(--text-secondary)',
            }}
          >
            {t.name}
          </Link>
        ))}
        <Link
          href={`/report/print?${query}&theme=${theme.key}`}
          className="ml-auto"
          style={{ color: 'var(--color-gold-400)' }}
        >
          See it as pages →
        </Link>
      </div>

      {/*
        The document's own stylesheet, scoped to this wrapper so an ivory report
        does not repaint the site's dark chrome around it. Derived from the paged
        sheet rather than restated, so the two cannot disagree.
      */}
      <style>{screenCss(theme)}</style>

      <div
        className="rp-screen"
        style={{
          padding: '2.5rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <ReportDocument r={r} n={n} theme={theme} gender={genderOf(params)} />
      </div>
    </div>
  );
}

/**
 * Gender comes straight from the query rather than from the parsed chart,
 * because it plays no part in casting one and so is deliberately not carried on
 * `ParsedBirthQuery`. It is printed only because a traditional kundli prints it.
 */
function genderOf(params: Record<string, string | string[] | undefined>): string {
  const raw = params.gender;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return 'Not given';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
