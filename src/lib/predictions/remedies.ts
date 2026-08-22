import { GRAHA_NAMES_SA, GRAHAS, type Graha } from '@/lib/astro/constants';
import { DIGNITY_RANK } from '@/lib/astro/dignity';
import type { Chart, PlanetPosition } from '@/lib/astro/types';
import { detectYogas } from '@/lib/astro/yogas';
import { mangalDosha } from '@/lib/astro/matching';
import { GRAHA_CAUTION, GRAHA_LEAN, GRAHA_TIPS, HOUSE_AREA } from './graha-guidance';

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
 *   Gemstones last, and on their own page. They are the most sold and the least
 *   supported: no classical text makes a stone the primary remedy, the
 *   prescriptions disagree with each other, and the cost is the reason they get
 *   recommended so often. Saying so is more useful than another shop.
 *
 * Nothing here implies that skipping a remedy invites harm. The safety filter
 * has a rule against exactly that, and this table is written to the same
 * standard.
 *
 * ---------------------------------------------------------------------------
 *
 * Every graha, not only the afflicted ones.
 *
 * This used to emit a graha only when something was wrong with it, which had
 * two consequences worth naming. A clean chart got a page saying "nothing here
 * needs propping up" and nothing else — technically honest, and useless to
 * somebody who came to find out what their chart asks of them. And a chart with
 * three afflictions got three grahas, presented as though the other six had no
 * bearing on anything.
 *
 * So all nine are read now, each with its condition stated plainly and traced
 * to what was found, strained ones first. A graha that is doing well still has
 * something to say — it says where you can push — and that is the half of a
 * kundali the old page could not reach.
 */

export type RemedyKind = 'conduct' | 'charity' | 'fasting' | 'mantra';

/** How this chart holds a graha. Drives the ordering and the tone. */
export type GrahaCondition = 'strained' | 'mixed' | 'supported';

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

/**
 * How a stone is traditionally worn.
 *
 * Recorded because these are the details the prescriptions actually disagree
 * about, and a page that lists a stone without them is only half of the claim.
 * Metal, finger and day are the three that vary between sources; where a common
 * alternative exists it is named rather than silently picked.
 */
export interface GemstoneConvention {
  stone: string;
  metal: string;
  finger: string;
  day: string;
  /** The cheaper stone traditionally accepted in its place. */
  substitute: string;
}

const GEMSTONE_CONVENTION: Record<Graha, GemstoneConvention> = {
  Sun: { stone: 'Ruby', metal: 'Gold', finger: 'Ring finger', day: 'Sunday, at sunrise', substitute: 'Red garnet or red spinel' },
  Moon: { stone: 'Pearl', metal: 'Silver', finger: 'Little finger', day: 'Monday, evening', substitute: 'Moonstone' },
  Mars: { stone: 'Red coral', metal: 'Copper or gold', finger: 'Ring finger', day: 'Tuesday, at sunrise', substitute: 'Carnelian' },
  Mercury: { stone: 'Emerald', metal: 'Gold', finger: 'Little finger', day: 'Wednesday, at sunrise', substitute: 'Green tourmaline or peridot' },
  Jupiter: { stone: 'Yellow sapphire', metal: 'Gold', finger: 'Index finger', day: 'Thursday, at sunrise', substitute: 'Yellow topaz or citrine' },
  Venus: { stone: 'Diamond', metal: 'Silver or platinum', finger: 'Middle finger', day: 'Friday, at sunrise', substitute: 'White sapphire or zircon' },
  Saturn: { stone: 'Blue sapphire', metal: 'Iron, steel or silver', finger: 'Middle finger', day: 'Saturday, evening', substitute: 'Amethyst or lapis lazuli' },
  Rahu: { stone: 'Hessonite', metal: 'Silver', finger: 'Middle finger', day: 'Saturday, evening', substitute: 'Orange zircon' },
  Ketu: { stone: 'Cat’s eye', metal: 'Silver', finger: 'Ring finger', day: 'Tuesday, evening', substitute: 'Chrysoberyl' },
};

const GEMSTONE_CAVEAT =
  'Gemstones are listed last on purpose. No classical text makes a stone the ' +
  'primary remedy, the prescriptions disagree with one another, and they are ' +
  'expensive, which is a large part of why they are recommended so often. ' +
  'Treat this as information about the tradition rather than as advice to buy ' +
  'anything.';

export interface GrahaReading {
  graha: Graha;
  condition: GrahaCondition;
  /** House it occupies, for the practical advice. */
  house: number;
  /** Every finding, good and bad, so a claim can be checked rather than believed. */
  reasons: string[];
  /** What this placement means for a part of life, phrased as conduct. */
  practical: string;
  /** Small, keepable habits. */
  tips: string[];
  measures: Remedy[];
}

export interface RemedyReport {
  /** All nine, strained first. */
  grahas: GrahaReading[];
  /** Flat list, for anything that wants the measures without the grouping. */
  remedies: Remedy[];
  /** Always shown. */
  note: string;
}

/**
 * Read every graha in the chart, and say what the tradition suggests for it.
 *
 * A graha's condition comes from its own state, not from a general impression:
 * its dignity, whether it is combust, whether it sits in a dusthana, whether an
 * affliction the engine detected names it. The same evidence that used to
 * decide whether to mention a graha at all now decides how it is described.
 */
export function remedies(chart: Chart): RemedyReport {
  const reasons = new Map<Graha, string[]>();
  const strain = new Map<Graha, number>();

  const add = (graha: Graha, reason: string, weight: number) => {
    const list = reasons.get(graha) ?? [];
    if (!list.includes(reason)) list.push(reason);
    reasons.set(graha, list);
    strain.set(graha, (strain.get(graha) ?? 0) + weight);
  };

  const byGraha = new Map<Graha, PlanetPosition>();

  for (const p of chart.planets) {
    const graha = p.graha as Graha;
    if (!(graha in TABLE)) continue;
    byGraha.set(graha, p);

    // Dignity, in both directions. The old version only looked down.
    if (p.dignity === 'debilitated') {
      add(graha, `${graha} is debilitated in this chart.`, 3);
    } else if (p.dignity === 'enemy' || p.dignity === 'great_enemy') {
      add(graha, `${graha} sits in an unfriendly sign.`, 2);
    } else if (DIGNITY_RANK[p.dignity] >= 4) {
      add(graha, `${graha} is ${readable(p.dignity)}, which is as strong as placement gets.`, -3);
    } else if (DIGNITY_RANK[p.dignity] >= 2) {
      add(graha, `${graha} sits in a friendly sign.`, -1);
    }

    if (p.combust) add(graha, `${graha} is combust, too close to the Sun to act freely.`, 2);
    if (p.retrograde) {
      add(graha, `${graha} is retrograde, so its results tend to arrive late and inwardly.`, 0);
    }

    // The sixth, eighth and twelfth. A graha there works against friction.
    if ([6, 8, 12].includes(p.house)) {
      add(graha, `${graha} occupies the ${ordinal(p.house)} house, where its results come with difficulty.`, 2);
    } else if ([1, 4, 5, 7, 9, 10].includes(p.house)) {
      add(graha, `${graha} occupies the ${ordinal(p.house)} house, a kendra or trikona, which supports it.`, -1);
    }
  }

  // Anything the affliction engine named, since those are the findings a
  // person is most likely to have come here about.
  const report = detectYogas(chart);
  for (const dosha of report.doshas) {
    for (const graha of dosha.involvedGrahas) {
      if (graha in TABLE) add(graha as Graha, `${graha} is involved in ${dosha.name}.`, 2);
    }
  }
  for (const yoga of report.yogas) {
    for (const graha of yoga.involvedGrahas) {
      if (graha in TABLE) add(graha as Graha, `${graha} forms ${yoga.name}.`, -1);
    }
  }

  const manglik = mangalDosha(chart);
  if (manglik.present && !manglik.cancelled) {
    add('Mars', 'Mars carries Mangal dosha in this chart, uncancelled.', 2);
  }

  const out: Remedy[] = [];

  const grahas: GrahaReading[] = GRAHAS.filter((g): g is Graha => g in TABLE).map((graha) => {
    const t = TABLE[graha];
    const position = byGraha.get(graha);
    const house = position?.house ?? 1;
    const found = reasons.get(graha) ?? [`${graha} shows nothing unusual in this chart.`];
    const score = strain.get(graha) ?? 0;

    const condition: GrahaCondition = score >= 2 ? 'strained' : score <= -2 ? 'supported' : 'mixed';
    const because = found[0];

    /*
      The area goes in a prepositional phrase, not in the subject.

      `HOUSE_AREA` entries are noun *lists* — "money kept, family and speech" —
      so any sentence that makes one the subject has to agree with a number that
      varies per house, and "home, peace of mind and the mother responds to" is
      what that produced. Phrasing it as "in <area>" sidesteps the agreement
      entirely and reads the same for one noun or three.
    */
    const area = HOUSE_AREA[house] ?? `the ${ordinal(house)} house`;
    const practical =
      condition === 'supported'
        ? `${graha} is well placed here, so you have ground to push on in ${area}. ${GRAHA_LEAN[graha] ?? ''}`
        : condition === 'strained'
          ? `${graha} is under pressure here, so go patiently in ${area} rather than forcing it. ${GRAHA_CAUTION[graha] ?? ''}`
          : `${graha} is neither strong nor afflicted here, so steady attention pays off in ${area} more than effort in bursts. ${GRAHA_LEAN[graha] ?? ''}`;

    const measures: Remedy[] = [
      {
        kind: 'conduct',
        graha,
        because,
        action: `${t.conduct} What is being cultivated here is ${t.quality}.`,
      },
      { kind: 'charity', graha, because, action: t.charity },
      {
        kind: 'fasting',
        graha,
        because,
        action: `A simple fast on ${t.fastingDay}, if fasting suits you. Skip this if there is any medical reason not to.`,
      },
      {
        kind: 'mantra',
        graha,
        because,
        action: `${t.mantra}, traditionally ${t.mantraCount.toLocaleString('en-IN')} repetitions, ${GRAHA_NAMES_SA[graha]}.`,
      },
    ];

    out.push(...measures);

    return {
      graha,
      condition,
      house,
      reasons: found,
      practical: practical.trim(),
      tips: GRAHA_TIPS[graha] ?? [],
      measures,
    };
  });

  // Strained first, then mixed, then supported: a page is read top down, and
  // what is under pressure is what somebody came to find.
  const order: Record<GrahaCondition, number> = { strained: 0, mixed: 1, supported: 2 };
  grahas.sort(
    (a, b) =>
      order[a.condition] - order[b.condition] ||
      (strain.get(b.graha) ?? 0) - (strain.get(a.graha) ?? 0),
  );

  return {
    grahas,
    remedies: out,
    note:
      'These are the traditional measures for every graha in your chart, listed ' +
      'with the reason each one appears and with the ones under pressure first. ' +
      'They are offered as practice, not as insurance: nothing bad follows from ' +
      'skipping them, and anybody who tells you otherwise is selling ' +
      'something. Where a measure touches your health, ask a doctor first.',
  };
}

// ---------------------------------------------------------------------------
// Gemstones
// ---------------------------------------------------------------------------

export interface GemstoneEntry {
  graha: Graha;
  convention: GemstoneConvention;
  /** Whether this chart is one the tradition would name this stone for. */
  indicated: boolean;
  /** Why, or why not, in one line traced to the chart. */
  because: string;
  condition: GrahaCondition;
}

export interface GemstoneReport {
  entries: GemstoneEntry[];
  /** The ones a traditional prescription would actually reach for. */
  indicated: GemstoneEntry[];
  caveat: string;
  note: string;
}

/**
 * Which stones this chart would traditionally be given, and the argument
 * against buying any of them.
 *
 * Split out of `remedies()` and given its own page rather than sitting as a
 * greyed-out fifth card under every graha, which is where it was. That
 * placement had the caveat repeated nine times and read as fine print under a
 * recommendation. It is not fine print — it is the most important thing on the
 * subject, and the reason gemstones are the one remedy this site is careful
 * about is that they are the only one with a price tag.
 *
 * A stone is reported as indicated where the graha is strained, which is the
 * condition a strengthening stone is traditionally prescribed for. That is a
 * statement about what the tradition does, not a recommendation to do it.
 */
export function gemstones(chart: Chart): GemstoneReport {
  const report = remedies(chart);

  const entries: GemstoneEntry[] = report.grahas.map((reading) => ({
    graha: reading.graha,
    convention: GEMSTONE_CONVENTION[reading.graha],
    indicated: reading.condition === 'strained',
    because:
      reading.condition === 'strained'
        ? reading.reasons[0]
        : reading.condition === 'supported'
          ? `${reading.graha} is already well placed, and the tradition does not strengthen what is strong.`
          : `${reading.graha} is neither strong nor afflicted here, so no classical rule calls for its stone.`,
    condition: reading.condition,
  }));

  return {
    entries,
    indicated: entries.filter((e) => e.indicated),
    caveat: GEMSTONE_CAVEAT,
    note:
      'Blue sapphire and hessonite in particular are traditionally tested before ' +
      'being worn, and are the two most often sold to people who were told ' +
      'something bad would happen otherwise. Nothing bad happens otherwise. If ' +
      'you do buy a stone, buy it because you want it.',
  };
}

// ---------------------------------------------------------------------------

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

export { TABLE as REMEDY_TABLE, GEMSTONE_CONVENTION, GEMSTONE_CAVEAT };
