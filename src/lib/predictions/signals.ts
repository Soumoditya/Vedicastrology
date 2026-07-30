import {
  BHAVA_SIGNIFICATIONS,
  RASHI_NAMES_EN,
  type AnyGraha,
} from '@/lib/astro/constants';
import { ashtakavarga, sarvaVerdict, AV_GRAHAS, type AvGraha } from '@/lib/astro/ashtakavarga';
import { buildVimshottari, dashaAt, upcomingDashaChanges } from '@/lib/astro/dasha';
import { detectYogas } from '@/lib/astro/yogas';
import {
  currentRetrogrades,
  currentTransits,
  gocharaVerdict,
  sadeSati,
  upcomingIngresses,
} from '@/lib/astro/transits';
import type { Chart } from '@/lib/astro/types';

/**
 * The signal extractor.
 *
 * This is the layer that decides what is actually happening in a chart during
 * a period. It is entirely deterministic: the same chart and the same dates
 * always produce the same signals, and every signal is a statement of fact
 * with the rule that produced it attached.
 *
 * The separation matters. The engine computes, the writer only writes. A
 * language model handed these signals is asked to express findings it was
 * given, never to decide what a chart means. If a claim is not in this list,
 * it cannot legitimately appear in the output, which is what makes the whole
 * prediction layer checkable instead of plausible-sounding invention.
 *
 * `statement` is therefore always what the chart does, never what it implies.
 * "Saturn transits the twelfth from the Moon" belongs here. "A hard month for
 * money" does not.
 */

export type SignalKind =
  | 'dasha'
  | 'dasha_change'
  | 'transit'
  | 'sade_sati'
  | 'yoga'
  | 'strength'
  | 'retrograde'
  | 'ingress';

export type Tone = 'supportive' | 'difficult' | 'mixed';

export interface Signal {
  kind: SignalKind;
  /** Stable identifier, so the same condition is recognisable between runs. */
  code: string;
  /** What the chart does. Never what it means. */
  statement: string;
  /** The classical rule this came from, so a reader can check it. */
  rule: string;
  grahas: AnyGraha[];
  /** Houses from the ascendant that this touches, 1 to 12. */
  houses: number[];
  tone: Tone;
  /** 1 background, 5 dominant. Used to decide what a short reading mentions. */
  weight: number;
  window?: { start: string; end: string };
}

export type PeriodName = 'day' | 'week' | 'month' | 'year';

export interface SignalSet {
  period: { name: PeriodName; start: string; end: string };
  /** Sorted by weight, heaviest first. */
  signals: Signal[];
  /** A short factual summary of the dasha, always present. */
  context: {
    ascendant: string;
    moonRashi: string;
    dasha: string;
    sadeSatiPhase: string | null;
  };
}

const PERIOD_DAYS: Record<PeriodName, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};

/** Houses a graha owns, counted from the ascendant. */
function ownedHouses(chart: Chart, graha: AnyGraha): number[] {
  return chart.houses.filter((h) => h.lord === graha).map((h) => h.house);
}

function iso(date: Date): string {
  return date.toISOString();
}

export function extractSignals(
  chart: Chart,
  period: PeriodName,
  at: Date = new Date(),
): SignalSet {
  const start = at;
  const end = new Date(at.getTime() + PERIOD_DAYS[period] * 86_400_000);

  const signals: Signal[] = [];

  // -------------------------------------------------------------------------
  // Dasha. The heaviest thing in any reading, so it is weighted accordingly.
  // -------------------------------------------------------------------------

  const tree = buildVimshottari(chart, { maxLevel: 3 });
  const active = dashaAt(tree, at);

  let dashaLabel = 'none';

  if (active) {
    dashaLabel = [active.maha.lord, active.antar?.lord, active.pratyantar?.lord]
      .filter(Boolean)
      .join(' / ');

    /*
      A dasha lord acts through the houses it owns and the house it sits in.
      That pairing is the single most reliable statement Jyotish makes about a
      period, so both are carried rather than only the lord's name.
    */
    const levels: { level: string; lord: AnyGraha; weight: number; window: { start: Date; end: Date } }[] = [
      { level: 'Mahadasha', lord: active.maha.lord, weight: 5, window: { start: active.maha.start, end: active.maha.end } },
    ];
    if (active.antar) {
      levels.push({
        level: 'Antardasha',
        lord: active.antar.lord,
        weight: 4,
        window: { start: active.antar.start, end: active.antar.end },
      });
    }
    // The pratyantar only matters over a short period. Including it in a
    // yearly reading would give a few weeks the weight of a decade.
    if (active.pratyantar && (period === 'day' || period === 'week')) {
      levels.push({
        level: 'Pratyantardasha',
        lord: active.pratyantar.lord,
        weight: 3,
        window: { start: active.pratyantar.start, end: active.pratyantar.end },
      });
    }

    for (const { level, lord, weight, window } of levels) {
      const position = chart.byGraha[lord];
      if (!position) continue;

      const owns = ownedHouses(chart, lord);

      signals.push({
        kind: 'dasha',
        code: `dasha.${level.toLowerCase()}.${lord}`,
        statement:
          `${level} of ${lord}. ${lord} sits in the ${position.house}th house in ` +
          `${RASHI_NAMES_EN[position.rashi]}, ${position.dignity}` +
          (owns.length ? `, and rules the ${owns.join(' and ')}.` : '.'),
        rule:
          'A dasha lord brings forward the affairs of the houses it rules and ' +
          'the house it occupies.',
        grahas: [lord],
        houses: [...new Set([position.house, ...owns])],
        tone:
          position.dignity === 'exalted' || position.dignity === 'own' || position.dignity === 'moolatrikona'
            ? 'supportive'
            : position.dignity === 'debilitated' || position.dignity === 'enemy'
              ? 'difficult'
              : 'mixed',
        weight,
        window: { start: iso(window.start), end: iso(window.end) },
      });
    }
  }

  // A period change inside the window is worth more than anything else in it.
  for (const change of upcomingDashaChanges(tree, at, 6)) {
    if (change.date > end) continue;
    signals.push({
      kind: 'dasha_change',
      code: `dasha_change.${change.entering}`,
      statement: `The ${change.entering} period begins on ${change.date.toISOString().slice(0, 10)}.`,
      rule: 'A change of dasha lord changes which houses are being activated.',
      grahas: [change.entering as AnyGraha],
      houses: ownedHouses(chart, change.entering as AnyGraha),
      tone: 'mixed',
      weight: 5,
      window: { start: iso(change.date), end: iso(end) },
    });
  }

  // -------------------------------------------------------------------------
  // Transits, judged from the natal Moon as gochara traditionally is.
  // -------------------------------------------------------------------------

  const av = ashtakavarga(chart);
  const transits = currentTransits(chart, at);

  // Over a day or a week the fast grahas matter. Over a year they have moved
  // on long before it ends, so only the slow ones are worth stating.
  const slowOnly = period === 'month' || period === 'year';
  const SLOW: AnyGraha[] = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];

  for (const t of transits) {
    if (slowOnly && !SLOW.includes(t.graha)) continue;
    if (t.graha === 'Moon' && period !== 'day') continue;

    const verdict = gocharaVerdict(t.graha, t.houseFromMoon);

    /*
      Ashtakavarga is what turns a generic transit statement into a specific
      one. The same graha over the same house reads very differently over a
      sign holding six bindus than over one holding two, and this is the only
      place in classical practice that grades a transit numerically.
    */
    const avGraha = AV_GRAHAS.includes(t.graha as AvGraha) ? (t.graha as AvGraha) : null;
    const bindus = avGraha
      ? (av.charts.find((c) => c.graha === avGraha)?.bindus[t.rashi] ?? null)
      : null;

    const support =
      bindus === null ? '' : ` It carries ${bindus} bindus there, out of eight.`;

    signals.push({
      kind: 'transit',
      code: `transit.${t.graha}.h${t.houseFromMoon}`,
      statement:
        `${t.graha} transits ${RASHI_NAMES_EN[t.rashi]}, the ${t.houseFromMoon}th ` +
        `from the natal Moon and the ${t.houseFromAscendant}th from the ascendant.${support}`,
      rule: 'Gochara is read from the Moon, graded by the bindus the sign holds.',
      grahas: [t.graha],
      houses: [t.houseFromAscendant],
      tone:
        verdict === 'favourable' ? 'supportive' : verdict === 'difficult' ? 'difficult' : 'mixed',
      // A slow graha in a strongly supported or wholly unsupported sign is the
      // sort of thing a reading should lead with.
      weight:
        (SLOW.includes(t.graha) ? 3 : 2) +
        (bindus !== null && (bindus >= 6 || bindus <= 1) ? 1 : 0),
    });
  }

  // -------------------------------------------------------------------------
  // Sade Sati
  // -------------------------------------------------------------------------

  const sat = sadeSati(chart, at);
  let sadeSatiPhase: string | null = null;

  if (sat.active && sat.currentPhase) {
    sadeSatiPhase = sat.currentPhase.phase;
    signals.push({
      kind: 'sade_sati',
      code: `sade_sati.${sat.currentPhase.phase}`,
      statement:
        `Sade Sati is running, in its ${sat.currentPhase.phase} phase, with ` +
        `Saturn in ${RASHI_NAMES_EN[sat.currentPhase.rashi]} until ` +
        `${sat.currentPhase.end.toISOString().slice(0, 10)}.`,
      rule:
        'Saturn transiting the sign before the Moon, the Moon’s own sign, ' +
        'and the sign after.',
      grahas: ['Saturn', 'Moon'],
      houses: [],
      tone: 'difficult',
      weight: 5,
      window: { start: iso(sat.currentPhase.start), end: iso(sat.currentPhase.end) },
    });
  }

  // -------------------------------------------------------------------------
  // Yogas the running dasha activates
  //
  // A yoga present in a chart is a standing condition. It becomes an event
  // when its grahas run their period, so only the ones the current dasha
  // touches are emitted; the rest would be noise repeated every month.
  // -------------------------------------------------------------------------

  const report = detectYogas(chart);
  const activeLords = new Set(
    [active?.maha.lord, active?.antar?.lord].filter(Boolean) as AnyGraha[],
  );

  for (const finding of [...report.yogas, ...report.doshas]) {
    if (!finding.involvedGrahas.some((g) => activeLords.has(g))) continue;

    signals.push({
      kind: 'yoga',
      code: `yoga.${finding.name.replace(/\s+/g, '_')}`,
      statement: `${finding.name} is formed, and its grahas are running. ${finding.reason}`,
      rule: 'A yoga expresses itself during the periods of the grahas that form it.',
      grahas: finding.involvedGrahas,
      houses: finding.involvedGrahas
        .map((g) => chart.byGraha[g]?.house)
        .filter((h): h is number => h !== undefined),
      tone:
        finding.polarity === 'benefic'
          ? 'supportive'
          : finding.polarity === 'malefic'
            ? 'difficult'
            : 'mixed',
      weight: finding.strength === 'strong' ? 4 : finding.strength === 'moderate' ? 3 : 2,
    });
  }

  // -------------------------------------------------------------------------
  // Sign strength, for the houses under transit
  // -------------------------------------------------------------------------

  for (const entry of [...av.strongest.slice(0, 1), ...av.weakest.slice(0, 1)]) {
    const house = ((entry.rashi - chart.ascendant.rashi + 12) % 12) + 1;
    const verdict = sarvaVerdict(entry.bindus);

    signals.push({
      kind: 'strength',
      code: `strength.${verdict}.h${house}`,
      statement:
        `${RASHI_NAMES_EN[entry.rashi]}, the ${house}th house, holds ${entry.bindus} ` +
        `Sarvashtakavarga bindus, which is ${verdict}. That house covers ` +
        `${BHAVA_SIGNIFICATIONS[house - 1].toLowerCase()}`,
      rule: 'Sarvashtakavarga grades a sign against an average of about 28.',
      grahas: [],
      houses: [house],
      tone: verdict === 'strong' ? 'supportive' : verdict === 'weak' ? 'difficult' : 'mixed',
      weight: 2,
    });
  }

  // -------------------------------------------------------------------------
  // Retrogrades and ingresses inside the window
  // -------------------------------------------------------------------------

  const retro = currentRetrogrades(chart, at);
  if (retro.length > 0 && period !== 'year') {
    signals.push({
      kind: 'retrograde',
      code: `retrograde.${retro.join('_')}`,
      statement: `${retro.join(', ')} ${retro.length === 1 ? 'is' : 'are'} retrograde.`,
      rule: 'A retrograde graha revisits ground it has already covered.',
      grahas: retro,
      houses: retro
        .map((g) => transits.find((t) => t.graha === g)?.houseFromAscendant)
        .filter((h): h is number => h !== undefined),
      tone: 'mixed',
      weight: 2,
    });
  }

  for (const event of upcomingIngresses(chart, at, 2)) {
    // Only ingresses carry a rashi. Anything else in the event stream has
    // nothing to say about a house, so it is skipped rather than guessed at.
    if (event.date > end || event.rashi === undefined) continue;
    const house = ((event.rashi - chart.ascendant.rashi + 12) % 12) + 1;

    signals.push({
      kind: 'ingress',
      code: `ingress.${event.graha}.${event.rashi}`,
      statement: `${event.description} on ${event.date.toISOString().slice(0, 10)}, the ${house}th house.`,
      rule: 'A slow graha changing sign moves its effects to a different house.',
      grahas: [event.graha],
      houses: [house],
      tone: 'mixed',
      weight: 4,
      window: { start: iso(event.date), end: iso(end) },
    });
  }

  return {
    period: { name: period, start: iso(start), end: iso(end) },
    signals: signals.sort((a, b) => b.weight - a.weight),
    context: {
      ascendant: RASHI_NAMES_EN[chart.ascendant.rashi],
      moonRashi: RASHI_NAMES_EN[chart.byGraha.Moon.rashi],
      dasha: dashaLabel,
      sadeSatiPhase,
    },
  };
}

/**
 * The signals worth putting in front of a writer, trimmed to a period.
 *
 * A daily reading built from thirty signals is a list, not a reading. Cutting
 * by weight rather than by order keeps the strongest ones regardless of where
 * they came from.
 */
export function topSignals(set: SignalSet, limit?: number): Signal[] {
  const defaults: Record<PeriodName, number> = { day: 4, week: 6, month: 9, year: 14 };
  return set.signals.slice(0, limit ?? defaults[set.period.name]);
}
