import type { AnyGraha, Graha } from './constants';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface GeoPoint {
  /** Degrees north, negative for south. */
  latitude: number;
  /** Degrees east, negative for west. */
  longitude: number;
  /** Metres above sea level. Affects rise/set times slightly. */
  altitude?: number;
}

export interface BirthPlace extends GeoPoint {
  /** Human-readable place, e.g. "Kolkata, West Bengal, India". */
  name: string;
  /** IANA zone id, e.g. "Asia/Kolkata". Resolved from coordinates if absent. */
  timezone?: string;
}

export interface BirthData {
  /** Local civil date and time at the place of birth. */
  year: number;
  /** 1–12. */
  month: number;
  /** 1–31. */
  day: number;
  /** 0–23. */
  hour: number;
  /** 0–59. */
  minute: number;
  /** 0–59. Optional; birth times are rarely recorded to the second. */
  second?: number;
  place: BirthPlace;
  /**
   * True when the birth time is not known. The chart is then cast for sunrise
   * and every time-sensitive result (ascendant, houses, dasha) is flagged as
   * unreliable rather than silently presented as fact.
   */
  timeUnknown?: boolean;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type AyanamsaName =
  | 'lahiri'
  | 'lahiri_1940'
  | 'true_chitra'
  | 'raman'
  | 'kp'
  | 'yukteshwar'
  | 'pushya_paksha'
  | 'true_pushya'
  | 'tropical';

export type HouseSystem =
  | 'whole_sign'
  | 'equal'
  | 'sripati'
  | 'placidus'
  | 'koch'
  | 'campanus';

export type NodeType = 'mean' | 'true';

export interface ChartSettings {
  ayanamsa: AyanamsaName;
  houseSystem: HouseSystem;
  /**
   * Indian practice overwhelmingly uses the Mean node, so that is the default.
   * KP and some Western-influenced schools prefer the True node.
   */
  nodeType: NodeType;
  /** Include Uranus, Neptune and Pluto alongside the nine grahas. */
  includeOuter: boolean;
}

export const DEFAULT_SETTINGS: ChartSettings = {
  ayanamsa: 'lahiri',
  houseSystem: 'whole_sign',
  nodeType: 'mean',
  includeOuter: false,
};

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

/** A zodiacal position broken into the parts a chart actually displays. */
export interface ZodiacPosition {
  /** Sidereal ecliptic longitude, 0–360. */
  longitude: number;
  /** Rashi index, 0 = Aries. */
  rashi: number;
  /** Degrees elapsed within the rashi, 0–30. */
  degreeInRashi: number;
  /** Nakshatra index, 0 = Ashwini. */
  nakshatra: number;
  /** Pada within the nakshatra, 1–4. */
  pada: number;
  /** Vimshottari lord of the occupied nakshatra. */
  nakshatraLord: Graha;
  /** Fraction of the nakshatra already traversed, 0–1. Drives dasha balance. */
  nakshatraElapsed: number;
}

export type Dignity =
  | 'exalted'
  | 'moolatrikona'
  | 'own'
  | 'great_friend'
  | 'friend'
  | 'neutral'
  | 'enemy'
  | 'great_enemy'
  | 'debilitated'
  | 'none';

export interface PlanetPosition extends ZodiacPosition {
  graha: AnyGraha;
  /** Ecliptic latitude in degrees. */
  latitude: number;
  /** Longitudinal speed in degrees per day. Negative means retrograde. */
  speed: number;
  retrograde: boolean;
  /** Distance from Earth in AU. */
  distance: number;
  /** House occupied, 1–12. */
  house: number;
  dignity: Dignity;
  /** Within the Sun's combustion orb. Never true for the Sun itself. */
  combust: boolean;
  /**
   * Functional nature relative to this specific ascendant, which is what
   * actually matters in judgement, as opposed to the natural benefic/malefic
   * classification.
   */
  functionalNature: 'benefic' | 'malefic' | 'neutral';
  /** Signs this graha aspects, as house numbers 1–12. */
  aspects: number[];
}

export interface HousePosition {
  /** 1–12. */
  house: number;
  /** Sidereal longitude of the cusp. */
  cusp: number;
  /** Rashi on the cusp. */
  rashi: number;
  /** Lord of the rashi on the cusp. */
  lord: Graha;
  /** Grahas physically placed in this house. */
  occupants: AnyGraha[];
  /** Grahas casting an aspect onto this house. */
  aspectedBy: AnyGraha[];
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

export interface ChartMeta {
  /** Julian day in Universal Time, the canonical instant for all calculation. */
  julianDayUT: number;
  /** The UTC instant, as an ISO 8601 string. */
  utcISO: string;
  /** Offset applied to convert local civil time to UT, in minutes. */
  utcOffsetMinutes: number;
  /** IANA zone actually used. */
  timezone: string;
  /**
   * True when the offset came from a historical rule rather than the modern
   * one, for example India's 1942–45 wartime +06:30. Surfaced in the UI so a
   * user can see why an old chart differs from other sites.
   */
  historicalOffset: boolean;
  ayanamsaValue: number;
  settings: ChartSettings;
  place: BirthPlace;
  timeUnknown: boolean;
}

export interface Chart {
  meta: ChartMeta;
  ascendant: ZodiacPosition;
  midheaven: ZodiacPosition;
  planets: PlanetPosition[];
  houses: HousePosition[];
  /** Convenience lookup by graha name. */
  byGraha: Record<string, PlanetPosition>;
}

// ---------------------------------------------------------------------------
// Divisional charts
// ---------------------------------------------------------------------------

export type VargaCode =
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D7'
  | 'D9'
  | 'D10'
  | 'D12'
  | 'D16'
  | 'D20'
  | 'D24'
  | 'D27'
  | 'D30'
  | 'D40'
  | 'D45'
  | 'D60';

export interface VargaChart {
  code: VargaCode;
  name: string;
  /** What this varga is read for. */
  signification: string;
  ascendantRashi: number;
  /** Rashi occupied by each graha in this divisional chart. */
  placements: { graha: AnyGraha; rashi: number; house: number }[];
}

// ---------------------------------------------------------------------------
// Dasha
// ---------------------------------------------------------------------------

export interface DashaPeriod {
  lord: Graha;
  start: Date;
  end: Date;
  /** 1 = Mahadasha, 2 = Antardasha, 3 = Pratyantardasha, and so on. */
  level: number;
  children?: DashaPeriod[];
}

export interface DashaTree {
  system: 'vimshottari';
  /** Nakshatra the Moon occupied at birth, which seeds the sequence. */
  seedNakshatra: number;
  /** Portion of the first mahadasha already elapsed at birth, in years. */
  balanceAtBirth: { lord: Graha; yearsRemaining: number };
  periods: DashaPeriod[];
}

// ---------------------------------------------------------------------------
// Panchang
// ---------------------------------------------------------------------------

export interface PanchangElement {
  index: number;
  name: string;
  /** When this element ends, if it ends within the day being examined. */
  endsAt?: Date;
  /** Fraction complete at the reference moment, 0–1. */
  elapsed: number;
}

export interface Panchang {
  date: string;
  place: BirthPlace;
  sunrise: Date | null;
  sunset: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  tithi: PanchangElement & { paksha: 'Shukla' | 'Krishna' };
  vara: { index: number; name: string; nameEn: string; lord: Graha };
  nakshatra: PanchangElement & { lord: Graha };
  yoga: PanchangElement;
  karana: PanchangElement;
  /** Inauspicious and auspicious windows for the day. */
  muhurta: {
    rahuKaal: TimeWindow | null;
    yamaganda: TimeWindow | null;
    gulikaKaal: TimeWindow | null;
    abhijit: TimeWindow | null;
    brahmaMuhurta: TimeWindow | null;
  };
  moonSign: number;
  sunSign: number;
}

export interface TimeWindow {
  start: Date;
  end: Date;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface YogaResult {
  name: string;
  sanskrit?: string;
  /** Positive yogas describe benefit, negative ones describe difficulty. */
  polarity: 'benefic' | 'malefic' | 'mixed';
  /** Why this yoga was detected, in plain language. */
  reason: string;
  strength: 'strong' | 'moderate' | 'weak';
  involvedGrahas: AnyGraha[];
}

export interface SadeSatiPhase {
  phase: 'rising' | 'peak' | 'setting';
  start: Date;
  end: Date;
  /** The rashi Saturn transits during this phase. */
  rashi: number;
}

export interface SadeSatiResult {
  active: boolean;
  currentPhase: SadeSatiPhase | null;
  /** All past and future phases within the window examined. */
  phases: SadeSatiPhase[];
  /** Small panoti, Saturn's 4th/8th transit from the Moon. */
  dhaiya: { active: boolean; type: 'kantaka' | 'ashtama' | null };
}

export interface TransitEvent {
  date: Date;
  graha: AnyGraha;
  kind: 'ingress' | 'retrograde' | 'direct' | 'combustion' | 'return';
  /** Rashi entered, for ingress events. */
  rashi?: number;
  description: string;
}
