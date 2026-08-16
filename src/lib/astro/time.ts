import { DateTime } from 'luxon';
import tzLookup from 'tz-lookup';

import type { BirthData } from './types';
import { toJulianDay } from './ephemeris';

/**
 * Local civil time → Universal Time.
 *
 * This is the least glamorous module in the engine and the one most likely to
 * be wrong elsewhere. A chart cast from the wrong UT is wrong in every single
 * value it produces, and the error is invisible, the output still looks like a
 * perfectly reasonable chart.
 *
 * Three cases routinely break naive implementations:
 *
 *   - India before 1906 used Madras Mean Time (+05:21:10), not +05:30.
 *   - India used +06:30 from 1942-09-01 to 1945-10-15 (wartime).
 *   - Any birth inside a daylight-saving transition is either ambiguous
 *     (the hour repeats) or non-existent (the hour is skipped).
 *
 * We resolve all three from the IANA time zone database, which encodes the
 * actual legal history of every zone, and we report when a historical or
 * ambiguous rule was applied so the user can see why a chart may differ from
 * another site.
 */

export type OffsetMode =
  | 'civil'
  /** Local mean time from longitude, used by some astrologers for old charts. */
  | 'lmt'
  /** Caller supplies the offset explicitly, overriding all lookup. */
  | 'manual';

export interface TimeResolution {
  julianDayUT: number;
  utcISO: string;
  utcDate: Date;
  offsetMinutes: number;
  timezone: string;
  /** The offset differs from what the same zone uses today. */
  historicalOffset: boolean;
  /** Daylight saving was in force at this moment. */
  daylightSaving: boolean;
  /**
   * The wall-clock time occurs twice (clocks went back). We take the first
   * occurrence, which is the near-universal convention.
   */
  ambiguous: boolean;
  /**
   * The wall-clock time never occurred (clocks went forward). We move forward
   * to the first valid instant.
   */
  nonExistent: boolean;
  /** Human-readable explanation, shown in the UI when anything unusual applied. */
  note?: string;
}

/** IANA zone for a coordinate. Offline, no network call, no API key. */
export function timezoneFor(latitude: number, longitude: number): string {
  try {
    return tzLookup(latitude, longitude);
  } catch {
    // tz-lookup throws on out-of-range coordinates. Fall back to the zone
    // implied by longitude, rounded to the nearest hour.
    const hours = Math.round(longitude / 15);
    return `Etc/GMT${hours >= 0 ? '-' : '+'}${Math.abs(hours)}`;
  }
}

/** Local mean time offset in minutes: four minutes of time per degree. */
export function lmtOffsetMinutes(longitude: number): number {
  return longitude * 4;
}

function pad(n: number): string {
  return String(Math.abs(Math.trunc(n))).padStart(2, '0');
}

/** Format an offset in minutes as "+05:30". Handles fractional minutes. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.floor(abs % 60);
  const s = Math.round((abs % 1) * 60);
  return `${sign}${pad(h)}:${pad(m)}${s ? `:${pad(s)}` : ''}`;
}

export interface ResolveOptions {
  mode?: OffsetMode;
  /** Required when mode is 'manual'. */
  manualOffsetMinutes?: number;
}

export function resolveTime(
  birth: BirthData,
  options: ResolveOptions = {},
): TimeResolution {
  const { mode = 'civil', manualOffsetMinutes } = options;
  const { year, month, day, hour, minute, second = 0, place } = birth;

  const zone = place.timezone || timezoneFor(place.latitude, place.longitude);

  // -- Explicit offset -----------------------------------------------------
  if (mode === 'manual') {
    if (manualOffsetMinutes === undefined) {
      throw new Error("resolveTime: mode 'manual' requires manualOffsetMinutes");
    }
    return fromFixedOffset(
      { year, month, day, hour, minute, second },
      manualOffsetMinutes,
      zone,
      false,
      `Using the offset you supplied (${formatOffset(manualOffsetMinutes)}).`,
    );
  }

  // -- Local mean time -----------------------------------------------------
  if (mode === 'lmt') {
    const off = lmtOffsetMinutes(place.longitude);
    return fromFixedOffset(
      { year, month, day, hour, minute, second },
      off,
      zone,
      true,
      `Local mean time for longitude ${place.longitude.toFixed(4)}° ` +
        `(${formatOffset(off)}), rather than the civil clock.`,
    );
  }

  // -- Civil time from the IANA database -----------------------------------
  const requested = { year, month, day, hour, minute, second };
  let dt = DateTime.fromObject(requested, { zone });

  if (!dt.isValid) {
    throw new Error(`Invalid birth date/time for zone ${zone}: ${dt.invalidReason}`);
  }

  // Luxon shifts a non-existent local time forward past the gap, so a changed
  // wall-clock value is how we detect a spring-forward birth.
  const nonExistent = dt.hour !== hour || dt.minute !== minute;

  // The wall-clock time is ambiguous when a later instant maps to the same
  // local reading, i.e. clocks went back. Half-hour shifts exist (Lord Howe),
  // so both step sizes are checked.
  const wall = (d: DateTime) => d.toFormat('yyyy-MM-dd HH:mm');
  const ambiguous =
    !nonExistent &&
    ([60, 30] as const).some(
      (mins) => wall(dt.toUTC().plus({ minutes: mins }).setZone(zone)) === wall(dt),
    );

  if (ambiguous) {
    // Take the first occurrence, the standard convention.
    const earlier = dt.toUTC().minus({ minutes: 60 }).setZone(zone);
    if (wall(earlier) === wall(dt)) dt = earlier;
  }

  const offsetMinutes = dt.offset;

  // Compare against the offset the same zone uses now, to spot historical rules
  // such as India's pre-1906 Madras time or its 1942–45 wartime offset.
  const todayOffset = DateTime.fromObject(
    { year: new Date().getUTCFullYear(), month: 1, day: 15, hour: 12 },
    { zone },
  ).offset;
  const historicalOffset = offsetMinutes !== todayOffset && !dt.isInDST;

  const notes: string[] = [];
  if (historicalOffset) {
    notes.push(
      `${zone} used ${formatOffset(offsetMinutes)} on this date, not the ` +
        `present-day ${formatOffset(todayOffset)}. The historical offset has been applied.`,
    );
  }
  if (dt.isInDST) {
    notes.push('Daylight saving time was in force and has been accounted for.');
  }
  if (ambiguous) {
    notes.push(
      'Clocks went back on this date, so this wall-clock time occurred twice. ' +
        'The first occurrence has been used.',
    );
  }
  if (nonExistent) {
    notes.push(
      'Clocks went forward on this date, so this wall-clock time never ' +
        `occurred. The nearest valid time (${dt.toFormat('HH:mm')}) has been used.`,
    );
  }

  const utc = dt.toUTC();
  const julianDayUT = toJulianDay(
    utc.year,
    utc.month,
    utc.day,
    utc.hour + utc.minute / 60 + utc.second / 3600 + utc.millisecond / 3_600_000,
  );

  return {
    julianDayUT,
    utcISO: utc.toISO() ?? '',
    utcDate: utc.toJSDate(),
    offsetMinutes,
    timezone: zone,
    historicalOffset,
    daylightSaving: dt.isInDST,
    ambiguous,
    nonExistent,
    note: notes.length ? notes.join(' ') : undefined,
  };
}

function fromFixedOffset(
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
  offsetMinutes: number,
  zone: string,
  historicalOffset: boolean,
  note: string,
): TimeResolution {
  const localMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const utcDate = new Date(localMs - offsetMinutes * 60_000);

  const julianDayUT = toJulianDay(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth() + 1,
    utcDate.getUTCDate(),
    utcDate.getUTCHours() +
      utcDate.getUTCMinutes() / 60 +
      utcDate.getUTCSeconds() / 3600 +
      utcDate.getUTCMilliseconds() / 3_600_000,
  );

  return {
    julianDayUT,
    utcISO: utcDate.toISOString(),
    utcDate,
    offsetMinutes,
    timezone: zone,
    historicalOffset,
    daylightSaving: false,
    ambiguous: false,
    nonExistent: false,
    note,
  };
}

/**
 * Render a UTC instant in the birth place's local zone.
 * Used everywhere results are shown, so dasha dates and panchang windows read
 * in the user's own local time rather than UTC.
 */
export function toLocal(date: Date, zone: string): DateTime {
  return DateTime.fromJSDate(date, { zone });
}

export function formatLocal(date: Date, zone: string, fmt = 'dd LLL yyyy, HH:mm'): string {
  return toLocal(date, zone).toFormat(fmt);
}
