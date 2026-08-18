import type { Point } from './geometry';

/**
 * Fitting graha labels inside a house.
 *
 * The bug this exists to kill: every cell used to carry a single anchor *point*
 * and a `capacity` number, and the drawing code stacked labels around that point.
 * A point knows nothing about the shape it sits in, so in a corner triangle a
 * four-graha stack ran out through the diagonal into the next house. In the
 * reported chart, house 9 is the triangle with its apex at (75,75); four labels
 * stacked from y 65 to 79 at x 85, and since a label is about seven units wide,
 * at its left edge the triangle had already narrowed to y 68.5–81.5. Two of the
 * four labels were outside their own house.
 *
 * So the geometry now yields a *box* per cell, and labels are laid out inside
 * that box. Both steps are pure functions here rather than inline in the
 * component, so a test can assert that every label drawn for any number of
 * grahas lies inside its own polygon — which is the property that was silently
 * false before.
 */

/** Ray casting. On-edge counts as inside, which is what we want for a fit test. */
export function pointInPolygon(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const straddles = a.y > p.y !== b.y > p.y;
    if (!straddles) continue;
    const x = ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (p.x < x) inside = !inside;
  }
  return inside;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}

function distanceToBoundary(p: Point, polygon: Point[]): number {
  let best = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    best = Math.min(best, distanceToSegment(p, polygon[j], polygon[i]));
  }
  return best;
}

export interface Box {
  /** Centre of the box. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The largest axis-aligned box of a given aspect that fits inside a polygon.
 *
 * Found by locating the point furthest from any edge — the pole of
 * inaccessibility, approximated on a grid, which is exact enough at this scale
 * and completely deterministic — then growing a box around it by bisection until
 * a corner touches an edge. A triangle's pole is well inside it, which is
 * precisely where a stack of labels wants to be and precisely where the old
 * centroid-ish anchor was not.
 */
/*
  Memoised, because this is not cheap and its inputs never change.

  Finding the pole samples a 25x25 grid and runs a point-in-polygon test at each
  candidate: about 625 tests per cell, so roughly 7,500 for a twelve-cell chart,
  and then a 40-step bisection on top. The geometry is static — the twelve cells of
  the North Indian chart are the same twelve cells on every render — so paying that
  again for every chart, every varga switch and every re-render was pure waste, and
  it showed on the chart page.

  Keyed on the polygon's own coordinates rather than on object identity, so the
  South Indian geometry, which is rebuilt per ascendant, still hits the cache when
  it produces the same shape.
*/
const boxCache = new Map<string, Box>();

export function inscribedBox(polygon: Point[], aspect = 1.5): Box {
  const key = `${aspect}|${polygon.map((p) => `${p.x},${p.y}`).join(';')}`;
  const hit = boxCache.get(key);
  if (hit) return hit;

  const box = computeInscribedBox(polygon, aspect);
  boxCache.set(key, box);
  return box;
}

function computeInscribedBox(polygon: Point[], aspect: number): Box {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  let pole = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  let bestDepth = -1;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const candidate = {
        x: minX + ((maxX - minX) * i) / steps,
        y: minY + ((maxY - minY) * j) / steps,
      };
      if (!pointInPolygon(candidate, polygon)) continue;
      const depth = distanceToBoundary(candidate, polygon);
      if (depth > bestDepth) {
        bestDepth = depth;
        pole = candidate;
      }
    }
  }

  const fits = (halfWidth: number): boolean => {
    const halfHeight = halfWidth / aspect;
    const corners: Point[] = [
      { x: pole.x - halfWidth, y: pole.y - halfHeight },
      { x: pole.x + halfWidth, y: pole.y - halfHeight },
      { x: pole.x + halfWidth, y: pole.y + halfHeight },
      { x: pole.x - halfWidth, y: pole.y + halfHeight },
    ];
    return corners.every((c) => pointInPolygon(c, polygon));
  };

  let low = 0;
  let high = Math.max(maxX - minX, maxY - minY);
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (fits(mid)) low = mid;
    else high = mid;
  }

  return { x: pole.x, y: pole.y, width: low * 2, height: (low / aspect) * 2 };
}

export interface GrahaLayout {
  fontSize: number;
  lineHeight: number;
  columns: number;
  rows: number;
  /** One position per graha, in the order given. */
  positions: Point[];
  /** False once the box is too tight to also carry degrees. */
  withDegrees: boolean;
}

/** Widths as multiples of the font size: a two-letter label, and one with a degree. */
const LABEL_EMS = 1.5;
const LABEL_WITH_DEGREE_EMS = 3.3;

/**
 * Place `count` labels inside `box`, as large as they can legibly be.
 *
 * Tries the largest type first and steps down, and at each size tries one column
 * before two and two before three, so a house with room keeps its labels big and
 * in a single readable column while a stellium quietly compacts instead of
 * spilling. Degrees are the first thing dropped: which sign a graha occupies
 * matters far more than its exact degree when six of them share a house.
 */
export function layoutGrahas(
  box: Box,
  count: number,
  { wantDegrees = false, minFontSize = 2.6, maxFontSize = 4.2 } = {},
): GrahaLayout {
  const sizes: number[] = [];
  for (let f = maxFontSize; f >= minFontSize - 0.001; f -= 0.2) sizes.push(Number(f.toFixed(2)));

  for (const fontSize of sizes) {
    for (const withDegrees of wantDegrees ? [true, false] : [false]) {
      const labelWidth = fontSize * (withDegrees ? LABEL_WITH_DEGREE_EMS : LABEL_EMS);
      const lineHeight = fontSize * 1.25;
      for (const columns of [1, 2, 3]) {
        if (columns > count) continue;
        const rows = Math.ceil(count / columns);
        if (columns * labelWidth > box.width) continue;
        if (rows * lineHeight > box.height) continue;
        return {
          fontSize,
          lineHeight,
          columns,
          rows,
          withDegrees,
          positions: place(box, count, columns, rows, labelWidth, lineHeight),
        };
      }
    }
  }

  // Nothing fits cleanly: use the floor size, three columns, and accept that a
  // house with this many grahas is going to be tight. Still inside the box.
  const fontSize = minFontSize;
  const lineHeight = fontSize * 1.15;
  const columns = Math.min(3, count);
  const rows = Math.ceil(count / columns);
  return {
    fontSize,
    lineHeight,
    columns,
    rows,
    withDegrees: false,
    positions: place(box, count, columns, rows, fontSize * LABEL_EMS, lineHeight),
  };
}

function place(
  box: Box,
  count: number,
  columns: number,
  rows: number,
  labelWidth: number,
  lineHeight: number,
): Point[] {
  const positions: Point[] = [];
  const blockHeight = rows * lineHeight;
  const startY = box.y - blockHeight / 2 + lineHeight / 2;
  const blockWidth = columns * labelWidth;
  const startX = box.x - blockWidth / 2 + labelWidth / 2;

  for (let i = 0; i < count; i++) {
    // Fill column by column, so a two-column house reads down the left side
    // first the way a list normally would.
    const column = Math.floor(i / rows);
    const row = i % rows;
    positions.push({
      x: startX + column * labelWidth,
      y: startY + row * lineHeight,
    });
  }
  return positions;
}
