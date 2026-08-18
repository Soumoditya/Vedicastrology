import Link from 'next/link';

import { getUser, createClient } from '@/lib/supabase/server';
import { toBirthQueryString } from '@/lib/astro/query';
import { getT } from '@/lib/i18n/server';
import type { BirthProfile } from '@/lib/supabase/types';

/**
 * Your saved charts, one tap away.
 *
 * Shown above the blank form on every tool. Somebody who has saved a chart
 * should never type their birth details again, and having to was the complaint.
 *
 * Renders nothing at all when signed out or when there is nothing saved, so it
 * costs an empty space on the pages where it has nothing to offer.
 */
export async function SavedChartPicker({ action }: { action: string }) {
  const user = await getUser();
  if (!user) return null;

  const { t } = await getT();
  const supabase = await createClient();
  const { data } = await supabase
    .from('birth_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at')
    .limit(8);

  const charts = (data as BirthProfile[] | null) ?? [];
  if (charts.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {charts.length === 1 ? t('chart.savedChart') : t('chart.savedCharts')}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {charts.map((chart) => (
          <Link
            key={chart.id}
            href={`${action}?${toBirthQueryString({
              date: chart.birth_date,
              // Noon when the time was never known, matching how the chart is
              // cast everywhere else.
              time: (chart.birth_time ?? '12:00').slice(0, 5),
              latitude: chart.latitude,
              longitude: chart.longitude,
              timezone: chart.timezone,
              place: chart.place_name,
              name: chart.person_name ?? chart.label,
              timeUnknown: chart.time_unknown,
            })}`}
            className="rounded-full px-3.5 py-1.5 text-xs transition-colors duration-300"
            style={{
              background: 'color-mix(in oklab, var(--color-gold-500) 12%, transparent)',
              color: 'var(--color-gold-200)',
            }}
          >
            {chart.label}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {t('chart.orEnterDetails')}
      </p>
    </div>
  );
}
