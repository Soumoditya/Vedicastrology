import { NORTH_INDIAN, polygonToPoints, type ChartRenderData } from './geometry';

/**
 * The chart as a standalone SVG string.
 *
 * Separate from the React component on purpose. That one is built for the
 * browser: it reads CSS custom properties, animates, responds to hover and
 * carries interaction handlers. None of that survives outside a page, and all
 * of it is wrong for a share card.
 *
 * This produces one self-contained string with literal colours and no
 * dependencies, which is what a social image renderer and a print pipeline can
 * both actually consume. The geometry is shared, so the two cannot drift.
 */

const INK = '#0a0a16';
const GOLD = '#c9a227';
const GOLD_SOFT = '#8c7220';
const TEXT = '#f4efe2';

const NATURE_COLOUR: Record<string, string> = {
  benefic: '#4ba97a',
  malefic: '#c8544f',
  neutral: '#cfc7b4',
};

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function chartToSvgString(
  data: ChartRenderData,
  { size = 600, background = INK }: { size?: number; background?: string } = {},
): string {
  const geometry = NORTH_INDIAN;
  const byHouse = new Map(data.houses.map((h) => [h.house, h]));

  const frame = geometry.frame
    .map(
      (line) =>
        `<line x1="${line.from.x}" y1="${line.from.y}" x2="${line.to.x}" y2="${line.to.y}" ` +
        `stroke="${GOLD}" stroke-width="0.55" stroke-linecap="round" opacity="0.9"/>`,
    )
    .join('');

  const cells = geometry.cells
    .map((cell) => {
      const house = byHouse.get(cell.house);
      if (!house) return '';

      const isAscendant = cell.house === 1;

      const numeral =
        `<text x="${cell.numberAt.x}" y="${cell.numberAt.y}" text-anchor="middle" ` +
        `dominant-baseline="central" font-size="4.6" fill="${isAscendant ? GOLD : GOLD_SOFT}" ` +
        `opacity="${isAscendant ? 1 : 0.8}">${house.rashi + 1}</text>`;

      /*
        Degrees are dropped entirely here. A share card is looked at for a
        second at thumbnail size, so the sign a graha occupies is the most that
        can register, and squeezing in more only makes the whole thing illegible.
      */
      const grahas = house.grahas;
      const lineHeight = grahas.length > 3 ? 4 : 4.6;
      const fontSize = grahas.length > 3 ? 3.2 : 3.9;
      const startY = cell.contentAt.y - ((grahas.length - 1) * lineHeight) / 2;

      const labels = grahas
        .map(
          (g, i) =>
            `<text x="${cell.contentAt.x}" y="${startY + i * lineHeight}" ` +
            `text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" ` +
            `fill="${(g.nature && NATURE_COLOUR[g.nature]) || TEXT}">${escape(g.abbr)}</text>`,
        )
        .join('');

      return numeral + labels;
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="-3 -3 106 106">` +
    `<rect x="-3" y="-3" width="106" height="106" fill="${background}"/>` +
    `${frame}${cells}` +
    // The ascendant tick, the one mark that says which way up the chart reads.
    `<path d="M 50 2.5 L 52 6 L 48 6 Z" fill="${GOLD}"/>` +
    `</svg>`
  );
}

/** A data URI, which is how a social image renderer consumes it. */
export function chartToDataUri(
  data: ChartRenderData,
  options?: { size?: number; background?: string },
): string {
  const svg = chartToSvgString(data, options);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export { polygonToPoints };
