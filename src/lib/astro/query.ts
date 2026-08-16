import { z } from 'zod';

import type { AyanamsaName, BirthData, ChartSettings, HouseSystem } from './types';

/**
 * Birth details encoded in the URL.
 *
 * Charts are computed on the server from query parameters rather than posted
 * to an endpoint, which means every result has a shareable, bookmarkable
 * address, renders without JavaScript, and can be indexed.
 */

export const birthQuerySchema = z.object({
  /** ISO date, YYYY-MM-DD. */
  d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date as YYYY-MM-DD'),
  /** 24-hour local time, HH:MM. */
  t: z.string().regex(/^\d{2}:\d{2}$/, 'Enter a time as HH:MM').default('12:00'),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  tz: z.string().optional(),
  place: z.string().default('Unknown place'),
  name: z.string().optional(),
  /** Birth time not known, the chart is cast but flagged throughout. */
  unknown: z.coerce.boolean().optional(),
  ay: z
    .enum([
      'lahiri',
      'lahiri_1940',
      'true_chitra',
      'raman',
      'kp',
      'yukteshwar',
      'pushya_paksha',
      'true_pushya',
      'tropical',
    ])
    .default('lahiri'),
  hs: z
    .enum(['whole_sign', 'equal', 'sripati', 'placidus', 'koch', 'campanus'])
    .default('whole_sign'),
  node: z.enum(['mean', 'true']).default('mean'),
});

export type BirthQuery = z.infer<typeof birthQuerySchema>;

export interface ParsedBirthQuery {
  birth: BirthData;
  settings: ChartSettings;
  displayName?: string;
}

/** Parse URL search params into engine inputs. Throws on invalid input. */
export function parseBirthQuery(
  params: Record<string, string | string[] | undefined>,
): ParsedBirthQuery {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    flat[key] = Array.isArray(value) ? value[0] : value;
  }

  const q = birthQuerySchema.parse(flat);

  const [year, month, day] = q.d.split('-').map(Number);
  const [hour, minute] = q.t.split(':').map(Number);

  return {
    birth: {
      year,
      month,
      day,
      hour,
      minute,
      timeUnknown: q.unknown ?? false,
      place: {
        name: q.place,
        latitude: q.lat,
        longitude: q.lon,
        timezone: q.tz,
      },
    },
    settings: {
      ayanamsa: q.ay as AyanamsaName,
      houseSystem: q.hs as HouseSystem,
      nodeType: q.node,
      includeOuter: false,
    },
    displayName: q.name,
  };
}

/** True when enough parameters are present to attempt a chart. */
export function hasBirthQuery(
  params: Record<string, string | string[] | undefined>,
): boolean {
  return Boolean(params.d && params.lat && params.lon);
}

/** Build the query string for a chart, for links and form submission. */
export function toBirthQueryString(input: {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  place: string;
  name?: string;
  timeUnknown?: boolean;
  ayanamsa?: AyanamsaName;
  houseSystem?: HouseSystem;
}): string {
  const p = new URLSearchParams();
  p.set('d', input.date);
  p.set('t', input.time);
  p.set('lat', input.latitude.toFixed(4));
  p.set('lon', input.longitude.toFixed(4));
  if (input.timezone) p.set('tz', input.timezone);
  p.set('place', input.place);
  if (input.name) p.set('name', input.name);
  if (input.timeUnknown) p.set('unknown', '1');
  if (input.ayanamsa && input.ayanamsa !== 'lahiri') p.set('ay', input.ayanamsa);
  if (input.houseSystem && input.houseSystem !== 'whole_sign') {
    p.set('hs', input.houseSystem);
  }
  return p.toString();
}
