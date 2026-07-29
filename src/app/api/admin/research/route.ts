import { createClient, isAdmin } from '@/lib/supabase/server';

/**
 * Research export.
 *
 * One row per contributed chart, flattened so it opens straight into a
 * spreadsheet. The nine graha positions are expanded into their own columns,
 * because a JSON blob in a cell is not something anyone can filter or pivot.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return new Response('Not authorised', { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('research_charts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50_000);

  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []) as Record<string, unknown>[];

  const base = [
    'id', 'birth_year', 'birth_month', 'birth_day', 'birth_hour', 'birth_minute',
    'birth_time_known', 'timezone', 'utc_offset_minutes', 'latitude', 'longitude',
    'place_country', 'gender', 'ascendant_rashi', 'ascendant_degree',
    'ascendant_nakshatra', 'sun_rashi', 'moon_rashi', 'moon_nakshatra', 'moon_pada',
    'birth_dasha_lord', 'yogas', 'ayanamsa', 'house_system', 'node_type',
    'engine_version', 'source', 'created_at',
  ];

  const grahas = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];
  const grahaColumns = grahas.flatMap((g) => [
    `${g}_lon`, `${g}_rashi`, `${g}_house`, `${g}_nakshatra`, `${g}_dignity`, `${g}_retro`,
  ]);

  const header = [...base, ...grahaColumns];
  const lines = [header.join(',')];

  for (const row of rows) {
    const planets = (row.planets as { g: string }[] | null) ?? [];
    const byAbbr = new Map(planets.map((p) => [p.g, p as Record<string, unknown>]));

    const values = base.map((key) => csvCell(row[key]));

    for (const g of grahas) {
      const p = byAbbr.get(g);
      values.push(
        csvCell(p?.lon), csvCell(p?.rashi), csvCell(p?.house),
        csvCell(p?.nak), csvCell(p?.dignity), csvCell(p?.retro),
      );
    }

    lines.push(values.join(','));
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="research-charts-${stamp}.csv"`,
      // Never cached: it is private data and it changes as people contribute.
      'Cache-Control': 'no-store',
    },
  });
}

/** Quote a value for CSV, escaping embedded quotes. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join(' ') : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
