import 'server-only';

import { GRAHAS, RASHI_NAMES_EN, type AnyGraha, type Graha } from './constants';
import type { AyanamsaName, Chart, SadeSatiPhase, SadeSatiResult, TransitEvent } from './types';
import { calcBody, dateToJulianDay, julianDayToDate, norm360 } from './ephemeris';
import { describeLongitude, signDistance } from './zodiac';

/**
 * Gochara, the transits.
 *
 * Everything here answers "where are the grahas now, relative to a birth
 * chart", which is the question people actually come back to a site for.
 *
 * Sign ingress times are solved by bisection against the ephemeris rather than
 * estimated from mean motion. Saturn's speed varies enough across its orbit
 * that a mean-motion estimate can be weeks out, and a Sade Sati start date
 * being weeks out is the difference between a useful answer and a wrong one.
 */

const DAY = 86_400_000;

export interface TransitPosition {
  graha: AnyGraha;
  longitude: number;
  rashi: number;
  degreeInRashi: number;
  nakshatra: number;
  retrograde: boolean;
  /** House from the natal ascendant. */
  houseFromAscendant: number;
  /** House from the natal Moon, which is how gochara is traditionally read. */
  houseFromMoon: number;
}

/** Where every graha stands right now, related back to a natal chart. */
export function currentTransits(
  chart: Chart,
  when: Date = new Date(),
): TransitPosition[] {
  const jd = dateToJulianDay(when);
  const ayanamsa = chart.meta.settings.ayanamsa;
  const nodeType = chart.meta.settings.nodeType;

  const ascRashi = chart.ascendant.rashi;
  const moonRashi = chart.byGraha.Moon.rashi;

  return GRAHAS.map((graha) => {
    const raw = calcBody(jd, graha, ayanamsa, nodeType);
    const position = describeLongitude(raw.longitude);

    return {
      graha,
      longitude: position.longitude,
      rashi: position.rashi,
      degreeInRashi: position.degreeInRashi,
      nakshatra: position.nakshatra,
      retrograde:
        graha === 'Rahu' || graha === 'Ketu' ? raw.speed <= 0 : raw.speed < 0,
      houseFromAscendant: signDistance(ascRashi, position.rashi),
      houseFromMoon: signDistance(moonRashi, position.rashi),
    };
  });
}

// ---------------------------------------------------------------------------
// Sign ingress
// ---------------------------------------------------------------------------

/**
 * The moment a graha next enters a given rashi, searched forward from `from`.
 *
 * Bisection on the sign index rather than the longitude, because the longitude
 * wraps and the sign boundary is what is actually being sought. Returns null
 * if the graha does not reach that sign within the window.
 */
function findIngress(
  fromJd: number,
  graha: Graha,
  targetRashi: number,
  ayanamsa: AyanamsaName,
  searchDays: number,
  stepDays: number,
): number | null {
  const rashiAt = (jd: number) =>
    Math.floor(calcBody(jd, graha, ayanamsa).longitude / 30);

  let previous = rashiAt(fromJd);
  let lo = fromJd;

  for (let t = stepDays; t <= searchDays; t += stepDays) {
    const jd = fromJd + t;
    const current = rashiAt(jd);

    if (current !== previous) {
      if (current === targetRashi) {
        // Narrow to the minute. Thirty halvings of a coarse step is far finer
        // than any interpretation requires.
        let a = lo;
        let b = jd;
        for (let i = 0; i < 30; i++) {
          const mid = (a + b) / 2;
          if (rashiAt(mid) === targetRashi) b = mid;
          else a = mid;
        }
        return b;
      }
      previous = current;
    }
    lo = jd;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sade Sati
// ---------------------------------------------------------------------------

/**
 * Sade Sati, the seven and a half years of Saturn.
 *
 * Runs while Saturn transits the sign before the natal Moon, the sign of the
 * Moon itself, and the sign after. Each leg is about two and a half years,
 * though Saturn's retrogrades mean the real dates are never exactly that.
 *
 * The dates are solved against the ephemeris, so a leg that Saturn retrogrades
 * back out of and re-enters is reported at its true boundaries rather than a
 * textbook approximation.
 */
export function sadeSati(
  chart: Chart,
  when: Date = new Date(),
  windowYears = 40,
): SadeSatiResult {
  const ayanamsa = chart.meta.settings.ayanamsa;
  const moonRashi = chart.byGraha.Moon.rashi;

  // The three signs Sade Sati covers, in the order Saturn meets them.
  const legs: { rashi: number; phase: SadeSatiPhase['phase'] }[] = [
    { rashi: (moonRashi + 11) % 12, phase: 'rising' },
    { rashi: moonRashi, phase: 'peak' },
    { rashi: (moonRashi + 1) % 12, phase: 'setting' },
  ];

  // Start the search well before the window so a cycle already under way is
  // caught at its true beginning rather than clipped.
  const startJd = dateToJulianDay(new Date(when.getTime() - windowYears * 365.25 * DAY * 0.5));
  const searchDays = windowYears * 365.25;

  const phases: SadeSatiPhase[] = [];

  for (const leg of legs) {
    let cursor = startJd;

    // Saturn returns to each sign roughly every 29.5 years, so more than two
    // passes inside a forty year window is not possible.
    for (let pass = 0; pass < 3; pass++) {
      const entry = findIngress(cursor, 'Saturn', leg.rashi, ayanamsa, searchDays, 5);
      if (entry === null) break;

      const exit = findIngress(
        entry + 30,
        'Saturn',
        (leg.rashi + 1) % 12,
        ayanamsa,
        searchDays,
        5,
      );
      if (exit === null) break;

      phases.push({
        phase: leg.phase,
        start: julianDayToDate(entry),
        end: julianDayToDate(exit),
        rashi: leg.rashi,
      });

      cursor = exit + 365;
    }
  }

  phases.sort((a, b) => a.start.getTime() - b.start.getTime());

  const now = when.getTime();
  const currentPhase =
    phases.find((p) => now >= p.start.getTime() && now < p.end.getTime()) ?? null;

  // Dhaiya, the small panoti: Saturn transiting the 4th or 8th from the Moon.
  const saturnNow = describeLongitude(
    calcBody(dateToJulianDay(when), 'Saturn', ayanamsa).longitude,
  );
  const fromMoon = signDistance(moonRashi, saturnNow.rashi);

  return {
    active: currentPhase !== null,
    currentPhase,
    phases,
    dhaiya: {
      active: fromMoon === 4 || fromMoon === 8,
      type: fromMoon === 4 ? 'kantaka' : fromMoon === 8 ? 'ashtama' : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Upcoming events
// ---------------------------------------------------------------------------

/**
 * Sign changes for the slow grahas over the coming years.
 *
 * Only Jupiter, Saturn, Rahu and Ketu are listed. The Moon changes sign every
 * two and a half days and the inner planets every few weeks, so including them
 * would bury the events that actually mark a chapter of someone's life.
 */
export function upcomingIngresses(
  chart: Chart,
  from: Date = new Date(),
  years = 5,
): TransitEvent[] {
  const ayanamsa = chart.meta.settings.ayanamsa;
  const startJd = dateToJulianDay(from);
  const searchDays = years * 365.25;

  const slow: Graha[] = ['Jupiter', 'Saturn', 'Rahu'];
  const events: TransitEvent[] = [];

  for (const graha of slow) {
    let cursor = startJd;
    const direction = graha === 'Rahu' ? -1 : 1;

    for (let i = 0; i < 12; i++) {
      const currentRashi = Math.floor(
        calcBody(cursor, graha, ayanamsa).longitude / 30,
      );
      const nextRashi = (currentRashi + direction + 12) % 12;

      const jd = findIngress(cursor, graha, nextRashi, ayanamsa, searchDays, 3);
      if (jd === null || jd > startJd + searchDays) break;

      const date = julianDayToDate(jd);

      events.push({
        date,
        graha,
        kind: 'ingress',
        rashi: nextRashi,
        description: `${graha} enters ${RASHI_NAMES_EN[nextRashi]}`,
      });

      // Ketu mirrors Rahu exactly, so it is added without a second search.
      if (graha === 'Rahu') {
        const ketuRashi = (nextRashi + 6) % 12;
        events.push({
          date,
          graha: 'Ketu',
          kind: 'ingress',
          rashi: ketuRashi,
          description: `Ketu enters ${RASHI_NAMES_EN[ketuRashi]}`,
        });
      }

      cursor = jd + 20;
    }
  }

  return events
    .filter((e) => e.date.getTime() > from.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Which grahas are retrograde right now.
 *
 * Rahu and Ketu are excluded: the mean node is always retrograde, so listing
 * it every single day is noise rather than information.
 */
export function currentRetrogrades(
  chart: Chart,
  when: Date = new Date(),
): AnyGraha[] {
  const jd = dateToJulianDay(when);
  const ayanamsa = chart.meta.settings.ayanamsa;

  const candidates: Graha[] = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

  return candidates.filter((graha) => calcBody(jd, graha, ayanamsa).speed < 0);
}

/**
 * Gochara result for a graha, judged from the natal Moon.
 *
 * The classical table of favourable and unfavourable houses from the Moon, one
 * row per graha. This is the oldest and simplest transit rule there is, and
 * still the one most readings lean on.
 */
const GOCHARA_FAVOURABLE: Record<string, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 10, 11],
  Ketu: [3, 6, 10, 11],
};

export function gocharaVerdict(
  graha: AnyGraha,
  houseFromMoon: number,
): 'favourable' | 'mixed' | 'difficult' {
  const favourable = GOCHARA_FAVOURABLE[graha];
  if (!favourable) return 'mixed';
  if (favourable.includes(houseFromMoon)) return 'favourable';
  if ([4, 8, 12].includes(houseFromMoon)) return 'difficult';
  return 'mixed';
}

export { norm360 };
