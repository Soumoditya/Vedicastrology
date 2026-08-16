import { createClient } from '@/lib/supabase/server';
import { deleteRegion } from '@/lib/admin/actions';
import { RegionEditor } from '@/components/admin/RegionEditor';
import type { Region } from '@/lib/supabase/types';

export const metadata = { title: 'Regions & currencies', robots: { index: false } };

export default async function AdminRegions() {
  const supabase = await createClient();
  const { data } = await supabase.from('regions').select('*').order('sort_order');
  const regions = (data as Region[] | null) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
        Regions &amp; currencies
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Each region has its own currency and its own price for every service.
        Visitors are matched to a region by the country they browse from, and
        can switch currency themselves at any time.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Add as many as you like, a region is just a row here, so selling in a
        new market never needs a code change.
      </p>

      <ul className="mt-7 space-y-3">
        {regions.map((region) => (
          <li key={region.id} className="surface-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>
                  {region.name}
                  <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {region.symbol} {region.currency}
                  </span>
                </h2>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {region.country_codes.length > 0
                    ? region.country_codes.join(', ')
                    : 'Catch-all, everyone not matched by another region'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {region.is_default && (
                  <span
                    className="rounded px-2 py-0.5 text-[0.6rem] uppercase tracking-wider"
                    style={{
                      background: 'color-mix(in oklab, var(--color-gold-500) 14%, transparent)',
                      color: 'var(--color-gold-300)',
                    }}
                  >
                    Fallback
                  </span>
                )}
                <RegionEditor region={region} />
                {/* The fallback region cannot be removed: without it a visitor
                    whose country matches nothing would see no price at all. */}
                {!region.is_default && (
                  <form action={deleteRegion}>
                    <input type="hidden" name="id" value={region.id} />
                    <button
                      type="submit"
                      className="text-xs underline underline-offset-4"
                      style={{ color: 'var(--color-malefic)' }}
                    >
                      Remove
                    </button>
                  </form>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="surface-card mt-8 p-5">
        <h2 className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
          Add a region
        </h2>
        <RegionEditor />
      </div>
    </div>
  );
}
