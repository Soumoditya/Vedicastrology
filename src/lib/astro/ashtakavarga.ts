import { RASHI_NAMES_EN } from './constants';
import type { Chart } from './types';
import { signDistance } from './zodiac';

/**
 * Ashtakavarga.
 *
 * Each of the seven grahas plus the ascendant contributes a bindu to certain
 * houses counted from each of eight reference points. Adding those gives the
 * Bhinnashtakavarga for one graha; adding all seven gives the Sarvashtakavarga.
 *
 * The tables below are the standard Parashari ones. They are written out in
 * full rather than derived, because they are arbitrary lists that have to match
 * a text exactly, and a derivation would only hide a transcription error.
 *
 * The system checks itself: the seven Bhinnashtakavarga totals are fixed
 * numbers, and the Sarvashtakavarga always sums to 337. Any error in these
 * tables changes a total, so the tests catch it immediately.
 */

/** The eight reference points each contribution is counted from. */
export const REFERENCE_POINTS = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Ascendant',
] as const;

export type ReferencePoint = (typeof REFERENCE_POINTS)[number];

/**
 * The seven grahas that receive an Ashtakavarga.
 *
 * Rahu and Ketu are excluded deliberately: they have no Ashtakavarga in the
 * Parashari system, so the type narrows rather than carrying empty entries for
 * them.
 */
export const AV_GRAHAS = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn',
] as const;

export type AvGraha = (typeof AV_GRAHAS)[number];

/**
 * Benefic house positions, counted from each reference point.
 *
 * Read as: BINDU_TABLE[graha][referencePoint] = houses, 1 to 12, in which that
 * graha receives a bindu when counted from that reference point.
 */
const BINDU_TABLE: Record<AvGraha, Record<ReferencePoint, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Ascendant: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Ascendant: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Ascendant: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Ascendant: [1, 3, 4, 6, 10, 11],
  },
};

/**
 * The fixed totals for each Bhinnashtakavarga.
 *
 * These are properties of the tables above, not of any chart, so they are the
 * strongest available check that the tables were transcribed correctly.
 */
export const EXPECTED_TOTALS: Record<AvGraha, number> = {
  Sun: 48,
  Moon: 49,
  Mars: 39,
  Mercury: 54,
  Jupiter: 56,
  Venus: 52,
  Saturn: 39,
};

/** The seven totals together, the fixed Sarvashtakavarga sum. */
export const EXPECTED_SARVA_TOTAL = 337;

export interface Bhinnashtakavarga {
  graha: AvGraha;
  /** Bindus per rashi, indexed 0 for Aries through 11 for Pisces. */
  bindus: number[];
  total: number;
}

export interface AshtakavargaResult {
  charts: Bhinnashtakavarga[];
  /** Sarvashtakavarga: bindus per rashi, summed across the seven. */
  sarva: number[];
  sarvaTotal: number;
  /** Signs with unusually high or low support, for quick reading. */
  strongest: { rashi: number; bindus: number }[];
  weakest: { rashi: number; bindus: number }[];
}

/**
 * Compute the Bhinnashtakavarga for one graha.
 *
 * For every reference point, take the rashi that point occupies, then award a
 * bindu to each listed house counted from it.
 */
export function bhinnashtakavarga(chart: Chart, graha: AvGraha): Bhinnashtakavarga {
  const bindus = new Array<number>(12).fill(0);
  const table = BINDU_TABLE[graha];

  for (const point of REFERENCE_POINTS) {
    const rashi =
      point === 'Ascendant'
        ? chart.ascendant.rashi
        : chart.byGraha[point]?.rashi;

    if (rashi === undefined) continue;

    for (const house of table[point]) {
      // House 1 from a reference point is the sign it occupies.
      bindus[(rashi + house - 1) % 12] += 1;
    }
  }

  return {
    graha,
    bindus,
    total: bindus.reduce((sum, b) => sum + b, 0),
  };
}

export function ashtakavarga(chart: Chart): AshtakavargaResult {
  const charts = AV_GRAHAS.map((graha) => bhinnashtakavarga(chart, graha));

  const sarva = new Array<number>(12).fill(0);
  for (const c of charts) {
    for (let rashi = 0; rashi < 12; rashi++) sarva[rashi] += c.bindus[rashi];
  }

  const ranked = sarva
    .map((bindus, rashi) => ({ rashi, bindus }))
    .sort((a, b) => b.bindus - a.bindus);

  return {
    charts,
    sarva,
    sarvaTotal: sarva.reduce((sum, b) => sum + b, 0),
    strongest: ranked.slice(0, 3),
    weakest: ranked.slice(-3).reverse(),
  };
}

/**
 * How a sign's support reads.
 *
 * The average is 337 divided by 12, a little over 28. The conventional bands
 * treat 30 and above as strong and 25 and below as weak.
 */
export function sarvaVerdict(bindus: number): 'strong' | 'average' | 'weak' {
  if (bindus >= 30) return 'strong';
  if (bindus <= 25) return 'weak';
  return 'average';
}

/**
 * Bindus in the sign a transiting graha currently occupies.
 *
 * This is the practical use of the system: the same transit reads very
 * differently over a sign with four bindus than over one with seven.
 */
export function transitSupport(
  result: AshtakavargaResult,
  graha: AvGraha,
  transitRashi: number,
): { bindus: number; verdict: 'strong' | 'average' | 'weak'; rashiName: string } {
  const chart = result.charts.find((c) => c.graha === graha);
  const bindus = chart?.bindus[transitRashi] ?? 0;

  return {
    bindus,
    // For a single graha the scale is 0 to 8, so the bands differ from Sarva.
    verdict: bindus >= 5 ? 'strong' : bindus <= 2 ? 'weak' : 'average',
    rashiName: RASHI_NAMES_EN[transitRashi],
  };
}

export { signDistance };
