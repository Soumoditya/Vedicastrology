import { GRAHA_NAMES_SA, type Graha } from '@/lib/astro/constants';
import type { Chart } from '@/lib/astro/types';
import { detectYogas } from '@/lib/astro/yogas';
import { mangalDosha } from '@/lib/astro/matching';

/**
 * Remedies, as a rule table.
 *
 * Deliberately not written by a language model. A remedy invented on the spot
 * is the exact thing that makes astrology sites untrustworthy, and unlike a
 * reading it is something a person may act on, spend money on, or organise
 * their week around. So this is a fixed table keyed to what the engine actually
 * found, and it says which graha and which finding produced each suggestion.
 *
 * The ordering is a stance, not an accident:
 *
 *   Conduct first. Every classical source treats the cultivation of the
 *   quality a graha governs as the primary remedy, and it is the only one that
 *   is free, immediate and impossible to sell anybody.
 *
 *   Then charity and fasting, which are the traditional second tier.
 *
 *   Then mantra, with counts as they are usually given.
 *
 *   Gemstones last, and flagged. They are the most sold and the least
 *   supported: no classical text makes a stone the primary remedy, the
 *   prescriptions disagree with each other, and the cost is the reason they get
 *   recommended so often. Saying so is more useful than another shop.
 *
 * Nothing here implies that skipping a remedy invites harm. The safety filter
 * has a rule against exactly that, and this table is written to the same
 * standard.
 */

export type RemedyKind = 'conduct' | 'charity' | 'fasting' | 'mantra' | 'gemstone';

export interface Remedy {
  kind: RemedyKind;
  /** What to actually do. */
  action: string;
  /** Why this graha, in one line, traced to what was found. */
  because: string;
  graha: Graha;
  /** True where the measure is contested or costly enough to say so. */
  caveat?: string;
}

interface GrahaRemedy {
  quality: string;
  conduct: string;
  charity: string;
  fastingDay: string;
  mantra: string;
  mantraCount: number;
  gemstone: string;
}

/**
 * The per graha table.
 *
 * Written out in full rather than derived, for the same reason the
 * Ashtakavarga tables are: these are traditional lists that have to match a
 * source, and a clever derivation would only hide a mistake.
 */
const TABLE: Record<Graha, GrahaRemedy> = {
  Sun: {
    quality: 'confidence, and a settled relationship with authority',
    conduct: 'Rise early and see daylight before the day starts making demands. Deal plainly with people in authority rather than avoiding them.',
    charity: 'Wheat, jaggery or copper, given on a Sunday.',
    fastingDay: 'Sunday',
    mantra: 'Om Ghrini Suryaya Namah',
    mantraCount: 7000,
    gemstone: 'Ruby',
  },
  Moon: {
    quality: 'steadiness of mind, and the capacity to be looked after',
    conduct: 'Keep regular sleep, and keep water nearby. Spend time with your mother or with whoever mothered you. Say what you feel to one person rather than carrying it.',
    charity: 'Rice, milk or white cloth, given on a Monday.',
    fastingDay: 'Monday',
    mantra: 'Om Som Somaya Namah',
    mantraCount: 11000,
    gemstone: 'Pearl',
  },
  Mars: {
    quality: 'courage used deliberately rather than spent on friction',
    conduct: 'Put the energy somewhere physical and deliberate, daily. Give an argument a night before answering it. Do one thing that needs nerve.',
    charity: 'Red lentils or red cloth, given on a Tuesday.',
    fastingDay: 'Tuesday',
    mantra: 'Om Kram Kreem Kraum Sah Bhaumaya Namah',
    mantraCount: 10000,
    gemstone: 'Red coral',
  },
  Mercury: {
    quality: 'clear speech, and honesty in small things',
    conduct: 'Write something every day, however short. Keep your word on trivial matters, which is where Mercury is actually tested. Read something harder than you would choose.',
    charity: 'Green gram, or supporting a child’s schooling, on a Wednesday.',
    fastingDay: 'Wednesday',
    mantra: 'Om Bram Breem Braum Sah Budhaya Namah',
    mantraCount: 9000,
    gemstone: 'Emerald',
  },
  Jupiter: {
    quality: 'judgement, and a willingness to be taught',
    conduct: 'Keep a teacher in your life and take their correction. Give time, not only money. Say the true thing when a comfortable one is available.',
    charity: 'Chickpeas, turmeric or yellow cloth, given on a Thursday.',
    fastingDay: 'Thursday',
    mantra: 'Om Gram Greem Graum Sah Gurave Namah',
    mantraCount: 19000,
    gemstone: 'Yellow sapphire',
  },
  Venus: {
    quality: 'discernment about comfort, and fairness in close relationships',
    conduct: 'Keep your surroundings in order, since Venus notices. Be generous with the person closest to you in a way that costs you something. Take one pleasure properly rather than several carelessly.',
    charity: 'Rice, ghee or white flowers, given on a Friday.',
    fastingDay: 'Friday',
    mantra: 'Om Dram Dreem Draum Sah Shukraya Namah',
    mantraCount: 16000,
    gemstone: 'Diamond, or white sapphire in its place',
  },
  Saturn: {
    quality: 'endurance, and doing dull work well',
    conduct: 'Finish what is boring before what is interesting. Keep one commitment for longer than you feel like. Treat people who work for you better than the situation requires.',
    charity: 'Black sesame, iron or blankets, given on a Saturday, and work given to somebody who needs it.',
    fastingDay: 'Saturday',
    mantra: 'Om Praam Preem Praum Sah Shanaye Namah',
    mantraCount: 23000,
    gemstone: 'Blue sapphire',
  },
  Rahu: {
    quality: 'appetite kept in proportion',
    conduct: 'Name what you are chasing and ask plainly whether you want it. Keep one area of life deliberately simple. Stay off whatever you reach for compulsively.',
    charity: 'Mustard, black cloth or sesame, given on a Saturday.',
    fastingDay: 'Saturday',
    mantra: 'Om Bhram Bhreem Bhraum Sah Rahave Namah',
    mantraCount: 18000,
    gemstone: 'Hessonite',
  },
  Ketu: {
    quality: 'detachment that is chosen rather than suffered',
    conduct: 'Keep a practice that has no outcome attached. Give away something you were keeping for no reason. Sit with a question instead of settling it.',
    charity: 'Blankets, or feeding an animal, on a Tuesday or Saturday.',
    fastingDay: 'Tuesday',
    mantra: 'Om Sram Sreem Sraum Sah Ketave Namah',
    mantraCount: 17000,
    gemstone: 'Cat’s eye',
  },
};

const GEMSTONE_CAVEAT =
  'Gemstones are listed last on purpose. No classical text makes a stone the ' +
  'primary remedy, the prescriptions disagree with one another, and they are ' +
  'expensive, which is a large part of why they are recommended so often. ' +
  'Treat this as information about the tradition rather than as advice to buy ' +
  'anything.';

export interface RemedyReport {
  /** The grahas the engine judged to need support, strongest need first. */
  grahas: { graha: Graha; reasons: string[] }[];
  remedies: Remedy[];
  /** Shown wherever gemstones appear. */
  gemstoneNote: string;
  /** Always shown. */
  note: string;
}

/**
 * Which grahas need support, and what the tradition suggests for them.
 *
 * A graha qualifies through its own condition, not through a general
 * impression: debilitated or in an enemy sign, combust, in a dusthana, or named
 * in an affliction the engine detected. Listing every graha would make the page
 * useless, so a chart with nothing wrong returns nothing.
 */
export function remedies(chart: Chart): RemedyReport {
  const needs = new Map<Graha, string[]>();

  const add = (graha: Graha, reason: string) => {
    const list = needs.get(graha) ?? [];
    if (!list.includes(reason)) list.push(reason);
    needs.set(graha, list);
  };

  for (const p of chart.planets) {
    const graha = p.graha as Graha;
    if (!(graha in TABLE)) continue;

    if (p.dignity === 'debilitated') {
      add(graha, `${graha} is debilitated in ${p.rashi === undefined ? 'its sign' : 'this chart'}.`);
    } else if (p.dignity === 'enemy') {
      add(graha, `${graha} sits in an unfriendly sign.`);
    }

    if (p.combust) add(graha, `${graha} is combust, too close to the Sun to act freely.`);

    // The sixth, eighth and twelfth. A graha there works against friction.
    if ([6, 8, 12].includes(p.house)) {
      add(graha, `${graha} occupies the ${p.house}th house, where its results come with difficulty.`);
    }
  }

  // Anything the affliction engine named, since those are the findings a
  // person is most likely to have come here about.
  const report = detectYogas(chart);
  for (const dosha of report.doshas) {
    for (const graha of dosha.involvedGrahas) {
      if (graha in TABLE) add(graha as Graha, `${graha} is involved in ${dosha.name}.`);
    }
  }

  const manglik = mangalDosha(chart);
  if (manglik.present && !manglik.cancelled) {
    add('Mars', 'Mars carries Mangal dosha in this chart, uncancelled.');
  }

  const grahas = [...needs.entries()]
    .map(([graha, reasons]) => ({ graha, reasons }))
    // Most reasons first: a graha flagged three ways needs more attention than
    // one flagged once.
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const out: Remedy[] = [];

  for (const { graha, reasons } of grahas) {
    const t = TABLE[graha];
    const because = reasons[0];

    out.push({
      kind: 'conduct',
      graha,
      because,
      action: `${t.conduct} What is being cultivated here is ${t.quality}.`,
    });
    out.push({ kind: 'charity', graha, because, action: t.charity });
    out.push({
      kind: 'fasting',
      graha,
      because,
      action: `A simple fast on ${t.fastingDay}, if fasting suits you. Skip this if there is any medical reason not to.`,
    });
    out.push({
      kind: 'mantra',
      graha,
      because,
      action: `${t.mantra}, traditionally ${t.mantraCount.toLocaleString('en-IN')} repetitions, ${GRAHA_NAMES_SA[graha]}.`,
    });
    out.push({
      kind: 'gemstone',
      graha,
      because,
      action: `${t.gemstone} is the stone associated with ${graha}.`,
      caveat: GEMSTONE_CAVEAT,
    });
  }

  return {
    grahas,
    remedies: out,
    gemstoneNote: GEMSTONE_CAVEAT,
    note:
      'These are the traditional measures for the grahas your chart shows as ' +
      'needing support, listed with the reason each one appears. They are ' +
      'offered as practice, not as insurance: nothing bad follows from ' +
      'skipping them, and anybody who tells you otherwise is selling ' +
      'something. Where a measure touches your health, ask a doctor first.',
  };
}

export { TABLE as REMEDY_TABLE };
