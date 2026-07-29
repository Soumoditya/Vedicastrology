import 'server-only';

import {
  FIXED_KARANA_NAMES,
  KARANA_NAMES,
  NAKSHATRA_LORD,
  NAKSHATRA_NAMES,
  TITHI_NAMES,
  VARA_LORD,
  VARA_NAMES,
  VARA_NAMES_EN,
  YOGA_NAMES,
  HORA_ORDER,
  type Graha,
} from './constants';
import { DateTime } from 'luxon';

import type { BirthPlace, Panchang, PanchangElement, TimeWindow } from './types';
import type { AyanamsaName } from './types';
import {
  calcBody,
  calcRiseSet,
  julianDayToDate,
  norm360,
  toJulianDay,
} from './ephemeris';
import { NAKSHATRA_SPAN } from './zodiac';
import { timezoneFor } from './time';

/**
 * Panchang — the five limbs of the Vedic day.
 *
 * Two things separate a correct panchang from an approximate one:
 *
 *   1. Sunrise uses the Hindu convention (centre of the disc, no refraction),
 *      not the Western upper-limb-with-refraction rule. The two differ by two
 *      to four minutes, which is routinely enough to change which tithi or
 *      nakshatra a day is named for.
 *
 *   2. The Vedic day runs sunrise to sunrise, so the weekday and every element
 *      is read at sunrise — not at midnight.
 *
 * Element end times are solved numerically against the ephemeris rather than
 * estimated from a mean motion, because the Moon's speed varies by roughly 15%
 * across its orbit and a mean-motion estimate can be over an hour out.
 */

const MS_PER_DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Angular quantities the panchang is built from
// ---------------------------------------------------------------------------

/** Elongation of the Moon from the Sun, 0–360. Drives tithi and karana. */
function elongation(jd: number, ayanamsa: AyanamsaName): number {
  const sun = calcBody(jd, 'Sun', ayanamsa).longitude;
  const moon = calcBody(jd, 'Moon', ayanamsa).longitude;
  return norm360(moon - sun);
}

/** Sum of Sun and Moon longitudes, 0–360. Drives the yoga. */
function yogaAngle(jd: number, ayanamsa: AyanamsaName): number {
  const sun = calcBody(jd, 'Sun', ayanamsa).longitude;
  const moon = calcBody(jd, 'Moon', ayanamsa).longitude;
  return norm360(sun + moon);
}

function moonLongitude(jd: number, ayanamsa: AyanamsaName): number {
  return calcBody(jd, 'Moon', ayanamsa).longitude;
}

/**
 * Solve for the moment an increasing angular quantity reaches `target`.
 *
 * The quantity wraps at 360°, so we track the unwrapped value relative to the
 * starting point. Bisection is used rather than Newton's method because it
 * cannot diverge, and 40 iterations over a two-day bracket resolves to well
 * under a second.
 */
function solveCrossing(
  fromJd: number,
  target: number,
  angleAt: (jd: number) => number,
  searchDays = 2,
): number | null {
  const startValue = angleAt(fromJd);
  const relTarget = norm360(target - startValue);
  if (relTarget === 0) return fromJd;

  const rel = (jd: number) => norm360(angleAt(jd) - startValue);

  // Walk forward in steps until the quantity passes the target.
  const step = 0.05; // ~72 minutes
  let lo = fromJd;
  let hi = fromJd;

  for (let t = step; t <= searchDays; t += step) {
    const jd = fromJd + t;
    const value = rel(jd);
    // A drop back towards zero means we have wrapped past the target.
    if (value >= relTarget && value - relTarget < 180) {
      hi = jd;
      break;
    }
    lo = jd;
  }

  if (hi === fromJd) return null;

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (rel(mid) < relTarget) lo = mid;
    else hi = mid;
  }

  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// The five limbs
// ---------------------------------------------------------------------------

/** Tithi — a lunar day, one thirtieth of a synodic month (12° of elongation). */
export function computeTithi(jd: number, ayanamsa: AyanamsaName) {
  const angle = elongation(jd, ayanamsa);
  const index = Math.floor(angle / 12); // 0–29
  const elapsed = (angle % 12) / 12;

  const paksha: 'Shukla' | 'Krishna' = index < 15 ? 'Shukla' : 'Krishna';
  const withinPaksha = index % 15; // 0–14

  const name =
    withinPaksha === 14
      ? paksha === 'Shukla'
        ? 'Purnima'
        : 'Amavasya'
      : TITHI_NAMES[withinPaksha];

  const endJd = solveCrossing(jd, (index + 1) * 12, (j) => elongation(j, ayanamsa));

  return {
    index,
    name,
    paksha,
    elapsed,
    endsAt: endJd ? julianDayToDate(endJd) : undefined,
  };
}

/** Nakshatra occupied by the Moon. */
export function computeNakshatra(jd: number, ayanamsa: AyanamsaName) {
  const moon = moonLongitude(jd, ayanamsa);
  const exact = moon / NAKSHATRA_SPAN;
  const index = Math.floor(exact);
  const elapsed = exact - index;

  const endJd = solveCrossing(
    jd,
    ((index + 1) % 27) * NAKSHATRA_SPAN,
    (j) => moonLongitude(j, ayanamsa),
  );

  return {
    index,
    name: NAKSHATRA_NAMES[index],
    lord: NAKSHATRA_LORD[index] as Graha,
    elapsed,
    endsAt: endJd ? julianDayToDate(endJd) : undefined,
  };
}

/** Yoga — from the combined longitude of Sun and Moon. */
export function computeYoga(jd: number, ayanamsa: AyanamsaName): PanchangElement {
  const angle = yogaAngle(jd, ayanamsa);
  const exact = angle / NAKSHATRA_SPAN;
  const index = Math.floor(exact);
  const elapsed = exact - index;

  const endJd = solveCrossing(
    jd,
    ((index + 1) % 27) * NAKSHATRA_SPAN,
    (j) => yogaAngle(j, ayanamsa),
  );

  return {
    index,
    name: YOGA_NAMES[index],
    elapsed,
    endsAt: endJd ? julianDayToDate(endJd) : undefined,
  };
}

/**
 * Karana — half a tithi, so 60 in a lunar month.
 *
 * Four are fixed and occur once each per month; the other seven repeat eight
 * times. The cycle is: Kimstughna, then Bava…Vishti eight times over, then
 * Shakuni, Chatushpada, Naga.
 */
export function computeKarana(jd: number, ayanamsa: AyanamsaName): PanchangElement {
  const angle = elongation(jd, ayanamsa);
  const index = Math.floor(angle / 6); // 0–59
  const elapsed = (angle % 6) / 6;

  let name: string;
  if (index === 0) name = FIXED_KARANA_NAMES[3]; // Kimstughna
  else if (index >= 57) name = FIXED_KARANA_NAMES[index - 57]; // Shakuni, Chatushpada, Naga
  else name = KARANA_NAMES[(index - 1) % 7];

  const endJd = solveCrossing(jd, (index + 1) * 6, (j) => elongation(j, ayanamsa));

  return {
    index,
    name,
    elapsed,
    endsAt: endJd ? julianDayToDate(endJd) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Inauspicious and auspicious windows
// ---------------------------------------------------------------------------

/**
 * Which eighth of the daytime each period falls in, indexed by weekday
 * (0 = Sunday). These are traditional fixed assignments, not derived.
 */
const RAHU_KAAL_PART = [8, 2, 7, 5, 6, 4, 3];
const YAMAGANDA_PART = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_PART = [7, 6, 5, 4, 3, 2, 1];

function nthEighth(sunrise: Date, sunset: Date, part: number): TimeWindow {
  const dayMs = sunset.getTime() - sunrise.getTime();
  const slice = dayMs / 8;
  const start = new Date(sunrise.getTime() + (part - 1) * slice);
  return { start, end: new Date(start.getTime() + slice) };
}

/**
 * Abhijit — the eighth of the fifteen muhurtas of daylight, straddling local
 * noon. Traditionally the most auspicious window of the day, and not observed
 * on Wednesdays.
 */
function abhijit(sunrise: Date, sunset: Date, weekday: number): TimeWindow | null {
  if (weekday === 3) return null; // Wednesday
  const dayMs = sunset.getTime() - sunrise.getTime();
  const muhurta = dayMs / 15;
  const start = new Date(sunrise.getTime() + 7 * muhurta);
  return { start, end: new Date(start.getTime() + muhurta) };
}

/** Brahma muhurta — the two muhurtas (96 minutes) before sunrise. */
function brahmaMuhurta(sunrise: Date): TimeWindow {
  const end = new Date(sunrise.getTime() - 48 * 60_000);
  return { start: new Date(sunrise.getTime() - 96 * 60_000), end };
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export interface PanchangOptions {
  ayanamsa?: AyanamsaName;
}

/**
 * Compute the panchang for a calendar date at a place.
 *
 * `date` is interpreted as a local calendar date at `place`; all elements are
 * then read at that day's sunrise, following Vedic convention.
 */
export function computePanchang(
  date: { year: number; month: number; day: number },
  place: BirthPlace,
  options: PanchangOptions = {},
): Panchang {
  const ayanamsa = options.ayanamsa ?? 'lahiri';
  const { latitude, longitude, altitude = 0 } = place;

  // Start the search from the requested local date's midnight, expressed in UT,
  // so the sunrise we find belongs to that local date rather than its
  // neighbour. The real zone offset is used rather than a longitude estimate,
  // which matters near a zone boundary where the two can differ by hours.
  const zone = place.timezone || timezoneFor(latitude, longitude);
  const localMidnight = DateTime.fromObject(
    { year: date.year, month: date.month, day: date.day, hour: 0, minute: 0 },
    { zone },
  ).toUTC();

  const midnightUT = toJulianDay(
    localMidnight.year,
    localMidnight.month,
    localMidnight.day,
    localMidnight.hour + localMidnight.minute / 60,
  );

  const sunriseJd = calcRiseSet(midnightUT, 'Sun', latitude, longitude, altitude, 'rise');
  const sunsetJd = sunriseJd
    ? calcRiseSet(sunriseJd, 'Sun', latitude, longitude, altitude, 'set')
    : null;
  const moonriseJd = calcRiseSet(midnightUT, 'Moon', latitude, longitude, altitude, 'rise');
  const moonsetJd = calcRiseSet(midnightUT, 'Moon', latitude, longitude, altitude, 'set');

  const sunrise = sunriseJd ? julianDayToDate(sunriseJd) : null;
  const sunset = sunsetJd ? julianDayToDate(sunsetJd) : null;

  // Elements are read at sunrise; fall back to local noon inside the polar
  // circles, where the Sun may not rise or set at all.
  const referenceJd = sunriseJd ?? midnightUT + 0.5;

  const tithi = computeTithi(referenceJd, ayanamsa);
  const nakshatra = computeNakshatra(referenceJd, ayanamsa);
  const yoga = computeYoga(referenceJd, ayanamsa);
  const karana = computeKarana(referenceJd, ayanamsa);

  // The Vedic weekday is the local civil weekday of the day this sunrise opens.
  // It must come from the local date, not from the Julian Day — sunrise in
  // India falls on the *previous* UT date, so deriving it from UT is off by one.
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();

  const muhurta = {
    rahuKaal:
      sunrise && sunset ? nthEighth(sunrise, sunset, RAHU_KAAL_PART[weekday]) : null,
    yamaganda:
      sunrise && sunset ? nthEighth(sunrise, sunset, YAMAGANDA_PART[weekday]) : null,
    gulikaKaal:
      sunrise && sunset ? nthEighth(sunrise, sunset, GULIKA_PART[weekday]) : null,
    abhijit: sunrise && sunset ? abhijit(sunrise, sunset, weekday) : null,
    brahmaMuhurta: sunrise ? brahmaMuhurta(sunrise) : null,
  };

  const sunLon = calcBody(referenceJd, 'Sun', ayanamsa).longitude;
  const moonLon = calcBody(referenceJd, 'Moon', ayanamsa).longitude;

  return {
    date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
    place,
    sunrise,
    sunset,
    moonrise: moonriseJd ? julianDayToDate(moonriseJd) : null,
    moonset: moonsetJd ? julianDayToDate(moonsetJd) : null,
    tithi,
    vara: {
      index: weekday,
      name: VARA_NAMES[weekday],
      nameEn: VARA_NAMES_EN[weekday],
      lord: VARA_LORD[weekday],
    },
    nakshatra,
    yoga,
    karana,
    muhurta,
    moonSign: Math.floor(moonLon / 30),
    sunSign: Math.floor(sunLon / 30),
  };
}

// ---------------------------------------------------------------------------
// Hora — the planetary hour
// ---------------------------------------------------------------------------

export interface Hora {
  lord: Graha;
  start: Date;
  end: Date;
  /** Whether this hora falls in the daytime or the night. */
  period: 'day' | 'night';
}

/**
 * The twenty-four horas of a Vedic day.
 *
 * The first hora after sunrise belongs to the lord of the weekday, and the
 * sequence then follows the Chaldean order. Day and night horas are unequal —
 * each is a twelfth of its own half — which is why they are built separately.
 */
export function computeHoras(
  sunrise: Date,
  sunset: Date,
  nextSunrise: Date,
  weekday: number,
): Hora[] {
  const dayLord = VARA_LORD[weekday];
  const startIndex = HORA_ORDER.indexOf(dayLord);

  const horas: Hora[] = [];

  const dayHora = (sunset.getTime() - sunrise.getTime()) / 12;
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunrise.getTime() + i * dayHora);
    horas.push({
      lord: HORA_ORDER[(startIndex + i) % 7],
      start,
      end: new Date(start.getTime() + dayHora),
      period: 'day',
    });
  }

  const nightHora = (nextSunrise.getTime() - sunset.getTime()) / 12;
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunset.getTime() + i * nightHora);
    horas.push({
      lord: HORA_ORDER[(startIndex + 12 + i) % 7],
      start,
      end: new Date(start.getTime() + nightHora),
      period: 'night',
    });
  }

  return horas;
}

/** Number of whole days between two Julian Days — used when stepping dates. */
export function addDays(jd: number, days: number): number {
  return jd + days;
}

export { MS_PER_DAY };
