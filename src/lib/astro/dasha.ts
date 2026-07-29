import {
  VIMSHOTTARI_ORDER,
  VIMSHOTTARI_TOTAL_YEARS,
  VIMSHOTTARI_YEAR_DAYS,
  VIMSHOTTARI_YEARS,
  type Graha,
} from './constants';
import type { Chart, DashaPeriod, DashaTree } from './types';

/**
 * Vimshottari dasha.
 *
 * The whole system hangs off one number: how far the Moon had travelled through
 * its nakshatra at birth. That fraction decides how much of the first
 * mahadasha was already spent, and every later boundary follows from it.
 *
 * Two details decide whether dates match standard software:
 *
 *   - the Vimshottari year is exactly 365.25 days, not a tropical year;
 *   - sub-periods are strictly proportional, so an antardasha of X inside a
 *     mahadasha of M lasts years(M) × years(X) / 120.
 *
 * Getting either wrong shifts long dasha boundaries by days to weeks.
 */

const MS_PER_DAY = 86_400_000;

function yearsToMs(years: number): number {
  return years * VIMSHOTTARI_YEAR_DAYS * MS_PER_DAY;
}

/** The Vimshottari sequence starting from a given lord, wrapping around. */
function sequenceFrom(lord: Graha): Graha[] {
  const start = VIMSHOTTARI_ORDER.indexOf(lord);
  return [
    ...VIMSHOTTARI_ORDER.slice(start),
    ...VIMSHOTTARI_ORDER.slice(0, start),
  ];
}

/**
 * Recursively build sub-periods filling exactly the span of the parent.
 *
 * Durations are computed as proportions of the parent's *actual* span rather
 * than from the nominal year counts, so a truncated first mahadasha divides
 * correctly and no rounding drift accumulates across levels.
 */
function buildSubPeriods(
  parentLord: Graha,
  parentStart: number,
  parentEnd: number,
  level: number,
  maxLevel: number,
): DashaPeriod[] | undefined {
  if (level > maxLevel) return undefined;

  const span = parentEnd - parentStart;
  const periods: DashaPeriod[] = [];
  let cursor = parentStart;

  for (const lord of sequenceFrom(parentLord)) {
    const portion = (VIMSHOTTARI_YEARS[lord] / VIMSHOTTARI_TOTAL_YEARS) * span;
    const end = cursor + portion;

    periods.push({
      lord,
      start: new Date(Math.round(cursor)),
      end: new Date(Math.round(end)),
      level,
      children: buildSubPeriods(lord, cursor, end, level + 1, maxLevel),
    });

    cursor = end;
  }

  return periods;
}

export interface DashaOptions {
  /**
   * Deepest level to compute.
   * 1 = Mahadasha, 2 = Antardasha, 3 = Pratyantardasha, 4 = Sookshma,
   * 5 = Prana. Depth 5 produces roughly 59,000 periods, so the default is 3.
   */
  maxLevel?: number;
  /** How many mahadashas to generate. 120 years covers a full cycle. */
  cycles?: number;
}

/**
 * Build the Vimshottari dasha tree for a chart.
 *
 * `birthDate` must be the UTC instant of birth, the same instant the chart was
 * cast for, so that dasha boundaries line up with the chart.
 */
export function buildVimshottari(
  chart: Chart,
  options: DashaOptions = {},
): DashaTree {
  const { maxLevel = 3, cycles = 1 } = options;

  const moon = chart.byGraha.Moon;
  const seedNakshatra = moon.nakshatra;
  const startLord = moon.nakshatraLord;

  // Fraction of the birth nakshatra already traversed → fraction of the first
  // mahadasha already spent before birth.
  const elapsedFraction = moon.nakshatraElapsed;
  const firstLordYears = VIMSHOTTARI_YEARS[startLord];
  const yearsRemaining = firstLordYears * (1 - elapsedFraction);

  const birthMs = new Date(chart.meta.utcISO).getTime();

  const periods: DashaPeriod[] = [];
  let cursor = birthMs;

  const order = sequenceFrom(startLord);
  const totalPeriods = order.length * cycles;

  for (let i = 0; i < totalPeriods; i++) {
    const lord = order[i % order.length];

    // The first mahadasha is truncated by whatever was consumed before birth.
    const years = i === 0 ? yearsRemaining : VIMSHOTTARI_YEARS[lord];
    const end = cursor + yearsToMs(years);

    periods.push({
      lord,
      start: new Date(Math.round(cursor)),
      end: new Date(Math.round(end)),
      level: 1,
      children: buildSubPeriods(lord, cursor, end, 2, maxLevel),
    });

    cursor = end;
  }

  return {
    system: 'vimshottari',
    seedNakshatra,
    balanceAtBirth: { lord: startLord, yearsRemaining },
    periods,
  };
}

// ---------------------------------------------------------------------------
// Querying the tree
// ---------------------------------------------------------------------------

export interface ActiveDasha {
  maha: DashaPeriod;
  antar?: DashaPeriod;
  pratyantar?: DashaPeriod;
  sookshma?: DashaPeriod;
}

function findAt(periods: DashaPeriod[] | undefined, at: number): DashaPeriod | undefined {
  if (!periods) return undefined;
  return periods.find((p) => at >= p.start.getTime() && at < p.end.getTime());
}

/** The chain of periods running at a given moment. */
export function dashaAt(tree: DashaTree, when: Date = new Date()): ActiveDasha | null {
  const at = when.getTime();

  const maha = findAt(tree.periods, at);
  if (!maha) return null;

  const antar = findAt(maha.children, at);
  const pratyantar = findAt(antar?.children, at);
  const sookshma = findAt(pratyantar?.children, at);

  return { maha, antar, pratyantar, sookshma };
}

/** Render an active dasha chain as `Venus / Saturn / Mercury`. */
export function formatDashaChain(active: ActiveDasha): string {
  return [active.maha, active.antar, active.pratyantar, active.sookshma]
    .filter(Boolean)
    .map((p) => p!.lord)
    .join(' / ');
}

/**
 * Upcoming period changes after a given moment, the dates a client actually
 * wants to know about.
 */
export function upcomingDashaChanges(
  tree: DashaTree,
  from: Date = new Date(),
  limit = 10,
): { date: Date; level: number; entering: string }[] {
  const at = from.getTime();
  const events: { date: Date; level: number; entering: string }[] = [];

  const walk = (periods: DashaPeriod[] | undefined, path: string[]) => {
    if (!periods) return;
    for (const p of periods) {
      if (p.start.getTime() > at) {
        events.push({
          date: p.start,
          level: p.level,
          entering: [...path, p.lord].join(' / '),
        });
      }
      // Only descend into periods that overlap the window we care about.
      if (p.end.getTime() > at && events.length < limit * 8) {
        walk(p.children, [...path, p.lord]);
      }
    }
  };

  walk(tree.periods, []);

  return events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

/** Flatten mahadashas into a simple list, for the summary table. */
export function mahadashaList(tree: DashaTree): DashaPeriod[] {
  return tree.periods.filter((p) => p.level === 1);
}

/**
 * Balance of dasha at birth, phrased the way an astrologer would say it:
 * "Venus mahadasha, 12 years 4 months 18 days remaining at birth".
 */
export function formatBalance(tree: DashaTree): string {
  const { lord, yearsRemaining } = tree.balanceAtBirth;

  const totalDays = yearsRemaining * VIMSHOTTARI_YEAR_DAYS;
  const years = Math.floor(totalDays / VIMSHOTTARI_YEAR_DAYS);
  const afterYears = totalDays - years * VIMSHOTTARI_YEAR_DAYS;
  const months = Math.floor(afterYears / 30.4375);
  const days = Math.round(afterYears - months * 30.4375);

  const parts: string[] = [];
  if (years) parts.push(`${years} year${years === 1 ? '' : 's'}`);
  if (months) parts.push(`${months} month${months === 1 ? '' : 's'}`);
  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`);

  return `${lord} mahadasha, ${parts.join(' ') || '0 days'} remaining at birth`;
}
