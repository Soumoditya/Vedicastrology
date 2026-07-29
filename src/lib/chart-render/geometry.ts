import type { AnyGraha } from '../astro/constants';
import type { Dignity } from '../astro/types';

/**
 * Chart rendering is kept separate from chart *calculation* so that the same
 * component can draw a natal chart, any divisional chart, or a transit chart, * and so a second visual style (South Indian) can be added by supplying another
 * geometry, with no change to the drawing code.
 */

export interface RenderGraha {
  graha: AnyGraha;
  /** Two-letter label drawn in the cell. */
  abbr: string;
  /** Degrees within the sign. Omitted in vargas, where degree has no meaning. */
  degree?: number;
  retrograde?: boolean;
  combust?: boolean;
  dignity?: Dignity;
  /** Drives the colour: benefics read green, malefics red, the rest neutral. */
  nature?: 'benefic' | 'malefic' | 'neutral';
}

export interface RenderHouse {
  /** 1–12, counted from the ascendant. */
  house: number;
  /** 0–11, Aries first. This is the numeral written in the cell. */
  rashi: number;
  grahas: RenderGraha[];
}

export interface ChartRenderData {
  ascendantRashi: number;
  houses: RenderHouse[];
  /** Shown above the chart, e.g. "Rashi (D1)" or "Navamsa (D9)". */
  title?: string;
  subtitle?: string;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface HouseCell {
  house: number;
  /** Polygon outlining the cell, in viewBox units. */
  polygon: Point[];
  /** Where the rashi numeral is drawn. */
  numberAt: Point;
  /** Centre of the stack of graha labels. */
  contentAt: Point;
  /**
   * Roughly how many graha labels fit before the text runs out of cell.
   * Used to switch to a compact two-column layout in crowded houses.
   */
  capacity: number;
}

export interface ChartGeometry {
  id: 'north-indian' | 'south-indian';
  name: string;
  /** Square viewBox side length. */
  size: number;
  /** Lines making up the chart frame, drawn in order. */
  frame: { from: Point; to: Point }[];
  cells: HouseCell[];
}

const S = 100;
const H = S / 2;
const Q = S / 4;
const T = (S * 3) / 4;

/** Centroid of a polygon's vertices, adequate for these convex cells. */
function centroid(points: Point[]): Point {
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return { x, y };
}

/**
 * The North Indian (diamond / bhava chakra) chart.
 *
 * The frame is a square crossed by both diagonals and by the four lines
 * joining the midpoints of adjacent sides. That produces twelve cells: four
 * rhombi at the centre of each edge (houses 1, 4, 7, 10) and eight triangles
 * in the corners.
 *
 * House positions are *fixed*, house 1 is always the top-centre rhombus. It
 * is the rashi numeral inside each cell that changes from chart to chart. This
 * is the defining property of the North Indian style and the thing most often
 * got wrong by treating it like the South Indian chart, where signs are fixed
 * and houses move.
 */
export const NORTH_INDIAN: ChartGeometry = {
  id: 'north-indian',
  name: 'North Indian',
  size: S,

  frame: [
    // Outer square.
    { from: { x: 0, y: 0 }, to: { x: S, y: 0 } },
    { from: { x: S, y: 0 }, to: { x: S, y: S } },
    { from: { x: S, y: S }, to: { x: 0, y: S } },
    { from: { x: 0, y: S }, to: { x: 0, y: 0 } },
    // Diagonals.
    { from: { x: 0, y: 0 }, to: { x: S, y: S } },
    { from: { x: S, y: 0 }, to: { x: 0, y: S } },
    // The inner diamond, joining the midpoints of adjacent sides.
    { from: { x: H, y: 0 }, to: { x: 0, y: H } },
    { from: { x: 0, y: H }, to: { x: H, y: S } },
    { from: { x: H, y: S }, to: { x: S, y: H } },
    { from: { x: S, y: H }, to: { x: H, y: 0 } },
  ],

  cells: [
    // House 1, top-centre rhombus.
    {
      house: 1,
      polygon: [{ x: Q, y: Q }, { x: H, y: 0 }, { x: T, y: Q }, { x: H, y: H }],
      numberAt: { x: H, y: 42 },
      contentAt: { x: H, y: 20 },
      capacity: 4,
    },
    // House 2, top-left triangle.
    {
      house: 2,
      polygon: [{ x: 0, y: 0 }, { x: H, y: 0 }, { x: Q, y: Q }],
      numberAt: { x: 14, y: 5 },
      contentAt: { x: 27, y: 15 },
      capacity: 3,
    },
    // House 3, upper-left triangle.
    {
      house: 3,
      polygon: [{ x: 0, y: 0 }, { x: Q, y: Q }, { x: 0, y: H }],
      numberAt: { x: 5, y: 14 },
      contentAt: { x: 15, y: 28 },
      capacity: 4,
    },
    // House 4, left-centre rhombus.
    {
      house: 4,
      polygon: [{ x: 0, y: H }, { x: Q, y: Q }, { x: H, y: H }, { x: Q, y: T }],
      numberAt: { x: 42, y: H },
      contentAt: { x: 20, y: H },
      capacity: 4,
    },
    // House 5, lower-left triangle.
    {
      house: 5,
      polygon: [{ x: 0, y: H }, { x: Q, y: T }, { x: 0, y: S }],
      numberAt: { x: 5, y: 86 },
      contentAt: { x: 15, y: 72 },
      capacity: 4,
    },
    // House 6, bottom-left triangle.
    {
      house: 6,
      polygon: [{ x: 0, y: S }, { x: Q, y: T }, { x: H, y: S }],
      numberAt: { x: 14, y: 95 },
      contentAt: { x: 27, y: 85 },
      capacity: 3,
    },
    // House 7, bottom-centre rhombus.
    {
      house: 7,
      polygon: [{ x: H, y: S }, { x: Q, y: T }, { x: H, y: H }, { x: T, y: T }],
      numberAt: { x: H, y: 58 },
      contentAt: { x: H, y: 80 },
      capacity: 4,
    },
    // House 8, bottom-right triangle.
    {
      house: 8,
      polygon: [{ x: H, y: S }, { x: T, y: T }, { x: S, y: S }],
      numberAt: { x: 86, y: 95 },
      contentAt: { x: 73, y: 85 },
      capacity: 3,
    },
    // House 9, lower-right triangle.
    {
      house: 9,
      polygon: [{ x: S, y: S }, { x: T, y: T }, { x: S, y: H }],
      numberAt: { x: 95, y: 86 },
      contentAt: { x: 85, y: 72 },
      capacity: 4,
    },
    // House 10, right-centre rhombus.
    {
      house: 10,
      polygon: [{ x: S, y: H }, { x: T, y: T }, { x: H, y: H }, { x: T, y: Q }],
      numberAt: { x: 58, y: H },
      contentAt: { x: 80, y: H },
      capacity: 4,
    },
    // House 11, upper-right triangle.
    {
      house: 11,
      polygon: [{ x: S, y: H }, { x: T, y: Q }, { x: S, y: 0 }],
      numberAt: { x: 95, y: 14 },
      contentAt: { x: 85, y: 28 },
      capacity: 4,
    },
    // House 12, top-right triangle.
    {
      house: 12,
      polygon: [{ x: S, y: 0 }, { x: T, y: Q }, { x: H, y: 0 }],
      numberAt: { x: 86, y: 5 },
      contentAt: { x: 73, y: 15 },
      capacity: 3,
    },
  ],
};

/**
 * The South Indian (fixed-sign) chart.
 *
 * Here the *signs* occupy fixed cells in a four-by-four ring and the houses
 * move, which is the exact inverse of the North Indian arrangement. Aries sits
 * second from the left on the top row and the order runs clockwise.
 *
 * The geometry is defined now so the renderer can be switched without any
 * change to the drawing code; the UI for it is enabled in a later phase.
 */
const CELL = S / 4;

/** Grid position of each rashi in the South Indian layout, Aries first. */
const SOUTH_INDIAN_GRID: [number, number][] = [
  [1, 0], [2, 0], [3, 0], // Aries, Taurus, Gemini
  [3, 1], [3, 2], [3, 3], // Cancer, Leo, Virgo
  [2, 3], [1, 3], [0, 3], // Libra, Scorpio, Sagittarius
  [0, 2], [0, 1], [0, 0], // Capricorn, Aquarius, Pisces
];

export function southIndianGeometry(ascendantRashi: number): ChartGeometry {
  const cells: HouseCell[] = SOUTH_INDIAN_GRID.map(([col, row], rashi) => {
    const x = col * CELL;
    const y = row * CELL;
    const polygon = [
      { x, y },
      { x: x + CELL, y },
      { x: x + CELL, y: y + CELL },
      { x, y: y + CELL },
    ];
    return {
      // Houses are counted from whichever cell holds the ascendant.
      house: ((rashi - ascendantRashi + 12) % 12) + 1,
      polygon,
      numberAt: { x: x + 4, y: y + 6 },
      contentAt: centroid(polygon),
      capacity: 5,
    };
  });

  // The twelve signs form a ring; the middle two-by-two block stays open and
  // carries the chart's title. So the dividers are drawn only across the ring,
  // never through the centre.
  const frame: { from: Point; to: Point }[] = [
    // Outer square.
    { from: { x: 0, y: 0 }, to: { x: S, y: 0 } },
    { from: { x: S, y: 0 }, to: { x: S, y: S } },
    { from: { x: S, y: S }, to: { x: 0, y: S } },
    { from: { x: 0, y: S }, to: { x: 0, y: 0 } },
    // Inner square bounding the open centre.
    { from: { x: CELL, y: CELL }, to: { x: 3 * CELL, y: CELL } },
    { from: { x: 3 * CELL, y: CELL }, to: { x: 3 * CELL, y: 3 * CELL } },
    { from: { x: 3 * CELL, y: 3 * CELL }, to: { x: CELL, y: 3 * CELL } },
    { from: { x: CELL, y: 3 * CELL }, to: { x: CELL, y: CELL } },
  ];

  for (let i = 1; i <= 3; i++) {
    const at = i * CELL;
    // Dividers across the top and bottom rows.
    frame.push({ from: { x: at, y: 0 }, to: { x: at, y: CELL } });
    frame.push({ from: { x: at, y: 3 * CELL }, to: { x: at, y: S } });
    // Dividers across the left and right columns.
    frame.push({ from: { x: 0, y: at }, to: { x: CELL, y: at } });
    frame.push({ from: { x: 3 * CELL, y: at }, to: { x: S, y: at } });
  }

  return { id: 'south-indian', name: 'South Indian', size: S, frame, cells };
}

export function polygonToPoints(polygon: Point[]): string {
  return polygon.map((p) => `${p.x},${p.y}`).join(' ');
}
