import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import type { Service } from '@/lib/supabase/types';

export const metadata = { title: 'Services', robots: { index: false } };

export default async function AdminServices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });

  const services = (data as Service[] | null) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
            Services
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            What you offer, and what it costs in each region.
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{
            background: 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
            color: '#160f00',
          }}
        >
          Add service
        </Link>
      </div>

      {services.length === 0 ? (
        <p className="surface-card p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          Nothing here yet. Add your first service to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {services.map((service) => (
            <li key={service.id}>
              <Link
                href={`/admin/services/${service.id}`}
                className="surface-card flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate" style={{ color: 'var(--text-primary)' }}>
                    {service.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                    /{service.slug}
                    {service.duration_minutes ? ` · ${service.duration_minutes} min` : ''}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-wider"
                  style={{
                    background: service.is_active
                      ? 'color-mix(in oklab, var(--color-benefic) 14%, transparent)'
                      : 'color-mix(in oklab, var(--text-muted) 14%, transparent)',
                    color: service.is_active ? 'var(--color-benefic)' : 'var(--text-muted)',
                  }}
                >
                  {service.is_active ? 'Live' : 'Hidden'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
