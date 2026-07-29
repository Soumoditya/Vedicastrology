import {
  NAKSHATRA_LORD,
  NAKSHATRA_NAMES,
  RASHI_NAMES,
  RASHI_NAMES_EN,
  type Graha,
} from './constants';
import type { ZodiacPosition } from './types';
import { norm360 } from './ephemeris';

/** One nakshatra spans 13°20′. */
export const NAKSHATRA_SPAN = 360 / 27;
/** One pada spans 3°20′. */
export const PADA_SPAN = NAKSHATRA_SPAN / 4;

/**
 * Break a sidereal longitude into every component a Vedic chart displays.
 * This is the single conversion point from "a number of degrees" to "a place in
 * the zodiac", so rounding behaves consistently everywhere.
 */
export function describeLongitude(longitude: number): ZodiacPosition {
  const lon = norm360(longitude);

  const rashi = Math.floor(lon / 30);
  const degreeInRashi = lon - rashi * 30;

  const nakshatraExact = lon / NAKSHATRA_SPAN;
  const nakshatra = Math.floor(nakshatraExact);
  const nakshatraElapsed = nakshatraExact - nakshatra;
  const pada = Math.floor(nakshatraElapsed * 4) + 1;

  return {
    longitude: lon,
    rashi,
    degreeInRashi,
    nakshatra,
    pada,
    nakshatraLord: NAKSHATRA_LORD[nakshatra],
    nakshatraElapsed,
  };
}

/** Whole-sign house of a longitude, given the ascendant's rashi. Returns 1–12. */
export function houseOf(longitude: number, ascendantRashi: number): number {
  const rashi = Math.floor(norm360(longitude) / 30);
  return ((rashi - ascendantRashi + 12) % 12) + 1;
}

/**
 * House of a longitude for cusp-based systems, where houses have unequal size.
 * A planet belongs to the house whose cusp it has passed but whose successor's
 * cusp it has not.
 */
export function houseOfCusps(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const span = norm360(end - start);
    const offset = norm360(lon - start);
    if (offset < span) return i + 1;
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export interface DmsParts {
  degrees: number;
  minutes: number;
  seconds: number;
}

export function toDms(degrees: number): DmsParts {
  const total = Math.abs(degrees);
  const d = Math.floor(total);
  const minFloat = (total - d) * 60;
  const m = Math.floor(minFloat);
  const s = (minFloat - m) * 60;
  return { degrees: d, minutes: m, seconds: s };
}

/** e.g. `9°50'17"` */
export function formatDms(degrees: number, withSeconds = true): string {
  const { degrees: d, minutes: m, seconds: s } = toDms(degrees);
  const base = `${d}°${String(m).padStart(2, '0')}'`;
  return withSeconds ? `${base}${String(Math.floor(s)).padStart(2, '0')}"` : base;
}

/** e.g. `Libra 9°50'17"` */
export function formatPosition(longitude: number, withSeconds = true): string {
  const { rashi, degreeInRashi } = describeLongitude(longitude);
  return `${RASHI_NAMES_EN[rashi]} ${formatDms(degreeInRashi, withSeconds)}`;
}

/** e.g. `Tula 9°50'` — the Sanskrit form, for the traditional presentation. */
export function formatPositionSa(longitude: number, withSeconds = false): string {
  const { rashi, degreeInRashi } = describeLongitude(longitude);
  return `${RASHI_NAMES[rashi]} ${formatDms(degreeInRashi, withSeconds)}`;
}

/** e.g. `Chitra pada 2` */
export function formatNakshatra(longitude: number): string {
  const { nakshatra, pada } = describeLongitude(longitude);
  return `${NAKSHATRA_NAMES[nakshatra]} pada ${pada}`;
}

// ---------------------------------------------------------------------------
// Relationships between signs and houses
// ---------------------------------------------------------------------------

/** Distance from one rashi to another, counted inclusively as Vedic texts do. */
export function signDistance(from: number, to: number): number {
  return ((to - from + 12) % 12) + 1;
}

/** Rashi that lies `count` signs from `from`, counting inclusively. */
export function signFrom(from: number, count: number): number {
  return (from + count - 1) % 12;
}

/** Nakshatra distance counted inclusively, the basis of Tara Bala. */
export function nakshatraDistance(from: number, to: number): number {
  return ((to - from + 27) % 27) + 1;
}

export function nakshatraLordOf(nakshatra: number): Graha {
  return NAKSHATRA_LORD[nakshatra % 27];
}
