import {
  NAKSHATRA_NAMES,
  RASHI_LORD,
  RASHI_NAMES_EN,
  VARA_NAMES,
} from './constants';
import { moonRashi } from './chart';
import type { Chart } from './types';
import type { AnyGraha } from './constants';

/**
 * Favourable points and the Ghataka Chakra.
 *
 * The second block of a printed kundli: lucky number, colour, day, direction
 * and stone, then the Ghataka values, which are the sign, day, tithi,
 * nakshatra, lagna and moon sign said to be adverse for someone born under a
 * given Moon sign.
 *
 * Two honest notes, both carried into the report rather than left out:
 *
 * Ghataka is a folk layer rather than a Parashari one. It is printed in every
 * panchang in India, people expect to see it, and it is given here for that
 * reason. It is not weighted in any reading this site generates.
 *
 * The favourable values are derived from the lord of the Moon sign, which is
 * the traditional derivation, rather than invented per person. A lucky number
 * on this page means "the number of the graha that rules your Moon sign", and
 * the report says so.
 */

/** Graha numbers in the traditional order used for lucky numbers. */
const GRAHA_NUMBER: Record<string, number> = {
  Sun: 1,
  Moon: 2,
  Jupiter: 3,
  Rahu: 4,
  Mercury: 5,
  Venus: 6,
  Ketu: 7,
  Saturn: 8,
  Mars: 9,
};

const GRAHA_COLOUR: Record<string, string> = {
  Sun: 'Deep red, saffron',
  Moon: 'White, pearl',
  Mars: 'Red, coral',
  Mercury: 'Green',
  Jupiter: 'Yellow, gold',
  Venus: 'White, pastel shades',
  Saturn: 'Dark blue, black',
  Rahu: 'Smoky grey',
  Ketu: 'Brown, variegated',
};

const GRAHA_DAY: Record<string, string> = {
  Sun: 'Sunday',
  Moon: 'Monday',
  Mars: 'Tuesday',
  Mercury: 'Wednesday',
  Jupiter: 'Thursday',
  Venus: 'Friday',
  Saturn: 'Saturday',
  Rahu: 'Saturday',
  Ketu: 'Tuesday',
};

const GRAHA_DIRECTION: Record<string, string> = {
  Sun: 'East',
  Moon: 'North west',
  Mars: 'South',
  Mercury: 'North',
  Jupiter: 'North east',
  Venus: 'South east',
  Saturn: 'West',
  Rahu: 'South west',
  Ketu: 'South west',
};

const GRAHA_STONE: Record<string, string> = {
  Sun: 'Ruby',
  Moon: 'Pearl',
  Mars: 'Red coral',
  Mercury: 'Emerald',
  Jupiter: 'Yellow sapphire',
  Venus: 'Diamond',
  Saturn: 'Blue sapphire',
  Rahu: 'Hessonite',
  Ketu: "Cat's eye",
};

/** The element of each sign, which gives the favourable element. */
const RASHI_ELEMENT_NAME = [
  'Fire',
  'Earth',
  'Air',
  'Water',
  'Fire',
  'Earth',
  'Air',
  'Water',
  'Fire',
  'Earth',
  'Air',
  'Water',
] as const;

export interface FavourablePoints {
  /** The graha every value below derives from. */
  lord: AnyGraha;
  number: number;
  /** A second number, from the lord of the ascendant. */
  ascendantNumber: number;
  colour: string;
  day: string;
  direction: string;
  stone: string;
  element: string;
  deity: string;
}

const GRAHA_DEITY: Record<string, string> = {
  Sun: 'Surya, and Shiva',
  Moon: 'Parvati, and Shiva as Chandrashekhara',
  Mars: 'Hanuman, and Kartikeya',
  Mercury: 'Vishnu, and Ganesha',
  Jupiter: 'Brihaspati, and Vishnu as Dattatreya',
  Venus: 'Lakshmi, and Shukra',
  Saturn: 'Shani, and Hanuman',
  Rahu: 'Durga, and Bhairava',
  Ketu: 'Ganesha, and Bhairava',
};

export function favourablePoints(chart: Chart): FavourablePoints {
  const rashi = moonRashi(chart);
  const lord = RASHI_LORD[rashi];
  const ascendantLord = RASHI_LORD[chart.ascendant.rashi];

  return {
    lord,
    number: GRAHA_NUMBER[lord] ?? 0,
    ascendantNumber: GRAHA_NUMBER[ascendantLord] ?? 0,
    colour: GRAHA_COLOUR[lord] ?? '',
    day: GRAHA_DAY[lord] ?? '',
    direction: GRAHA_DIRECTION[lord] ?? '',
    stone: GRAHA_STONE[lord] ?? '',
    element: RASHI_ELEMENT_NAME[rashi],
    deity: GRAHA_DEITY[lord] ?? '',
  };
}

// ---------------------------------------------------------------------------
// Ghataka Chakra
// ---------------------------------------------------------------------------

/**
 * The five tithi groups.
 *
 * The Ghataka tithi is named as a group rather than as a single lunar day,
 * because each group repeats three times in a paksha. Nanda is the first, sixth
 * and eleventh; Bhadra the second, seventh and twelfth; and so on. Printing a
 * bare number instead of the group name, which is what several calculators do,
 * silently drops two thirds of the days the rule actually covers.
 */
const TITHI_GROUPS: Record<string, number[]> = {
  Nanda: [1, 6, 11],
  Bhadra: [2, 7, 12],
  Jaya: [3, 8, 13],
  Rikta: [4, 9, 14],
  Poorna: [5, 10, 15],
};

/**
 * The Ghataka Chakra, by Moon sign.
 *
 * Index is the Moon sign, Aries first. Weekday and nakshatra are indices into
 * VARA_NAMES and NAKSHATRA_NAMES; lagna and rashi are sign indices.
 *
 * These twelve rows are the classical table and are not derivable from a
 * formula, so they are transcribed rather than computed. They were checked
 * against a published Ghataka Chakra table before being used, because an
 * invented table here would look entirely plausible and be wrong in every row,
 * which is the worst failure mode a reference table has.
 */
const GHATAKA: {
  month: string;
  tithiGroup: keyof typeof TITHI_GROUPS;
  vara: number;
  nakshatra: number;
  lagna: number;
  rashi: number;
}[] = [
  // Aries
  { month: 'Kartika', tithiGroup: 'Nanda', vara: 0, nakshatra: 9, lagna: 0, rashi: 0 },
  // Taurus
  { month: 'Margashirsha', tithiGroup: 'Poorna', vara: 6, nakshatra: 12, lagna: 4, rashi: 7 },
  // Gemini
  { month: 'Ashadha', tithiGroup: 'Bhadra', vara: 1, nakshatra: 14, lagna: 8, rashi: 6 },
  // Cancer
  { month: 'Pausha', tithiGroup: 'Bhadra', vara: 3, nakshatra: 16, lagna: 1, rashi: 8 },
  // Leo
  { month: 'Jyeshtha', tithiGroup: 'Jaya', vara: 6, nakshatra: 18, lagna: 5, rashi: 3 },
  // Virgo
  { month: 'Bhadrapada', tithiGroup: 'Poorna', vara: 6, nakshatra: 21, lagna: 9, rashi: 2 },
  // Libra
  { month: 'Magha', tithiGroup: 'Rikta', vara: 4, nakshatra: 23, lagna: 2, rashi: 5 },
  // Scorpio
  { month: 'Ashwina', tithiGroup: 'Nanda', vara: 5, nakshatra: 26, lagna: 6, rashi: 1 },
  // Sagittarius
  { month: 'Shravana', tithiGroup: 'Jaya', vara: 5, nakshatra: 1, lagna: 3, rashi: 9 },
  // Capricorn
  { month: 'Vaishakha', tithiGroup: 'Rikta', vara: 2, nakshatra: 3, lagna: 7, rashi: 10 },
  // Aquarius
  { month: 'Chaitra', tithiGroup: 'Jaya', vara: 4, nakshatra: 5, lagna: 10, rashi: 4 },
  // Pisces
  { month: 'Phalguna', tithiGroup: 'Poorna', vara: 5, nakshatra: 8, lagna: 11, rashi: 11 },
];

export interface GhatakaChakra {
  month: string;
  /** The tithi group name, and the three lunar days it covers. */
  tithi: string;
  tithiGroup: string;
  tithiDays: number[];
  vara: string;
  nakshatra: string;
  lagna: string;
  rashi: string;
  note: string;
}

export function ghatakaChakra(chart: Chart): GhatakaChakra {
  const g = GHATAKA[moonRashi(chart)];
  const days = TITHI_GROUPS[g.tithiGroup];

  return {
    month: g.month,
    tithi: `${g.tithiGroup} (${days.join(', ')})`,
    tithiGroup: g.tithiGroup,
    tithiDays: days,
    vara: VARA_NAMES[g.vara],
    nakshatra: NAKSHATRA_NAMES[g.nakshatra],
    lagna: RASHI_NAMES_EN[g.lagna],
    rashi: RASHI_NAMES_EN[g.rashi],
    note:
      'Ghataka is a folk layer of the tradition rather than a Parashari one. ' +
      'It is printed here because every panchang prints it and people look ' +
      'for it, and it is given no weight at all in the readings on this site. ' +
      'Treat it as something to be aware of when choosing a date for a ' +
      'ceremony, not as a list of days on which to stay indoors.',
  };
}

export { TITHI_GROUPS };

export { GRAHA_NUMBER, GRAHA_COLOUR, GRAHA_DIRECTION, GRAHA_STONE, GRAHA_DEITY };
