import {
  COMBUSTION_ORB,
  EXALTATION_DEG,
  MOOLATRIKONA,
  NATURAL_ENEMIES,
  NATURAL_FRIENDS,
  OWN_SIGNS,
  RASHI_LORD,
  SPECIAL_ASPECTS,
  type AnyGraha,
  type Graha,
} from './constants';
import type { Dignity } from './types';
import { norm360 } from './ephemeris';
import { signDistance } from './zodiac';

const NAVAGRAHA = new Set<string>([
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
]);

export function isNavagraha(graha: AnyGraha): graha is Graha {
  return NAVAGRAHA.has(graha);
}

/** Rashi in which a graha is exalted. */
export function exaltationRashi(graha: Graha): number {
  return Math.floor(EXALTATION_DEG[graha] / 30);
}

/** Rashi in which a graha is debilitated, always opposite its exaltation. */
export function debilitationRashi(graha: Graha): number {
  return (exaltationRashi(graha) + 6) % 12;
}

// ---------------------------------------------------------------------------
// Relationships
// ---------------------------------------------------------------------------

export type NaturalRelation = 'friend' | 'neutral' | 'enemy';

export function naturalRelation(from: Graha, to: Graha): NaturalRelation {
  if (from === to) return 'friend';
  if (NATURAL_FRIENDS[from].includes(to)) return 'friend';
  if (NATURAL_ENEMIES[from].includes(to)) return 'enemy';
  return 'neutral';
}

/**
 * Tatkalika Maitri, temporary relationship, decided purely by where the two
 * grahas sit relative to each other in this particular chart.
 * The 2nd, 3rd, 4th, 10th, 11th and 12th from a graha are its temporary
 * friends; the rest are temporary enemies.
 */
export function temporaryRelation(
  fromRashi: number,
  toRashi: number,
): 'friend' | 'enemy' {
  const distance = signDistance(fromRashi, toRashi);
  return [2, 3, 4, 10, 11, 12].includes(distance) ? 'friend' : 'enemy';
}

export type CompoundRelation =
  | 'great_friend'
  | 'friend'
  | 'neutral'
  | 'enemy'
  | 'great_enemy';

/**
 * Panchadha Maitri, the five-fold compound relationship, combining the
 * permanent natural relationship with the temporary one.
 */
export function compoundRelation(
  natural: NaturalRelation,
  temporary: 'friend' | 'enemy',
): CompoundRelation {
  if (natural === 'friend') return temporary === 'friend' ? 'great_friend' : 'neutral';
  if (natural === 'neutral') return temporary === 'friend' ? 'friend' : 'enemy';
  return temporary === 'friend' ? 'neutral' : 'great_enemy';
}

// ---------------------------------------------------------------------------
// Dignity
// ---------------------------------------------------------------------------

export interface DignityContext {
  graha: Graha;
  longitude: number;
  /** Rashi occupied by every other graha, for the temporary relationship. */
  positionsByGraha: Partial<Record<Graha, number>>;
}

/**
 * Dignity of a graha, in the standard order of precedence:
 * exaltation → moolatrikona → own sign → compound relationship with the
 * dispositor → debilitation.
 */
export function determineDignity(ctx: DignityContext): Dignity {
  const { graha, longitude, positionsByGraha } = ctx;
  const lon = norm360(longitude);
  const rashi = Math.floor(lon / 30);
  const degreeInRashi = lon - rashi * 30;

  if (rashi === exaltationRashi(graha)) return 'exalted';
  if (rashi === debilitationRashi(graha)) return 'debilitated';

  const mt = MOOLATRIKONA[graha];
  if (mt && mt[0] === rashi && degreeInRashi >= mt[1] && degreeInRashi <= mt[2]) {
    return 'moolatrikona';
  }

  if (OWN_SIGNS[graha].includes(rashi)) return 'own';

  // Otherwise the dignity is the compound relationship with the lord of the
  // sign the graha occupies (its dispositor).
  const dispositor = RASHI_LORD[rashi];
  if (dispositor === graha) return 'own';

  const dispositorRashi = positionsByGraha[dispositor];
  if (dispositorRashi === undefined) return 'neutral';

  const natural = naturalRelation(graha, dispositor);
  const grahaRashi = positionsByGraha[graha];
  if (grahaRashi === undefined) return natural === 'neutral' ? 'neutral' : natural;

  const temporary = temporaryRelation(grahaRashi, dispositorRashi);
  return compoundRelation(natural, temporary);
}

/** How favourable a dignity is, for sorting and for display emphasis. */
export const DIGNITY_RANK: Record<Dignity, number> = {
  exalted: 5,
  moolatrikona: 4,
  own: 4,
  great_friend: 3,
  friend: 2,
  neutral: 1,
  enemy: -1,
  great_enemy: -2,
  debilitated: -3,
  none: 0,
};

export const DIGNITY_LABEL: Record<Dignity, string> = {
  exalted: 'Exalted',
  moolatrikona: 'Moolatrikona',
  own: 'Own sign',
  great_friend: 'Great friend’s sign',
  friend: 'Friend’s sign',
  neutral: 'Neutral sign',
  enemy: 'Enemy’s sign',
  great_enemy: 'Great enemy’s sign',
  debilitated: 'Debilitated',
  none: 'None',
};

// ---------------------------------------------------------------------------
// Combustion
// ---------------------------------------------------------------------------

/**
 * Astangata, a graha too close to the Sun to be seen, and traditionally held
 * to lose its power to give results.
 */
export function isCombust(
  graha: AnyGraha,
  longitude: number,
  sunLongitude: number,
  retrograde: boolean,
): boolean {
  if (graha === 'Sun' || graha === 'Rahu' || graha === 'Ketu') return false;
  if (!isNavagraha(graha)) return false;

  const orb = COMBUSTION_ORB[graha as keyof typeof COMBUSTION_ORB];
  if (!orb) return false;

  const separation = Math.abs(((norm360(longitude - sunLongitude) + 180) % 360) - 180);
  return separation <= (retrograde ? orb.retrograde : orb.direct);
}

// ---------------------------------------------------------------------------
// Aspects (graha drishti)
// ---------------------------------------------------------------------------

/**
 * Houses aspected by a graha placed in `house`, as house numbers 1–12.
 * Vedic aspects are cast by whole sign, not by orb.
 */
export function aspectedHouses(graha: AnyGraha, house: number): number[] {
  const offsets = isNavagraha(graha) ? SPECIAL_ASPECTS[graha] : [7];
  return offsets.map((offset) => ((house - 1 + offset - 1) % 12) + 1);
}

// ---------------------------------------------------------------------------
// Functional nature
// ---------------------------------------------------------------------------

/**
 * Functional benefic or malefic status for a given ascendant.
 *
 * This is what actually decides how a graha behaves in a chart, a natural
 * malefic owning a trine can be the best graha present, and a natural benefic
 * owning the 3rd and 6th can be the worst.
 *
 * Rules applied, in order:
 *   - owning both a kendra and a trikona makes a graha a yogakaraka;
 *   - owning a trikona (1, 5, 9) is benefic;
 *   - owning 3, 6 or 11 is malefic;
 *   - owning 8 or 12 is malefic, unless the graha also owns a trikona;
 *   - a natural benefic owning only kendras suffers kendradhipatya dosha and
 *     turns neutral, while a natural malefic owning kendras loses malefice.
 */
export function functionalNature(
  graha: AnyGraha,
  ascendantRashi: number,
): 'benefic' | 'malefic' | 'neutral' {
  // The nodes own no sign, so they take the nature of their dispositor at
  // judgement time. Neutral is the honest default here.
  if (!isNavagraha(graha) || graha === 'Rahu' || graha === 'Ketu') return 'neutral';

  const ownedHouses = OWN_SIGNS[graha].map((rashi) => signDistance(ascendantRashi, rashi));
  if (ownedHouses.length === 0) return 'neutral';

  const TRIKONA = [1, 5, 9];
  const KENDRA = [1, 4, 7, 10];
  const DUSTHANA_OWNERSHIP = [3, 6, 11];

  const ownsTrikona = ownedHouses.some((h) => TRIKONA.includes(h));
  const ownsKendra = ownedHouses.some((h) => KENDRA.includes(h));
  const ownsMalefic = ownedHouses.some((h) => DUSTHANA_OWNERSHIP.includes(h));
  const ownsEighthOrTwelfth = ownedHouses.some((h) => h === 8 || h === 12);

  // Yogakaraka, a single graha ruling both an angle and a trine.
  if (ownsTrikona && ownsKendra && ownedHouses.length > 1) return 'benefic';

  if (ownsTrikona) return 'benefic';
  if (ownsMalefic) return 'malefic';
  if (ownsEighthOrTwelfth) return 'malefic';

  // Only kendras left. Kendradhipatya dosha: benefics lose their benefice,
  // malefics lose their malefice.
  if (ownsKendra) return 'neutral';

  return 'neutral';
}

/**
 * Yogakaraka test, a graha owning both a kendra and a trikona from the
 * ascendant. For most ascendants there is exactly one, and it is the single
 * most useful graha in the chart.
 */
export function isYogakaraka(graha: AnyGraha, ascendantRashi: number): boolean {
  if (!isNavagraha(graha)) return false;
  const owned = OWN_SIGNS[graha].map((rashi) => signDistance(ascendantRashi, rashi));
  if (owned.length < 2) return false;
  const ownsTrikona = owned.some((h) => [5, 9].includes(h));
  const ownsKendra = owned.some((h) => [4, 7, 10].includes(h));
  return ownsTrikona && ownsKendra;
}
