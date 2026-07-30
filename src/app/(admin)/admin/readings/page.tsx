import { createClient } from '@/lib/supabase/server';
import { ReadingReview } from '@/components/admin/ReadingReview';
import { narrationConfigured } from '@/lib/predictions/narrate';
import type { Reading } from '@/lib/supabase/types';

export const metadata = { title: 'Readings', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminReadings() {
  const supabase = await createClient();

  const [{ data: pendingRows }, { data: recentRows }] = await Promise.all([
    supabase
      .from('readings')
      .select('*')
      .eq('state', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('readings')
      .select('*')
      .neq('state', 'pending')
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  const pending = (pendingRows as Reading[] | null) ?? [];
  const recent = (recentRows as Reading[] | null) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
        Readings
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Daily and weekly readings that pass the safety filter publish on their
        own. Monthly and yearly ones always wait here, and anything the filter
        objected to waits here whatever its length.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        The decision is made in the database, not in the site code, so a bug in
        a page cannot release something you have not seen.
      </p>

      {!narrationConfigured() && (
        <p
          className="mt-6 max-w-2xl rounded-lg border-l-2 py-3 pl-4 pr-3 text-sm"
          style={{ borderColor: 'var(--color-gold-600)', color: 'var(--text-secondary)' }}
        >
          No writer is configured, so nothing is being generated. Set
          GEMINI_API_KEY and readings will start appearing here.
        </p>
      )}

      <section className="mt-9">
        <h2 className="eyebrow">Waiting for you ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="surface-card mt-4 p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Nothing waiting.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pending.map((reading) => (
              <ReadingReview key={reading.id} reading={reading} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-12">
          <h2 className="eyebrow">Recently decided</h2>
          <ul className="mt-4 space-y-2">
            {recent.map((reading) => (
              <li
                key={reading.id}
                className="surface-card flex flex-wrap items-baseline justify-between gap-3 p-4 text-sm"
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  {reading.period} · {reading.period_start}
                  {reading.edited && (
                    <span style={{ color: 'var(--text-muted)' }}> · edited by you</span>
                  )}
                </span>
                <span
                  className="text-xs uppercase tracking-[0.14em]"
                  style={{
                    color:
                      reading.state === 'published'
                        ? 'var(--color-benefic)'
                        : 'var(--text-muted)',
                  }}
                >
                  {reading.state}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
