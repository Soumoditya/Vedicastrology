import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { castChart, moonRashi } from '@/lib/astro/chart';
import { chartToRenderData } from '@/lib/chart-render/adapt';
import { chartToDataUri } from '@/lib/chart-render/svgString';
import { hasBirthQuery, parseBirthQuery } from '@/lib/astro/query';
import { RASHI_NAMES_EN, NAKSHATRA_NAMES } from '@/lib/astro/constants';
import { SITE } from '@/lib/site';

/**
 * The share card.
 *
 * Every link posted to Instagram, WhatsApp or anywhere else was showing a blank
 * grey box, because the site had no share image of any kind. This draws the
 * actual chart instead: the real diamond, the real ascendant, the real
 * nakshatra.
 *
 * That is deliberately not decorative art. A share card carrying genuine
 * calculated output says what this site is in a way that a stock nebula never
 * could, and it costs nothing to produce because the data is already there.
 *
 * Satori renders only flexbox and a subset of CSS, so the chart arrives as an
 * SVG data URI rather than as elements. That also keeps one geometry shared
 * between the interactive chart, the printed report and this.
 */
export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

const INK = '#0a0a16';
const GOLD = '#c9a227';
const GOLD_SOFT = '#8c7220';
const TEXT = '#f4efe2';
const MUTED = '#a49e90';

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());

  // Without birth details there is nothing to draw, so fall back to the plain
  // brand card rather than failing and leaving the blank box behind.
  if (!hasBirthQuery(params)) return brandCard();

  let parsed;
  try {
    parsed = parseBirthQuery(params);
  } catch {
    return brandCard();
  }

  const chart = castChart(parsed.birth, { settings: parsed.settings });
  const uri = chartToDataUri(chartToRenderData(chart), { size: 460, background: INK });

  const moon = chart.byGraha.Moon;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: INK,
          color: TEXT,
          padding: 56,
          alignItems: 'center',
          gap: 56,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={uri} width={460} height={460} alt="" />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 20, letterSpacing: 6, color: GOLD_SOFT }}>
            {SITE.name.toUpperCase()}
          </div>

          <div style={{ display: 'flex', fontSize: 58, marginTop: 18, color: TEXT }}>
            {parsed.displayName ? `${parsed.displayName}'s chart` : 'Vedic birth chart'}
          </div>

          <div style={{ display: 'flex', fontSize: 24, marginTop: 16, color: MUTED }}>
            {`${RASHI_NAMES_EN[chart.ascendant.rashi]} ascendant`}
          </div>
          <div style={{ display: 'flex', fontSize: 24, marginTop: 6, color: MUTED }}>
            {`Moon in ${RASHI_NAMES_EN[moonRashi(chart)]}, ${NAKSHATRA_NAMES[moon.nakshatra]}`}
          </div>

          <div style={{ display: 'flex', marginTop: 34, height: 1, background: GOLD_SOFT, width: 220 }} />

          <div style={{ display: 'flex', fontSize: 19, marginTop: 22, color: GOLD }}>
            Calculated with the Swiss Ephemeris
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}

/** The card for anything that is not a specific chart. */
function brandCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: INK,
          color: TEXT,
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 8, color: GOLD_SOFT }}>
          {SITE.name.toUpperCase()}
        </div>
        <div style={{ display: 'flex', fontSize: 68, marginTop: 26, maxWidth: 900 }}>
          Classical Jyotish, calculated precisely.
        </div>
        <div style={{ display: 'flex', marginTop: 34, height: 1, background: GOLD_SOFT, width: 260 }} />
        <div style={{ display: 'flex', fontSize: 22, marginTop: 26, color: MUTED }}>
          Charts, panchang, dasha and transits, free to use
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
