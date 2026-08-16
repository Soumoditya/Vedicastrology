import { timezoneFor } from '../astro/time';

/**
 * Place lookup.
 *
 * Uses Open-Meteo's geocoding API: free, no API key, no attribution
 * requirement, and generous enough for this traffic. The time zone is resolved
 * locally from the coordinates rather than trusting the API's own field, so a
 * missing or stale zone never silently corrupts a chart.
 */

export interface PlaceResult {
  id: string;
  name: string;
  /** Full display label, e.g. "Kolkata, West Bengal, India". */
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
  countryCode: string;
  admin1?: string;
  population?: number;
}

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
  population?: number;
}

const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

export async function searchPlaces(
  query: string,
  { limit = 8, language = 'en' }: { limit?: number; language?: string } = {},
): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', String(limit));
  url.searchParams.set('language', language);
  url.searchParams.set('format', 'json');

  const response = await fetch(url, {
    // Place coordinates never change, so these are safe to cache hard.
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!response.ok) {
    throw new Error(`Place search failed (${response.status})`);
  }

  const body = (await response.json()) as { results?: OpenMeteoResult[] };
  if (!body.results) return [];

  return body.results.map(toPlaceResult);
}

function toPlaceResult(r: OpenMeteoResult): PlaceResult {
  const parts = [r.name, r.admin1, r.country].filter(Boolean);

  return {
    id: String(r.id),
    name: r.name,
    label: parts.join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
    // Resolved from coordinates, not taken from the API response.
    timezone: timezoneFor(r.latitude, r.longitude),
    country: r.country ?? '',
    countryCode: r.country_code ?? '',
    admin1: r.admin1,
    population: r.population,
  };
}

/**
 * A small set of major Indian cities, served instantly with no network call.
 *
 * Most visitors will be searching for one of these, and showing results the
 * moment they type the first letters makes the form feel immediate. The
 * network search still runs and merges in anything else.
 */
export const POPULAR_PLACES: PlaceResult[] = [
  place('Mumbai', 'Maharashtra', 19.076, 72.8777),
  place('Delhi', 'Delhi', 28.6139, 77.209),
  place('Bengaluru', 'Karnataka', 12.9716, 77.5946),
  place('Kolkata', 'West Bengal', 22.5726, 88.3639),
  place('Chennai', 'Tamil Nadu', 13.0827, 80.2707),
  place('Hyderabad', 'Telangana', 17.385, 78.4867),
  place('Pune', 'Maharashtra', 18.5204, 73.8567),
  place('Ahmedabad', 'Gujarat', 23.0225, 72.5714),
  place('Jaipur', 'Rajasthan', 26.9124, 75.7873),
  place('Lucknow', 'Uttar Pradesh', 26.8467, 80.9462),
  place('Bhubaneswar', 'Odisha', 20.2961, 85.8245),
  place('Guwahati', 'Assam', 26.1445, 91.7362),
  place('Patna', 'Bihar', 25.5941, 85.1376),
  place('Varanasi', 'Uttar Pradesh', 25.3176, 82.9739),
  place('Siliguri', 'West Bengal', 26.7271, 88.3953),
  place('Durgapur', 'West Bengal', 23.5204, 87.3119),
];

function place(
  name: string,
  admin1: string,
  latitude: number,
  longitude: number,
): PlaceResult {
  return {
    id: `in-${name.toLowerCase()}`,
    name,
    label: `${name}, ${admin1}, India`,
    latitude,
    longitude,
    timezone: 'Asia/Kolkata',
    country: 'India',
    countryCode: 'IN',
    admin1,
  };
}

/** Filter the built-in list by prefix, for instant local suggestions. */
export function matchPopularPlaces(query: string): PlaceResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return POPULAR_PLACES.filter(
    (p) => p.name.toLowerCase().startsWith(q) || p.label.toLowerCase().includes(q),
  ).slice(0, 5);
}
