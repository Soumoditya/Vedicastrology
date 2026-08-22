import 'server-only';

import { RASHI_NAMES_EN, type AnyGraha } from '@/lib/astro/constants';
import { ashtakavarga, AV_GRAHAS, type AvGraha } from '@/lib/astro/ashtakavarga';
import { currentTransits, gocharaVerdict } from '@/lib/astro/transits';
import type { Chart } from '@/lib/astro/types';

/**
 * The day's transits, read.
 *
 * Gochara is counted from a fixed point in the birth chart, and there are two
 * of them. The ascendant is the frame most people expect, because it is the
 * frame the birth chart itself is drawn in. The Moon is the frame the classical
 * transit rules are actually written for — the table of favourable houses in
 * `gocharaVerdict` is a table of houses *from the Moon*, and reading it from the
 * ascendant instead is one of the commonest ways to get a transit reading
 * quietly wrong.
 *
 * So both are computed, both are drawn, and the reading is one reading rather
 * than two. Saying the same nine grahas twice, once per frame, would repeat most
 * of itself: a graha is in one sign today, and the two frames are two ways of
 * counting to it, not two facts. What each statement does carry is which frame
 * it came from, because that is the part a reader needs in order to check it.
 *
 * Deterministic, like every other module here. No model is called, so the same
 * chart on the same day always reads the same way, and every line traces to a
 * classical rule plus an ashtakavarga count.
 */

export type Frame = 'moon' | 'ascendant';

export interface GocharaLine {
  graha: AnyGraha;
  rashi: number;
  retrograde: boolean;
  houseFromMoon: number;
  houseFromAscendant: number;
  /** The classical verdict, which is a judgement from the Moon. */
  verdict: 'favourable' | 'mixed' | 'difficult';
  /** Bindus the transited sign holds in this graha's own ashtakavarga, of eight. */
  bindus: number | null;
  /** Where it stands, in one sentence, naming both counts. */
  statement: string;
  /** What that tends to show as. Conduct, never prediction of event. */
  reading: string;
}

export interface GocharaReading {
  /** Every graha, heaviest first. */
  lines: GocharaLine[];
  /** The two or three worth leading with. */
  headline: string[];
  /** The combined reading, in order. */
  paragraphs: string[];
  note: string;
}

/**
 * What a graha crossing a house tends to ask of somebody.
 *
 * Two registers per graha — one for when the transit is supported, one for when
 * it is not — kept in the tone the rest of the site uses: conduct, phrased as
 * something to do, never an event foretold and never a reason to delay a
 * doctor, a treatment or a decision. `safety.ts` is run over this in the tests.
 */
const TRANSIT_SUPPORTED: Record<string, string> = {
  Sun: 'a good stretch for being seen doing the work, and for asking the person in charge directly rather than going around them',
  Moon: 'the mood runs with you rather than against you; use it for the conversation you have been putting off',
  Mars: 'energy that goes somewhere useful if you give it a task, and somewhere expensive if you do not',
  Mercury: 'paperwork, negotiation and study all move easily; sign the thing, send the message, learn the skill',
  Jupiter: 'advice arrives and is worth taking, and generosity comes back; a good period to be taught',
  Venus: 'comfort, company and anything to do with how things look go well; time spent on a relationship counts double',
  Saturn: 'slow work done properly holds. What is built carefully in this stretch is what is still standing later',
  Rahu: 'unfamiliar ground favours you — the foreign, the technical, the route nobody in the room has taken',
  Ketu: 'depth rather than breadth. A good period to finish something and a poor one to start three things',
};

const TRANSIT_STRAINED: Record<string, string> = {
  Sun: 'pride and authority chafe. Being right and winning are not the same thing this week',
  Moon: 'rest and company need guarding. A low mood in this stretch is weather, not a verdict on your life',
  Mars: 'slow down, on the road and in argument. Anger costs more than it gains here',
  Mercury: 'read it twice before agreeing. Misunderstandings now come from haste rather than bad faith',
  Jupiter: 'do not over-promise. Optimism is running ahead of what can actually be delivered',
  Venus: 'do not spend to feel better, and do not settle a relationship question in a hurry',
  Saturn: 'expect delay and plan around it rather than fighting it. Cutting the corner is the expensive option',
  Rahu: 'be wary of the shortcut that looks too good, and check who you are dealing with',
  Ketu: 'detachment is fine; letting things that need attending to slide is not',
};

/** How much a graha's transit is worth saying out loud. */
const SLOW: AnyGraha[] = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];

export function gocharaReading(chart: Chart, when: Date = new Date()): GocharaReading {
  const positions = currentTransits(chart, when);
  const av = ashtakavarga(chart);

  const lines: GocharaLine[] = positions.map((t) => {
    const verdict = gocharaVerdict(t.graha, t.houseFromMoon);

    /*
      Ashtakavarga is what turns a generic transit statement into a specific
      one. The same graha over the same house reads very differently across a
      sign holding six bindus than one holding two, and this is the only place
      in classical practice that grades a transit numerically. Rahu and Ketu
      have no bhinnashtakavarga of their own, so they carry null rather than a
      number invented for the sake of symmetry.
    */
    const avGraha = AV_GRAHAS.includes(t.graha as AvGraha) ? (t.graha as AvGraha) : null;
    const bindus = avGraha
      ? (av.charts.find((c) => c.graha === avGraha)?.bindus[t.rashi] ?? null)
      : null;

    const supported =
      verdict === 'favourable' || (bindus !== null && bindus >= 5 && verdict !== 'difficult');

    const support =
      bindus === null
        ? ''
        : ` The sign holds ${bindus} of eight bindus in its own ashtakavarga, so the transit is ${
            bindus >= 6 ? 'well supported' : bindus <= 2 ? 'poorly supported' : 'moderately supported'
          }.`;

    return {
      graha: t.graha,
      rashi: t.rashi,
      retrograde: t.retrograde,
      houseFromMoon: t.houseFromMoon,
      houseFromAscendant: t.houseFromAscendant,
      verdict,
      bindus,
      statement:
        `${t.graha} is in ${RASHI_NAMES_EN[t.rashi]}${t.retrograde ? ', retrograde' : ''} — ` +
        `the ${ordinal(t.houseFromMoon)} from your Moon and the ` +
        `${ordinal(t.houseFromAscendant)} from your ascendant.${support}`,
      reading: supported
        ? (TRANSIT_SUPPORTED[t.graha] ?? '')
        : (TRANSIT_STRAINED[t.graha] ?? ''),
    };
  });

  // Heaviest first: a slow graha in a strongly supported or wholly unsupported
  // sign is the thing a reading should lead with, and the Moon changes sign
  // every two and a half days, so it is never the headline.
  const weighted = [...lines].sort((a, b) => weight(b) - weight(a));

  const headline = weighted
    .slice(0, 3)
    .map(
      (l) =>
        `${l.graha}, ${ordinal(l.houseFromMoon)} from the Moon — ${
          l.verdict === 'favourable' ? 'supportive' : l.verdict === 'difficult' ? 'demanding' : 'mixed'
        }.`,
    );

  const favourable = lines.filter((l) => l.verdict === 'favourable');
  const difficult = lines.filter((l) => l.verdict === 'difficult');

  const paragraphs: string[] = [];

  paragraphs.push(
    `Read from your Moon in ${RASHI_NAMES_EN[chart.byGraha.Moon.rashi]}, which is how ` +
      `gochara is traditionally counted, and cross-checked against your ascendant in ` +
      `${RASHI_NAMES_EN[chart.ascendant.rashi]}. Where the two frames disagree the Moon is ` +
      `the one the classical table was written for; the ascendant tells you which part of ` +
      `life the same transit lands in.`,
  );

  for (const l of weighted.slice(0, 3)) {
    if (!l.reading) continue;
    paragraphs.push(
      `${l.statement} From the ascendant that falls in your ${ordinal(l.houseFromAscendant)} house, ` +
        `so ${l.reading}.`,
    );
  }

  if (favourable.length) {
    paragraphs.push(
      `Running with you today: ${list(favourable.map((l) => l.graha))} — each in a house the ` +
        `classical table counts as favourable from the Moon.`,
    );
  }

  if (difficult.length) {
    paragraphs.push(
      `Asking more of you: ${list(difficult.map((l) => l.graha))}, in the fourth, eighth or ` +
        `twelfth from your Moon. That is a description of friction, not of misfortune — these ` +
        `are the houses a transit has to be worked with rather than leaned on.`,
    );
  }

  return {
    lines: weighted,
    headline,
    paragraphs,
    note:
      'Transits are read against the period you are running, never instead of it. ' +
      'A gochara result describes the weather of a few days or a few years depending ' +
      'on the graha; the dasha describes the season. This is general guidance drawn ' +
      'from the chart by fixed rules, not medical, legal or financial advice, and ' +
      'nothing here is a reason to delay seeing a doctor or to make a decision you ' +
      'would not otherwise make.',
  };
}

// ---------------------------------------------------------------------------

function weight(l: GocharaLine): number {
  let w = SLOW.includes(l.graha) ? 3 : l.graha === 'Moon' ? 0 : 1;
  if (l.bindus !== null && (l.bindus >= 6 || l.bindus <= 1)) w += 1;
  if (l.verdict !== 'mixed') w += 1;
  return w;
}

function list(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
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
