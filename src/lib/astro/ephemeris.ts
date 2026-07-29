import 'server-only';

import path from 'node:path';
import fs from 'node:fs';
import sweph from 'sweph';

import type { AyanamsaName, HouseSystem, NodeType } from './types';
import type { AnyGraha } from './constants';

const C = sweph.constants;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Swiss Ephemeris reads its data files from disk. Vercel places the bundled
 * files relative to the function's working directory, while local dev runs from
 * the project root, so we probe a few candidates rather than assuming one.
 */
function resolveEphePath(): string | null {
  const candidates = [
    process.env.SE_EPHE_PATH,
    path.join(process.cwd(), 'ephe'),
    path.join(process.cwd(), 'src', 'lib', 'astro', 'ephe'),
    '/var/task/ephe',
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    try {
      if (fs.existsSync(path.join(dir, 'sepl_18.se1'))) return dir;
    } catch {
      // Unreadable candidate, try the next one.
    }
  }
  return null;
}

let initialised = false;
let usingDataFiles = false;

function init(): void {
  if (initialised) return;

  const ephePath = resolveEphePath();
  if (ephePath) {
    sweph.set_ephe_path(ephePath);
    usingDataFiles = true;
  } else {
    // Moshier mode needs no data files. It agrees with the full Swiss
    // Ephemeris to well under an arc-second, so the site stays correct even if
    // the data files ever fail to deploy, it just loses a little precision.
    usingDataFiles = false;
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[astro] Swiss Ephemeris data files not found; falling back to the ' +
          'built-in Moshier ephemeris (accuracy remains sub-arcsecond).',
      );
    }
  }

  initialised = true;
}

/** Which ephemeris backend is active. Surfaced for diagnostics. */
export function ephemerisMode(): 'swiss' | 'moshier' {
  init();
  return usingDataFiles ? 'swiss' : 'moshier';
}

function baseFlag(): number {
  init();
  return usingDataFiles ? C.SEFLG_SWIEPH : C.SEFLG_MOSEPH;
}

// ---------------------------------------------------------------------------
// Ayanamsa
// ---------------------------------------------------------------------------

const AYANAMSA_ID: Record<Exclude<AyanamsaName, 'tropical'>, number> = {
  lahiri: C.SE_SIDM_LAHIRI,
  lahiri_1940: C.SE_SIDM_LAHIRI_1940,
  true_chitra: C.SE_SIDM_TRUE_CITRA,
  raman: C.SE_SIDM_RAMAN,
  kp: C.SE_SIDM_KRISHNAMURTI,
  yukteshwar: C.SE_SIDM_YUKTESHWAR,
  pushya_paksha: C.SE_SIDM_SS_CITRA,
  true_pushya: C.SE_SIDM_TRUE_PUSHYA,
};

export const AYANAMSA_LABELS: Record<AyanamsaName, string> = {
  lahiri: 'Lahiri (Chitrapaksha)',
  lahiri_1940: 'Lahiri 1940',
  true_chitra: 'True Chitra',
  raman: 'B. V. Raman',
  kp: 'Krishnamurti (KP)',
  yukteshwar: 'Sri Yukteshwar',
  pushya_paksha: 'Pushya Paksha',
  true_pushya: 'True Pushya',
  tropical: 'Tropical (no ayanamsa)',
};

let currentAyanamsa: AyanamsaName | null = null;

/**
 * Swiss Ephemeris holds the sidereal mode as global state, so it must be set
 * before every batch of calculations rather than once at startup.
 */
function applyAyanamsa(ayanamsa: AyanamsaName): void {
  init();
  if (currentAyanamsa === ayanamsa) return;
  if (ayanamsa !== 'tropical') {
    sweph.set_sid_mode(AYANAMSA_ID[ayanamsa], 0, 0);
  }
  currentAyanamsa = ayanamsa;
}

function siderealFlag(ayanamsa: AyanamsaName): number {
  return ayanamsa === 'tropical' ? 0 : C.SEFLG_SIDEREAL;
}

/** Ayanamsa value in degrees at the given moment. */
export function getAyanamsa(julianDayUT: number, ayanamsa: AyanamsaName): number {
  if (ayanamsa === 'tropical') return 0;
  applyAyanamsa(ayanamsa);
  const res = sweph.get_ayanamsa_ex_ut(julianDayUT, baseFlag() | C.SEFLG_SIDEREAL);
  return res.data;
}

// ---------------------------------------------------------------------------
// Julian day
// ---------------------------------------------------------------------------

/**
 * Convert a UTC calendar moment to Julian Day.
 * The Gregorian calendar is used throughout; dates before 1582 are handled by
 * Swiss Ephemeris' proleptic Gregorian rules.
 */
export function toJulianDay(
  year: number,
  month: number,
  day: number,
  hoursUT: number,
): number {
  init();
  return sweph.julday(year, month, day, hoursUT, C.SE_GREG_CAL);
}

/** Inverse of {@link toJulianDay}. */
export function fromJulianDay(julianDayUT: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  init();
  const r = sweph.revjul(julianDayUT, C.SE_GREG_CAL);
  return { year: r.year, month: r.month, day: r.day, hour: r.hour };
}

export function julianDayToDate(julianDayUT: number): Date {
  const { year, month, day, hour } = fromJulianDay(julianDayUT);
  const ms = Math.round(hour * 3600 * 1000);
  return new Date(Date.UTC(year, month - 1, day) + ms);
}

export function dateToJulianDay(date: Date): number {
  return toJulianDay(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600 +
      date.getUTCMilliseconds() / 3_600_000,
  );
}

// ---------------------------------------------------------------------------
// Planetary positions
// ---------------------------------------------------------------------------

const SWE_BODY: Record<Exclude<AnyGraha, 'Ketu'>, number> = {
  Sun: C.SE_SUN,
  Moon: C.SE_MOON,
  Mars: C.SE_MARS,
  Mercury: C.SE_MERCURY,
  Jupiter: C.SE_JUPITER,
  Venus: C.SE_VENUS,
  Saturn: C.SE_SATURN,
  Rahu: C.SE_MEAN_NODE,
  Uranus: C.SE_URANUS,
  Neptune: C.SE_NEPTUNE,
  Pluto: C.SE_PLUTO,
};

export interface RawPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  speedLatitude: number;
}

/**
 * Raw sidereal position of a single body.
 *
 * Ketu is not a body Swiss Ephemeris knows about, it is always exactly 180°
 * from Rahu, so it is derived rather than looked up.
 */
export function calcBody(
  julianDayUT: number,
  graha: AnyGraha,
  ayanamsa: AyanamsaName,
  nodeType: NodeType = 'mean',
): RawPosition {
  applyAyanamsa(ayanamsa);

  if (graha === 'Ketu') {
    const rahu = calcBody(julianDayUT, 'Rahu', ayanamsa, nodeType);
    return {
      ...rahu,
      longitude: norm360(rahu.longitude + 180),
      latitude: -rahu.latitude,
    };
  }

  const body =
    graha === 'Rahu'
      ? nodeType === 'true'
        ? C.SE_TRUE_NODE
        : C.SE_MEAN_NODE
      : SWE_BODY[graha];

  const flags = baseFlag() | siderealFlag(ayanamsa) | C.SEFLG_SPEED;
  const res = sweph.calc_ut(julianDayUT, body, flags);

  // Swiss Ephemeris reports a non-fatal message when it silently falls back to
  // Moshier. Only a genuinely empty result is an error worth throwing on.
  if (!res.data || res.data.length < 6) {
    throw new Error(`Ephemeris failure for ${graha}: ${res.error || 'no data'}`);
  }

  return {
    longitude: norm360(res.data[0]),
    latitude: res.data[1],
    distance: res.data[2],
    speed: res.data[3],
    speedLatitude: res.data[4],
  };
}

// ---------------------------------------------------------------------------
// Houses
// ---------------------------------------------------------------------------

const HOUSE_CODE: Record<HouseSystem, string> = {
  whole_sign: 'W',
  equal: 'E',
  sripati: 'O', // Porphyry, Sripati cusps are Porphyry cusps
  placidus: 'P',
  koch: 'K',
  campanus: 'C',
};

export interface HouseResult {
  /** Twelve cusps, sidereal, house 1 first. */
  cusps: number[];
  ascendant: number;
  midheaven: number;
  armc: number;
  vertex: number;
}

export function calcHouses(
  julianDayUT: number,
  latitude: number,
  longitude: number,
  ayanamsa: AyanamsaName,
  system: HouseSystem,
): HouseResult {
  applyAyanamsa(ayanamsa);

  const res = sweph.houses_ex(
    julianDayUT,
    siderealFlag(ayanamsa),
    latitude,
    longitude,
    HOUSE_CODE[system],
  );

  if (!res.data) {
    // The typings do not surface `error`, but the binding populates it.
    const message = (res as { error?: string }).error || 'no data';
    throw new Error(`House calculation failed: ${message}`);
  }

  const { houses, points } = res.data;

  return {
    // Swiss Ephemeris returns 12 cusps for every system we expose.
    cusps: houses.slice(0, 12).map(norm360),
    ascendant: norm360(points[0]),
    midheaven: norm360(points[1]),
    armc: norm360(points[2]),
    vertex: norm360(points[3]),
  };
}

// ---------------------------------------------------------------------------
// Rise, set and transit
// ---------------------------------------------------------------------------

export type RiseEvent = 'rise' | 'set';

/**
 * Rise or set time as a Julian Day, or null when the event does not occur
 * (polar latitudes during midnight sun or polar night).
 *
 * `hinduConvention` applies the disc-centre, no-refraction rule used by Indian
 * panchang makers. Western almanacs use the upper-limb-with-refraction rule,
 * which shifts sunrise by roughly two to four minutes, enough to change the
 * tithi or nakshatra reported for a day, so it matters.
 */
export function calcRiseSet(
  julianDayUT: number,
  body: AnyGraha,
  latitude: number,
  longitude: number,
  altitude: number,
  event: RiseEvent,
  hinduConvention = true,
): number | null {
  init();

  const bodyId = body === 'Ketu' ? C.SE_MEAN_NODE : SWE_BODY[body];
  const eventFlag = event === 'rise' ? C.SE_CALC_RISE : C.SE_CALC_SET;
  const conventionFlag = hinduConvention ? C.SE_BIT_HINDU_RISING : 0;

  const res = sweph.rise_trans(
    julianDayUT,
    bodyId,
    '',
    baseFlag(),
    eventFlag | conventionFlag,
    [longitude, latitude, altitude],
    0,
    0,
  );

  // A return flag of -2 means "event does not occur"; data is then meaningless.
  // Unlike calc_ut, rise_trans returns the Julian Day as a bare number.
  if (res.flag === -2 || res.data == null) return null;
  const jd = typeof res.data === 'number' ? res.data : (res.data as number[])[0];
  return Number.isFinite(jd) && jd > 0 ? jd : null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise any angle into [0, 360). */
export function norm360(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Shortest signed separation from `a` to `b`, in (-180, 180]. */
export function angularDiff(a: number, b: number): number {
  let d = norm360(b - a);
  if (d > 180) d -= 360;
  return d;
}
