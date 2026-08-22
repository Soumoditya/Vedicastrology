import { NORTH_INDIAN, polygonToPoints, type ChartRenderData } from './geometry';
import { inscribedBox, layoutGrahas } from './layout';

/**
 * The chart as a standalone SVG string.
 *
 * Separate from the React component on purpose. That one is built for the
 * browser: it reads CSS custom properties, animates, responds to hover and
 * carries interaction handlers. None of that survives outside a page, and all
 * of it is wrong for a share card or a sheet of paper.
 *
 * This produces one self-contained string with literal colours and no
 * dependencies, which is what a social image renderer and a print pipeline can
 * both actually consume. The geometry is shared, so the two cannot drift.
 *
 * Two things changed when the printed report started using this.
 *
 * **Degrees.** This used to drop them unconditionally, with a comment that a
 * share card is looked at for a second at thumbnail size and squeezing in more
 * only makes it illegible. That reasoning is still right — for a share card.
 * A 120mm plate on paper is not a thumbnail, and a birth chart without degrees
 * is missing the thing a reader checks first. So it is now an option, off by
 * default, and the card path is unchanged.
 *
 * **Layout.** The label stacking here was hand-rolled and knew nothing about the
 * shape of the cell it was filling, which is the exact bug `layoutGrahas` was
 * written to kill in the React renderer: a point knows nothing about the polygon
 * around it, so four grahas in a corner triangle ran out through the diagonal
 * into the next house. This now calls the same two pure functions, so there is
 * one layout implementation instead of two that disagree, and the containment
 * property is covered for both.
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

/**
 * The colours a chart is drawn in.
 *
 * Hard-coded gold-on-midnight works for a share card and for the report's night
 * theme, and is unreadable on ivory. The printed report offers four grounds, so
 * the plate has to be told which one it is sitting on rather than assuming.
 */
export interface ChartPalette {
  /** Behind the plate. */
  background: string;
  /** The frame lines. */
  rule: string;
  /** The rashi numeral of the ascendant house. */
  accent: string;
  /** Every other rashi numeral. */
  numeral: string;
  /** Graha labels, where no functional-nature colour applies. */
  ink: string;
  /** Degrees and the retrograde mark, set quieter than the graha. */
  inkSoft: string;
  /** Per functional nature. Omitted falls back to `ink`. */
  nature?: Record<string, string>;
}

const NIGHT: ChartPalette = {
  background: INK,
  rule: GOLD,
  accent: GOLD,
  numeral: GOLD_SOFT,
  ink: TEXT,
  inkSoft: '#b9b0a0',
  nature: NATURE_COLOUR,
};

export interface ChartSvgOptions {
  size?: number;
  /** Shorthand for `palette.background`, kept for the existing card callers. */
  background?: string;
  palette?: ChartPalette;
  /**
   * Draw each graha's degree within its sign.
   *
   * Off by default: the social card cannot carry them legibly. `layoutGrahas`
   * drops them by itself in a crowded house even when this is on, so asking for
   * degrees is a preference rather than a guarantee.
   */
  showDegrees?: boolean;
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function chartToSvgString(
  data: ChartRenderData,
  { size = 600, background, palette, showDegrees = false }: ChartSvgOptions = {},
): string {
  const p: ChartPalette = {
    ...(palette ?? NIGHT),
    ...(background ? { background } : {}),
  };

  const geometry = NORTH_INDIAN;
  const byHouse = new Map(data.houses.map((h) => [h.house, h]));

  const frame = geometry.frame
    .map(
      (line) =>
        `<line x1="${line.from.x}" y1="${line.from.y}" x2="${line.to.x}" y2="${line.to.y}" ` +
        `stroke="${p.rule}" stroke-width="0.55" stroke-linecap="round" opacity="0.9"/>`,
    )
    .join('');

  const cells = geometry.cells
    .map((cell) => {
      const house = byHouse.get(cell.house);
      if (!house) return '';

      const isAscendant = cell.house === 1;

      const numeral =
        `<text x="${cell.numberAt.x}" y="${cell.numberAt.y}" text-anchor="middle" ` +
        `dominant-baseline="central" font-size="4.6" fill="${isAscendant ? p.accent : p.numeral}" ` +
        `opacity="${isAscendant ? 1 : 0.8}">${house.rashi + 1}</text>`;

      const grahas = house.grahas;
      if (grahas.length === 0) return numeral;

      /*
        The same fitting the React chart uses. `inscribedBox` finds the largest
        box that actually sits inside this cell's polygon — which for a corner
        triangle is nowhere near its centroid — and `layoutGrahas` fills it,
        stepping the type down, adding a column, and dropping degrees before it
        will let a label escape the cell.
      */
      const box = inscribedBox(cell.polygon);
      const layout = layoutGrahas(box, grahas.length, { wantDegrees: showDegrees });
      const { fontSize, withDegrees } = layout;

      const labels = grahas
        .map((g, i) => {
          const at = layout.positions[i];
          const colour = (g.nature && p.nature?.[g.nature]) || p.ink;

          const retro = g.retrograde
            ? `<tspan font-size="${(fontSize * 0.65).toFixed(2)}" ` +
              `dy="${(-fontSize * 0.3).toFixed(2)}" fill="${p.inkSoft}">℞</tspan>`
            : '';

          const degree =
            withDegrees && g.degree !== undefined
              ? `<tspan font-size="${(fontSize * 0.72).toFixed(2)}" ` +
                `dy="${g.retrograde ? (fontSize * 0.3).toFixed(2) : 0}" dx="0.6" ` +
                `fill="${p.inkSoft}">${Math.floor(g.degree)}°</tspan>`
              : '';

          return (
            `<text x="${at.x.toFixed(2)}" y="${at.y.toFixed(2)}" ` +
            `text-anchor="middle" dominant-baseline="central" ` +
            `font-size="${fontSize.toFixed(2)}" fill="${colour}">` +
            `${escape(g.abbr)}${retro}${degree}</text>`
          );
        })
        .join('');

      return numeral + labels;
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="-3 -3 106 106">` +
    `<rect x="-3" y="-3" width="106" height="106" fill="${p.background}"/>` +
    `${frame}${cells}` +
    // The ascendant tick, the one mark that says which way up the chart reads.
    `<path d="M 50 2.5 L 52 6 L 48 6 Z" fill="${p.accent}"/>` +
    `</svg>`
  );
}

/** A data URI, which is how a social image renderer and an `<img>` consume it. */
export function chartToDataUri(data: ChartRenderData, options?: ChartSvgOptions): string {
  const svg = chartToSvgString(data, options);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export { polygonToPoints, NIGHT as NIGHT_PALETTE };
