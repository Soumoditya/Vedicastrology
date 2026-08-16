import { NextResponse } from 'next/server';

import { matchPopularPlaces, searchPlaces } from '@/lib/geo/geocode';

/**
 * Place autocomplete.
 *
 * The built-in city list answers instantly and is merged ahead of the network
 * results, so the field responds on the first keystroke even on a slow
 * connection. Duplicates are removed by name and rough coordinate.
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const local = matchPopularPlaces(query);

  try {
    const remote = await searchPlaces(query);

    const seen = new Set(
      local.map((p) => `${p.name.toLowerCase()}:${p.latitude.toFixed(1)}`),
    );
    const merged = [...local];

    for (const p of remote) {
      const key = `${p.name.toLowerCase()}:${p.latitude.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(p);
    }

    return NextResponse.json({ results: merged.slice(0, 10) });
  } catch {
    // A geocoding outage should degrade to the built-in list, not break the
    // form, the visitor can still find any major Indian city.
    return NextResponse.json({ results: local, degraded: true });
  }
}
