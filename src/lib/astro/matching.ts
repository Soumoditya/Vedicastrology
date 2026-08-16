import {
  NAKSHATRA_GANA,
  NAKSHATRA_LORD,
  NAKSHATRA_NADI,
  NAKSHATRA_NAMES,
  NAKSHATRA_YONI,
  RASHI_LORD,
  type Graha,
} from './constants';
import type { Chart } from './types';
import { naturalRelation } from './dignity';
import { signDistance } from './zodiac';

/**
 * Ashtakoot Guna Milan.
 *
 * Eight koots, thirty six points. The whole comparison rests on the Moon's
 * nakshatra and rashi in each chart, nothing else, which is why it can be
 * computed from birth details alone without a known birth time.
 *
 * Two things generic implementations get wrong and are handled here:
 *
 *   Bhakoot is scored on the *mutual* distance, not one direction. Counting
 *   only bride to groom marks half of the genuinely afflicted pairs as clear.
 *
 *   Nadi is not a flat zero for a match. The classical exceptions, same rashi
 *   with different nakshatras and same nakshatra with different padas, cancel
 *   the dosha, and ignoring them condemns compatible pairs.
 */

export interface KootResult {
  name: string;
  sanskrit: string;
  score: number;
  maximum: number;
  /** What this koot is actually measuring, in plain language. */
  measures: string;
  /** Why this particular score came out. */
  reason: string;
}

export interface MangalDosha {
  present: boolean;
  /** Houses from the ascendant, Moon and Venus that Mars occupies. */
  fromAscendant: boolean;
  fromMoon: boolean;
  fromVenus: boolean;
  cancelled: boolean;
  cancellationReasons: string[];
}

export interface MatchResult {
  koots: KootResult[];
  total: number;
  maximum: 36;
  /** The classical reading of the total. */
  verdict: 'excellent' | 'good' | 'acceptable' | 'difficult';
  summary: string;
  bride: { nakshatra: number; rashi: number; pada: number };
  groom: { nakshatra: number; rashi: number; pada: number };
  mangal: { bride: MangalDosha; groom: MangalDosha; balanced: boolean };
  /** Points the classical rules flag as needing attention. */
  cautions: string[];
}

// ---------------------------------------------------------------------------
// 1. Varna, 1 point. Spiritual disposition.
// ---------------------------------------------------------------------------

/** Varna of each rashi, indexed by rashi. 3 is highest. */
const RASHI_VARNA = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
const VARNA_NAMES = ['', 'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin'];

function varna(brideRashi: number, groomRashi: number): KootResult {
  // Water signs are Brahmin, fire Kshatriya, air Vaishya, earth Shudra.
  const order = [2, 4, 3, 1];
  const b = order[brideRashi % 4];
  const g = order[groomRashi % 4];

  // The point is given when the groom's varna equals or exceeds the bride's.
  const score = g >= b ? 1 : 0;

  return {
    name: 'Varna',
    sanskrit: 'Varṇa',
    score,
    maximum: 1,
    measures: 'Temperament and spiritual outlook',
    reason:
      score === 1
        ? `Compatible: ${VARNA_NAMES[g]} and ${VARNA_NAMES[b]}.`
        : `The classical rule is not met here. Widely treated as the least important of the eight, and one point rarely decides a match.`,
  };
}

// ---------------------------------------------------------------------------
// 2. Vashya, 2 points. Mutual influence.
// ---------------------------------------------------------------------------

/** Vashya group of each rashi. */
const RASHI_VASHYA = [
  'quadruped', 'quadruped', 'human', 'insect', 'quadruped', 'human',
  'human', 'insect', 'quadruped', 'quadruped', 'human', 'water',
];

function vashya(brideRashi: number, groomRashi: number): KootResult {
  const b = RASHI_VASHYA[brideRashi];
  const g = RASHI_VASHYA[groomRashi];

  let score = 0;
  if (b === g) score = 2;
  else if (
    (b === 'human' && g === 'quadruped') ||
    (b === 'quadruped' && g === 'human')
  ) {
    score = 1;
  } else if (b === 'water' || g === 'water') score = 1;
  else score = 0.5;

  return {
    name: 'Vashya',
    sanskrit: 'Vaśya',
    score,
    maximum: 2,
    measures: 'How naturally each yields to the other',
    reason:
      score === 2
        ? 'Same group, so influence flows easily both ways.'
        : 'Different groups. Workable, but neither leads instinctively.',
  };
}

// ---------------------------------------------------------------------------
// 3. Tara, 3 points. Wellbeing and fortune.
// ---------------------------------------------------------------------------

function tara(brideNak: number, groomNak: number): KootResult {
  // Counted both ways, then judged on the remainder after dividing by nine.
  const forward = ((groomNak - brideNak + 27) % 27) + 1;
  const backward = ((brideNak - groomNak + 27) % 27) + 1;

  const a = forward % 9;
  const b = backward % 9;

  // Remainders of 3, 5 and 7 are the inauspicious taras.
  const bad = [3, 5, 7];
  const aGood = !bad.includes(a);
  const bGood = !bad.includes(b);

  const score = aGood && bGood ? 3 : aGood || bGood ? 1.5 : 0;

  return {
    name: 'Tara',
    sanskrit: 'Tārā',
    score,
    maximum: 3,
    measures: 'Health, fortune and the wellbeing of each in the other’s company',
    reason:
      score === 3
        ? 'Both counts fall on favourable taras.'
        : score === 0
          ? 'Both counts fall on difficult taras.'
          : 'One direction is favourable, the other is not.',
  };
}

// ---------------------------------------------------------------------------
// 4. Yoni, 4 points. Physical and instinctive compatibility.
// ---------------------------------------------------------------------------

/** Pairs that are natural enemies score nothing. */
const YONI_ENEMIES: Record<string, string> = {
  Horse: 'Buffalo',
  Buffalo: 'Horse',
  Elephant: 'Sheep',
  Sheep: 'Elephant',
  Serpent: 'Mongoose',
  Mongoose: 'Serpent',
  Dog: 'Deer',
  Deer: 'Dog',
  Cat: 'Rat',
  Rat: 'Cat',
  Cow: 'Tiger',
  Tiger: 'Cow',
  Monkey: 'Lion',
  Lion: 'Monkey',
};

function yoni(brideNak: number, groomNak: number): KootResult {
  const b = NAKSHATRA_YONI[brideNak];
  const g = NAKSHATRA_YONI[groomNak];

  let score: number;
  if (b === g) score = 4;
  else if (YONI_ENEMIES[b] === g) score = 0;
  else score = 2;

  return {
    name: 'Yoni',
    sanskrit: 'Yoni',
    score,
    maximum: 4,
    measures: 'Physical compatibility and instinctive ease',
    reason:
      score === 4
        ? `Both ${b}. The strongest possible reading.`
        : score === 0
          ? `${b} and ${g} are classical opposites.`
          : `${b} and ${g}. Neutral, which is the common case.`,
  };
}

// ---------------------------------------------------------------------------
// 5. Graha Maitri, 5 points. Friendship of the Moon lords.
// ---------------------------------------------------------------------------

function grahaMaitri(brideRashi: number, groomRashi: number): KootResult {
  const b = RASHI_LORD[brideRashi];
  const g = RASHI_LORD[groomRashi];

  const bToG = naturalRelation(b, g);
  const gToB = naturalRelation(g, b);

  let score: number;
  if (b === g) score = 5;
  else if (bToG === 'friend' && gToB === 'friend') score = 5;
  else if (bToG === 'friend' && gToB === 'neutral') score = 4;
  else if (bToG === 'neutral' && gToB === 'friend') score = 4;
  else if (bToG === 'neutral' && gToB === 'neutral') score = 3;
  else if (bToG === 'friend' && gToB === 'enemy') score = 1;
  else if (bToG === 'enemy' && gToB === 'friend') score = 1;
  else if (bToG === 'neutral' && gToB === 'enemy') score = 0.5;
  else if (bToG === 'enemy' && gToB === 'neutral') score = 0.5;
  else score = 0;

  return {
    name: 'Graha Maitri',
    sanskrit: 'Graha Maitrī',
    score,
    maximum: 5,
    measures: 'Mental affinity and how well minds meet',
    reason:
      b === g
        ? `Both Moon signs are ruled by ${b}.`
        : `${b} and ${g} are ${bToG === gToB ? bToG + 's' : `${bToG} and ${gToB}`} to each other.`,
  };
}

// ---------------------------------------------------------------------------
// 6. Gana, 6 points. Temperament.
// ---------------------------------------------------------------------------

function gana(brideNak: number, groomNak: number): KootResult {
  const b = NAKSHATRA_GANA[brideNak];
  const g = NAKSHATRA_GANA[groomNak];

  let score: number;
  if (b === g) score = 6;
  else if (
    (b === 'Deva' && g === 'Manushya') ||
    (b === 'Manushya' && g === 'Deva')
  ) {
    score = 5;
  } else if (b === 'Manushya' && g === 'Rakshasa') score = 0;
  else if (b === 'Rakshasa' && g === 'Manushya') score = 1;
  else score = 0; // Deva with Rakshasa

  return {
    name: 'Gana',
    sanskrit: 'Gaṇa',
    score,
    maximum: 6,
    measures: 'Temperament, and how each handles conflict',
    reason:
      b === g
        ? `Both ${b}.`
        : `${b} and ${g}. ${score <= 1 ? 'Classically a difficult pairing of temperaments.' : 'Workable.'}`,
  };
}

// ---------------------------------------------------------------------------
// 7. Bhakoot, 7 points. The relationship of the Moon signs.
// ---------------------------------------------------------------------------

function bhakoot(brideRashi: number, groomRashi: number): KootResult {
  // Measured in both directions. Checking only one marks half the genuinely
  // afflicted pairs as clear, which is the common implementation error.
  const forward = signDistance(brideRashi, groomRashi);
  const backward = signDistance(groomRashi, brideRashi);

  const pair = [forward, backward].sort((a, b) => a - b).join(':');

  // 6:8, 5:9 and 2:12 are the afflicted relationships.
  const afflicted = ['6:8', '5:9', '2:12'];
  const score = afflicted.includes(pair) ? 0 : 7;

  return {
    name: 'Bhakoot',
    sanskrit: 'Bhakūṭa',
    score,
    maximum: 7,
    measures: 'Prosperity, health and the shape of life together',
    reason:
      score === 7
        ? `Moon signs stand ${forward} and ${backward} from each other, which is clear.`
        : `Moon signs form a ${pair} relationship, the classical Bhakoot dosha.`,
  };
}

// ---------------------------------------------------------------------------
// 8. Nadi, 8 points. Constitution and progeny.
// ---------------------------------------------------------------------------

function nadi(
  brideNak: number,
  groomNak: number,
  brideRashi: number,
  groomRashi: number,
  bridePada: number,
  groomPada: number,
): KootResult {
  const b = NAKSHATRA_NADI[brideNak];
  const g = NAKSHATRA_NADI[groomNak];

  if (b !== g) {
    return {
      name: 'Nadi',
      sanskrit: 'Nāḍī',
      score: 8,
      maximum: 8,
      measures: 'Constitution, vitality and children',
      reason: `Different nadis, ${b} and ${g}. The heaviest koot is clear.`,
    };
  }

  /*
    Same nadi is the Nadi dosha, and it carries the most weight of any koot.
    But the classical exceptions genuinely cancel it, and an implementation
    that ignores them condemns compatible couples on a technicality.
  */
  const cancellations: string[] = [];

  if (brideRashi === groomRashi && brideNak !== groomNak) {
    cancellations.push('same rashi but different nakshatras');
  }
  if (brideNak === groomNak && bridePada !== groomPada) {
    cancellations.push('same nakshatra but different padas');
  }

  const cancelled = cancellations.length > 0;

  return {
    name: 'Nadi',
    sanskrit: 'Nāḍī',
    score: cancelled ? 8 : 0,
    maximum: 8,
    measures: 'Constitution, vitality and children',
    reason: cancelled
      ? `Both ${b} nadi, but the dosha is cancelled: ${cancellations.join(', and ')}.`
      : `Both ${b} nadi. This is Nadi dosha, the most serious of the eight.`,
  };
}

// ---------------------------------------------------------------------------
// Mangal dosha
// ---------------------------------------------------------------------------

/**
 * Mangal (Kuja) dosha.
 *
 * Mars in the 1st, 2nd, 4th, 7th, 8th or 12th, counted from the ascendant, the
 * Moon and Venus. Checking only the ascendant, as many tools do, misses a
 * large share of real cases.
 */
export function mangalDosha(chart: Chart): MangalDosha {
  const DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

  const mars = chart.byGraha.Mars;
  const ascRashi = chart.ascendant.rashi;
  const moonRashi = chart.byGraha.Moon.rashi;
  const venusRashi = chart.byGraha.Venus.rashi;

  const fromAscendant = DOSHA_HOUSES.includes(signDistance(ascRashi, mars.rashi));
  const fromMoon = DOSHA_HOUSES.includes(signDistance(moonRashi, mars.rashi));
  const fromVenus = DOSHA_HOUSES.includes(signDistance(venusRashi, mars.rashi));

  const present = fromAscendant || fromMoon || fromVenus;

  // Standard cancellations. Applied because a dosha that is never cancelled is
  // a dosha that has stopped meaning anything.
  const cancellationReasons: string[] = [];

  if (present) {
    if (mars.dignity === 'own' || mars.dignity === 'exalted' || mars.dignity === 'moolatrikona') {
      cancellationReasons.push('Mars is strong in its own or exalted sign');
    }
    if ([0, 3, 6, 9].includes(mars.rashi) && signDistance(ascRashi, mars.rashi) === 1) {
      cancellationReasons.push('Mars is in the first house in its own sign');
    }
    // Saturn or Jupiter aspecting Mars is widely accepted as mitigating.
    const aspectingMars = chart.planets.filter(
      (p) =>
        (p.graha === 'Jupiter' || p.graha === 'Saturn') &&
        p.aspects.includes(mars.house),
    );
    if (aspectingMars.length > 0) {
      cancellationReasons.push(
        `${aspectingMars.map((p) => p.graha).join(' and ')} aspects Mars`,
      );
    }
    // Mars with or aspected by the Moon.
    if (chart.byGraha.Moon.house === mars.house) {
      cancellationReasons.push('Mars is joined by the Moon');
    }
  }

  return {
    present,
    fromAscendant,
    fromMoon,
    fromVenus,
    cancelled: present && cancellationReasons.length > 0,
    cancellationReasons,
  };
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export function matchCharts(bride: Chart, groom: Chart): MatchResult {
  const b = bride.byGraha.Moon;
  const g = groom.byGraha.Moon;

  const koots: KootResult[] = [
    varna(b.rashi, g.rashi),
    vashya(b.rashi, g.rashi),
    tara(b.nakshatra, g.nakshatra),
    yoni(b.nakshatra, g.nakshatra),
    grahaMaitri(b.rashi, g.rashi),
    gana(b.nakshatra, g.nakshatra),
    bhakoot(b.rashi, g.rashi),
    nadi(b.nakshatra, g.nakshatra, b.rashi, g.rashi, b.pada, g.pada),
  ];

  const total = Math.round(koots.reduce((sum, k) => sum + k.score, 0) * 10) / 10;

  const verdict: MatchResult['verdict'] =
    total >= 28 ? 'excellent' : total >= 21 ? 'good' : total >= 18 ? 'acceptable' : 'difficult';

  const brideMangal = mangalDosha(bride);
  const groomMangal = mangalDosha(groom);

  // Two afflicted charts are classically held to cancel each other.
  const balanced =
    brideMangal.present === groomMangal.present ||
    (brideMangal.cancelled && groomMangal.present) ||
    (groomMangal.cancelled && brideMangal.present);

  const cautions: string[] = [];
  for (const koot of koots) {
    if (koot.score === 0) cautions.push(`${koot.name}: ${koot.reason}`);
  }
  if (brideMangal.present !== groomMangal.present && !balanced) {
    cautions.push(
      'Mangal dosha is present in one chart but not the other, which the classical rules treat as unbalanced.',
    );
  }

  const summary =
    total >= 18
      ? `${total} of 36. ${verdict === 'excellent' ? 'A strong match by the classical count.' : verdict === 'good' ? 'A good match by the classical count.' : 'Above the traditional threshold of 18.'}`
      : `${total} of 36, below the traditional threshold of 18.`;

  return {
    koots,
    total,
    maximum: 36,
    verdict,
    summary,
    bride: { nakshatra: b.nakshatra, rashi: b.rashi, pada: b.pada },
    groom: { nakshatra: g.nakshatra, rashi: g.rashi, pada: g.pada },
    mangal: { bride: brideMangal, groom: groomMangal, balanced },
    cautions,
  };
}

/** Nakshatra name, for display. */
export function nakshatraName(index: number): string {
  return NAKSHATRA_NAMES[index];
}

/** Vimshottari lord of a nakshatra, for display. */
export function nakshatraLord(index: number): Graha {
  return NAKSHATRA_LORD[index];
}
