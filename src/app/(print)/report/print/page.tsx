import type { Metadata } from 'next';
import Link from 'next/link';

import { buildFullReport } from '@/lib/report/build';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { printCss } from '@/lib/report/pagedCss';
import { resolveTheme, THEME_LIST } from '@/lib/report/themes';
import { getNames } from '@/lib/i18n/server';
import { gateFor } from '@/components/site/FeatureGate';
import { ReportDocument } from '@/components/report/ReportDocument';

export const metadata: Metadata = {
  title: 'Full written report — print',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The report, as the printer sees it.
 *
 * This page is mostly not for people any more. `/api/report/pdf` loads it in
 * headless Chrome and returns the bytes, so this is the document Chrome
 * fragments — nothing here simulates a sheet, because the real page box does
 * that better than any div could.
 *
 * It stays reachable by hand, with a theme switcher, because being able to open
 * the thing the PDF is made from and look at it in a normal tab is what makes a
 * layout bug findable. The switcher carries `no-print`, which now genuinely
 * means "not on paper" rather than "not anywhere" — that rule used to be emitted
 * unscoped and hid this toolbar on every ground.
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
        <Link href="/tools/kundli">your chart</Link> and use the download button there.
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

  const carried = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || key === 'theme') continue;
    carried.set(key, Array.isArray(value) ? value[0] : value);
  }

  return (
    <>
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

      <style>{printCss(theme)}</style>
      <div className="rp-doc rp-root">
        <ReportDocument r={r} n={n} theme={theme} gender={genderOf(params)} />
      </div>
    </>
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
