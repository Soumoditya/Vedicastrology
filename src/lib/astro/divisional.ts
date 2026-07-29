import { RASHI_QUALITY, type AnyGraha } from './constants';
import type { Chart, VargaChart, VargaCode } from './types';
import { norm360 } from './ephemeris';
import { signDistance } from './zodiac';

/**
 * Vargas (divisional charts).
 *
 * Every varga divides each sign into N parts and maps each part onto a sign.
 * What differs between them is only *where the count begins* — and that starting
 * rule is exactly what generic implementations get wrong, because several vargas
 * key it off the sign's movable/fixed/dual quality or its odd/even parity rather
 * than the sign itself.
 *
 * The rules below follow Brihat Parashara Hora Shastra, chapter 6.
 */

export interface VargaDefinition {
  code: VargaCode;
  name: string;
  divisions: number;
  signification: string;
  /** Sign the count starts from, for a body at `rashi` with `degreeInRashi`. */
  startSign: (rashi: number, degreeInRashi: number) => number;
  /** Overrides the equal-division rule entirely (D30 alone needs this). */
  custom?: (rashi: number, degreeInRashi: number) => number;
}

const isOdd = (rashi: number) => rashi % 2 === 0; // Aries is index 0 but is the 1st (odd) sign
const quality = (rashi: number) => RASHI_QUALITY[rashi];

/** Movable → Aries, Fixed → Leo, Dual → Sagittarius (and rotations thereof). */
function byQuality(rashi: number, movable: number, fixed: number, dual: number): number {
  const q = quality(rashi);
  if (q === 'Chara') return movable;
  if (q === 'Sthira') return fixed;
  return dual;
}

export const VARGAS: Record<VargaCode, VargaDefinition> = {
  D1: {
    code: 'D1',
    name: 'Rashi',
    divisions: 1,
    signification: 'The physical body and the life as a whole',
    startSign: (rashi) => rashi,
  },

  D2: {
    code: 'D2',
    name: 'Hora',
    divisions: 2,
    signification: 'Wealth and the capacity to sustain oneself',
    // Odd signs: first half Leo (Sun), second half Cancer (Moon). Even reversed.
    custom: (rashi, deg) => {
      const firstHalf = deg < 15;
      return isOdd(rashi) ? (firstHalf ? 4 : 3) : firstHalf ? 3 : 4;
    },
    startSign: (rashi) => rashi,
  },

  D3: {
    code: 'D3',
    name: 'Drekkana',
    divisions: 3,
    signification: 'Siblings, courage and initiative',
    // 1st third the sign itself, 2nd the 5th from it, 3rd the 9th from it.
    startSign: (rashi) => rashi,
    custom: (rashi, deg) => {
      const part = Math.floor(deg / 10);
      return (rashi + part * 4) % 12;
    },
  },

  D4: {
    code: 'D4',
    name: 'Chaturthamsa',
    divisions: 4,
    signification: 'Home, property, land and inner contentment',
    // Counted in kendras from the sign itself.
    startSign: (rashi) => rashi,
    custom: (rashi, deg) => {
      const part = Math.floor(deg / 7.5);
      return (rashi + part * 3) % 12;
    },
  },

  D7: {
    code: 'D7',
    name: 'Saptamsa',
    divisions: 7,
    signification: 'Children and progeny',
    // Odd signs start from themselves, even signs from the 7th.
    startSign: (rashi) => (isOdd(rashi) ? rashi : (rashi + 6) % 12),
  },

  D9: {
    code: 'D9',
    name: 'Navamsa',
    divisions: 9,
    signification:
      'Marriage, dharma and the inner strength of every graha — the most important varga after the rashi',
    // Movable from itself, fixed from the 9th, dual from the 5th.
    startSign: (rashi) => byQuality(rashi, rashi, (rashi + 8) % 12, (rashi + 4) % 12),
  },

  D10: {
    code: 'D10',
    name: 'Dasamsa',
    divisions: 10,
    signification: 'Career, profession and standing in the world',
    // Odd signs start from themselves, even signs from the 9th.
    startSign: (rashi) => (isOdd(rashi) ? rashi : (rashi + 8) % 12),
  },

  D12: {
    code: 'D12',
    name: 'Dwadasamsa',
    divisions: 12,
    signification: 'Parents and ancestry',
    startSign: (rashi) => rashi,
  },

  D16: {
    code: 'D16',
    name: 'Shodasamsa',
    divisions: 16,
    signification: 'Vehicles, comforts and pleasures',
    startSign: (rashi) => byQuality(rashi, 0, 4, 8),
  },

  D20: {
    code: 'D20',
    name: 'Vimsamsa',
    divisions: 20,
    signification: 'Spiritual practice and devotion',
    startSign: (rashi) => byQuality(rashi, 0, 8, 4),
  },

  D24: {
    code: 'D24',
    name: 'Chaturvimsamsa',
    divisions: 24,
    signification: 'Learning, education and knowledge',
    startSign: (rashi) => (isOdd(rashi) ? 4 : 3),
  },

  D27: {
    code: 'D27',
    name: 'Bhamsa',
    divisions: 27,
    signification: 'Strengths and weaknesses of the constitution',
    // Fire → Aries, Earth → Cancer, Air → Libra, Water → Capricorn.
    startSign: (rashi) => (rashi % 4) * 3,
  },

  D30: {
    code: 'D30',
    name: 'Trimsamsa',
    divisions: 30,
    signification: 'Misfortune, character and hidden weakness',
    // The one varga with unequal divisions — see trimsamsa() below.
    startSign: (rashi) => rashi,
    custom: (rashi, deg) => trimsamsa(rashi, deg),
  },

  D40: {
    code: 'D40',
    name: 'Khavedamsa',
    divisions: 40,
    signification: 'Auspicious and inauspicious effects from the maternal line',
    startSign: (rashi) => (isOdd(rashi) ? 0 : 6),
  },

  D45: {
    code: 'D45',
    name: 'Akshavedamsa',
    divisions: 45,
    signification: 'Overall character and conduct, from the paternal line',
    startSign: (rashi) => byQuality(rashi, 0, 4, 8),
  },

  D60: {
    code: 'D60',
    name: 'Shashtiamsa',
    divisions: 60,
    signification:
      'The finest division — past-life merit and the deepest layer of the chart',
    startSign: (rashi) => rashi,
  },
};

/**
 * Trimsamsa (D30) divides each sign into five unequal parts ruled by the five
 * non-luminary grahas. The luminaries have no trimsamsa. Odd and even signs run
 * the sequence in opposite directions.
 *
 *   Odd:  Mars 0–5 · Saturn 5–10 · Jupiter 10–18 · Mercury 18–25 · Venus 25–30
 *   Even: Venus 0–5 · Mercury 5–12 · Jupiter 12–20 · Saturn 20–25 · Mars 25–30
 */
function trimsamsa(rashi: number, deg: number): number {
  if (isOdd(rashi)) {
    if (deg < 5) return 0; // Mars → Aries
    if (deg < 10) return 10; // Saturn → Aquarius
    if (deg < 18) return 8; // Jupiter → Sagittarius
    if (deg < 25) return 2; // Mercury → Gemini
    return 6; // Venus → Libra
  }
  if (deg < 5) return 1; // Venus → Taurus
  if (deg < 12) return 5; // Mercury → Virgo
  if (deg < 20) return 11; // Jupiter → Pisces
  if (deg < 25) return 9; // Saturn → Capricorn
  return 7; // Mars → Scorpio
}

/** Rashi a longitude falls into within a given varga. */
export function vargaRashi(longitude: number, code: VargaCode): number {
  const def = VARGAS[code];
  const lon = norm360(longitude);
  const rashi = Math.floor(lon / 30);
  const deg = lon - rashi * 30;

  if (def.custom) return def.custom(rashi, deg);

  const part = Math.floor((deg * def.divisions) / 30);
  return (def.startSign(rashi, deg) + part) % 12;
}

/**
 * Build a complete divisional chart.
 *
 * The varga ascendant is derived from the natal ascendant's longitude using the
 * same rule as the grahas, and houses are then counted from it by whole sign —
 * which is the only house system meaningful in a varga.
 */
export function buildVarga(chart: Chart, code: VargaCode): VargaChart {
  const def = VARGAS[code];
  const ascendantRashi = vargaRashi(chart.ascendant.longitude, code);

  const placements = chart.planets.map((p) => {
    const rashi = vargaRashi(p.longitude, code);
    return {
      graha: p.graha as AnyGraha,
      rashi,
      house: signDistance(ascendantRashi, rashi),
    };
  });

  return {
    code,
    name: def.name,
    signification: def.signification,
    ascendantRashi,
    placements,
  };
}

/** The vargas shown by default — the shodasavarga subset in common use. */
export const COMMON_VARGAS: VargaCode[] = ['D1', 'D9', 'D10', 'D7', 'D12', 'D30', 'D60'];

export const ALL_VARGAS: VargaCode[] = [
  'D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12',
  'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60',
];

/**
 * Vimshopaka Bala — a graha's strength weighted across six vargas.
 * A graha strong here delivers its promise; one strong only in the rashi chart
 * often does not.
 */
const SHADVARGA_WEIGHTS: { code: VargaCode; weight: number }[] = [
  { code: 'D1', weight: 6 },
  { code: 'D2', weight: 2 },
  { code: 'D3', weight: 4 },
  { code: 'D9', weight: 5 },
  { code: 'D12', weight: 2 },
  { code: 'D30', weight: 1 },
];

export function vimshopakaBala(chart: Chart, graha: AnyGraha): number {
  const planet = chart.byGraha[graha];
  if (!planet) return 0;

  let score = 0;
  for (const { code, weight } of SHADVARGA_WEIGHTS) {
    const rashi = vargaRashi(planet.longitude, code);
    score += weight * vargaDignityFactor(graha, rashi);
  }
  return Math.round(score * 100) / 100;
}

/** Crude dignity factor in a varga: 1 for own/exalted, 0.5 for friendly, 0 otherwise. */
function vargaDignityFactor(graha: AnyGraha, rashi: number): number {
  const OWN: Partial<Record<string, number[]>> = {
    Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
    Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
  };
  const EXALT: Partial<Record<string, number>> = {
    Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
  };

  if (EXALT[graha] === rashi) return 1;
  if (OWN[graha]?.includes(rashi)) return 1;
  return 0.5;
}
