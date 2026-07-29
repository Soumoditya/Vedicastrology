import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Admin', robots: { index: false } };

export default async function AdminHome() {
  const supabase = await createClient();

  // Counts only — head:true skips fetching the rows themselves.
  const [services, regions, posts, testimonials, enquiries] = await Promise.all([
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('regions').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase
      .from('testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('enquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
        Overview
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Everything on the site is edited from here.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat href="/admin/services" label="Services" value={services.count ?? 0} />
        <Stat href="/admin/regions" label="Pricing regions" value={regions.count ?? 0} />
        <Stat href="/admin/posts" label="Journal posts" value={posts.count ?? 0} />
        <Stat
          href="/admin/testimonials"
          label="Testimonials awaiting review"
          value={testimonials.count ?? 0}
          highlight={(testimonials.count ?? 0) > 0}
        />
        <Stat
          href="/admin/enquiries"
          label="New enquiries"
          value={enquiries.count ?? 0}
          highlight={(enquiries.count ?? 0) > 0}
        />
      </div>

      {(services.count ?? 0) === 0 && (
        <div className="surface-card mt-8 p-5">
          <h2 className="font-display text-lg" style={{ color: 'var(--color-gold-200)' }}>
            Start here
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            You have no services yet. Add one, then set its price for each region
            you sell in. India and International are set up already — add more
            from the Regions screen whenever you need them.
          </p>
          <Link
            href="/admin/services/new"
            className="mt-4 inline-block rounded-lg px-5 py-2.5 text-sm font-medium"
            style={{
              background:
                'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-600))',
              color: '#160f00',
            }}
          >
            Add your first service
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({
  href,
  label,
  value,
  highlight,
}: {
  href: string;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="surface-card block p-4 transition-colors"
      style={highlight ? { borderColor: 'var(--border-strong)' } : undefined}
    >
      <p
        className="text-[0.65rem] uppercase tracking-[0.16em]"
        style={{ color: highlight ? 'var(--color-saffron-400)' : 'var(--color-gold-600)' }}
      >
        {label}
      </p>
      <p className="font-display mt-1.5 text-3xl" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </Link>
  );
}
