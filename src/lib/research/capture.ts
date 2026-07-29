import 'server-only';

import { buildVarga, COMMON_VARGAS } from '@/lib/astro/divisional';
import { GRAHA_ABBR } from '@/lib/astro/constants';
import type { Chart } from '@/lib/astro/types';

/**
 * Turning a chart into a research record.
 *
 * Two principles shape what goes in:
 *
 *   Nothing identifying. No name, no email, no user id, no exact place name.
 *   Only the country is kept, because "born in India" is a useful research
 *   variable while "born in Barrackpore" narrows a person to a few thousand.
 *
 *   Denormalised for querying. The whole point is that "how many charts have
 *   Saturn in the seventh" should be one SQL query, not a job that recomputes
 *   every chart. Positions are also kept in full, so a question nobody
 *   anticipated is still answerable later.
 */

export interface ResearchRow {
  subject_key: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number | null;
  birth_minute: number | null;
  birth_time_known: boolean;
  timezone: string;
  utc_offset_minutes: number;
  latitude: number;
  longitude: number;
  place_country: string | null;
  ascendant_rashi: number;
  ascendant_degree: number;
  ascendant_nakshatra: number;
  sun_rashi: number;
  moon_rashi: number;
  moon_nakshatra: number;
  moon_pada: number;
  birth_dasha_lord: string;
  planets: unknown;
  vargas: unknown;
  yogas: string[];
  gender: string | null;
  ayanamsa: string;
  house_system: string;
  node_type: string;
  source: string;
}

export interface CaptureInput {
  subjectKey: string;
  chart: Chart;
  /** Local birth date and time as entered, not the UT instant. */
  local: { year: number; month: number; day: number; hour: number; minute: number };
  gender?: string | null;
  source?: string;
}

/**
 * Extract the country from a place label such as
 * "Kolkata, West Bengal, India". The label is built by the geocoder as
 * "city, region, country", so the last segment is the country.
 */
function countryFromPlace(placeName: string): string | null {
  const parts = placeName.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

export function buildResearchRow({
  subjectKey,
  chart,
  local,
  gender,
  source = 'account',
}: CaptureInput): ResearchRow {
  const timeKnown = !chart.meta.timeUnknown;

  const planets = chart.planets.map((p) => ({
    g: GRAHA_ABBR[p.graha],
    // Rounded to a thousandth of a degree, which is far finer than any
    // interpretation needs and keeps the payload small.
    lon: Number(p.longitude.toFixed(3)),
    rashi: p.rashi,
    house: p.house,
    nak: p.nakshatra,
    pada: p.pada,
    dignity: p.dignity,
    retro: p.retrograde,
    combust: p.combust,
    nature: p.functionalNature,
  }));

  const vargas: Record<string, number[]> = {};
  for (const code of COMMON_VARGAS) {
    if (code === 'D1') continue;
    const varga = buildVarga(chart, code);
    vargas[code] = varga.placements.map((p) => p.rashi);
  }

  return {
    subject_key: subjectKey,
    birth_year: local.year,
    birth_month: local.month,
    birth_day: local.day,
    birth_hour: timeKnown ? local.hour : null,
    birth_minute: timeKnown ? local.minute : null,
    birth_time_known: timeKnown,
    timezone: chart.meta.timezone,
    utc_offset_minutes: chart.meta.utcOffsetMinutes,
    latitude: Number(chart.meta.place.latitude.toFixed(4)),
    longitude: Number(chart.meta.place.longitude.toFixed(4)),
    place_country: countryFromPlace(chart.meta.place.name),
    ascendant_rashi: chart.ascendant.rashi,
    ascendant_degree: Number(chart.ascendant.degreeInRashi.toFixed(3)),
    ascendant_nakshatra: chart.ascendant.nakshatra,
    sun_rashi: chart.byGraha.Sun.rashi,
    moon_rashi: chart.byGraha.Moon.rashi,
    moon_nakshatra: chart.byGraha.Moon.nakshatra,
    moon_pada: chart.byGraha.Moon.pada,
    birth_dasha_lord: chart.byGraha.Moon.nakshatraLord,
    planets,
    vargas,
    // Populated once the yoga rule engine lands.
    yogas: [],
    gender: gender ?? null,
    ayanamsa: chart.meta.settings.ayanamsa,
    house_system: chart.meta.settings.houseSystem,
    node_type: chart.meta.settings.nodeType,
    source,
  };
}
