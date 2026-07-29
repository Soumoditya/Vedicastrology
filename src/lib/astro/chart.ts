import 'server-only';

import {
  GRAHAS,
  OUTER_GRAHAS,
  RASHI_LORD,
  type AnyGraha,
  type Graha,
} from './constants';
import {
  DEFAULT_SETTINGS,
  type BirthData,
  type Chart,
  type ChartSettings,
  type HousePosition,
  type PlanetPosition,
} from './types';
import { calcBody, calcHouses, getAyanamsa, norm360 } from './ephemeris';
import { resolveTime, type ResolveOptions } from './time';
import { describeLongitude, houseOf, houseOfCusps } from './zodiac';
import {
  aspectedHouses,
  determineDignity,
  functionalNature,
  isCombust,
  isNavagraha,
} from './dignity';

export interface CastOptions extends ResolveOptions {
  settings?: Partial<ChartSettings>;
}

/**
 * Cast a complete natal chart.
 *
 * Order matters here: time must be resolved before anything else, the Sun is
 * needed before combustion can be judged, and every graha's sign must be known
 * before dignity can be settled, because dignity depends on where the
 * dispositor sits.
 */
export function castChart(birth: BirthData, options: CastOptions = {}): Chart {
  const settings: ChartSettings = { ...DEFAULT_SETTINGS, ...options.settings };

  // 1. Local civil time → Universal Time.
  const time = resolveTime(birth, options);
  const jd = time.julianDayUT;

  // 2. Ascendant and house cusps.
  const houseResult = calcHouses(
    jd,
    birth.place.latitude,
    birth.place.longitude,
    settings.ayanamsa,
    settings.houseSystem,
  );

  const ascendant = describeLongitude(houseResult.ascendant);
  const midheaven = describeLongitude(houseResult.midheaven);
  const ascendantRashi = ascendant.rashi;

  // 3. Raw positions for every body we intend to show.
  const bodies: AnyGraha[] = settings.includeOuter
    ? [...GRAHAS, ...OUTER_GRAHAS]
    : [...GRAHAS];

  const raw = bodies.map((graha) => ({
    graha,
    ...calcBody(jd, graha, settings.ayanamsa, settings.nodeType),
  }));

  const sunLongitude = raw.find((r) => r.graha === 'Sun')!.longitude;

  // 4. Every graha's rashi must be known before dignity can be judged, since
  //    the compound relationship depends on where the dispositor sits.
  const rashiByGraha: Partial<Record<Graha, number>> = {};
  for (const r of raw) {
    if (isNavagraha(r.graha)) {
      rashiByGraha[r.graha] = Math.floor(r.longitude / 30);
    }
  }

  const useCusps = settings.houseSystem !== 'whole_sign';

  const planets: PlanetPosition[] = raw.map((r) => {
    const position = describeLongitude(r.longitude);

    // Rahu and Ketu are always retrograde in the mean node; the true node
    // occasionally turns direct, and the speed sign reports that faithfully.
    const retrograde =
      r.graha === 'Rahu' || r.graha === 'Ketu' ? r.speed <= 0 : r.speed < 0;

    const house = useCusps
      ? houseOfCusps(r.longitude, houseResult.cusps)
      : houseOf(r.longitude, ascendantRashi);

    const dignity = isNavagraha(r.graha)
      ? determineDignity({
          graha: r.graha,
          longitude: r.longitude,
          positionsByGraha: rashiByGraha,
        })
      : 'none';

    return {
      ...position,
      graha: r.graha,
      latitude: r.latitude,
      speed: r.speed,
      retrograde,
      distance: r.distance,
      house,
      dignity,
      combust: isCombust(r.graha, r.longitude, sunLongitude, retrograde),
      functionalNature: functionalNature(r.graha, ascendantRashi),
      aspects: aspectedHouses(r.graha, house),
    };
  });

  // 5. Houses, with their occupants and the grahas aspecting them.
  const houses: HousePosition[] = [];
  for (let i = 0; i < 12; i++) {
    const houseNumber = i + 1;
    const cusp = useCusps
      ? houseResult.cusps[i]
      : norm360((ascendantRashi + i) * 30);
    const rashi = useCusps
      ? Math.floor(cusp / 30)
      : (ascendantRashi + i) % 12;

    houses.push({
      house: houseNumber,
      cusp,
      rashi,
      lord: RASHI_LORD[rashi],
      occupants: planets.filter((p) => p.house === houseNumber).map((p) => p.graha),
      aspectedBy: planets
        .filter((p) => p.aspects.includes(houseNumber))
        .map((p) => p.graha),
    });
  }

  const byGraha: Record<string, PlanetPosition> = {};
  for (const p of planets) byGraha[p.graha] = p;

  return {
    meta: {
      julianDayUT: jd,
      utcISO: time.utcISO,
      utcOffsetMinutes: time.offsetMinutes,
      timezone: time.timezone,
      historicalOffset: time.historicalOffset,
      ayanamsaValue: getAyanamsa(jd, settings.ayanamsa),
      settings,
      place: { ...birth.place, timezone: time.timezone },
      timeUnknown: birth.timeUnknown ?? false,
    },
    ascendant,
    midheaven,
    planets,
    houses,
    byGraha,
  };
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** Rashi (Moon sign), the sign most Vedic prediction is read from. */
export function moonRashi(chart: Chart): number {
  return chart.byGraha.Moon.rashi;
}

/** Janma nakshatra, the Moon's nakshatra at birth. */
export function janmaNakshatra(chart: Chart): number {
  return chart.byGraha.Moon.nakshatra;
}

/**
 * Whether the Moon is waxing. Needed to decide the Moon's benefic status, and
 * to name the paksha.
 */
export function isWaxingMoon(chart: Chart): boolean {
  const elongation = norm360(chart.byGraha.Moon.longitude - chart.byGraha.Sun.longitude);
  return elongation < 180;
}

/**
 * Paksha bala for the Moon: a bright-fortnight Moon is a full benefic, a
 * dark-fortnight Moon is not. This is why the natural classification in
 * `constants.ts` is only a default.
 */
export function moonIsBenefic(chart: Chart): boolean {
  const elongation = norm360(chart.byGraha.Moon.longitude - chart.byGraha.Sun.longitude);
  // Within 72° either side of the Sun the Moon is weak and not treated benefic.
  return elongation > 72 && elongation < 288;
}

/** Grahas placed in a given house, 1–12. */
export function grahasInHouse(chart: Chart, house: number): PlanetPosition[] {
  return chart.planets.filter((p) => p.house === house);
}

/** Grahas placed in a given rashi, 0–11. */
export function grahasInRashi(chart: Chart, rashi: number): PlanetPosition[] {
  return chart.planets.filter((p) => p.rashi === rashi);
}

/** Where the lord of a house sits. Central to almost all yoga judgement. */
export function houseLordPosition(chart: Chart, house: number): PlanetPosition | null {
  const lord = chart.houses[house - 1]?.lord;
  return lord ? chart.byGraha[lord] ?? null : null;
}
