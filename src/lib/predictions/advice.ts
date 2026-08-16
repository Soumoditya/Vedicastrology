import { DIGNITY_RANK } from '@/lib/astro/dignity';
import { vargaRashi } from '@/lib/astro/divisional';
import { GRAHA_DEITY, GRAHA_DIRECTION } from '@/lib/astro/ghataka';
import { RASHI_LORD, RASHI_NAMES_EN, type AnyGraha, type Graha } from '@/lib/astro/constants';
import { REMEDY_TABLE } from './remedies';
import type { Chart, PlanetPosition } from '@/lib/astro/types';

/**
 * Practical and religious advice, derived from the chart.
 *
 * The site could already say what a chart contains and what the tradition
 * prescribes for an afflicted graha. What it could not say was the thing people
 * actually want, which is what to do on a Tuesday.
 *
 * Two halves, deliberately kept apart:
 *
 *   Practical advice is conduct. It comes from which houses are supported and
 *   which are strained, and from the graha currently running. It never tells
 *   anybody to avoid a doctor, delay a treatment, or make a financial decision
 *   on the strength of a transit. The safety rules in ./safety.ts are run over
 *   the generated prose, and this module is written so that they never fire.
 *
 *   Religious practice is devotional. Ishta devata, the deity of one's own
 *   inclination, is derived the classical way rather than assigned by sun sign:
 *   from the lord of the twelfth house counted from the Atmakaraka, the graha
 *   holding the highest degree in the chart. That derivation is Jaimini, it is
 *   the one a traditional astrologer will use, and stating the derivation lets
 *   somebody check it.
 *
 * Everything here is deterministic. No model is called, so the advice cannot
 * drift between two views of the same chart, and it costs nothing to produce.
 */

export interface AdviceItem {
  /** A short heading, for the report's table of contents. */
  area: string;
  /** The advice itself. Conduct, phrased as something to do. */
  body: string;
  /** Why the chart says this, so it can be checked rather than believed. */
  because: string;
}

export interface ReligiousAdvice {
  /** The graha whose deity is the ishta devata. */
  ishtaGraha: AnyGraha;
  ishtaDevata: string;
  /** How the ishta graha was arrived at. */
  derivation: string;
  atmakaraka: AnyGraha;
  fastingDay: string;
  mantra: string;
  mantraCount: number;
  charity: string;
  direction: string;
  /** Practices that suit the chart's overall temper. */
  practices: string[];
}

export interface AdviceReport {
  practical: AdviceItem[];
  religious: ReligiousAdvice;
  /** The two or three things that matter most, for the summary page. */
  headline: string[];
  note: string;
}

/** House significations, phrased as the part of life rather than the label. */
const HOUSE_AREA: Record<number, string> = {
  1: 'health and how you carry yourself',
  2: 'money kept, family and speech',
  3: 'courage, effort and siblings',
  4: 'home, peace of mind and the mother',
  5: 'children, learning and judgement',
  6: 'work, obligation and health under strain',
  7: 'partnership and marriage',
  8: 'what is hidden, inherited or shared',
  9: 'belief, fortune and the father',
  10: 'work in the world and standing',
  11: 'income, gain and the people around you',
  12: 'expense, retreat and what is left behind',
};

/** What to do more of when a graha is running well. */
const GRAHA_LEAN: Record<string, string> = {
  Sun: 'Take the visible role rather than the supporting one. Speak to people senior to you directly.',
  Moon: 'Keep a regular sleep and eating rhythm. Work near water or greenery if you can choose.',
  Mars: 'Physical effort and clear deadlines suit this period. Start the thing that needs starting.',
  Mercury: 'Write things down, sign the paperwork, learn the skill. Communication is the lever now.',
  Jupiter: 'Teach, study, or take the advice of somebody older. Generosity returns during this period.',
  Venus: 'Attend to relationships and to the look of things. Comfort spent on now is not wasted.',
  Saturn: 'Do the slow, unglamorous work properly. What is built carefully now outlasts you.',
  Rahu: 'Unfamiliar ground favours you. Take the foreign, the technical, the unconventional route.',
  Ketu: 'Withdraw a little. Depth over breadth, and finishing over starting.',
};

/** What to be careful of when a graha is under strain. */
const GRAHA_CAUTION: Record<string, string> = {
  Sun: 'Avoid contests of pride with people who hold authority over you. Being right is not the same as winning.',
  Moon: 'Guard your rest and your company. Low mood in this period is a passing weather, not a verdict on your life.',
  Mars: 'Slow down on the road and in argument. Anger costs more than it gains here.',
  Mercury: 'Read the contract twice. Misunderstandings in this period come from haste, not from bad faith.',
  Jupiter: 'Do not over-promise. Optimism runs ahead of what can be delivered.',
  Venus: 'Do not spend to feel better, and do not settle a relationship question in a hurry.',
  Saturn: 'Expect delay and plan for it rather than fighting it. Cutting corners is the expensive choice now.',
  Rahu: 'Be wary of a shortcut that seems too good. Verify who you are dealing with.',
  Ketu: 'Do not let detachment turn into neglect of things that need attending to.',
};

export function advice(chart: Chart, runningLord?: AnyGraha): AdviceReport {
  const planets = chart.planets;

  const strong = [...planets]
    .filter((p) => DIGNITY_RANK[p.dignity] >= 3 && !p.combust)
    .sort((a, b) => DIGNITY_RANK[b.dignity] - DIGNITY_RANK[a.dignity]);

  const weak = [...planets]
    .filter((p) => DIGNITY_RANK[p.dignity] <= -1 || p.combust)
    .sort((a, b) => DIGNITY_RANK[a.dignity] - DIGNITY_RANK[b.dignity]);

  const practical: AdviceItem[] = [];

  // What the chart supports.
  for (const p of strong.slice(0, 3)) {
    practical.push({
      area: HOUSE_AREA[p.house] ?? `the ${p.house} house`,
      body:
        `${p.graha} is well placed here, so this is ground you can push on. ` +
        (GRAHA_LEAN[p.graha] ?? ''),
      because: `${p.graha} is ${readable(p.dignity)} in the ${ordinal(p.house)} house.`,
    });
  }

  // What the chart strains under. Phrased as care, never as prohibition.
  for (const p of weak.slice(0, 3)) {
    practical.push({
      area: HOUSE_AREA[p.house] ?? `the ${p.house} house`,
      body:
        `${p.graha} is under pressure here, so this area asks for patience rather than force. ` +
        (GRAHA_CAUTION[p.graha] ?? ''),
      because: p.combust
        ? `${p.graha} is combust, too close to the Sun to act freely, in the ${ordinal(p.house)} house.`
        : `${p.graha} is ${readable(p.dignity)} in the ${ordinal(p.house)} house.`,
    });
  }

  // The period that is actually running, which is what people are asking about.
  if (runningLord) {
    const p = planets.find((x) => x.graha === runningLord);
    const supported = p ? DIGNITY_RANK[p.dignity] >= 2 : false;

    practical.push({
      area: 'the period you are in',
      body: supported
        ? `The ${runningLord} period is running and ${runningLord} is well placed in your chart, so this is a period to act in rather than wait through. ${GRAHA_LEAN[runningLord] ?? ''}`
        : `The ${runningLord} period is running and ${runningLord} is not comfortably placed in your chart, so expect the period to ask more of you than it gives back at first. ${GRAHA_CAUTION[runningLord] ?? ''}`,
      because: p
        ? `${runningLord} is ${readable(p.dignity)} in the ${ordinal(p.house)} house, and its mahadasha is current.`
        : `The ${runningLord} mahadasha is current.`,
    });
  }

  const religious = religiousAdvice(chart);

  const headline = [
    strong[0] ? `Your strength is ${HOUSE_AREA[strong[0].house] ?? 'this chart'}.` : '',
    weak[0] ? `Your care is ${HOUSE_AREA[weak[0].house] ?? 'this chart'}.` : '',
    `Your ishta devata is ${religious.ishtaDevata}.`,
  ].filter(Boolean);

  return {
    practical,
    religious,
    headline,
    note:
      'This advice is drawn from the chart by fixed rules, not written for you ' +
      'by hand, and it is general by nature. It is not medical, legal or ' +
      'financial advice. Nothing here is a reason to delay seeing a doctor or ' +
      'to make a decision you would not otherwise make.',
  };
}

/**
 * The Atmakaraka, and from it the ishta devata.
 *
 * Atmakaraka is the graha holding the highest degree within its sign, the seven
 * classical grahas only. From the navamsa position of that graha, the twelfth
 * house is the Jivanmuktamsa, and its lord's deity is the ishta devata. The
 * navamsa step is approximated here from the natal longitude, which is exact
 * for this purpose: the twelfth from a position is a function of the position,
 * and the navamsa sign is derived from the same longitude.
 */
function religiousAdvice(chart: Chart): ReligiousAdvice {
  const candidates = chart.planets.filter(
    (p) => p.graha !== 'Rahu' && p.graha !== 'Ketu' && isClassical(p.graha),
  );

  const atmakaraka = candidates.reduce<PlanetPosition>(
    (best, p) => (p.degreeInRashi > best.degreeInRashi ? p : best),
    candidates[0],
  );

  // The navamsa sign comes from the divisional engine rather than being worked
  // out again here. An earlier version of this did its own arithmetic and got
  // it wrong, dividing the whole-zodiac longitude instead of the degree within
  // the sign, which quietly named the wrong deity.
  const navamsaSign = vargaRashi(atmakaraka.longitude, 'D9');

  // The twelfth from there, and its lord.
  const twelfth = (navamsaSign + 11) % 12;
  const ishtaGraha = RASHI_LORD[twelfth];

  const entry = REMEDY_TABLE[ishtaGraha as Graha];

  // Functional nature, not natural: what a graha does for this ascendant is
  // the thing that decides whether charity or service suits the chart better.
  const benefics = chart.planets.filter((p) => p.functionalNature === 'benefic').length;
  const practices = [
    `Light a lamp on ${entry?.fastingDay ?? 'your favourable day'}, facing ${GRAHA_DIRECTION[ishtaGraha] ?? 'east'}.`,
    'Keep the practice small and daily rather than large and occasional. A tradition kept for a year at five minutes a day does more than one grand observance.',
    benefics >= 4
      ? 'Charity suits this chart particularly. Give quietly and without announcing it.'
      : 'Service suits this chart more than ritual. Time given to somebody who needs it counts.',
  ];

  return {
    ishtaGraha,
    ishtaDevata: GRAHA_DEITY[ishtaGraha] ?? '',
    derivation:
      `${atmakaraka.graha} holds the highest degree within its sign, so it is ` +
      `the Atmakaraka. In the navamsa it falls in ${RASHI_NAMES_EN[navamsaSign]}; ` +
      `the twelfth sign from there is ${RASHI_NAMES_EN[twelfth]}, ruled by ` +
      `${ishtaGraha}, and that is the graha whose deity the Jaimini method ` +
      'names as the ishta devata.',
    atmakaraka: atmakaraka.graha,
    fastingDay: entry?.fastingDay ?? '',
    mantra: entry?.mantra ?? '',
    mantraCount: entry?.mantraCount ?? 0,
    charity: entry?.charity ?? '',
    direction: GRAHA_DIRECTION[ishtaGraha] ?? '',
    practices,
  };
}

// ---------------------------------------------------------------------------

function isClassical(graha: string): boolean {
  return ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(graha);
}

function readable(dignity: string): string {
  return dignity.replace(/_/g, ' ');
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
