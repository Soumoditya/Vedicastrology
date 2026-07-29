import 'server-only';

import { ashtakavarga } from '@/lib/astro/ashtakavarga';
import { buildVarga, COMMON_VARGAS } from '@/lib/astro/divisional';
import { GRAHA_ABBR } from '@/lib/astro/constants';
import { mangalDosha } from '@/lib/astro/matching';
import { detectYogas } from '@/lib/astro/yogas';
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
  doshas: string[];
  manglik: boolean;
  manglik_cancelled: boolean;
  kalsarpa_type: string | null;
  kalsarpa_partial: boolean;
  sarvashtakavarga: number[];
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

  /*
    Names only, deduplicated. The engine's full findings carry the reason each
    one fired, which is the right thing to show a person reading their own
    chart and the wrong thing to store here: a research row wants a value it can
    be grouped by, not a paragraph.

    Benefic and malefic go in separate columns rather than one, because almost
    every question worth asking treats them differently.
  */
  const report = detectYogas(chart);
  const manglik = mangalDosha(chart);
  const av = ashtakavarga(chart);

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
    /*
      Rounded to a tenth of a degree, roughly an eleven kilometre grid.

      Four decimal places, which is what this stored before, locates a birth to
      about eleven metres. That is a house. It sat directly under a comment
      saying the exact place name is withheld because it narrows a person too
      far, while storing something far sharper than the name. A tenth of a
      degree keeps every regional question answerable and identifies nobody.

      Nothing is lost for chart work either: the graha positions were computed
      from the full precision coordinates before this rounding, and it is the
      positions that get stored.
    */
    latitude: Number(chart.meta.place.latitude.toFixed(1)),
    longitude: Number(chart.meta.place.longitude.toFixed(1)),
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
    yogas: [...new Set(report.yogas.map((y) => y.name))],
    doshas: [...new Set(report.doshas.map((d) => d.name))],
    manglik: manglik.present,
    manglik_cancelled: manglik.cancelled,
    kalsarpa_type: report.kalsarpa.present ? report.kalsarpa.typeName : null,
    kalsarpa_partial: report.kalsarpa.partial,
    sarvashtakavarga: av.sarva,
    gender: gender ?? null,
    ayanamsa: chart.meta.settings.ayanamsa,
    house_system: chart.meta.settings.houseSystem,
    node_type: chart.meta.settings.nodeType,
    source,
  };
}
