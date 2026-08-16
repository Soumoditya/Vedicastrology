import { DateTime } from 'luxon';

import { calcRiseSet, dateToJulianDay, julianDayToDate } from './ephemeris';
import { lmtOffsetMinutes } from './time';
import type { Chart } from './types';

/**
 * The birth time panel of a traditional report.
 *
 * A printed kundli opens with a block of times that most software skips:
 * ishtakaal, the local time correction, the war time correction, LMT and GMT at
 * birth, sunrise, sunset and the length of the day. None of it is decorative.
 *
 * Before clocks were standardised, a chart was cast from the time elapsed since
 * sunrise, measured in ghati and pala. Ishtakaal is that number, and it is the
 * figure an older astrologer will ask for rather than the wall-clock time,
 * because it is independent of which zone a government later drew a line
 * through. Showing it, alongside the corrections that get from the clock on the
 * wall to the sky overhead, is what lets somebody check this chart against one
 * cast by hand fifty years ago.
 *
 * The units:
 *   1 ghati  = 24 minutes  (60 ghati in a day)
 *   1 pala   = 24 seconds  (60 pala in a ghati)
 *   1 vipala = 0.4 seconds (60 vipala in a pala)
 */

const MINUTES_PER_GHATI = 24;
const SECONDS_PER_PALA = 24;
const MS_PER_MINUTE = 60_000;

export interface Ishtakaal {
  /** Whole ghati elapsed since sunrise. */
  ghati: number;
  pala: number;
  vipala: number;
  /** The same interval as hours, minutes and seconds. */
  clock: string;
  /** "23 gh 41 pa 15 vi", the form a printed kundli uses. */
  formatted: string;
  /** Total elapsed minutes since the sunrise that governs this birth. */
  minutesSinceSunrise: number;
}

export interface BirthTimeDetails {
  /** Wall-clock civil time at the place of birth. */
  civil: string;
  /** The same instant in Universal Time. */
  gmt: string;
  /** The same instant on a Local Mean Time clock, set by longitude alone. */
  lmt: string;
  /**
   * Longitude correction: the difference between the zone's standard meridian
   * and the actual meridian of birth, in minutes. Positive means local mean
   * time runs ahead of the zone.
   */
  localTimeCorrection: number;
  localTimeCorrectionFormatted: string;
  /**
   * The extra offset a wartime rule imposed, in minutes, or zero. India ran
   * +06:30 from 1942 to 1945, so a birth in those years is half an hour out
   * from what a modern calculator assumes.
   */
  warTimeCorrection: number;
  warTimeCorrectionFormatted: string;
  /** Zone offset actually applied, as +05:30. */
  zoneOffsetFormatted: string;
  sunrise: Date | null;
  sunset: Date | null;
  /** Sunrise of the day the birth belongs to, which may be the previous day. */
  governingSunrise: Date | null;
  dayDurationMinutes: number | null;
  dayDurationFormatted: string | null;
  nightDurationMinutes: number | null;
  nightDurationFormatted: string | null;
  ishtakaal: Ishtakaal | null;
}

/**
 * Convert an interval since sunrise into ghati, pala and vipala.
 *
 * Rounding is done once, on the total vipala, and the units are then carried
 * out of that single integer. Rounding each unit separately produces the
 * classic off-by-one where 59 pala 60 vipala prints instead of the next ghati.
 */
export function toIshtakaal(minutesSinceSunrise: number): Ishtakaal {
  const totalSeconds = minutesSinceSunrise * 60;
  const totalVipala = Math.round(totalSeconds / 0.4);

  const vipalaPerPala = 60;
  const vipalaPerGhati = vipalaPerPala * 60;

  const ghati = Math.floor(totalVipala / vipalaPerGhati);
  const pala = Math.floor((totalVipala % vipalaPerGhati) / vipalaPerPala);
  const vipala = totalVipala % vipalaPerPala;

  const wholeSeconds = Math.round(totalSeconds);
  const hh = Math.floor(wholeSeconds / 3600);
  const mm = Math.floor((wholeSeconds % 3600) / 60);
  const ss = wholeSeconds % 60;

  return {
    ghati,
    pala,
    vipala,
    clock: `${pad(hh)}:${pad(mm)}:${pad(ss)}`,
    formatted: `${ghati} gh ${pala} pa ${vipala} vi`,
    minutesSinceSunrise,
  };
}

/**
 * Everything in the birth time block of a report.
 *
 * Sunrise is found for the civil date of birth first. If the birth happened
 * before that sunrise then it belongs, in the traditional reckoning, to the
 * previous day, and the previous sunrise is the one ishtakaal counts from.
 * Missing this is why some software reports 59 ghati for a birth at four in
 * the morning instead of the correct one or two.
 */
export function birthTimeDetails(chart: Chart): BirthTimeDetails {
  const { meta } = chart;
  const zone = meta.timezone;
  const { latitude, longitude } = meta.place;

  const utc = new Date(meta.utcISO);
  const local = DateTime.fromJSDate(utc, { zone });

  // The longitude correction is the gap between the meridian the zone is drawn
  // around and the meridian actually stood on.
  const localTimeCorrection = Math.round(lmtOffsetMinutes(longitude) - meta.utcOffsetMinutes);

  // Anything beyond the zone's present-day offset that is not explained by
  // daylight saving is a wartime or otherwise historical rule. Reported rather
  // than silently applied, because a user comparing against another site needs
  // to see the half hour that explains the difference.
  const modernOffset = DateTime.fromJSDate(new Date(), { zone }).offset;
  const warTimeCorrection = meta.historicalOffset
    ? Math.round(meta.utcOffsetMinutes - modernOffset)
    : 0;

  const lmt = DateTime.fromJSDate(utc, { zone: 'utc' })
    .plus({ minutes: lmtOffsetMinutes(longitude) })
    .toFormat('dd LLL yyyy, HH:mm:ss');

  const sunrise = riseSet(local.startOf('day'), latitude, longitude, 'rise');
  const sunset = riseSet(local.startOf('day'), latitude, longitude, 'set');

  // A birth before today's sunrise belongs to yesterday's Hindu day.
  let governingSunrise = sunrise;
  if (sunrise && utc.getTime() < sunrise.getTime()) {
    governingSunrise = riseSet(local.startOf('day').minus({ days: 1 }), latitude, longitude, 'rise');
  }

  const dayDurationMinutes =
    sunrise && sunset ? (sunset.getTime() - sunrise.getTime()) / MS_PER_MINUTE : null;

  const ishtakaal =
    governingSunrise && !meta.timeUnknown
      ? toIshtakaal((utc.getTime() - governingSunrise.getTime()) / MS_PER_MINUTE)
      : null;

  return {
    civil: local.toFormat('dd LLL yyyy, HH:mm:ss'),
    gmt: DateTime.fromJSDate(utc, { zone: 'utc' }).toFormat('dd LLL yyyy, HH:mm:ss'),
    lmt,
    localTimeCorrection,
    localTimeCorrectionFormatted: signedMinutes(localTimeCorrection),
    warTimeCorrection,
    warTimeCorrectionFormatted:
      warTimeCorrection === 0 ? 'None' : signedMinutes(warTimeCorrection),
    zoneOffsetFormatted: signedMinutes(meta.utcOffsetMinutes),
    sunrise,
    sunset,
    governingSunrise,
    dayDurationMinutes,
    dayDurationFormatted: dayDurationMinutes === null ? null : hoursMinutes(dayDurationMinutes),
    nightDurationMinutes: dayDurationMinutes === null ? null : 1440 - dayDurationMinutes,
    nightDurationFormatted:
      dayDurationMinutes === null ? null : hoursMinutes(1440 - dayDurationMinutes),
    ishtakaal,
  };
}

// ---------------------------------------------------------------------------

function riseSet(
  dayStart: DateTime,
  latitude: number,
  longitude: number,
  which: 'rise' | 'set',
): Date | null {
  try {
    const jd = dateToJulianDay(dayStart.toUTC().toJSDate());
    const found = calcRiseSet(jd, 'Sun', latitude, longitude, 0, which);
    return found === null ? null : julianDayToDate(found);
  } catch {
    // Above the Arctic circle in midsummer there is no sunrise. A report should
    // print a dash there rather than fail to render at all.
    return null;
  }
}

function pad(n: number): string {
  return String(Math.abs(n)).padStart(2, '0');
}

function signedMinutes(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function hoursMinutes(minutes: number): string {
  const whole = Math.round(minutes);
  return `${Math.floor(whole / 60)} h ${whole % 60} m`;
}

export { MINUTES_PER_GHATI, SECONDS_PER_PALA };
