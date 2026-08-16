import { createClient } from '@/lib/supabase/server';
import { NAKSHATRA_NAMES, RASHI_NAMES_EN } from '@/lib/astro/constants';

export const metadata = { title: 'Research', robots: { index: false } };
export const dynamic = 'force-dynamic';

interface Tally {
  key: number | string;
  count: number;
}

/**
 * The research dataset, summarised.
 *
 * Deliberately shows distributions rather than a list of records. A table of
 * individual charts invites treating the set as a customer list, which is
 * precisely what it is not: the rows are pseudonymous and there is nothing to
 * look up a person by. Aggregate questions are also the ones actually worth
 * asking of it.
 */
export default async function AdminResearch() {
  const supabase = await createClient();

  const [
    { count },
    ascendants,
    nakshatras,
    dashas,
    yogas,
    doshas,
    kalsarpaTypes,
    manglik,
    consenting,
  ] = await Promise.all([
    supabase.from('research_charts').select('*', { count: 'exact', head: true }),
    tally(supabase, 'ascendant_rashi'),
    tally(supabase, 'moon_nakshatra'),
    tally(supabase, 'birth_dasha_lord'),
    arrayTally(supabase, 'yogas'),
    arrayTally(supabase, 'doshas'),
    tally(supabase, 'kalsarpa_type'),
    supabase
      .from('research_charts')
      .select('*', { count: 'exact', head: true })
      .eq('manglik', true),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('research_consent', true),
  ]);

  const total = count ?? 0;
  const manglikCount = manglik.count ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
        Research
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Charts contributed by people who explicitly opted in. No names, no
        emails, no exact birthplaces. Withdrawing consent deletes a
        contribution immediately, enforced in the database rather than in code.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Charts in the set" value={total} />
        <Stat label="People opted in" value={consenting.count ?? 0} />
        <Stat
          label="Manglik"
          value={total > 0 ? `${Math.round((manglikCount / total) * 100)}%` : '0%'}
        />
        <Stat label="Export" value="CSV" href="/api/admin/research" />
      </div>

      {total === 0 ? (
        <p className="surface-card mt-8 p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          Nothing contributed yet. Charts appear here once account holders opt
          in from their dashboard and save a chart.
        </p>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <Distribution
            title="Ascendant"
            rows={ascendants}
            total={total}
            label={(k) => RASHI_NAMES_EN[Number(k)]}
          />
          <Distribution
            title="Moon nakshatra"
            rows={nakshatras}
            total={total}
            label={(k) => NAKSHATRA_NAMES[Number(k)]}
          />
          <Distribution
            title="Dasha at birth"
            rows={dashas}
            total={total}
            label={(k) => String(k)}
          />
          <Distribution title="Yogas" rows={yogas} total={total} label={(k) => String(k)} />
          <Distribution title="Afflictions" rows={doshas} total={total} label={(k) => String(k)} />
          <Distribution
            title="Kalsarpa form"
            rows={kalsarpaTypes}
            total={total}
            label={(k) => String(k)}
          />
        </div>
      )}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        For anything beyond these summaries, export the CSV. Every graha
        position, dignity, house and divisional placement is included, so the
        set can be taken into a spreadsheet or a notebook and questioned
        properly.
      </p>
    </div>
  );
}

async function tally(
  supabase: Awaited<ReturnType<typeof createClient>>,
  column: string,
): Promise<Tally[]> {
  // The dataset is small enough that counting in the application is simpler
  // and cheaper than adding a database function for each column.
  const { data } = await supabase.from('research_charts').select(column).limit(5000);
  if (!data) return [];

  const counts = new Map<number | string, number>();
  for (const row of data as unknown as Record<string, number | string>[]) {
    const value = row[column];
    if (value === null || value === undefined) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Tally a text array column.
 *
 * Counts charts, not entries: a chart carrying a yoga twice still counts once,
 * so a percentage means "this share of charts have it" rather than something
 * that can exceed a hundred.
 */
async function arrayTally(
  supabase: Awaited<ReturnType<typeof createClient>>,
  column: string,
): Promise<Tally[]> {
  const { data } = await supabase.from('research_charts').select(column).limit(5000);
  if (!data) return [];

  const counts = new Map<string, number>();
  for (const row of data as unknown as Record<string, string[] | null>[]) {
    for (const value of new Set(row[column] ?? [])) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[0.65rem] uppercase tracking-[0.16em]" style={{ color: 'var(--color-gold-600)' }}>
        {label}
      </p>
      <p className="font-display mt-1.5 text-3xl" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </>
  );

  return href ? (
    <a href={href} className="surface-card block p-4">
      {body}
    </a>
  ) : (
    <div className="surface-card p-4">{body}</div>
  );
}

function Distribution({
  title,
  rows,
  total,
  label,
}: {
  title: string;
  rows: Tally[];
  total: number;
  label: (key: number | string) => string;
}) {
  const max = rows[0]?.count ?? 1;

  return (
    <div>
      <h2 className="eyebrow">{title}</h2>
      <ul className="mt-4 space-y-2">
        {rows.slice(0, 12).map((row) => (
          <li key={String(row.key)}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{label(row.key)}</span>
              <span className="tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
                {row.count} ({Math.round((row.count / total) * 100)}%)
              </span>
            </div>
            <div
              className="mt-1 h-1 w-full overflow-hidden rounded-full"
              style={{ background: 'var(--border-subtle)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(row.count / max) * 100}%`,
                  background: 'linear-gradient(90deg, var(--color-gold-600), var(--color-gold-300))',
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
