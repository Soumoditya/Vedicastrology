import type { Metadata } from 'next';
import Link from 'next/link';

import { buildFullReport } from '@/lib/report/build';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { pagedCss, printCss } from '@/lib/report/pagedCss';
import { resolveTheme, THEME_LIST } from '@/lib/report/themes';
import { getNames } from '@/lib/i18n/server';
import { gateFor } from '@/components/site/FeatureGate';
import { Paginate } from '@/components/report/Paginate';
import { ReportDocument } from '@/components/report/ReportDocument';

export const metadata: Metadata = {
  title: 'Full written report — print',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The report, ready to print.
 *
 * This renders immediately. It used to hand the document to Paged.js first, and
 * that was the wrong default: Paged.js is what makes real page numbers possible,
 * but it fragments forty pages on the main thread before anything appears, it is
 * slow on a modest machine, and on this document it has stalled outright. A
 * button somebody presses to get a PDF cannot begin with a wait of unknown
 * length that sometimes never ends.
 *
 * So the browser paginates by default. Every section still starts on a new page,
 * because that is a plain `break-before: page` and browsers have always honoured
 * it; the art, the themes and the layout are identical. What the browser cannot
 * do is print a page number, since Chrome has never implemented `@page` margin
 * boxes — that is the one thing `?paged=1` still buys, for anyone willing to
 * wait for it.
 *
 * Both modes render the same `ReportDocument`, so nothing can drift between
 * them.
 */
export default async function ReportPrintPage({ searchParams }: { searchParams: SearchParams }) {
  const gate = await gateFor('full_report', '/report');
  if (gate) return gate;

  const params = await searchParams;
  const theme = resolveTheme(params.theme);

  if (!hasBirthQuery(params)) {
    return (
      <Fallback>
        This page needs birth details in its address. Open the report from{' '}
        <Link href="/tools/kundli">your chart</Link> and use the download button
        there.
      </Fallback>
    );
  }

  let parsed;
  try {
    parsed = parseBirthQuery(params);
  } catch {
    return <Fallback>Those birth details were not valid. Please enter them again.</Fallback>;
  }

  const r = buildFullReport(parsed.birth, {
    displayName: parsed.displayName,
    settings: parsed.settings,
  });
  const { n } = await getNames();

  const gender = genderOf(params);
  const auto = params.auto === '1';
  const paged = params.paged === '1';

  // Carry the chart across when switching theme, so comparing four grounds does
  // not mean re-entering the birth details four times.
  const carried = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || key === 'theme' || key === 'auto') continue;
    carried.set(key, Array.isArray(value) ? value[0] : value);
  }

  return (
    <>
      {/*
        The only thing on this route that is not the document. `.no-print` keeps
        it out of the paper, and Paged.js leaves it alone because it sits outside
        the tree handed to the previewer.
      */}
      <div className="print-toolbar no-print">
        <span>Ground:</span>
        {THEME_LIST.map((t) => (
          <Link
            key={t.key}
            href={`/report/print?${carried.toString()}&theme=${t.key}`}
            data-current={t.key === theme.key ? 'true' : undefined}
            title={t.note}
          >
            {t.name}
          </Link>
        ))}
        <span className="print-toolbar-sep" />
        <a href={`/report?${carried.toString()}`}>Back to the readable version</a>
      </div>

      {paged ? (
        <Paginate css={pagedCss(theme, r.displayName ?? 'Vedic Astrologey')} autoPrint={auto}>
          <ReportDocument r={r} n={n} theme={theme} gender={gender} />
        </Paginate>
      ) : (
        <>
          <style>{printCss(theme)}</style>
          <div className="rp-doc">
            <ReportDocument r={r} n={n} theme={theme} gender={gender} />
          </div>
          {auto && <AutoPrint />}
        </>
      )}
    </>
  );
}

/**
 * Opens the print dialogue once the document has painted.
 *
 * Two frames rather than one: the first lets layout settle, the second lets the
 * chart plates paint. Printing before that gives a document with gaps where the
 * charts should be.
 */
function AutoPrint() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          'requestAnimationFrame(function(){requestAnimationFrame(function(){window.print()})})',
      }}
    />
  );
}

function Fallback({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: '34rem', margin: '18vh auto', padding: '0 1.5rem', textAlign: 'center' }}>
      <p style={{ color: '#8c2020', lineHeight: 1.6 }}>{children}</p>
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
