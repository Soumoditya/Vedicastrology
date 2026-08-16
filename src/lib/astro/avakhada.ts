import {
  NAKSHATRA_GANA,
  NAKSHATRA_LORD,
  NAKSHATRA_NADI,
  NAKSHATRA_NAMES,
  NAKSHATRA_YONI,
  RASHI_LORD,
  RASHI_NAMES_EN,
} from './constants';
import { moonRashi } from './chart';
import type { Chart } from './types';
import type { AnyGraha } from './constants';

/**
 * The Avakhada Chakra.
 *
 * The block of six attributes that opens every printed North Indian kundli:
 * varna, vashya, yoni, gana, nadi and paya. They are all derived from the
 * Moon's sign and nakshatra, they are what a matchmaker reads first, and they
 * are the single most commonly requested thing that this site did not print.
 *
 * The same six values already existed inside the Ashtakoota matching code, but
 * only as *comparisons* between two charts. A comparison cannot tell one person
 * what their own yoni is, which is what a report needs. These are the native
 * accessors, and the matching code keeps its own comparison logic.
 */

/**
 * Varna by Moon sign. Water signs are Brahmin, fire Kshatriya, air Vaishya and
 * earth Shudra. Nothing to do with birth or caste in the social sense; in
 * Jyotisha it is a temperament grouping, and it is worth saying so in a report
 * rather than leaving somebody to assume the worse reading.
 */
const VARNA_BY_RASHI = [
  'Kshatriya', // Aries
  'Vaishya', // Taurus
  'Shudra', // Gemini
  'Brahmin', // Cancer
  'Kshatriya', // Leo
  'Vaishya', // Virgo
  'Shudra', // Libra
  'Brahmin', // Scorpio
  'Kshatriya', // Sagittarius
  'Vaishya', // Capricorn
  'Shudra', // Aquarius
  'Brahmin', // Pisces
] as const;

/** Vashya, the grouping by which sign holds sway over which. */
const VASHYA_BY_RASHI = [
  'Chatushpada', // Aries, four footed
  'Chatushpada', // Taurus
  'Manav', // Gemini, human
  'Jalachar', // Cancer, water dwelling
  'Vanachar', // Leo, forest dwelling
  'Manav', // Virgo
  'Manav', // Libra
  'Keeta', // Scorpio, insect
  'Manav', // Sagittarius, first half human
  'Jalachar', // Capricorn, second half water
  'Manav', // Aquarius
  'Jalachar', // Pisces
] as const;

/**
 * Paya, the metal of the birth.
 *
 * Swarna, Rajat, Tamra or Loha, decided by which house the Moon occupies
 * counted from the ascendant:
 *
 *   1st, 6th, 11th   Gold
 *   2nd, 5th, 9th    Silver
 *   3rd, 7th, 10th   Copper
 *   4th, 8th, 12th   Iron
 *
 * There is a second, nakshatra-based reckoning in circulation. The house method
 * is the one printed in a North Indian kundli and it is the one used here.
 * Which method a report uses is worth stating, because the two disagree for
 * most charts and a reader comparing two documents deserves to know why.
 */
const PAYA_NAMES = ['Gold', 'Silver', 'Copper', 'Iron'] as const;

/** Moon's house from the ascendant, grouped by metal. */
const PAYA_HOUSES: Record<(typeof PAYA_NAMES)[number], number[]> = {
  Gold: [1, 6, 11],
  Silver: [2, 5, 9],
  Copper: [3, 7, 10],
  Iron: [4, 8, 12],
};

export type Paya = (typeof PAYA_NAMES)[number];

export interface AvakhadaChakra {
  varna: string;
  vashya: string;
  yoni: string;
  gana: string;
  nadi: string;
  paya: Paya;
  /** The Moon's sign, since every value above is derived from it. */
  rashi: number;
  rashiName: string;
  rashiLord: AnyGraha;
  nakshatra: number;
  nakshatraName: string;
  nakshatraLord: AnyGraha;
  pada: number;
}

export function avakhadaChakra(chart: Chart): AvakhadaChakra {
  const rashi = moonRashi(chart);
  const moon = chart.byGraha.Moon;
  const nakshatra = moon.nakshatra;

  return {
    varna: VARNA_BY_RASHI[rashi],
    vashya: VASHYA_BY_RASHI[rashi],
    yoni: NAKSHATRA_YONI[nakshatra],
    gana: NAKSHATRA_GANA[nakshatra],
    nadi: NAKSHATRA_NADI[nakshatra],
    paya: payaOf(moon.house),
    rashi,
    rashiName: RASHI_NAMES_EN[rashi],
    rashiLord: RASHI_LORD[rashi],
    nakshatra,
    nakshatraName: NAKSHATRA_NAMES[nakshatra],
    nakshatraLord: NAKSHATRA_LORD[nakshatra],
    pada: moon.pada,
  };
}

/**
 * Paya from the house the Moon occupies, counted from the ascendant.
 *
 * Every house from 1 to 12 falls in exactly one group, so this is total: there
 * is no chart without a paya, and no chart with two.
 */
export function payaOf(moonHouse: number): Paya {
  for (const name of PAYA_NAMES) {
    if (PAYA_HOUSES[name].includes(moonHouse)) return name;
  }

  // Unreachable for a valid house. Throwing rather than defaulting to Gold,
  // because a silent default here would print a confident wrong answer.
  throw new RangeError(`Moon house out of range: ${moonHouse}`);
}

export { PAYA_NAMES, PAYA_HOUSES, VARNA_BY_RASHI, VASHYA_BY_RASHI };
