import 'server-only';

import { DateTime } from 'luxon';

import { castChart, lagnaLord, rasiLord } from '@/lib/astro/chart';
import { avakhadaChakra, type AvakhadaChakra } from '@/lib/astro/avakhada';
import { ashtakavarga } from '@/lib/astro/ashtakavarga';
import { birthTimeDetails, type BirthTimeDetails } from '@/lib/astro/birthtime';
import { buildVarga } from '@/lib/astro/divisional';
import {
  balanceAtBirthParts,
  buildVimshottari,
  dashaAt,
  formatDashaChain,
  mahadashaList,
  upcomingDashaChanges,
} from '@/lib/astro/dasha';
import { favourablePoints, ghatakaChakra } from '@/lib/astro/ghataka';
import { computePanchang } from '@/lib/astro/panchang';
import { mangalDosha } from '@/lib/astro/matching';
import { currentTransits, sadeSati } from '@/lib/astro/transits';
import { detectYogas } from '@/lib/astro/yogas';
import { chartToRenderData, vargaToRenderData } from '@/lib/chart-render/adapt';
import { advice } from '@/lib/predictions/advice';
import { gemstones, remedies } from '@/lib/predictions/remedies';
import { gocharaReading } from '@/lib/predictions/gochara';
import { NAKSHATRA_NAMES, RASHI_LORD, RASHI_NAMES_EN, type AnyGraha } from '@/lib/astro/constants';
import type { BirthData, Chart } from '@/lib/astro/types';
import type { ChartRenderData } from '@/lib/chart-render/geometry';

/**
 * Assembling the whole report.
 *
 * The report page used to be whichever tool page happened to be open, printed.
 * That gave somebody seven partial documents instead of one, and none of them
 * carried the details a traditional kundli opens with.
 *
 * This builds the whole thing once, as data. The page is then layout and
 * nothing else, which matters for two reasons: the report can be tested without
 * rendering React, and the same structure can be printed in three languages by
 * swapping only the labels.
 *
 * Everything here is deterministic and computed from the ephemeris. No model is
 * called anywhere in this file, so the same birth details always produce the
 * same twenty pages.
 */

export interface LifeArea {
  key: string;
  /** The heading, in English. Translated at the page. */
  title: string;
  /** Houses this area is read from. */
  houses: number[];
  /**
   * The karaka, the graha that signifies this area regardless of house.
   *
   * Typed as a graha rather than a string, for the same reason the lords on
   * `identity` are: the report prints it through the translated vocabulary,
   * which is keyed by graha, and a plain string would let anything through to
   * be rendered untranslated.
   */
  karaka: AnyGraha;
  /** What the chart shows, assembled from the placements involved. */
  findings: string[];
}

export interface FullReport {
  chart: Chart;
  displayName: string | null;
  generatedAt: Date;

  birthTime: BirthTimeDetails;
  panchang: ReturnType<typeof computePanchang>;
  avakhada: AvakhadaChakra;
  favourable: ReturnType<typeof favourablePoints>;
  ghataka: ReturnType<typeof ghatakaChakra>;

  identity: {
    lagnaRashi: number;
    lagnaName: string;
    /*
      Lords are typed as grahas, not as strings. The report prints them through
      the translated vocabulary, which is keyed by graha, and a plain string
      would let a sign name be passed here and rendered untranslated.
    */
    lagnaLord: AnyGraha;
    rasiName: string;
    rasiLord: AnyGraha;
    nakshatraName: string;
    nakshatraLord: AnyGraha;
    pada: number;
  };

  charts: { code: 'D1' | 'D9' | 'D10'; title: string; note: string; data: ChartRenderData }[];

  yogas: ReturnType<typeof detectYogas>;
  manglik: ReturnType<typeof mangalDosha>;
  ashtakavarga: ReturnType<typeof ashtakavarga>;

  dasha: {
    balance: ReturnType<typeof balanceAtBirthParts>;
    mahadashas: ReturnType<typeof mahadashaList>;
    current: string | null;
    upcoming: ReturnType<typeof upcomingDashaChanges>;
  };

  transits: ReturnType<typeof currentTransits>;
  /*
    The transits, read. Same engine the transits tool uses, so the page in the
    report and the page on the site cannot say different things about the same
    day — which they would have, sooner or later, as two implementations.
  */
  gochara: ReturnType<typeof gocharaReading>;
  sadeSati: ReturnType<typeof sadeSati>;

  lifeAreas: LifeArea[];
  remedies: ReturnType<typeof remedies>;
  gemstones: ReturnType<typeof gemstones>;
  advice: ReturnType<typeof advice>;
}

/**
 * The twelve life areas, in the order the user asked for them.
 *
 * Each names the houses it is read from and the karaka that signifies it
 * independently of house. Reading a house without its karaka is the commonest
 * shortcut in cheap software: the fourth house says something about the mother,
 * but so does the Moon, and a chart where they disagree is exactly the chart
 * worth saying something careful about.
 */
const AREAS: Omit<LifeArea, 'findings'>[] = [
  { key: 'nature', title: 'Nature, and how the world sees you', houses: [1, 10], karaka: 'Sun' },
  { key: 'family', title: 'Family and the people close to you', houses: [2, 3, 4], karaka: 'Jupiter' },
  { key: 'finance', title: 'Money earned, kept, spent and inherited', houses: [2, 11, 8], karaka: 'Jupiter' },
  { key: 'home', title: 'Home, mother and property', houses: [4], karaka: 'Moon' },
  { key: 'education', title: 'Education, early and higher', houses: [4, 5, 9], karaka: 'Mercury' },
  { key: 'struggle', title: 'Enemies, obstacles and struggle', houses: [6], karaka: 'Mars' },
  { key: 'health', title: 'Health and constitution', houses: [1, 6, 8], karaka: 'Sun' },
  { key: 'work', title: 'Work: job, business, and which suits you', houses: [10, 6, 7], karaka: 'Saturn' },
  { key: 'marriage', title: 'Love, marriage and after', houses: [5, 7, 2], karaka: 'Venus' },
  { key: 'loss', title: 'Losses to be aware of', houses: [12, 8, 6], karaka: 'Saturn' },
  { key: 'spiritual', title: 'The spiritual side, and fortune', houses: [9, 12, 5], karaka: 'Jupiter' },
  { key: 'foreign', title: 'Foreign living, travel and connection', houses: [12, 9, 3], karaka: 'Rahu' },
];

export function buildFullReport(
  birth: BirthData,
  options: { displayName?: string | null; settings?: Chart['meta']['settings'] } = {},
): FullReport {
  const chart = castChart(birth, options.settings ? { settings: options.settings } : {});
  const now = new Date();

  const tree = buildVimshottari(chart);
  const active = dashaAt(tree, now);

  const moon = chart.byGraha.Moon;
  const asc = chart.ascendant;

  const d9 = buildVarga(chart, 'D9');
  const d10 = buildVarga(chart, 'D10');

  const running = active?.maha.lord;

  return {
    chart,
    displayName: options.displayName ?? null,
    generatedAt: now,

    birthTime: birthTimeDetails(chart),
    panchang: computePanchang(
      { year: birth.year, month: birth.month, day: birth.day },
      birth.place,
      { ayanamsa: chart.meta.settings.ayanamsa },
    ),
    avakhada: avakhadaChakra(chart),
    favourable: favourablePoints(chart),
    ghataka: ghatakaChakra(chart),

    identity: {
      lagnaRashi: asc.rashi,
      lagnaName: RASHI_NAMES_EN[asc.rashi],
      lagnaLord: lagnaLord(chart),
      rasiName: RASHI_NAMES_EN[moon.rashi],
      rasiLord: rasiLord(chart),
      nakshatraName: NAKSHATRA_NAMES[moon.nakshatra],
      nakshatraLord: moon.nakshatraLord,
      pada: moon.pada,
    },

    charts: [
      {
        code: 'D1',
        title: 'Rāśi (D1)',
        note:
          'The birth chart itself. Everything else is read against this one, ' +
          'and a finding that contradicts the D1 outright is usually a finding ' +
          'that has been over-read.',
        data: chartToRenderData(chart, 'Rāśi (D1)'),
      },
      {
        code: 'D9',
        title: 'Navāṁśa (D9)',
        note:
          'The ninth division, read for marriage and for the underlying ' +
          'strength of a graha. A graha weak in the D1 but strong here tends to ' +
          'deliver late rather than not at all, which is the single most useful ' +
          'thing the navamsa tells you.',
        data: vargaToRenderData(d9, chart),
      },
      {
        code: 'D10',
        title: 'Daśāṁśa (D10)',
        note:
          'The tenth division, read for work and standing. Where the D1 shows ' +
          'what kind of work suits you, the D10 shows what happens in it.',
        data: vargaToRenderData(d10, chart),
      },
    ],

    yogas: detectYogas(chart),
    manglik: mangalDosha(chart),
    ashtakavarga: ashtakavarga(chart),

    dasha: {
      balance: balanceAtBirthParts(tree),
      mahadashas: mahadashaList(tree),
      current: active ? formatDashaChain(active) : null,
      upcoming: upcomingDashaChanges(tree, now, 10),
    },

    transits: currentTransits(chart, now),
    gochara: gocharaReading(chart, now),
    sadeSati: sadeSati(chart, now, 90),

    lifeAreas: AREAS.map((area) => ({ ...area, findings: readArea(chart, area) })),
    remedies: remedies(chart),
    gemstones: gemstones(chart),
    advice: advice(chart, running),
  };
}

/**
 * What a chart says about one area of life.
 *
 * Three sentences at most, each traceable to a placement: which grahas occupy
 * the houses, where the lord of the first of those houses has gone, and how the
 * karaka is placed. That is the classical order of enquiry, and keeping to it
 * means the paragraph can be checked rather than merely read.
 */
function readArea(chart: Chart, area: Omit<LifeArea, 'findings'>): string[] {
  const findings: string[] = [];

  const occupants = chart.planets.filter((p) => area.houses.includes(p.house));

  if (occupants.length > 0) {
    findings.push(
      `${list(occupants.map((p) => p.graha))} ${occupants.length === 1 ? 'occupies' : 'occupy'} ` +
        `${area.houses.length === 1 ? 'this house' : 'these houses'}: ` +
        occupants
          .map((p) => `${p.graha} in ${RASHI_NAMES_EN[p.rashi]}, ${readable(p.dignity)}`)
          .join('; ') +
        '.',
    );
  } else {
    findings.push(
      `No graha occupies ${area.houses.length === 1 ? 'this house' : 'these houses'}, which is ` +
        'ordinary and not a lack. An empty house is read through its lord and its karaka.',
    );
  }

  // The lord of the primary house, and where it has gone.
  const primary = area.houses[0];
  const primaryRashi = (chart.ascendant.rashi + primary - 1) % 12;
  const lord = RASHI_LORD[primaryRashi];
  const lordPosition = chart.planets.find((p) => p.graha === lord);

  if (lordPosition) {
    findings.push(
      `The lord of the ${ordinal(primary)} house is ${lord}, placed in the ` +
        `${ordinal(lordPosition.house)} house in ${RASHI_NAMES_EN[lordPosition.rashi]}, ` +
        `${readable(lordPosition.dignity)}${lordPosition.retrograde ? ', retrograde' : ''}` +
        `${lordPosition.combust ? ', and combust' : ''}. ` +
        'Where a house lord goes is where that part of life is spent.',
    );
  }

  const karaka = chart.planets.find((p) => p.graha === area.karaka);
  if (karaka) {
    findings.push(
      `The karaka is ${area.karaka}, in the ${ordinal(karaka.house)} house, ` +
        `${readable(karaka.dignity)}. ` +
        (karaka.combust
          ? 'Being combust, it acts through the Sun rather than in its own right here.'
          : 'A karaka in good condition supports the area even when the house itself is quiet.'),
    );
  }

  return findings;
}

// ---------------------------------------------------------------------------

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
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

export function formatDate(date: Date, zone = 'utc', fmt = 'd LLLL yyyy'): string {
  return DateTime.fromJSDate(date, { zone }).toFormat(fmt);
}
