import { ImageResponse } from 'next/og';

import { SITE } from '@/lib/site';

/**
 * The default share card for the whole site.
 *
 * Pages that describe a specific chart override this with one that draws the
 * chart itself. Everything else, the home page, the journal, consultations,
 * shares this. Without it a link showed a blank grey box, which reads as a dead
 * link and is a poor thing to be posting to an audience on Instagram.
 */
export const alt = `${SITE.name}, classical Jyotish calculated precisely`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0a0a16',
          color: '#f4efe2',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 8, color: '#8c7220' }}>
          {SITE.name.toUpperCase()}
        </div>
        <div style={{ display: 'flex', fontSize: 68, marginTop: 26, maxWidth: 900 }}>
          Classical Jyotish, calculated precisely.
        </div>
        <div style={{ display: 'flex', marginTop: 34, height: 1, background: '#8c7220', width: 260 }} />
        <div style={{ display: 'flex', fontSize: 22, marginTop: 26, color: '#a49e90' }}>
          Charts, panchang, dasha and transits, free to use
        </div>
      </div>
    ),
    { ...size },
  );
}
