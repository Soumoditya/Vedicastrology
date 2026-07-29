import {
  DUSTHANA_HOUSES,
  KENDRA_HOUSES,
  OWN_SIGNS,
  RASHI_LORD,
  RASHI_NAMES_EN,
  TRIKONA_HOUSES,
  type AnyGraha,
  type Graha,
} from './constants';
import type { Chart, PlanetPosition, YogaResult } from './types';
import { debilitationRashi, exaltationRashi, isNavagraha } from './dignity';
import { signDistance } from './zodiac';
import { moonIsBenefic } from './chart';

/**
 * Yoga and dosha detection.
 *
 * A rule engine, not a text generator. Every finding carries the reason it
 * fired, so the output can be checked line by line against a classical text
 * and can be fed to the interpretation layer without that layer having to
 * decide anything astrological for itself.
 *
 * House numbers here are 1 to 12 counted from the ascendant, matching
 * `PlanetPosition.house`.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Houses a graha owns, counted from the ascendant. */
function ownedHouses(graha: Graha, ascendantRashi: number): number[] {
  return OWN_SIGNS[graha].map((rashi) => signDistance(ascendantRashi, rashi));
}

/** The graha ruling a given house. */
function lordOfHouse(chart: Chart, house: number): PlanetPosition | null {
  const rashi = (chart.ascendant.rashi + house - 1) % 12;
  return chart.byGraha[RASHI_LORD[rashi]] ?? null;
}

/** Grahas sitting in a house. */
function occupants(chart: Chart, house: number): PlanetPosition[] {
  return chart.planets.filter((p) => p.house === house);
}

/** Whether two grahas are in the same house. */
function conjunct(a: PlanetPosition, b: PlanetPosition): boolean {
  return a.house === b.house;
}

/** Whether `from` casts an aspect onto `house`. */
function aspects(from: PlanetPosition, house: number): boolean {
  return from.aspects.includes(house);
}

/** The natural benefics, resolving the Moon by paksha and Mercury by company. */
function benefics(chart: Chart): PlanetPosition[] {
  const result: PlanetPosition[] = [];

  for (const p of chart.planets) {
    if (p.graha === 'Jupiter' || p.graha === 'Venus') result.push(p);
    else if (p.graha === 'Moon' && moonIsBenefic(chart)) result.push(p);
    else if (p.graha === 'Mercury') {
      // Mercury is benefic alone and takes on the nature of its company.
      const withMalefic = chart.planets.some(
        (o) =>
          o.house === p.house &&
          ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'].includes(o.graha),
      );
      if (!withMalefic) result.push(p);
    }
  }

  return result;
}

function malefics(chart: Chart): PlanetPosition[] {
  const beneficSet = new Set(benefics(chart).map((p) => p.graha));
  return chart.planets.filter(
    (p) => isNavagraha(p.graha) && !beneficSet.has(p.graha),
  );
}

// ---------------------------------------------------------------------------
// Panch Mahapurusha
// ---------------------------------------------------------------------------

const MAHAPURUSHA: { graha: Graha; name: string; quality: string }[] = [
  { graha: 'Mars', name: 'Ruchaka', quality: 'courage, command and physical force' },
  { graha: 'Mercury', name: 'Bhadra', quality: 'intellect, speech and adaptability' },
  { graha: 'Jupiter', name: 'Hamsa', quality: 'wisdom, ethics and respect' },
  { graha: 'Venus', name: 'Malavya', quality: 'refinement, comfort and beauty' },
  { graha: 'Saturn', name: 'Sasa', quality: 'discipline, endurance and authority over others' },
];

/**
 * The five great person yogas.
 *
 * Each needs its graha in its own sign or exalted, *and* in a kendra from the
 * ascendant. Both conditions matter: a graha exalted in the sixth house forms
 * no Mahapurusha yoga, and implementations that check only dignity report these
 * far more often than they occur.
 */
function panchMahapurusha(chart: Chart): YogaResult[] {
  const results: YogaResult[] = [];

  for (const { graha, name, quality } of MAHAPURUSHA) {
    const p = chart.byGraha[graha];
    if (!p) continue;

    const inKendra = KENDRA_HOUSES.includes(p.house - 1);
    const strongSign =
      p.dignity === 'own' || p.dignity === 'moolatrikona' || p.dignity === 'exalted';

    if (!inKendra || !strongSign) continue;

    results.push({
      name: `${name} Yoga`,
      sanskrit: name,
      polarity: 'benefic',
      reason:
        `${graha} is ${p.dignity === 'exalted' ? 'exalted' : 'in its own sign'} ` +
        `in ${RASHI_NAMES_EN[p.rashi]}, and sits in the ${ordinal(p.house)} house, a kendra. ` +
        `One of the five Mahapurusha yogas, giving ${quality}.`,
      strength: p.dignity === 'exalted' ? 'strong' : 'moderate',
      involvedGrahas: [graha],
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Lunar yogas
// ---------------------------------------------------------------------------

function lunarYogas(chart: Chart): YogaResult[] {
  const results: YogaResult[] = [];
  const moon = chart.byGraha.Moon;
  if (!moon) return results;

  const jupiter = chart.byGraha.Jupiter;

  // Gaja Kesari: Jupiter in a kendra from the Moon.
  if (jupiter) {
    const fromMoon = signDistance(moon.rashi, jupiter.rashi);
    if ([1, 4, 7, 10].includes(fromMoon)) {
      results.push({
        name: 'Gaja Kesari Yoga',
        sanskrit: 'Gaja Kesarī',
        polarity: 'benefic',
        reason:
          `Jupiter stands in the ${ordinal(fromMoon)} from the Moon, a kendra. ` +
          'Classically associated with lasting reputation and the respect of others.',
        strength: fromMoon === 1 ? 'strong' : 'moderate',
        involvedGrahas: ['Jupiter', 'Moon'],
      });
    }
  }

  // Grahas in the 2nd and 12th from the Moon, excluding the Sun and the nodes.
  const neighbours = (offset: number) =>
    chart.planets.filter(
      (p) =>
        p.graha !== 'Moon' &&
        p.graha !== 'Sun' &&
        p.graha !== 'Rahu' &&
        p.graha !== 'Ketu' &&
        signDistance(moon.rashi, p.rashi) === offset,
    );

  const second = neighbours(2);
  const twelfth = neighbours(12);

  if (second.length > 0 && twelfth.length > 0) {
    results.push({
      name: 'Durudhara Yoga',
      sanskrit: 'Durudharā',
      polarity: 'benefic',
      reason:
        'Grahas occupy both the second and the twelfth from the Moon, which the ' +
        'texts read as material comfort and support on either side.',
      strength: 'moderate',
      involvedGrahas: [...second, ...twelfth].map((p) => p.graha),
    });
  } else if (second.length > 0) {
    results.push({
      name: 'Sunapha Yoga',
      sanskrit: 'Sunaphā',
      polarity: 'benefic',
      reason: 'A graha occupies the second from the Moon, read as self-earned means.',
      strength: 'moderate',
      involvedGrahas: second.map((p) => p.graha),
    });
  } else if (twelfth.length > 0) {
    results.push({
      name: 'Anapha Yoga',
      sanskrit: 'Anaphā',
      polarity: 'benefic',
      reason: 'A graha occupies the twelfth from the Moon, read as ease and detachment.',
      strength: 'moderate',
      involvedGrahas: twelfth.map((p) => p.graha),
    });
  } else {
    /*
      Kemadruma: nothing on either side of the Moon, and nothing in a kendra
      from it. The kendra condition is the part usually left out, and omitting
      it reports this rather bleak yoga far more often than it truly occurs.
    */
    const kendraFromMoon = chart.planets.some(
      (p) =>
        p.graha !== 'Moon' &&
        p.graha !== 'Rahu' &&
        p.graha !== 'Ketu' &&
        [1, 4, 7, 10].includes(signDistance(moon.rashi, p.rashi)),
    );

    if (!kendraFromMoon) {
      results.push({
        name: 'Kemadruma Yoga',
        sanskrit: 'Kemadruma',
        polarity: 'malefic',
        reason:
          'The Moon has no graha in the second or twelfth from it, and none in a ' +
          'kendra from it either. Classically read as a solitary streak and effort ' +
          'that has to be made alone. Frequently cancelled, and often overstated.',
        strength: 'moderate',
        involvedGrahas: ['Moon'],
      });
    }
  }

  // Chandra Mangal: Moon and Mars together.
  const mars = chart.byGraha.Mars;
  if (mars && conjunct(moon, mars)) {
    results.push({
      name: 'Chandra Mangal Yoga',
      sanskrit: 'Candra Maṅgala',
      polarity: 'mixed',
      reason:
        `The Moon and Mars are together in the ${ordinal(moon.house)} house. ` +
        'Read as drive and a facility with money, alongside a sharper temper.',
      strength: 'moderate',
      involvedGrahas: ['Moon', 'Mars'],
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Solar and other conjunction yogas
// ---------------------------------------------------------------------------

function conjunctionYogas(chart: Chart): YogaResult[] {
  const results: YogaResult[] = [];
  const sun = chart.byGraha.Sun;
  const mercury = chart.byGraha.Mercury;

  if (sun && mercury && conjunct(sun, mercury)) {
    results.push({
      name: 'Budha Aditya Yoga',
      sanskrit: 'Budha Āditya',
      polarity: mercury.combust ? 'mixed' : 'benefic',
      reason:
        `The Sun and Mercury are together in the ${ordinal(sun.house)} house, read as ` +
        'sharp intelligence and skill with words.' +
        (mercury.combust
          ? ' Mercury is combust here, which the texts treat as weakening the result.'
          : ''),
      strength: mercury.combust ? 'weak' : 'moderate',
      involvedGrahas: ['Sun', 'Mercury'],
    });
  }

  // Amala: a benefic in the tenth from the ascendant or the Moon.
  const beneficList = benefics(chart);
  const moon = chart.byGraha.Moon;

  const inTenth = beneficList.find(
    (p) =>
      p.house === 10 ||
      (moon && signDistance(moon.rashi, p.rashi) === 10),
  );

  if (inTenth) {
    results.push({
      name: 'Amala Yoga',
      sanskrit: 'Amala',
      polarity: 'benefic',
      reason:
        `${inTenth.graha}, a benefic, occupies the tenth from the ascendant or the Moon. ` +
        'Classically read as a spotless reputation and work that is well thought of.',
      strength: 'moderate',
      involvedGrahas: [inTenth.graha],
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Raja and Dhana yogas
// ---------------------------------------------------------------------------

/**
 * Raja yogas from kendra and trikona lords.
 *
 * Formed when a lord of an angle and a lord of a trine are joined, aspect each
 * other, or exchange signs. The first house counts as both, so its lord is
 * excluded from pairing with itself.
 */
function rajaYogas(chart: Chart): YogaResult[] {
  const results: YogaResult[] = [];
  const asc = chart.ascendant.rashi;

  const kendraLords = new Set<Graha>();
  const trikonaLords = new Set<Graha>();

  for (const i of KENDRA_HOUSES) {
    const lord = lordOfHouse(chart, i + 1);
    if (lord && isNavagraha(lord.graha)) kendraLords.add(lord.graha);
  }
  for (const i of TRIKONA_HOUSES) {
    const lord = lordOfHouse(chart, i + 1);
    if (lord && isNavagraha(lord.graha)) trikonaLords.add(lord.graha);
  }

  const seen = new Set<string>();

  for (const k of kendraLords) {
    for (const t of trikonaLords) {
      if (k === t) {
        // One graha ruling both an angle and a trine is a yogakaraka in itself.
        const owned = ownedHouses(k, asc);
        const hasKendra = owned.some((h) => [4, 7, 10].includes(h));
        const hasTrikona = owned.some((h) => [5, 9].includes(h));

        if (hasKendra && hasTrikona && !seen.has(k)) {
          seen.add(k);
          results.push({
            name: 'Yogakaraka',
            sanskrit: 'Yogakāraka',
            polarity: 'benefic',
            reason:
              `${k} rules both a kendra and a trikona from this ascendant, which makes ` +
              'it the single most useful graha in the chart.',
            strength: 'strong',
            involvedGrahas: [k],
          });
        }
        continue;
      }

      const a = chart.byGraha[k];
      const b = chart.byGraha[t];
      if (!a || !b) continue;

      const key = [k, t].sort().join('-');
      if (seen.has(key)) continue;

      let how: string | null = null;

      if (conjunct(a, b)) how = `joined in the ${ordinal(a.house)} house`;
      else if (aspects(a, b.house) && aspects(b, a.house)) how = 'aspecting each other';
      else if (OWN_SIGNS[k].includes(b.rashi) && OWN_SIGNS[t].includes(a.rashi)) {
        how = 'in an exchange of signs';
      }

      if (!how) continue;

      seen.add(key);
      results.push({
        name: 'Raja Yoga',
        sanskrit: 'Rāja Yoga',
        polarity: 'benefic',
        reason:
          `${k} rules an angle and ${t} rules a trine, and they are ${how}. ` +
          'The classical combination for rise in standing.',
        strength: conjunct(a, b) ? 'strong' : 'moderate',
        involvedGrahas: [k, t],
      });
    }
  }

  return results;
}

/** Dhana yogas: the wealth houses connected to the fortunate ones. */
function dhanaYogas(chart: Chart): YogaResult[] {
  const results: YogaResult[] = [];
  const wealthHouses = [2, 11];
  const fortuneHouses = [1, 5, 9];

  const seen = new Set<string>();

  for (const w of wealthHouses) {
    const wLord = lordOfHouse(chart, w);
    if (!wLord) continue;

    for (const f of fortuneHouses) {
      const fLord = lordOfHouse(chart, f);
      if (!fLord || fLord.graha === wLord.graha) continue;

      const key = [wLord.graha, fLord.graha].sort().join('-');
      if (seen.has(key)) continue;

      if (conjunct(wLord, fLord) || (aspects(wLord, fLord.house) && aspects(fLord, wLord.house))) {
        seen.add(key);
        results.push({
          name: 'Dhana Yoga',
          sanskrit: 'Dhana Yoga',
          polarity: 'benefic',
          reason:
            `The lord of the ${ordinal(w)} and the lord of the ${ordinal(f)} are ` +
            `${conjunct(wLord, fLord) ? 'joined' : 'in mutual aspect'}. ` +
            'A classical wealth combination.',
          strength: 'moderate',
          involvedGrahas: [wLord.graha, fLord.graha],
        });
      }
    }
  }

  return results;
}

/**
 * Vipreet Raja yoga.
 *
 * A lord of the sixth, eighth or twelfth placed in another of those houses.
 * The classical reading is that difficulty turned inward cancels itself and
 * becomes an unexpected rise.
 */
function vipreetRajaYogas(chart: Chart): YogaResult[] {
  const names: Record<number, string> = { 6: 'Harsha', 8: 'Sarala', 12: 'Vimala' };
  const results: YogaResult[] = [];

  for (const house of [6, 8, 12]) {
    const lord = lordOfHouse(chart, house);
    if (!lord) continue;

    if ([6, 8, 12].includes(lord.house)) {
      results.push({
        name: `${names[house]} Yoga`,
        sanskrit: names[house],
        polarity: 'benefic',
        reason:
          `The lord of the ${ordinal(house)} sits in the ${ordinal(lord.house)}, another ` +
          'difficult house. A Vipreet Raja yoga, where the harm turns on itself.',
        strength: 'moderate',
        involvedGrahas: [lord.graha],
      });
    }
  }

  return results;
}

/**
 * Neecha Bhanga: cancellation of debilitation.
 *
 * Applied because a debilitated graha reported as simply ruined, with no check
 * for the classical cancellations, misreads a great many charts.
 */
function neechaBhanga(chart: Chart): YogaResult[] {
  const results: YogaResult[] = [];

  for (const p of chart.planets) {
    if (p.dignity !== 'debilitated' || !isNavagraha(p.graha)) continue;

    const reasons: string[] = [];

    // The lord of the sign of debilitation is in a kendra from the ascendant
    // or the Moon.
    const dispositor = chart.byGraha[RASHI_LORD[p.rashi]];
    if (dispositor && KENDRA_HOUSES.includes(dispositor.house - 1)) {
      reasons.push(`${dispositor.graha}, lord of that sign, sits in a kendra`);
    }

    // The graha that would be exalted in that sign is in a kendra.
    const exaltedThere = (Object.keys(OWN_SIGNS) as Graha[]).find(
      (g) => exaltationRashi(g) === p.rashi,
    );
    if (exaltedThere) {
      const other = chart.byGraha[exaltedThere];
      if (other && KENDRA_HOUSES.includes(other.house - 1)) {
        reasons.push(`${exaltedThere}, which is exalted in that sign, sits in a kendra`);
      }
    }

    // The graha is itself in a kendra from the ascendant.
    if (KENDRA_HOUSES.includes(p.house - 1)) {
      reasons.push('it occupies a kendra itself');
    }

    if (reasons.length === 0) continue;

    results.push({
      name: 'Neecha Bhanga Raja Yoga',
      sanskrit: 'Nīcabhaṅga Rāja Yoga',
      polarity: 'benefic',
      reason:
        `${p.graha} is debilitated in ${RASHI_NAMES_EN[p.rashi]}, but the debilitation is ` +
        `cancelled: ${reasons.join(', and ')}. The classical reading is a rise after ` +
        'early difficulty rather than plain misfortune.',
      strength: reasons.length > 1 ? 'strong' : 'moderate',
      involvedGrahas: [p.graha],
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Doshas
// ---------------------------------------------------------------------------

function doshas(chart: Chart): YogaResult[] {
  const results: YogaResult[] = [];

  const sun = chart.byGraha.Sun;
  const moon = chart.byGraha.Moon;
  const mars = chart.byGraha.Mars;
  const jupiter = chart.byGraha.Jupiter;
  const saturn = chart.byGraha.Saturn;
  const rahu = chart.byGraha.Rahu;
  const ketu = chart.byGraha.Ketu;

  // Guru Chandal: Jupiter with Rahu or Ketu.
  if (jupiter && rahu && conjunct(jupiter, rahu)) {
    results.push({
      name: 'Guru Chandal Dosha',
      sanskrit: 'Guru Cāṇḍāla',
      polarity: 'mixed',
      reason:
        `Jupiter and Rahu are together in the ${ordinal(jupiter.house)} house. Read as ` +
        'unconventional wisdom, and as a tendency to question or discard received ' +
        'guidance. Not purely negative: many original thinkers carry it.',
      strength: 'moderate',
      involvedGrahas: ['Jupiter', 'Rahu'],
    });
  }

  // Angarak: Mars with Rahu.
  if (mars && rahu && conjunct(mars, rahu)) {
    results.push({
      name: 'Angarak Dosha',
      sanskrit: 'Aṅgāraka',
      polarity: 'malefic',
      reason:
        `Mars and Rahu are together in the ${ordinal(mars.house)} house, read as a ` +
        'quick temper and impulsive action that later has to be undone.',
      strength: 'moderate',
      involvedGrahas: ['Mars', 'Rahu'],
    });
  }

  // Shrapit: Saturn with Rahu.
  if (saturn && rahu && conjunct(saturn, rahu)) {
    results.push({
      name: 'Shrapit Dosha',
      sanskrit: 'Śrāpita',
      polarity: 'malefic',
      reason:
        `Saturn and Rahu are together in the ${ordinal(saturn.house)} house. A late ` +
        'combination, not classical, read as delay and obstruction that lifts with age.',
      strength: 'moderate',
      involvedGrahas: ['Saturn', 'Rahu'],
    });
  }

  // Grahan: a luminary with a node.
  for (const node of [rahu, ketu]) {
    if (!node) continue;
    for (const light of [sun, moon]) {
      if (!light) continue;
      if (conjunct(light, node)) {
        results.push({
          name: 'Grahan Dosha',
          sanskrit: 'Grahaṇa',
          polarity: 'malefic',
          reason:
            `${light.graha} is joined by ${node.graha} in the ${ordinal(light.house)} house, ` +
            `the eclipse combination. Read as pressure on ` +
            `${light.graha === 'Sun' ? 'confidence and the father' : 'the emotions and the mother'}.`,
          strength: 'moderate',
          involvedGrahas: [light.graha, node.graha],
        });
      }
    }
  }

  // Pitra dosha: the Sun with Rahu or Ketu, or afflicted in the ninth.
  if (sun && rahu && (conjunct(sun, rahu) || (sun.house === 9 && aspects(rahu, 9)))) {
    results.push({
      name: 'Pitra Dosha',
      sanskrit: 'Pitṛ Doṣa',
      polarity: 'malefic',
      reason:
        'The Sun is afflicted by Rahu, traditionally read as unfinished obligation ' +
        'towards the paternal line. Remedies are offered to ancestors rather than grahas.',
      strength: 'moderate',
      involvedGrahas: ['Sun', 'Rahu'],
    });
  }

  // Shakat: the Moon in the sixth, eighth or twelfth from Jupiter.
  if (moon && jupiter) {
    const fromJupiter = signDistance(jupiter.rashi, moon.rashi);
    if ([6, 8, 12].includes(fromJupiter)) {
      results.push({
        name: 'Shakat Yoga',
        sanskrit: 'Śakaṭa',
        polarity: 'malefic',
        reason:
          `The Moon stands in the ${ordinal(fromJupiter)} from Jupiter, read as fortune ` +
          'that rises and falls rather than holding steady.',
        strength: 'weak',
        involvedGrahas: ['Moon', 'Jupiter'],
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Kalsarpa
// ---------------------------------------------------------------------------

/**
 * The twelve named Kalsarpa forms, by the house Rahu occupies.
 */
export const KALSARPA_TYPES: { name: string; said: string }[] = [
  { name: 'Anant', said: 'restlessness about the self and identity' },
  { name: 'Kulik', said: 'strain around family, speech and early savings' },
  { name: 'Vasuki', said: 'friction with siblings, and courage that comes late' },
  { name: 'Shankhpal', said: 'unsettledness about home, property and the mother' },
  { name: 'Padma', said: 'delay or difficulty concerning children and education' },
  { name: 'Mahapadma', said: 'recurring obstacles, disputes and health irritations' },
  { name: 'Takshak', said: 'turbulence in marriage and partnership' },
  { name: 'Karkotak', said: 'sudden reversals, and matters inherited or hidden' },
  { name: 'Shankhachud', said: 'a difficult relationship with belief, luck and the father' },
  { name: 'Ghatak', said: 'obstruction in career and standing' },
  { name: 'Vishdhar', said: 'gains that arrive slowly and networks that shift' },
  { name: 'Sheshnag', said: 'expenditure, foreign matters and hidden opposition' },
];

export interface KalsarpaResult {
  present: boolean;
  partial: boolean;
  /** 1 to 12, the type index, or null when absent. */
  typeIndex: number | null;
  typeName: string | null;
  saidToSignify: string | null;
  rahuHouse: number;
  ketuHouse: number;
  /** Grahas that fall outside the Rahu Ketu arc, for a partial reading. */
  outside: AnyGraha[];
  note: string;
}

/**
 * Kalsarpa detection.
 *
 * Formed when the seven grahas from the Sun to Saturn all lie within the arc
 * running one way from Rahu to Ketu. Partial when a single graha falls outside.
 *
 * Historically honest note, carried through to the interface: this does not
 * appear in Brihat Parashara Hora Shastra, Saravali, Phaladeepika or Jataka
 * Parijata. It emerges in twentieth century popular astrology. It is computed
 * here because people ask for it, and labelled for what it is.
 */
export function kalsarpa(chart: Chart): KalsarpaResult {
  const rahu = chart.byGraha.Rahu;
  const ketu = chart.byGraha.Ketu;

  const seven: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  const note =
    'Kalsarpa does not appear in the classical texts. It is a twentieth century ' +
    'addition to popular astrology, and many practising astrologers give it no ' +
    'weight at all. It is shown here because people ask about it, described as ' +
    'what it is claimed to mean rather than as established doctrine.';

  if (!rahu || !ketu) {
    return {
      present: false, partial: false, typeIndex: null, typeName: null,
      saidToSignify: null, rahuHouse: 0, ketuHouse: 0, outside: [], note,
    };
  }

  /*
    Measure each graha's distance forward from Rahu. Everything strictly inside
    the half circle from Rahu to Ketu is on one side; anything past 180 is on
    the other. Using the longitude rather than the house matters, since a graha
    can share Rahu's sign while sitting on the far side of the axis.
  */
  const arcFromRahu = (longitude: number) => {
    const d = (longitude - rahu.longitude) % 360;
    return d < 0 ? d + 360 : d;
  };

  const sideA: AnyGraha[] = [];
  const sideB: AnyGraha[] = [];

  for (const graha of seven) {
    const p = chart.byGraha[graha];
    if (!p) continue;
    (arcFromRahu(p.longitude) < 180 ? sideA : sideB).push(graha);
  }

  const allOneSide = sideA.length === 0 || sideB.length === 0;
  const outside = sideA.length === 0 ? [] : sideB.length === 0 ? [] : sideA.length < sideB.length ? sideA : sideB;
  const partial = !allOneSide && outside.length === 1;

  if (!allOneSide && !partial) {
    return {
      present: false, partial: false, typeIndex: null, typeName: null,
      saidToSignify: null,
      rahuHouse: rahu.house, ketuHouse: ketu.house, outside: [], note,
    };
  }

  const type = KALSARPA_TYPES[rahu.house - 1];

  return {
    present: true,
    partial,
    typeIndex: rahu.house,
    typeName: type.name,
    saidToSignify: type.said,
    rahuHouse: rahu.house,
    ketuHouse: ketu.house,
    outside,
    note,
  };
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export interface YogaReport {
  yogas: YogaResult[];
  doshas: YogaResult[];
  kalsarpa: KalsarpaResult;
  /** Names only, for the research column and for quick filtering. */
  names: string[];
}

export function detectYogas(chart: Chart): YogaReport {
  const positive = [
    ...panchMahapurusha(chart),
    ...lunarYogas(chart),
    ...conjunctionYogas(chart),
    ...rajaYogas(chart),
    ...dhanaYogas(chart),
    ...vipreetRajaYogas(chart),
    ...neechaBhanga(chart),
  ];

  const yogas = positive.filter((y) => y.polarity !== 'malefic');
  const negative = [...positive.filter((y) => y.polarity === 'malefic'), ...doshas(chart)];

  const sarpa = kalsarpa(chart);

  /*
    The findings list keeps every occurrence, because several distinct Raja or
    Dhana yogas from different lord pairs are genuinely separate results and
    collapsing them would lose information.

    The names list is deduplicated, because it feeds the research column and
    filtering, where "Raja Yoga" appearing eight times says nothing that "Raja
    Yoga" appearing once does not.
  */
  const names = [
    ...new Set([
      ...yogas.map((y) => y.name),
      ...negative.map((y) => y.name),
      ...(sarpa.present ? [`Kalsarpa (${sarpa.typeName})`] : []),
    ]),
  ];

  return { yogas, doshas: negative, kalsarpa: sarpa, names };
}

function ordinal(n: number): string {
  const suffix =
    n % 10 === 1 && n % 100 !== 11
      ? 'st'
      : n % 10 === 2 && n % 100 !== 12
        ? 'nd'
        : n % 10 === 3 && n % 100 !== 13
          ? 'rd'
          : 'th';
  return `${n}${suffix}`;
}

export { DUSTHANA_HOUSES, debilitationRashi, malefics };
